import type { CatalogProduct } from "../core/types";
import { StaticProductRepository } from "../repositories/StaticProductRepository";

/** @deprecated 기존 호출 호환용입니다. 새 코드는 productCatalog의 productRepository를 사용하세요. */
export class MockProductRepository extends StaticProductRepository {
  constructor(products: readonly CatalogProduct[]) {
    super(products);
  }
}
