import type { FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { PHONE_MOCK_RESULT, getPlanSpec } from "./mockData";

// FlowAnswers가 누락되었을 가능성을 대비해 Record<string, any> 타입을 바인딩합니다.
export const buildPhoneResult = (answers: Record<string, any>): FlowResult => {
  const baseResult = createTelecomMockResult({ namespace: "phone", answers, savingsRate: 0.28, ...PHONE_MOCK_RESULT });
  
  // Calculate savings and rate for grading
  const carrier = answers["phone.carrier"] || "skt";
  const currentFee = Number(answers["phone.currentFee"]) || 0;
  const confirmedPlanRaw = answers["phone.confirmedPlan"] || "";
  const confirmedPlan = (confirmedPlanRaw === "direct-input" || confirmedPlanRaw === "direct-select")
    ? (answers["phone.customPlan"] || "")
    : (confirmedPlanRaw || answers["phone.customPlan"] || "");
  const selectedRecommendedPlan = answers["phone.selectedRecommendedPlan"] || "rec-mock-1";
  const dataVolume = answers["phone.dataVolume"] || "mid";

  const currentSpec = getPlanSpec(confirmedPlan, carrier, currentFee, dataVolume);
  const recommendedSpec = getPlanSpec(selectedRecommendedPlan);

  const saving = currentSpec.price - recommendedSpec.price;
  const savingRate = currentSpec.price > 0 ? (saving / currentSpec.price) : 0;

  const isGrade = answers["phone.askGrade"] === "yes";

  return {
    ...baseResult,
    metadata: {
      ...baseResult.metadata,
      category: isGrade ? "phone-grade" : "phone",
      saving,
      savingRate,
      answers,
    },
  };
};