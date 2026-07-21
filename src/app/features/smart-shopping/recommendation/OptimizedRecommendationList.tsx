import React from "react";
import type { ProductRecommendation, ProductSource } from "../../product-catalog/core/types";
import SelectableRecommendationCard from "./SelectableRecommendationCard";

/**
 * A desktop optimized-card is 25.5rem wide: the 4xl timeline (56rem) splits
 * into two 27.5rem recommendation columns around a 1rem gap, then this panel's
 * p-4 inset leaves its selectable product-card width.
 */
export const OPTIMIZED_RECOMMENDATION_CARD_LAYOUT = {
  cardWidth: "25.5rem",
  twoColumnMinWidth: "51.75rem",
} as const;

interface Props {
  items: ProductRecommendation[];
  catalogSource: ProductSource;
  onSelect: (item: ProductRecommendation) => void;
  isFavorite: (item: ProductRecommendation) => boolean;
  onToggleFavorite: (item: ProductRecommendation) => void;
  isActive?: boolean;
}

export default function OptimizedRecommendationList({ items, catalogSource, onSelect, isFavorite, onToggleFavorite, isActive = true }: Props) {
  const isReal = catalogSource === "real";
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm" data-chat-content="ai-reorder">
      <div><p className="text-xs font-black text-accent">MOIT 내부 DB · {isReal ? "REAL" : "MOCK"}</p><h3 className="mt-1 text-base font-black text-primary">AI 최적화 재정렬</h3><p className="mt-1 text-xs text-muted-foreground">코드의 필수 필터와 적합도 점수 결과이며 AI가 임의로 정한 순위가 아닙니다.</p></div>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">{isReal ? "필수 조건을 만족한 실제 상품 데이터가 없습니다." : "필수 조건을 만족한 내부 더미 상품이 없습니다."}</p>}
        {items.slice(0, 10).map((item, index) => <SelectableRecommendationCard key={item.product.id} recommendation={item} rank={index + 1} isActive={isActive} onSelect={onSelect} isFavorite={isFavorite(item)} onToggleFavorite={() => onToggleFavorite(item)} />)}
      </div>
    </section>
  );
}
