import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const temporaryRoot = await mkdtemp(path.resolve(".rag-test-"));
const ragRoot = path.join(temporaryRoot, "RAG");
const indexPath = path.join(temporaryRoot, "index.json");
const manifestPath = path.join(temporaryRoot, "manifest.json");
const categories = ["air-conditioner", "televisions", "refrigerators", "vacuum-cleaners"];
const sourceTitles = { "air-conditioner": "에어컨 가이드", televisions: "TV 가이드", refrigerators: "냉장고 가이드", "vacuum-cleaners": "청소기 가이드" };
const markdown = (category, topic, suffix = "") => `---
title: ${sourceTitles[category]} ${topic}
category: ${category}
topic: ${topic}
source_name: 노써치
source_title: ${sourceTitles[category]}
source_url: https://nosearch.com/${category}/${topic}
source_type: curated-web
curated_at: 2026-07-21
temporal_status: ${topic.includes("dated") ? "dated" : "stable"}
limitations:
  - 현재 가격 판단에 사용하지 않음
---

# 선택 기준

${category}의 ${topic} 구매 조건과 예외를 설명합니다. ${suffix}

## 비교

장점과 단점을 함께 확인합니다.
`;
let embeddedTexts = [];
let queryCalls = 0;
const vector = (text) => {
  const result = Array(8).fill(0);
  for (let index = 0; index < text.length; index += 1) result[index % result.length] += text.charCodeAt(index) % 97;
  return result;
};
const fakeEmbeddings = { embedDocuments: async (texts) => { embeddedTexts.push(...texts); return texts.map(vector); }, embedQuery: async (text) => { queryCalls += 1; return vector(text); } };

