import React from "react";
import { Sparkles } from "lucide-react";

interface ChatMessageProps {
  sender: "ai" | "user";
  text?: string;
  timestamp?: string;
  children?: React.ReactNode;
}

export default function ChatMessage({ sender, text, timestamp, children }: ChatMessageProps) {
  const isAi = sender === "ai";

  return (
    <div className={`flex max-w-[88%] gap-3 ${isAi ? "self-start" : "self-end flex-row-reverse"}`}>
      {isAi && (
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-100 text-white shadow-sm"
          style={{ background: "linear-gradient(135deg, #1B3A5C, #00B87A)" }}
        >
          <Sparkles size={14} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isAi
              ? "rounded-tl-sm border-border bg-card text-foreground"
              : "rounded-tr-sm border-primary/10 bg-primary text-white"
          }`}
        >
          {text && <p className="whitespace-pre-wrap">{text}</p>}
          {children && <div className={text ? "mt-3" : ""}>{children}</div>}
        </div>
        {timestamp && (
          <span className={`px-1 text-[10px] text-muted-foreground ${!isAi ? "text-right" : ""}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
