import type { FlowAnswers } from "../../../core/types";
import { getPricePositionScore, getValidPriceHistory } from "../../../../product-catalog/core/priceHistory";
import { createHistoricalPriceReason, reasonItem } from "../../../../product-catalog/core/recommendationReasons";
import { dataCompleteness, sortRecommendations } from "../../../../product-catalog/core/ranking";
import type { ExcludedProduct, ProductRecommendation, TvProduct } from "../../../../product-catalog/core/types";
import { displayLabel, TV_PLATFORM_REQUIREMENT_LABELS, TV_PRIMARY_USE_LABELS, TV_PRIORITY_LABELS, TV_USAGE_LABELS } from "../displayLabels";
import { getSelectedTvSize, getTvBudget, getTvPlatformDisplayLabel, getTvRankingWeights } from "./criteria";

const currentPriceScore = (price: number, products: TvProduct[]) => {
  const prices = products.map((product) => product.currentPrice).filter((value) => Number.isFinite(value) && value > 0);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  if (highest <= lowest) return 100;
  return Math.max(0, Math.min(100, (highest - price) / (highest - lowest) * 100));
};

const energyScore = (grade: number) => Number.isFinite(grade) ? Math.max(0, Math.min(100, (6 - grade) / 5 * 100)) : 0;

const purposePictureScore = (product: TvProduct, purpose: unknown) => {
  const hdrScore = product.specs.hdr ? 100 : 35;
  if (purpose === "movies-dramas") return hdrScore * 0.6 + (product.specs.panel === "VA" ? 100 : 45) * 0.4;
  if (purpose === "family-wide-viewing") return hdrScore * 0.35 + (product.specs.panel === "IPS" ? 100 : 40) * 0.65;
  if (purpose === "broadcast-streaming") return hdrScore * 0.35 + 65;
  return hdrScore * 0.5 + 50;
};

const smartPlatformScore = (product: TvProduct, requirement: unknown) => {
  if (requirement === "none") return 50;
  if (product.specs.os === "google-tv" || product.specs.os === "android-tv") return 100;
  return 85;
};

const warrantyScore = (years: number) => {
  if (!Number.isFinite(years) || years < 0) return null;
  if (years >= 2) return 100;
  return years >= 1 ? 60 : 25;
};

