import { summarizePriceHistory } from "../../product-catalog/core/priceHistory";
import type { ProductRecommendation } from "../../product-catalog/core/types";
import type { SelectedShoppingProduct } from "../types/recommendation";

const getSelectedRecommendation = (selected: SelectedShoppingProduct, recommendations: ProductRecommendation[]) =>
  selected.source === "internal"
    ? selected.recommendation
    : recommendations.find((item) => item.product.id === selected.matchedInternalProduct?.id);

const getSelectedCurrentPrice = (selected: SelectedShoppingProduct) =>
  selected.source === "internal" ? selected.recommendation.product.currentPrice : selected.product.lowestPrice;

export const getSelectedPriceRisePct = (selected: SelectedShoppingProduct): number | null => {
  const product = selected.source === "internal" ? selected.recommendation.product : selected.matchedInternalProduct;
  const currentPrice = getSelectedCurrentPrice(selected);
  if (!product?.priceHistory.length || !currentPrice) return null;
  const { allTimeLow } = summarizePriceHistory(currentPrice, product.priceHistory);
  if (allTimeLow <= 0 || currentPrice <= allTimeLow) return null;
  return Math.round(((currentPrice - allTimeLow) / allTimeLow) * 1000) / 10;
};

const getPricePosition = (recommendation: ProductRecommendation) => {
  const { allTimeLow } = summarizePriceHistory(recommendation.product.currentPrice, recommendation.product.priceHistory);
  return allTimeLow > 0 ? (recommendation.product.currentPrice - allTimeLow) / allTimeLow : Number.POSITIVE_INFINITY;
};

export const findAlternativeProducts = ({
  selected,
  recommendations,
}: { selected: SelectedShoppingProduct; recommendations: ProductRecommendation[] }) => {
  const selectedRecommendation = getSelectedRecommendation(selected, recommendations);
  if (!selectedRecommendation) return [];
  const selectedId = selected.source === "internal" ? selected.recommendation.product.id : selected.matchedInternalProduct?.id;
  const currentPrice = getSelectedCurrentPrice(selected);
  const currentPosition = getPricePosition(selectedRecommendation);
  const minimumScore = selectedRecommendation.score;

  return recommendations
    .filter((item) => item.product.id !== selectedId)
    .filter((item) => item.score >= minimumScore)
    .filter((item) => item.product.currentPrice < currentPrice || getPricePosition(item) < currentPosition)
    .slice(0, 3);
};
