import React from "react";
import { Sparkles } from "lucide-react";
import ChatFlowInput from "./ChatFlowInput";
import { CHAT_ASSISTANT_AVATAR_WIDTH_CLASS, CHAT_ASSISTANT_RAIL_GAP_CLASS } from "./ChatTimelineRow";
import type { AnswerInputStep, SubmittedFlowAnswer } from "../../../features/chat-flow/core/types";

export interface ChatMessageProps {
  sender: "ai" | "user";
  text?: string;
  timestamp?: string;
  children?: React.ReactNode;
  step?: AnswerInputStep | null;
  completed?: boolean;
  onSubmit?: (answer: SubmittedFlowAnswer) => void;
  onReset?: () => void;
  canUndo?: boolean;
  undoDisabled?: boolean;
  onUndo?: () => void;
}

export default function ChatMessage({
  sender,
  text,
  timestamp,
  children,
  step,
  completed = false,
  onSubmit,
  onReset,
  canUndo = false,
  undoDisabled = false,
  onUndo,
}: ChatMessageProps) {
  const isAi = sender === "ai";

  return (
    <div className={`flex max-w-[88%] ${CHAT_ASSISTANT_RAIL_GAP_CLASS} ${isAi ? "self-start" : "self-end flex-row-reverse"}`} data-chat-turn={isAi ? "assistant" : "user"}>
      {isAi && (
        <div
          className={`flex h-8 ${CHAT_ASSISTANT_AVATAR_WIDTH_CLASS} flex-shrink-0 items-center justify-center rounded-full border border-emerald-100 text-white shadow-sm`}
          style={{ background: "linear-gradient(135deg, #1B3A5C, #00B87A)" }}
          data-chat-assistant-logo
        >
          <Sparkles size={14} />
        </div>
      )}
      <div className="min-w-0 max-w-full flex flex-col gap-1">
        <div className="flex max-w-full items-end gap-2">
          <div
            className={`min-w-0 rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${
              isAi
                ? "rounded-tl-sm border-border bg-card text-foreground"
                : "rounded-tr-sm border-border bg-brand-surface text-brand-surface-foreground"
            }`}
            data-chat-bubble={isAi ? "assistant" : "user"}
          >
            {text && <p className="whitespace-pre-wrap">{text}</p>}
            {children && <div className={text ? "mt-3" : ""}>{children}</div>}

            {/* 선택지 컴포넌트 렌더링 (자연스러운 대화형 UI - 단, 입력창은 제외) */}
            {isAi && (step || completed) && (!step || ["single-choice", "multi-choice", "confirmation"].includes(step.type)) && onSubmit && onReset && (
              <div className="mt-3 border-t border-border/50 pt-3">
                <ChatFlowInput
                  step={step}
                  completed={completed}
                  onSubmit={onSubmit}
                  onReset={onReset}
                />
              </div>
            )}
          </div>
          {isAi && canUndo && onUndo && (
            <button
              type="button"
              title="이전 조건 다시 입력"
              aria-label="이전 조건 다시 입력"
              disabled={undoDisabled}
              onClick={onUndo}
              className="mb-1 flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border bg-card text-sm text-primary shadow-sm transition hover:border-accent hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-wait disabled:opacity-50"
            >
              ⤴️
            </button>
          )}
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
