import type { CatalogProduct, ProductRecommendation } from "../../product-catalog/core/types";

export type SmartShoppingStage =
  | "collecting-criteria"
  | "reviewing-criteria"
  | "loading-recommendations"
  | "choosing-product"
  | "viewing-product-detail"
  | "purchase-grade-diagnosis";

export interface NaverShoppingProduct {
  productId: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  lowestPrice: number;
  highestPrice: number;
  mallName: string;
  brand: string;
  maker: string;
  category: string[];
  source: "naver";
  /** 네이버 원본에 명시적 모델 필드가 생기거나 서버가 확정 추출한 경우에만 설정합니다. */
  modelNumber?: string;
}

export type SelectedShoppingProduct =
  | { source: "internal"; recommendation: ProductRecommendation }
  | { source: "naver"; product: NaverShoppingProduct; matchedInternalProduct?: CatalogProduct };

export interface PurchaseGradeDiagnosisInput {
  selectedProduct: SelectedShoppingProduct;
  userCriteria: import("../../chat-flow/core/types").FlowAnswers;
  score?: number;
  matchedCriteria: string[];
  unmatchedCriteria: string[];
  currentPrice: number;
  allTimeLow?: number;
  priceRisePct?: number | null;
  additionalCostCheck: string;
  priceDataConfidence: "mock-history" | "naver-candidate" | "no-history";
}

export interface RecommendationViewState {
  stage: "loading-recommendations" | "choosing-product" | "viewing-product-detail" | "purchase-grade-diagnosis";
  selectedProduct: SelectedShoppingProduct | null;
  purchaseGradeInput?: PurchaseGradeDiagnosisInput;
}

export const initialRecommendationViewState: RecommendationViewState = {
  stage: "loading-recommendations",
  selectedProduct: null,
};

export type RecommendationViewAction =
  | { type: "start-loading" }
  | { type: "recommendations-settled" }
  | { type: "select-product"; product: SelectedShoppingProduct }
  | { type: "back-to-list" }
  | { type: "start-purchase-grade"; input: PurchaseGradeDiagnosisInput };

export const recommendationViewReducer = (
  state: RecommendationViewState,
  action: RecommendationViewAction,
): RecommendationViewState => {
  switch (action.type) {
    case "start-loading": return { ...state, stage: "loading-recommendations", selectedProduct: null };
    case "recommendations-settled": return { ...state, stage: "choosing-product" };
    case "select-product": return { stage: "viewing-product-detail", selectedProduct: action.product };
    case "back-to-list": return { stage: "choosing-product", selectedProduct: null };
    case "start-purchase-grade": return { stage: "purchase-grade-diagnosis", selectedProduct: action.input.selectedProduct, purchaseGradeInput: action.input };
  }
};

export const deriveCriteriaStage = (completed: boolean, currentStepId?: string | null): SmartShoppingStage => {
  if (completed) return "loading-recommendations";
  return currentStepId?.includes("summary") || currentStepId?.includes("confirm")
    ? "reviewing-criteria"
    : "collecting-criteria";
};
