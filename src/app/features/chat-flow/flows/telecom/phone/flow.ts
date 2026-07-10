import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { createTelecomPlanBlock } from "../../../shared/telecom/blocks";

const namespace = "phone";

const opening: FlowStep[] = [
  { id: "phone-intro", type: "assistant-message", message: "휴대폰 요금제 진단을 시작할게요. 현재 요금 조건부터 확인해볼게요.", next: `${namespace}-common-carrier` },
];

const specific: FlowStep[] = [
  { id: "phone-data-usage", type: "number-input", message: "월평균 데이터 사용량은 몇 GB인가요?", answerKey: `${namespace}.dataUsage`, placeholder: "예: 20", min: 0, unit: "GB", next: "phone-data-branch" },
  {
    id: "phone-data-branch",
    type: "branch",
    conditions: [{ answerKey: `${namespace}.dataUsage`, operator: "gte", value: 100, next: "phone-high-data-note" }],
    defaultNext: "phone-call-usage",
  },
  { id: "phone-high-data-note", type: "assistant-message", message: "데이터 사용량이 많아서 무제한 구간과 속도제어 조건을 추가로 고려할게요.", next: "phone-call-usage" },
  {
    id: "phone-call-usage",
    type: "single-choice",
    message: "음성 통화는 얼마나 사용하나요?",
    answerKey: `${namespace}.callUsage`,
    options: [
      { value: "low", label: "거의 사용하지 않아요" },
      { value: "normal", label: "보통이에요" },
      { value: "high", label: "업무 등으로 많이 사용해요" },
    ],
    next: "phone-result",
  },
  { id: "phone-result", type: "result", message: "현재 사용량을 기준으로 mock 요금제 진단을 만들었어요." },
];

export const phoneFlow: FlowDefinition = {
  id: "phone-flow",
  subCategoryId: "phone",
  categoryId: "telecom",
  startStepId: "phone-intro",
  steps: composeFlow(opening, createTelecomPlanBlock({ namespace, next: "phone-data-usage" }), specific),
};
