export const REFRIGERATOR_CRITERIA = {
  householdCapacityRanges: [
    { maxPeople: 2, minLiters: 300, maxLiters: 500 },
    { maxPeople: 4, minLiters: 600, maxLiters: 800 },
    { maxPeople: Number.POSITIVE_INFINITY, minLiters: 700, maxLiters: 900 },
  ],
  defaults: { indirectOrFanCoolingRequired: true, inverterRequired: true, minimumCoreWarrantyYears: 10, freestandingRequired: true },
  weights: { budget: 22, capacity: 28, efficiency: 14, warranty: 16, convenience: 10, marketPrice: 10 },
} as const;

export const getRecommendedCapacityRange = (householdSize: number) => {
  const range = REFRIGERATOR_CRITERIA.householdCapacityRanges.find(({ maxPeople }) => householdSize <= maxPeople);
  return range ?? REFRIGERATOR_CRITERIA.householdCapacityRanges.at(-1)!;
};
