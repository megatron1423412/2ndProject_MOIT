import type { FlowAnswers, FlowResult } from "../../../core/types";
import { MockProductRepository } from "../../../../product-catalog/mock/MockProductRepository";
import { AIR_CONDITIONER_PRODUCTS } from "./products";
import { rankAirConditioners } from "./rankProducts";

export const buildAirConditionerResult = (answers: FlowAnswers): FlowResult => {
  const repository = new MockProductRepository(AIR_CONDITIONER_PRODUCTS);
  const ranked = rankAirConditioners(repository.getProducts("air-conditioner"), answers);
  return { title: "에어컨 조건별 추천", summary: `필수 조건을 통과한 ${ranked.recommendations.length}개 상품을 점수순으로 표시합니다.`, grade: "mock 추천", highlights: ["타입·냉방 면적·인버터·공식 설치를 먼저 필터링", "설치·효율·가격 위치는 선택에 따라 필터 또는 점수 반영"], warnings: ranked.recommendations.length ? ["실제 설치 가능 여부와 추가 배관비는 판매처 확인이 필요해요."] : ["현재 필수 조건을 모두 만족하는 더미 상품이 없어요. 조건을 완화해 다시 시도해주세요."], recommendedActions: ["카드의 미충족·확인 필요 조건과 가격 추이 비교"], mockNotice: "상품·가격·리뷰 요약·환급 상태는 모두 화면 검증용 더미 데이터이며 실제 시장 정보가 아닙니다.", recommendations: ranked.recommendations, excludedProducts: ranked.excludedProducts, metadata: { category: "air-conditioner", answers } };
};
