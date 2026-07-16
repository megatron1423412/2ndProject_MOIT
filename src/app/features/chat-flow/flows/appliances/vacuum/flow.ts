import type { FlowDefinition, FlowStep } from "../../../core/types";
import { displayLabel, VACUUM_POWER_LABELS, VACUUM_SUCTION_LABELS, VACUUM_WEIGHT_LABELS } from "../displayLabels";

const n = "vacuum";
const v = (a: Record<string, unknown>, key: string) => a[`${n}.${key}`];
const steps: FlowStep[] = [
  { id: "vc-intro", type: "assistant-message", message: "청소기의 동력 방식과 흡입력 단위를 먼저 확인하고 필터·구성품을 볼게요.", next: "vc-power" },
  { id: "vc-power", type: "single-choice", message: "원하는 동력 방식은요?", answerKey: `${n}.powerType`, options: [
    { value: "wireless-value", label: "가성비 무선", next: "vc-suction" }, { value: "wired-major", label: "대기업 유선", next: "vc-suction" },
  ] },
  { id: "vc-suction", type: "single-choice", message: "실질 흡입력 기준을 골라주세요. AW와 Pa는 별도로 판정해요.", answerKey: `${n}.suctionStandard`, options: [
    { value: "aw", label: "200AW 이상" }, { value: "pa", label: "25,000Pa 이상" }, { value: "unknown", label: "단위를 잘 모르겠음" },
  ], next: "vc-power-branch" },
  { id: "vc-power-branch", type: "branch", conditions: [{ answerKey: `${n}.powerType`, operator: "equals", value: "wireless-value", next: "vc-battery" }], defaultNext: "vc-hepa" },
  { id: "vc-battery", type: "confirmation", message: "배터리 분리·교체가 필수인가요?", answerKey: `${n}.replaceableBatteryRequired`, confirmLabel: "필수", cancelLabel: "상관없음", confirmNext: "vc-dock", cancelNext: "vc-dock" },
  { id: "vc-dock", type: "confirmation", message: "스탠드형 충전 거치대가 필수인가요?", answerKey: `${n}.standingDockRequired`, confirmLabel: "필수", cancelLabel: "선호", confirmNext: "vc-hepa", cancelNext: "vc-hepa" },
  { id: "vc-hepa", type: "confirmation", message: "H13 이상 HEPA 필터가 필수인가요?", answerKey: `${n}.hepaRequired`, confirmLabel: "필수", cancelLabel: "선호", confirmNext: "vc-roller", cancelNext: "vc-roller" },
  { id: "vc-roller", type: "confirmation", message: "마루용 소프트 롤러 브러시가 필수인가요?", answerKey: `${n}.softRollerRequired`, confirmLabel: "필수", cancelLabel: "선호", confirmNext: "vc-weight", cancelNext: "vc-weight" },
  { id: "vc-weight", type: "single-choice", message: "본체 중량 기준은요?", answerKey: `${n}.weight`, options: [
    { value: "under-2.5", label: "2.5kg 이하" }, { value: "any", label: "상관없음" },
  ], next: "vc-budget" },
  { id: "vc-budget", type: "number-input", message: "구매 예산 상한을 입력해주세요.", answerKey: `${n}.budget`, min: 0, unit: "원", next: "vc-summary" },
  { id: "vc-summary", type: "assistant-message", message: "조건을 요약했어요.", buildMessage: (a) => `적용 조건: ${displayLabel(VACUUM_POWER_LABELS, v(a, "powerType"))}, ${displayLabel(VACUUM_SUCTION_LABELS, v(a, "suctionStandard"))} 독립 판정, HEPA ${v(a, "hepaRequired") ? "필수" : "선호"}, ${displayLabel(VACUUM_WEIGHT_LABELS, v(a, "weight"))}, 예산 ${Number(v(a, "budget")).toLocaleString("ko-KR")}원이에요.${v(a, "powerType") === "wired-major" ? " 유선이므로 배터리·충전 거치대 조건은 건너뛰었어요." : ""}`, next: "vc-confirm" },
  { id: "vc-confirm", type: "confirmation", message: "추천을 시작하거나 처음부터 조건을 수정할 수 있어요.", answerKey: `${n}.confirmed`, confirmLabel: "추천 시작", cancelLabel: "조건 수정", confirmNext: "vc-result", cancelNext: "$restart" },
  { id: "vc-result", type: "result", message: "AW와 Pa를 환산하지 않고 필수 조건을 통과한 상품만 정리했어요." },
];
export const vacuumFlow: FlowDefinition = { id: "vacuum-flow", subCategoryId: "vacuum", categoryId: "appliances", startStepId: "vc-intro", steps };
