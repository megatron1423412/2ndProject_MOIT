# 상품 카탈로그 데이터 입력 가이드

기존 화면 검증용 더미 상품은 [mockProducts.ts](../src/app/features/product-catalog/data/mockProducts.ts)에 있습니다. 직접 조사한 실제 상품은 [realProducts.ts](../src/app/features/product-catalog/data/realProducts.ts)에만 추가합니다. 앱은 개별 파일이 아니라 [productCatalog.ts](../src/app/features/product-catalog/data/productCatalog.ts)의 `productRepository`를 통해 상품을 읽습니다.

## 실제 상품 추가

`mockProducts.ts`의 같은 상품군 항목을 복사해 `realProducts.ts` 배열에 넣고, 확인한 값만 바꿉니다. `id`와 `modelNumber`는 mock을 포함한 전체 카탈로그에서 고유해야 합니다.

```ts
{
  id: "ac-example-01",
  categoryId: "air-conditioner",
  brand: "브랜드명",
  modelNumber: "MODEL-01",
  name: "상품명",
  imagePath: "/assets/products/real/air-conditioner/MODEL-01.webp",
  shortInfo: "확인한 짧은 설명",
  aiReviewSummary: "검증한 리뷰 요약 또는 아직 확인하지 못했음을 알리는 문구",
  currentPrice: 1_000_000,
  priceHistory: [],
  strengths: [], weaknesses: [],
  dataStatus: "unverified", source: "real", updatedAt: "2026-07-14",
  specs: { /* 해당 상품군의 필수 스펙 */ },
}
```

확인하지 못한 정보는 임의로 채우지 않습니다. 타입이 허용하면 `null`, `undefined`, 또는 `"unknown"`을 사용하고, 추천·필터가 사용하는 필수 스펙과 현재 가격은 확인 뒤 입력합니다. 가격 이력이 없으면 `priceHistory: []`로 두며, 이력은 `{ date: "YYYY-MM-DD", lowestPrice: 123456 }` 형식의 양수 가격만 넣습니다.

이미지는 TypeScript에 넣지 않습니다. `public/assets/products/real/air-conditioner/`, `tv/`, `refrigerator/`, `vacuum/` 아래에 두고 `/assets/products/real/<category>/<model-number>.webp` 경로를 저장합니다. 이미지 로드 실패 시 기존 `ImageWithFallback` placeholder가 표시됩니다.

`dataStatus`는 `verified`(공식 출처 확인 완료, `verifiedAt` 필수), `unverified`(입력 후 미검증), `stale`(재확인 필요), `discontinued`(단종 확인), `mock`(기존 더미)입니다. 실제 상품은 항상 `source: "real"`이고 `mock` 상태를 사용할 수 없습니다.

## 점진적 교체와 검증

한 카테고리에 실제 상품이 하나라도 있으면 그 카테고리 전체는 real 데이터만 노출합니다. 실제 상품이 하나도 없는 카테고리만 mock 데이터를 사용하므로 같은 추천 목록에 둘을 섞지 않습니다. 현재 선택 상태는 `catalogSourceByCategory`에서 확인할 수 있습니다.

개발 중에는 [validateProducts.ts](../src/app/features/product-catalog/data/validateProducts.ts)가 id·모델번호 중복, category, 가격/가격 이력, 필수 필드, verified 날짜, source·status 조합을 검증합니다. 문제는 개발 실행 시 상품 id를 포함한 오류로 표시됩니다.

나중에 서버 DB로 옮길 때는 UI와 flow를 바꾸지 말고 [StaticProductRepository.ts](../src/app/features/product-catalog/repositories/StaticProductRepository.ts)를 API/DB adapter로 교체합니다. 모든 카테고리가 real로 전환된 뒤에는 `productCatalog.ts`의 mock fallback만 제거하면 됩니다.
