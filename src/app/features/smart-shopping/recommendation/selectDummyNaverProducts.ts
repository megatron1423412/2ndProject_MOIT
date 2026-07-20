import type { CatalogProduct, ProductCategoryId, ProductRecommendation } from "../../product-catalog/core/types";

/**
 * The NAVER-branded panel is intentionally an internal, deterministic dummy
 * list. It must not share products with the AI-ranked recommendation column.
 */
export const selectDummyNaverProducts = (
  products: readonly CatalogProduct[],
  categoryId: ProductCategoryId,
  leftRecommendations: readonly ProductRecommendation[],
): CatalogProduct[] => {
  const leftProductIds = new Set(leftRecommendations.map(({ product }) => product.id));

  return products
    .filter((product) => product.categoryId === categoryId)
    .filter((product) => product.dataStatus !== "discontinued")
    .filter((product) => !leftProductIds.has(product.id))
    .slice(0, 5);
};

/** Internal selections retain the existing product-detail interaction path. */
export const createDummyCatalogRecommendation = (product: CatalogProduct): ProductRecommendation => ({
  product,
  score: 0,
  matchedCoreCriteria: [],
  unmatchedOrUnknownCriteria: [],
  recommendationReasons: [],
  preferenceMatchCount: 0,
  dataCompleteness: 0,
});
