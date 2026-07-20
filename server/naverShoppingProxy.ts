import type { Plugin } from "vite";
import { NaverShoppingServiceError, searchNaverShopping } from "./naverShoppingService.mjs";

interface NaverShoppingProxyOptions {
  clientId?: string;
  clientSecret?: string;
}

const respondJson = (response: import("node:http").ServerResponse, status: number, body: unknown) => {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
};

const createHandler = ({ clientId, clientSecret }: NaverShoppingProxyOptions) => async (request: import("node:http").IncomingMessage, response: import("node:http").ServerResponse, next: () => void) => {
      const url = new URL(request.url ?? "/", "http://localhost");
      if (url.pathname !== "/api/naver-shopping") return next();
      if (request.method !== "GET") return respondJson(response, 405, { code: "METHOD_NOT_ALLOWED", message: "GET 요청만 지원합니다." });
      const query = url.searchParams.get("query")?.trim();
      try {
        return respondJson(response, 200, await searchNaverShopping({ query, clientId, clientSecret }));
      } catch (error) {
        if (error instanceof NaverShoppingServiceError) return respondJson(response, error.status, { code: error.code, message: error.message, upstreamStatus: error.upstreamStatus, errorCode: error.errorCode });
        return respondJson(response, 502, { code: "NAVER_REQUEST_FAILED", message: "네이버 쇼핑 API 요청을 처리하지 못했습니다." });
      }
};

/** API 자격 증명은 Vite server/preview middleware 밖으로 전달하지 않습니다. */
export const naverShoppingProxy = (options: NaverShoppingProxyOptions): Plugin => ({
  name: "moit-naver-shopping-proxy",
  configureServer(server) {
    server.middlewares.use(createHandler(options));
  },
  configurePreviewServer(server) {
    server.middlewares.use(createHandler(options));
  },
});
