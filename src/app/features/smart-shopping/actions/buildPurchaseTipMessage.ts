import type { ProductCategoryId } from "../../product-catalog/core/types";

const commonTips = [
  "카드 즉시할인과 청구할인을 구분해 확인하세요.",
  "쇼핑몰 쿠폰·적립금 적용 여부와 제조사 공식몰·오픈마켓의 최종 결제액을 비교하세요.",
  "지역화폐·간편결제 캐시백 가능 여부, 이월·파생 모델 차이, 배송·설치·부가비용을 함께 확인하세요.",
  "급하지 않다면 가격 알림과 예정된 프로모션을 함께 확인하세요.",
];

const categoryTips: Record<ProductCategoryId, string[]> = {
  "air-conditioner": ["에어컨은 상품 가격이 가장 낮아도 설치비가 별도라면 실제 최종비용이 더 높아질 수 있어요. 기본 설치비 포함 여부, 기본 배관 길이, 배관 연장, 타공, 실외기 앵글, 기존 제품 철거비를 확인한 뒤 비교하세요."],
  tv: ["설치 방식과 벽걸이 브라켓 비용, 패널·보증 조건, OTT·셋톱박스 호환을 확인하세요."],
  refrigerator: ["배송·사다리차·문 분리 비용, 설치 공간과 문 열림 여유, 폐가전 수거 여부를 확인하세요."],
  vacuum: ["추가 배터리·필터·브러시 가격, 소모품 교체 주기, A/S와 배터리 보증 조건을 확인하세요."],
};

export const buildPurchaseTipMessage = (categoryId: ProductCategoryId) =>
  ["싸게 구매하는 법 TIP이에요.", ...commonTips, ...categoryTips[categoryId]].map((item) => `- ${item}`).join("\n");
