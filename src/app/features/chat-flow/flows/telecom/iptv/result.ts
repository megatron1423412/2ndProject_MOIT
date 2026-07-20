// src/app/features/chat-flow/flows/telecom/iptv/result.ts

import type { FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { IPTV_MOCK_RESULT, mockIptvPlans } from "./mockData";

export const buildIptvResult = (answers: Record<string, any>): FlowResult => {
  const baseResult = createTelecomMockResult({ namespace: "iptv", answers, savingsRate: 0.14, ...IPTV_MOCK_RESULT });
  
  const currentPriceInput = Number(answers["iptv.currentPlanPriceInput"] || 0);
  const selectedNewPlan = answers["iptv.selectedNewPlan"];
  const selectedPlanId = (selectedNewPlan && selectedNewPlan !== "direct-choose")
    ? selectedNewPlan
    : (answers["iptv.selectedNewPlanDirect"] || answers["iptv.manualSelectedPlan"]);
  const selectedPlan = mockIptvPlans.find((p) => p.id === selectedPlanId);

  const desiredContract = (answers["iptv.desiredContract"] as string) || "3years";
  const priceMap = selectedPlan?.prices?.single as Record<string, number | undefined> | undefined;
  const selectedPrice = priceMap
    ? (priceMap[desiredContract] || priceMap["3years"] || priceMap["none"] || 0)
    : 0;

  const saving = currentPriceInput - selectedPrice;
  const savingRate = currentPriceInput > 0 ? (saving / currentPriceInput) : 0;

  const isExit = answers["iptv.exitRestart"] === "exit" || answers["iptv.askGrade"] === "no";
  const isGrade = answers["iptv.askGrade"] === "yes";

  return {
    ...baseResult,
    metadata: {
      ...baseResult.metadata,
      category: isExit ? "completed-exit" : (isGrade ? "iptv-grade" : "iptv"),
      saving,
      savingRate,
      answers,
    },
  };
};
