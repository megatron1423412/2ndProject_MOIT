# MOIT 챗봇 Flow 작성 가이드

## 구조

```text
src/app/features/chat-flow/
  core/                   # 안정된 FlowStep 타입, 조합, 조건, 검증, 외부 action 경계
  engine/                 # 현재 step·답변·메시지·결과를 실행하는 runtime과 React hook
  registry/loadFlows.ts   # flows/**/index.ts 자동 발견(import.meta.glob)
  shared/telecom/         # 통신비 공통 질문과 결과 helper
  flows/
    appliances/<소분류>/  # flow.ts, criteria.ts, products.ts, rankProducts.ts, result.ts, index.ts
    telecom/<소분류>/     # flow.ts, result.ts, mockData.ts, index.ts
```

담당자는 보통 자기 소분류 폴더만 수정합니다.

| 담당 챗봇 | 수정할 폴더 |
|---|---|
| 에어컨 | `flows/appliances/air-conditioner/` |
| TV | `flows/appliances/tv/` |
| 냉장고 | `flows/appliances/refrigerator/` |
| 청소기 | `flows/appliances/vacuum/` |
| 폰 | `flows/telecom/phone/` |
| 인터넷 | `flows/telecom/internet/` |
| TV·IPTV | `flows/telecom/iptv/` |
| 결합 상품 | `flows/telecom/bundle/` |

## 질문 수정

에어컨 질문은 `flows/appliances/air-conditioner/flow.ts`에서 수정합니다. 문구는 `message`, 선택지는 `options`에 있습니다.

```ts
{
  id: "air-conditioner-installation-type",
  type: "single-choice",
  message: "어떤 설치 형태를 생각하고 있나요?",
  answerKey: "airConditioner.installationType",
  options: [
    { value: "wall", label: "벽걸이형", next: "air-conditioner-wall-space" },
    { value: "standing", label: "스탠드형", next: "air-conditioner-cooling-area" },
  ],
}
```

- 문구 변경: `message` 또는 선택지의 `label`을 수정합니다.
- 선택지 추가/삭제: `options` 배열의 항목을 추가/삭제합니다.
- 질문 순서 변경: 앞 step의 `next`를 다음에 보여줄 step `id`로 바꿉니다.
- 선택지 분기: 각 option에 서로 다른 `next`를 적습니다.
- 답변 저장: 엔진이 `answerKey`를 키로 사용합니다. React 코드는 수정하지 않습니다.

명시적인 조건 분기는 `branch`를 사용합니다.

```ts
{
  id: "usage-branch",
  type: "branch",
  conditions: [
    { answerKey: "internet.usage", operator: "includes", value: "work", next: "upload-question" },
  ],
  defaultNext: "confirm",
}
```

지원 step은 `assistant-message`, `single-choice`, `multi-choice`, `text-input`, `number-input`, `confirmation`, `branch`, `result`입니다.

## 중분류 공통 블록

통신은 `shared/telecom/blocks.ts`의 `createTelecomPlanBlock`을 사용합니다. 가전 4종은 구매 조건이 달라 각 소분류 폴더에서 질문을 독립 관리합니다.

```ts
createTelecomPlanBlock({
  namespace: "internet",
  next: "internet-household",
  includeCarrier: true,
  includeBundle: true,
})
```

각 호출은 새 step 객체를 반환합니다. 필요 없는 공통 질문은 option으로 제외하세요. 공통 질문 자체를 바꾸면 같은 중분류의 여러 flow에 영향을 주므로 팀 합의 후 `shared/`를 수정합니다.

## 결과와 mock 데이터

- `flow.ts`: 질문, 선택지, 순서, 분기
- `result.ts`: 답변 context를 `FlowResult`로 바꾸는 임시 계산
- `criteria.ts`, `products.ts`, `rankProducts.ts`: 가전 전용 구매 기준, 상품, 순위 계산
- `index.ts`: 자동 registry가 읽는 `flowModule` export

실제 비즈니스 계산은 각 소분류의 `result.ts`에 연결합니다. 현재 단순 계산은 정확한 서비스 진단이 아니며 `mockNotice`로 표시됩니다.

## 새 소분류 추가

1. 올바른 중분류 아래에 필요한 `flow.ts`, `result.ts`, 데이터 파일과 `index.ts`를 만듭니다.
2. `index.ts`에서 이름이 정확히 `flowModule`인 값을 export합니다.
3. 중앙 import 목록은 수정하지 않습니다. `registry/loadFlows.ts`가 `flows/**/index.ts`를 자동 발견합니다.
4. `npm run build`를 실행합니다. 중복 flow id나 잘못된 step 연결은 validator 오류로 표시됩니다.

## 이름 규칙

- flow id: `<subcategory>-flow` (예: `air-conditioner-flow`)
- step id: `<subcategory>-<의미>` (예: `phone-data-usage`)
- answerKey: `<namespace>.<의미>` (예: `phone.monthlyFee`)
- shared block에는 반드시 소분류별 `namespace`를 전달합니다.

step id와 answerKey는 한 flow 안에서 중복되면 안 됩니다. 모든 경로는 최종적으로 `result` step에 도달해야 합니다.

## Core와 외부 API 경계

`core/`와 `engine/`은 모든 챗봇이 공유하는 안정된 인터페이스이므로 소분류 작업 중에는 수정하지 마세요. 타입 확장이 정말 필요한 경우에만 함께 검토합니다.

향후 상품·요금제 API, 백엔드 계산, LLM 또는 LangChain tool 호출은 `core/actions.ts`의 `FlowActionExecutor` 경계 뒤에 adapter로 연결합니다. API key나 LangChain 실행 코드를 React 프론트엔드에 넣지 않습니다. 실제 응답 형식이 확정되기 전에는 `FlowActionResult.data`를 성급하게 고정하지 않습니다.
