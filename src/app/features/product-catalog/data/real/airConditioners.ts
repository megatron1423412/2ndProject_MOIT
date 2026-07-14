import type { AirConditionerProduct } from "../../core/types";

/**
 * mockProducts.ts의 에어컨 객체 하나를 복사해 이 배열에 붙여넣고 실제 값으로 바꾸세요.
 * ...common과 history(...)는 mock 전용입니다. 실제 상품에는 dataStatus, source, updatedAt을 직접 입력합니다.
 * 가격 이력이 없으면 priceHistory: []; 있으면 실제 조사 날짜·가격을 직접 입력하세요. 모르는 currentPrice를 0으로 넣지 마세요.
 * 확인하지 않은 정보는 만들지 말고, id/modelNumber는 전체 카탈로그에서 중복되면 안 됩니다.
 * 이미지 경로: /assets/products/real/air-conditioner/<filename>.webp
 */
export const REAL_AIR_CONDITIONER_PRODUCTS: AirConditionerProduct[] = [
  // {
  //   id: "ac-real-model-01", categoryId: "air-conditioner", brand: "브랜드", modelNumber: "MODEL-01", name: "실제 에어컨 이름",
  //   imagePath: "/assets/products/real/air-conditioner/MODEL-01.webp", shortInfo: "확인한 짧은 설명", aiReviewSummary: "확인한 리뷰 요약",
  //   currentPrice: 1_000_000, priceHistory: [], strengths: [], weaknesses: [], dataStatus: "unverified", source: "real", updatedAt: "2026-07-14",
  //   specs: { type: "wall", ratedCoolingAreaPyeong: 10, inverter: true, basicInstallationIncluded: false, officialInstallation: true, autoDry: true, energyGrade: 1, rebateEligible: null },
  // },
  {
    id: "lg-e-whisen-SQ06GJ1WES", categoryId: "air-conditioner", brand: "휘센", modelNumber: "SQ06GJ1WES", name: "LG전자 휘센 SQ06GJ1WES",
    imagePath: "/assets/products/real/air-conditioner/lg-e-whisen-SQ06GJ1WES.webp", shortInfo: "출시년도: 2026년,냉방면적: 18.7㎡(5.6평),냉방능력: 2300W", aiReviewSummary: "1등급이에요,시원해요,만족스러워요,전기요금이 저렴해요,소음이 적어요,효율이 좋아요,기사님이 친절해요,성능이 좋아요,기능이 다양해요청소가 잘 돼요,쾌적해졌어요,저소음이에요,냉방이 잘 돼요,설치하기 편해요,바람이 시원해요,작동이 잘 돼요,건조가 잘 돼요,습기가 차지 않아요,연결이 잘 돼요,기능이 좋아요",
    currentPrice: 1_085_000, priceHistory: [{date: "2026-05-01",lowestPrice: 1_080_000,},{date: "2026-05-07",lowestPrice: 1_080_000,},{date: "2026-05-13",lowestPrice: 1_080_000,},{date: "2026-05-19",lowestPrice: 1_080_000,},{date: "2026-05-25",lowestPrice: 918_340,},{date: "2026-05-25",lowestPrice: 918_340,},{date: "2026-05-31",lowestPrice: 922_940,},{date: "2026-06-07",lowestPrice: 920_330,},{date: "2026-06-13",lowestPrice: 991_490,},{date: "2026-06-19",lowestPrice: 947_400,},{date: "2026-06-25",lowestPrice: 970_000,},{date: "2026-07-01",lowestPrice: 972_010,},{date: "2026-07-07",lowestPrice: 936_240,},{date: "2026-07-13",lowestPrice: 970_600,}], strengths: [], weaknesses: [], dataStatus: "unverified", source: "real", updatedAt: "2026-07-14",
    specs: { type: "wall", ratedCoolingAreaPyeong: 5.6, inverter: true, basicInstallationIncluded: true, officialInstallation: null, autoDry: true, energyGrade: 1, rebateEligible: null },
  }
];
