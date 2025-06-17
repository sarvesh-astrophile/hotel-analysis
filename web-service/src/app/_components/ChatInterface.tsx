import React, { useState, useRef, type KeyboardEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Check,
  ChevronDown,
  Paperclip,
  History,
  Play,
  Search,
  Send,
  ChartNoAxesColumnIncreasing,
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";
import MessageContent from "./MessageContent";
import { ThoughtProcess, type ThoughtStep } from "./ThoughtProcess";
import { v4 as uuidv4 } from "uuid";
import AnalyticsComponent from "./AnalyticsComponent";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "error";
  content: string;
  showDots?: boolean;
  responseTime?: number;
  thoughtSteps?: ThoughtStep[];
  isThinking?: boolean;
}

interface ChatInterfaceProps {
  analyticsDashboard: React.ReactNode;
}

const ChatInterface = ({ analyticsDashboard }: ChatInterfaceProps) => {
  const [activeTab, setActiveTab] = useState<"search" | "analytics">("search");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isApiLoading, setIsApiLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async () => {
    const currentInput = inputValue.trim();
    if (!currentInput || isApiLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: currentInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    inputRef.current?.focus();

    if (activeTab === "search") {
      setIsApiLoading(true);
      const thoughtProcessId = uuidv4();

      // Add a system message placeholder for the thought process
      const thoughtProcessMessage: Message = {
        id: thoughtProcessId,
        role: "system",
        content: "thought-process",
        thoughtSteps: [],
        isThinking: true,
      };
      setMessages((prev) => [...prev, thoughtProcessMessage]);

      try {
        const response = await fetch(
          `/api/chat?query=${encodeURIComponent(currentInput)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("The response does not contain a body.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              setMessages((prev) =>
                prev.map((msg) => {
                  if (
                    msg.id === thoughtProcessId &&
                    msg.content === "thought-process"
                  ) {
                    return {
                      ...msg,
                      isThinking: false,
                      thoughtSteps: msg.thoughtSteps?.map((s) => ({
                        ...s,
                        status: "completed",
                      })),
                    };
                  }
                  return msg;
                })
              );
              setIsApiLoading(false);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (line.trim() === "") continue;

              try {
                const data = JSON.parse(line);

                if (data.type === "thought") {
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id === thoughtProcessId) {
                        const existingSteps = msg.thoughtSteps || [];
                        const updatedSteps = [
                          ...existingSteps.map((s) => ({
                            ...s,
                            status: "completed" as const,
                          })),
                          {
                            id: uuidv4(),
                            type: "thought" as const,
                            content: data.content,
                            status: "active" as const,
                          },
                        ];
                        return { ...msg, thoughtSteps: updatedSteps };
                      }
                      return msg;
                    })
                  );
                } else if (data.type === "result") {
                  const assistantMessage: Message = {
                    id: uuidv4(),
                    role: "assistant",
                    content: data.content,
                  };
                  setMessages((prev) => [...prev, assistantMessage]);
                }
              } catch (e) {
                console.error("Failed to parse stream line:", line, e);
              }
            }
          }
        };

        processStream().catch((error) => {
          console.error("Stream processing failed:", error);
          const errorMessage: Message = {
            id: uuidv4(),
            role: "error",
            content:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred during stream processing.",
          };
          setMessages((prev) => [
            ...prev.filter((msg) => msg.id !== thoughtProcessId),
            errorMessage,
          ]);
          setIsApiLoading(false);
        });
      } catch (error) {
        console.error("API call failed:", error);
        const errorMessage: Message = {
          id: uuidv4(),
          role: "error",
          content:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        };
        // Remove the placeholder before adding the error
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== thoughtProcessId),
          errorMessage,
        ]);
        setIsApiLoading(false);
      }
    } else {
      console.log("Non-search message sent:", currentInput);
      setTimeout(() => {
        const placeholderMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: `Analytics response for: "${currentInput}" (Placeholder)`,
        };
        setMessages((prev) => [...prev, placeholderMessage]);
      }, 1000);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex h-screen bg-background text-foreground mx-auto`}>
      <div
        className={`flex-1 ${
          messages.length === 0 && activeTab === "search"
            ? "flex items-center justify-center"
            : "flex flex-col h-full relative mx-auto"
        }`}
      >
        {activeTab === "analytics" ? (
          <div className="absolute inset-x-0 top-0 bottom-[140px] overflow-y-auto py-6 px-4 sm:px-6 md:px-8">
            <div className="max-w-3xl mx-auto">{analyticsDashboard}</div>
          </div>
        ) : (
          messages.length > 0 && (
            <div className="absolute inset-x-0 top-0 bottom-[140px] overflow-y-auto py-6 px-4 sm:px-6 md:px-8">
              <div className="pb-4">
                {messages.map((message) => (
                  <div key={message.id} className="mb-6 max-w-3xl mx-auto">
                    {message.role === "user" && (
                      <div className="flex items-start gap-3 mb-8">
                        <Avatar className="h-8 w-8 bg-gray-200 text-gray-600">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-gray-800 text-base">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {message.role === "system" &&
                      message.content === "thought-process" && (
                        <div className="mb-4">
                          <ThoughtProcess
                            steps={message.thoughtSteps || []}
                            isComplete={!message.isThinking}
                          />
                        </div>
                      )}

                    {message.role === "assistant" && (
                      <div className="flex gap-3">
                        <Avatar className="h-8 w-8 mt-1 bg-gray-100">
                          <AvatarFallback className="text-sm text-gray-500">
                            AI
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <MessageContent content={message.content} />
                        </div>
                      </div>
                    )}

                    {message.role === "error" && (
                      <div className="flex items-center gap-3 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-700 text-sm">
                          {message.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        <div
          className={`${
            messages.length > 0 || activeTab === "analytics"
              ? "absolute bottom-0 left-0 right-0 mx-auto"
              : ""
          }
             bg-transparent p-4 sm:p-6 md:p-8 w-full ${
               messages.length === 0 ? "max-w-2xl" : "max-w-3xl"
             }`}
        >
          <Card className="rounded-2xl overflow-hidden border border-gray-300 shadow-sm py-0 w-full">
            <CardContent className="p-0">
              <div className="p-3">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    activeTab === "analytics"
                      ? "Analytics are shown. Switch to Search to ask questions."
                      : isApiLoading
                      ? "Waiting for response..."
                      : "Ask a question..."
                  }
                  className="border-0 shadow-none focus-visible:ring-0 text-base px-0 disabled:opacity-50"
                  disabled={isApiLoading || activeTab === "analytics"}
                />
              </div>
            </CardContent>
            <CardFooter className="py-2 px-3 flex justify-between items-center">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveTab("analytics")}
                  className={`gap-1 text-xs h-7 px-2 rounded-md ${
                    activeTab === "analytics"
                      ? "bg-white text-orange-700 shadow-sm hover:bg-white hover:text-orange-900"
                      : "text-gray-500 hover:text-gray-700 "
                  }`}
                  disabled={isApiLoading}
                >
                  <ChartNoAxesColumnIncreasing className="h-3 w-3" />
                  Analytics
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setActiveTab("search")}
                  className={`gap-1 text-xs h-7 px-2 rounded-md ${
                    activeTab === "search"
                      ? "bg-white text-blue-700 shadow-sm hover:bg-white hover:text-blue-900"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  disabled={isApiLoading}
                >
                  <Search className="h-3 w-3" />
                  Search
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-full h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      disabled={isApiLoading}
                    >
                      <History className="size-5" />
                    </Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm mb-2">
                        Chat History
                      </h4>
                      <button
                        className="block w-full text-left text-sm hover:bg-gray-100 rounded p-1"
                        onClick={() => console.log("Load chat: Chat about o1")}
                      >
                        Chat about o1
                      </button>
                      <button
                        className="block w-full text-left text-sm hover:bg-gray-100 rounded p-1"
                        onClick={() =>
                          console.log("Load chat: Planning session")
                        }
                      >
                        Planning session
                      </button>
                      <button
                        className="block w-full text-left text-sm hover:bg-gray-100 rounded p-1"
                        onClick={() => console.log("Load chat: API discussion")}
                      >
                        API discussion
                      </button>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSendMessage}
                  className="rounded-full h-8 w-8 p-0 text-white hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isApiLoading || !inputValue.trim()}
                >
                  {isApiLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
