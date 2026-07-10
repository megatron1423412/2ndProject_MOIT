import type { FlowAnswers, FlowResult } from "../../core/types";

interface ApplianceResultOptions {
  namespace: string;
  title: string;
  summary: string;
  grade: string;
  highlights: string[];
  warnings: string[];
  recommendedActions: string[];
  answers: FlowAnswers;
}

export const createApplianceMockResult = (options: ApplianceResultOptions): FlowResult => {
  const budget = options.answers[`${options.namespace}.budget`];
  const preference = options.answers[`${options.namespace}.purchasePreference`];

  return {
    title: options.title,
    summary: options.summary,
    grade: options.grade,
    score: preference === "balanced" ? 86 : 80,
    metrics: [
      { label: "입력 예산", value: typeof budget === "number" ? `${budget.toLocaleString("ko-KR")}원` : "미입력" },
      { label: "구매 성향", value: preference === "price" ? "가격 우선" : preference === "performance" ? "성능 우선" : "균형형" },
    ],
    highlights: options.highlights,
    warnings: options.warnings,
    recommendedActions: options.recommendedActions,
    mockNotice: "현재 결과는 화면 흐름 검증용 mock 진단이며 실제 구매 기준이나 정확한 시세를 보장하지 않습니다.",
    metadata: { category: "appliances", answers: options.answers },
  };
};
