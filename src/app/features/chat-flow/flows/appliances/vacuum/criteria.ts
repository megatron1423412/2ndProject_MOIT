import type { FlowAnswers } from "../../../core/types";

export type VacuumUsage = "short-daily" | "whole-home" | "dust-hair" | "allergy" | "balanced";
export type VacuumValuePriority = "low-purchase-price" | "good-current-price" | "strong-suction" | "convenience" | "balanced";

export interface VacuumRankingWeights {
  currentPrice: number;
  marketPrice: number;
  suction: number;
  weight: number;
  filtration: number;
  replaceableBattery: number;
  softRoller: number;
  standingDock: number;
  warranty: number;
}

const PRIORITY_WEIGHTS: Record<VacuumValuePriority, VacuumRankingWeights> = {
  "low-purchase-price": { currentPrice: 35, marketPrice: 12, suction: 14, weight: 10, filtration: 6, replaceableBattery: 6, softRoller: 5, standingDock: 5, warranty: 7 },
  "good-current-price": { currentPrice: 20, marketPrice: 32, suction: 14, weight: 8, filtration: 6, replaceableBattery: 5, softRoller: 4, standingDock: 4, warranty: 7 },
  "strong-suction": { currentPrice: 12, marketPrice: 8, suction: 40, weight: 8, filtration: 6, replaceableBattery: 6, softRoller: 7, standingDock: 4, warranty: 9 },
  convenience: { currentPrice: 14, marketPrice: 8, suction: 10, weight: 20, filtration: 8, replaceableBattery: 12, softRoller: 10, standingDock: 12, warranty: 6 },
  balanced: { currentPrice: 18, marketPrice: 14, suction: 20, weight: 12, filtration: 10, replaceableBattery: 8, softRoller: 6, standingDock: 5, warranty: 7 },
};

const add = (weights: VacuumRankingWeights, key: keyof VacuumRankingWeights, amount: number) => {
  weights[key] += amount;
};

export const getVacuumRankingWeights = (answers: FlowAnswers): VacuumRankingWeights => {
  const priority = String(answers["vacuum.valuePriority"] ?? "balanced") as VacuumValuePriority;
  const weights = { ...(PRIORITY_WEIGHTS[priority] ?? PRIORITY_WEIGHTS.balanced) };
  const usage = String(answers["vacuum.primaryUse"] ?? "balanced") as VacuumUsage;

  if (usage === "short-daily") { add(weights, "weight", 10); add(weights, "standingDock", 8); }
  if (usage === "whole-home") { add(weights, "suction", 10); add(weights, "replaceableBattery", 10); }
  if (usage === "dust-hair") { add(weights, "suction", 10); add(weights, "softRoller", 10); }
  if (usage === "allergy") add(weights, "filtration", 20);

  const floor = answers["vacuum.floorEnvironment"];
  if (floor === "hard-floor") add(weights, "softRoller", 10);
  if (floor === "carpet-rug") add(weights, "suction", 12);

  const weightImportance = answers["vacuum.weightImportance"];
  if (weightImportance === "very") add(weights, "weight", 16);
  if (weightImportance === "somewhat") add(weights, "weight", 8);
  if (weightImportance === "none") weights.weight = 0;

  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, total > 0 ? value / total * 100 : 0])) as unknown as VacuumRankingWeights;
};
