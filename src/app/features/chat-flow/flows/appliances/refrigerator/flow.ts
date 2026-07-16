import type { FlowAnswers, FlowDefinition, FlowStep } from "../../../core/types";
import {
  displayLabel,
  REFRIGERATOR_DOOR_LABELS,
  REFRIGERATOR_HOUSEHOLD_LABELS,
  REFRIGERATOR_INSTALLATION_LABELS,
  REFRIGERATOR_PRIORITY_LABELS,
  REFRIGERATOR_STORAGE_LABELS,
} from "../displayLabels";
import { getRecommendedCapacityStage, getSelectedCapacityRange, REFRIGERATOR_CAPACITY_STAGES } from "./criteria";

const n = "refrigerator";
const value = (answers: FlowAnswers, key: string) => answers[`${n}.${key}`];
const label = (labels: Record<string, string>, selected: unknown) => displayLabel(labels, selected);
const capacityOptions = REFRIGERATOR_CAPACITY_STAGES.map(({ value: optionValue, label: optionLabel }) => ({ value: optionValue, label: optionLabel }));

const usagePhrase: Record<string, string> = {
  "small-frequent": "필요할 때마다 조금씩 구매한다면",
  bulk: "한 번에 많이 장을 본다면",
  "frozen-meal-prep": "냉동식품과 밀프렙을 많이 보관한다면",
  general: "일반적으로 사용한다면",
};

const steps: FlowStep[] = [
  { id: "rf-intro", type: "assistant-message", message: "가구원과 식재료 보관 습관부터 살펴보고 생활에 맞는 가성비 냉장고를 찾아볼게요.", next: "rf-household" },
  { id: "rf-household", type: "single-choice", message: "함께 사용하는 가구원은 몇 명인가요?", answerKey: `${n}.householdSize`, options: [
    { value: "1", label: "1명" },
    { value: "2", label: "2명" },
    { value: "3-4", label: "3~4명" },
    { value: "5-plus", label: "5명 이상" },
  ], next: "rf-storage" },
  { id: "rf-storage", type: "single-choice", message: "평소 식재료를 어떻게 보관하는 편인가요?", answerKey: `${n}.storageHabit`, options: [
    { value: "small-frequent", label: "필요할 때마다 조금씩 구매해요" },
    { value: "bulk", label: "한 번에 많이 장을 봐요" },
    { value: "frozen-meal-prep", label: "냉동식품과 밀프렙을 많이 보관해요" },
    { value: "general", label: "일반적인 수준이에요" },
  ], next: "rf-capacity-info" },
  { id: "rf-capacity-info", type: "assistant-message", message: "생활 방식에 맞는 권장 용량을 계산했어요.", buildMessage: (answers) => {
    const household = label(REFRIGERATOR_HOUSEHOLD_LABELS, value(answers, "householdSize"));
    const phrase = usagePhrase[String(value(answers, "storageHabit"))] ?? "일반적으로 사용한다면";
    const capacity = getRecommendedCapacityStage(value(answers, "householdSize"), value(answers, "storageHabit"));
    return `${household}이 ${phrase} ${capacity.label}부터 살펴보는 것을 추천해요.`;
  }, next: "rf-capacity-mode" },
  { id: "rf-capacity-mode", type: "single-choice", message: "추천 용량을 적용할까요?", answerKey: `${n}.capacityMode`, options: [
    { value: "recommended", label: "추천 범위 적용", next: "rf-installation" },
    { value: "custom", label: "직접 수정", next: "rf-capacity-custom" },
  ] },
  { id: "rf-capacity-custom", type: "single-choice", message: "원하는 용량 범위를 선택해주세요.", answerKey: `${n}.customCapacity`, options: capacityOptions, next: "rf-installation" },
  { id: "rf-installation", type: "single-choice", message: "냉장고를 어떤 공간에 설치할 예정인가요?", answerKey: `${n}.installationType`, options: [
    { value: "kitchen-fit", label: "가구장에 맞추는 키친핏 공간" },
    { value: "general", label: "일반 냉장고 설치 공간" },
    { value: "unknown", label: "잘 모르겠어요" },
  ], next: "rf-door" },
  { id: "rf-door", type: "single-choice", message: "선호하는 도어 구조가 있나요?", answerKey: `${n}.doorType`, options: [
    { value: "two-door", label: "가격이 낮은 2도어" },
    { value: "four-door-value", label: "수납 정리가 편한 4도어" },
    { value: "any", label: "상관없음" },
  ], next: "rf-priority" },
  { id: "rf-priority", type: "single-choice", message: "어떤 기준의 가성비를 가장 중요하게 볼까요?", answerKey: `${n}.valuePriority`, options: [
    { value: "low-purchase-price", label: "구매가격이 낮은 제품" },
    { value: "good-current-price", label: "현재 가격이 좋은 제품" },
    { value: "electricity-saving", label: "전기요금을 아끼는 제품" },
    { value: "storage-convenience", label: "수납과 정리가 편한 제품" },
    { value: "balanced", label: "가격·용량·효율 균형 추천" },
  ], next: "rf-budget" },
  { id: "rf-budget", type: "number-input", message: "냉장고 제품 가격은 최대 얼마까지 생각하고 있나요?", answerKey: `${n}.budget`, min: 1, unit: "원", placeholder: "최대 제품 가격", alternateOption: { value: "none", label: "예산 제한 없음", next: "rf-summary" }, next: "rf-summary" },
  { id: "rf-summary", type: "assistant-message", message: "조건을 요약했어요.", buildMessage: (answers) => {
    const budget = value(answers, "budget");
    return [
      "다음 조건으로 냉장고를 찾아볼게요.",
      `· 가구원: ${label(REFRIGERATOR_HOUSEHOLD_LABELS, value(answers, "householdSize"))}`,
      `· 보관 습관: ${label(REFRIGERATOR_STORAGE_LABELS, value(answers, "storageHabit"))}`,
      `· 권장 용량: ${getSelectedCapacityRange(answers).label}`,
      `· 설치 형태: ${label(REFRIGERATOR_INSTALLATION_LABELS, value(answers, "installationType"))}`,
      `· 도어 구조: ${label(REFRIGERATOR_DOOR_LABELS, value(answers, "doorType"))}`,
      `· 가성비 기준: ${label(REFRIGERATOR_PRIORITY_LABELS, value(answers, "valuePriority"))}`,
      `· 제품 예산: ${budget === "none" ? "제한 없음" : `최대 ${Number(budget).toLocaleString("ko-KR")}원`}`,
    ].join("\n");
  }, next: "rf-confirm" },
  { id: "rf-confirm", type: "confirmation", message: "모잇 자동 기준\n- 선택한 용량 범위 적용\n- 직접 선택한 도어와 설치 형태 적용\n- 예산 초과 제품과 판매 중단 제품 제외\n- 현재 가격과 저장된 역대 최저가 위치 반영\n- 에너지등급, 인버터, 냉각 방식, 핵심부품 보증기간은 추천 점수에 반영\n\n이 조건으로 추천을 시작할까요?", answerKey: `${n}.confirmed`, confirmLabel: "추천 시작", cancelLabel: "조건 수정", confirmNext: "rf-result", cancelNext: "$restart" },
  { id: "rf-result", type: "result", message: "필수 조건을 통과한 냉장고를 선택한 가성비 기준에 맞춰 정렬했어요." },
];

export const refrigeratorFlow: FlowDefinition = {
  id: "refrigerator-flow",
  subCategoryId: "refrigerator",
  categoryId: "appliances",
  startStepId: "rf-intro",
  steps,
  enableConditionUndo: true,
};
