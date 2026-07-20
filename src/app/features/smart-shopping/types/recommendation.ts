import type { CatalogProduct, ProductRecommendation } from "../../product-catalog/core/types";

export type SmartShoppingStage =
  | "collecting-criteria"
  | "reviewing-criteria"
  | "loading-recommendations"
  | "choosing-product"
  | "viewing-product-detail"
  | "choosing-next-action"
  | "setting-price-alert"
  | "confirming-purchase-link"
  | "grading-purchase"
  | "grade-complete";

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
  productType?: string;
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

export type RecommendationViewState =
  | { stage: "loading-recommendations"; selectedProduct: null }
  | { stage: "choosing-product"; selectedProduct: null }
  | { stage: "viewing-product-detail"; selectedProduct: SelectedShoppingProduct }
  | { stage: "choosing-next-action"; selectedProduct: SelectedShoppingProduct }
  | { stage: "setting-price-alert"; selectedProduct: SelectedShoppingProduct }
  | { stage: "confirming-purchase-link"; selectedProduct: SelectedShoppingProduct; purchaseLink?: string }
  | { stage: "grading-purchase"; selectedProduct: SelectedShoppingProduct; purchaseGradeInput: PurchaseGradeDiagnosisInput }
  | { stage: "grade-complete"; selectedProduct: SelectedShoppingProduct; purchaseGradeInput: PurchaseGradeDiagnosisInput; purchaseGradeResult: import("../grade/calculatePurchaseGrade").PurchaseGradeResult };

export const initialRecommendationViewState: RecommendationViewState = {
  stage: "loading-recommendations",
  selectedProduct: null,
};

export type RecommendationViewAction =
  | { type: "start-loading" }
  | { type: "recommendations-settled" }
  | { type: "select-product"; product: SelectedShoppingProduct }
  | { type: "back-to-list" }
  | { type: "choose-next-action" }
  | { type: "set-price-alert" }
  | { type: "confirm-purchase-link"; purchaseLink?: string }
  | { type: "start-purchase-grade"; input: PurchaseGradeDiagnosisInput }
  | { type: "complete-purchase-grade"; result: import("../grade/calculatePurchaseGrade").PurchaseGradeResult }
  | { type: "return-to-next-actions" };

export const recommendationViewReducer = (
  state: RecommendationViewState,
  action: RecommendationViewAction,
): RecommendationViewState => {
  switch (action.type) {
    case "start-loading": return { stage: "loading-recommendations", selectedProduct: null };
    case "recommendations-settled": return { stage: "choosing-product", selectedProduct: null };
    case "select-product": return { stage: "viewing-product-detail", selectedProduct: action.product };
    case "back-to-list": return { stage: "choosing-product", selectedProduct: null };
    case "choose-next-action": return state.selectedProduct ? { stage: "choosing-next-action", selectedProduct: state.selectedProduct } : state;
    case "set-price-alert": return state.selectedProduct ? { stage: "setting-price-alert", selectedProduct: state.selectedProduct } : state;
    case "confirm-purchase-link": return state.selectedProduct ? { stage: "confirming-purchase-link", selectedProduct: state.selectedProduct, purchaseLink: action.purchaseLink } : state;
    case "start-purchase-grade": return { stage: "grading-purchase", selectedProduct: action.input.selectedProduct, purchaseGradeInput: action.input };
    case "complete-purchase-grade": return state.stage === "grading-purchase" ? { ...state, stage: "grade-complete", purchaseGradeResult: action.result } : state;
    case "return-to-next-actions": return state.selectedProduct ? { stage: "choosing-next-action", selectedProduct: state.selectedProduct } : state;
  }
};

export const deriveCriteriaStage = (completed: boolean, currentStepId?: string | null): SmartShoppingStage => {
  if (completed) return "loading-recommendations";
  return currentStepId?.includes("summary") || currentStepId?.includes("confirm")
    ? "reviewing-criteria"
    : "collecting-criteria";
};
