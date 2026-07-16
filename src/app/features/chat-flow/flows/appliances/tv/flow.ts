import type { FlowDefinition, FlowStep } from "../../../core/types";
import { displayLabel, TV_OS_LABELS, TV_PANEL_LABELS } from "../displayLabels";

const n = "tv";
const v = (a: Record<string, unknown>, key: string) => a[`${n}.${key}`];
const steps: FlowStep[] = [
  { id: "tv-intro", type: "assistant-message", message: "TV의 OS·크기를 먼저 정하고 기본 화질·보증과 편의 조건을 확인할게요.", next: "tv-os" },
  { id: "tv-os", type: "single-choice", message: "선호하는 스마트 TV OS는 무엇인가요?", answerKey: `${n}.os`, options: [
    { value: "android-tv", label: "안드로이드 TV" }, { value: "google-tv", label: "Google TV" }, { value: "either", label: "둘 다 가능" }, { value: "any", label: "상관없음" },
  ], next: "tv-size" },
  { id: "tv-size", type: "single-choice", message: "원하는 화면 크기는요?", answerKey: `${n}.screenSize`, options: [43, 55, 65, 75].map((size) => ({ value: String(size), label: `${size}인치` })), next: "tv-panel" },
  { id: "tv-panel", type: "single-choice", message: "선호 패널을 골라주세요.", answerKey: `${n}.panel`, options: [
    { value: "ips", label: "IPS" }, { value: "va", label: "VA" }, { value: "any", label: "상관없음" },
  ], next: "tv-defaults" },
  { id: "tv-defaults", type: "single-choice", message: "모잇 기본 기준인 4K UHD와 무상 A/S 2년 이상을 필수로 적용할까요?", answerKey: `${n}.useDefaults`, options: [
    { value: "yes", label: "기본 기준 적용", next: "tv-hdr" }, { value: "custom", label: "직접 선택", next: "tv-4k" },
  ] },
  { id: "tv-4k", type: "confirmation", message: "4K UHD가 필수인가요?", answerKey: `${n}.fourKRequired`, confirmLabel: "필수", cancelLabel: "상관없음", confirmNext: "tv-warranty", cancelNext: "tv-warranty" },
  { id: "tv-warranty", type: "single-choice", message: "최소 무상 A/S 보증 기간은요?", answerKey: `${n}.minimumWarranty`, options: [
    { value: "2", label: "2년 이상" }, { value: "3", label: "3년 이상" }, { value: "any", label: "상관없음" },
  ], next: "tv-hdr" },
  { id: "tv-hdr", type: "confirmation", message: "HDR 화질 개선 기술이 필수인가요?", answerKey: `${n}.hdrRequired`, confirmLabel: "필수", cancelLabel: "선호", confirmNext: "tv-rebate", cancelNext: "tv-rebate" },
  { id: "tv-rebate", type: "single-choice", message: "더미 환급 대상 여부를 얼마나 중요하게 볼까요?", answerKey: `${n}.rebate`, options: [
    { value: "required", label: "필수" }, { value: "preferred", label: "선호" }, { value: "any", label: "상관없음" },
  ], next: "tv-budget" },
  { id: "tv-budget", type: "number-input", message: "구매 예산 상한을 입력해주세요.", answerKey: `${n}.budget`, min: 0, unit: "원", next: "tv-summary" },
  { id: "tv-summary", type: "assistant-message", message: "조건을 요약했어요.", buildMessage: (a) => `적용 조건: ${v(a, "screenSize")}인치, ${displayLabel(TV_OS_LABELS, v(a, "os"))}, ${displayLabel(TV_PANEL_LABELS, v(a, "panel"))}, ${v(a, "useDefaults") === "yes" ? "4K·2년 보증 필수" : "직접 선택 기준"}, 예산 ${Number(v(a, "budget")).toLocaleString("ko-KR")}원이에요.`, next: "tv-confirm" },
  { id: "tv-confirm", type: "confirmation", message: "추천을 시작하거나 처음부터 조건을 수정할 수 있어요.", answerKey: `${n}.confirmed`, confirmLabel: "추천 시작", cancelLabel: "조건 수정", confirmNext: "tv-result", cancelNext: "$restart" },
  { id: "tv-result", type: "result", message: "필수 조건을 통과한 TV를 선호 점수순으로 정리했어요." },
];
export const tvFlow: FlowDefinition = { id: "tv-flow", subCategoryId: "tv", categoryId: "appliances", startStepId: "tv-intro", steps };
