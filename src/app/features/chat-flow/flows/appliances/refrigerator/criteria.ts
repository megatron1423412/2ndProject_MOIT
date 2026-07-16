import type { FlowAnswers } from "../../../core/types";

export const REFRIGERATOR_CAPACITY_STAGES = [
  { value: "under-500", label: "500L 이하", minLiters: 0, maxLiters: 500, targetLiters: 450 },
  { value: "500-600", label: "500~600L", minLiters: 500, maxLiters: 600, targetLiters: 550 },
  { value: "600-800", label: "600~800L", minLiters: 600, maxLiters: 800, targetLiters: 700 },
  { value: "over-800", label: "800L 이상", minLiters: 800, maxLiters: Number.POSITIVE_INFINITY, targetLiters: 850 },
] as const;

export type RefrigeratorCapacityStage = (typeof REFRIGERATOR_CAPACITY_STAGES)[number];
export type RefrigeratorValuePriority = "low-purchase-price" | "good-current-price" | "electricity-saving" | "storage-convenience" | "balanced";

const HOUSEHOLD_BASE_STAGE: Record<string, number> = { "1": 0, "2": 1, "3-4": 2, "5-plus": 3 };
const STORAGE_STAGE_ADJUSTMENT: Record<string, number> = { "small-frequent": -1, bulk: 1, "frozen-meal-prep": 1, general: 0 };
const normalizeHouseholdSize = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value <= 1 ? "1" : value === 2 ? "2" : value <= 4 ? "3-4" : "5-plus";
  return String(value);
};

export const getRecommendedCapacityStage = (householdSize: unknown, storageHabit: unknown): RefrigeratorCapacityStage => {
  const baseIndex = HOUSEHOLD_BASE_STAGE[normalizeHouseholdSize(householdSize)] ?? 0;
  const adjustment = STORAGE_STAGE_ADJUSTMENT[String(storageHabit)] ?? 0;
  const index = Math.max(0, Math.min(REFRIGERATOR_CAPACITY_STAGES.length - 1, baseIndex + adjustment));
  return REFRIGERATOR_CAPACITY_STAGES[index];
};

export const getCapacityStage = (value: unknown): RefrigeratorCapacityStage =>
  REFRIGERATOR_CAPACITY_STAGES.find((stage) => stage.value === value) ?? REFRIGERATOR_CAPACITY_STAGES[0];

export const getSelectedCapacityRange = (answers: FlowAnswers): RefrigeratorCapacityStage =>
  answers["refrigerator.capacityMode"] === "custom"
    ? getCapacityStage(answers["refrigerator.customCapacity"])
    : getRecommendedCapacityStage(answers["refrigerator.householdSize"], answers["refrigerator.storageHabit"]);

/** Kept as the public range helper used by existing consumers. */
export const getRecommendedCapacityRange = (householdSize: unknown, storageHabit: unknown = "general") =>
  getRecommendedCapacityStage(householdSize, storageHabit);

export interface RefrigeratorRankingWeights {
  currentPrice: number;
  marketPrice: number;
  capacity: number;
  energyGrade: number;
  inverter: number;
  warranty: number;
  cooling: number;
  storageConvenience: number;
}

const RANKING_WEIGHTS: Record<RefrigeratorValuePriority, RefrigeratorRankingWeights> = {
  "low-purchase-price": { currentPrice: 42, marketPrice: 8, capacity: 16, energyGrade: 10, inverter: 6, warranty: 7, cooling: 6, storageConvenience: 5 },
  "good-current-price": { currentPrice: 28, marketPrice: 30, capacity: 14, energyGrade: 9, inverter: 5, warranty: 6, cooling: 4, storageConvenience: 4 },
  "electricity-saving": { currentPrice: 16, marketPrice: 8, capacity: 15, energyGrade: 32, inverter: 14, warranty: 7, cooling: 6, storageConvenience: 2 },
  "storage-convenience": { currentPrice: 15, marketPrice: 7, capacity: 30, energyGrade: 8, inverter: 5, warranty: 7, cooling: 5, storageConvenience: 23 },
  balanced: { currentPrice: 22, marketPrice: 15, capacity: 22, energyGrade: 14, inverter: 8, warranty: 8, cooling: 7, storageConvenience: 4 },
};

export const getRefrigeratorRankingWeights = (answers: FlowAnswers): RefrigeratorRankingWeights =>
  RANKING_WEIGHTS[String(answers["refrigerator.valuePriority"] ?? "balanced") as RefrigeratorValuePriority] ?? RANKING_WEIGHTS.balanced;
