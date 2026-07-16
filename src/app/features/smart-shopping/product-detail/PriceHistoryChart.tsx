import React, { useEffect, useMemo, useState } from "react";
import { getValidPriceHistory } from "../../product-catalog/core/priceHistory";
import type { PriceHistoryPoint } from "../../product-catalog/core/types";

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = { left: 42, right: 24, top: 24, bottom: 50 };

export interface PriceHistoryChartPoint extends PriceHistoryPoint {
  x: number;
  y: number;
}

export const buildPriceHistoryChartPoints = (history: readonly PriceHistoryPoint[]): PriceHistoryChartPoint[] => {
  const validHistory = getValidPriceHistory(history);
  if (validHistory.length === 0) return [];
  const values = validHistory.map(({ lowestPrice }) => lowestPrice);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const timestamps = validHistory.map(({ date }) => Date.parse(date));
  const firstTimestamp = timestamps[0];
  const timestampRange = timestamps[timestamps.length - 1] - firstTimestamp;
  const chartWidth = WIDTH - PADDING.left - PADDING.right;
  const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
  return validHistory.map((point, index) => ({
    ...point,
    x: timestampRange === 0 ? PADDING.left + chartWidth / 2 : PADDING.left + (timestamps[index] - firstTimestamp) / timestampRange * chartWidth,
    y: range === 0 ? PADDING.top + chartHeight / 2 : PADDING.top + (max - point.lowestPrice) / range * chartHeight,
  }));
};

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export default function PriceHistoryChart({ productId, history }: { productId: string; history: readonly PriceHistoryPoint[] }) {
  const points = useMemo(() => buildPriceHistoryChartPoints(history), [history]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => { setActiveIndex(null); }, [productId, points.length]);

  if (points.length === 0) {
    return (
      <section className="rounded-lg border border-border p-3" data-price-history-card data-product-id={productId}>
        <p className="text-[11px] font-black text-primary">역대 최저가 추이</p>
        <div className="flex min-h-48 items-center justify-center rounded-md bg-muted/20 px-4 text-center text-xs text-muted-foreground">저장된 가격 이력이 없습니다.</div>
      </section>
    );
  }

  const active = activeIndex === null ? null : points[activeIndex];
  const labelInterval = Math.max(1, Math.ceil((points.length - 1) / 4));
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(" ");

  return (
    <section className="rounded-lg border border-border p-3" data-price-history-card data-product-id={productId}>
      <p className="text-[11px] font-black text-primary">역대 최저가 추이</p>
      <div className="relative mt-2 min-h-52 w-full overflow-visible" onMouseLeave={() => setActiveIndex(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-52 w-full overflow-visible" role="img" aria-label={`${productId} 저장 가격 이력 ${points.length}개`}>
          <line x1={PADDING.left} y1={HEIGHT - PADDING.bottom} x2={WIDTH - PADDING.right} y2={HEIGHT - PADDING.bottom} className="stroke-border" strokeWidth="1" />
          {points.length > 1 && <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" vectorEffect="non-scaling-stroke" />}
          {points.map((point, index) => {
            const isActive = activeIndex === index;
            return (
              <g key={`${point.date}-${index}`} data-price-point data-date={point.date} data-price={point.lowestPrice}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 7 : 5}
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.date} ${won(point.lowestPrice)}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                  className="cursor-pointer fill-card stroke-accent outline-none transition-all focus:stroke-[5px]"
                  strokeWidth={isActive ? 4 : 3}
                />
                {(index === 0 || index === points.length - 1 || index % labelInterval === 0) && (
                  <text x={point.x} y={HEIGHT - 20} textAnchor="middle" className="fill-muted-foreground text-[10px]">{point.date}</text>
                )}
              </g>
            );
          })}
        </svg>
        {active && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 min-w-28 rounded-lg border border-border bg-card px-3 py-2 text-center shadow-lg"
            style={{
              left: `${active.x / WIDTH * 100}%`,
              top: `${active.y / HEIGHT * 100}%`,
              transform: active.x < 100 ? "translate(0, -100%)" : active.x > WIDTH - 100 ? "translate(-100%, -100%)" : "translate(-50%, -100%)",
            }}
          >
            <p className="text-[10px] font-bold text-muted-foreground">{active.date}</p>
            <p className="mt-0.5 text-xs font-black text-primary">{won(active.lowestPrice)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
