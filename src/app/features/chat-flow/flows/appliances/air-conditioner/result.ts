import type { FlowAnswers, FlowResult } from "../../../core/types";
import { productRepository } from "../../../../product-catalog/data/productCatalog";
import { rankAirConditioners } from "./rankProducts";

export const buildAirConditionerResult = (answers: FlowAnswers): FlowResult => {
  const products = productRepository.getProducts("air-conditioner");
  const ranked = rankAirConditioners(products, answers);
  const hasBudgetAlternative = ranked.recommendations.length === 0 && ranked.overBudgetRecommendations.length > 0;
  return {
    title: "에어컨 조건별 추천",
    summary: ranked.recommendations.length
      ? `필수 조건을 통과한 ${ranked.recommendations.length}개 상품을 선택한 기준에 맞춰 표시합니다.`
      : hasBudgetAlternative
        ? "필수 조건을 만족하지만 제품 가격 예산 안에 드는 상품이 없어요."
        : "현재 필수 조건을 모두 만족하는 상품이 없어요.",
    grade: "카탈로그 추천",
    highlights: [
      "타입·냉방 면적·인버터·판매 상태를 필수 조건으로 적용",
      "현재 가격·과거 가격 위치·에너지 등급·자동 건조를 사용 시간과 가성비 기준에 맞춰 순위화",
    ],
    warnings: hasBudgetAlternative
      ? ["냉방 면적이나 인버터 조건은 완화하지 않고 예산만 초과한 가까운 상품을 따로 볼 수 있어요."]
      : ranked.recommendations.length ? [] : ["타입과 최소 냉방 면적을 확인한 뒤 조건 수정을 이용해주세요."],
    recommendedActions: hasBudgetAlternative ? ["예산 초과가 가장 적은 상품 보기"] : ["현재 가격과 가격 추이 비교"],
    recommendations: ranked.recommendations,
    catalogProducts: products,
    excludedProducts: ranked.excludedProducts,
    metadata: {
      category: "air-conditioner",
      answers,
      overBudgetRecommendations: ranked.overBudgetRecommendations,
    },
  };
};
