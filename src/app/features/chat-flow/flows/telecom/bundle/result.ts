// src/app/features/chat-flow/flows/telecom/bundle/result.ts

import type { FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { BUNDLE_MOCK_RESULT, mockBundlePlans } from "./mockData";

export const buildBundleResult = (answers: Record<string, any>): FlowResult => {
  const baseResult = createTelecomMockResult({
    namespace: "bundle",
    answers,
    savingsRate: 0.24,
    ...BUNDLE_MOCK_RESULT,
  });

  const currentFee = Number(answers["bundle.currentFee"] || 0);

  const desiredCarrier = answers["bundle.desiredCarrier"] as string;
  const selectedPlanId = answers["bundle.selectedRecommendedPlan"] || answers["bundle.manualSelectedPlan"];
  const customPlanName = answers["bundle.customPlanName"] as string;

  let selectedPrice = 0;

  if (customPlanName) {
    const matchingPlans = mockBundlePlans.filter((p) => p.carrier === desiredCarrier);
    const avgPrice = matchingPlans.length > 0 
      ? Math.round(matchingPlans.reduce((sum, p) => sum + p.price, 0) / matchingPlans.length)
      : 45000;
    selectedPrice = avgPrice;
  } else {
    const selectedPlan = mockBundlePlans.find((p) => p.id === selectedPlanId);
    if (selectedPlan) {
      selectedPrice = selectedPlan.price;
    } else {
      selectedPrice = 55000;
    }
  }

  const saving = currentFee - selectedPrice;
  const savingRate = currentFee > 0 ? saving / currentFee : 0;

  const isGrade = answers["bundle.askGrade"] === "yes";

  return {
    ...baseResult,
    metadata: {
      ...baseResult.metadata,
      category: isGrade ? "bundle-grade" : "bundle",
      saving,
      savingRate,
      answers,
    },
  };
};
