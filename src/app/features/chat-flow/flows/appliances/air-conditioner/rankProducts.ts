import type { FlowAnswers } from "../../../core/types";
import { getPricePositionScore } from "../../../../product-catalog/core/priceHistory";
import { createHistoricalPriceReason, reasonItem } from "../../../../product-catalog/core/recommendationReasons";
import { dataCompleteness, sortRecommendations } from "../../../../product-catalog/core/ranking";
import type { AirConditionerProduct, ExcludedProduct, ProductRecommendation } from "../../../../product-catalog/core/types";
import { AIR_CONDITIONER_PRIORITY_LABELS, AIR_CONDITIONER_USAGE_LABELS, displayLabel } from "../displayLabels";
import { AIR_CONDITIONER_CRITERIA, getRequiredCoolingArea, getSelectedAirConditionerType } from "./criteria";

type RankingWeights = Record<keyof typeof AIR_CONDITIONER_CRITERIA.weights, number>;

export const getAirConditionerRankingWeights = (answers: FlowAnswers): RankingWeights => {
  const weights: RankingWeights = { ...AIR_CONDITIONER_CRITERIA.weights };
  const usage = answers["airConditioner.dailyUsage"];
  if (usage === "under4") { weights.currentPrice += 10; weights.energyGrade -= 10; }
  if (usage === "over8") { weights.currentPrice -= 10; weights.energyGrade += 10; }

  switch (answers["airConditioner.valuePriority"]) {
    case "low-purchase-price":
      weights.currentPrice += 25; weights.historicalPrice -= 10; weights.energyGrade -= 10; weights.autoDry -= 5;
      break;
    case "electricity-saving":
      weights.currentPrice -= 10; weights.historicalPrice -= 5; weights.energyGrade += 20; weights.autoDry -= 5;
      break;
    case "maintenance":
      weights.currentPrice -= 10; weights.historicalPrice -= 5; weights.energyGrade -= 5; weights.autoDry += 20;
      break;
    case "good-current-price":
      weights.currentPrice -= 10; weights.historicalPrice += 30; weights.energyGrade -= 10; weights.autoDry -= 10;
      break;
  }
  return weights;
};

const getBudget = (answers: FlowAnswers) => {
  const budget = Number(answers["airConditioner.budget"]);
  return Number.isFinite(budget) && budget > 0 ? budget : null;
};

const currentPriceScore = (price: number, products: AirConditionerProduct[]) => {
  const prices = products.map((product) => product.currentPrice).filter(Number.isFinite);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  if (highest <= lowest) return 100;
  return Math.max(0, Math.min(100, (highest - price) / (highest - lowest) * 100));
};

