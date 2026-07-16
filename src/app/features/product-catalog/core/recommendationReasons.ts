import type { PriceHistoryPoint, RecommendationReasonItem } from "./types";
import { summarizeStoredPriceHistory } from "./priceHistory";

const won = (value: number) => `${Math.abs(value).toLocaleString("ko-KR")}원`;

export const reasonItem = (label: string, description: string): RecommendationReasonItem => ({ label, description });

export const createHistoricalPriceReason = (
  currentPrice: number,
  history: readonly PriceHistoryPoint[],
): RecommendationReasonItem | null => {
  const summary = summarizeStoredPriceHistory(currentPrice, history);
  if (!summary) return null;
  if (summary.differenceFromLow === 0) return reasonItem("현재 가격", "현재가는 저장된 역대 최저가와 같아요.");
  const direction = summary.differenceFromLow > 0 ? "높아요" : "낮아요";
  return reasonItem(
    "현재 가격",
    `현재가는 저장된 역대 최저가보다 ${won(summary.differenceFromLow)}(${Math.abs(summary.percentAboveLow)}%) ${direction}.`,
  );
};

export const createBudgetReason = (currentPrice: number, budget: number): RecommendationReasonItem | null => {
  if (!Number.isFinite(budget) || budget <= 0) return null;
  return reasonItem(
    "가성비 기준",
    currentPrice <= budget
      ? `현재가가 설정한 ${budget.toLocaleString("ko-KR")}원 예산 안에 있어요.`
      : `현재가와 설정한 ${budget.toLocaleString("ko-KR")}원 예산의 차이를 추천 점수에 반영했어요.`,
  );
};
