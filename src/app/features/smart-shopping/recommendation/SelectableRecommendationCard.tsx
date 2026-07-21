import React from "react";
import ProductImage from "../../../components/product-catalog/ProductImage";
import FavoriteToggleButton from "../../favorites/FavoriteToggleButton";
import type { ProductRecommendation } from "../../product-catalog/core/types";

interface Props {
  recommendation: ProductRecommendation;
  onSelect: (item: ProductRecommendation) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isActive?: boolean;
  rank?: number;
}

/** Shared selectable card for canonical MOIT recommendation records. */
export default function SelectableRecommendationCard({ recommendation, onSelect, isFavorite, onToggleFavorite, isActive = true, rank }: Props) {
  const { product } = recommendation;
  return (
    <div className="relative w-full">
      <button type="button" disabled={!isActive} onClick={() => onSelect(recommendation)} className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 pr-12 text-left transition hover:border-accent hover:bg-muted/25 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-default disabled:opacity-75">
        {rank !== undefined && <span className="flex h-7 min-w-7 flex-none items-center justify-center rounded-full bg-brand-surface px-1 text-xs font-black text-brand-surface-foreground">{rank}</span>}
        <ProductImage productId={product.id} imagePath={product.imagePath} alt={`${product.brand} ${product.name} 상품 이미지`} className="h-20 w-20 flex-none rounded-lg border border-border bg-muted object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2"><p className="truncate text-xs font-bold text-muted-foreground">{product.brand} · {product.modelNumber}</p><span className="mr-1 flex-none text-xs font-black text-accent">{recommendation.score}점</span></div>
          <p className="mt-1 break-keep font-black text-primary">{product.name}</p>
          {recommendation.verificationNeeded && <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">조건 확인이 필요한 후보 · {recommendation.verificationRequiredFields?.join(" · ")} 확인 필요</p>}
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{recommendation.recommendationReasons.slice(0, 2).join(" · ")}</p>
          {recommendation.matchedCoreCriteria.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{recommendation.matchedCoreCriteria.slice(0, 3).map((badge) => <span key={badge} className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{badge}</span>)}</div>}
          <div className="mt-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">핵심 조건 {recommendation.matchedCoreCriteria.length}개 충족</span><strong className="text-primary">{product.currentPrice.toLocaleString("ko-KR")}원</strong></div>
        </div>
      </button>
      <FavoriteToggleButton isFavorite={isFavorite} disabled={!isActive} onToggle={onToggleFavorite} />
    </div>
  );
}
