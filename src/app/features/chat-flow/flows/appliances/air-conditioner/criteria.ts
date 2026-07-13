export const AIR_CONDITIONER_CRITERIA = {
  recommendedCoolingAreaCoefficient: 0.5,
  defaults: {
    inverterRequired: true,
    officialInstallationRequired: true,
    autoDryRequired: true,
  },
  weights: {
    budget: 25,
    typeAndCapacity: 25,
    efficiency: 18,
    installation: 12,
    convenience: 10,
    marketPrice: 10,
  },
} as const;

export const calculateRecommendedCoolingArea = (homePyeong: number) =>
  Math.max(1, Math.ceil(homePyeong * AIR_CONDITIONER_CRITERIA.recommendedCoolingAreaCoefficient));
