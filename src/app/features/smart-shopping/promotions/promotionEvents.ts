import type { ProductCategoryId } from "../../product-catalog/core/types";

export interface PromotionEvent {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  noticeStartDate: string;
  applicableCategories: ProductCategoryId[];
  message: string;
}

const allAppliances: ProductCategoryId[] = ["air-conditioner", "tv", "refrigerator", "vacuum"];

/** 실제 행사 확정 정보가 아닌 화면 흐름용 안내 데이터입니다. */
export const PROMOTION_EVENTS: PromotionEvent[] = [
  { id: "lunar-new-year", label: "설·명절 프로모션", startDate: "2026-01-20", endDate: "2026-02-22", noticeStartDate: "2026-01-06", applicableCategories: allAppliances, message: "설·명절 시즌 프로모션이 시작될 가능성이 있어요. 급하지 않다면 카드 할인과 쇼핑몰 쿠폰 조건을 함께 확인해보세요." },
  { id: "summer-preseason", label: "여름 성수기 전 할인", startDate: "2026-06-15", endDate: "2026-07-31", noticeStartDate: "2026-05-25", applicableCategories: ["air-conditioner", "tv", "vacuum"], message: "여름 성수기 전후로 재고·설치 일정 관련 프로모션이 나올 가능성이 있어요. 실제 할인 여부는 판매처와 카드 조건을 확인해주세요." },
  { id: "chuseok", label: "추석 프로모션", startDate: "2026-09-08", endDate: "2026-10-05", noticeStartDate: "2026-08-20", applicableCategories: allAppliances, message: "곧 추석 시즌 프로모션이 시작될 가능성이 있어요. 급하지 않다면 추석 전후 카드 할인과 쇼핑몰 쿠폰을 확인해보세요." },
  { id: "model-clearance", label: "시즌 종료·이월 모델 할인", startDate: "2026-10-15", endDate: "2026-11-20", noticeStartDate: "2026-10-01", applicableCategories: allAppliances, message: "시즌 종료·이월 모델 정리 시기에는 가격 부담이 낮아질 가능성이 있어요. 신형과의 사양·보증 차이를 먼저 비교해보세요." },
  { id: "year-end", label: "연말 쇼핑 행사", startDate: "2026-11-20", endDate: "2026-12-31", noticeStartDate: "2026-11-05", applicableCategories: allAppliances, message: "연말 쇼핑 행사 시기에 묶음 쿠폰이나 결제수단 혜택이 나올 가능성이 있어요. 표시가가 아닌 최종 결제액을 비교해주세요." },
];
