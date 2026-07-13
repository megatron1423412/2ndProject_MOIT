# 똑똑한 소비 상품 카탈로그 가이드

현재 구현은 실제 쇼핑 API, 리뷰, 가격, 환급 정책이 아닌 로컬 더미 데이터만 사용합니다. 모든 상품은 `dataStatus: "mock"`이고 UI에도 `MOCK DATA`가 표시됩니다.

## 상품군별 파일 위치

각 담당자는 대부분 자기 폴더만 수정하면 됩니다.

| 상품군 | 폴더 |
|---|---|
| 에어컨 | `src/app/features/chat-flow/flows/appliances/air-conditioner/` |
| TV | `src/app/features/chat-flow/flows/appliances/tv/` |
| 냉장고 | `src/app/features/chat-flow/flows/appliances/refrigerator/` |
| 청소기 | `src/app/features/chat-flow/flows/appliances/vacuum/` |

각 폴더의 역할은 동일합니다.

- `flow.ts`: 질문 문구, 선택지, 순서와 조건 분기
- `criteria.ts`: 기본 필수 기준, 계산 설정값
- `products.ts`: 해당 상품군의 더미 상품만 저장
- `rankProducts.ts`: 필수 제외와 선호 점수 가중치 적용
- `result.ts`: 추천 결과 제목·요약·주의 문구
- `index.ts`: 자동 flow registry에 연결

## 질문과 조건 수정

질문 문구와 선택지는 해당 상품군의 `flow.ts`에서 수정합니다. 답변은 상품군 namespace가 포함된 `answerKey`로 저장되어 서로 섞이지 않습니다. 결과 전 `buildMessage`가 적용 조건을 보여주며, 사용자는 조건 수정 버튼으로 처음부터 다시 입력할 수 있습니다.

필수 조건은 하나라도 불일치하거나 값이 누락되면 후보에서 제외하고 이유를 `excludedProducts`에 남깁니다. 선호 조건은 후보를 제외하지 않고 `criteria.ts`의 가중치와 `rankProducts.ts` 계산으로 점수와 순서만 바꿉니다. 동점은 선호 조건 충족 수, 현재가, 데이터 완성도 순입니다.

에어컨의 집 평수 대비 권장 냉방 면적 계수, TV의 기본 4K·보증 연수, 냉장고의 가구원별 용량 구간, 청소기의 단위별 흡입력 기준은 각각의 `criteria.ts`에서 수정합니다. AW와 Pa는 서로 환산하지 않습니다.

## 더미 상품과 이미지 추가

1. 해당 상품군의 `products.ts` 배열에 같은 category 타입의 상품을 추가합니다.
2. 공통 필드와 상품군별 `specs`, `dataStatus: "mock"`, `updatedAt`을 채웁니다.
3. 최소 6개의 `{ date, lowestPrice }` 월별 가격 이력을 넣습니다.
4. 이미지를 `public/assets/products/mock/<category>/`에 추가하고 `/assets/products/mock/<category>/<file>` 경로를 `imagePath`에 적습니다.

현재 SVG는 깨진 이미지 방지용 로컬 placeholder입니다. 실제 사용 권한이 있는 이미지를 같은 파일 경로로 교체하면 flow와 UI는 수정할 필요가 없습니다. 외부 이미지 hotlink는 사용하지 않습니다.

현재가, 역대 최저가, 평균가, 최저가 대비 금액·비율은 `product-catalog/core/priceHistory.ts`가 `currentPrice`와 `priceHistory`에서 계산합니다. 파생 가격을 상품 데이터에 중복 저장하지 않습니다.

## 점수 가중치 변경

해당 상품군의 `criteria.ts`에 있는 `weights`를 수정합니다. 실제 항목별 점수 계산과 필수 제외 사유는 같은 폴더의 `rankProducts.ts`에서 확인합니다. AI 리뷰 요약은 설명용 더미 문구일 뿐 순위 계산에 사용하지 않습니다.

## 공통 타입과 향후 API/DB 경계

공통 discriminated union과 상품군별 스펙은 `src/app/features/product-catalog/core/types.ts`에 있습니다. 공통 타입 변경이 필요할 때만 이 파일을 수정합니다.

현재 각 `result.ts`는 자기 `products.ts`를 `MockProductRepository`에 주입하고 `getProducts(categoryId)`를 호출합니다. 향후 백엔드가 준비되면 `src/app/features/product-catalog/core/ProductRepository.ts`의 `getProducts(categoryId)`, `getProductById(id)`를 구현하는 `ApiProductRepository` adapter를 추가하고 주입 위치만 교체합니다. UI, 질문 flow, ranking 입력 형태는 유지할 수 있습니다. API key, 실제 DB client, LLM 호출 코드는 프론트엔드 상품 데이터 파일에 추가하지 않습니다.
