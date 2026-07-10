import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { createAppliancePurchaseBlock } from "../../../shared/appliances/blocks";

const namespace = "airConditioner";

const specificSteps: FlowStep[] = [
  {
    id: "air-conditioner-intro",
    type: "assistant-message",
    message: "에어컨 구매 진단을 시작할게요. 먼저 원하는 설치 형태부터 확인해볼게요.",
    next: "air-conditioner-installation-type",
  },
  {
    id: "air-conditioner-installation-type",
    type: "single-choice",
    message: "어떤 설치 형태를 생각하고 있나요?",
    answerKey: `${namespace}.installationType`,
    options: [
      { value: "wall", label: "벽걸이형", next: "air-conditioner-wall-space" },
      { value: "standing", label: "스탠드형", next: "air-conditioner-cooling-area" },
      { value: "system", label: "시스템형", next: "air-conditioner-cooling-area" },
    ],
  },
  {
    id: "air-conditioner-wall-space",
    type: "single-choice",
    message: "벽걸이 설치 벽면과 실외기 공간은 확보되어 있나요?",
    answerKey: `${namespace}.wallSpace`,
    options: [
      { value: "ready", label: "확보되어 있어요" },
      { value: "check", label: "실측이 필요해요" },
    ],
    next: "air-conditioner-cooling-area",
  },
  {
    id: "air-conditioner-cooling-area",
    type: "number-input",
    message: "냉방할 공간은 몇 평 정도인가요?",
    answerKey: `${namespace}.coolingArea`,
    placeholder: "예: 20",
    min: 1,
    unit: "평",
    next: `${namespace}-common-space-limit`,
  },
  {
    id: "air-conditioner-energy-priority",
    type: "single-choice",
    message: "에너지 효율을 얼마나 중요하게 보나요?",
    answerKey: `${namespace}.energyPriority`,
    options: [
      { value: "high", label: "전기료 절감이 최우선" },
      { value: "balanced", label: "구매가와 균형" },
      { value: "low", label: "초기 구매가 우선" },
    ],
    next: "air-conditioner-confirm",
  },
  {
    id: "air-conditioner-confirm",
    type: "confirmation",
    message: "입력한 조건으로 mock 구매 진단을 만들까요?",
    answerKey: `${namespace}.confirmed`,
    confirmLabel: "진단 결과 보기",
    cancelLabel: "현재 조건으로 보기",
    confirmNext: "air-conditioner-result",
    cancelNext: "air-conditioner-result",
  },
  { id: "air-conditioner-result", type: "result", message: "입력 조건을 기준으로 mock 결과를 정리했어요." },
];

export const airConditionerFlow: FlowDefinition = {
  id: "air-conditioner-flow",
  subCategoryId: "air-conditioner",
  categoryId: "appliances",
  startStepId: "air-conditioner-intro",
  steps: composeFlow(
    specificSteps.slice(0, 4),
    createAppliancePurchaseBlock({ namespace, next: "air-conditioner-energy-priority" }),
    specificSteps.slice(4),
  ),
};
