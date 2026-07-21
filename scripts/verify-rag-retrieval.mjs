import assert from "node:assert/strict";
import { createServer, loadEnv } from "vite";

Object.assign(process.env, loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), ""));
assert.ok(process.env.OPENAI_API_KEY?.trim(), "OPENAI_API_KEY is required for live retrieval verification");
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const retrieval = await server.ssrLoadModule("/server/rag/ragRetrieval.ts");
  const cases = [
    ["air-conditioner", "거실 면적에 맞는 에어컨 냉방능력은 어떻게 계산하나요?"],
    ["tv", "시청 거리와 HDR 형식은 TV 선택에 어떤 영향을 주나요?"],
    ["refrigerator", "4도어와 양문형 차이와 아이스메이커 선택 기준은 무엇인가요?"],
    ["vacuum", "AW 흡입력과 중간 단계 배터리 시간은 어떻게 비교하나요?"],
  ];
  for (const [appCategory, question] of cases) {
    const started = Date.now();
    const chunks = await retrieval.retrieveRagChunks({ apiKey: process.env.OPENAI_API_KEY, appCategory, question });
    assert.ok(chunks.length > 0 && chunks.length <= 5, `${appCategory}: relevant chunks returned`);
    const expected = { "air-conditioner": "air-conditioner", tv: "televisions", refrigerator: "refrigerators", vacuum: "vacuum-cleaners" }[appCategory];
    assert.ok(chunks.every((chunk) => chunk.metadata.category === expected), `${appCategory}: category isolated`);
    console.log(`${appCategory}: status=relevant latencyMs=${Date.now() - started} top=${chunks.map((chunk) => `${chunk.metadata.title} [${chunk.metadata.headingPath}]`).join(" | ")}`);
  }
} finally { await server.close(); }
