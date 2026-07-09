import React from "react";
import { MessageSquareText } from "lucide-react";
import type { ConversationHistoryItem, HistoryStatus } from "../data";

interface ConversationHistoryCardProps {
  item: ConversationHistoryItem;
  onSelect: (item: ConversationHistoryItem) => void;
}

const statusClass: Record<HistoryStatus, string> = {
  완료: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "진행 중": "bg-sky-50 text-sky-700 border-sky-100",
  "다시 확인 필요": "bg-amber-50 text-amber-700 border-amber-100",
};

export default function ConversationHistoryCard({ item, onSelect }: ConversationHistoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="rounded-lg border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md active:translate-y-0"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
          <MessageSquareText size={19} />
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass[item.status]}`}>
          {item.status}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold text-accent">{item.category}</p>
        <h3 className="mt-1 text-base font-black text-primary">{item.title}</h3>
        <p className="mt-2 min-h-[42px] text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
        <p className="mt-4 border-t border-dashed border-border pt-3 text-xs font-bold text-muted-foreground">
          마지막 대화 {item.lastDate}
        </p>
      </div>
    </button>
  );
}
