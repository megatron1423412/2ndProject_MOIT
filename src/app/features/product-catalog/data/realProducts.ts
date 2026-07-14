import type { CatalogProduct } from "../core/types";
import { REAL_AIR_CONDITIONER_PRODUCTS } from "./real/airConditioners";
import { REAL_REFRIGERATOR_PRODUCTS } from "./real/refrigerators";
import { REAL_TV_PRODUCTS } from "./real/televisions";
import { REAL_VACUUM_PRODUCTS } from "./real/vacuumCleaners";

/** 실제 상품은 상품군별 real/ 파일에만 입력하고, 이 파일은 네 배열을 합치는 역할만 합니다. */
export const realProducts: CatalogProduct[] = [
  ...REAL_AIR_CONDITIONER_PRODUCTS,
  ...REAL_TV_PRODUCTS,
  ...REAL_REFRIGERATOR_PRODUCTS,
  ...REAL_VACUUM_PRODUCTS,
];
