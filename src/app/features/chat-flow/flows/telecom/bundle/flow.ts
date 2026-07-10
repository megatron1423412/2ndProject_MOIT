import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { createTelecomPlanBlock } from "../../../shared/telecom/blocks";

const namespace = "bundle";

const opening: FlowStep[] = [
  { id: "bundle-intro", type: "assistant-message", message: "결합 상품은 가족 회선과 인터넷·IPTV 구성을 함께 확인할게요.", next: "bundle-line-count" },
  { id: "bundle-line-count", type: "number-input", message: "결합을 검토할 휴대폰 회선은 몇 개인가요?", answerKey: `${namespace}.lineCount`, placeholder: "예: 3", min: 1, unit: "회선", next: "bundle-carriers" },
  { id: "bundle-carriers", type: "text-input", message: "각 회선의 통신사를 간단히 적어주세요.", answerKey: `${namespace}.lineCarriers`, placeholder: "예: SKT 2회선, KT 1회선", next: `${namespace}-common-monthly-fee` },
];

const specific: FlowStep[] = [
  {
    id: "bundle-services",
    type: "multi-choice",
    message: "현재 함께 이용 중인 서비스를 골라주세요.",
    answerKey: `${namespace}.services`,
    options: [
      { value: "internet", label: "인터넷" },
      { value: "iptv", label: "IPTV" },
      { value: "home-phone", label: "집전화" },
      { value: "none", label: "휴대폰만 사용" },
    ],
    minSelections: 1,
    next: "bundle-current-discount",
  },
  { id: "bundle-current-discount", type: "number-input", message: "현재 매달 받는 결합 할인액은 얼마인가요?", answerKey: `${namespace}.currentDiscount`, placeholder: "예: 22000", min: 0, unit: "원", next: "bundle-result" },
  { id: "bundle-result", type: "result", message: "회선과 서비스 구성을 기준으로 mock 결합 진단을 만들었어요." },
];

export const bundleFlow: FlowDefinition = {
  id: "bundle-flow",
  subCategoryId: "bundle",
  categoryId: "telecom",
  startStepId: "bundle-intro",
  steps: composeFlow(
    opening,
    createTelecomPlanBlock({ namespace, next: "bundle-services", includeCarrier: false, includeBundle: false }),
    specific,
  ),
};
