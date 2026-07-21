import type { Plugin } from "vite";
import { answerProductQuestion, ProductQuestionServiceError, toProductQuestionResult, type ProductQuestionRequest } from "./productQuestionService";

const respondJson = (response: import("node:http").ServerResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const readJson = async (request: import("node:http").IncomingMessage) => {
  let raw = "";
  for await (const chunk of request) { raw += String(chunk); if (raw.length > 20_000) throw new ProductQuestionServiceError("INVALID_QUESTION", 400); }
  try { return JSON.parse(raw || "{}") as ProductQuestionRequest; } catch { throw new ProductQuestionServiceError("INVALID_QUESTION", 400); }
};

const createHandler = ({ apiKey }: { apiKey?: string }) => async (request: import("node:http").IncomingMessage, response: import("node:http").ServerResponse, next: () => void) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/ai/product-question") return next();
  if (request.method !== "POST") return respondJson(response, 405, { ok: false, code: "INVALID_QUESTION" });
  const startedAt = Date.now();
  if (!apiKey?.trim()) {
    const result = { ok: false, code: "OPENAI_CONFIG_MISSING" as const };
    console.info(JSON.stringify({ feature: "product-question", model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", status: result.code, latencyMs: Date.now() - startedAt }));
    return respondJson(response, 503, result);
  }
  try {
    const result = await answerProductQuestion({ apiKey, request: await readJson(request) });
    console.info(JSON.stringify({ feature: "product-question", model: result.model, status: "success", latencyMs: result.latencyMs, inputTokens: result.usage.inputTokens, outputTokens: result.usage.outputTokens, totalTokens: result.usage.totalTokens }));
    return respondJson(response, 200, { ok: true, answer: result.answer, requestedMode: result.requestedMode, resolvedSources: result.resolvedSources, usedSources: result.usedSources, sources: result.sources, grounding: result.grounding });
  } catch (error) {
    const result = toProductQuestionResult(error);
    console.info(JSON.stringify({ feature: "product-question", model: process.env.OPENAI_MODEL ?? "gpt-4o-mini", status: result.code, latencyMs: Date.now() - startedAt }));
    if (result.code === "RAG_INDEX_MISSING") console.error("RAG index is missing or incompatible. Run: npm run rag:index");
    return respondJson(response, error instanceof ProductQuestionServiceError ? error.status : 502, result);
  }
};

/** OpenAI credentials and LangChain run only inside Vite's server/preview middleware. */
export const productQuestionRoute = (options: { apiKey?: string; embeddingModel?: string }): Plugin => {
  if (!process.env.OPENAI_EMBEDDING_MODEL && options.embeddingModel?.trim()) process.env.OPENAI_EMBEDDING_MODEL = options.embeddingModel.trim();
  return ({
  name: "moit-product-question-route",
  configureServer(server) { server.middlewares.use(createHandler(options)); },
  configurePreviewServer(server) { server.middlewares.use(createHandler(options)); },
  });
};
