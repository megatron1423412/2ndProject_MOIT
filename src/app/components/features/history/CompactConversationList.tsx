import React from "react";
import type { ConversationHistoryItem } from "../../../types/moit";
import CompactConversationItem from "./CompactConversationItem";

interface CompactConversationListProps {
  history: ConversationHistoryItem[];
  onSelectHistory: (item: ConversationHistoryItem) => void;
}

export default function CompactConversationList({ history, onSelectHistory }: CompactConversationListProps) {
  return (
    <div className="space-y-1.5">
      {history.map((item) => (
        <CompactConversationItem key={item.id} item={item} onSelect={onSelectHistory} />
      ))}
    </div>
  );
}
