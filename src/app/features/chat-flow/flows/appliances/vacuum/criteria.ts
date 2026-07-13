export const VACUUM_CRITERIA = {
  defaults: { minimumAw: 200, minimumPa: 25_000, minimumHepaGrade: "H13" as const },
  weights: { budget: 24, suction: 28, filtration: 14, warranty: 8, convenience: 16, marketPrice: 10 },
} as const;
