import type { CatalogProduct, ProductCategoryId } from "../product-catalog/core/types";
import { resolvePurchaseLink } from "../smart-shopping/next-actions/resolvePurchaseLink";
import type { NaverShoppingProduct, SelectedShoppingProduct } from "../smart-shopping/types/recommendation";
import type { FavoriteDraft } from "./types";

const allTimeLow = (product?: CatalogProduct) =>
  product?.priceHistory.length ? Math.min(...product.priceHistory.map((point) => point.lowestPrice)) : undefined;

export const createFavoriteDraft = ({
  userId,
  categoryId,
  selected,
  naverItems,
}: {
  userId: string;
  categoryId: ProductCategoryId;
  selected: SelectedShoppingProduct;
  naverItems: NaverShoppingProduct[];
}): FavoriteDraft => {
  if (selected.source === "internal") {
    const product = selected.recommendation.product;
    return {
      userId,
      productId: product.id,
      source: "internal",
      categoryId: product.categoryId,
      name: product.name,
      brand: product.brand,
      modelNumber: product.modelNumber,
      imagePath: product.imagePath,
      currentPrice: product.currentPrice,
      allTimeLow: allTimeLow(product),
      purchaseLink: resolvePurchaseLink(selected, naverItems),
      internalProductId: product.id,
      selectedProduct: selected,
      dataStatus: product.dataStatus,
    };
  }

  const internal = selected.matchedInternalProduct;
  return {
    userId,
    productId: selected.product.productId,
    source: "naver",
    categoryId: internal?.categoryId ?? categoryId,
    name: selected.product.title,
    brand: selected.product.brand || selected.product.maker || "브랜드 정보 없음",
    modelNumber: selected.product.modelNumber ?? internal?.modelNumber,
    imagePath: selected.product.imageUrl,
    currentPrice: selected.product.lowestPrice,
    allTimeLow: allTimeLow(internal),
    purchaseLink: selected.product.productUrl || undefined,
    internalProductId: internal?.id,
    selectedProduct: selected,
    dataStatus: "naver-candidate",
  };
};
