import type { Plugin } from "vite";

const respondJson = (response: import("node:http").ServerResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const readJson = async (request: import("node:http").IncomingMessage) => {
  let raw = "";
  for await (const chunk of request) {
    raw += String(chunk);
    if (raw.length > 50_000) throw new Error("REQUEST_TOO_LARGE");
  }
  return JSON.parse(raw || "{}");
};

// ──────────────────────────────────────────────
// 🔧 경량 XML 파서 (외부 패키지 불필요)
// ──────────────────────────────────────────────
function extractXmlTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractAllXmlTags(xml: string, tag: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m;
  while ((m = regex.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

interface SmartChoicePlan {
  planName: string;
  telecom: string;
  monthlyFee: number;
  data: string;
  voice: string;
  sms: string;
  link: string;
}

function parseSmartChoiceXml(xml: string): SmartChoicePlan[] {
  const resultCode = extractXmlTag(xml, "result_code");
  if (resultCode !== "100" && resultCode !== "000" && resultCode !== "200") return [];

  const items = extractAllXmlTags(xml, "item");
  return items.map((item) => ({
    planName: extractXmlTag(item, "v_plan_name") || extractXmlTag(item, "plan_name") || "요금제명 미제공",
    telecom: extractXmlTag(item, "v_tel") || extractXmlTag(item, "telecom") || "",
    monthlyFee: Number(extractXmlTag(item, "v_plan_price") || extractXmlTag(item, "monthly_fee") || "0"),
    data: extractXmlTag(item, "v_plan_display_data") || extractXmlTag(item, "data") || "",
    voice: extractXmlTag(item, "v_plan_display_voice") || extractXmlTag(item, "voice") || "",
    sms: extractXmlTag(item, "v_plan_display_sms") || extractXmlTag(item, "sms") || "",
    link: extractXmlTag(item, "link") || "https://www.smartchoice.or.kr",
  }));
}

interface OllamaRouteOptions {
  ollamaUrl?: string;
  ollamaModel?: string;
  internetApiKey?: string;
  smartchoiceApiKey?: string;
  smartchoiceUrl?: string;
}

/** Ollama 로컬 LLM 호출 + 스마트초이스 API 프록시 Vite 서버 middleware */
export const telecomOllamaRoute = ({
  ollamaUrl,
  ollamaModel,
  internetApiKey,
  smartchoiceApiKey,
  smartchoiceUrl,
}: OllamaRouteOptions): Plugin => ({
  name: "moit-telecom-ollama-route",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url ?? "/", "http://localhost");

      // ── 1. Ollama 생성 (기존 유지) ─────────────────────────────
      if (url.pathname === "/api/ai/ollama-generate") {
        if (request.method !== "POST") {
          return respondJson(response, 405, { code: "METHOD_NOT_ALLOWED", message: "POST 요청만 지원합니다." });
        }
        try {
          const body = await readJson(request);
          const prompt = body.prompt || "안녕하세요! 간단한 인사 한 마디 해주세요.";
          const targetUrl = ollamaUrl || "http://localhost:11434";
          const modelName = ollamaModel || "gemma3:latest";

          console.log(`[Ollama Proxy] model: ${modelName}`);

          const ollamaResponse = await fetch(`${targetUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: modelName, prompt, stream: false }),
          });

          if (!ollamaResponse.ok) {
            const errText = await ollamaResponse.text();
            return respondJson(response, ollamaResponse.status, {
              code: "OLLAMA_API_ERROR",
              message: `Ollama 서버 응답 에러: ${errText}`,
            });
          }

          const data = await ollamaResponse.json() as { response?: string };
          return respondJson(response, 200, {
            success: true,
            model: modelName,
            response: data.response || "",
            apiKeyVerified: !!internetApiKey,
          });
        } catch (error) {
          return respondJson(response, 502, {
            code: "OLLAMA_UNAVAILABLE",
            message: "로컬 Ollama 서비스에 연결할 수 없습니다. Ollama가 실행 중인지 확인해 주세요.",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // ── 2. 스마트초이스 폰 요금제 조회 ──────────────────────────
      if (url.pathname === "/api/telecom/phone-plans") {
        if (request.method !== "GET") {
          return respondJson(response, 405, { code: "METHOD_NOT_ALLOWED", message: "GET 요청만 지원합니다." });
        }

        const apiKey = smartchoiceApiKey;
        const baseUrl = smartchoiceUrl || "http://api.smartchoice.or.kr/api/openAPI.xml";

        if (!apiKey) {
          return respondJson(response, 503, {
            code: "SMARTCHOICE_NOT_CONFIGURED",
            message: "스마트초이스 API 키가 설정되지 않았습니다.",
            plans: [],
          });
        }

        try {
          const qs = new URLSearchParams({
            authkey: apiKey,
            voice: url.searchParams.get("voice") || "999999",
            data: url.searchParams.get("data") || "10240",
            sms: url.searchParams.get("sms") || "999999",
            age: url.searchParams.get("age") || "20",
            type: url.searchParams.get("type") || "6",
            dis: url.searchParams.get("dis") || "24",
          });

          console.log(`[SmartChoice Proxy] Calling: ${baseUrl}?${qs.toString().replace(apiKey, "***")}`);

          const scResponse = await fetch(`${baseUrl}?${qs}`, {
            headers: { Accept: "application/xml, text/xml, */*" },
            signal: AbortSignal.timeout(10_000),
          });

          const xmlText = await scResponse.text();
          console.log(`[SmartChoice Proxy] result_code: ${extractXmlTag(xmlText, "result_code")}, count: ${extractXmlTag(xmlText, "result_count")}`);

          const plans = parseSmartChoiceXml(xmlText);
          return respondJson(response, 200, {
            success: true,
            count: plans.length,
            plans,
            source: "smartchoice",
            resultCode: extractXmlTag(xmlText, "result_code"),
          });
        } catch (error) {
          console.error("[SmartChoice Proxy Error]", error);
          return respondJson(response, 502, {
            code: "SMARTCHOICE_UNAVAILABLE",
            message: "스마트초이스 API에 연결할 수 없습니다.",
            plans: [],
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // ── 3. Ollama 통신 AI 코멘트 생성 ───────────────────────────
      if (url.pathname === "/api/telecom/ollama-comment") {
        if (request.method !== "POST") {
          return respondJson(response, 405, { code: "METHOD_NOT_ALLOWED", message: "POST 요청만 지원합니다." });
        }
        try {
          const body = await readJson(request);
          const { prompt, category } = body as { prompt?: string; category?: string };
          if (!prompt) {
            return respondJson(response, 400, { code: "PROMPT_REQUIRED", message: "prompt가 필요합니다." });
          }
          const targetUrl = ollamaUrl || "http://localhost:11434";
          const modelName = ollamaModel || "gemma3:latest";

          console.log(`[Ollama Comment] category: ${category || "unknown"}, model: ${modelName}`);

          const ollamaResponse = await fetch(`${targetUrl}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: modelName,
              prompt,
              stream: false,
              options: { temperature: 0.7, num_predict: 200 },
            }),
            signal: AbortSignal.timeout(30_000),
          });

          if (!ollamaResponse.ok) {
            const errText = await ollamaResponse.text();
            return respondJson(response, ollamaResponse.status, {
              code: "OLLAMA_ERROR",
              message: `Ollama 응답 오류: ${errText}`,
              comment: null,
            });
          }

          const data = await ollamaResponse.json() as { response?: string };
          return respondJson(response, 200, {
            success: true,
            comment: data.response?.trim() || "",
            model: modelName,
          });
        } catch (error) {
          return respondJson(response, 502, {
            code: "OLLAMA_UNAVAILABLE",
            message: "Ollama 서비스에 연결할 수 없습니다.",
            comment: null,
          });
        }
      }

      // ── 4. API 키 확인 (기존 유지) ───────────────────────────────
      if (url.pathname === "/api/telecom/verify-key") {
        if (request.method !== "GET") {
          return respondJson(response, 405, { code: "METHOD_NOT_ALLOWED", message: "GET 요청만 지원합니다." });
        }
        return respondJson(response, 200, {
          internetApiKeyConfigured: !!internetApiKey,
          smartchoiceApiKeyConfigured: !!smartchoiceApiKey,
          smartchoiceApiKeyLength: smartchoiceApiKey ? smartchoiceApiKey.length : 0,
          ollamaUrl: ollamaUrl || "http://localhost:11434",
          ollamaModel: ollamaModel || "gemma3:latest",
        });
      }

      return next();
    });
  },
});

