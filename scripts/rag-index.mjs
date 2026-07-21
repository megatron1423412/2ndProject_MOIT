import { loadEnv, createServer } from "vite";

Object.assign(process.env, loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), ""));
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { buildPersistentRagIndex, RAG_EMBEDDING_MODEL } = await server.ssrLoadModule("/server/rag/ragIndex.ts");
  const result = await buildPersistentRagIndex({ apiKey: process.env.OPENAI_API_KEY, modelId: RAG_EMBEDDING_MODEL() });
  for (const row of result.summary) console.log(`${row.category}: documents=${row.documents} chunks=${row.chunks} reused=${row.reused} embedded=${row.embedded} removed=${row.removed}`);
} finally {
  await server.close();
}
