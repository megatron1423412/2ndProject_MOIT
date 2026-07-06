import React from "react";
import { Sparkles } from "lucide-react";

interface ChatMessageProps {
  sender: "ai" | "user";
  text?: string;
  timestamp?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export default function ChatMessage({
  sender,
  text,
  timestamp,
  isLoading = false,
  children,
}: ChatMessageProps) {
  const isAi = sender === "ai";

  return (
    <div className={`flex gap-3 max-w-[85%] ${isAi ? "self-start" : "self-end flex-row-reverse"}`}>
      {/* Avatar for AI */}
      {isAi && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-emerald-100"
          style={{ background: "linear-gradient(135deg, #1B3A5C, #00B87A)" }}
        >
          <Sparkles size={14} className="animate-pulse" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className="flex flex-col gap-1">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm border transition-all ${
            isAi
              ? "bg-card text-foreground border-border rounded-tl-sm"
              : "bg-primary text-white border-primary/10 rounded-tr-sm"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <>
              {text && <p className="whitespace-pre-wrap">{text}</p>}
              {children && <div className={text ? "mt-3" : ""}>{children}</div>}
            </>
          )}
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span className={`text-[10px] text-muted-foreground px-1 ${!isAi ? "text-right" : ""}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
