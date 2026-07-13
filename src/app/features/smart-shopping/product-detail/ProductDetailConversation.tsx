import React from "react";
import ChatMessage from "../../../components/features/chat/ChatMessage";
import type { ChatFlowMessage } from "../../chat-flow/core/types";
import type { ProductRecommendation } from "../../product-catalog/core/types";

export default function ProductDetailConversation({ messages }: { messages: ChatFlowMessage[] }) {
  if (!messages.length) return null;
  return (
    <div className="space-y-3" aria-live="polite">
      {messages.map((message) => {
        const alternatives = message.metadata?.alternatives as ProductRecommendation[] | undefined;
        return <React.Fragment key={message.id}><ChatMessage sender={message.sender} text={message.text} timestamp={message.timestamp} />{alternatives?.length ? <AlternativeCards items={alternatives} /> : null}</React.Fragment>;
      })}
    </div>
  );
}

function AlternativeCards({ items }: { items: ProductRecommendation[] }) {
  return <div className="ml-11 grid gap-2 sm:grid-cols-3">{items.map((item) => <div key={item.product.id} className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-black text-primary">{item.product.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.product.brand} · {item.product.modelNumber}</p><p className="mt-2 text-xs font-black text-accent">적합도 {item.score}점</p><p className="mt-1 text-xs text-primary">{item.product.currentPrice.toLocaleString("ko-KR")}원</p></div>)}</div>;
}