const buildRecommendation = (
  product: AirConditionerProduct,
  comparableProducts: AirConditionerProduct[],
  answers: FlowAnswers,
  requiredArea: number,
): ProductRecommendation => {
  const weights = getAirConditionerRankingWeights(answers);
  const components: Array<{ value: number; weight: number }> = [
    { value: currentPriceScore(product.currentPrice, comparableProducts), weight: weights.currentPrice },
    { value: (6 - product.specs.energyGrade) / 5 * 100, weight: weights.energyGrade },
    { value: product.specs.autoDry ? 100 : 0, weight: weights.autoDry },
  ];
  const hasPriceHistory = product.priceHistory.some(({ lowestPrice }) => Number.isFinite(lowestPrice));
  const historicalScore = hasPriceHistory ? getPricePositionScore(product.currentPrice, product.priceHistory) : null;
  if (historicalScore !== null) components.push({ value: historicalScore, weight: weights.historicalPrice });
  const totalWeight = components.reduce((sum, component) => sum + Math.max(0, component.weight), 0);
  const score = totalWeight > 0
    ? components.reduce((sum, component) => sum + component.value * Math.max(0, component.weight), 0) / totalWeight
    : 0;
  const priority = displayLabel(AIR_CONDITIONER_PRIORITY_LABELS, answers["airConditioner.valuePriority"] ?? "balanced");
  const dailyUsage = displayLabel(AIR_CONDITIONER_USAGE_LABELS, answers["airConditioner.dailyUsage"] ?? "unknown");
  const recommendationReasonItems = [
    reasonItem("필수 조건", `선택한 타입, 냉방면적 ${requiredArea}평 이상, 인버터 조건을 충족해요.`),
    reasonItem("사용 패턴", `${dailyUsage} 사용하는 기준으로 현재 가격과 에너지 효율의 반영 비중을 조정했어요.`),
    reasonItem("가성비 기준", `${priority} 기준을 추천 점수에 반영했어요.`),
    reasonItem("관리 편의", product.specs.autoDry ? "자동 건조 기능을 관리 편의 점수에 반영했어요." : "자동 건조 기능이 없는 점을 관리 편의 점수에 반영했어요."),
  ];
  const historicalPriceReason = createHistoricalPriceReason(product.currentPrice, product.priceHistory);
  if (historicalPriceReason) recommendationReasonItems.push(historicalPriceReason);

  return {
    product,
    score: Math.round(score),
    matchedCoreCriteria: ["타입 일치", `냉방 ${requiredArea}평 이상`, "인버터"],
    unmatchedOrUnknownCriteria: hasPriceHistory ? [] : ["가격 이력 없음"],
    recommendationReasons: recommendationReasonItems.map(({ description }) => description),
    recommendationReasonItems,
    preferenceMatchCount: [product.specs.energyGrade <= 2, product.specs.autoDry, historicalScore !== null && historicalScore >= 75].filter(Boolean).length,
    dataCompleteness: dataCompleteness({
      currentPrice: product.currentPrice,
      ratedCoolingAreaPyeong: product.specs.ratedCoolingAreaPyeong,
      inverter: product.specs.inverter,
      energyGrade: product.specs.energyGrade,
      autoDry: product.specs.autoDry,
    }),
  };
};

export const rankAirConditioners = (products: AirConditionerProduct[], answers: FlowAnswers) => {
  const requiredArea = getRequiredCoolingArea(answers);
  const selectedType = getSelectedAirConditionerType(answers);
  const budget = getBudget(answers);
  const excludedProducts: ExcludedProduct[] = [];
  const coreEligible: AirConditionerProduct[] = [];

  for (const product of products) {
    const reasons: string[] = [];
    if (product.dataStatus === "discontinued") reasons.push("판매 중단 상품");
    if (product.specs.type !== selectedType) reasons.push("선택한 타입과 다름");
    if (!Number.isFinite(product.specs.ratedCoolingAreaPyeong) || product.specs.ratedCoolingAreaPyeong < requiredArea) reasons.push(`정격 냉방 면적 ${requiredArea}평 미충족`);
    if (product.specs.inverter !== true) reasons.push("인버터 컴프레서 조건 미충족");
    if (reasons.length) excludedProducts.push({ productId: product.id, productName: product.name, reasons });
    else coreEligible.push(product);
  }

  const withinBudget = coreEligible.filter((product) => budget === null || product.currentPrice <= budget);
  if (budget !== null) {
    coreEligible.filter((product) => product.currentPrice > budget).forEach((product) => {
      excludedProducts.push({ productId: product.id, productName: product.name, reasons: ["제품 가격 예산 초과"] });
    });
  }

  const recommendations = sortRecommendations(
    withinBudget.map((product) => buildRecommendation(product, withinBudget, answers, requiredArea)),
  ).slice(0, 10);
  const overBudgetRecommendations = recommendations.length === 0 && budget !== null && coreEligible.length > 0
    ? coreEligible
      .map((product) => buildRecommendation(product, coreEligible, answers, requiredArea))
      .sort((left, right) => (left.product.currentPrice - budget) - (right.product.currentPrice - budget) || right.score - left.score)
      .slice(0, 3)
    : [];

  return { recommendations, overBudgetRecommendations, excludedProducts };
};
