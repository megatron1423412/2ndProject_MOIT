import type { FlowAnswers, FlowDefinition, FlowStep } from "../../../core/types";
import { AIR_CONDITIONER_PRIORITY_LABELS, AIR_CONDITIONER_TYPE_LABELS, AIR_CONDITIONER_USAGE_LABELS, displayLabel } from "../displayLabels";
import { calculateRecommendedCoolingArea, getRequiredCoolingArea, getSelectedAirConditionerType } from "./criteria";

const n = "airConditioner";
const value = (answers: FlowAnswers, key: string) => answers[`${n}.${key}`];

const typeBySpace: Record<string, string> = {
  room: "wall",
  living: "standing",
  multiple: "two-in-one",
  window: "window",
};

const inferredType = (answers: FlowAnswers) => typeBySpace[String(value(answers, "installationSpace"))] ?? "wall";
const typeLabel = (type: unknown) => displayLabel(AIR_CONDITIONER_TYPE_LABELS, type, "에어컨 타입");

const typeOptions = [
  { value: "wall", label: "벽걸이형" },
  { value: "standing", label: "스탠드형" },
  { value: "two-in-one", label: "2in1" },
  { value: "window", label: "창문형" },
];

const steps: FlowStep[] = [
  { id: "ac-intro", type: "assistant-message", message: "설치 공간과 사용 방식에 맞춰 꼭 필요한 조건부터 차례로 확인할게요.", next: "ac-space" },
  { id: "ac-space", type: "single-choice", message: "에어컨을 주로 어디에 설치할 예정인가요?", answerKey: `${n}.installationSpace`, options: [
    { value: "room", label: "방 또는 원룸", next: "ac-type-recommendation" },
    { value: "living", label: "거실", next: "ac-type-recommendation" },
    { value: "multiple", label: "거실과 방", next: "ac-type-recommendation" },
    { value: "window", label: "창문형이 필요한 공간", next: "ac-type-recommendation" },
    { value: "direct", label: "원하는 타입 직접 선택", next: "ac-type" },
  ] },
  { id: "ac-type-recommendation", type: "assistant-message", message: "설치 공간에 맞는 타입을 추천할게요.", buildMessage: (answers) => `${typeLabel(inferredType(answers))}이 선택한 공간에 가장 실용적이에요. 이 타입을 기준으로 보거나 다른 타입을 직접 고를 수 있어요.`, next: "ac-inferred-type" },
  { id: "ac-inferred-type", type: "single-choice", message: "추천 타입으로 진행할까요?", answerKey: `${n}.type`, options: [
    { value: "wall", label: "추천 타입으로 진행", next: "ac-area-branch" },
    { value: "other", label: "다른 타입 선택", next: "ac-type" },
  ], optionsResolver: (answers) => {
    const type = inferredType(answers);
    return [
      { value: type, label: `${typeLabel(type)}으로 진행`, next: "ac-area-branch" },
      { value: "other", label: "다른 타입 선택", next: "ac-type" },
    ];
  } },
  { id: "ac-type", type: "single-choice", message: "원하는 에어컨 타입을 선택해주세요.", answerKey: `${n}.directType`, options: typeOptions, next: "ac-area-branch" },
  { id: "ac-area-branch", type: "branch", conditions: [
    { answerKey: `${n}.type`, operator: "equals", value: "two-in-one", next: "ac-home" },
    { answerKey: `${n}.directType`, operator: "equals", value: "two-in-one", next: "ac-home" },
  ], defaultNext: "ac-area-direct" },
  { id: "ac-area-direct", type: "number-input", message: "실제로 냉방할 공간은 몇 평인가요?", answerKey: `${n}.actualCoolingArea`, min: 1, max: 100, unit: "평", placeholder: "냉방 공간 크기", alternateOption: { value: "unknown", label: "잘 모르겠어요", next: "ac-home" }, next: "ac-usage" },
  { id: "ac-home", type: "number-input", message: "집 전체는 몇 평인가요?", answerKey: `${n}.homePyeong`, min: 1, max: 200, unit: "평", placeholder: "집 전체 크기", next: "ac-area-info" },
  { id: "ac-area-info", type: "assistant-message", message: "권장 냉방 면적을 계산했어요.", buildMessage: (answers) => {
    const home = Number(value(answers, "homePyeong"));
    const area = calculateRecommendedCoolingArea(home);
    return getSelectedAirConditionerType(answers) === "two-in-one"
      ? `${home}평 집이라면 주 실내기 냉방면적 ${area}평 이상을 기준으로 찾아볼게요. 2in1 제품은 주 실내기의 냉방면적을 기준으로 비교해요.`
      : `${home}평 집이라면 냉방면적 ${area}평 이상을 기준으로 찾아볼게요.`;
  }, next: "ac-area-mode" },
  { id: "ac-area-mode", type: "single-choice", message: "계산한 냉방 면적을 적용할까요?", answerKey: `${n}.coolingAreaMode`, options: [
    { value: "recommended", label: "계산값 적용", next: "ac-usage" },
    { value: "custom", label: "직접 수정", next: "ac-area-custom" },
  ] },
  { id: "ac-area-custom", type: "number-input", message: "필요한 최소 냉방 면적을 입력해주세요.", answerKey: `${n}.customCoolingArea`, min: 1, max: 100, unit: "평", placeholder: "최소 냉방 면적", next: "ac-usage" },
  { id: "ac-usage", type: "single-choice", message: "여름철 하루에 몇 시간 정도 사용할 예정인가요?", answerKey: `${n}.dailyUsage`, options: [
    { value: "under4", label: "4시간 미만" },
    { value: "4to8", label: "4~8시간" },
    { value: "over8", label: "8시간 이상" },
    { value: "unknown", label: "잘 모르겠어요" },
  ], next: "ac-priority" },
  { id: "ac-priority", type: "single-choice", message: "어떤 기준의 가성비를 가장 중요하게 볼까요?", answerKey: `${n}.valuePriority`, options: [
    { value: "low-purchase-price", label: "구매가격이 낮은 제품" },
    { value: "electricity-saving", label: "전기요금까지 아끼는 제품" },
    { value: "maintenance", label: "청소와 관리가 편한 제품" },
    { value: "good-current-price", label: "현재 가격이 좋은 제품" },
    { value: "balanced", label: "가격·효율 균형 추천" },
  ], next: "ac-budget" },
  { id: "ac-budget", type: "number-input", message: "에어컨 제품 가격은 최대 얼마까지 생각하고 있나요?", answerKey: `${n}.budget`, min: 1, unit: "원", placeholder: "최대 제품 가격", alternateOption: { value: "none", label: "예산 제한 없음", next: "ac-summary" }, next: "ac-summary" },
  { id: "ac-summary", type: "assistant-message", message: "조건을 요약했어요.", buildMessage: (answers) => {
    const budget = value(answers, "budget");
    const selectedType = getSelectedAirConditionerType(answers);
    const areaLabel = selectedType === "two-in-one" ? "주 실내기 최소 냉방 면적" : "최소 냉방 면적";
    return [
      "선택 조건",
      `- 타입: ${typeLabel(selectedType)}`,
      `- ${areaLabel}: ${getRequiredCoolingArea(answers)}평`,
      `- 예상 사용: ${displayLabel(AIR_CONDITIONER_USAGE_LABELS, value(answers, "dailyUsage"))}`,
      `- 가성비 기준: ${displayLabel(AIR_CONDITIONER_PRIORITY_LABELS, value(answers, "valuePriority"))}`,
      `- 제품 가격: ${budget === "none" ? "예산 제한 없음" : `${Number(budget).toLocaleString("ko-KR")}원 이하`}`,
    ].join("\n");
  }, next: "ac-confirm" },
  { id: "ac-confirm", type: "confirmation", message: "MOIT 자동 적용 규칙\n- 냉방 면적이 부족한 제품 제외\n- 인버터 제품만 사용\n- 판매 중단 제품 제외\n- 현재 가격, 과거 가격 위치, 에너지 등급, 자동 건조, 사용 시간, 선택한 가성비 기준으로 순위 결정\n\n이 조건으로 추천을 시작할까요?", answerKey: `${n}.confirmed`, confirmLabel: "추천 시작", cancelLabel: "조건 수정", confirmNext: "ac-result", cancelNext: "$restart" },
  { id: "ac-result", type: "result", message: "필수 조건을 통과한 상품을 선택한 가성비 기준에 맞춰 정렬했어요." },
];

export const airConditionerFlow: FlowDefinition = {
  id: "air-conditioner-flow",
  subCategoryId: "air-conditioner",
  categoryId: "appliances",
  startStepId: "ac-intro",
  steps,
  enableConditionUndo: true,
};
