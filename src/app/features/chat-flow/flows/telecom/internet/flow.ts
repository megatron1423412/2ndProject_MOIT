import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { createTelecomPlanBlock } from "../../../shared/telecom/blocks";

const namespace = "internet";

const opening: FlowStep[] = [
  { id: "internet-intro", type: "assistant-message", message: "인터넷은 현재 속도와 동시 사용 환경을 함께 진단할게요.", next: "internet-current-speed" },
  {
    id: "internet-current-speed",
    type: "single-choice",
    message: "현재 인터넷 속도는 얼마인가요?",
    answerKey: `${namespace}.currentSpeed`,
    options: [
      { value: "100", label: "100Mbps" },
      { value: "500", label: "500Mbps" },
      { value: "1000", label: "1Gbps" },
      { value: "unknown", label: "잘 모르겠어요" },
    ],
    next: `${namespace}-common-carrier`,
  },
];

const specific: FlowStep[] = [
  { id: "internet-household", type: "number-input", message: "인터넷을 함께 쓰는 가구원은 몇 명인가요?", answerKey: `${namespace}.householdSize`, placeholder: "예: 3", min: 1, unit: "명", next: "internet-devices" },
  { id: "internet-devices", type: "number-input", message: "동시에 연결되는 기기는 최대 몇 대 정도인가요?", answerKey: `${namespace}.deviceCount`, placeholder: "예: 6", min: 1, unit: "대", next: "internet-usage" },
  {
    id: "internet-usage",
    type: "multi-choice",
    message: "주요 인터넷 사용 패턴을 모두 골라주세요.",
    answerKey: `${namespace}.usage`,
    options: [
      { value: "streaming", label: "영상·OTT" },
      { value: "gaming", label: "온라인 게임" },
      { value: "work", label: "재택근무·업로드" },
      { value: "browsing", label: "웹서핑 위주" },
    ],
    minSelections: 1,
    next: "internet-usage-branch",
  },
  {
    id: "internet-usage-branch",
    type: "branch",
    conditions: [{ answerKey: `${namespace}.usage`, operator: "includes", value: "work", next: "internet-upload-note" }],
    defaultNext: "internet-confirm",
  },
  { id: "internet-upload-note", type: "assistant-message", message: "업무 사용이 있어 업로드 안정성과 공유기 성능을 확인 항목에 넣을게요.", next: "internet-confirm" },
  {
    id: "internet-confirm",
    type: "confirmation",
    message: "현재 속도를 낮출 수 있는지 mock 결과를 볼까요?",
    answerKey: `${namespace}.confirmed`,
    confirmNext: "internet-result",
    cancelNext: "internet-result",
    confirmLabel: "진단 보기",
    cancelLabel: "현재 조건으로 보기",
  },
  { id: "internet-result", type: "result", message: "속도와 사용 패턴을 기준으로 mock 결과를 정리했어요." },
];

export const internetFlow: FlowDefinition = {
  id: "internet-flow",
  subCategoryId: "internet",
  categoryId: "telecom",
  startStepId: "internet-intro",
  steps: composeFlow(opening, createTelecomPlanBlock({ namespace, next: "internet-household" }), specific),
};
