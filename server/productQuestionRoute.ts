import type { Plugin } from "vite";
import { buildProductQuestionPrompt, type ProductQuestionRequest } from "../src/app/features/smart-shopping/product-detail/productQuestionContext";

const respondJson = (response: import("node:http").ServerResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const readJson = async (request: import("node:http").IncomingMessage) => {
  let raw = "";
  for await (const chunk of request) { raw += String(chunk); if (raw.length > 50_000) throw new Error("REQUEST_TOO_LARGE"); }
  return JSON.parse(raw || "{}") as ProductQuestionRequest;
};

const getOutputText = (payload: { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }) =>
  payload.output?.flatMap((item) => item.content ?? []).filter((item) => item.type === "output_text").map((item) => item.text ?? "").join("").trim() ?? "";

/** OpenAI 자격 증명과 외부 호출을 Vite 서버 middleware에 한정합니다. */
export const productQuestionRoute = ({ apiKey }: { apiKey?: string }): Plugin => ({
  name: "moit-product-question-route",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (url.pathname !== "/api/ai/product-question") return next();
      if (request.method !== "POST") return respondJson(response, 405, { code: "METHOD_NOT_ALLOWED", message: "POST 요청만 지원합니다." });
      if (!apiKey) return respondJson(response, 503, { code: "OPENAI_API_NOT_CONFIGURED", message: "AI 질문 기능이 설정되지 않았습니다. 다른 상품 비교 기능은 계속 이용할 수 있어요." });
      try {
        const body = await readJson(request);
        if (!body.question?.trim()) return respondJson(response, 400, { code: "QUESTION_REQUIRED", message: "질문을 입력해주세요." });
        const apiResponse = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "gpt-5.6",
            instructions: "제공된 상품 문맥만 근거로 간결하고 친근한 한국어로 답변하세요. 알 수 없는 스펙·설치비·할인 정보를 만들지 말고, mock 데이터는 실제 정보처럼 단정하지 마세요. 구매를 강요하지 말고 장점과 판매처 확인 사항을 설명하세요. 금융·할인 혜택은 실제 적용 여부를 판매처에 확인하라고 안내하세요.",
            input: buildProductQuestionPrompt(body),
          }),
        });
        const payload = await apiResponse.json().catch(() => ({})) as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; error?: { message?: string } };
        if (!apiResponse.ok) return respondJson(response, apiResponse.status, { code: "OPENAI_API_ERROR", message: payload.error?.message ?? "AI 답변 요청에 실패했습니다." });
        const answer = getOutputText(payload);
        return respondJson(response, 200, { answer: answer || "응답에서 텍스트 답변을 찾지 못했습니다.", optionalWarnings: ["답변은 제공된 mock·검색 문맥에 한정됩니다."] });
      } catch (error) {
        const message = error instanceof Error && error.message === "REQUEST_TOO_LARGE" ? "질문 문맥이 너무 큽니다." : "AI 답변 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
        return respondJson(response, 502, { code: "OPENAI_API_UNAVAILABLE", message });
      }
    });
  },
});
