import type { FlowAnswers, FlowResult } from "../../../core/types";
import { productRepository } from "../../../../product-catalog/data/productCatalog";
import { rankRefrigerators } from "./rankProducts";

export const buildRefrigeratorResult = (answers: FlowAnswers): FlowResult => {
  const products = productRepository.getProducts("refrigerator");
  const ranked = rankRefrigerators(products, answers);
  return { title: "냉장고 가성비 추천", summary: `선택한 생활 조건을 충족한 ${ranked.recommendations.length}개 냉장고를 가성비 점수순으로 표시합니다.`, grade: "카탈로그 추천", highlights: ["선택한 용량과 명시한 도어·설치 형태를 필수 필터로 적용", "현재 가격·가격 이력·효율·인버터·냉각 방식·보증기간을 추천 점수에 반영"], warnings: ranked.recommendations.length ? ["가구장과 제품의 실제 폭·높이·깊이, 문 열림 여유는 구매 전에 확인해주세요."] : ["현재 선택 조건을 모두 만족하는 상품이 없어요."], recommendedActions: ["실제 설치 치수와 핵심 부품 보증 범위 확인"], mockNotice: "", recommendations: ranked.recommendations, catalogProducts: products, excludedProducts: ranked.excludedProducts, metadata: { category: "refrigerator", answers } };
};
