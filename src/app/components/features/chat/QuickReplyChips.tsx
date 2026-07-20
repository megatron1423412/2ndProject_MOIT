import React from "react";

interface QuickReplyChipsProps {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
  selectedValue?: string;
}

export default function QuickReplyChips({ replies, onSelect, disabled = false, selectedValue }: QuickReplyChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {replies.map((reply) => {
        const isSelected = selectedValue === reply;
        const btnClass = disabled
          ? isSelected
            ? "border-accent bg-accent text-accent-foreground opacity-90 cursor-not-allowed"
            : "border-border bg-card text-primary opacity-40 cursor-not-allowed"
          : "hover:border-accent/50 hover:bg-secondary active:scale-[0.98]";

        return (
          <button
            key={reply}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onSelect(reply)}
            className={`rounded-full border px-3.5 py-2 text-xs font-bold text-primary shadow-sm transition-all ${btnClass}`}
          >
            {reply}
          </button>
        );
      })}
    </div>
  );
}
