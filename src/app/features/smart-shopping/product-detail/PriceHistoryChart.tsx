import React, { useMemo, useState } from "react";
import { getValidPriceHistory } from "../../product-catalog/core/priceHistory";
import type { PriceHistoryPoint } from "../../product-catalog/core/types";

export const PRICE_HISTORY_CHART_LAYOUT = {
  width: 640,
  height: 260,
  padding: { left: 33, right: 33 },
  plotTopY: 45,
  plotBaselineY: 180,
  axisY: 228,
  axisLabelY: 255,
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

export default function PriceHistoryChart({ productId, history, style }: { productId: string; history: readonly PriceHistoryPoint[]; style?: React.CSSProperties }) {
  const points = useMemo(() => buildPriceHistoryChartPoints(history), [history]);
  const pointIdentity = points.map(({ date, lowestPrice }) => `${date}:${lowestPrice}`).join("|");
  return <InteractivePriceHistoryChart key={`${productId}|${pointIdentity}`} productId={productId} points={points} style={style} />;
}

function InteractivePriceHistoryChart({ productId, points, style }: { productId: string; points: PriceHistoryChartPoint[]; style?: React.CSSProperties }) {
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
      <section className="h-full min-h-[220px] w-full flex flex-col justify-between rounded-2xl border border-slate-100/90 bg-white p-4 shadow-2xs" data-price-history-card data-product-id={productId} style={style}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[#2A6CB6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h4 className="text-sm font-extrabold text-[#1F2937]">역대 최저가 추이</h4>
          </div>
          <span className="rounded-full bg-[#F5F7FA] px-2.5 py-0.5 text-xs font-medium text-slate-400">90일</span>
        </div>
        <div className="mt-4 flex flex-1 min-h-[140px] items-center justify-center rounded-xl bg-[#F5F7FA]/60 px-4 text-center text-xs text-slate-400">저장된 가격 이력이 없습니다.</div>
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
    <section className="h-full min-h-[220px] w-full flex flex-col justify-between rounded-2xl border border-slate-100/90 bg-white p-4 shadow-2xs" data-price-history-card data-product-id={productId} style={style}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <svg className="h-4 w-4 text-[#2A6CB6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h4 className="text-sm font-extrabold text-[#1F2937]">역대 최저가 추이</h4>
        </div>
        <span className="rounded-full bg-[#F5F7FA] px-2.5 py-0.5 text-xs font-medium text-slate-400">90일</span>
      </div>

      <div className="relative mt-1 flex-1 w-full flex items-center justify-center overflow-visible" onMouseLeave={() => setHoveredIndex(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full max-h-full overflow-visible" role="img" aria-label={`${productId} 저장 가격 이력 ${points.length}개`} data-price-chart-svg>
          <defs>
            <linearGradient id={`chartGradient-${productId.replace(/[^a-zA-Z0-9_-]/g, "_")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2A6CB6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2A6CB6" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {areaPath && <path d={areaPath} fill={`url(#chartGradient-${productId.replace(/[^a-zA-Z0-9_-]/g, "_")})`} data-price-area data-area-baseline={axisBaseline} />}
          {points.length > 1 && <polyline points={polyline} fill="none" stroke="#2A6CB6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />}
          <line x1={PADDING.left} y1={PRICE_HISTORY_CHART_LAYOUT.axisY} x2={WIDTH - PADDING.right} y2={PRICE_HISTORY_CHART_LAYOUT.axisY} stroke="#E2E8F0" strokeWidth="1" data-price-axis-baseline />
          {displayed && bubblePlacement && (
            <PricePointBubble point={displayed} placement={bubblePlacement} transient={transientIndex !== null} />
          )}
          {points.map((point, index) => {
            const isDisplayed = displayedIndex === index;
            const isHistoricalLow = defaultIndex === index;
            return (
              <g key={`${point.date}-${index}`} data-price-point data-date={point.date} data-price={point.lowestPrice} data-historical-lowest={isHistoricalLow || undefined}>
                {isDisplayed && <circle cx={point.x} cy={point.y} r="10" fill="#2A6CB6" opacity="0.15" data-price-highlight-halo aria-hidden="true" />}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isDisplayed ? 6 : 4}
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.date} ${won(point.lowestPrice)}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  className="cursor-pointer fill-white stroke-[#2A6CB6] outline-none transition-all focus:stroke-[4px]"
                  strokeWidth={isDisplayed ? 3 : 2}
                />
                {axisLabelIndexes.has(index) && (
                  <text x={point.x} y={PRICE_HISTORY_CHART_LAYOUT.axisLabelY} textAnchor="middle" className="fill-slate-400 text-xs font-medium">{formatPriceHistoryAxisDate(point.date)}</text>
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
      <path d={`M ${placement.anchorX - 5} ${bubbleBottom - 1} L ${placement.anchorX + 5} ${bubbleBottom - 1} L ${point.x} ${tailTipY} Z`} fill="white" stroke="#BFDBFE" strokeWidth="1" data-price-bubble-pointer data-pointer-tip-x={point.x} data-pointer-tip-y={tailTipY} />
      <rect x={placement.x} y={placement.y} width={placement.width} height={placement.height} rx="8" fill="white" stroke="#BFDBFE" strokeWidth="1" className="drop-shadow-xs" />
      {transient && <text x={placement.x + placement.width / 2} y={placement.y + 18} textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold">{point.date}</text>}
      <text x={placement.x + placement.width / 2} y={placement.y + (transient ? 38 : 25)} textAnchor="middle" className="fill-[#1E3ABA] text-xs font-extrabold">{won(point.lowestPrice)}</text>
    </g>
  );
}
