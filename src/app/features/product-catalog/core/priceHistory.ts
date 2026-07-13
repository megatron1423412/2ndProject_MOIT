import type { PriceHistoryPoint } from "./types";

export interface PriceHistorySummary {
  allTimeLow: number;
  averagePrice: number;
  differenceFromLow: number;
  percentAboveLow: number;
}

export const summarizePriceHistory = (
  currentPrice: number,
  history: PriceHistoryPoint[],
): PriceHistorySummary => {
  const prices = history.map(({ lowestPrice }) => lowestPrice).filter(Number.isFinite);
  if (prices.length === 0) {
    return { allTimeLow: currentPrice, averagePrice: currentPrice, differenceFromLow: 0, percentAboveLow: 0 };
  }
  const allTimeLow = Math.min(...prices);
  const averagePrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
  const differenceFromLow = currentPrice - allTimeLow;
  const percentAboveLow = allTimeLow > 0 ? Math.round((differenceFromLow / allTimeLow) * 1000) / 10 : 0;
  return { allTimeLow, averagePrice, differenceFromLow, percentAboveLow };
};

/** 낮을수록 좋은 현재가의 시세 위치를 0~100 점으로 변환합니다. */
export const getPricePositionScore = (currentPrice: number, history: PriceHistoryPoint[]) => {
  const { allTimeLow, averagePrice } = summarizePriceHistory(currentPrice, history);
  if (averagePrice <= allTimeLow) return 100;
  const position = (currentPrice - allTimeLow) / (averagePrice - allTimeLow);
  return Math.max(0, Math.min(100, Math.round(100 - position * 50)));
};
