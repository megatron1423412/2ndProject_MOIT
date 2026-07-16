import { summarizePriceHistory } from "../../product-catalog/core/priceHistory";
import type { FlowAnswers } from "../../chat-flow/core/types";
import type { ProductDataStatus, ProductRecommendation } from "../../product-catalog/core/types";
import type { SelectedShoppingProduct } from "../types/recommendation";

export interface ProductQuestionRequest {
  question: string;
  selectedProduct: { name: string; brand: string; modelNumber?: string; categoryId?: string; source: "internal" | "naver" };
  userCriteria: FlowAnswers;
  fit: { score?: number; matchedCriteria: string[]; unmatchedCriteria: string[] };
  priceSummary: { currentPrice: number; allTimeLow?: number; averagePrice?: number; history: { date: string; lowestPrice: number }[] };
  sourceAndConfidence: { dataStatus: ProductDataStatus | "naver-candidate"; verifiedInformation: string[]; unknownInformation: string[] };
  reviewSummary?: string;
  strengths?: string[];
}

const getRecommendation = (selected: SelectedShoppingProduct, recommendations: ProductRecommendation[]) => selected.source === "internal"
  ? selected.recommendation
  : recommendations.find((item) => item.product.id === selected.matchedInternalProduct?.id);

export const buildProductQuestionRequest = ({ selected, recommendations, userCriteria }: { selected: SelectedShoppingProduct; recommendations: ProductRecommendation[]; userCriteria: FlowAnswers }): ProductQuestionRequest => {
  const recommendation = getRecommendation(selected, recommendations);
  const internal = selected.source === "internal" ? selected.recommendation.product : selected.matchedInternalProduct;
  const currentPrice = selected.source === "internal" ? selected.recommendation.product.currentPrice : selected.product.lowestPrice;
  const history = internal?.priceHistory ?? [];
  const price = history.length ? summarizePriceHistory(currentPrice, history) : undefined;
  const name = selected.source === "internal" ? selected.recommendation.product.name : selected.product.title;
  return {
    question: "",
    selectedProduct: { name, brand: internal?.brand ?? (selected.source === "naver" ? selected.product.brand || selected.product.maker : ""), modelNumber: internal?.modelNumber, categoryId: internal?.categoryId, source: selected.source },
    userCriteria,
    fit: { score: recommendation?.score, matchedCriteria: recommendation?.matchedCoreCriteria ?? [], unmatchedCriteria: recommendation?.unmatchedOrUnknownCriteria ?? ["모잇 DB 검증 정보 없음"] },
    priceSummary: { currentPrice, allTimeLow: price?.allTimeLow, averagePrice: price?.averagePrice, history },
    sourceAndConfidence: {
      dataStatus: internal?.dataStatus ?? "naver-candidate",
      verifiedInformation: internal ? ["모잇 내부 카탈로그 상품 정보", "가격 이력"] : ["네이버 쇼핑 기본 상품 정보"],
      unknownInformation: internal ? ["실제 설치비·실시간 할인·실제 재고"] : ["모잇 DB 스펙", "AI 리뷰", "가격 이력", "실제 설치비·할인"],
    },
    reviewSummary: internal?.aiReviewSummary,
    strengths: internal?.strengths,
  };
};

export const buildProductQuestionPrompt = (request: ProductQuestionRequest) => `선택 상품 문맥:\n${JSON.stringify({ ...request, question: undefined })}\n\n사용자 질문: ${request.question}`;
