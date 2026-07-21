import type { ProductQuestionRequest } from "./productQuestionContext";

export class ProductQuestionClientError extends Error {
  constructor(readonly code: string) { super(code); }
}

export type ProductQuestionSource = {
  title: string;
  topic: string;
  sourceName: string;
  sourceUrl?: string;
  heading?: string;
  temporalStatus: "stable" | "mixed" | "dated";
};

export type ProductQuestionGrounding = { usedProductDatabase: boolean; usedRag: boolean };

export const askProductQuestion = async (request: ProductQuestionRequest, signal?: AbortSignal) => {
  const response = await fetch("/api/ai/product-question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal });
  const payload = await response.json().catch(() => ({})) as { ok?: boolean; answer?: string; sources?: ProductQuestionSource[]; grounding?: ProductQuestionGrounding; code?: string };
  if (!response.ok || !payload.ok || !payload.answer?.trim()) throw new ProductQuestionClientError(payload.code ?? "OPENAI_REQUEST_FAILED");
  return { answer: payload.answer.trim(), sources: Array.isArray(payload.sources) ? payload.sources : [], grounding: payload.grounding ?? { usedProductDatabase: true, usedRag: false } };
};

export const productQuestionErrorMessage = (code: string) => {
  if (code === "OPENAI_CONFIG_MISSING") return "AI 답변 기능이 아직 설정되지 않았어요.";
  if (code === "OPENAI_AUTH_FAILED") return "AI 연결을 확인하지 못했어요. 잠시 후 다시 시도해주세요.";
  if (code === "OPENAI_RATE_LIMITED") return "요청이 많아 잠시 답변하기 어려워요. 잠시 후 다시 시도해주세요.";
  if (code === "RAG_INDEX_MISSING") return "구매가이드 검색 색인이 준비되지 않았어요. 관리자에게 알려주세요.";
  return "답변을 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
};
