# 똑똑한 소비 상품 카탈로그 가이드

현재 구현은 상품군별 실제 로컬 카탈로그가 있으면 real 데이터만 사용하고, 없을 때만 mock 카탈로그로 대체합니다. 추천 목록에는 `MOIT 내부 DB · REAL` 또는 `MOIT 내부 DB · MOCK` 출처가 표시되지만 상품 상세에는 별도의 데이터 출처 배지를 표시하지 않습니다.

## 사용자와 상품군 인사말

기본 mock 사용자는 `src/app/features/smart-shopping/user/userProfile.ts`의 `currentUser`이며 현재 표시명은 `김철수`입니다. 실제 인증을 붙일 때 이 값을 로그인 사용자 profile로 교체하면 됩니다. 인사말 문구는 `greeting/buildSmartShoppingGreeting.ts`에서 만들고, `ChatScreen`이 가전 세션에서만 한 번 렌더링합니다. 통신비 flow 메시지에는 적용하지 않습니다.

상품군 표시명은 `src/app/data/categories.ts`의 각 `SubCategory.title`이 단일 기준입니다. 에어컨·TV·냉장고·청소기 인사말과 네이버 검색어가 이 값을 재사용하므로 flow마다 이름을 중복 저장하지 않습니다.

## 추천 결과의 두 목록과 상세 단계

구매 조건을 확인한 뒤 상태는 `loading-recommendations` → `choosing-product` → `viewing-product-detail`로 진행합니다. 조건 입력 중에는 `collecting-criteria`, 요약·확인 중에는 `reviewing-criteria`로 구분합니다. 추천 시작 직후 선택값은 `null`이며 첫 상품을 자동 선택하지 않습니다.

- 왼쪽 `AI 최적화 재정렬`: `MockProductRepository` 상품을 각 상품군의 `rankProducts.ts`가 필수 조건으로 제외하고 점수 내림차순으로 정렬합니다.
- 오른쪽 `낮은 가격순 TOP 10`: 상품군별 핵심 단어로 네이버 쇼핑을 검색한 후보이며, 네이버가 제공하지 않는 효율·설치·보증·리뷰 조건을 충족한다고 표시하지 않습니다.

두 목록은 `features/smart-shopping/recommendation/RecommendationSelectionView.tsx`가 관리합니다. 상품을 클릭해야만 상세가 열리고, `목록으로 돌아가기`는 기존 조건과 불러온 목록을 유지한 채 선택만 해제합니다.

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
3. 확인된 `{ date, lowestPrice }` 가격 이력을 실제 조사 날짜 그대로 넣습니다. 이력이 없으면 빈 배열을 사용합니다.
4. 이미지를 `public/assets/products/mock/<category>/`에 추가하고 `/assets/products/mock/<category>/<file>` 경로를 `imagePath`에 적습니다.

현재 SVG는 깨진 이미지 방지용 로컬 placeholder입니다. 실제 사용 권한이 있는 이미지를 같은 파일 경로로 교체하면 flow와 UI는 수정할 필요가 없습니다. 외부 이미지 hotlink는 사용하지 않습니다.

현재가, 역대 최저가, 평균가, 최저가 대비 금액·비율은 `product-catalog/core/priceHistory.ts`가 `currentPrice`와 `priceHistory`에서 계산합니다. 파생 가격을 상품 데이터에 중복 저장하지 않습니다.

상품 상세는 `product-detail/ProductDetailDataSections.tsx`를 공통 사용합니다. `AI 리뷰 요약` 다음 행에서 `장점`과 `역대 최저가 추이`를 나란히 표시하고 좁은 화면에서는 세로로 쌓습니다. 가격 차트는 `product-detail/PriceHistoryChart.tsx` 하나를 네 상품군이 공유하며, 저장된 유효 날짜와 `lowestPrice`를 날짜 오름차순으로 정렬해 모든 점을 그립니다. 이력이 없으면 파생 지표를 만들지 않고 `저장된 가격 이력이 없습니다.`와 `이용 불가`를 표시합니다. 한 점만 있어도 실제 점 하나만 표시하며 가상 날짜나 가격을 추가하지 않습니다.

## 점수 가중치 변경

해당 상품군의 `criteria.ts`에 있는 `weights`를 수정합니다. 실제 항목별 점수 계산과 필수 제외 사유는 같은 폴더의 `rankProducts.ts`에서 확인합니다. 저장된 `aiReviewSummary`는 상세의 `AI 리뷰 요약` 영역에 그대로 표시되며 순위 계산에는 사용하지 않습니다.

## 공통 타입과 향후 API/DB 경계

공통 discriminated union과 상품군별 스펙은 `src/app/features/product-catalog/core/types.ts`에 있습니다. 공통 타입 변경이 필요할 때만 이 파일을 수정합니다.

