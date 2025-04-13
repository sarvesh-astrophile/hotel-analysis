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
import { DeepSearchComponent } from "./deep-search";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/env";

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "error";
  content: string;
  showDots?: boolean;
  responseTime?: number;
}

const ChatInterface = () => {
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
      const startTime = performance.now();

      const deepSearchMessageId = uuidv4();
      const deepSearchMessage: Message = {
        id: deepSearchMessageId,
        role: "system",
        content: "deep-search",
        showDots: true,
      };
      setMessages((prev) => [...prev, deepSearchMessage]);

      try {
        const response = await fetch(`${env.NEXT_PUBLIC_BACKEND_URL}/ask`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query: currentInput }),
        });

        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === deepSearchMessageId
              ? { ...msg, responseTime: duration }
              : msg
          )
        );

        if (!response.ok) {
          let errorContent = `API Error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorContent += ` - ${
              errorData.detail || JSON.stringify(errorData)
            }`;
          } catch (jsonError) {
            errorContent += ` - ${await response.text()}`;
          }
          throw new Error(errorContent);
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: data.result || "No result found.",
        };
        setMessages((prev) => [...prev, assistantMessage]);
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
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
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
          messages.length === 0
            ? "flex items-center justify-center"
            : "flex flex-col h-full relative mx-auto"
        }`}
      >
        {messages.length > 0 && (
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
                    message.content === "deep-search" && (
                      <div className="mb-4">
                        <DeepSearchComponent
                          responseTime={message.responseTime}
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
                      <p className="text-red-700 text-sm">{message.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          className={`${
            messages.length > 0
              ? "absolute bottom-0 left-0 right-0 mx-auto"
              : ""
          }
             bg-transparent p-4 sm:p-6 md:p-8 w-full ${
               messages.length === 0 ? "max-w-3xl" : "max-w-3xl"
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
                    isApiLoading
                      ? "Waiting for response..."
                      : "Ask a question..."
                  }
                  className="border-0 shadow-none focus-visible:ring-0 text-base px-0 disabled:opacity-50"
                  disabled={isApiLoading}
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
                      ? "bg-white text-orange-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
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
                      ? "bg-white text-blue-700 shadow-sm"
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