try {
  const docs = await server.ssrLoadModule("/server/rag/ragDocuments.ts");
  const indexModule = await server.ssrLoadModule("/server/rag/ragIndex.ts");
  const retrieval = await server.ssrLoadModule("/server/rag/ragRetrieval.ts");
  const service = await server.ssrLoadModule("/server/productQuestionService.ts");
  for (const category of categories) {
    const curated = path.join(ragRoot, category, "curated");
    await mkdir(curated, { recursive: true });
    await writeFile(path.join(curated, "main.md"), markdown(category, "main"), "utf8");
    await writeFile(path.join(ragRoot, category, "README.md"), "ignored", "utf8");
  }
  await writeFile(path.join(ragRoot, "air-conditioner", "curated", "extra.md"), markdown("air-conditioner", "extra"), "utf8");
  await writeFile(path.join(ragRoot, "CURATION_MANIFEST.json"), JSON.stringify({ categories: { televisions: [] } }), "utf8");

  const discovered = await docs.discoverCuratedDocuments(ragRoot);
  assert.deepEqual(Object.keys(discovered.folders).sort(), categories.sort(), "filesystem discovery includes all four categories");
  assert.equal(discovered.documents.length, 5, "stale manifest and non-curated files do not control discovery");
  const chunksA = await docs.chunkRagDocuments(discovered.documents);
  const chunksB = await docs.chunkRagDocuments(discovered.documents);
  assert.deepEqual(chunksA, chunksB, "heading-aware chunking is deterministic");
  assert.ok(chunksA.every((chunk) => chunk.metadata.headingPath && chunk.metadata.contentHash), "heading metadata is preserved");

  const invalidPath = path.join(ragRoot, "televisions", "curated", "invalid.md");
  await writeFile(invalidPath, "# invalid", "utf8");
  await assert.rejects(() => docs.discoverCuratedDocuments(ragRoot), /frontmatter/, "invalid frontmatter is reported");
  await unlink(invalidPath);

  embeddedTexts = [];
  const first = await indexModule.buildPersistentRagIndex({ embeddings: fakeEmbeddings, ragRoot, indexPath, manifestPath, modelId: "fake-model" });
  assert.equal(first.summary.reduce((sum, row) => sum + row.embedded, 0), first.index.chunks.length, "first build embeds every chunk");
  embeddedTexts = [];
  const second = await indexModule.buildPersistentRagIndex({ embeddings: fakeEmbeddings, ragRoot, indexPath, manifestPath, modelId: "fake-model" });
  assert.equal(embeddedTexts.length, 0, "unchanged chunks reuse persisted embeddings");
  assert.equal(second.summary.reduce((sum, row) => sum + row.reused, 0), second.index.chunks.length, "reuse count is complete");

  const changedPath = path.join(ragRoot, "televisions", "curated", "main.md");
  await writeFile(changedPath, markdown("televisions", "main", "HDR 콘텐츠 호환 조건을 추가합니다."), "utf8");
  embeddedTexts = [];
  const changed = await indexModule.buildPersistentRagIndex({ embeddings: fakeEmbeddings, ragRoot, indexPath, manifestPath, modelId: "fake-model" });
  assert.ok(embeddedTexts.length > 0 && embeddedTexts.length < changed.index.chunks.length, "only affected chunks re-embed after a document change");

  await unlink(path.join(ragRoot, "air-conditioner", "curated", "extra.md"));
  const deleted = await indexModule.buildPersistentRagIndex({ embeddings: fakeEmbeddings, ragRoot, indexPath, manifestPath, modelId: "fake-model" });
  assert.ok(deleted.removed > 0 && deleted.index.documents.length === 4, "deleted documents are removed from the index");

  const beforeFailure = await readFile(indexPath, "utf8");
  await writeFile(changedPath, markdown("televisions", "main", "실패 경로에서 새 내용"), "utf8");
  await assert.rejects(() => indexModule.buildPersistentRagIndex({ embeddings: { ...fakeEmbeddings, embedDocuments: async () => { throw new Error("embedding failed"); } }, ragRoot, indexPath, manifestPath, modelId: "fake-model" }), /embedding failed/);
  assert.equal(await readFile(indexPath, "utf8"), beforeFailure, "failed indexing preserves the last valid index");

  const isolatedIndex = {
    schemaVersion: 1, generatedAt: new Date(0).toISOString(), embeddingModel: "fake", dimensions: 2, documents: [],
    chunks: categories.map((category, index) => ({ text: `${category} body`, embedding: index === 0 ? [1, 0] : [0, 1], metadata: { category, topic: "topic", title: `${category} title`, sourceName: "노써치", sourceTitle: "guide", sourceUrl: "https://nosearch.com/guide", sourceType: "curated-web", curatedAt: "2026-07-21", temporalStatus: "stable", limitations: ["limit"], relativePath: `${category}/curated/main.md`, headingPath: "선택 기준", chunkIndex: 0, contentHash: `${index}`, documentHash: `${index}` } })),
  };
  const isolated = retrieval.searchRagIndex({ index: isolatedIndex, category: "air-conditioner", query: "무관", queryEmbedding: [1, 0], threshold: 0.5 });
  assert.ok(isolated.length === 1 && isolated[0].metadata.category === "air-conditioner", "category filtering prevents cross-category retrieval");
  assert.deepEqual(retrieval.searchRagIndex({ index: isolatedIndex, category: "air-conditioner", query: "무관", queryEmbedding: [0, 1], threshold: 0.5 }), [], "irrelevant results are omitted");
  queryCalls = 0;
  await retrieval.retrieveRagChunks({ apiKey: "test", appCategory: "air-conditioner", question: "면적", embeddings: { ...fakeEmbeddings, embedQuery: async () => { queryCalls += 1; return [1, 0]; } }, index: isolatedIndex });
  assert.equal(queryCalls, 1, "one question creates exactly one query embedding");

  const { catalogProducts } = await server.ssrLoadModule("/src/app/features/product-catalog/data/productCatalog.ts");
  const product = catalogProducts.find((item) => item.categoryId === "tv");
  let modelCalls = 0; let serializedMessages = "";
  const duplicateChunk = { text: "이 자료는 선택 모델이 100인치라고 주장하지만 일반 가이드일 뿐입니다.", metadata: { ...isolatedIndex.chunks[1].metadata, category: "televisions", temporalStatus: "dated", relativePath: "televisions/curated/main.md", title: "TV 시청거리", headingPath: "크기 > 거리" } };
  const answer = await service.answerProductQuestion({
    apiKey: "test", request: { productId: product.id, categoryId: product.categoryId, question: "이 제품의 화면 크기와 시청거리 기준은?", sourceMode: "auto" },
    autoRouter: async () => ({ useProductDb: true, useRag: true, useModelKnowledge: false }),
    ragRetriever: async () => [duplicateChunk, duplicateChunk],
    modelFactory: () => ({ invoke: async (messages) => { modelCalls += 1; serializedMessages = JSON.stringify(messages); return { content: JSON.stringify({ answer: `${product.specs.screenSizeInches}인치로 저장되어 있습니다.`, usedSourceIds: ["product_db", "rag:1"] }) }; } }),
  });
  assert.equal(modelCalls, 1, "one question creates exactly one answer-generation call");
  assert.ok(serializedMessages.includes(`${product.specs.screenSizeInches}인치`), "MOIT DB value reaches the prompt");
  assert.ok(serializedMessages.includes("temporalStatus") && serializedMessages.includes("dated"), "dated metadata reaches the prompt");
  assert.ok(!serializedMessages.includes("televisions/curated/main.md"), "local relative paths do not reach the prompt");
  assert.equal(answer.sources.length, 1, "used sources are document-deduplicated");
  assert.deepEqual(answer.grounding, { usedProductDatabase: true, usedRag: true, usedModelKnowledge: false });
  assert.ok(!("relativePath" in answer.sources[0]) && !("similarity" in answer.sources[0]), "paths and similarity scores never reach the client contract");

  const clientSource = await readFile("src/app/features/smart-shopping/product-detail/ProductQuestionSources.tsx", "utf8");
  const controllerSource = await readFile("src/app/features/smart-shopping/recommendation/RecommendationSelectionView.tsx", "utf8");
  assert.ok(clientSource.includes("답변 근거") && clientSource.includes("if (!deduplicated.length) return null"), "frontend shows sources only when present");
  assert.ok(controllerSource.includes("questionRequestInFlight.current") && controllerSource.includes("usedSources: response.usedSources"), "duplicate submission blocking and used-source metadata are preserved");
  console.log("rag deterministic checks: passed");
} finally {
  await server.close();
  await rm(temporaryRoot, { recursive: true, force: true });
}
