import type { ProductRepository } from "../core/ProductRepository";
import type { CatalogProduct, ProductByCategory, ProductCategoryId } from "../core/types";

export class MockProductRepository implements ProductRepository {
  constructor(private readonly products: readonly CatalogProduct[]) {}

  getProducts<C extends ProductCategoryId>(categoryId: C): ProductByCategory<C>[] {
    return this.products.filter((product): product is ProductByCategory<C> => product.categoryId === categoryId);
  }

  getProductById(id: string) {
    return this.products.find((product) => product.id === id);
  }
}