const buildRecommendation = (product: TvProduct, comparableProducts: TvProduct[], answers: FlowAnswers): ProductRecommendation => {
  const weights = getTvRankingWeights(answers);
  const components: Array<{ value: number; weight: number }> = [
    { value: currentPriceScore(product.currentPrice, comparableProducts), weight: weights.currentPrice },
    { value: purposePictureScore(product, answers["tv.primaryUse"]), weight: weights.pictureQuality },
    { value: energyScore(product.specs.energyGrade), weight: weights.energyGrade },
    { value: smartPlatformScore(product, answers["tv.platformRequirement"]), weight: weights.smartPlatform },
  ];
  const validHistory = getValidPriceHistory(product.priceHistory);
  const historicalScore = validHistory.length ? getPricePositionScore(product.currentPrice, validHistory) : null;
  if (historicalScore !== null) components.push({ value: historicalScore, weight: weights.historicalPrice });
  const productWarrantyScore = warrantyScore(product.specs.warrantyYears);
  if (productWarrantyScore !== null) components.push({ value: productWarrantyScore, weight: weights.warranty });

  const positiveComponents = components.filter(({ weight }) => weight > 0);
  const totalWeight = positiveComponents.reduce((sum, component) => sum + component.weight, 0);
  const score = totalWeight > 0
    ? positiveComponents.reduce((sum, component) => sum + component.value * component.weight, 0) / totalWeight
    : 0;
  const purpose = displayLabel(TV_PRIMARY_USE_LABELS, answers["tv.primaryUse"]);
  const usage = displayLabel(TV_USAGE_LABELS, answers["tv.dailyUsage"]);
  const priority = displayLabel(TV_PRIORITY_LABELS, answers["tv.valuePriority"]);
  const platformRequirement = displayLabel(TV_PLATFORM_REQUIREMENT_LABELS, answers["tv.platformRequirement"]);
  const platform = getTvPlatformDisplayLabel(product);
  const recommendationReasonItems = [
    reasonItem("필수 조건", `${product.specs.screenSizeInches}인치, 4K UHD${answers["tv.platformRequirement"] === "google-android-required" ? ", Google TV 또는 Android TV" : ""} 조건을 충족해요.`),
    reasonItem("주 사용", `${purpose} 기준으로 HDR과 패널 특성을 추천 점수에 반영했어요.`),
    reasonItem("사용 패턴", `${usage} 사용하는 기준으로 현재 가격과 에너지 효율의 비중을 조정했어요.`),
    reasonItem("가성비 기준", `${priority} 기준을 추천 점수에 반영했어요.`),
    reasonItem("스마트 플랫폼", `${platform} 제품이며, ${platformRequirement} 조건을 반영했어요.`),
  ];
  if (productWarrantyScore !== null) recommendationReasonItems.push(reasonItem("보증", `${product.specs.warrantyYears}년 보증을 순위 요소로 반영했어요.`));
  const historicalPriceReason = createHistoricalPriceReason(product.currentPrice, validHistory);
  if (historicalPriceReason) recommendationReasonItems.push(historicalPriceReason);

  return {
    product,
    score: Math.round(score),
    matchedCoreCriteria: [
      `${product.specs.screenSizeInches}인치`,
      "4K UHD",
      ...(answers["tv.platformRequirement"] === "google-android-required" ? [`스마트 플랫폼: ${platform}`] : []),
    ],
    unmatchedOrUnknownCriteria: [
      ...(validHistory.length ? [] : ["가격 이력 없음"]),
      ...(productWarrantyScore === null ? ["보증 기간 정보 없음"] : []),
    ],
    recommendationReasons: recommendationReasonItems.map(({ description }) => description),
    recommendationReasonItems,
    preferenceMatchCount: [
      product.specs.hdr,
      product.specs.energyGrade <= 2,
      product.specs.warrantyYears >= 2,
      historicalScore !== null && historicalScore >= 75,
      answers["tv.primaryUse"] === "movies-dramas" && product.specs.panel === "VA",
      answers["tv.primaryUse"] === "family-wide-viewing" && product.specs.panel === "IPS",
    ].filter(Boolean).length,
    dataCompleteness: dataCompleteness({
      currentPrice: product.currentPrice,
      os: product.specs.os,
      resolution: product.specs.resolution,
      screenSizeInches: product.specs.screenSizeInches,
      panel: product.specs.panel,
      warrantyYears: product.specs.warrantyYears,
      hdr: product.specs.hdr,
      energyGrade: product.specs.energyGrade,
    }),
  };
};

export const rankTvs = (products: TvProduct[], answers: FlowAnswers) => {
  const selectedSize = getSelectedTvSize(answers);
  const budget = getTvBudget(answers);
  const platformRequired = answers["tv.platformRequirement"] === "google-android-required";
  const excludedProducts: ExcludedProduct[] = [];
  const eligible: TvProduct[] = [];

  for (const product of products) {
    const reasons: string[] = [];
    if (product.dataStatus === "discontinued") reasons.push("판매 중단 상품");
    if (product.specs.screenSizeInches !== selectedSize) reasons.push(`선택한 ${selectedSize}인치와 다름`);
    if (product.specs.resolution !== "4k-uhd") reasons.push("4K UHD 필수 조건 미충족");
    if (platformRequired && product.specs.os !== "google-tv" && product.specs.os !== "android-tv") reasons.push("Google TV 또는 Android TV 필수 조건 미충족");
    if (budget !== null && product.currentPrice > budget) reasons.push("제품 가격 예산 초과");
    if (reasons.length) excludedProducts.push({ productId: product.id, productName: product.name, reasons });
    else eligible.push(product);
  }

  return {
    recommendations: sortRecommendations(eligible.map((product) => buildRecommendation(product, eligible, answers))).slice(0, 10),
    excludedProducts,
  };
};
