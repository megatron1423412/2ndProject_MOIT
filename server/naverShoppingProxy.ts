import type { Plugin } from "vite";
import { normalizeNaverShoppingItems, type NaverShoppingApiItem } from "../src/app/features/smart-shopping/naver/NaverShoppingAdapter";

interface NaverShoppingProxyOptions {
  clientId?: string;
  clientSecret?: string;
}

const respondJson = (response: import("node:http").ServerResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

/** API 자격 증명은 이 Vite 서버 middleware 밖으로 전달하지 않습니다. */
export const naverShoppingProxy = ({ clientId, clientSecret }: NaverShoppingProxyOptions): Plugin => ({
  name: "moit-naver-shopping-proxy",
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (url.pathname !== "/api/shopping/search") return next();
      if (request.method !== "GET") return respondJson(response, 405, { code: "METHOD_NOT_ALLOWED", message: "GET 요청만 지원합니다." });
      if (!clientId || !clientSecret) return respondJson(response, 503, { code: "NAVER_API_NOT_CONFIGURED", message: "네이버 쇼핑 API가 설정되지 않았습니다. 왼쪽 모잇 DB 목록은 계속 이용할 수 있어요." });

      const query = url.searchParams.get("query")?.trim();
      if (!query) return respondJson(response, 400, { code: "QUERY_REQUIRED", message: "검색어가 필요합니다." });

      try {
        const apiUrl = new URL("https://openapi.naver.com/v1/search/shop.json");
        apiUrl.searchParams.set("query", query);
        apiUrl.searchParams.set("display", "10");
        apiUrl.searchParams.set("start", "1");
        apiUrl.searchParams.set("sort", "asc");
        apiUrl.searchParams.set("exclude", "used:rental:cbshop");
        const apiResponse = await fetch(apiUrl, { headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret } });
        const payload = await apiResponse.json().catch(() => ({})) as { items?: NaverShoppingApiItem[]; errorCode?: string; errorMessage?: string };
        if (!apiResponse.ok) return respondJson(response, apiResponse.status, { code: payload.errorCode ?? "NAVER_API_ERROR", message: payload.errorMessage ?? "네이버 쇼핑 API 요청에 실패했습니다." });
        return respondJson(response, 200, { items: normalizeNaverShoppingItems(payload.items ?? []), query, source: "naver" });
      } catch {
        return respondJson(response, 502, { code: "NAVER_API_UNAVAILABLE", message: "네이버 쇼핑 API에 연결할 수 없습니다. 잠시 후 다시 시도해주세요." });
      }
    });
  },
});
