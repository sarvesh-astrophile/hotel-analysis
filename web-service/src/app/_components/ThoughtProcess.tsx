"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, LoaderCircle, GitCommitHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface ThoughtStep {
  id: string;
  type: "thought";
  content: string;
  status: "completed" | "active" | "pending";
}

interface ParsedStepContent {
  step: number;
  llmOutput: string;
  toolCall: string;
  observation: string;
}

interface ThoughtProcessProps {
  steps: ThoughtStep[];
  isComplete: boolean;
}

const parseContent = (content: string): ParsedStepContent | null => {
  const stepMatch = content.match(/^Step (\d+):/);
  const step = stepMatch?.[1] ? parseInt(stepMatch[1], 10) : 0;

  const llmOutputMatch = content.match(/LLM Output:(.*?)(\||<end_code>)/s);
  const toolCallMatch = content.match(/Tool Call:(.*?)(\||<end_code>)/s);
  const observationMatch = content.match(/Observation:(.*)/s);

  return {
    step,
    llmOutput: llmOutputMatch?.[1]?.trim() ?? "",
    toolCall: toolCallMatch?.[1]?.trim() ?? "",
    observation: observationMatch?.[1]?.trim() ?? "",
  };
};

const CodeBlock = ({ language, code }: { language: string; code: string }) => (
  <SyntaxHighlighter
    language={language}
    style={vscDarkPlus}
    customStyle={{
      background: "#020817",
      borderRadius: "0.5rem",
      padding: "1rem",
      fontSize: "0.875rem",
      margin: "0",
    }}
    codeTagProps={{
      style: {
        fontFamily: "var(--font-mono)",
      },
    }}
  >
    {code}
  </SyntaxHighlighter>
);
export function ThoughtProcess({ steps, isComplete }: ThoughtProcessProps) {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  useEffect(() => {
    if (steps.length > 0) {
      const activeStep = steps.find((s) => s.status === "active");
      if (activeStep) {
        setActiveStepId(activeStep.id);
      } else {
        const lastStep = steps[steps.length - 1];
        if (lastStep) {
          setActiveStepId(lastStep.id);
        }
      }
    }
  }, [steps]);

  const parsedSteps = useMemo(() => {
    return steps.map((step) => ({
      ...step,
      parsedContent: parseContent(step.content),
    }));
  }, [steps]);

  const activeStep = parsedSteps.find((step) => step.id === activeStepId);

  if (steps.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Thinking...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <p>Waiting for the first step...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full max-h-xl bg-white border rounded-lg overflow-hidden shadow-sm">
      {/* Left panel - Steps */}
      <div className="w-1/3 max-w-xs border-r bg-gray-50/50 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <GitCommitHorizontal className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Steps</h2>
        </div>

        <div className="space-y-1">
          {parsedSteps.map((step) => (
            <button
              key={step.id}
              className={`flex items-center w-full px-3 py-3 text-left rounded-md transition-colors ${
                activeStepId === step.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveStepId(step.id)}
            >
              {isComplete || step.status === "completed" ? (
                <Check className="h-5 w-5 mr-3 text-green-600 flex-shrink-0" />
              ) : step.status === "active" ? (
                <LoaderCircle className="h-5 w-5 mr-3 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 mr-3" />
              )}
              <span className="truncate">
                Step {step.parsedContent?.step || "..."}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right panel - Content */}
      <div className="flex-1 flex flex-col overflow-x-auto">
        <ScrollArea className="">
          <div className="p-2 max-w-lg mx-auto">
            {!activeStep ? (
              <div className="space-y-6">
                <Skeleton className="h-8 w-1/3 bg-gray-200" />
                <Skeleton className="h-20 w-full bg-gray-200" />
                <Skeleton className="h-20 w-full bg-gray-200" />
              </div>
            ) : (
              <Card className="shadow-none border-none">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-gray-900">
                    Step {activeStep.parsedContent?.step}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {activeStep.parsedContent?.llmOutput && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-800">
                        LLM Output
                      </h3>
                      <div className="text-sm text-gray-600 space-y-2 prose prose-sm max-w-none">
                        {activeStep.parsedContent.llmOutput
                          .split("```python")
                          .map((part, index) => {
                            if (index === 0) {
                              return <p key={index}>{part.trim()}</p>;
                            }
                            const codePart = part.split("```")[0];
                            return (
                              <CodeBlock
                                key={index}
                                language="python"
                                code={(codePart ?? "").trim()}
                              />
                            );
                          })}
                      </div>
                    </div>
                  )}
                  {activeStep.parsedContent?.toolCall && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-800">
                        Tool Call
                      </h3>
                      <CodeBlock
                        language="python"
                        code={activeStep.parsedContent.toolCall}
                      />
                    </div>
                  )}
                  {activeStep.parsedContent?.observation && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-gray-800">
                        Observation
                      </h3>
                      <div className="text-sm bg-gray-50 p-3 rounded-md border text-gray-700 whitespace-pre-wrap">
                        {activeStep.parsedContent.observation}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
