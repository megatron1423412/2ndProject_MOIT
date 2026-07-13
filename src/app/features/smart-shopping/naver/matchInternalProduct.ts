import type { CatalogProduct } from "../../product-catalog/core/types";
import type { NaverShoppingProduct } from "../types/recommendation";

export const normalizeModelNumber = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const matchInternalProduct = (
  naverProduct: NaverShoppingProduct,
  internalProducts: CatalogProduct[],
): CatalogProduct | undefined => {
  const explicitModel = normalizeModelNumber(naverProduct.modelNumber ?? "");
  if (explicitModel) {
    const exact = internalProducts.find((product) => normalizeModelNumber(product.modelNumber) === explicitModel);
    if (exact) return exact;
    const alias = internalProducts.find((product) => product.modelAliases?.some((value) => normalizeModelNumber(value) === explicitModel));
    if (alias) return alias;
  }

  const normalizedTitle = normalizeModelNumber(naverProduct.title);
  const normalizedBrand = normalizeModelNumber(naverProduct.brand || naverProduct.maker);
  return internalProducts.find((product) => {
    const brandMatches = Boolean(normalizedBrand) && normalizeModelNumber(product.brand) === normalizedBrand;
    const modelCandidates = [product.modelNumber, ...(product.modelAliases ?? [])].map(normalizeModelNumber);
    return brandMatches && modelCandidates.some((model) => model.length >= 4 && normalizedTitle.includes(model));
  });
};
