import type { FlowAnswers } from "../../../core/types";
import { getPricePositionScore, summarizeStoredPriceHistory } from "../../../../product-catalog/core/priceHistory";
import { createBudgetReason, createHistoricalPriceReason, reasonItem } from "../../../../product-catalog/core/recommendationReasons";
import { dataCompleteness, sortRecommendations } from "../../../../product-catalog/core/ranking";
import type { ExcludedProduct, ProductRecommendation, RefrigeratorProduct } from "../../../../product-catalog/core/types";
import {
  displayLabel,
  REFRIGERATOR_DOOR_LABELS,
  REFRIGERATOR_INSTALLATION_LABELS,
  REFRIGERATOR_PRIORITY_LABELS,
} from "../displayLabels";
import { getRefrigeratorRankingWeights, getSelectedCapacityRange } from "./criteria";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const coolingLabel = (method: RefrigeratorProduct["specs"]["coolingMethod"]) => ({ indirect: "간접 냉각", fan: "팬 냉각", direct: "직접 냉각" })[method];

const matchesInstallation = (product: RefrigeratorProduct, installationType: unknown) =>
  installationType === "kitchen-fit" ? product.specs.freestanding === false
    : installationType === "general" ? product.specs.freestanding === true
      : true;

const matchesDoor = (product: RefrigeratorProduct, doorType: unknown) =>
  doorType === "two-door" || doorType === "four-door-value" ? product.specs.doorType === doorType : true;

export const rankRefrigerators = (products: RefrigeratorProduct[], answers: FlowAnswers) => {
  const capacity = getSelectedCapacityRange(answers);
  const selectedDoor = answers["refrigerator.doorType"];
  const installationType = answers["refrigerator.installationType"];
  const budgetAnswer = answers["refrigerator.budget"];
  const budget = budgetAnswer === "none" ? null : Number(budgetAnswer);
  const excludedProducts: ExcludedProduct[] = [];
  const eligible: RefrigeratorProduct[] = [];

  for (const product of products) {
    const reasons: string[] = [];
    if (product.dataStatus === "discontinued") reasons.push("판매 중단 상품");
    if (!Number.isFinite(product.specs.capacityLiters) || product.specs.capacityLiters < capacity.minLiters || product.specs.capacityLiters > capacity.maxLiters) reasons.push(`${capacity.label} 용량 범위 불일치`);
    if (!matchesDoor(product, selectedDoor)) reasons.push("선택한 도어 구조와 다름");
    if (!matchesInstallation(product, installationType)) reasons.push("선택한 설치 형태와 다름");
    if (budget !== null && Number.isFinite(budget) && product.currentPrice > budget) reasons.push("제품 가격 예산 초과");
    if (reasons.length) excludedProducts.push({ productId: product.id, productName: product.name, reasons });
    else eligible.push(product);
  }

  const prices = eligible.map(({ currentPrice }) => currentPrice).filter((price) => Number.isFinite(price) && price > 0);
  const lowestCurrentPrice = prices.length ? Math.min(...prices) : 0;
  const highestCurrentPrice = prices.length ? Math.max(...prices) : 0;
  const weights = getRefrigeratorRankingWeights(answers);
  const priorityLabel = displayLabel(REFRIGERATOR_PRIORITY_LABELS, answers["refrigerator.valuePriority"]);

  const recommendations = eligible.map((product): ProductRecommendation => {
    const currentPriceScore = highestCurrentPrice === lowestCurrentPrice
      ? 1
      : clamp01((highestCurrentPrice - product.currentPrice) / (highestCurrentPrice - lowestCurrentPrice));
    const capacityFit = clamp01(1 - Math.abs(product.specs.capacityLiters - capacity.targetLiters) / Math.max(100, capacity.targetLiters));
    const energyScore = clamp01((6 - product.specs.energyGrade) / 5);
    const inverterScore = product.specs.inverter ? 1 : 0;
    const warrantyScore = clamp01(product.specs.corePartWarrantyYears / 10);
    const coolingScore = product.specs.coolingMethod === "indirect" || product.specs.coolingMethod === "fan" ? 1 : 0;
    const storageConvenienceScore = product.specs.doorType === "four-door-value" ? 1 : 0.45;
    const historySummary = summarizeStoredPriceHistory(product.currentPrice, product.priceHistory);
    const marketPriceScore = historySummary ? getPricePositionScore(product.currentPrice, product.priceHistory) / 100 : null;
    const score =
      currentPriceScore * weights.currentPrice
      + capacityFit * weights.capacity
      + energyScore * weights.energyGrade
      + inverterScore * weights.inverter
      + warrantyScore * weights.warranty
      + coolingScore * weights.cooling
      + storageConvenienceScore * weights.storageConvenience
      + (marketPriceScore === null ? 0 : marketPriceScore * weights.marketPrice);

    const filterDescription = [
      capacity.label,
      selectedDoor === "any" ? "도어 구조 제한 없음" : displayLabel(REFRIGERATOR_DOOR_LABELS, selectedDoor),
      installationType === "unknown" ? "설치 형태 제한 없음" : displayLabel(REFRIGERATOR_INSTALLATION_LABELS, installationType),
    ].join(", ");
    const recommendationReasonItems = [
      reasonItem("필수 조건", `${filterDescription} 조건을 충족해요.`),
      reasonItem("가성비 기준", `${priorityLabel} 기준으로 현재 가격, 용량 적합도와 생활 편의 요소를 반영했어요.`),
      reasonItem("효율·내구성", `에너지 ${product.specs.energyGrade}등급, ${product.specs.inverter ? "인버터" : "일반 컴프레서"}, ${coolingLabel(product.specs.coolingMethod)}, 핵심부품 ${product.specs.corePartWarrantyYears}년 보증을 점수에 반영했어요.`),
    ];
    const budgetReason = budget === null ? null : createBudgetReason(product.currentPrice, budget);
    const historicalPriceReason = createHistoricalPriceReason(product.currentPrice, product.priceHistory);
    if (budgetReason) recommendationReasonItems.push(budgetReason);
    if (historicalPriceReason) recommendationReasonItems.push(historicalPriceReason);

    return {
      product,
      score: Math.round(score),
      matchedCoreCriteria: [
        capacity.label,
        selectedDoor === "any" ? "도어 구조 제한 없음" : displayLabel(REFRIGERATOR_DOOR_LABELS, selectedDoor),
        installationType === "unknown" ? "설치 형태 제한 없음" : displayLabel(REFRIGERATOR_INSTALLATION_LABELS, installationType),
        priorityLabel,
      ],
      unmatchedOrUnknownCriteria: historySummary ? [] : ["가격 이력 없음"],
      recommendationReasons: recommendationReasonItems.map(({ description }) => description),
      recommendationReasonItems,
      preferenceMatchCount: [capacityFit >= 0.9, product.specs.energyGrade <= 2, product.specs.inverter, product.specs.corePartWarrantyYears >= 10, coolingScore === 1, Boolean(historySummary)].filter(Boolean).length,
      dataCompleteness: dataCompleteness({
        currentPrice: product.currentPrice,
        capacityLiters: product.specs.capacityLiters,
        doorType: product.specs.doorType,
        freestanding: product.specs.freestanding,
        energyGrade: product.specs.energyGrade,
        inverter: product.specs.inverter,
        coolingMethod: product.specs.coolingMethod,
        corePartWarrantyYears: product.specs.corePartWarrantyYears,
      }),
    };
  });

  return { recommendations: sortRecommendations(recommendations).slice(0, 10), excludedProducts };
};
