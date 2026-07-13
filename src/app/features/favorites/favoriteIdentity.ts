import type { FavoriteProduct } from "./types";

export type FavoriteIdentityInput = Pick<FavoriteProduct, "source" | "productId" | "internalProductId" | "modelNumber" | "purchaseLink">;

export const normalizeFavoriteModelNumber = (modelNumber?: string) =>
  modelNumber?.trim().toUpperCase().replace(/[^0-9A-Z가-힣]/g, "") ?? "";

/** Prefer verified catalog identity, then Naver identity, normalized model, and finally the source URL. */
export const getFavoriteProductIdentity = (product: FavoriteIdentityInput) => {
  if (product.internalProductId) return `internal:${product.internalProductId}`;
  if (product.source === "internal" && product.productId) return `internal:${product.productId}`;
  if (product.source === "naver" && product.productId) return `naver:${product.productId}`;
  const modelNumber = normalizeFavoriteModelNumber(product.modelNumber);
  if (modelNumber) return `model:${modelNumber}`;
  if (product.purchaseLink?.trim()) return `${product.source}:url:${product.purchaseLink.trim()}`;
  return `${product.source}:unknown`;
};
