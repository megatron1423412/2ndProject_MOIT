import React from "react";
import { Sparkles } from "lucide-react";
import ChatFlowInput from "./ChatFlowInput";
import type { AnswerInputStep, SubmittedFlowAnswer } from "../../../features/chat-flow/core/types";

import type { FavoriteProduct, FavoriteDraft } from "../../../features/favorites/types";

interface ChatMessageProps {
  sender: "ai" | "user";
  text?: string;
  timestamp?: string;
  children?: React.ReactNode;
  step?: AnswerInputStep | null;
  completed?: boolean;
  onSubmit?: (answer: SubmittedFlowAnswer) => void;
  onReset?: () => void;
  onGoBack?: () => void;
  favorites?: FavoriteProduct[];
  onToggleFavoriteProduct?: (productId: string, draft: FavoriteDraft) => void;
  subCategoryId?: string;
  userId?: string;
  isHistorical?: boolean;
  answers?: Record<string, any>;
  onEndSmartShoppingChat?: () => void;
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
  onGoBack,
  favorites,
  onToggleFavoriteProduct,
  subCategoryId,
  userId,
  isHistorical = false,
  answers,
  onEndSmartShoppingChat,
}: ChatMessageProps) {
  const isAi = sender === "ai";
  const hasBackSymbol = text && (text.endsWith("⤴️") || text.endsWith("⤴️ "));
  const displayText = hasBackSymbol ? text.replace(/⤴️\s*$/, "").trim() : text;
  const canGoBack = isAi && !isHistorical && onGoBack && answers && Object.keys(answers).length > 0;

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
      <div className="flex flex-col gap-1 relative">
        <div
          className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isAi
              ? "rounded-tl-sm border-border bg-card text-foreground"
              : "rounded-tr-sm border-border bg-brand-surface text-brand-surface-foreground"
          }`}
        >
          {displayText && <p className="whitespace-pre-wrap">{displayText}</p>}
          {children && <div className={displayText ? "mt-3" : ""}>{children}</div>}

          {/* 선택지 컴포넌트 렌더링 (자연스러운 대화형 UI - 단, 입력창은 제외) */}
          {isAi && (step || completed) && (!step || ["single-choice", "multi-choice", "confirmation"].includes(step.type)) && onSubmit && onReset && (
            <div className="mt-3 border-t border-border/50 pt-3">
              <ChatFlowInput
                step={step}
                completed={completed}
                onSubmit={onSubmit}
                onReset={onReset}
                favorites={favorites}
                onToggleFavoriteProduct={onToggleFavoriteProduct}
                subCategoryId={subCategoryId}
                userId={userId}
                isHistorical={isHistorical}
                answers={answers}
                onEndSmartShoppingChat={onEndSmartShoppingChat}
              />
            </div>
          )}
        </div>

        {canGoBack && (
          <button
            type="button"
            onClick={onGoBack}
            title="이전 단계로 돌아가기"
            className="absolute bottom-2 -right-11 flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background shadow-sm hover:bg-muted text-muted-foreground hover:text-primary active:scale-95 transition-all duration-200"
          >
            <span className="text-sm select-none">⤴️</span>
          </button>
        )}
        {timestamp && (
          <span className={`px-1 text-[10px] text-muted-foreground ${!isAi ? "text-right" : ""}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}

