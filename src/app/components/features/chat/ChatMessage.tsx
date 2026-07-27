import React from "react";
import ChatFlowInput from "./ChatFlowInput";
import { CHAT_ASSISTANT_AVATAR_WIDTH_CLASS, CHAT_ASSISTANT_RAIL_GAP_CLASS } from "./ChatTimelineRow";
import type { AnswerInputStep, SubmittedFlowAnswer } from "../../../features/chat-flow/core/types";

import type { FavoriteProduct, FavoriteDraft } from "../../../features/favorites/types";

import ConditionSummaryCard from "./ConditionSummaryCard";

function renderFormattedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
            const innerText = part.slice(2, -2);
            const isBlueHeader = innerText.includes("모잇이 자동으로 챙겨드리는 것들이에요");
            if (isBlueHeader) {
              return (
                <span
                  key={partIdx}
                  className="my-1 inline-block rounded-xl border border-[#1E3ABA] bg-[#1E3ABA] px-3.5 py-1.5 font-extrabold text-white shadow-2xs"
                >
                  {innerText}
                </span>
              );
            }
            return (
              <strong
                key={partIdx}
                className="font-bold text-foreground"
              >
                {innerText}
              </strong>
            );
          }
          return part;
        })}
        {lineIdx < lines.length - 1 && "\n"}
      </React.Fragment>
    );
  });
}

export interface ChatMessageProps {
  sender: "ai" | "user";
  text?: string;
  timestamp?: string;
  children?: React.ReactNode;
  step?: AnswerInputStep | null;
  completed?: boolean;
  onSubmit?: (answer: SubmittedFlowAnswer) => void;
  onReset?: () => void;
  onGoBack?: () => void;
  canUndo?: boolean;
  undoDisabled?: boolean;
  onUndo?: () => void;
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
  canUndo = false,
  undoDisabled = false,
  onUndo,
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
  const isSummaryMessage = Boolean(
    isAi &&
      displayText &&
      (displayText.includes("입력해 주신 조건 요약") ||
        displayText.includes("조건을 요약했어요") ||
        displayText.includes("다음 조건으로") ||
        step?.id?.endsWith("-summary"))
  );

  const isAutoRulesMessage = Boolean(
    isAi && displayText && displayText.includes("모잇이 자동으로 챙겨드리는 것들이에요")
  );

  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 1: 메시지 너비 및 전체 정렬]
       - max-w-[88%]: 말풍선의 최대 너비 비율 (예: max-w-[80%] 나 max-w-[90%])
       - gap 조정: CHAT_ASSISTANT_RAIL_GAP_CLASS 대신 gap-2, gap-3 등으로 아이콘과 말풍선 간격 수정 가능
    */
    <div className={`flex max-w-[88%] ${CHAT_ASSISTANT_RAIL_GAP_CLASS} ${isAi ? "self-start" : "self-end flex-row-reverse"}`} data-chat-turn={isAi ? "assistant" : "user"}>

      {/* 🎨 [프론트엔드 수정 가능 Zone 2: AI 아바타 아이콘]
         - h-8, w-8: 아바타 크기 변경 가능
         - style의 linear-gradient: AI 로고 배경색 및 그라데이션 커스텀 (예: #1B3A5C -> 다른 브랜드 컬러)
         - Sparkles: lucide-react에서 다른 아이콘(Bot, Cpu, MessageSquare 등)으로 교체 가능
      */}
      {isAi && (
        <div
          className={`flex h-8 ${CHAT_ASSISTANT_AVATAR_WIDTH_CLASS} flex-shrink-0 items-center justify-center rounded-full bg-transparent overflow-hidden`}
          data-chat-assistant-logo
        >
          <img
            src="/assets/brand/robot_moit_face.png"
            alt="MOIT 챗봇"
            className="h-full w-full object-contain select-none"
          />
        </div>
      )}

      <div className="relative min-w-0 max-w-full flex flex-col gap-1">
        <div className="flex max-w-full items-end gap-2">

          {/* 🎨 [프론트엔드 수정 가능 Zone 3: 말풍선 디자인 & 패딩 & 배경색]
             - rounded-2xl / rounded-tl-sm / rounded-tr-sm: 말풍선 모서리 둥글기 모형 변경
             - px-4 py-3: 말풍선 내부 여백(Padding) 조절
             - text-sm: 폰트 크기 변경 (text-xs, text-base 등)
             - bg-card / bg-brand-surface: AI 말풍선과 유저 말풍선의 배경색 다듬기
             - shadow-sm: 그림자 효과 (shadow-md, shadow-none 등)
          */}
          <div
            className={`min-w-0 rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${
              isAi
                ? "rounded-tl-sm border-border bg-card text-foreground"
                : "rounded-tr-sm border-border bg-brand-surface text-brand-surface-foreground"
            }`}
          >
            {/* 🎨 [프론트엔드 수정 가능 Zone 4: 텍스트 스타일]
               - leading-relaxed: 줄간격 조절 (leading-normal, leading-loose 등)
               - font-medium 등의 굵기 속성 추가 가능
            */}
            {displayText && (
              isSummaryMessage ? (
                <ConditionSummaryCard text={displayText} stepId={step?.id} />
              ) : (
                <p className="whitespace-pre-wrap">{renderFormattedText(displayText)}</p>
              )
            )}

            {/* 자식 컴포넌트 간격 */}
            {children && <div className={displayText ? "mt-3" : ""}>{children}</div>}

            {/* 선택지 컴포넌트 영역 (ChatFlowInput) */}
            {isAi && (step || completed) && (!step || ["single-choice", "multi-choice", "confirmation"].includes(step.type)) && onSubmit && onReset && (
              /* 🎨 [프론트엔드 수정 가능 Zone 5: 하단 선택지 구분선 영역]
                 - mt-3 pt-3: 선택지 버튼들과 텍스트 사이의 상하 간격
                 - border-t border-border/50: 구분선의 굵기나 색상 투명도 조절
              */
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

          {/* 🎨 [프론트엔드 수정 가능 Zone 6 & 7: '이전으로 돌아가기' 통합 버튼] */}
          {isAi && (canUndo || canGoBack) && (onUndo || onGoBack) && (
            <button
              type="button"
              onClick={canUndo ? onUndo : onGoBack}
              title={canUndo ? "이전 조건 다시 입력" : "이전 단계로 돌아가기"}
              aria-label={canUndo ? "이전 조건 다시 입력" : "이전 단계로 돌아가기"}
              disabled={canUndo ? undoDisabled : false}
              className="absolute bottom-3.5 -right-7 flex h-6 w-6 items-center justify-center p-0 !bg-transparent !border-none !shadow-none !outline-none !ring-0 hover:!bg-transparent hover:!border-none active:!bg-transparent focus:!bg-transparent focus:!ring-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <img
                src="/assets/icons/u_turn_to_left.png"
                alt={canUndo ? "이전 조건 다시 입력" : "이전 단계로 돌아가기"}
                className="h-3.5 w-3.5 object-contain select-none opacity-50 hover:opacity-100 transition-opacity"
                style={{ filter: "invert(45%)" }} // 중간 회색
              />
            </button>
          )}
        </div>

        {/* 🎨 [프론트엔드 수정 가능 Zone 8: 메시지 타임스탬프 (시간 표시)]
           - text-[10px]: 시간 글자 크기 (예: text-xs)
           - text-muted-foreground: 글자 색상
           - px-1: 위치 여백
        */}
        {timestamp && (
          <span className={`px-1 text-[10px] text-muted-foreground ${!isAi ? "text-right" : ""}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}