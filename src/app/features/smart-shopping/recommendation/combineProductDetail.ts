import type { PriceHistoryPoint } from "../../product-catalog/core/types";
import type { SelectedShoppingProduct } from "../types/recommendation";

export interface CombinedProductDetailData {
  currentPrice: number;
  currentPriceLabel: "모잇 내부 카탈로그 현재가" | "네이버 쇼핑 조회가";
  reviewSummary: string | null;
  priceHistory: PriceHistoryPoint[];
}

/** 매칭되지 않은 네이버 상품에는 내부 스펙·리뷰·가격 이력을 채우지 않습니다. */
export const combineProductDetail = (selected: SelectedShoppingProduct): CombinedProductDetailData => {
  if (selected.source === "internal") {
    const product = selected.recommendation.product;
    return { currentPrice: product.currentPrice, currentPriceLabel: "모잇 내부 카탈로그 현재가", reviewSummary: product.aiReviewSummary, priceHistory: product.priceHistory };
  }
  const internal = selected.matchedInternalProduct;
  return { currentPrice: selected.product.lowestPrice, currentPriceLabel: "네이버 쇼핑 조회가", reviewSummary: internal?.aiReviewSummary ?? null, priceHistory: internal?.priceHistory ?? [] };
};
