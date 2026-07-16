import type { FlowAnswers, FlowResult } from "../../../core/types";
import { productRepository } from "../../../../product-catalog/data/productCatalog";
import { rankVacuums } from "./rankProducts";

export const buildVacuumResult = (answers: FlowAnswers): FlowResult => {
  const products = productRepository.getProducts("vacuum");
  const ranked = rankVacuums(products, answers);
  return { title: "청소기 가성비 추천", summary: `선택한 생활 조건을 충족한 ${ranked.recommendations.length}개 청소기를 가성비 점수순으로 표시합니다.`, grade: "카탈로그 추천", highlights: ["명시한 동력 방식·예산·판매 상태만 필수 필터로 적용", "흡입력 표기 단위는 서로 환산하지 않고 단위별로 비교한 뒤 점수에 반영"], warnings: ranked.recommendations.length ? ["카펫 전용 성능과 실제 손목 체감 무게는 구매 전에 별도로 확인해주세요."] : ["현재 선택 조건을 모두 만족하는 상품이 없어요."], recommendedActions: ["필터 소모품, 브러시 구성과 보증 범위 확인"], mockNotice: "", recommendations: ranked.recommendations, catalogProducts: products, excludedProducts: ranked.excludedProducts, metadata: { category: "vacuum", answers } };
};
