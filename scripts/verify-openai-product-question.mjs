import assert from "node:assert/strict";
import { createServer } from "vite";
import { loadServerEnv } from "../server/serverEnv.mjs";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { answerProductQuestion, toProductQuestionResult } = await server.ssrLoadModule("/server/productQuestionService.ts");
  const { catalogProducts } = await server.ssrLoadModule("/src/app/features/product-catalog/data/productCatalog.ts");
  const product = catalogProducts.find((item) => item.source === "real") ?? catalogProducts[0];
  const env = loadServerEnv();
  try {
    const result = await answerProductQuestion({
      apiKey: env.OPENAI_API_KEY,
      request: { productId: product.id, categoryId: product.categoryId, question: "이 제품의 가격을 어떻게 판단하면 좋을까요?", criteria: {}, recentTurns: [] },
    });
    assert.ok(result.answer.trim() && /[가-힣]/.test(result.answer), "비어 있지 않은 한국어 답변");
    console.log(JSON.stringify({ model: result.model, status: "success", latencyMs: result.latencyMs, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, totalTokens: result.usage.totalTokens, answerPreview: result.answer.replace(/\s+/g, " ").slice(0, 80) }));
  } catch (error) {
    const safe = toProductQuestionResult(error);
    console.log(JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", status: safe.code }));
    process.exitCode = 1;
  }
} finally {
  await server.close();
}
