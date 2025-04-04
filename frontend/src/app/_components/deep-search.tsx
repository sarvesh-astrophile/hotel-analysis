"use client";

import { useState, useEffect } from "react";
import { Check, Circle, LoaderCircle, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

// Define TypeScript interfaces for our data
export interface Step {
  id: string;
  title: string;
  status: "completed" | "active" | "pending";
}

export interface StepContent {
  id: string;
  title: string;
  content: React.ReactNode;
}

export interface SearchResult {
  title: string;
  url: string;
  domain: string;
  iconType?: "lock" | "globe" | null;
}

export interface DeepSearchProps {
  initialSteps?: Step[];
  initialContent?: StepContent[];
  initialSearchResults?: SearchResult[];
  title?: string;
  subtitle?: string;
}

export function DeepSearchComponent({
  initialSteps,
  initialContent,
  initialSearchResults,
  title = "DeepSearch",
  subtitle = "39 Sources",
}: DeepSearchProps) {
  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(true);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [contents, setContents] = useState<StepContent[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Dummy data setup
  useEffect(() => {
    // Simulate initial loading
    setTimeout(() => {
      setIsLoading(false);

      // Default data if not provided
      const defaultSteps: Step[] = initialSteps || [
        { id: "thinking", title: "Thinking", status: "completed" },
        {
          id: "investigating",
          title: "Investigating model purpose",
          status: "active",
        },
        {
          id: "planning",
          title: "Planning fine-tuning process",
          status: "pending",
        },
      ];

      const defaultContents: StepContent[] = initialContent || [
        {
          id: "thinking",
          title: "Thinking",
          content: (
            <div className="space-y-4 mb-6">
              <p>Initial analysis starting...</p>
            </div>
          ),
        },
        {
          id: "investigating",
          title: "Investigating model purpose",
          content: (
            <div className="space-y-4 mb-6">
              <h3 className="text-xl font-medium">
                Investigating model purpose
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  First off, I'm trying to figure out what
                  meta-llama/Prompt-Guard-86M is. It looks like a model for
                  guarding against certain prompts, maybe to catch harmful or
                  unsafe content.
                </li>
                <li>
                  I'm considering whether it's designed to detect or filter out
                  unsafe content, given the name. Let's check if that's
                  accurate.
                </li>
              </ul>

              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4" />
                  <p className="font-medium">
                    Searching for "meta-llama Prompt-Guard-86M model purpose"
                  </p>
                </div>
                <p className="text-sm ml-6 text-gray-600">10 results found</p>
              </div>
            </div>
          ),
        },
        {
          id: "planning",
          title: "Planning fine-tuning process",
          content: (
            <div className="space-y-4 mb-6">
              <h3 className="text-xl font-medium">
                Planning fine-tuning process
              </h3>
              <p>
                This step will outline the process for fine-tuning the model
                based on our findings...
              </p>
            </div>
          ),
        },
      ];

      const defaultSearchResults: SearchResult[] = initialSearchResults || [
        {
          title: "meta-llama/Prompt-Guard-86M · Hugging Face",
          url: "huggingface.co",
          domain: "huggingface.co",
          iconType: "lock",
        },
        {
          title: "meta-llama/Llama-Guard-3-8B · Hugging Face",
          url: "huggingface.co",
          domain: "huggingface.co",
          iconType: "lock",
        },
        {
          title: "meta-llama/Prompt-Guard-86M at main",
          url: "huggingface.co",
          domain: "huggingface.co",
          iconType: "lock",
        },
        {
          title: "meta-llama/Meta-Llama-Guard-2-8B · Hugging Face",
          url: "huggingface.co",
          domain: "huggingface.co",
          iconType: "lock",
        },
        {
          title: "Bypassing Meta's LLaMA Classifier: A Simple ...",
          url: "robustintelligence.com",
          domain: "robustintelligence.com",
          iconType: "globe",
        },
      ];

      setSteps(defaultSteps);
      setContents(defaultContents);
      setSearchResults(defaultSearchResults);
      setActiveStepId(
        defaultSteps.find((step) => step.status === "active")?.id ||
          defaultSteps[0]?.id ||
          null
      );

      // Set search query based on content
      if (
        defaultSteps.find((step) => step.status === "active")?.id ===
        "investigating"
      ) {
        setSearchQuery("meta-llama Prompt-Guard-86M model purpose");
      }

      // Simulate "thinking" process
      setTimeout(() => {
        setIsThinking(false);
      }, 2000);
    }, 2000);
  }, [initialSteps, initialContent, initialSearchResults]);

  // Get the active content
  const activeContent = contents.find((content) => content.id === activeStepId);

  // Handle step click
  const handleStepClick = (stepId: string) => {
    setActiveStepId(stepId);

    // Update search query based on step
    if (stepId === "investigating") {
      setSearchQuery("meta-llama Prompt-Guard-86M model purpose");
    } else {
      setSearchQuery("");
    }
  };

  return (
    <div className="flex h-full max-h-xl bg-white border rounded-lg overflow-hidden shadow-sm">
      {/* Left panel - Steps */}
      <div className="w-1/3 max-w-xs border-r bg-gray-50 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">{subtitle}</p>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full bg-gray-200" />
            <Skeleton className="h-8 w-full bg-gray-200" />
            <Skeleton className="h-8 w-full bg-gray-200" />
          </div>
        ) : (
          <div className="space-y-1">
            {steps.map((step) => (
              <button
                key={step.id}
                className={`flex items-center w-full px-3 py-3 text-left rounded-md transition-colors ${
                  activeStepId === step.id
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                onClick={() => handleStepClick(step.id)}
              >
                {step.status === "completed" ? (
                  <Check className="h-5 w-5 mr-2 text-green-600" />
                ) : step.status === "active" ? (
                  <LoaderCircle className="h-5 w-5 mr-2 text-blue-600 animate-spin" />
                ) : (
                  <Circle className="h-5 w-5 mr-2 text-gray-400" />
                )}
                <span
                  className={`${activeStepId === step.id ? "font-medium" : ""}`}
                >
                  {step.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right panel - Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <ScrollArea className="flex-1 h-full">
          <div className="p-6">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-8 w-1/3 bg-gray-200" />
                <Skeleton className="h-20 w-full bg-gray-200" />
                <Skeleton className="h-20 w-full bg-gray-200" />
              </div>
            ) : isThinking && activeStepId === "thinking" ? (
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Thinking
                </h2>
                <div className="animate-pulse flex space-x-2">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
            ) : (
              <div>
                {activeContent && (
                  <>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                      {activeContent.title}
                    </h2>
                    {activeContent.content}

                    {/* Search results */}
                    {searchQuery && activeStepId === "investigating" && (
                      <div className="mt-8 space-y-3">
                        {searchResults.map((result, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {result.iconType === "lock" ? (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
                                      fill="currentColor"
                                    />
                                    <path
                                      d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              ) : (
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                                      fill="currentColor"
                                    />
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {result.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {result.domain}
                              </div>
                            </div>
                          </div>
                        ))}

                        <button className="text-sm text-blue-600 hover:underline mt-2">
                          See more (5)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