현재 각 `result.ts`는 자기 `products.ts`를 `MockProductRepository`에 주입하고 `getProducts(categoryId)`를 호출합니다. 향후 백엔드가 준비되면 `src/app/features/product-catalog/core/ProductRepository.ts`의 `getProducts(categoryId)`, `getProductById(id)`를 구현하는 `ApiProductRepository` adapter를 추가하고 주입 위치만 교체합니다. UI, 질문 flow, ranking 입력 형태는 유지할 수 있습니다. API key, 실제 DB client, LLM 호출 코드는 프론트엔드 상품 데이터 파일에 추가하지 않습니다.

## 네이버 쇼핑 API 설정

로컬 서버용 최소 프록시는 `server/naverShoppingProxy.ts`이고 브라우저는 `/api/shopping/search`만 호출합니다. 프로젝트 루트의 `.env.example`을 참고해 커밋되지 않는 `.env` 또는 배포 환경의 서버 비밀 저장소에 다음 값을 설정합니다.

```text
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

`VITE_` 접두사는 브라우저 번들에 값을 노출하므로 사용하지 않습니다. 자격 증명은 서버가 네이버 요청 헤더에만 넣습니다. 현재 프록시는 네이버 공식 쇼핑 검색 API의 `display=10`, `sort=asc`를 사용합니다. 운영 배포에서는 같은 계약의 handler를 실제 백엔드/serverless route에 마운트해야 합니다. [네이버 쇼핑 검색 API 공식 문서](https://developers.naver.com/docs/serviceapi/search/shopping/shopping.md)

응답 정규화는 `features/smart-shopping/naver/NaverShoppingAdapter.ts`에서 HTML 태그 제거, 가격 숫자 변환, productId 중복 제거, 최저가 오름차순 정렬을 수행합니다. 키가 없거나 요청이 실패하거나 결과가 비어도 왼쪽 내부 DB 목록은 유지되며 오른쪽만 미설정·오류·빈 결과 상태와 재시도 버튼을 표시합니다.

## 내부 DB와 네이버 상품 결합

`matchInternalProduct.ts`는 정규화된 명시적 모델번호 정확 일치 → alias/variant 모델번호 정확 일치 → 브랜드 일치와 상품명 안의 모델번호 포함 순으로만 매칭합니다. 상품명 유사도만으로는 매칭하지 않습니다.

- 내부 상품 선택: 내부 카탈로그 스펙, 저장된 AI 리뷰 요약, 현재가와 가격 이력 사용
- 매칭된 네이버 상품: 내부 스펙·저장된 리뷰 요약·가격 이력과 네이버 조회 현재가 결합
- 미매칭 네이버 상품: 네이버 기본 정보만 사용하고 검증 정보·리뷰·가격 이력은 없음으로 표시

실제 가격 이력으로 교체할 때는 `ProductRepository`가 반환하는 `priceHistory`를 실제 API 데이터로 바꾸고 `product-catalog/core/priceHistory.ts` 계산 helper는 유지합니다.

## 상품 상세 후속 액션

상세 카드 최하단에는 다음 순서의 액션 그룹이 있습니다. `다른 제품 추천`은 조건에 맞을 때만 두 번째에 표시됩니다.

1. 예상 세일 달 제안
2. 다른 제품 추천
3. 싸게 구매하는 법 TIP
4. 기타 · 직접 질문 입력
5. 목록으로 돌아가기
6. 다음 단계로

버튼 설정은 `features/smart-shopping/actions/productDetailActions.ts`, 렌더링은 `product-detail/ProductDetailActionBar.tsx`에 있습니다. 액션 결과는 기존 `ChatFlowMessage` 형식으로 추가되고, 상세 카드 아래의 최신 대화 다음에 하나의 액션바만 다시 보입니다.

### 프로모션과 구매 팁

프로모션 더미 일정은 `promotions/promotionEvents.ts`, 현재 날짜에 가까운 메시지 선택과 가격 이력 보조 문구는 `getUpcomingPromotionMessage.ts`에서 관리합니다. 실제 세일이나 할인율을 보장하지 않습니다.

공통·상품군별 구매 팁은 `actions/buildPurchaseTipMessage.ts`에서 관리합니다. 에어컨은 기본 설치비, 배관 길이·연장, 타공, 앵글, 철거비 확인을 안내합니다.

### 대체 상품 기준

대체 상품 버튼의 기본 상승률 임계값은 `product-detail/productDetailSettings.ts`의 `alternativeRecommendationThresholdPct`(15%)입니다. 가격 이력이 있고 현재가가 역대 최저가보다 높으며 이 임계값 이상일 때만 표시됩니다.

대체 상품은 `findAlternativeProducts.ts`가 현재 상품군의 필수 조건을 통과한 내부 추천 목록에서 찾습니다. 현재 상품과 같거나 높은 적합도이면서 현재가가 낮거나 가격 이력 위치가 더 유리한 상품을 최대 3개 반환합니다.

## 자유 질문과 OpenAI 서버 경계

브라우저는 `POST /api/ai/product-question`만 호출합니다. 요청 문맥 생성은 `product-detail/productQuestionContext.ts`, 클라이언트 호출은 `productQuestionClient.ts`, 서버 OpenAI Responses API 호출은 `server/productQuestionRoute.ts`에 있습니다.

`OPENAI_API_KEY`는 `.env` 또는 배포 환경의 서버 비밀 저장소에만 설정합니다. `.env.example`에는 변수명만 있으며 `VITE_OPENAI_API_KEY`는 사용하지 않습니다. 키가 없거나 호출이 실패하면 입력 영역에 명확한 오류와 재시도 UI를 표시하고, 목록 복귀·팁·프로모션 등 다른 액션은 계속 사용할 수 있습니다.

서버는 제공된 선택 상품, 구매 조건, 적합도, 가격 이력, 리뷰 요약, 장점과 검증되지 않은 정보 목록만 모델에 전달합니다. 실제로 확인되지 않은 설치비·할인·스펙을 만들지 않도록 시스템 지침을 설정합니다.

## 구매등급진단 시작

`다음 단계로`는 먼저 후속 행동 선택 상태를 시작합니다. 구매등급진단을 선택하면 `grade/startPurchaseGradeDiagnosis.ts`에 선택 상품·출처·내부 매칭 정보, 구매 조건, 적합도, 충족·미충족 조건, 현재가·역대 최저가·상승률, 추가비용 확인 상태, 가격 데이터 신뢰도를 전달합니다. 목록으로 돌아가기는 추천 목록, 네이버 검색 결과, 구매 조건을 다시 호출하지 않고 현재 `RecommendationSelectionView` 상태를 유지합니다.

## 상세 이후 다음 행동과 구매 타이밍 등급

상세 하단의 `다음 단계로`는 구매등급진단을 바로 시작하지 않습니다. `choosing-next-action` 상태에서 다음 순서로 선택지를 보여줍니다.

1. `⭐구매등급진단⭐` — 가성비 소비 안내 설명이 있는 강조 카드
2. 구매 링크 연결
3. 최저가 알람 설정
4. 제품 목록으로 돌아가기
5. 채팅 종료하기

구매등급진단은 `grade/purchaseGradeConfig.ts`의 `goldMaxPct: 5`, `silverMaxPct: 15` 설정과 `calculatePurchaseGrade.ts`를 사용합니다. 현재가와 내부 DB 가격 이력의 역대 최저가만 비교하며, 5% 이하는 골드, 15% 이하는 실버, 그 초과는 브론즈입니다. 가격이 없거나 0 이하면 등급을 만들지 않고 진단 불가 상태로 안내합니다. 이는 제품 품질이 아닌 mock 가격 기록 기준의 구매 타이밍 가성비 등급입니다.

## 구매 링크와 가격 알림

`next-actions/resolvePurchaseLink.ts`는 네이버에서 선택한 상품의 `productUrl`을 먼저 사용합니다. 내부 DB 상품은 현재 목록에서 모델번호 매칭된 네이버 offer 중 유효한 링크만 사용합니다. 링크가 없을 때 임의 검색 URL을 만들지 않습니다.

가격 알림은 `price-alerts/PriceAlertRepository.ts` 인터페이스와 `LocalStoragePriceAlertRepository.ts` adapter에 저장됩니다. 저장 시와 가격 재조회 시 `evaluateAlerts`가 목표가 이하를 평가하고, 생성된 알림은 오른쪽 상단 벨 배지·목록에 표시됩니다. 알림 항목은 구매 링크가 있으면 새 탭에서 열 수 있습니다.

현재는 브라우저 localStorage 프로토타입으로, 앱을 닫은 뒤에도 상시 가격을 감시하지 않습니다. 실제 상시 알림에는 서버 저장소와 주기적인 가격 조회 scheduler/worker가 필요하며, 이 Repository 인터페이스를 서버 adapter로 교체해야 합니다.

`채팅 종료하기`는 App의 기존 메인 복귀 callback을 재사용합니다. 채팅 컴포넌트가 unmount되어 상품 상세·추천 목록·임시 대화가 정리되고, 새 메인 화면은 기본 `모잇과 시작하기` 탭으로 표시됩니다. 저장된 가격 알림은 localStorage에 남습니다.
