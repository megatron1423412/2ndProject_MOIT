import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { getSubCategoryById } from "../../../data/categories";
import { MOCK_CHAT_RESULTS } from "../../../data/mockChatScenarios";
import type { ConversationHistoryItem, SubCategory, SubCategoryId, TopActionState } from "../../../types/moit";
import ChatHeader from "./ChatHeader";
import ChatMessage from "./ChatMessage";
import ChatSidebar from "./ChatSidebar";
import DiagnosisResultCard from "./DiagnosisResultCard";
import QuickReplyChips from "./QuickReplyChips";

interface ChatScreenProps {
  subCategoryId: SubCategoryId;
  onBack: () => void;
  onSelectSubCategory: (item: SubCategory) => void;
  actions: TopActionState;
}

interface Message {
  id: string;
  sender: "ai" | "user";
  text?: string;
  timestamp: string;
  type?: "text" | "result";
}

const getTimeString = () => {
  const d = new Date();
  return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
};

export default function ChatScreen({ subCategoryId, onBack, onSelectSubCategory, actions }: ChatScreenProps) {
  const item = getSubCategoryById(subCategoryId);
  const result = MOCK_CHAT_RESULTS[subCategoryId];
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [areActionsCollapsed, setAreActionsCollapsed] = useState(false);
  const [notice, setNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resetMessages = () => {
    if (!item) return;

    setMessages([
      {
        id: `${item.id}-initial`,
        sender: "ai",
        text: item.initialMessage,
        timestamp: getTimeString(),
        type: "text",
      },
    ]);
    setInputValue("");
    setHasResult(false);
  };

  useEffect(() => {
    resetMessages();
  }, [subCategoryId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!item) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        선택한 진단 항목을 찾을 수 없습니다.
      </div>
    );
  }

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: getTimeString(),
      },
    ]);
  };

  const addMockResult = (triggerText: string) => {
    addMessage({ sender: "user", text: triggerText, type: "text" });

    window.setTimeout(() => {
      const response =
        item.kind === "product"
          ? "좋아요. 가격, 리뷰, 평점, 시세, 사용 목적을 함께 놓고 돈값 기준으로 요약해볼게요."
          : "좋아요. 현재 비용, 예상 절감액, 등급, 확인 필요 사항을 카드로 정리해볼게요.";
      addMessage({ sender: "ai", text: response, type: "text" });
    }, 250);

    window.setTimeout(() => {
      addMessage({ sender: "ai", type: "result" });
      setHasResult(true);
    }, 650);
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue("");
    addMockResult(trimmed);
  };

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
            {messages.map((message) => (
              <React.Fragment key={message.id}>
                {message.text && (
                  <ChatMessage sender={message.sender} text={message.text} timestamp={message.timestamp} />
                )}
                {message.type === "result" && (
                  <div className="self-start pl-11">
                    <DiagnosisResultCard result={result} />
                  </div>
                )}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="flex-shrink-0 border-t border-border bg-card p-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
            <QuickReplyChips
              replies={
                hasResult
                  ? ["조건을 더 추가할게요", "비교 기준 다시 볼래요", "체크리스트만 정리해줘"]
                  : item.quickReplies
              }
              onSelect={addMockResult}
            />
            <div className="flex items-center gap-2 rounded-lg border border-border bg-input-background px-3 py-2">
              <input
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSend();
                }}
                placeholder={`${item.title}에 대해 알려주세요`}
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${
                  inputValue.trim()
                    ? "bg-accent text-accent-foreground shadow-sm active:scale-[0.96]"
                    : "bg-muted text-muted-foreground/60"
                }`}
                title="전송"
              >
                <Send size={16} />
              </button>
            </div>
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
