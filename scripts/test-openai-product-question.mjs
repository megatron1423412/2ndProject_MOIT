import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const load = (path) => server.ssrLoadModule(path);

try {
  const service = await load("/server/productQuestionService.ts");
  const { catalogProducts } = await load("/src/app/features/product-catalog/data/productCatalog.ts");
  const product = catalogProducts.find((item) => item.source === "real") ?? catalogProducts[0];
  const request = {
    productId: product.id,
    categoryId: product.categoryId,
    question: "이 제품의 가격을 어떻게 판단하면 좋을까요?",
    criteria: { "tv.primaryUse": "broadcast-streaming", "tv.valuePriority": "balanced" },
    recentTurns: Array.from({ length: 6 }, (_, index) => ({ id: `turn-${index}`, role: index % 2 ? "assistant" : "user", text: `관련 대화 ${index}` })),
  };
  const previousModel = process.env.OPENAI_MODEL;
  delete process.env.OPENAI_MODEL;
  assert.equal(service.PRODUCT_QUESTION_MODEL(), "gpt-4o-mini", "기본 모델은 gpt-4o-mini");
  if (previousModel !== undefined) process.env.OPENAI_MODEL = previousModel;

  const context = service.buildProductQuestionContext(request);
  assert.deepEqual(Object.keys(context), ["category", "product", "purchaseCriteria", "recentTurns", "question"], "승인된 문맥 필드만 사용");
  assert.equal(context.recentTurns.length, 4, "최근 관련 대화는 네 턴으로 제한");
  assert.ok(context.purchaseCriteria.every((item) => !/tv\.|balanced|broadcast-streaming/.test(item)), "조건은 자연어 라벨 사용");
  const serialized = JSON.stringify(context);
  assert.ok(!serialized.includes("imagePath") && !serialized.includes("priceHistory") && !serialized.includes("aiReviewSummary"), "전체 카탈로그·원본 가격 이력·비승인 필드를 전송하지 않음");
  assert.ok("historicalLowestPrice" in context.product && "differenceFromHistoricalLow" in context.product && "percentAboveHistoricalLow" in context.product, "가격 통계는 호출 전에 계산");

  let calls = 0; let modelFields;
  const success = await service.answerProductQuestion({ apiKey: "test-key", request, modelFactory: (fields) => ({ invoke: async () => { calls += 1; modelFields = fields; return { content: "저장된 가격 이력과 예산을 함께 비교해보세요.", usage_metadata: { input_tokens: 12, output_tokens: 8, total_tokens: 20 } }; } }) });
  assert.equal(calls, 1, "한 제출은 정확히 한 번 모델 호출");
  assert.deepEqual({ model: modelFields.model, temperature: modelFields.temperature, maxTokens: modelFields.maxTokens, timeout: modelFields.timeout, maxRetries: modelFields.maxRetries }, { model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", temperature: 0.2, maxTokens: 400, timeout: 20_000, maxRetries: 1 }, "gpt-4o-mini LangChain 구성");
  assert.equal(success.usage.totalTokens, 20, "사용량은 서버 내부에서만 집계");
  await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request: { ...request, question: " " }, modelFactory: () => ({ invoke: async () => { calls += 1; return { content: "실패" }; } }) }), (error) => error.code === "INVALID_QUESTION", "빈 질문은 모델 호출 없이 거부");
  assert.equal(calls, 1, "유효하지 않은 질문은 호출하지 않음");
  await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request: { ...request, productId: "not-a-catalog-product" }, modelFactory: () => ({ invoke: async () => ({ content: "실패" }) }) }), (error) => error.code === "PRODUCT_NOT_FOUND", "선택 상품은 서버 카탈로그에서 해석");
  for (const [status, code] of [[401, "OPENAI_AUTH_FAILED"], [429, "OPENAI_RATE_LIMITED"]]) await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request, modelFactory: () => ({ invoke: async () => { throw { status }; } }) }), (error) => error.code === code, `OpenAI ${status} 안전 코드`);
  await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request, modelFactory: () => ({ invoke: async () => { throw new Error("timeout"); } }) }), (error) => error.code === "OPENAI_TIMEOUT", "timeout 안전 코드");

  const [clientSource, viewSource] = await Promise.all([readFile("src/app/features/smart-shopping/product-detail/productQuestionClient.ts", "utf8"), readFile("src/app/features/smart-shopping/recommendation/RecommendationSelectionView.tsx", "utf8")]);
  assert.ok(clientSource.includes('fetch("/api/ai/product-question"') && !clientSource.includes("OPENAI_API_KEY") && !clientSource.includes("import.meta.env"), "브라우저는 같은 출처 endpoint만 호출");
  assert.ok(viewSource.includes("questionRequestInFlight") && viewSource.includes('appendText("user-text", trimmedQuestion)') && viewSource.includes('appendText("assistant-text", response.answer)'), "중복을 막고 성공 시 canonical user·assistant 턴을 각각 추가");
  assert.ok(viewSource.includes("appendActionGroup(\"detail\", showAlternative)") && viewSource.includes("setQuestionLoading(false)"), "성공·실패 후 입력과 액션 컨트롤 복원");
  console.log("openai product-question focused checks: passed");
} finally {
  await server.close();
}
