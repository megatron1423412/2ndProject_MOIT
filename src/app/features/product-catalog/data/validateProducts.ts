import type { CatalogProduct, ProductCategoryId } from "../core/types";

const categoryIds: readonly ProductCategoryId[] = ["air-conditioner", "tv", "refrigerator", "vacuum"];
const isDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const isFiniteNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value);
const isBoolean = (value: unknown) => typeof value === "boolean";
const isBooleanOrNull = (value: unknown) => isBoolean(value) || value === null;

const validateCategorySpecs = (product: CatalogProduct, label: string, errors: string[]) => {
  const specs = product.specs as Record<string, unknown>;
  const error = (field: string, message: string) => errors.push(`${label}: specs.${field} ${message}`);
  if (product.categoryId === "air-conditioner") {
    if (!["standing", "wall", "two-in-one", "window"].includes(String(specs.type))) error("type", "값이 올바르지 않습니다.");
    if (!isFiniteNumber(specs.ratedCoolingAreaPyeong) || specs.ratedCoolingAreaPyeong <= 0) error("ratedCoolingAreaPyeong", "는 0보다 큰 숫자여야 합니다.");
    ["inverter", "autoDry"].forEach((field) => { if (!isBoolean(specs[field])) error(field, "는 boolean이어야 합니다."); });
    ["basicInstallationIncluded", "officialInstallation", "rebateEligible"].forEach((field) => { if (field in specs) error(field, "는 제거된 에어컨 스펙 필드입니다."); });
    if (![1, 2, 3, 4, 5].includes(Number(specs.energyGrade))) error("energyGrade", "값이 올바르지 않습니다.");
  } else if (product.categoryId === "tv") {
    if (!["android-tv", "google-tv", "other"].includes(String(specs.os))) error("os", "값이 올바르지 않습니다.");
    if (!["4k-uhd", "full-hd"].includes(String(specs.resolution))) error("resolution", "값이 올바르지 않습니다.");
    if (![43, 55, 65, 75].includes(Number(specs.screenSizeInches))) error("screenSizeInches", "값이 올바르지 않습니다.");
    if (!["IPS", "VA"].includes(String(specs.panel))) error("panel", "값이 올바르지 않습니다.");
    if (!isFiniteNumber(specs.warrantyYears) || specs.warrantyYears < 0) error("warrantyYears", "는 0 이상의 숫자여야 합니다.");
    if (!isBoolean(specs.hdr)) error("hdr", "는 boolean이어야 합니다.");
    if (![1, 2, 3, 4, 5].includes(Number(specs.energyGrade))) error("energyGrade", "값이 올바르지 않습니다.");
    if (!isBooleanOrNull(specs.rebateEligible)) error("rebateEligible", "는 boolean 또는 null이어야 합니다.");
  } else if (product.categoryId === "refrigerator") {
    if (!["two-door", "four-door-value"].includes(String(specs.doorType))) error("doorType", "값이 올바르지 않습니다.");
    if (!isFiniteNumber(specs.capacityLiters) || specs.capacityLiters <= 0) error("capacityLiters", "는 0보다 큰 숫자여야 합니다.");
    ["metalDoor", "inverter", "freestanding"].forEach((field) => { if (!isBoolean(specs[field])) error(field, "는 boolean이어야 합니다."); });
    if (!["indirect", "fan", "direct"].includes(String(specs.coolingMethod))) error("coolingMethod", "값이 올바르지 않습니다.");
    if (!isFiniteNumber(specs.corePartWarrantyYears) || specs.corePartWarrantyYears < 0) error("corePartWarrantyYears", "는 0 이상의 숫자여야 합니다.");
    if (![1, 2, 3, 4, 5].includes(Number(specs.energyGrade))) error("energyGrade", "값이 올바르지 않습니다.");
  } else {
    if (!["wireless-value", "wired-major"].includes(String(specs.powerType))) error("powerType", "값이 올바르지 않습니다.");
    if (specs.suctionAw !== undefined && (!isFiniteNumber(specs.suctionAw) || specs.suctionAw <= 0)) error("suctionAw", "는 양수이거나 생략되어야 합니다.");
    if (specs.suctionPa !== undefined && (!isFiniteNumber(specs.suctionPa) || specs.suctionPa <= 0)) error("suctionPa", "는 양수이거나 생략되어야 합니다.");
    ["replaceableBattery", "standingDock"].forEach((field) => { if (specs[field] !== undefined && !isBoolean(specs[field])) error(field, "는 boolean이거나 생략되어야 합니다."); });
    if (!["H13", "H14", "below-H13"].includes(String(specs.hepaGrade))) error("hepaGrade", "값이 올바르지 않습니다.");
    if (!isBoolean(specs.softRoller)) error("softRoller", "는 boolean이어야 합니다.");
    if (!isFiniteNumber(specs.bodyWeightKg) || specs.bodyWeightKg <= 0) error("bodyWeightKg", "는 0보다 큰 숫자여야 합니다.");
    if (!isFiniteNumber(specs.warrantyYears) || specs.warrantyYears < 0) error("warrantyYears", "는 0 이상의 숫자여야 합니다.");
  }
};

export const validateProductData = (mockProducts: readonly CatalogProduct[], realProducts: readonly CatalogProduct[]) => {
  const errors: string[] = [];
  const ids = new Map<string, string>();
  const modelNumbers = new Map<string, string>();

  for (const [collectionName, products] of [["mockProducts", mockProducts], ["realProducts", realProducts]] as const) {
    for (const product of products) {
      const label = `${collectionName}:${product.id || "(id 없음)"}`;
      if (!product.id || !product.brand || !product.modelNumber || !product.name || !product.imagePath || !product.shortInfo || !product.aiReviewSummary || !product.specs) errors.push(`${label}: 필수 필드가 누락되었습니다.`);
      if ("weaknesses" in product) errors.push(`${label}: weaknesses는 제거된 상품 필드입니다.`);
      if (!Array.isArray(product.strengths)) errors.push(`${label}: strengths는 배열이어야 합니다.`);
      if (!categoryIds.includes(product.categoryId)) errors.push(`${label}: 알 수 없는 categoryId (${String(product.categoryId)})입니다.`);
      if (categoryIds.includes(product.categoryId)) validateCategorySpecs(product, label, errors);
      if (!Number.isFinite(product.currentPrice) || product.currentPrice < 0) errors.push(`${label}: currentPrice는 0 이상의 숫자여야 합니다.`);
      if (!Array.isArray(product.priceHistory)) errors.push(`${label}: priceHistory는 배열이어야 합니다.`);
      for (const [index, point] of (product.priceHistory ?? []).entries()) {
        if (!isDate(point.date)) errors.push(`${label}: priceHistory[${index}].date 값이 올바르지 않습니다 (${String(point.date)}).`);
        if (!Number.isFinite(point.lowestPrice) || point.lowestPrice <= 0) errors.push(`${label}: priceHistory[${index}].lowestPrice는 0보다 커야 합니다.`);
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
