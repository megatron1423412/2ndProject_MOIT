import React from "react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import type { ProductRecommendation } from "../../product-catalog/core/types";

export default function OptimizedRecommendationList({ items, onSelect }: { items: ProductRecommendation[]; onSelect: (item: ProductRecommendation) => void }) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div><p className="text-xs font-black text-accent">MOIT 내부 DB · MOCK</p><h3 className="mt-1 text-base font-black text-primary">AI 최적화 재정렬</h3><p className="mt-1 text-xs text-muted-foreground">코드의 필수 필터와 적합도 점수 결과이며 AI가 임의로 정한 순위가 아닙니다.</p></div>
      <div className="mt-4 space-y-2">
        {items.length === 0 && <p className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">필수 조건을 만족한 내부 더미 상품이 없습니다.</p>}
        {items.slice(0, 10).map((item, index) => (
          <button key={item.product.id} type="button" onClick={() => onSelect(item)} className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition hover:border-accent hover:bg-muted/25 focus:outline-none focus:ring-2 focus:ring-accent/40">
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-surface text-xs font-black text-brand-surface-foreground">{index + 1}</span>
            <ImageWithFallback src={item.product.imagePath} alt="" className="h-20 w-20 flex-none rounded-lg border border-border bg-muted object-cover" />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2"><p className="truncate text-xs font-bold text-muted-foreground">{item.product.brand} · {item.product.modelNumber}</p><span className="flex-none text-xs font-black text-accent">{item.score}점</span></div>
              <p className="mt-1 font-black text-primary">{item.product.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.recommendationReasons.slice(0, 2).join(" · ")}</p>
              <div className="mt-2 flex flex-wrap gap-1">{item.matchedCoreCriteria.slice(0, 3).map((badge) => <span key={badge} className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">{badge}</span>)}</div>
              <div className="mt-2 flex items-center justify-between text-xs"><span className="text-muted-foreground">핵심 조건 {item.matchedCoreCriteria.length}개 충족</span><strong className="text-primary">{item.product.currentPrice.toLocaleString("ko-KR")}원</strong></div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
