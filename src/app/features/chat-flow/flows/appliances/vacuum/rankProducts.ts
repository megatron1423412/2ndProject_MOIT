import type { FlowAnswers } from "../../../core/types";
import { getPricePositionScore } from "../../../../product-catalog/core/priceHistory";
import { createBudgetReason, createHistoricalPriceReason, reasonItem } from "../../../../product-catalog/core/recommendationReasons";
import { dataCompleteness, sortRecommendations } from "../../../../product-catalog/core/ranking";
import type { ExcludedProduct, ProductRecommendation, VacuumProduct } from "../../../../product-catalog/core/types";
import { displayLabel, VACUUM_POWER_LABELS } from "../displayLabels";
import { VACUUM_CRITERIA } from "./criteria";

export const rankVacuums = (products: VacuumProduct[], answers: FlowAnswers) => {
  const a = (key: string) => answers[`vacuum.${key}`];
  const wireless = a("powerType") === "wireless-value";
  const excludedProducts: ExcludedProduct[] = [];
  const recommendations: ProductRecommendation[] = [];
  for (const product of products) {
    const reasons: string[] = [];
    if (product.dataStatus === "discontinued") { excludedProducts.push({ productId: product.id, productName: product.name, reasons: ["판매 중단 상품"] }); continue; }
    if (product.specs.powerType !== a("powerType")) reasons.push("동력 방식 불일치");
    // AW와 Pa는 절대 환산하지 않고 사용자가 고른 단위 필드만 판정합니다.
    if (a("suctionStandard") === "aw" && (product.specs.suctionAw === undefined || product.specs.suctionAw < VACUUM_CRITERIA.defaults.minimumAw)) reasons.push("200AW 데이터 없음 또는 기준 미달");
    if (a("suctionStandard") === "pa" && (product.specs.suctionPa === undefined || product.specs.suctionPa < VACUUM_CRITERIA.defaults.minimumPa)) reasons.push("25,000Pa 데이터 없음 또는 기준 미달");
    if (wireless && a("replaceableBatteryRequired") === true && product.specs.replaceableBattery !== true) reasons.push("교체형 배터리 조건 미충족");
    if (wireless && a("standingDockRequired") === true && product.specs.standingDock !== true) reasons.push("스탠드 충전 거치대 조건 미충족");
    if (a("hepaRequired") === true && !["H13", "H14"].includes(product.specs.hepaGrade)) reasons.push("H13 이상 HEPA 조건 미충족");
    if (a("softRollerRequired") === true && product.specs.softRoller !== true) reasons.push("소프트 롤러 조건 미충족");
    if (a("weight") === "under-2.5" && (!Number.isFinite(product.specs.bodyWeightKg) || product.specs.bodyWeightKg > 2.5)) reasons.push("본체 2.5kg 이하 조건 미충족");
    if (reasons.length) { excludedProducts.push({ productId: product.id, productName: product.name, reasons }); continue; }
    const w = VACUUM_CRITERIA.weights; const budget = Number(a("budget"));
    const suctionRatio = a("suctionStandard") === "aw" ? Math.min(1, (product.specs.suctionAw ?? 0) / 250) : a("suctionStandard") === "pa" ? Math.min(1, (product.specs.suctionPa ?? 0) / 30_000) : 0.75;
    const filterRatio = product.specs.hepaGrade === "H14" ? 1 : product.specs.hepaGrade === "H13" ? 0.85 : 0.2;
    const convenienceMatches = [product.specs.softRoller, !wireless || product.specs.replaceableBattery, !wireless || product.specs.standingDock].filter(Boolean).length;
    const score = (budget > 0 ? Math.min(1, budget / product.currentPrice) * w.budget : 0) + suctionRatio * w.suction + filterRatio * w.filtration + Math.min(1, product.specs.warrantyYears / 3) * w.warranty + (convenienceMatches / 3) * w.convenience + getPricePositionScore(product.currentPrice, product.priceHistory) / 100 * w.marketPrice;
    const preferences = [product.currentPrice <= budget, product.specs.softRoller, product.specs.bodyWeightKg <= 2.5, !wireless || product.specs.replaceableBattery, !wireless || product.specs.standingDock].filter(Boolean).length;
    const suctionLabel = product.specs.suctionAw !== undefined ? `${product.specs.suctionAw}AW` : product.specs.suctionPa !== undefined ? `${product.specs.suctionPa.toLocaleString("ko-KR")}Pa` : "흡입력 확인 필요";
    const recommendationReasonItems = [
      reasonItem("필수 조건", `선택한 동력 방식과 ${suctionLabel} 흡입력 기준을 충족해요.`),
      reasonItem("필터 성능", `${product.specs.hepaGrade} 필터 성능을 추천 점수에 반영했어요.`),
      reasonItem("관리 편의", wireless ? "소프트 롤러와 교체형 배터리·충전 거치대 구성을 반영했어요." : "소프트 롤러와 본체 편의 구성을 반영했어요."),
    ];
    const budgetReason = createBudgetReason(product.currentPrice, budget);
    const historicalPriceReason = createHistoricalPriceReason(product.currentPrice, product.priceHistory);
    if (budgetReason) recommendationReasonItems.push(budgetReason);
    if (historicalPriceReason) recommendationReasonItems.push(historicalPriceReason);
    recommendations.push({ product, score: Math.round(score), matchedCoreCriteria: [displayLabel(VACUUM_POWER_LABELS, a("powerType")), suctionLabel, product.specs.hepaGrade], unmatchedOrUnknownCriteria: [...(product.currentPrice > budget ? ["예산 초과"] : []), ...(product.specs.suctionAw === undefined ? ["AW 정보 없음"] : []), ...(product.specs.suctionPa === undefined ? ["Pa 정보 없음"] : [])], recommendationReasons: recommendationReasonItems.map(({ description }) => description), recommendationReasonItems, preferenceMatchCount: preferences, dataCompleteness: dataCompleteness(product.specs) });
  }
  return { recommendations: sortRecommendations(recommendations).slice(0, 10), excludedProducts };
};
