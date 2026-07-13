export const TV_CRITERIA = {
  defaults: { fourKRequired: true, minimumWarrantyYears: 2 },
  weights: { budget: 25, specifications: 30, efficiency: 12, warranty: 13, convenience: 10, marketPrice: 10 },
} as const;
