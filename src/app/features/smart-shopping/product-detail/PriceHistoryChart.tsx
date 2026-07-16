import React, { useMemo, useState } from "react";
import { getValidPriceHistory } from "../../product-catalog/core/priceHistory";
import type { PriceHistoryPoint } from "../../product-catalog/core/types";

export const PRICE_HISTORY_CHART_LAYOUT = {
  width: 640,
  height: 340,
  padding: { left: 42, right: 24 },
  plotTopY: 88,
  plotBaselineY: 224,
  axisY: 276,
  axisLabelY: 310,
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
  const chartHeight = PRICE_HISTORY_CHART_LAYOUT.plotBaselineY - PRICE_HISTORY_CHART_LAYOUT.plotTopY;
  return validHistory.map((point, index) => ({
    ...point,
    x: timestampRange === 0 ? PADDING.left + chartWidth / 2 : PADDING.left + (timestamps[index] - firstTimestamp) / timestampRange * chartWidth,
    y: range === 0 ? PRICE_HISTORY_CHART_LAYOUT.plotTopY + chartHeight / 2 : PRICE_HISTORY_CHART_LAYOUT.plotTopY + (max - point.lowestPrice) / range * chartHeight,
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

export interface PriceBubblePlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  anchorX: number;
  placement: "above" | "above-clamped-left" | "above-clamped-right";
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

/** Centers the attached bubble above its point, clamping only at the chart edges. */
export const getPriceBubblePlacement = (
  points: readonly PriceHistoryChartPoint[],
  activeIndex: number,
  transient = false,
): PriceBubblePlacement => {
  const point = points[activeIndex];
  const width = transient ? 156 : 126;
  const height = transient ? 58 : 42;
  const margin = 8;
  const desiredX = point.x - width / 2;
  const x = clamp(desiredX, margin, WIDTH - width - margin);
  const y = Math.max(margin, point.y - height - 22);
  const placement = x > desiredX
    ? "above-clamped-left"
    : x < desiredX
      ? "above-clamped-right"
      : "above";
  return {
    x,
    y,
    width,
    height,
    anchorX: clamp(point.x, x + 16, x + width - 16),
    placement,
  };
};

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
  const bubblePlacement = displayedIndex === null ? null : getPriceBubblePlacement(points, displayedIndex, transientIndex !== null);
  const polyline = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const axisBaseline = PRICE_HISTORY_CHART_LAYOUT.axisY;
  const areaPath = points.length > 1 ? `M ${points[0].x} ${axisBaseline} L ${polyline.replaceAll(",", " ")} L ${points[points.length - 1].x} ${axisBaseline} Z` : null;

  return (
    <section className="h-full rounded-lg border border-border p-3" data-price-history-card data-product-id={productId}>
      <p className="text-[11px] font-black text-primary">역대 최저가 추이</p>
      <div className="relative mt-2 min-h-72 w-full overflow-visible" onMouseLeave={() => setHoveredIndex(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-72 w-full overflow-visible" role="img" aria-label={`${productId} 저장 가격 이력 ${points.length}개`} data-price-chart-svg>
          {areaPath && <path d={areaPath} fill="currentColor" opacity="0.12" className="text-accent" data-price-area data-area-baseline={axisBaseline} />}
          {points.length > 1 && <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="3" className="text-accent" vectorEffect="non-scaling-stroke" />}
          <line x1={PADDING.left} y1={PRICE_HISTORY_CHART_LAYOUT.axisY} x2={WIDTH - PADDING.right} y2={PRICE_HISTORY_CHART_LAYOUT.axisY} className="stroke-border" strokeWidth="1" data-price-axis-baseline />
          {displayed && bubblePlacement && (
            <PricePointBubble point={displayed} placement={bubblePlacement} transient={transientIndex !== null} />
          )}
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
      </div>
    </section>
  );
}

function PricePointBubble({ point, placement, transient }: { point: PriceHistoryChartPoint; placement: PriceBubblePlacement; transient: boolean }) {
  const bubbleBottom = placement.y + placement.height;
  const tailTipY = point.y;
  return (
    <g
      role={transient ? "tooltip" : undefined}
      aria-label={transient ? `${point.date} ${won(point.lowestPrice)}` : won(point.lowestPrice)}
      className="pointer-events-none"
      data-price-point-bubble
      data-default-price-label={!transient || undefined}
      data-bubble-placement={placement.placement}
      data-bubble-x={placement.x}
      data-bubble-y={placement.y}
      data-bubble-center-x={placement.x + placement.width / 2}
      data-bubble-pointer-x={point.x}
    >
      <path d={`M ${placement.anchorX - 6} ${bubbleBottom - 1} L ${placement.anchorX + 6} ${bubbleBottom - 1} L ${point.x} ${tailTipY} Z`} className="fill-card stroke-border" strokeWidth="1" data-price-bubble-pointer data-pointer-tip-x={point.x} data-pointer-tip-y={tailTipY} />
      <rect x={placement.x} y={placement.y} width={placement.width} height={placement.height} rx="10" className="fill-card stroke-border drop-shadow-sm" strokeWidth="1" />
      {transient && <text x={placement.x + placement.width / 2} y={placement.y + 21} textAnchor="middle" className="fill-muted-foreground text-xs font-bold">{point.date}</text>}
      <text x={placement.x + placement.width / 2} y={placement.y + (transient ? 44 : 27)} textAnchor="middle" className="fill-primary text-sm font-black">{won(point.lowestPrice)}</text>
    </g>
  );
}
