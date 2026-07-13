import type { NaverShoppingProduct, SelectedShoppingProduct } from "../types/recommendation";
import { matchInternalProduct } from "../naver/matchInternalProduct";

export const resolvePurchaseLink = (selected: SelectedShoppingProduct, naverItems: NaverShoppingProduct[]) => {
  if (selected.source === "naver") return selected.product.productUrl || undefined;
  const offer = naverItems.find((item) => matchInternalProduct(item, [selected.recommendation.product])?.id === selected.recommendation.product.id && item.productUrl);
  return offer?.productUrl;
};
