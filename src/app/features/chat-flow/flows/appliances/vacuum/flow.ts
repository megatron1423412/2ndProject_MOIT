import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { createAppliancePurchaseBlock } from "../../../shared/appliances/blocks";

const namespace = "vacuum";

const specificSteps: FlowStep[] = [
  { id: "vacuum-intro", type: "assistant-message", message: "청소기는 선호 형태와 집 구조에 따라 질문 순서를 나눠볼게요.", next: "vacuum-type" },
  {
    id: "vacuum-type",
    type: "single-choice",
    message: "어떤 형태의 청소기를 원하나요?",
    answerKey: `${namespace}.type`,
    options: [
      { value: "robot", label: "로봇청소기", next: "vacuum-obstacles" },
      { value: "wireless", label: "무선청소기", next: "vacuum-pet" },
      { value: "wired", label: "유선청소기", next: "vacuum-home-size" },
    ],
  },
  {
    id: "vacuum-obstacles",
    type: "multi-choice",
    message: "로봇청소기가 지나갈 때 고려할 요소를 골라주세요.",
    answerKey: `${namespace}.obstacles`,
    options: [
      { value: "threshold", label: "문턱" },
      { value: "carpet", label: "카펫" },
      { value: "cables", label: "전선·작은 물건" },
      { value: "none", label: "특별히 없음" },
    ],
    minSelections: 1,
    next: "vacuum-home-size",
  },
  {
    id: "vacuum-pet",
    type: "confirmation",
    message: "반려동물 털 청소가 중요한가요?",
    answerKey: `${namespace}.hasPet`,
    confirmLabel: "네, 중요해요",
    cancelLabel: "아니요",
    confirmNext: "vacuum-home-size",
    cancelNext: "vacuum-home-size",
  },
  { id: "vacuum-home-size", type: "number-input", message: "집 크기는 몇 평 정도인가요?", answerKey: `${namespace}.homeSize`, placeholder: "예: 30", min: 1, unit: "평", next: `${namespace}-common-budget` },
  {
    id: "vacuum-final-check",
    type: "confirmation",
    message: "관리 편의성과 소모품 비용까지 포함한 mock 결과를 볼까요?",
    answerKey: `${namespace}.confirmed`,
    confirmNext: "vacuum-result",
    cancelNext: "vacuum-result",
    confirmLabel: "결과 보기",
    cancelLabel: "현재 조건으로 보기",
  },
  { id: "vacuum-result", type: "result", message: "집 구조와 선호 형태를 반영한 mock 결과예요." },
];

export const vacuumFlow: FlowDefinition = {
  id: "vacuum-flow",
  subCategoryId: "vacuum",
  categoryId: "appliances",
  startStepId: "vacuum-intro",
  steps: composeFlow(
    specificSteps.slice(0, 5),
    createAppliancePurchaseBlock({ namespace, next: "vacuum-final-check", includeSpaceLimit: false }),
    specificSteps.slice(5),
  ),
};
