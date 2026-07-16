export type ProductCategoryId = "air-conditioner" | "tv" | "refrigerator" | "vacuum";
export type ProductDataStatus = "verified" | "unverified" | "stale" | "discontinued" | "mock";
export type ProductSource = "real" | "mock";

export interface PriceHistoryPoint {
  date: string;
  lowestPrice: number;
}

interface ProductBase<C extends ProductCategoryId, S> {
  id: string;
  categoryId: C;
  brand: string;
  modelNumber: string;
  modelAliases?: string[];
  naverSearchKeyword?: string;
  name: string;
  imagePath: string;
  shortInfo: string;
  /** 저장된 리뷰 요약을 상세 화면에 그대로 표시합니다. */
  aiReviewSummary: string;
  currentPrice: number;
  priceHistory: PriceHistoryPoint[];
  strengths: string[];
  /** mock은 기존 화면 검증용 데이터, 나머지는 직접 입력한 실제 상품의 검증 상태입니다. */
  dataStatus: ProductDataStatus;
  source: ProductSource;
  updatedAt: string;
  /** dataStatus가 verified일 때 필수인 공식 출처 확인일입니다. */
  verifiedAt?: string;
  specs: S;
}

export interface AirConditionerSpecs {
  type: "standing" | "wall" | "two-in-one" | "window";
  ratedCoolingAreaPyeong: number;
  inverter: boolean;
  autoDry: boolean;
  energyGrade: 1 | 2 | 3 | 4 | 5;
}

export interface TvSpecs {
  os: "android-tv" | "google-tv" | "other";
  resolution: "4k-uhd" | "full-hd";
  screenSizeInches: 43 | 55 | 65 | 75;
  panel: "IPS" | "VA";
  warrantyYears: number;
  hdr: boolean;
  energyGrade: 1 | 2 | 3 | 4 | 5;
}

export interface RefrigeratorSpecs {
  doorType: "two-door" | "four-door-value";
  capacityLiters: number;
  metalDoor: boolean;
  coolingMethod: "indirect" | "fan" | "direct";
  inverter: boolean;
  corePartWarrantyYears: number;
  freestanding: boolean;
  energyGrade: 1 | 2 | 3 | 4 | 5;
}

export interface VacuumSpecs {
  powerType: "wireless-value" | "wired-major";
  suctionAw?: number;
  suctionPa?: number;
  replaceableBattery?: boolean;
  hepaGrade: "H13" | "H14" | "below-H13";
  softRoller: boolean;
  standingDock?: boolean;
  bodyWeightKg: number;
  warrantyYears: number;
}

export type AirConditionerProduct = ProductBase<"air-conditioner", AirConditionerSpecs>;
export type TvProduct = ProductBase<"tv", TvSpecs>;
export type RefrigeratorProduct = ProductBase<"refrigerator", RefrigeratorSpecs>;
export type VacuumProduct = ProductBase<"vacuum", VacuumSpecs>;

export type CatalogProduct = AirConditionerProduct | TvProduct | RefrigeratorProduct | VacuumProduct;
export type ProductByCategory<C extends ProductCategoryId> = Extract<CatalogProduct, { categoryId: C }>;

export interface ProductRecommendation {
  product: CatalogProduct;
  score: number;
  /** 필수 조건의 사실 여부가 아직 확인되지 않아 일반 추천과 구분해야 하는 후보입니다. */
  verificationNeeded?: boolean;
  verificationRequiredFields?: string[];
  matchedCoreCriteria: string[];
  unmatchedOrUnknownCriteria: string[];
  recommendationReasons: string[];
  /** Product-detail copy grouped by the recommendation inputs that were actually applied. */
  recommendationReasonItems?: RecommendationReasonItem[];
  preferenceMatchCount: number;
  dataCompleteness: number;
}

export interface RecommendationReasonItem {
  label: string;
  description: string;
}

export interface ExcludedProduct {
  productId: string;
  productName: string;
  reasons: string[];
}
