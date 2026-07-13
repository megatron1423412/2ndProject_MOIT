import { PURCHASE_GRADE_THRESHOLDS } from "./purchaseGradeConfig";

export type PurchaseGradeResult =
  | { status: "available"; grade: "골드" | "실버" | "브론즈"; differencePct: number; reason: string; timingGuide: string }
  | { status: "unavailable"; reason: string };

export const calculatePurchaseGrade = (currentPrice: number, allTimeLow?: number): PurchaseGradeResult => {
  if (!Number.isFinite(currentPrice) || !Number.isFinite(allTimeLow) || currentPrice <= 0 || !allTimeLow || allTimeLow <= 0) {
    return { status: "unavailable", reason: "가격 데이터가 부족해 진단할 수 없어요." };
  }
  const differencePct = Math.round(((currentPrice - allTimeLow) / allTimeLow) * 1000) / 10;
  if (currentPrice <= allTimeLow || differencePct <= PURCHASE_GRADE_THRESHOLDS.goldMaxPct) {
    return { status: "available", grade: "골드", differencePct, reason: `현재 가격은 역대 최저가보다 ${differencePct}% 높은 수준이에요. 가격 기록 기준으로는 상당히 좋은 구매 타이밍입니다.`, timingGuide: "판매처의 최종 결제 조건만 확인한 뒤 구매를 검토해보세요." };
  }
  if (differencePct <= PURCHASE_GRADE_THRESHOLDS.silverMaxPct) {
    return { status: "available", grade: "실버", differencePct, reason: `현재 가격은 역대 최저가보다 ${differencePct}% 높아요. 급하게 필요하다면 구매할 만하지만, 프로모션을 기다려볼 여지도 있어요.`, timingGuide: "필요 시점과 카드·쿠폰 조건을 함께 비교해보세요." };
  }
  return { status: "available", grade: "브론즈", differencePct, reason: `현재 가격은 역대 최저가보다 ${differencePct}% 높아요. 급하지 않다면 할인 시기를 기다리거나 다른 제품도 비교해보는 편이 좋아요.`, timingGuide: "가격 알림을 설정하거나 대체 상품을 다시 비교해보세요." };
};
