import type { FlowAnswers, FlowResult } from "../../core/types";

interface TelecomResultOptions {
  namespace: string;
  title: string;
  summary: string;
  answers: FlowAnswers;
  savingsRate?: number;
  highlights: string[];
  warnings: string[];
  recommendedActions: string[];
}

export const createTelecomMockResult = (options: TelecomResultOptions): FlowResult => {
  const fee = options.answers[`${options.namespace}.monthlyFee`];
  const monthlyFee = typeof fee === "number" ? fee : 0;
  const monthlySaving = Math.round(monthlyFee * (options.savingsRate ?? 0.16) / 1000) * 1000;

  return {
    title: options.title,
    summary: options.summary,
    grade: monthlySaving >= 15000 ? "절감 가능성 높음" : "조건 확인 필요",
    monthlySaving,
    yearlySaving: monthlySaving * 12,
    metrics: [{ label: "현재 월 납부액", value: monthlyFee ? `${monthlyFee.toLocaleString("ko-KR")}원` : "미입력" }],
    highlights: options.highlights,
    warnings: options.warnings,
    recommendedActions: options.recommendedActions,
    mockNotice: "예상 절감액은 흐름 확인용 단순 mock 계산이며 실제 통신사 요금·위약금·결합 조건을 반영하지 않습니다.",
    metadata: { category: "telecom", answers: options.answers },
  };
};
