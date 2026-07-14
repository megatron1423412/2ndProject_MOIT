import type { FlowAnswers, FlowResult } from "../../../core/types";
import { productRepository } from "../../../../product-catalog/data/productCatalog";
import { rankTvs } from "./rankProducts";

export const buildTvResult = (answers: FlowAnswers): FlowResult => {
  const products = productRepository.getProducts("tv");
  const ranked = rankTvs(products, answers);
  return { title: "TV 조건별 추천", summary: `필수 조건을 통과한 ${ranked.recommendations.length}개 TV를 점수순으로 표시합니다.`, grade: "카탈로그 추천", highlights: ["기본 4K UHD·2년 보증을 필수 필터로 적용", "패널·HDR·효율·시세 위치를 선호 점수에 반영"], warnings: ranked.recommendations.length ? ["패널 체감과 설치 환경은 매장 또는 판매처에서 확인해주세요."] : ["현재 필수 조건을 모두 만족하는 상품이 없어요."], recommendedActions: ["화면 크기와 OS, 보증 조건 재확인"], recommendations: ranked.recommendations, catalogProducts: products, excludedProducts: ranked.excludedProducts, metadata: { category: "tv", answers } };
};
