import React from "react";
import type { ConversationHistoryItem } from "../../../types/moit";
import ConversationHistoryCard from "./ConversationHistoryCard";

interface ConversationHistoryProps {
  history: ConversationHistoryItem[];
  onSelectHistory: (item: ConversationHistoryItem) => void;
}

export default function ConversationHistory({ history, onSelectHistory }: ConversationHistoryProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-primary">지난 대화 요약</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          이전 진단 결과와 다시 확인할 항목을 서비스 카드 형태로 모아봤어요.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {history.map((item) => (
          <ConversationHistoryCard key={item.id} item={item} onSelect={onSelectHistory} />
        ))}
      </div>
    </section>
  );
}
