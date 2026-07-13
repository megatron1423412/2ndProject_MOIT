import type { ProductQuestionRequest } from "./productQuestionContext";

export class ProductQuestionClientError extends Error {
  constructor(message: string, readonly code: string) { super(message); }
}

export const askProductQuestion = async (request: ProductQuestionRequest, signal?: AbortSignal) => {
  const response = await fetch("/api/ai/product-question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request), signal });
  const payload = await response.json().catch(() => ({})) as { answer?: string; message?: string; code?: string; optionalWarnings?: string[] };
  if (!response.ok) throw new ProductQuestionClientError(payload.message ?? "상품 질문 답변을 가져오지 못했습니다.", payload.code ?? "PRODUCT_QUESTION_ERROR");
  return { answer: payload.answer ?? "답변을 만들지 못했습니다.", optionalWarnings: payload.optionalWarnings ?? [] };
};
