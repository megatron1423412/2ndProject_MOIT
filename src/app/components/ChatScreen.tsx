import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw, Send, Sparkles } from "lucide-react";
import type { DiagnosisItem } from "../data";
import ChatMessage from "./ChatMessage";
import DiagnosisResultCard from "./DiagnosisResultCard";
import QuickReplyChips from "./QuickReplyChips";

interface ChatScreenProps {
  item: DiagnosisItem;
  onBack: () => void;
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

export default function ChatScreen({ item, onBack }: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resetMessages = () => {
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
  }, [item.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleQuickReply = (reply: string) => {
    addMockResult(reply);
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setInputValue("");
    addMockResult(trimmed);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-[74px] flex-shrink-0 items-center justify-between border-b border-border bg-card px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-primary transition-all hover:border-accent/40 hover:bg-secondary active:scale-[0.98]"
            title="메인 화면으로 돌아가기"
          >
            <ArrowLeft size={19} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-accent">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black text-primary">{item.chatTitle}</h1>
            <p className="text-xs font-bold text-muted-foreground">{item.title} 담당 AI 코치와 대화 중</p>
          </div>
        </div>
        <button
          type="button"
          onClick={resetMessages}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-black text-muted-foreground transition-all hover:border-accent/40 hover:text-primary active:scale-[0.98]"
        >
          <RefreshCw size={14} />
          <span>대화 리셋</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-5">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          {messages.map((message) => (
            <React.Fragment key={message.id}>
              {message.text && (
                <ChatMessage sender={message.sender} text={message.text} timestamp={message.timestamp} />
              )}
              {message.type === "result" && (
                <div className="self-start pl-11">
                  <DiagnosisResultCard item={item} />
                </div>
              )}
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="flex-shrink-0 border-t border-border bg-card p-4">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
          {!hasResult && <QuickReplyChips replies={item.quickReplies} onSelect={handleQuickReply} />}
          {hasResult && (
            <QuickReplyChips
              replies={["조건을 더 추가할게요", "비교 기준 다시 볼래요", "체크리스트만 정리해줘"]}
              onSelect={handleQuickReply}
            />
          )}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/45 px-3 py-2">
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
                  ? "bg-accent text-white shadow-sm active:scale-[0.96]"
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
  );
}
