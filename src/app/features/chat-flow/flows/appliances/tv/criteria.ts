import type { FlowAnswers } from "../../../core/types";
import type { TvProduct } from "../../../../product-catalog/core/types";

export const TV_CRITERIA = {
  weights: {
    currentPrice: 25,
    historicalPrice: 20,
    pictureQuality: 20,
    energyGrade: 15,
    warranty: 10,
    smartPlatform: 10,
  },
} as const;

export type TvRankingWeights = Record<keyof typeof TV_CRITERIA.weights, number>;

export const TV_SIZE_BY_DISTANCE: Record<string, 43 | 55 | 65 | 75> = {
  "under-1.5": 43,
  "1.5-2.5": 55,
  "2.5-3": 65,
  "over-3": 75,
};

export const getRecommendedTvSize = (answers: FlowAnswers) =>
  TV_SIZE_BY_DISTANCE[String(answers["tv.viewingDistance"])] ?? 55;

export const getSelectedTvSize = (answers: FlowAnswers) => {
  const directSize = Number(answers["tv.screenSize"]);
  if ([43, 55, 65, 75].includes(directSize)) return directSize;
  const recommendedSize = Number(answers["tv.recommendedScreenSize"]);
  return [43, 55, 65, 75].includes(recommendedSize) ? recommendedSize : getRecommendedTvSize(answers);
};

export const getTvBudget = (answers: FlowAnswers) => {
  const budget = Number(answers["tv.budget"]);
  return Number.isFinite(budget) && budget > 0 ? budget : null;
};

export const getTvRankingWeights = (answers: FlowAnswers): TvRankingWeights => {
  const weights: TvRankingWeights = { ...TV_CRITERIA.weights };
  const usage = answers["tv.dailyUsage"];
  if (usage === "under3") { weights.currentPrice += 10; weights.energyGrade -= 8; }
  if (usage === "over6") { weights.currentPrice -= 8; weights.energyGrade += 10; }

  switch (answers["tv.primaryUse"]) {
    case "broadcast-streaming":
      weights.currentPrice += 5; weights.smartPlatform += 7; weights.pictureQuality += 3;
      break;
    case "movies-dramas":
    case "family-wide-viewing":
      weights.pictureQuality += 12; weights.currentPrice -= 5; weights.smartPlatform -= 2;
      break;
  }

  switch (answers["tv.valuePriority"]) {
    case "low-purchase-price":
      weights.currentPrice += 25; weights.historicalPrice -= 8; weights.pictureQuality -= 8; weights.warranty -= 4; weights.smartPlatform -= 5;
      break;
    case "good-current-price":
      weights.currentPrice -= 5; weights.historicalPrice += 28; weights.pictureQuality -= 7; weights.energyGrade -= 5; weights.smartPlatform -= 5;
      break;
    case "picture-quality":
      weights.currentPrice -= 10; weights.historicalPrice -= 5; weights.pictureQuality += 25; weights.energyGrade -= 5; weights.smartPlatform -= 5;
      break;
    case "electricity-saving":
      weights.currentPrice -= 5; weights.historicalPrice -= 5; weights.pictureQuality -= 8; weights.energyGrade += 23; weights.smartPlatform -= 5;
      break;
  }
  return weights;
};

export const getTvPlatformDisplayLabel = (product: Pick<TvProduct, "brand" | "specs">) => {
  if (product.specs.os === "google-tv") return "Google TV";
  if (product.specs.os === "android-tv") return "Android TV";
  if (/삼성|samsung/i.test(product.brand)) return "Tizen";
  if (/엘지|lg/i.test(product.brand)) return "webOS";
  return "기타 스마트 TV 플랫폼";
};
