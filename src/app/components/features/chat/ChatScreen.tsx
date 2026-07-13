import React, { useEffect, useRef, useState } from "react";
import { getSubCategoryById } from "../../../data/categories";
import { useChatFlow } from "../../../features/chat-flow/engine/useChatFlow";
import type { ConversationHistoryItem, SubCategory, SubCategoryId, TopActionState } from "../../../types/moit";
import ChatFlowInput from "./ChatFlowInput";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatSidebar from "./ChatSidebar";
import DiagnosisResultCard from "./DiagnosisResultCard";
import { buildSmartShoppingGreeting } from "../../../features/smart-shopping/greeting/buildSmartShoppingGreeting";
import type { UserProfile } from "../../../features/smart-shopping/user/userProfile";
import type { PriceAlertDraft } from "../../../features/smart-shopping/price-alerts/types";

interface ChatScreenProps {
  subCategoryId: SubCategoryId;
  onBack: () => void;
  onSelectSubCategory: (item: SubCategory) => void;
  actions: TopActionState;
  userProfile: UserProfile;
  onEndSmartShoppingChat: () => void;
  onCreatePriceAlert: (draft: PriceAlertDraft) => unknown;
}

export default function ChatScreen({ subCategoryId, onBack, onSelectSubCategory, actions, userProfile, onEndSmartShoppingChat, onCreatePriceAlert }: ChatScreenProps) {
  const item = getSubCategoryById(subCategoryId);
  const flow = useChatFlow(subCategoryId);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [areActionsCollapsed, setAreActionsCollapsed] = useState(false);
  const [notice, setNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const [timelineRevision, setTimelineRevision] = useState(0);

  useEffect(() => {
    if (!shouldStickToBottomRef.current) return;
    const container = scrollContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    else messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [flow.messages, flow.supplementalMessages, timelineRevision]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    shouldStickToBottomRef.current = container.scrollHeight - container.scrollTop - container.clientHeight < 96;
  };

  if (!item) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        선택한 진단 항목을 찾을 수 없습니다.
      </div>
    );
  }

  const handleHistorySelect = (historyItem: ConversationHistoryItem) => {
    setNotice(`${historyItem.title} 상세 화면은 다음 단계에서 연결할게요.`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <ChatSidebar
        activeSubCategoryId={subCategoryId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
        onBackToMain={onBack}
        onSelectSubCategory={onSelectSubCategory}
        onSelectHistory={handleHistorySelect}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          actions={actions}
          areActionsCollapsed={areActionsCollapsed}
          onToggleActionsCollapsed={() => setAreActionsCollapsed((value) => !value)}
        />

        <main ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            {item.parentCategory === "appliances" && (
              <ChatMessage sender="ai" text={buildSmartShoppingGreeting(userProfile.displayName, item.title)} />
            )}
            {flow.messages.map((message, index) => {
              const isLast = index === flow.messages.length - 1;
              const isAi = message.sender === "ai";
              
              // 선택형 단계이거나 완료 상태인 경우에만 인라인 선택지를 표시합니다.
              const isSelectionStep = flow.currentStep && ["single-choice", "multi-choice", "confirmation"].includes(flow.currentStep.type);
              const showInlineInput = isLast && isAi && (isSelectionStep || flow.completed);
              const currentStepForMessage = showInlineInput ? flow.currentStep : undefined;

              return (
                <React.Fragment key={message.id}>
                  {message.text && (
                    <ChatMessage
                      sender={message.sender}
                      text={message.text}
                      timestamp={message.timestamp}
                      step={currentStepForMessage}
                      completed={isLast ? flow.completed : false}
                      onSubmit={flow.submitAnswer}
                      onReset={flow.reset}
                    />
                  )}
                  {message.type === "result" && (message.result ?? flow.result) && (
                    <div className="w-full self-start pl-11">
                      <DiagnosisResultCard result={(message.result ?? flow.result)!} onEndSmartShoppingChat={onEndSmartShoppingChat} onCreatePriceAlert={onCreatePriceAlert} onTimelineChange={() => setTimelineRevision((value) => value + 1)} userId={userProfile.id} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            {flow.error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive">
                {flow.error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* 입력형 단계(number-input, text-input)인 경우에만 화면 하단에 입력창을 노출 */}
        {flow.currentStep && ["number-input", "text-input"].includes(flow.currentStep.type) && (
          <footer className="flex-shrink-0 border-t border-border bg-card p-4">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
              <ChatFlowInput
                step={flow.currentStep}
                completed={flow.completed}
                onSubmit={flow.submitAnswer}
                onReset={flow.reset}
              />
            </div>
          </footer>
        )}

        {/* 기존 하단 입력창 백업용 주석 처리
        <footer className="flex-shrink-0 border-t border-border bg-card p-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
            <ChatFlowInput
              step={flow.currentStep}
              completed={flow.completed}
              onSubmit={flow.submitAnswer}
              onReset={flow.reset}
            />
          </div>
        </footer>
        */}

      </div>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-primary shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}
