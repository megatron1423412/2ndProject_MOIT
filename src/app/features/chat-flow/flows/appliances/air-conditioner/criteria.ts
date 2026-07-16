import type { FlowAnswers } from "../../../core/types";

export const AIR_CONDITIONER_CRITERIA = {
  recommendedCoolingAreaCoefficient: 0.5,
  weights: {
    currentPrice: 30,
    historicalPrice: 25,
    energyGrade: 30,
    autoDry: 15,
  },
} as const;

export const calculateRecommendedCoolingArea = (homePyeong: number) =>
  Math.max(1, Math.ceil(homePyeong * AIR_CONDITIONER_CRITERIA.recommendedCoolingAreaCoefficient));

export const getRequiredCoolingArea = (answers: FlowAnswers) => {
  const selectedArea = answers["airConditioner.coolingAreaMode"] === "custom"
    ? answers["airConditioner.customCoolingArea"]
    : answers["airConditioner.actualCoolingArea"];
  const directArea = Number(selectedArea);
  if (Number.isFinite(directArea) && directArea > 0) return directArea;
  return calculateRecommendedCoolingArea(Number(answers["airConditioner.homePyeong"]));
};

export const getSelectedAirConditionerType = (answers: FlowAnswers) => {
  const directType = answers["airConditioner.directType"];
  return directType ?? answers["airConditioner.type"];
};
