import React, { useEffect, useRef, useState } from "react";
import { getSubCategoryById } from "../../../data/categories";
import { useChatFlow } from "../../../features/chat-flow/engine/useChatFlow";
import type { ConversationHistoryItem, SubCategory, SubCategoryId, TopActionState } from "../../../types/moit";
import ChatFlowInput from "./ChatFlowInput";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatSidebar from "./ChatSidebar";
import DiagnosisResultCard from "./DiagnosisResultCard";

interface ChatScreenProps {
  subCategoryId: SubCategoryId;
  onBack: () => void;
  onSelectSubCategory: (item: SubCategory) => void;
  actions: TopActionState;
}

export default function ChatScreen({ subCategoryId, onBack, onSelectSubCategory, actions }: ChatScreenProps) {
  const item = getSubCategoryById(subCategoryId);
  const flow = useChatFlow(subCategoryId);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [areActionsCollapsed, setAreActionsCollapsed] = useState(false);
  const [notice, setNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [flow.messages]);

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

        <main className="flex-1 overflow-y-auto p-5">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            {flow.messages.map((message) => (
              <React.Fragment key={message.id}>
                {message.text && (
                  <ChatMessage sender={message.sender} text={message.text} timestamp={message.timestamp} />
                )}
                {message.type === "result" && flow.result && (
                  <div className="self-start pl-11">
                    <DiagnosisResultCard result={flow.result} />
                  </div>
                )}
              </React.Fragment>
            ))}
            {flow.error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive">
                {flow.error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

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
      </div>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-primary shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}
