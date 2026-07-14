import type { ProductRepository } from "../core/ProductRepository";
import type { CatalogProduct, ProductByCategory, ProductCategoryId } from "../core/types";

/** 로컬 mock/real 카탈로그를 읽는 adapter입니다. 서버 DB 도입 시 이 구현만 교체하면 됩니다. */
export class StaticProductRepository implements ProductRepository {
  constructor(private readonly products: readonly CatalogProduct[]) {}

  getProducts<C extends ProductCategoryId>(categoryId: C): ProductByCategory<C>[] {
    return this.products.filter((product): product is ProductByCategory<C> => product.categoryId === categoryId);
  }

  getProductById(id: string): CatalogProduct | undefined {
    return this.products.find((product) => product.id === id);
  }

  findProductByModelNumber(modelNumber: string): CatalogProduct | undefined {
    const normalized = modelNumber.trim().toUpperCase();
    return this.products.find((product) => product.modelNumber.trim().toUpperCase() === normalized);
  }
}
