import type { FlowAnswers } from "../../../core/types";
import { getPricePositionScore } from "../../../../product-catalog/core/priceHistory";
import { createBudgetReason, createHistoricalPriceReason, reasonItem } from "../../../../product-catalog/core/recommendationReasons";
import { dataCompleteness, sortRecommendations } from "../../../../product-catalog/core/ranking";
import type { ExcludedProduct, ProductRecommendation, RefrigeratorProduct } from "../../../../product-catalog/core/types";
import { displayLabel, REFRIGERATOR_DOOR_LABELS } from "../displayLabels";
import { getRecommendedCapacityRange, REFRIGERATOR_CRITERIA } from "./criteria";

export const rankRefrigerators = (products: RefrigeratorProduct[], answers: FlowAnswers) => {
  const a = (key: string) => answers[`refrigerator.${key}`];
  const capacity = a("capacityMode") === "recommended"
    ? getRecommendedCapacityRange(Number(a("householdSize")))
    : a("capacityMode") === "300-500" ? { minLiters: 300, maxLiters: 500 } : { minLiters: 600, maxLiters: 800 };
  const defaults = a("useDefaults") === "yes";
  const excludedProducts: ExcludedProduct[] = [];
  const recommendations: ProductRecommendation[] = [];
  for (const product of products) {
    const reasons: string[] = [];
    if (product.dataStatus === "discontinued") { excludedProducts.push({ productId: product.id, productName: product.name, reasons: ["판매 중단 상품"] }); continue; }
    if (product.specs.doorType !== a("doorType")) reasons.push("도어 구조 불일치");
    if (!Number.isFinite(product.specs.capacityLiters) || product.specs.capacityLiters < capacity.minLiters || product.specs.capacityLiters > capacity.maxLiters) reasons.push(`용량 ${capacity.minLiters}~${capacity.maxLiters}L 범위 불일치`);
    if (a("metalRequired") === true && product.specs.metalDoor !== true) reasons.push("메탈 도어 필수 조건 미충족");
    if ((defaults || a("coolingRequired") === true) && !["indirect", "fan"].includes(product.specs.coolingMethod)) reasons.push("간접/간랭식 냉각 조건 미충족");
    if ((defaults || a("inverterRequired") === true) && product.specs.inverter !== true) reasons.push("인버터 조건 미충족");
    if ((defaults || a("warrantyRequired") === true) && (!Number.isFinite(product.specs.corePartWarrantyYears) || product.specs.corePartWarrantyYears < REFRIGERATOR_CRITERIA.defaults.minimumCoreWarrantyYears)) reasons.push("핵심 부품 10년 보증 미충족");
    if ((defaults || a("freestandingRequired") === true) && product.specs.freestanding !== true) reasons.push("프리스탠딩 조건 미충족");
    if (reasons.length) { excludedProducts.push({ productId: product.id, productName: product.name, reasons }); continue; }
    const w = REFRIGERATOR_CRITERIA.weights; const budget = Number(a("budget"));
    const center = (capacity.minLiters + capacity.maxLiters) / 2;
    const capacityFit = Math.max(0, 1 - Math.abs(product.specs.capacityLiters - center) / Math.max(1, center));
    const score = (budget > 0 ? Math.min(1, budget / product.currentPrice) * w.budget : 0) + capacityFit * w.capacity + ((6 - product.specs.energyGrade) / 5) * w.efficiency + Math.min(1, product.specs.corePartWarrantyYears / 15) * w.warranty + (product.specs.metalDoor ? w.convenience : w.convenience * 0.35) + getPricePositionScore(product.currentPrice, product.priceHistory) / 100 * w.marketPrice;
    const preferences = [product.currentPrice <= budget, product.specs.metalDoor, product.specs.energyGrade <= 2, product.specs.corePartWarrantyYears > 10].filter(Boolean).length;
    const recommendationReasonItems = [
      reasonItem("필수 조건", `선택한 도어 구조와 ${capacity.minLiters}~${capacity.maxLiters}L 용량 범위를 충족해요.`),
      reasonItem("성능·효율", `냉각 방식, 인버터, 에너지 ${product.specs.energyGrade}등급과 핵심 부품 보증 기간을 반영했어요.`),
      reasonItem("관리 편의", product.specs.metalDoor ? "메탈 도어 구성을 관리 편의 점수에 반영했어요." : "메탈 도어가 아닌 점을 관리 편의 점수에 반영했어요."),
    ];
    const budgetReason = createBudgetReason(product.currentPrice, budget);
    const historicalPriceReason = createHistoricalPriceReason(product.currentPrice, product.priceHistory);
    if (budgetReason) recommendationReasonItems.push(budgetReason);
    if (historicalPriceReason) recommendationReasonItems.push(historicalPriceReason);
    recommendations.push({ product, score: Math.round(score), matchedCoreCriteria: [displayLabel(REFRIGERATOR_DOOR_LABELS, a("doorType")), `${capacity.minLiters}~${capacity.maxLiters}L`, "인버터", `핵심부품 ${product.specs.corePartWarrantyYears}년 보증`], unmatchedOrUnknownCriteria: [...(!product.specs.metalDoor ? ["메탈 도어 아님"] : []), ...(product.currentPrice > budget ? ["예산 초과"] : [])], recommendationReasons: recommendationReasonItems.map(({ description }) => description), recommendationReasonItems, preferenceMatchCount: preferences, dataCompleteness: dataCompleteness(product.specs) });
  }
  return { recommendations: sortRecommendations(recommendations).slice(0, 10), excludedProducts };
};
