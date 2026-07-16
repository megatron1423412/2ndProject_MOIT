import type { FlowAnswers, FlowResult } from "../../../core/types";
import { productRepository } from "../../../../product-catalog/data/productCatalog";
import { rankTvs } from "./rankProducts";

export const buildTvResult = (answers: FlowAnswers): FlowResult => {
  const products = productRepository.getProducts("tv");
  const ranked = rankTvs(products, answers);
  return { title: "TV 조건별 추천", summary: `필수 조건을 통과한 ${ranked.recommendations.length}개 TV를 점수순으로 표시합니다.`, grade: "카탈로그 추천", highlights: ["선택한 화면 크기와 4K UHD를 필수 필터로 적용", "사용 방식에 따른 HDR·패널 특성과 가격·효율·보증을 순위에 반영"], warnings: ranked.recommendations.length ? ["시청 거리별 크기는 추천 시작점이며 실제 설치 공간과 취향을 함께 확인해주세요."] : ["현재 필수 조건을 모두 만족하는 상품이 없어요."], recommendedActions: ["화면 크기와 스마트 플랫폼 조건 재확인"], recommendations: ranked.recommendations, catalogProducts: products, excludedProducts: ranked.excludedProducts, metadata: { category: "tv", answers } };
};
