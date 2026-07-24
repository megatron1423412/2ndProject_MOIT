import { summarizePriceHistory } from "../../product-catalog/core/priceHistory";
import type { FlowAnswers } from "../../chat-flow/core/types";
import type { ProductRecommendation } from "../../product-catalog/core/types";
import { getSelectedPriceRisePct } from "../actions/findAlternativeProducts";
import type { PurchaseGradeDiagnosisInput, SelectedShoppingProduct } from "../types/recommendation";

const getRecommendation = (selected: SelectedShoppingProduct, recommendations: ProductRecommendation[]) => selected.source === "internal"
  ? selected.recommendation
  : recommendations.find((item) => item.product.id === selected.matchedInternalProduct?.id);

export const startPurchaseGradeDiagnosis = ({ selected, recommendations, userCriteria }: { selected: SelectedShoppingProduct; recommendations: ProductRecommendation[]; userCriteria: FlowAnswers }): PurchaseGradeDiagnosisInput => {
  const recommendation = getRecommendation(selected, recommendations);
  const internal = selected.source === "internal" ? selected.recommendation.product : selected.matchedInternalProduct;
  const currentPrice = selected.source === "internal" ? selected.recommendation.product.currentPrice : selected.product.lowestPrice;
  const history = internal?.priceHistory ?? [];
  const allTimeLow = history.length ? summarizePriceHistory(currentPrice, history).allTimeLow : undefined;
  return {
    selectedProduct: selected,
    userCriteria,
    score: recommendation?.score,
    matchedCriteria: recommendation?.matchedCoreCriteria ?? [],
    unmatchedCriteria: recommendation?.unmatchedOrUnknownCriteria ?? ["모잇 DB 검증 정보 없음"],
    currentPrice,
    allTimeLow,
    priceRisePct: getSelectedPriceRisePct(selected),
    additionalCostCheck: internal?.categoryId === "air-conditioner"
      ? "설치비·배관·타공·철거비 확인 필요"
      : internal?.categoryId === "refrigerator"
        ? "가구장 수치·문 열림 공간 및 배송/사다리차 비용 확인 필요"
        : internal?.categoryId === "tv"
          ? "벽걸이/스탠드 설치비 및 폐가전 수거 조건 확인 필요"
          : internal?.categoryId === "vacuum"
            ? "필터/물걸레 소모품 비용 및 무상 A/S 기간 확인 필요"
            : "배송·설치·부가비용 확인 필요",
    priceDataConfidence: history.length ? "mock-history" : internal ? "no-history" : "naver-candidate",
  };
};

export const PURCHASE_GRADE_DIAGNOSIS_START_MESSAGE = "선택하신 상품을 기준으로 구매등급진단을 시작할게요. 가격 수준과 조건 적합도, 추가비용 위험을 함께 확인해볼게요.";
