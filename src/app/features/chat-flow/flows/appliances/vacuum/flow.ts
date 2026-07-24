import type { FlowAnswers, FlowDefinition, FlowStep } from "../../../core/types";
import {
  displayLabel,
  VACUUM_FLOOR_LABELS,
  VACUUM_POWER_LABELS,
  VACUUM_PRIORITY_LABELS,
  VACUUM_USAGE_LABELS,
  VACUUM_WEIGHT_IMPORTANCE_LABELS,
} from "../displayLabels";

const n = "vacuum";
const value = (answers: FlowAnswers, key: string) => answers[`${n}.${key}`];
const label = (labels: Record<string, string>, selected: unknown) => displayLabel(labels, selected);

const steps: FlowStep[] = [
  { id: "vc-intro", type: "assistant-message", message: "안녕하세요, 모잇이에요! 🧹 평소 청소 방식과 집 안 환경에 맞춰 실용적인 가성비 청소기를 찾아드릴게요!", next: "vc-usage" },
  { id: "vc-usage", type: "single-choice", message: "청소기는 주로 어떻게 사용하실 예정이에요?", answerKey: `${n}.primaryUse`, options: [
    { value: "short-daily", label: "자주 짧게 일상 청소" },
    { value: "whole-home", label: "한 번에 집 전체 청소" },
    { value: "dust-hair", label: "먼지와 머리카락 청소" },
    { value: "allergy", label: "미세먼지·알레르기 관리" },
    { value: "balanced", label: "일반적인 균형 사용" },
  ], next: "vc-power" },
  { id: "vc-power", type: "single-choice", message: "유선과 무선 중 어떤 방식이 더 편하세요? 🔌", answerKey: `${n}.powerType`, options: [
    { value: "wireless-value", label: "이동이 편한 무선" },
    { value: "wired-major", label: "충전 없이 오래 쓰는 유선" },
    { value: "any", label: "상관없음" },
  ], next: "vc-floor" },
  { id: "vc-floor", type: "single-choice", message: "주로 어떤 바닥을 청소하시나요? (마루, 카펫, 타일 등) 🏠", answerKey: `${n}.floorEnvironment`, options: [
    { value: "hard-floor", label: "마루·타일 위주" },
    { value: "carpet-rug", label: "카펫·러그도 많음" },
    { value: "mixed", label: "여러 바닥이 섞여 있음" },
    { value: "unknown", label: "잘 모르겠어요" },
  ], next: "vc-weight" },
  { id: "vc-weight", type: "single-choice", message: "청소기를 들고 움직일 때 가벼운 무게가 중요한 편이세요? 💪", answerKey: `${n}.weightImportance`, options: [
    { value: "very", label: "매우 중요해요" },
    { value: "somewhat", label: "어느 정도 중요해요" },
    { value: "none", label: "상관없어요" },
  ], next: "vc-priority" },
  { id: "vc-priority", type: "single-choice", message: "어떤 가성비를 가장 중요하게 볼까요? 모잇이 그 기준에 맞춰 꼼꼼하게 찾아드릴게요! 💰", answerKey: `${n}.valuePriority`, options: [
    { value: "low-purchase-price", label: "구매가격이 낮은 제품" },
    { value: "good-current-price", label: "현재 가격이 좋은 제품" },
    { value: "strong-suction", label: "흡입력이 강한 제품" },
    { value: "convenience", label: "사용과 관리가 편한 제품" },
    { value: "balanced", label: "가격·성능 균형 추천" },
  ], next: "vc-budget" },
  { id: "vc-budget", type: "number-input", message: "청소기 가격은 최대 얼마까지 생각하고 계세요? 지갑 사정에 맞춰 추천해 드릴게요 🙌", answerKey: `${n}.budget`, min: 1, unit: "원", placeholder: "최대 제품 가격", alternateOption: { value: "none", label: "예산 제한 없음", next: "vc-summary" }, next: "vc-summary" },
  { id: "vc-summary", type: "assistant-message", message: "지금까지 알려주신 조건을 한눈에 정리해 드렸어요! 📋", buildMessage: (answers) => {
    const budget = value(answers, "budget");
    return [
      "다음 조건으로 청소기를 찾아볼게요.",
      `· 주 사용 방식: ${label(VACUUM_USAGE_LABELS, value(answers, "primaryUse"))}`,
      `· 동력 방식: ${label(VACUUM_POWER_LABELS, value(answers, "powerType"))}`,
      `· 바닥 환경: ${label(VACUUM_FLOOR_LABELS, value(answers, "floorEnvironment"))}`,
      `· 무게 중요도: ${label(VACUUM_WEIGHT_IMPORTANCE_LABELS, value(answers, "weightImportance"))}`,
      `· 가성비 기준: ${label(VACUUM_PRIORITY_LABELS, value(answers, "valuePriority"))}`,
      `· 제품 예산: ${budget === "none" ? "제한 없음" : `최대 ${Number(budget).toLocaleString("ko-KR")}원`}`,
    ].join("\n");
  }, next: "vc-confirm" },
  { id: "vc-confirm", type: "confirmation", message: "모잇이 자동으로 챙겨드리는 것들이에요! ✨\n- 직접 고르신 유선·무선 방식을 그대로 적용해요 ✅\n- 예산을 넘는 제품과 판매 중단된 제품은 미리 정리해 드려요\n- 흡입력 표기 단위가 서로 다른 제품은 억지로 환산하지 않고, 각각 공정하게 비교해요 🔍\n- 선택하신 사용 방식에 맞춰 흡입력, 무게, 필터, 배터리, 롤러, 거치대, 보증기간까지 꼼꼼하게 챙겨드려요\n- 현재 가격이 역대 최저가 대비 어느 위치인지 반영해요 💰\n\n이 조건으로 추천을 시작해 볼까요?", answerKey: `${n}.confirmed`, confirmLabel: "추천 시작", cancelLabel: "조건 수정", confirmNext: "vc-result", cancelNext: "$restart" },
  { id: "vc-result", type: "result", message: "짜잔! 필수 조건을 통과한 청소기를 선택하신 사용 방식과 가성비 기준에 맞춰 쫙 정렬해 봤어요 ✨ 마음에 드는 제품이 있는지 확인해 보세요!" },
];

export const vacuumFlow: FlowDefinition = {
  id: "vacuum-flow",
  subCategoryId: "vacuum",
  categoryId: "appliances",
  startStepId: "vc-intro",
  steps,
  enableConditionUndo: true,
};
