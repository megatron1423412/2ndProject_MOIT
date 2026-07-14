import type { TvProduct } from "../../core/types";

/**
 * mockProducts.ts의 TV 객체 하나를 복사해 이 배열에 붙여넣고 실제 값으로 바꾸세요.
 * ...common과 history(...)는 mock 전용입니다. 실제 상품에는 dataStatus, source, updatedAt을 직접 입력합니다.
 * 가격 이력이 없으면 priceHistory: []; 있으면 실제 조사 날짜·가격을 직접 입력하세요. 모르는 currentPrice를 0으로 넣지 마세요.
 * 확인하지 않은 정보는 만들지 말고, id/modelNumber는 전체 카탈로그에서 중복되면 안 됩니다.
 * 이미지 경로: /assets/products/real/tv/<filename>.webp
 */
export const REAL_TV_PRODUCTS: TvProduct[] = [
  // {
  //   id: "tv-real-model-01", categoryId: "tv", brand: "브랜드", modelNumber: "MODEL-01", name: "실제 TV 이름",
  //   imagePath: "/assets/products/real/tv/MODEL-01.webp", shortInfo: "확인한 짧은 설명", aiReviewSummary: "확인한 리뷰 요약",
  //   currentPrice: 1_000_000, priceHistory: [], strengths: [], weaknesses: [], dataStatus: "unverified", source: "real", updatedAt: "2026-07-14",
  //   specs: { os: "google-tv", resolution: "4k-uhd", screenSizeInches: 55, panel: "va", warrantyYears: 2, hdr: true, energyGrade: 1, rebateEligible: null },
  // },
];
