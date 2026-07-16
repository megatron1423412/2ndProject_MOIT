import type { FlowAnswers } from "../../../core/types";
import { getPricePositionScore, summarizeStoredPriceHistory } from "../../../../product-catalog/core/priceHistory";
import { createBudgetReason, createHistoricalPriceReason, reasonItem } from "../../../../product-catalog/core/recommendationReasons";
import { dataCompleteness, sortRecommendations } from "../../../../product-catalog/core/ranking";
import type { ExcludedProduct, ProductRecommendation, VacuumProduct } from "../../../../product-catalog/core/types";
import {
  displayLabel,
  VACUUM_FLOOR_LABELS,
  VACUUM_POWER_LABELS,
  VACUUM_PRIORITY_LABELS,
  VACUUM_USAGE_LABELS,
  VACUUM_WEIGHT_IMPORTANCE_LABELS,
} from "../displayLabels";
import { getVacuumRankingWeights, type VacuumRankingWeights } from "./criteria";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const validPositiveNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const booleanScore = (value: unknown) => typeof value === "boolean" ? (value ? 1 : 0) : null;

const normalizeUnitGroup = (products: VacuumProduct[], field: "suctionAw" | "suctionPa") => {
  const values = products.flatMap((product) => validPositiveNumber(product.specs[field]) ? [{ id: product.id, value: product.specs[field] as number }] : []);
  if (!values.length) return new Map<string, number>();
  const minimum = Math.min(...values.map(({ value }) => value));
  const maximum = Math.max(...values.map(({ value }) => value));
  return new Map(values.map(({ id, value }) => [id, maximum === minimum ? 1 : clamp01((value - minimum) / (maximum - minimum))]));
};

/** AW와 Pa를 각각 정규화한 뒤에만 하나의 비교 가능한 내부 점수로 합칩니다. */
export const getIndependentSuctionScores = (products: VacuumProduct[]) => {
  const awScores = normalizeUnitGroup(products, "suctionAw");
  const paScores = normalizeUnitGroup(products, "suctionPa");
  return new Map(products.map((product) => {
    const scores = [awScores.get(product.id), paScores.get(product.id)].filter((score): score is number => score !== undefined);
    return [product.id, scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null] as const;
  }));
};

const weightedScore = (weights: VacuumRankingWeights, components: Record<keyof VacuumRankingWeights, number | null>) => {
  let weightedTotal = 0;
  let appliedWeight = 0;
  (Object.keys(weights) as (keyof VacuumRankingWeights)[]).forEach((key) => {
    const component = components[key];
    if (weights[key] <= 0 || component === null) return;
    weightedTotal += weights[key] * component;
    appliedWeight += weights[key];
  });
  return appliedWeight > 0 ? weightedTotal / appliedWeight * 100 : 0;
};

const filterScore = (grade: unknown) => grade === "H14" ? 1 : grade === "H13" ? 0.85 : grade === "below-H13" ? 0.25 : null;
const weightScore = (weight: unknown) => validPositiveNumber(weight) ? clamp01((4.5 - weight) / 2.5) : null;
const warrantyScore = (years: unknown) => typeof years === "number" && Number.isFinite(years) && years >= 0 ? clamp01(years / 3) : null;

