const NAVER_SHOPPING_URL = "https://openapi.naver.com/v1/search/shop.json";
const REQUEST_TIMEOUT_MS = 8_000;

export class NaverShoppingServiceError extends Error {
  constructor({ code, status, message, upstreamStatus, errorCode }) {
    super(message);
    this.name = "NaverShoppingServiceError";
    this.code = code;
    this.status = status;
    this.upstreamStatus = upstreamStatus;
    this.errorCode = errorCode;
  }
}

const text = (value) => typeof value === "string" ? value.trim() : "";
const stripHtml = (value) => text(value).replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const price = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const errorForStatus = (upstreamStatus) => {
  if (upstreamStatus === 401) return { code: "NAVER_AUTH_FAILED", status: 401, message: "네이버 쇼핑 API 인증에 실패했습니다. 서버 자격 증명을 확인해주세요." };
  if (upstreamStatus === 403) return { code: "NAVER_PERMISSION_DENIED", status: 403, message: "네이버 쇼핑 API 권한이 없습니다. 네이버 Developer Center 설정을 확인해주세요." };
  if (upstreamStatus === 429) return { code: "NAVER_RATE_LIMITED", status: 429, message: "네이버 쇼핑 API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." };
  if (upstreamStatus === 400) return { code: "NAVER_REQUEST_FAILED", status: 400, message: "네이버 쇼핑 API 요청이 거부되었습니다." };
  if (upstreamStatus >= 500) return { code: "NAVER_REQUEST_FAILED", status: 502, message: "네이버 쇼핑 API 서버에 일시적인 문제가 있습니다." };
  return { code: "NAVER_REQUEST_FAILED", status: 502, message: "네이버 쇼핑 API 요청에 실패했습니다." };
};

export const mapNaverShoppingItem = (item) => ({
  productId: text(item.productId),
  title: stripHtml(item.title) || "상품명 없음",
  link: text(item.link),
  image: text(item.image),
  lowestPrice: price(item.lprice),
  highestPrice: price(item.hprice),
  mallName: text(item.mallName) || "네이버",
  maker: text(item.maker),
  brand: text(item.brand),
  category1: text(item.category1),
  category2: text(item.category2),
  category3: text(item.category3),
  category4: text(item.category4),
  productType: text(item.productType),
});

export async function searchNaverShopping({ query, clientId, clientSecret, fetchImpl = fetch, timeoutMs = REQUEST_TIMEOUT_MS }) {
  const normalizedQuery = text(query);
  if (!normalizedQuery) throw new NaverShoppingServiceError({ code: "QUERY_REQUIRED", status: 400, message: "검색어가 필요합니다." });
  if (normalizedQuery.length > 200) throw new NaverShoppingServiceError({ code: "QUERY_TOO_LONG", status: 400, message: "검색어는 200자 이하여야 합니다." });
  if (!text(clientId) || !text(clientSecret)) throw new NaverShoppingServiceError({ code: "NAVER_CREDENTIALS_MISSING", status: 503, message: "네이버 쇼핑 API 서버 설정이 없습니다." });

  const url = new URL(NAVER_SHOPPING_URL);
  url.searchParams.set("query", normalizedQuery);
  url.searchParams.set("display", "10");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "asc");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const upstream = errorForStatus(response.status);
      throw new NaverShoppingServiceError({ ...upstream, upstreamStatus: response.status, errorCode: text(payload?.errorCode) || undefined });
    }
    if (!payload || !Array.isArray(payload.items)) throw new NaverShoppingServiceError({ code: "NAVER_REQUEST_FAILED", status: 502, message: "네이버 쇼핑 API 응답 형식이 올바르지 않습니다.", upstreamStatus: response.status });
    const seen = new Set();
    const items = payload.items.map(mapNaverShoppingItem).filter((item) => {
      if (!item.productId || seen.has(item.productId)) return false;
      seen.add(item.productId);
      return true;
    }).sort((left, right) => (left.lowestPrice ?? Number.POSITIVE_INFINITY) - (right.lowestPrice ?? Number.POSITIVE_INFINITY));
    return { query: normalizedQuery, items, source: "naver" };
  } catch (error) {
    if (error instanceof NaverShoppingServiceError) throw error;
    if (controller.signal.aborted) throw new NaverShoppingServiceError({ code: "NAVER_REQUEST_FAILED", status: 504, message: "네이버 쇼핑 API 요청 시간이 초과되었습니다." });
    throw new NaverShoppingServiceError({ code: "NAVER_REQUEST_FAILED", status: 502, message: "네이버 쇼핑 API에 연결하지 못했습니다." });
  } finally {
    clearTimeout(timeout);
  }
}
