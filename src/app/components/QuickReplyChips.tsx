import React from "react";

interface QuickReplyChipsProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

export default function QuickReplyChips({ replies, onSelect }: QuickReplyChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          onClick={() => onSelect(reply)}
          className="rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-primary shadow-sm transition-all hover:border-accent/50 hover:bg-secondary active:scale-[0.98]"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
