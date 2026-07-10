import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { createAppliancePurchaseBlock } from "../../../shared/appliances/blocks";

const namespace = "refrigerator";

const beforeCommon: FlowStep[] = [
  { id: "refrigerator-intro", type: "assistant-message", message: "냉장고 진단은 가족 수와 실제 설치 치수부터 확인할게요.", next: "refrigerator-household-size" },
  { id: "refrigerator-household-size", type: "number-input", message: "함께 사용하는 가족은 몇 명인가요?", answerKey: `${namespace}.householdSize`, placeholder: "예: 4", min: 1, unit: "명", next: "refrigerator-capacity" },
  {
    id: "refrigerator-capacity",
    type: "single-choice",
    message: "원하는 용량은 어느 정도인가요?",
    answerKey: `${namespace}.capacity`,
    options: [
      { value: "under-600", label: "600L 미만" },
      { value: "600-800", label: "600~800L" },
      { value: "over-800", label: "800L 이상" },
      { value: "unknown", label: "추천받고 싶어요" },
    ],
    next: "refrigerator-install-width",
  },
  { id: "refrigerator-install-width", type: "number-input", message: "설치 가능한 최대 폭은 몇 cm인가요?", answerKey: `${namespace}.installWidth`, placeholder: "예: 95", min: 40, unit: "cm", next: "refrigerator-door-type" },
  {
    id: "refrigerator-door-type",
    type: "single-choice",
    message: "선호하는 도어 형태가 있나요?",
    answerKey: `${namespace}.doorType`,
    options: [
      { value: "four", label: "4도어" },
      { value: "side", label: "양문형" },
      { value: "top-bottom", label: "상하형" },
      { value: "none", label: "상관없어요" },
    ],
    next: `${namespace}-common-budget`,
  },
];

const afterCommon: FlowStep[] = [
  {
    id: "refrigerator-energy",
    type: "single-choice",
    message: "에너지 효율과 부가기능 중 어느 쪽이 더 중요한가요?",
    answerKey: `${namespace}.energyPriority`,
    options: [
      { value: "efficiency", label: "에너지 효율" },
      { value: "features", label: "제빙·정수 등 기능" },
      { value: "balanced", label: "둘 다 균형" },
    ],
    next: "refrigerator-result",
  },
  { id: "refrigerator-result", type: "result", message: "가족 수와 설치 조건을 기준으로 mock 결과를 만들었어요." },
];

export const refrigeratorFlow: FlowDefinition = {
  id: "refrigerator-flow",
  subCategoryId: "refrigerator",
  categoryId: "appliances",
  startStepId: "refrigerator-intro",
  steps: composeFlow(
    beforeCommon,
    createAppliancePurchaseBlock({ namespace, next: "refrigerator-energy", includeSpaceLimit: false }),
    afterCommon,
  ),
};
