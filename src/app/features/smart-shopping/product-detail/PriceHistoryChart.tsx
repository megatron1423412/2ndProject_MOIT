import React, { useMemo, useState } from "react";
import { getValidPriceHistory } from "../../product-catalog/core/priceHistory";
import type { PriceHistoryPoint } from "../../product-catalog/core/types";

export const PRICE_HISTORY_CHART_LAYOUT = {
  width: 640,
  height: 280,
  padding: { left: 42, right: 24, top: 24, bottom: 92 },
  plotBaselineY: 188,
  axisY: 220,
  axisLabelY: 252,
} as const;

const { width: WIDTH, height: HEIGHT, padding: PADDING } = PRICE_HISTORY_CHART_LAYOUT;

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
  const chartHeight = PRICE_HISTORY_CHART_LAYOUT.plotBaselineY - PADDING.top;
  return validHistory.map((point, index) => ({
    ...point,
    x: timestampRange === 0 ? PADDING.left + chartWidth / 2 : PADDING.left + (timestamps[index] - firstTimestamp) / timestampRange * chartWidth,
    y: range === 0 ? PADDING.top + chartHeight / 2 : PADDING.top + (max - point.lowestPrice) / range * chartHeight,
  }));
};

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export const formatPriceHistoryAxisDate = (date: string) => {
  const [, month, day] = date.split("-").map(Number);
  return Number.isFinite(month) && Number.isFinite(day) ? `${month}.${day}.` : date;
};

/** The persistent marker is the stored historical minimum; ties use the latest stored date. */
export const getDefaultPriceHistoryPoint = (history: readonly PriceHistoryPoint[]): PriceHistoryPoint | null => {
  const sorted = getValidPriceHistory(history);
  if (sorted.length === 0) return null;
  return sorted.reduce((lowest, point) => point.lowestPrice <= lowest.lowestPrice ? point : lowest);
};

export const getPriceHistoryAxisLabelIndexes = (points: readonly PriceHistoryChartPoint[], minimumSpacing = 84) => {
  if (points.length === 0) return new Set<number>();
  const indexes = new Set<number>([0]);
  const finalIndex = points.length - 1;
  let lastLabeledX = points[0].x;
  for (let index = 1; index < finalIndex; index += 1) {
    if (points[index].x - lastLabeledX >= minimumSpacing && points[finalIndex].x - points[index].x >= minimumSpacing) {
      indexes.add(index);
      lastLabeledX = points[index].x;
    }
  }
  if (points[finalIndex].x - lastLabeledX >= minimumSpacing || finalIndex === 1) indexes.add(finalIndex);
  return indexes;
};

export const resolvePriceHistoryDisplayIndex = (defaultIndex: number | null, hoveredIndex: number | null, focusedIndex: number | null) =>
  hoveredIndex ?? focusedIndex ?? defaultIndex;

export default function PriceHistoryChart({ productId, history }: { productId: string; history: readonly PriceHistoryPoint[] }) {
  const points = useMemo(() => buildPriceHistoryChartPoints(history), [history]);
  const pointIdentity = points.map(({ date, lowestPrice }) => `${date}:${lowestPrice}`).join("|");
  return <InteractivePriceHistoryChart key={`${productId}|${pointIdentity}`} productId={productId} points={points} />;
}

