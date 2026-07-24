import type { FlowAnswers, FlowDefinition, FlowStep } from "../../../core/types";
import {
  displayLabel,
  TV_PLATFORM_REQUIREMENT_LABELS,
  TV_PRIMARY_USE_LABELS,
  TV_PRIORITY_LABELS,
  TV_USAGE_LABELS,
} from "../displayLabels";
import { getRecommendedTvSize, getSelectedTvSize } from "./criteria";

const n = "tv";
const value = (answers: FlowAnswers, key: string) => answers[`${n}.${key}`];
const sizeOptions = [43, 55, 65, 75].map((size) => ({ value: String(size), label: `${size}인치` }));

const steps: FlowStep[] = [
  { id: "tv-intro", type: "assistant-message", message: "안녕하세요, 모잇이에요! 📺 시청 거리와 사용 방식을 먼저 확인하고, 꼭 필요한 스마트 기능과 가성비 기준까지 차례로 챙겨드릴게요!", next: "tv-distance" },
  { id: "tv-distance", type: "single-choice", message: "TV를 보실 때 화면과의 거리는 어느 정도인가요? 📏", answerKey: `${n}.viewingDistance`, options: [
    { value: "under-1.5", label: "1.5m 이하", next: "tv-size-recommendation" },
    { value: "1.5-2.5", label: "1.5~2.5m", next: "tv-size-recommendation" },
    { value: "2.5-3", label: "2.5~3m", next: "tv-size-recommendation" },
    { value: "over-3", label: "3m 이상", next: "tv-size-recommendation" },
    { value: "unknown", label: "잘 모르겠어요", next: "tv-size" },
    { value: "direct", label: "원하는 크기 직접 선택", next: "tv-size" },
  ] },
  { id: "tv-size-recommendation", type: "assistant-message", message: "시청 거리에 딱 맞는 화면 크기를 모잇이 골라봤어요! 😊", buildMessage: (answers) => `이 거리에서는 ${getRecommendedTvSize(answers)}인치부터 살펴보는 것을 추천해요. 시청 환경과 취향에 따라 다른 크기를 선택해도 괜찮아요.`, next: "tv-recommended-size" },
  { id: "tv-recommended-size", type: "single-choice", message: "이 크기로 진행해 볼까요? 👉", answerKey: `${n}.recommendedScreenSize`, options: [
    { value: "55", label: "55인치 적용", next: "tv-purpose" },
    { value: "other", label: "다른 크기 선택", next: "tv-size" },
  ], optionsResolver: (answers) => {
    const size = getRecommendedTvSize(answers);
    return [
      { value: String(size), label: `${size}인치 적용`, next: "tv-purpose" },
      { value: "other", label: "다른 크기 선택", next: "tv-size" },
    ];
  } },
  { id: "tv-size", type: "single-choice", message: "좋아요! 원하시는 화면 크기를 직접 골라주세요 ✅", answerKey: `${n}.screenSize`, options: sizeOptions, next: "tv-purpose" },
  { id: "tv-purpose", type: "single-choice", message: "TV는 주로 어떻게 사용하실 예정이에요? (영화, 게임, 예능 등) 🎬", answerKey: `${n}.primaryUse`, options: [
    { value: "broadcast-streaming", label: "방송·유튜브·OTT 시청" },
    { value: "movies-dramas", label: "영화와 드라마 감상" },
    { value: "family-wide-viewing", label: "가족이 여러 방향에서 함께 시청" },
    { value: "general", label: "특별한 용도 없이 일반 사용" },
  ], next: "tv-usage" },
  { id: "tv-usage", type: "single-choice", message: "하루에 TV를 얼마나 보실 예정인가요? ⏰", answerKey: `${n}.dailyUsage`, options: [
    { value: "under3", label: "3시간 미만" },
    { value: "3to6", label: "3~6시간" },
    { value: "over6", label: "6시간 이상" },
    { value: "unknown", label: "잘 모르겠어요" },
  ], next: "tv-platform" },
  { id: "tv-platform", type: "single-choice", message: "스마트 TV 플랫폼에 꼭 필요한 조건이 있으세요? (넷플릭스, 유튜브 등) 🔗", answerKey: `${n}.platformRequirement`, options: [
    { value: "google-android-required", label: "Google TV 또는 Android TV 필수" },
    { value: "other-allowed", label: "삼성·LG 등 다른 스마트 OS도 괜찮음" },
    { value: "none", label: "상관없음" },
  ], next: "tv-priority" },
  { id: "tv-priority", type: "single-choice", message: "어떤 가성비를 가장 중요하게 볼까요? 모잇이 그 기준에 맞춰 꼼꼼하게 찾아드릴게요! 💰", answerKey: `${n}.valuePriority`, options: [
    { value: "low-purchase-price", label: "구매가격이 낮은 제품" },
    { value: "good-current-price", label: "현재 가격이 좋은 제품" },
    { value: "picture-quality", label: "화질이 좋은 제품" },
    { value: "electricity-saving", label: "전기요금을 아끼는 제품" },
    { value: "balanced", label: "가격·화질 균형 추천" },
  ], next: "tv-budget" },
  { id: "tv-budget", type: "number-input", message: "TV 가격은 최대 얼마까지 생각하고 계세요? 지갑 사정에 맞춰 추천해 드릴게요 🙌", answerKey: `${n}.budget`, min: 1, unit: "원", placeholder: "최대 제품 가격", alternateOption: { value: "none", label: "예산 제한 없음", next: "tv-summary" }, next: "tv-summary" },
  { id: "tv-summary", type: "assistant-message", message: "지금까지 알려주신 조건을 한눈에 정리해 드렸어요! 📋", buildMessage: (answers) => {
    const budget = value(answers, "budget");
    return [
      "선택 조건",
      `- 화면 크기: ${getSelectedTvSize(answers)}인치`,
      `- 주 사용: ${displayLabel(TV_PRIMARY_USE_LABELS, value(answers, "primaryUse"))}`,
      `- 예상 사용: ${displayLabel(TV_USAGE_LABELS, value(answers, "dailyUsage"))}`,
      `- 스마트 플랫폼: ${displayLabel(TV_PLATFORM_REQUIREMENT_LABELS, value(answers, "platformRequirement"))}`,
      `- 가성비 기준: ${displayLabel(TV_PRIORITY_LABELS, value(answers, "valuePriority"))}`,
      `- 제품 가격: ${budget === "none" ? "예산 제한 없음" : `${Number(budget).toLocaleString("ko-KR")}원 이하`}`,
    ].join("\n");
  }, next: "tv-confirm" },
  { id: "tv-confirm", type: "confirmation", message: "모잇이 자동으로 챙겨드리는 것들이에요! ✨\n- 선명한 4K UHD 제품만 챙겨드려요\n- 판매 중단된 제품은 미리 정리해 드려요\n- 말씀해 주신 스마트 플랫폼 필수 조건을 그대로 적용해요 ✅\n- 주로 보시는 방식에 맞춰 HDR과 패널 특성까지 꼼꼼하게 반영해요 🔍\n- 현재 가격이 역대 최저가 대비 어느 위치인지 반영해요 💰\n- 에너지 등급과 보증 기간도 순위에 챙겨 넣어요\n\n이 조건으로 추천을 시작해 볼까요?", answerKey: `${n}.confirmed`, confirmLabel: "추천 시작", cancelLabel: "조건 수정", confirmNext: "tv-result", cancelNext: "$restart" },
  { id: "tv-result", type: "result", message: "짜잔! 필수 조건을 통과한 TV를 사용 방식과 가성비 기준에 맞춰 쫙 정렬해 봤어요 ✨ 마음에 드는 제품이 있는지 확인해 보세요!" },
];

export const tvFlow: FlowDefinition = {
  id: "tv-flow",
  subCategoryId: "tv",
  categoryId: "appliances",
  startStepId: "tv-intro",
  steps,
  enableConditionUndo: true,
};
