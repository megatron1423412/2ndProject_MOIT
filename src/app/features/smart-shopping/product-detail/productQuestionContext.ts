import { summarizePriceHistory } from "../../product-catalog/core/priceHistory";
import type { FlowAnswers } from "../../chat-flow/core/types";
import type { ProductDataStatus, ProductRecommendation } from "../../product-catalog/core/types";
import type { SelectedShoppingProduct } from "../types/recommendation";
import { displayLabel, formatSmartShoppingCriteria, PRODUCT_CATEGORY_LABELS } from "../../chat-flow/flows/appliances/displayLabels";

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

export const buildProductQuestionPrompt = (request: ProductQuestionRequest) => {
  const status = displayLabel({ verified: "검증 완료", unverified: "미검증", stale: "재확인 필요", discontinued: "판매 중단", mock: "테스트용 데이터", "naver-candidate": "네이버 쇼핑 후보" }, request.sourceAndConfidence.dataStatus);
  const source = request.selectedProduct.source === "internal" ? "모잇 내부 카탈로그" : "네이버 쇼핑";
  const context = {
    "선택 상품": {
      상품명: request.selectedProduct.name,
      브랜드: request.selectedProduct.brand,
      모델번호: request.selectedProduct.modelNumber,
      상품군: displayLabel(PRODUCT_CATEGORY_LABELS, request.selectedProduct.categoryId, "상품군 정보 없음"),
      정보출처: source,
    },
    "선택 조건": formatSmartShoppingCriteria(request.userCriteria),
    "조건 적합도": { 점수: request.fit.score, 충족조건: request.fit.matchedCriteria, 확인필요조건: request.fit.unmatchedCriteria },
    "가격 정보": {
      현재가: request.priceSummary.currentPrice,
      역대최저가: request.priceSummary.allTimeLow,
      평균가: request.priceSummary.averagePrice,
      가격이력: request.priceSummary.history.map(({ date, lowestPrice }) => `${date}: ${lowestPrice.toLocaleString("ko-KR")}원`),
    },
    "정보 확인 상태": { 상태: status, 확인된정보: request.sourceAndConfidence.verifiedInformation, 모르는정보: request.sourceAndConfidence.unknownInformation },
    "AI 리뷰 요약": request.reviewSummary,
    장점: request.strengths,
  };
  return `선택 상품 문맥:\n${JSON.stringify(context)}\n\n사용자 질문: ${request.question}`;
};
