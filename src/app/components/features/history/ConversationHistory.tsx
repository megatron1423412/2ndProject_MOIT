import React from "react";
import type { ConversationHistoryItem } from "../../../types/moit";
import ConversationHistoryCard from "./ConversationHistoryCard";

interface ConversationHistoryProps {
  history: ConversationHistoryItem[];
  onSelectHistory: (item: ConversationHistoryItem) => void;
}

export default function ConversationHistory({ history, onSelectHistory }: ConversationHistoryProps) {
  return (
    <section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {history.map((item) => (
          <ConversationHistoryCard key={item.id} item={item} onSelect={onSelectHistory} />
        ))}
      </div>
    </section>
  );
}
