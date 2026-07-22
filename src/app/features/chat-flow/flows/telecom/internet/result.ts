import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { INTERNET_MOCK_RESULT, getInternetPlanPrice } from "./mockData";

export const buildInternetResult = (answers: Record<string, any>): FlowResult => {
  const baseResult = createTelecomMockResult({ namespace: "internet", answers, savingsRate: 0.2, ...INTERNET_MOCK_RESULT });
  
  const currentFee = Number(answers["internet.fee"]) || 0;
  const selectedRecommendedPlan = answers["internet.selectedRecommendedPlan"] || "rec-internet-1";
  const manualSelectedPlan = answers["internet.manualSelectedPlan"] || "";

  // 최종 채택된 추천 요금제값 결정
  const finalPlan = (selectedRecommendedPlan === "direct-choose" && manualSelectedPlan)
    ? manualSelectedPlan
    : (selectedRecommendedPlan || manualSelectedPlan || "rec-internet-1");

  let recommendedPrice = 0;
  const priceMatch = String(finalPlan).match(/월\s*([\d,]+)원/);
  if (priceMatch) {
    recommendedPrice = parseInt(priceMatch[1].replace(/,/g, ""), 10);
  } else {
    const contractKey = answers["internet.planContract"] || "discount3y";
    recommendedPrice = getInternetPlanPrice(finalPlan, contractKey);
  }

  const saving = currentFee > 0 ? Math.max(0, currentFee - recommendedPrice) : 0;
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
