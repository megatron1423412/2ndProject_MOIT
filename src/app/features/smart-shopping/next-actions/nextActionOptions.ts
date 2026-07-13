export const NEXT_ACTION_OPTIONS = [
  { id: "purchase-grade", label: "⭐구매등급진단⭐", description: "해당 물건을 구매하시면 얼마나 가성비 있게 소비하시는지 알려드려요😇", primary: true },
  { id: "purchase-link", label: "구매 링크 연결", primary: false },
  { id: "price-alert", label: "최저가 알람 설정", primary: false },
  { id: "back-to-list", label: "제품 목록으로 돌아가기", primary: false },
  { id: "end-chat", label: "채팅 종료하기", primary: false },
] as const;

export type NextActionId = (typeof NEXT_ACTION_OPTIONS)[number]["id"];

export const getVisibleNextActionOptions = (showPurchaseGrade = true) =>
  NEXT_ACTION_OPTIONS.filter((option) => showPurchaseGrade || option.id !== "purchase-grade");