export const rankVacuums = (products: VacuumProduct[], answers: FlowAnswers) => {
  const selectedPower = answers["vacuum.powerType"];
  const budgetAnswer = answers["vacuum.budget"];
  const budget = budgetAnswer === "none" ? null : Number(budgetAnswer);
  const excludedProducts: ExcludedProduct[] = [];
  const eligible: VacuumProduct[] = [];

  for (const product of products) {
    const reasons: string[] = [];
    if (product.dataStatus === "discontinued") reasons.push("판매 중단 상품");
    if ((selectedPower === "wireless-value" || selectedPower === "wired-major") && product.specs.powerType !== selectedPower) reasons.push("선택한 동력 방식과 다름");
    if (budget !== null && Number.isFinite(budget) && product.currentPrice > budget) reasons.push("제품 가격 예산 초과");
    if (reasons.length) excludedProducts.push({ productId: product.id, productName: product.name, reasons });
    else eligible.push(product);
  }

  const prices = eligible.map(({ currentPrice }) => currentPrice).filter(validPositiveNumber);
  const minimumPrice = prices.length ? Math.min(...prices) : 0;
  const maximumPrice = prices.length ? Math.max(...prices) : 0;
  const suctionScores = getIndependentSuctionScores(eligible);
  const weights = getVacuumRankingWeights(answers);
  const usageLabel = displayLabel(VACUUM_USAGE_LABELS, answers["vacuum.primaryUse"]);
  const floorLabel = displayLabel(VACUUM_FLOOR_LABELS, answers["vacuum.floorEnvironment"]);
  const priorityLabel = displayLabel(VACUUM_PRIORITY_LABELS, answers["vacuum.valuePriority"]);

  const recommendations = eligible.map((product): ProductRecommendation => {
    const historySummary = summarizeStoredPriceHistory(product.currentPrice, product.priceHistory);
    const currentPriceScore = validPositiveNumber(product.currentPrice)
      ? maximumPrice === minimumPrice ? 1 : clamp01((maximumPrice - product.currentPrice) / (maximumPrice - minimumPrice))
      : null;
    const components: Record<keyof VacuumRankingWeights, number | null> = {
      currentPrice: currentPriceScore,
      marketPrice: historySummary ? getPricePositionScore(product.currentPrice, product.priceHistory) / 100 : null,
      suction: suctionScores.get(product.id) ?? null,
      weight: weightScore(product.specs.bodyWeightKg),
      filtration: filterScore(product.specs.hepaGrade),
      replaceableBattery: booleanScore(product.specs.replaceableBattery),
      softRoller: booleanScore(product.specs.softRoller),
      standingDock: booleanScore(product.specs.standingDock),
      warranty: warrantyScore(product.specs.warrantyYears),
    };
    const recommendationReasonItems = [
      reasonItem("사용 방식", `${usageLabel}, ${floorLabel} 환경과 ${priorityLabel} 기준으로 항목별 비중을 조정했어요.`),
      reasonItem("현재 가격", "현재 판매가를 다른 추천 후보와 비교해 점수에 반영했어요."),
    ];
    if (components.suction !== null && weights.suction > 0) recommendationReasonItems.push(reasonItem("흡입 성능", "서로 다른 표기 단위를 환산하지 않고 같은 단위 제품끼리 비교한 흡입 성능을 반영했어요."));
    if (components.weight !== null && weights.weight > 0) recommendationReasonItems.push(reasonItem("무게와 이동 편의", "확인된 본체 무게를 선택한 무게 중요도에 맞춰 반영했어요."));
    if (components.filtration !== null && weights.filtration > 0) recommendationReasonItems.push(reasonItem("필터 관리", product.specs.hepaGrade === "H13" || product.specs.hepaGrade === "H14" ? "확인된 고성능 필터 등급을 반영했어요." : "확인된 필터 등급을 반영했어요."));
    const convenienceDetails = [
      components.replaceableBattery === null ? null : `교체형 배터리 ${components.replaceableBattery ? "지원" : "미지원"}`,
      components.softRoller === null ? null : `소프트 롤러 ${components.softRoller ? "있음" : "없음"}`,
      components.standingDock === null ? null : `스탠드형 충전·보관 거치대 ${components.standingDock ? "있음" : "없음"}`,
    ].filter((detail): detail is string => Boolean(detail));
    if (convenienceDetails.length) recommendationReasonItems.push(reasonItem("사용과 관리 편의", `${convenienceDetails.join(", ")}을 반영했어요.`));
    if (components.warranty !== null && weights.warranty > 0) recommendationReasonItems.push(reasonItem("보증기간", "확인된 제품 보증기간을 점수에 반영했어요."));
    if (answers["vacuum.floorEnvironment"] === "carpet-rug") recommendationReasonItems.push(reasonItem("바닥 환경", "카펫·러그 환경은 흡입 성능 비중만 높였으며 전용 브러시 성능을 의미하지 않아요."));
    const budgetReason = budget === null ? null : createBudgetReason(product.currentPrice, budget);
    const historicalPriceReason = createHistoricalPriceReason(product.currentPrice, product.priceHistory);
    if (budgetReason) recommendationReasonItems.push(budgetReason);
    if (historicalPriceReason) recommendationReasonItems.push(historicalPriceReason);

    return {
      product,
      score: Math.round(weightedScore(weights, components)),
      matchedCoreCriteria: [
        usageLabel,
        displayLabel(VACUUM_POWER_LABELS, selectedPower),
        floorLabel,
        displayLabel(VACUUM_WEIGHT_IMPORTANCE_LABELS, answers["vacuum.weightImportance"]),
        priorityLabel,
      ],
      unmatchedOrUnknownCriteria: [
        ...(components.suction === null ? ["흡입력 정보 없음"] : []),
        ...(components.weight === null ? ["본체 무게 정보 없음"] : []),
        ...(components.filtration === null ? ["필터 등급 정보 없음"] : []),
        ...(components.warranty === null ? ["보증기간 정보 없음"] : []),
        ...(!historySummary ? ["가격 이력 없음"] : []),
      ],
      recommendationReasons: recommendationReasonItems.map(({ description }) => description),
      recommendationReasonItems,
      preferenceMatchCount: [components.suction !== null && components.suction >= 0.8, weights.weight > 0 && components.weight !== null && components.weight >= 0.8, components.filtration !== null && components.filtration >= 0.85, components.replaceableBattery === 1, components.softRoller === 1, components.standingDock === 1, Boolean(historySummary)].filter(Boolean).length,
      dataCompleteness: dataCompleteness({
        currentPrice: product.currentPrice,
        suction: components.suction,
        replaceableBattery: product.specs.replaceableBattery,
        hepaGrade: product.specs.hepaGrade,
        softRoller: product.specs.softRoller,
        standingDock: product.specs.standingDock,
        bodyWeightKg: product.specs.bodyWeightKg,
        warrantyYears: product.specs.warrantyYears,
      }),
    };
  });

  return { recommendations: sortRecommendations(recommendations).slice(0, 10), excludedProducts };
};
