import React from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import type { SubCategory } from "../../../types/moit";
import MoitIcon from "../../common/MoitIcon";

interface ChatHeaderProps {
  item: SubCategory;
  onBack: () => void;
  onReset: () => void;
}

export default function ChatHeader({ item, onBack, onReset }: ChatHeaderProps) {
  return (
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
          <MoitIcon name={item.icon} size={18} />
        </div>
        <div>
          <h1 className="text-sm font-black text-primary">{item.chatTitle}</h1>
          <p className="text-xs font-bold text-muted-foreground">{item.title} 담당 AI 코치와 대화 중</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-black text-muted-foreground transition-all hover:border-accent/40 hover:text-primary active:scale-[0.98]"
      >
        <RefreshCw size={14} />
        <span>대화 리셋</span>
      </button>
    </header>
  );
}
