import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const load = (path) => server.ssrLoadModule(path);
const jsonAnswer = (answer, usedSourceIds = []) => ({ content: JSON.stringify({ answer, usedSourceIds }), usage_metadata: { input_tokens: 12, output_tokens: 8, total_tokens: 20 } });

try {
  const service = await load("/server/productQuestionService.ts");
  const modes = await load("/src/app/features/smart-shopping/product-detail/questionSourceMode.ts");
  const { catalogProducts } = await load("/src/app/features/product-catalog/data/productCatalog.ts");
  const product = catalogProducts.find((item) => item.categoryId === "tv" && item.source === "real") ?? catalogProducts.find((item) => item.categoryId === "tv");
  const baseRequest = {
    productId: product.id,
    categoryId: product.categoryId,
    question: "이 제품의 현재 화면 크기는?",
    sourceMode: "product_db",
    criteria: { "tv.primaryUse": "broadcast-streaming", "tv.valuePriority": "balanced" },
    recentTurns: Array.from({ length: 6 }, (_, index) => ({ id: `turn-${index}`, role: index % 2 ? "assistant" : "user", text: `관련 대화 ${index}` })),
  };

  const previousModel = process.env.OPENAI_MODEL;
  delete process.env.OPENAI_MODEL;
  assert.equal(service.PRODUCT_QUESTION_MODEL(), modes.DEFAULT_PRODUCT_QUESTION_MODEL, "표시 정의와 서버 기본 모델이 같은 공유 상수를 사용");
  if (previousModel !== undefined) process.env.OPENAI_MODEL = previousModel;

  const context = service.buildProductQuestionContext(baseRequest);
  assert.deepEqual(Object.keys(context), ["category", "product", "purchaseCriteria", "recentTurns", "question"], "승인된 상품 DB 문맥 필드만 구성");
  assert.equal(context.recentTurns.length, 4, "최근 관련 대화는 네 턴으로 제한");
  assert.ok(!JSON.stringify(context).includes("priceHistory"), "원본 가격 이력은 전송하지 않음");

  let ragCalls = 0; let routerCalls = 0; let answerCalls = 0; let serializedMessages = ""; let modelFields;
  const productDb = await service.answerProductQuestion({
    apiKey: "test-key", request: baseRequest,
    ragRetriever: async () => { ragCalls += 1; return []; },
    autoRouter: async () => { routerCalls += 1; return { useProductDb: false, useRag: true, useModelKnowledge: true }; },
    modelFactory: (fields) => ({ invoke: async (messages) => { answerCalls += 1; modelFields = fields; serializedMessages = JSON.stringify(messages); return jsonAnswer("MOIT 상품 DB에 저장된 화면 크기입니다.", ["product_db"]); } }),
  });
  assert.equal(ragCalls, 0, "product_db 모드는 RAG를 조회하지 않음");
  assert.equal(routerCalls, 0, "수동 모드는 자동 라우터를 우회");
  assert.equal(answerCalls, 1, "수동 질문은 최종 답변 모델을 한 번 호출");
  assert.ok(serializedMessages.includes(`${product.specs.screenSizeInches}인치`) && serializedMessages.includes("useRag") && serializedMessages.includes("useModelKnowledge") && !serializedMessages.includes("HDR은 콘텐츠"), "product_db 프롬프트는 DB 사실만 허용");
  assert.deepEqual(productDb.usedSources, [{ kind: "product_db", id: "product_db", title: "MOIT 상품 DB" }]);
  assert.deepEqual(productDb.resolvedSources, ["product_db"]);
  assert.deepEqual({ model: modelFields.model, temperature: modelFields.temperature, maxTokens: modelFields.maxTokens }, { model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", temperature: 0.2, maxTokens: 400 }, "기존 답변 모델 설정 유지");

  const ragChunks = [1, 2].map((index) => ({
    text: index === 1 ? "HDR은 콘텐츠와 TV가 같은 형식을 지원해야 합니다." : "시청거리에 맞춰 화면 크기를 판단합니다.",
    metadata: { category: "televisions", topic: index === 1 ? "hdr" : "viewing-distance", title: index === 1 ? "HDR 형식과 콘텐츠 호환성" : "TV 화면 크기와 시청거리", sourceName: "노써치", sourceTitle: "TV 구매가이드", sourceUrl: "https://nosearch.com/tv/guide", sourceType: "curated-web", curatedAt: "2026-07-21", temporalStatus: "stable", limitations: ["현재 가격 판단에 사용하지 않음"], relativePath: `televisions/curated/${index}.md`, headingPath: index === 1 ? "HDR > 콘텐츠 호환" : "시청거리 > 화면 크기", chunkIndex: 0, contentHash: `${index}`, documentHash: `${index}` },
  }));
  ragCalls = 0; routerCalls = 0; serializedMessages = "";
  const ragOnly = await service.answerProductQuestion({
    apiKey: "test-key", request: { ...baseRequest, question: "HDR을 고를 때 무엇을 확인해?", sourceMode: "rag" },
    ragRetriever: async ({ appCategory }) => { ragCalls += 1; assert.equal(appCategory, "tv", "현재 제품 카테고리로만 검색"); return ragChunks; },
    autoRouter: async () => { routerCalls += 1; return { useProductDb: true, useRag: false, useModelKnowledge: true }; },
    modelFactory: () => ({ invoke: async (messages) => { serializedMessages = JSON.stringify(messages); return jsonAnswer("HDR 형식과 콘텐츠 호환을 함께 확인하세요.", ["rag:1"]); } }),
  });
  assert.equal(ragCalls, 1); assert.equal(routerCalls, 0);
  assert.ok(serializedMessages.includes("HDR은 콘텐츠") && !serializedMessages.includes('"currentPrice"') && !serializedMessages.includes('"specs"'), "rag 모드는 상품 DB 사양을 싣지 않음");
  assert.equal(ragOnly.usedSources.length, 1); assert.equal(ragOnly.usedSources[0].kind, "rag"); assert.equal(ragOnly.usedSources[0].section, "HDR > 콘텐츠 호환");

  ragCalls = 0; serializedMessages = "";
  const modelOnly = await service.answerProductQuestion({
    apiKey: "test-key", request: { ...baseRequest, question: "일반 지식으로 영상 압축을 설명해줘", sourceMode: "model" },
    ragRetriever: async () => { ragCalls += 1; return ragChunks; },
    modelFactory: () => ({ invoke: async (messages) => { serializedMessages = JSON.stringify(messages); return jsonAnswer("일반 AI 지식에 기반한 설명이며 현재 제품 사양을 확인한 것은 아닙니다.", ["model"]); } }),
  });
  assert.equal(ragCalls, 0, "model 모드는 RAG를 조회하지 않음");
  assert.ok(!serializedMessages.includes("currentPrice") && !serializedMessages.includes("HDR은 콘텐츠") && serializedMessages.includes("일반 학습 지식"), "model 모드는 DB·RAG 문맥을 싣지 않음");
  assert.equal(modelOnly.usedSources[0].title, "AI 일반 지식 — GPT-4o mini");

  const autoRoutes = [
    { route: { useProductDb: true, useRag: false, useModelKnowledge: false }, expected: ["product_db"] },
    { route: { useProductDb: false, useRag: true, useModelKnowledge: false }, expected: ["rag"] },
    { route: { useProductDb: false, useRag: false, useModelKnowledge: true }, expected: ["model"] },
    { route: { useProductDb: true, useRag: true, useModelKnowledge: false }, expected: ["product_db", "rag"] },
    { route: { useProductDb: false, useRag: true, useModelKnowledge: true }, expected: ["rag", "model"] },
    { route: { useProductDb: true, useRag: true, useModelKnowledge: true }, expected: ["product_db", "rag", "model"] },
  ];
  for (const { route, expected } of autoRoutes) {
    let calls = 0;
    const used = [...(route.useProductDb ? ["product_db"] : []), ...(route.useRag ? ["rag:1"] : []), ...(route.useModelKnowledge ? ["model"] : [])];
    const result = await service.answerProductQuestion({ apiKey: "test-key", request: { ...baseRequest, question: "가격과 기능 선택을 함께 설명해줘", sourceMode: "auto" }, autoRouter: async () => { calls += 1; return route; }, ragRetriever: async () => ragChunks, modelFactory: () => ({ invoke: async () => jsonAnswer("선택한 출처 조합으로 답했습니다.", used) }) });
    assert.equal(calls, 1, "모호한 자동 질문은 구조화 라우터를 한 번 호출");
    assert.deepEqual(result.resolvedSources, expected, `자동 조합 지원: ${expected.join("+")}`);
  }

  const onlyUsed = await service.answerProductQuestion({ apiKey: "test-key", request: { ...baseRequest, sourceMode: "rag", question: "TV 선택 기준은?" }, ragRetriever: async () => ragChunks, modelFactory: () => ({ invoke: async () => jsonAnswer("시청거리 기준만 사용했습니다.", ["rag:2", "invented", "rag:2"]) }) });
  assert.equal(onlyUsed.usedSources.length, 1, "실제로 사용했고 검증된 ID만 중복 없이 반환");
  assert.equal(onlyUsed.usedSources[0].title, "TV 화면 크기와 시청거리");

  const noRag = await service.answerProductQuestion({ apiKey: "test-key", request: { ...baseRequest, sourceMode: "rag", question: "문서에 없는 질문" }, ragRetriever: async () => [], modelFactory: () => ({ invoke: async (messages) => { assert.ok(messages.map((message) => message.content).join("\n").includes('"useModelKnowledge":false')); return jsonAnswer("큐레이션 문서에 충분한 정보가 없습니다.", []); } }) });
  assert.deepEqual(noRag.usedSources, [], "RAG 근거가 없을 때 다른 출처로 폴백하지 않음");
  const autoNoRag = await service.answerProductQuestion({ apiKey: "test-key", request: { ...baseRequest, sourceMode: "auto", question: "화질 선택 기준을 설명해줘" }, autoRouter: async () => ({ useProductDb: false, useRag: true, useModelKnowledge: false }), ragRetriever: async () => [], modelFactory: () => ({ invoke: async () => jsonAnswer("문서 근거가 없어 일반 AI 지식으로만 설명합니다.", ["model"]) }) });
  assert.deepEqual(autoNoRag.resolvedSources, ["rag", "model"], "자동 모드는 RAG가 비었을 때만 일반 지식을 명시적으로 허용");
  const missingDb = await service.answerProductQuestion({ apiKey: "test-key", request: { ...baseRequest, sourceMode: "product_db", question: "등록되지 않은 세부 포트는?" }, modelFactory: () => ({ invoke: async () => jsonAnswer("해당 세부 포트 정보는 MOIT 상품 DB에 등록되어 있지 않습니다.", ["product_db"]) }) });
  assert.deepEqual(missingDb.resolvedSources, ["product_db"], "DB 누락도 일반 지식으로 폴백하지 않음");

  assert.deepEqual(service.deterministicAutoRoute("이 제품의 현재 가격은?"), { useProductDb: true, useRag: false, useModelKnowledge: false });
  assert.deepEqual(service.deterministicAutoRoute("TV 선택 기준과 시청거리를 알려줘"), { useProductDb: false, useRag: true, useModelKnowledge: false });
  assert.deepEqual(service.deterministicAutoRoute("AI 일반 지식으로 설명해줘"), { useProductDb: false, useRag: false, useModelKnowledge: true });

  let invalidCalls = 0;
  await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request: { ...baseRequest, question: " " }, modelFactory: () => ({ invoke: async () => { invalidCalls += 1; return jsonAnswer("실패"); } }) }), (error) => error.code === "INVALID_QUESTION");
  await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request: { ...baseRequest, sourceMode: "web" }, modelFactory: () => ({ invoke: async () => jsonAnswer("실패") }) }), (error) => error.code === "INVALID_QUESTION");
  assert.equal(invalidCalls, 0, "잘못된 질문과 모드는 모델 호출 전에 거부");
  await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request: { ...baseRequest, productId: "missing" }, modelFactory: () => ({ invoke: async () => jsonAnswer("실패") }) }), (error) => error.code === "PRODUCT_NOT_FOUND");
  for (const [status, code] of [[401, "OPENAI_AUTH_FAILED"], [429, "OPENAI_RATE_LIMITED"]]) await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request: baseRequest, modelFactory: () => ({ invoke: async () => { throw { status }; } }) }), (error) => error.code === code);
  await assert.rejects(() => service.answerProductQuestion({ apiKey: "test-key", request: baseRequest, modelFactory: () => ({ invoke: async () => { throw new Error("timeout"); } }) }), (error) => error.code === "OPENAI_TIMEOUT");

  const [clientSource, viewSource, inputSource, sourceView] = await Promise.all([
    readFile("src/app/features/smart-shopping/product-detail/productQuestionClient.ts", "utf8"),
    readFile("src/app/features/smart-shopping/recommendation/RecommendationSelectionView.tsx", "utf8"),
    readFile("src/app/features/smart-shopping/product-detail/ProductQuestionInput.tsx", "utf8"),
    readFile("src/app/features/smart-shopping/product-detail/ProductQuestionSources.tsx", "utf8"),
  ]);
  assert.ok(clientSource.includes('fetch("/api/ai/product-question"') && !clientSource.includes("OPENAI_API_KEY"), "브라우저는 기존 서버 endpoint만 호출");
  assert.ok(inputSource.includes('menuOpen ? "V" : ">"') && inputSource.includes('role="menuitemradio"') && inputSource.includes('event.key !== "Escape"'), "선택기 열림 표시·접근성·Escape 닫기 구현");
  assert.match(inputSource, /onSourceModeChange\(mode\); setMenuOpen\(false\);/, "옵션 선택은 입력값을 건드리지 않고 메뉴만 닫음");
  assert.ok(viewSource.includes('useState<QuestionSourceMode>("auto")') && viewSource.includes('setQuestionSourceMode("auto")') && viewSource.includes("[category, selectedProductKey, session.sessionId, resetQuestionSourceMode]"), "기본값과 새 대화·상품·카테고리 리셋은 자동");
  assert.ok(viewSource.includes("sourceMode: submittedMode") && viewSource.includes("requestedMode: submittedMode") && viewSource.includes("questionScopeRef.current !== requestScope"), "제출 시 모드를 메시지별 캡처하고 stale 응답 차단");
  assert.ok(viewSource.includes("questionRequestInFlight.current") && sourceView.includes("답변 근거") && sourceView.includes('source.kind !== "rag"'), "중복 제출 차단과 기존 근거 영역 유지");
  console.log("product-question source-mode focused checks: passed");
} finally {
  await server.close();
}
