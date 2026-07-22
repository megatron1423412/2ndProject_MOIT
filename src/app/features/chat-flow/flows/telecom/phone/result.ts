import type { FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { PHONE_MOCK_RESULT, getPlanSpec } from "./mockData";

// FlowAnswers가 누락되었을 가능성을 대비해 Record<string, any> 타입을 바인딩합니다.
export const buildPhoneResult = (answers: Record<string, any>): FlowResult => {
  const baseResult = createTelecomMockResult({ namespace: "phone", answers, savingsRate: 0.28, ...PHONE_MOCK_RESULT });
  
  // Calculate savings and rate for grading
  const carrier = answers["phone.carrier"] || "skt";
  const currentFee = Number(answers["phone.currentFee"]) || 0;
  
  const rawSelectedPlan = (answers["phone.manualSelectedPlan"] && answers["phone.manualSelectedPlan"] !== "direct-choose")
    ? (answers["phone.manualSelectedPlan"] as string)
    : (answers["phone.selectedRecommendedPlan"] as string) || "";

  let selectedPlanClean = rawSelectedPlan.replace(/^\[추천\s*\d+순위\]\s*/, "").trim();
  if (selectedPlanClean.startsWith("plan-api|")) {
    selectedPlanClean = selectedPlanClean.split("|")[1];
  }

  const priceMatch = selectedPlanClean.match(/월\s*([\d,]+)원/);
  let selectedPrice = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) : 0;

  if (!selectedPrice) {
    const spec = getPlanSpec(rawSelectedPlan, carrier, currentFee);
    selectedPrice = spec.price;
  }

  const discountOption = answers["phone.discountOption"];
  const discountOptions = Array.isArray(discountOption) ? discountOption : [discountOption];
  const hasSelectDiscount = discountOptions.includes("select-discount");
  const recommendedPaidFee = hasSelectDiscount ? Math.round(selectedPrice * 0.75) : selectedPrice;

  const saving = currentFee > 0 ? Math.max(0, currentFee - recommendedPaidFee) : 0;
  const savingRate = currentFee > 0 ? (saving / currentFee) : 0;

  const isExit = answers["phone.exitRestart"] === "exit" || answers["phone.askGrade"] === "no";
  const isGrade = answers["phone.askGrade"] === "yes";

  return {
    ...baseResult,
    metadata: {
      ...baseResult.metadata,
      category: isExit ? "completed-exit" : (isGrade ? "phone-grade" : "phone"),
      saving,
      savingRate,
      answers,
    },
  };
};