import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { createTelecomPlanBlock } from "../../../shared/telecom/blocks";

const namespace = "iptv";

const opening: FlowStep[] = [
  { id: "iptv-intro", type: "assistant-message", message: "TV·IPTV는 현재 요금과 실제 채널 사용량을 나눠서 볼게요.", next: `${namespace}-common-carrier` },
];

const specific: FlowStep[] = [
  { id: "iptv-channel-count", type: "number-input", message: "현재 제공되는 채널 수는 대략 몇 개인가요?", answerKey: `${namespace}.channelCount`, placeholder: "예: 230", min: 0, unit: "개", next: "iptv-frequency" },
  {
    id: "iptv-frequency",
    type: "single-choice",
    message: "IPTV를 얼마나 자주 시청하나요?",
    answerKey: `${namespace}.frequency`,
    options: [
      { value: "daily", label: "매일" },
      { value: "weekly", label: "주 1~3회" },
      { value: "rarely", label: "거의 보지 않아요" },
    ],
    next: "iptv-genres",
  },
  {
    id: "iptv-genres",
    type: "multi-choice",
    message: "꼭 필요한 채널이나 장르를 골라주세요.",
    answerKey: `${namespace}.genres`,
    options: [
      { value: "sports", label: "스포츠" },
      { value: "kids", label: "키즈" },
      { value: "news", label: "뉴스·시사" },
      { value: "movie", label: "영화·드라마" },
      { value: "none", label: "필수 채널 없음" },
    ],
    minSelections: 1,
    next: "iptv-confirm",
  },
  {
    id: "iptv-confirm",
    type: "confirmation",
    message: "채널팩을 줄일 수 있는지 mock 진단을 볼까요?",
    answerKey: `${namespace}.confirmed`,
    confirmNext: "iptv-result",
    cancelNext: "iptv-result",
    confirmLabel: "결과 보기",
    cancelLabel: "현재 조건으로 보기",
  },
  { id: "iptv-result", type: "result", message: "시청 빈도와 필수 채널을 기준으로 mock 결과를 만들었어요." },
];

export const iptvFlow: FlowDefinition = {
  id: "iptv-flow",
  subCategoryId: "iptv",
  categoryId: "telecom",
  startStepId: "iptv-intro",
  steps: composeFlow(opening, createTelecomPlanBlock({ namespace, next: "iptv-channel-count", includeBundle: false }), specific),
};
