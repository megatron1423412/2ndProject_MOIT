import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const documentsModule = await server.ssrLoadModule("/server/rag/ragDocuments.ts");
  const indexModule = await server.ssrLoadModule("/server/rag/ragIndex.ts");
  const { documents } = await documentsModule.discoverCuratedDocuments();
  const index = await indexModule.loadPersistedRagIndex();
  const categories = [...new Set(index.documents.map((document) => document.category))].sort();
  assert.deepEqual(categories, [...documentsModule.REQUIRED_RAG_CATEGORIES].sort(), "index includes all four categories");
  assert.ok(categories.includes("air-conditioner"), "air conditioner is indexed independently of the old manifest");
  assert.equal(index.documents.length, documents.length, "every discovered curated document is indexed");
  assert.ok(index.documents.every((document) => /^[^/]+\/curated\/[^/]+\.md$/.test(document.relativePath)), "only direct curated Markdown is indexed");
  assert.ok(index.chunks.every((chunk) => chunk.metadata.headingPath && chunk.metadata.contentHash && !chunk.metadata.relativePath.includes(":")), "heading metadata and relative paths are safe");
  console.log(`rag index verification: categories=${categories.join(",")} documents=${index.documents.length} chunks=${index.chunks.length} persistence=ok`);
} finally { await server.close(); }
