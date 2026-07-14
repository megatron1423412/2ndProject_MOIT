import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { INTERNET_MOCK_RESULT } from "./mockData";

// 요금제 가격 정보 반환 헬퍼
const getInternetPlanPrice = (planValue: string): number => {
  switch (planValue) {
    case "rec-internet-1":
    case "plan-internet-2":
      return 33000; // 500Mbps
    case "rec-internet-2":
    case "plan-internet-3":
      return 38500; // 1Gbps
    case "plan-internet-1":
      return 22000; // 100Mbps
    case "plan-internet-4":
      return 44000; // 2.5Gbps
    default:
      return 33000; // 기본값 500Mbps
  }
};

export const buildInternetResult = (answers: Record<string, any>): FlowResult => {
  const baseResult = createTelecomMockResult({ namespace: "internet", answers, savingsRate: 0.2, ...INTERNET_MOCK_RESULT });
  
  const currentFee = Number(answers["internet.fee"]) || 0;
  const selectedRecommendedPlan = answers["internet.selectedRecommendedPlan"] || "rec-internet-1";
  const manualSelectedPlan = answers["internet.manualSelectedPlan"] || "";

  // 최종 채택된 추천 요금제값 결정
  const finalPlan = (selectedRecommendedPlan === "direct-choose" && manualSelectedPlan)
    ? manualSelectedPlan
    : (selectedRecommendedPlan || manualSelectedPlan || "rec-internet-1");

  const recommendedPrice = getInternetPlanPrice(finalPlan);
  const saving = currentFee - recommendedPrice;
  const savingRate = currentFee > 0 ? (saving / currentFee) : 0;

  const isExit = answers["internet.exitRestart"] === "exit" || answers["internet.askGrade"] === "no";
  const isGrade = answers["internet.askGrade"] === "yes";

  return {
    ...baseResult,
    metadata: {
      ...baseResult.metadata,
      category: isExit ? "completed-exit" : (isGrade ? "internet-grade" : "internet"),
      saving,
      savingRate,
      answers,
    },
  };
};
