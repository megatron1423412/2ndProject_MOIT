import React from "react";
import type { ConversationHistoryItem } from "../../../types/moit";

interface CompactConversationItemProps {
  item: ConversationHistoryItem;
  onSelect: (item: ConversationHistoryItem) => void;
}

export default function CompactConversationItem({ item, onSelect }: CompactConversationItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="w-full rounded-lg border border-transparent px-3 py-2.5 text-left transition-all hover:border-sidebar-border hover:bg-sidebar-accent"
    >
      <p className="truncate text-xs font-black text-sidebar-foreground">{item.title}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="truncate text-[10px] font-bold text-muted-foreground">{item.lastDate}</span>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-black text-accent">
          {item.status}
        </span>
      </div>
    </button>
  );
}
