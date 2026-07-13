import type { FlowDefinition, FlowStep } from "../../../core/types";
import { calculateRecommendedCoolingArea } from "./criteria";

const n = "airConditioner";
const value = (answers: Record<string, unknown>, key: string) => answers[`${n}.${key}`];

const steps: FlowStep[] = [
  { id: "ac-intro", type: "assistant-message", message: "에어컨의 형태·냉방 면적부터 확인하고 설치·효율 조건을 차례로 볼게요.", next: "ac-type" },
  { id: "ac-type", type: "single-choice", message: "원하는 에어컨 타입은 무엇인가요?", answerKey: `${n}.type`, options: [
    { value: "standing", label: "스탠드" }, { value: "wall", label: "벽걸이" }, { value: "two-in-one", label: "2in1" }, { value: "window", label: "창문형" },
  ], next: "ac-home" },
  { id: "ac-home", type: "number-input", message: "집 전체는 몇 평인가요?", answerKey: `${n}.homePyeong`, min: 1, max: 200, unit: "평", next: "ac-area-info" },
  { id: "ac-area-info", type: "assistant-message", message: "권장 냉방 면적을 계산했어요.", buildMessage: (a) => `설정 계수에 따른 권장 정격 냉방 면적은 ${calculateRecommendedCoolingArea(Number(value(a, "homePyeong")))}평이에요. 그대로 쓰거나 직접 수정할 수 있어요.`, next: "ac-area-mode" },
  { id: "ac-area-mode", type: "single-choice", message: "추천 면적을 적용할까요?", answerKey: `${n}.coolingAreaMode`, options: [
    { value: "recommended", label: "계산값 적용", next: "ac-defaults" }, { value: "custom", label: "직접 수정", next: "ac-area-custom" },
  ] },
  { id: "ac-area-custom", type: "number-input", message: "필요한 정격 냉방 면적을 입력해주세요.", answerKey: `${n}.customCoolingArea`, min: 1, max: 100, unit: "평", next: "ac-defaults" },
  { id: "ac-defaults", type: "single-choice", message: "모잇 기본 기준인 인버터·공식 지정 설치·자동 건조 필수를 적용할까요?", answerKey: `${n}.useDefaults`, options: [
    { value: "yes", label: "기본 기준 적용", next: "ac-install-cost" }, { value: "custom", label: "직접 선택", next: "ac-inverter" },
  ] },
  { id: "ac-inverter", type: "confirmation", message: "인버터 컴프레서가 필수인가요?", answerKey: `${n}.inverterRequired`, confirmLabel: "필수", cancelLabel: "상관없음", confirmNext: "ac-official", cancelNext: "ac-official" },
  { id: "ac-official", type: "confirmation", message: "제조사 공식 지정 설치가 필수인가요?", answerKey: `${n}.officialRequired`, confirmLabel: "필수", cancelLabel: "상관없음", confirmNext: "ac-auto-dry", cancelNext: "ac-auto-dry" },
  { id: "ac-auto-dry", type: "confirmation", message: "내부 자동 건조가 필수인가요?", answerKey: `${n}.autoDryRequired`, confirmLabel: "필수", cancelLabel: "선호", confirmNext: "ac-install-cost", cancelNext: "ac-install-cost" },
  { id: "ac-install-cost", type: "single-choice", message: "기본 설치비 포함 여부는 어떻게 볼까요?", answerKey: `${n}.installationCost`, options: [
    { value: "required", label: "필수" }, { value: "preferred", label: "선호" }, { value: "any", label: "상관없음" },
  ], next: "ac-energy" },
  { id: "ac-energy", type: "single-choice", message: "원하는 에너지 소비효율 등급은요?", answerKey: `${n}.energyGrade`, options: [
    { value: "1-required", label: "1등급 필수" }, { value: "2-preferred", label: "2등급 이상 선호" }, { value: "any", label: "상관없음" },
  ], next: "ac-rebate" },
  { id: "ac-rebate", type: "single-choice", message: "더미 환급 대상 여부를 얼마나 중요하게 볼까요?", answerKey: `${n}.rebate`, options: [
    { value: "required", label: "필수" }, { value: "preferred", label: "선호" }, { value: "any", label: "상관없음" },
  ], next: "ac-budget" },
  { id: "ac-budget", type: "number-input", message: "구매 예산 상한을 입력해주세요.", answerKey: `${n}.budget`, min: 0, unit: "원", next: "ac-summary" },
  { id: "ac-summary", type: "assistant-message", message: "조건을 요약했어요.", buildMessage: (a) => `적용 조건: ${String(value(a, "type"))}, 냉방 ${value(a, "coolingAreaMode") === "custom" ? value(a, "customCoolingArea") : calculateRecommendedCoolingArea(Number(value(a, "homePyeong")))}평 이상, ${value(a, "useDefaults") === "yes" ? "인버터·공식 설치·자동 건조 필수" : "직접 선택 기준"}, 예산 ${Number(value(a, "budget")).toLocaleString("ko-KR")}원이에요.`, next: "ac-confirm" },
  { id: "ac-confirm", type: "confirmation", message: "조건을 확인했어요. 추천을 시작하거나 처음부터 조건을 수정할 수 있어요.", answerKey: `${n}.confirmed`, confirmLabel: "추천 시작", cancelLabel: "조건 수정", confirmNext: "ac-result", cancelNext: "$restart" },
  { id: "ac-result", type: "result", message: "필수 조건으로 거른 뒤 선호 점수순으로 정렬한 더미 상품이에요." },
];

export const airConditionerFlow: FlowDefinition = { id: "air-conditioner-flow", subCategoryId: "air-conditioner", categoryId: "appliances", startStepId: "ac-intro", steps };
