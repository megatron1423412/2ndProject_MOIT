import type { CatalogProduct, ProductCategoryId } from "../core/types";

const categoryIds: readonly ProductCategoryId[] = ["air-conditioner", "tv", "refrigerator", "vacuum"];
const isDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export const validateProductData = (mockProducts: readonly CatalogProduct[], realProducts: readonly CatalogProduct[]) => {
  const errors: string[] = [];
  const ids = new Map<string, string>();
  const modelNumbers = new Map<string, string>();

  for (const [collectionName, products] of [["mockProducts", mockProducts], ["realProducts", realProducts]] as const) {
    for (const product of products) {
      const label = `${collectionName}:${product.id || "(id 없음)"}`;
      if (!product.id || !product.brand || !product.modelNumber || !product.name || !product.imagePath || !product.shortInfo || !product.aiReviewSummary || !product.specs) errors.push(`${label}: 필수 필드가 누락되었습니다.`);
      if (!categoryIds.includes(product.categoryId)) errors.push(`${label}: 알 수 없는 categoryId (${String(product.categoryId)})입니다.`);
      if (!Number.isFinite(product.currentPrice) || product.currentPrice < 0) errors.push(`${label}: currentPrice는 0 이상의 숫자여야 합니다.`);
      if (!Array.isArray(product.priceHistory)) errors.push(`${label}: priceHistory는 배열이어야 합니다.`);
      for (const point of product.priceHistory ?? []) {
        if (!isDate(point.date)) errors.push(`${label}: 잘못된 가격 이력 날짜 (${String(point.date)})입니다.`);
        if (!Number.isFinite(point.lowestPrice) || point.lowestPrice <= 0) errors.push(`${label}: 가격 이력은 0보다 커야 합니다.`);
      }
      if (product.dataStatus === "verified" && !isDate(product.verifiedAt)) errors.push(`${label}: verified 상품에는 verifiedAt(YYYY-MM-DD)이 필요합니다.`);
      if (collectionName === "realProducts" && product.dataStatus === "mock") errors.push(`${label}: 실제 상품은 dataStatus: "mock"일 수 없습니다.`);
      if (collectionName === "realProducts" && product.source !== "real") errors.push(`${label}: 실제 상품의 source는 "real"이어야 합니다.`);
      if (collectionName === "mockProducts" && (product.dataStatus !== "mock" || product.source !== "mock")) errors.push(`${label}: 더미 상품은 dataStatus/source가 모두 "mock"이어야 합니다.`);
      const existingId = ids.get(product.id);
      if (existingId) errors.push(`${label}: id가 ${existingId}와 중복됩니다.`); else ids.set(product.id, label);
      const normalizedModelNumber = product.modelNumber.trim().toUpperCase();
      const existingModelNumber = modelNumbers.get(normalizedModelNumber);
      if (existingModelNumber) errors.push(`${label}: modelNumber가 ${existingModelNumber}와 중복됩니다.`); else modelNumbers.set(normalizedModelNumber, label);
    }
  }
  return errors;
};

export const assertValidProductData = (mockProducts: readonly CatalogProduct[], realProducts: readonly CatalogProduct[]) => {
  const errors = validateProductData(mockProducts, realProducts);
  if (errors.length) throw new Error(`[product-catalog] 데이터 검증 실패\n${errors.map((error) => `- ${error}`).join("\n")}`);
};