function InteractivePriceHistoryChart({ productId, points }: { productId: string; points: PriceHistoryChartPoint[] }) {
  const defaultPoint = useMemo(() => getDefaultPriceHistoryPoint(points), [points]);
  const defaultIndex = useMemo(() => {
    if (!defaultPoint) return null;
    let match: number | null = null;
    points.forEach((point, index) => {
      if (point.date === defaultPoint.date && point.lowestPrice === defaultPoint.lowestPrice) match = index;
    });
    return match;
  }, [defaultPoint, points]);
  const axisLabelIndexes = useMemo(() => getPriceHistoryAxisLabelIndexes(points), [points]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <section className="h-full rounded-lg border border-border p-3" data-price-history-card data-product-id={productId}>
        <p className="text-[11px] font-black text-primary">역대 최저가 추이</p>
        <div className="flex min-h-64 items-center justify-center rounded-md bg-muted/20 px-4 text-center text-xs text-muted-foreground">저장된 가격 이력이 없습니다.</div>
      </section>
    );
  }

  const transientIndex = hoveredIndex ?? focusedIndex;
  const displayedIndex = resolvePriceHistoryDisplayIndex(defaultIndex, hoveredIndex, focusedIndex);
  const displayed = displayedIndex === null ? null : points[displayedIndex];
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const plotBaseline = PRICE_HISTORY_CHART_LAYOUT.plotBaselineY;
  const areaPath = points.length > 1 ? `M ${points[0].x} ${plotBaseline} L ${polyline.replaceAll(",", " ")} L ${points[points.length - 1].x} ${plotBaseline} Z` : null;

  return (
    <section className="h-full rounded-lg border border-border p-3" data-price-history-card data-product-id={productId}>
      <p className="text-[11px] font-black text-primary">역대 최저가 추이</p>
      <div className="relative mt-2 min-h-64 w-full overflow-visible" onMouseLeave={() => setHoveredIndex(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-64 w-full overflow-visible" role="img" aria-label={`${productId} 저장 가격 이력 ${points.length}개`}>
          <line x1={PADDING.left} y1={plotBaseline} x2={WIDTH - PADDING.right} y2={plotBaseline} className="stroke-border/40" strokeWidth="1" data-price-plot-baseline />
          {areaPath && <path d={areaPath} fill="currentColor" opacity="0.12" className="text-accent" data-price-area data-area-baseline={plotBaseline} />}
          {points.length > 1 && <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" vectorEffect="non-scaling-stroke" />}
          <line x1={PADDING.left} y1={PRICE_HISTORY_CHART_LAYOUT.axisY} x2={WIDTH - PADDING.right} y2={PRICE_HISTORY_CHART_LAYOUT.axisY} className="stroke-border" strokeWidth="1" data-price-axis-baseline />
          {points.map((point, index) => {
            const isDisplayed = displayedIndex === index;
            const isHistoricalLow = defaultIndex === index;
            return (
              <g key={`${point.date}-${index}`} data-price-point data-date={point.date} data-price={point.lowestPrice} data-historical-lowest={isHistoricalLow || undefined}>
                {isDisplayed && <circle cx={point.x} cy={point.y} r="12" fill="currentColor" opacity="0.14" className="pointer-events-none text-accent" data-price-highlight-halo aria-hidden="true" />}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isDisplayed ? 7 : 5}
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.date} ${won(point.lowestPrice)}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  className="cursor-pointer fill-card stroke-accent outline-none transition-all focus:stroke-[5px]"
                  strokeWidth={isDisplayed ? 4 : 3}
                />
                {axisLabelIndexes.has(index) && (
                  <text x={point.x} y={PRICE_HISTORY_CHART_LAYOUT.axisLabelY} textAnchor="middle" className="fill-muted-foreground text-sm">{formatPriceHistoryAxisDate(point.date)}</text>
                )}
              </g>
            );
          })}
        </svg>
        {displayed && (
          <div
            role={transientIndex === null ? undefined : "tooltip"}
            data-default-price-label={transientIndex === null || undefined}
            className="pointer-events-none absolute z-10 min-w-28 rounded-lg border border-border bg-card px-3 py-2 text-center shadow-lg"
            style={{
              left: `${displayed.x / WIDTH * 100}%`,
              top: `${displayed.y / HEIGHT * 100}%`,
              transform: displayed.x < 100 ? "translate(0, -100%)" : displayed.x > WIDTH - 100 ? "translate(-100%, -100%)" : "translate(-50%, -100%)",
            }}
          >
            {transientIndex !== null && <p className="text-xs font-bold text-muted-foreground">{displayed.date}</p>}
            <p className={transientIndex === null ? "text-xs font-black text-primary" : "mt-0.5 text-xs font-black text-primary"}>{won(displayed.lowestPrice)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
