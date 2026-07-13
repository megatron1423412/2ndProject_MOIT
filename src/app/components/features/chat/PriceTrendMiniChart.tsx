import React from "react";
import type { PriceHistoryPoint } from "../../../features/product-catalog/core/types";

export default function PriceTrendMiniChart({ history }: { history: PriceHistoryPoint[] }) {
  if (history.length < 2) return <p className="text-xs text-muted-foreground">가격 이력 부족</p>;
  const values = history.map(({ lowestPrice }) => lowestPrice);
  const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1, max - min);
  const points = values.map((price, index) => `${(index / (values.length - 1)) * 100},${36 - ((price - min) / range) * 30}`).join(" ");
  return (
    <div aria-label="월별 더미 최저가 추이" className="rounded-lg border border-border bg-muted/20 p-2">
      <svg viewBox="0 0 100 40" className="h-14 w-full" role="img"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent" vectorEffect="non-scaling-stroke" /></svg>
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{history[0].date.slice(0, 7)}</span><span>{history.at(-1)!.date.slice(0, 7)}</span></div>
    </div>
  );
}
