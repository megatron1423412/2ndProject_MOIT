import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { createAppliancePurchaseBlock } from "../../../shared/appliances/blocks";

const namespace = "tv";

const openingSteps: FlowStep[] = [
  { id: "tv-intro", type: "assistant-message", message: "TV 구매 진단을 시작할게요. 시청 환경과 사용 목적을 순서대로 볼게요.", next: "tv-screen-size" },
  {
    id: "tv-screen-size",
    type: "single-choice",
    message: "원하는 화면 크기는 어느 정도인가요?",
    answerKey: `${namespace}.screenSize`,
    options: [
      { value: "55", label: "55인치 이하" },
      { value: "65", label: "65인치" },
      { value: "75", label: "75인치 이상" },
      { value: "unknown", label: "추천받고 싶어요" },
    ],
    next: "tv-viewing-distance",
  },
  { id: "tv-viewing-distance", type: "number-input", message: "주 시청 위치와 TV 사이 거리는 몇 m인가요?", answerKey: `${namespace}.viewingDistance`, placeholder: "예: 2.5", min: 1, unit: "m", next: "tv-usage" },
  {
    id: "tv-usage",
    type: "multi-choice",
    message: "TV로 주로 무엇을 하나요? 여러 개를 선택할 수 있어요.",
    answerKey: `${namespace}.usage`,
    options: [
      { value: "ott", label: "OTT·영화" },
      { value: "broadcast", label: "방송 시청" },
      { value: "gaming", label: "콘솔 게임" },
      { value: "sports", label: "스포츠" },
    ],
    minSelections: 1,
    next: "tv-usage-branch",
  },
  {
    id: "tv-usage-branch",
    type: "branch",
    conditions: [{ answerKey: `${namespace}.usage`, operator: "includes", value: "gaming", next: "tv-gaming-frequency" }],
    defaultNext: `${namespace}-common-budget`,
  },
  {
    id: "tv-gaming-frequency",
    type: "single-choice",
    message: "게임은 얼마나 자주 하나요?",
    answerKey: `${namespace}.gamingFrequency`,
    options: [
      { value: "sometimes", label: "가끔" },
      { value: "often", label: "주 3회 이상" },
    ],
    next: `${namespace}-common-budget`,
  },
];

const closingSteps: FlowStep[] = [
  {
    id: "tv-confirm",
    type: "confirmation",
    message: "입력한 시청 환경으로 mock 추천을 만들까요?",
    answerKey: `${namespace}.confirmed`,
    confirmNext: "tv-result",
    cancelNext: "tv-result",
    confirmLabel: "추천 보기",
    cancelLabel: "현재 조건으로 보기",
  },
  { id: "tv-result", type: "result", message: "화면 크기와 사용 패턴을 반영한 mock 결과예요." },
];

export const tvFlow: FlowDefinition = {
  id: "tv-flow",
  subCategoryId: "tv",
  categoryId: "appliances",
  startStepId: "tv-intro",
  steps: composeFlow(
    openingSteps,
    createAppliancePurchaseBlock({ namespace, next: "tv-confirm", includeSpaceLimit: false }),
    closingSteps,
  ),
};
