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
  /** 문구 자체도 실제 리뷰 분석 결과가 아닌 더미임을 드러내야 합니다. */
  aiReviewSummary: string;
  currentPrice: number;
  priceHistory: PriceHistoryPoint[];
  strengths: string[];
  weaknesses: string[];
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
  basicInstallationIncluded: boolean | null;
  officialInstallation: boolean | null;
  autoDry: boolean;
  energyGrade: 1 | 2 | 3 | 4 | 5;
  /** true=환급 대상 확인, false=비대상 확인, null=아직 확인하지 못함 */
  rebateEligible: boolean | null;
}

export interface TvSpecs {
  os: "android-tv" | "google-tv" | "other";
  resolution: "4k-uhd" | "full-hd";
  screenSizeInches: 43 | 55 | 65 | 75;
  panel: "ips" | "va";
  warrantyYears: number;
  hdr: boolean;
  energyGrade: 1 | 2 | 3 | 4 | 5;
  /** true=환급 대상 확인, false=비대상 확인, null=아직 확인하지 못함 */
  rebateEligible: boolean | null;
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
  matchedCoreCriteria: string[];
  unmatchedOrUnknownCriteria: string[];
  recommendationReasons: string[];
  preferenceMatchCount: number;
  dataCompleteness: number;
}

export interface ExcludedProduct {
  productId: string;
  productName: string;
  reasons: string[];
}
