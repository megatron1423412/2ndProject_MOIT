import type { CatalogProduct, ProductCategoryId } from "../core/types";
import { StaticProductRepository } from "../repositories/StaticProductRepository";
import { mockProducts } from "./mockProducts";
import { realProducts } from "./realProducts";
import { assertValidProductData } from "./validateProducts";

const categoryIds: readonly ProductCategoryId[] = ["air-conditioner", "tv", "refrigerator", "vacuum"];

/** 실제 상품이 하나라도 있는 상품군은 전부 real로 전환하고, 나머지만 mock으로 유지합니다. */
export const buildCatalogProducts = (mock: readonly CatalogProduct[], real: readonly CatalogProduct[]) => categoryIds.flatMap((categoryId) => {
  const realForCategory = real.filter((product) => product.categoryId === categoryId);
  return realForCategory.length > 0 ? realForCategory : mock.filter((product) => product.categoryId === categoryId);
});

export const getCatalogSourceByCategory = (real: readonly CatalogProduct[]) => Object.fromEntries(categoryIds.map((categoryId) => [categoryId, real.some((product) => product.categoryId === categoryId) ? "real" : "mock"])) as Record<ProductCategoryId, "real" | "mock">;

/** UI와 flow가 읽는 카탈로그 단일 진입점입니다. */
export const catalogProducts = buildCatalogProducts(mockProducts, realProducts);
export const catalogSourceByCategory = getCatalogSourceByCategory(realProducts);
export const productRepository = new StaticProductRepository(catalogProducts);

if (import.meta.env?.DEV) assertValidProductData(mockProducts, realProducts);
