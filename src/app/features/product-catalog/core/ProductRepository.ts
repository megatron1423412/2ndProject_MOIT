import type { CatalogProduct, ProductByCategory, ProductCategoryId } from "./types";

/** 실제 API/DB adapter도 이 경계만 구현하면 flow와 UI를 유지할 수 있습니다. */
export interface ProductRepository {
  getProducts<C extends ProductCategoryId>(categoryId: C): ProductByCategory<C>[];
  getProductById(id: string): CatalogProduct | undefined;
  findProductByModelNumber(modelNumber: string): CatalogProduct | undefined;
}
