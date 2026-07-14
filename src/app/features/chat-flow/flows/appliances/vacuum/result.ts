import type { FlowAnswers, FlowResult } from "../../../core/types";
import { productRepository } from "../../../../product-catalog/data/productCatalog";
import { rankVacuums } from "./rankProducts";

export const buildVacuumResult = (answers: FlowAnswers): FlowResult => {
  const products = productRepository.getProducts("vacuum");
  const ranked = rankVacuums(products, answers);
  return { title: "청소기 조건별 추천", summary: `필수 조건을 통과한 ${ranked.recommendations.length}개 청소기를 점수순으로 표시합니다.`, grade: "카탈로그 추천", highlights: ["AW와 Pa를 환산하지 않고 선택 단위만 독립 판정", "유선 선택 시 배터리·충전 거치대 조건 제외"], warnings: ranked.recommendations.length ? ["표기 흡입력의 측정 환경은 제품마다 다를 수 있어요."] : ["현재 필수 조건을 모두 만족하는 상품이 없어요."], recommendedActions: ["필터 소모품과 실제 손목 체감 무게 확인"], recommendations: ranked.recommendations, catalogProducts: products, excludedProducts: ranked.excludedProducts, metadata: { category: "vacuum", answers } };
};
