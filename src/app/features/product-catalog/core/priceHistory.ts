import type { PriceHistoryPoint } from "./types";

export interface PriceHistorySummary {
  allTimeLow: number;
  averagePrice: number;
  differenceFromLow: number;
  percentAboveLow: number;
}

/** Detail charts and metrics use only valid stored points, ordered by the stored date. */
export const getValidPriceHistory = (history: readonly PriceHistoryPoint[]): PriceHistoryPoint[] =>
  history
    .filter(({ date, lowestPrice }) => typeof date === "string" && !Number.isNaN(Date.parse(date)) && Number.isFinite(lowestPrice) && lowestPrice > 0)
    .map((point) => ({ ...point }))
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));

/** Truthful detail summary: no history means no derived historical metrics. */
export const summarizeStoredPriceHistory = (
  currentPrice: number,
  history: readonly PriceHistoryPoint[],
): PriceHistorySummary | null => {
  const prices = getValidPriceHistory(history).map(({ lowestPrice }) => lowestPrice);
  if (prices.length === 0) return null;
  const allTimeLow = Math.min(...prices);
  const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const differenceFromLow = currentPrice - allTimeLow;
  const percentAboveLow = allTimeLow > 0 ? Math.round((differenceFromLow / allTimeLow) * 1000) / 10 : 0;
  return { allTimeLow, averagePrice, differenceFromLow, percentAboveLow };
};

export const summarizePriceHistory = (
  currentPrice: number,
  history: PriceHistoryPoint[],
): PriceHistorySummary => {
  return summarizeStoredPriceHistory(currentPrice, history)
    ?? { allTimeLow: currentPrice, averagePrice: currentPrice, differenceFromLow: 0, percentAboveLow: 0 };
};

/** 낮을수록 좋은 현재가의 시세 위치를 0~100 점으로 변환합니다. */
export const getPricePositionScore = (currentPrice: number, history: PriceHistoryPoint[]) => {
  const { allTimeLow, averagePrice } = summarizePriceHistory(currentPrice, history);
  if (averagePrice <= allTimeLow) return 100;
  const position = (currentPrice - allTimeLow) / (averagePrice - allTimeLow);
  return Math.max(0, Math.min(100, Math.round(100 - position * 50)));
};
