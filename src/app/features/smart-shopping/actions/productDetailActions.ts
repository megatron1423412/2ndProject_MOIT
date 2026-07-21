export const PRODUCT_DETAIL_ACTIONS = [
  { id: "promotion", label: "구매 최적기 제안" },
  { id: "alternative", label: "다른 제품 추천" },
  { id: "purchase-tip", label: "싸게 구매하는 법 TIP" },
  { id: "question", label: "기타·직접 질문 입력" },
  { id: "back-to-list", label: "목록 다시 보기" },
  { id: "next-step", label: "다음 단계로" },
] as const;

export type ProductDetailActionId = "promotion" | "alternative" | "purchase-tip" | "question";
export type ProductDetailActionButtonId = (typeof PRODUCT_DETAIL_ACTIONS)[number]["id"];

export const getProductDetailActionLabel = (id: ProductDetailActionButtonId) =>
  PRODUCT_DETAIL_ACTIONS.find((action) => action.id === id)?.label ?? id;
