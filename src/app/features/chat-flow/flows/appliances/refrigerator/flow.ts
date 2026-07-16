import type { FlowDefinition, FlowStep } from "../../../core/types";
import { displayLabel, REFRIGERATOR_CAPACITY_LABELS, REFRIGERATOR_DOOR_LABELS } from "../displayLabels";
import { getRecommendedCapacityRange } from "./criteria";

const n = "refrigerator";
const v = (a: Record<string, unknown>, key: string) => a[`${n}.${key}`];
const steps: FlowStep[] = [
  { id: "rf-intro", type: "assistant-message", message: "냉장고의 도어·가구원·용량을 먼저 확인한 뒤 냉각·보증 조건을 볼게요.", next: "rf-door" },
  { id: "rf-door", type: "single-choice", message: "원하는 도어 구조는요?", answerKey: `${n}.doorType`, options: [
    { value: "two-door", label: "2도어" }, { value: "four-door-value", label: "실속형 4도어" },
  ], next: "rf-household" },
  { id: "rf-household", type: "number-input", message: "함께 사용하는 가구원은 몇 명인가요?", answerKey: `${n}.householdSize`, min: 1, max: 20, unit: "명", next: "rf-capacity" },
  { id: "rf-capacity", type: "single-choice", message: "원하는 용량을 골라주세요.", answerKey: `${n}.capacityMode`, options: [
    { value: "300-500", label: "300~500L" }, { value: "600-800", label: "600~800L" }, { value: "recommended", label: "가구원 수에 따라 추천" },
  ], next: "rf-capacity-info" },
  { id: "rf-capacity-info", type: "assistant-message", message: "용량 기준을 정했어요.", buildMessage: (a) => { const r = getRecommendedCapacityRange(Number(v(a, "householdSize"))); return v(a, "capacityMode") === "recommended" ? `${v(a, "householdSize")}명 기준 설정 용량은 ${r.minLiters}~${r.maxLiters}L예요.` : `선택한 ${displayLabel(REFRIGERATOR_CAPACITY_LABELS, v(a, "capacityMode"))} 구간을 적용할게요.`; }, next: "rf-metal" },
  { id: "rf-metal", type: "confirmation", message: "메탈 소재 도어가 필수인가요?", answerKey: `${n}.metalRequired`, confirmLabel: "필수", cancelLabel: "선호", confirmNext: "rf-defaults", cancelNext: "rf-defaults" },
  { id: "rf-defaults", type: "single-choice", message: "모잇 기본 기준인 간접/간랭식·인버터·핵심부품 10년 보증·프리스탠딩을 필수로 적용할까요?", answerKey: `${n}.useDefaults`, options: [
    { value: "yes", label: "기본 기준 적용", next: "rf-budget" }, { value: "custom", label: "직접 선택", next: "rf-cooling" },
  ] },
  { id: "rf-cooling", type: "confirmation", message: "간접 냉각 또는 간랭식이 필수인가요?", answerKey: `${n}.coolingRequired`, confirmLabel: "필수", cancelLabel: "상관없음", confirmNext: "rf-inverter", cancelNext: "rf-inverter" },
  { id: "rf-inverter", type: "confirmation", message: "인버터 컴프레서가 필수인가요?", answerKey: `${n}.inverterRequired`, confirmLabel: "필수", cancelLabel: "상관없음", confirmNext: "rf-warranty", cancelNext: "rf-warranty" },
  { id: "rf-warranty", type: "confirmation", message: "핵심 부품 10년 이상 무상 보증이 필수인가요?", answerKey: `${n}.warrantyRequired`, confirmLabel: "필수", cancelLabel: "선호", confirmNext: "rf-freestanding", cancelNext: "rf-freestanding" },
  { id: "rf-freestanding", type: "confirmation", message: "프리스탠딩 설치 형태가 필수인가요?", answerKey: `${n}.freestandingRequired`, confirmLabel: "필수", cancelLabel: "상관없음", confirmNext: "rf-budget", cancelNext: "rf-budget" },
  { id: "rf-budget", type: "number-input", message: "구매 예산 상한을 입력해주세요.", answerKey: `${n}.budget`, min: 0, unit: "원", next: "rf-summary" },
  { id: "rf-summary", type: "assistant-message", message: "조건을 요약했어요.", buildMessage: (a) => `적용 조건: ${displayLabel(REFRIGERATOR_DOOR_LABELS, v(a, "doorType"))}, ${displayLabel(REFRIGERATOR_CAPACITY_LABELS, v(a, "capacityMode"))}, ${v(a, "metalRequired") ? "메탈 필수" : "메탈 선호"}, ${v(a, "useDefaults") === "yes" ? "기본 성능 4종 필수" : "직접 선택 기준"}, 예산 ${Number(v(a, "budget")).toLocaleString("ko-KR")}원이에요.`, next: "rf-confirm" },
  { id: "rf-confirm", type: "confirmation", message: "추천을 시작하거나 처음부터 조건을 수정할 수 있어요.", answerKey: `${n}.confirmed`, confirmLabel: "추천 시작", cancelLabel: "조건 수정", confirmNext: "rf-result", cancelNext: "$restart" },
  { id: "rf-result", type: "result", message: "필수 조건을 통과한 냉장고를 선호 점수순으로 정리했어요." },
];
export const refrigeratorFlow: FlowDefinition = { id: "refrigerator-flow", subCategoryId: "refrigerator", categoryId: "appliances", startStepId: "rf-intro", steps };
