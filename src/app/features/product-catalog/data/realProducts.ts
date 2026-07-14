import type { CatalogProduct } from "../core/types";

/**
 * 검증한 실제 상품은 이 배열에 추가합니다. mockProducts.ts의 항목 형식을 그대로 참고하세요.
 * 필수 필드: id, categoryId, brand, modelNumber, name, imagePath, 현재 가격, specs, dataStatus, source, updatedAt.
 * 확인하지 못한 값은 임의로 만들지 말고 타입이 허용하는 null/undefined/"unknown"만 사용하세요.
 * id와 modelNumber는 전체 카탈로그에서 중복되면 안 됩니다. 이미지 경로는 /assets/products/real/<category>/<model-number>.webp 형식입니다.
 * 가격 이력이 없으면 priceHistory: []로 두며, 이력은 { date: "YYYY-MM-DD", lowestPrice: 양수 } 형식입니다.
 * 실제 상품은 source: "real"과 verified/unverified/stale/discontinued 중 하나의 dataStatus를 사용합니다.
 */
export const realProducts: CatalogProduct[] = [
  // 검증한 실제 상품을 여기에 추가합니다.
];
