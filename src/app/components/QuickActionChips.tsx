import React from "react";
import { Sparkles } from "lucide-react";

interface QuickActionChipsProps {
  onSelectAction: (action: string) => void;
}

const ACTIONS = [
  { label: "🛍️ 상품 살까 말까", id: "상품 살까 말까" },
  { label: "✨ 가성비 Top 10", id: "가성비 Top 10" },
  { label: "📱 통신비 줄이기", id: "통신비 줄이기" },
  { label: "📺 구독료 정리", id: "구독료 정리" },
  { label: "💰 전체 고정비 진단", id: "전체 고정비 진단" },
];

export default function QuickActionChips({ onSelectAction }: QuickActionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 py-3 select-none">
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          onClick={() => onSelectAction(action.id)}
          className="bg-card hover:bg-secondary text-primary font-semibold text-xs py-2.5 px-3.5 rounded-full border border-border hover:border-accent/40 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
