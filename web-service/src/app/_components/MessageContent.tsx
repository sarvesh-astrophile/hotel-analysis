import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MessageContentProps {
  content: string;
}

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
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
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

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const codeBlockRegex = /```(\w+)\n([\s\S]*?)```(?:<end_code>)?/;
  const match = content.match(codeBlockRegex);

  if (match && match[1] && typeof match[2] === "string") {
    const language = match[1];
    const code = match[2];
    const textBefore = content.substring(0, match.index).trim();

    return (
      <div className="prose prose-sm text-gray-800 space-y-4 max-w-2xl">
        {textBefore && <p>{textBefore}</p>}
        <CodeBlock language={language} code={code} />
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-2xl text-gray-800 mx-auto">
      {content.split("\n\n").map((paragraph, idx) => {
        if (paragraph.startsWith("Key Features")) {
          return (
            <h3
              key={idx}
              className="font-semibold mt-4 text-gray-800 text-base"
            >
              {paragraph}
            </h3>
          );
        } else if (/^\d+\./.test(paragraph)) {
          // For numbered points
          const match = paragraph.match(/^(\d+)\.\s+(.*?):\s+(.*)/);
          if (match) {
            return (
              <div key={idx} className="mt-4 max-w-2xl">
                <p className="text-gray-800">
                  <strong className="font-semibold">
                    {match[1]}. {match[2]}:
                  </strong>{" "}
                  {match[3]}
                </p>
              </div>
            );
          }
        } else if (paragraph.includes("•")) {
          // For bullet points
          return (
            <ul
              key={idx}
              className="list-disc pl-6 mt-2 text-gray-800 max-w-2xl"
            >
              {paragraph
                .split("•")
                .filter(Boolean)
                .map((item, i) => (
                  <li key={i} className="mb-1">
                    {item.trim()}
                  </li>
                ))}
            </ul>
          );
        }
        return (
          <p key={idx} className="mt-2 text-gray-800 max-w-2xl">
            {paragraph}
          </p>
        );
      })}
    </div>
  );
};

export default MessageContent;
