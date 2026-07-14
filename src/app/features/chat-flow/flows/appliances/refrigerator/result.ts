import type { FlowAnswers, FlowResult } from "../../../core/types";
import { productRepository } from "../../../../product-catalog/data/productCatalog";
import { rankRefrigerators } from "./rankProducts";

export const buildRefrigeratorResult = (answers: FlowAnswers): FlowResult => {
  const products = productRepository.getProducts("refrigerator");
  const ranked = rankRefrigerators(products, answers);
  return { title: "냉장고 조건별 추천", summary: `필수 조건을 통과한 ${ranked.recommendations.length}개 냉장고를 점수순으로 표시합니다.`, grade: "카탈로그 추천", highlights: ["도어·가구원 기반 용량 구간을 필수 필터로 적용", "냉각·인버터·보증·설치 형태는 기본 필수"], warnings: ranked.recommendations.length ? ["문 열림 여유와 실제 설치 치수를 별도로 확인해주세요."] : ["현재 필수 조건을 모두 만족하는 상품이 없어요."], recommendedActions: ["용량과 설치 공간, 핵심 부품 보증 범위 확인"], recommendations: ranked.recommendations, catalogProducts: products, excludedProducts: ranked.excludedProducts, metadata: { category: "refrigerator", answers } };
};
