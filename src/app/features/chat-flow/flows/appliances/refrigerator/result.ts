import type { FlowAnswers, FlowResult } from "../../../core/types";
import { MockProductRepository } from "../../../../product-catalog/mock/MockProductRepository";
import { REFRIGERATOR_PRODUCTS } from "./products";
import { rankRefrigerators } from "./rankProducts";

export const buildRefrigeratorResult = (answers: FlowAnswers): FlowResult => {
  const ranked = rankRefrigerators(new MockProductRepository(REFRIGERATOR_PRODUCTS).getProducts("refrigerator"), answers);
  return { title: "냉장고 조건별 추천", summary: `필수 조건을 통과한 ${ranked.recommendations.length}개 냉장고를 점수순으로 표시합니다.`, grade: "mock 추천", highlights: ["도어·가구원 기반 용량 구간을 필수 필터로 적용", "냉각·인버터·보증·설치 형태는 기본 필수"], warnings: ranked.recommendations.length ? ["문 열림 여유와 실제 설치 치수를 별도로 확인해주세요."] : ["현재 필수 조건을 모두 만족하는 더미 상품이 없어요."], recommendedActions: ["용량과 설치 공간, 핵심 부품 보증 범위 확인"], mockNotice: "상품·가격·리뷰 요약은 모두 화면 검증용 더미 데이터입니다.", recommendations: ranked.recommendations, excludedProducts: ranked.excludedProducts, metadata: { category: "refrigerator", answers } };
};
