import type { NaverShoppingProduct } from "../types/recommendation";

interface NaverShoppingServerItem {
  productId?: string;
  title?: string;
  link?: string;
  image?: string;
  lowestPrice?: number | null;
  highestPrice?: number | null;
  mallName?: string;
  maker?: string;
  brand?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
  productType?: string;
}

export class NaverShoppingClientError extends Error {
  constructor(message: string, readonly code: string, readonly status: number, readonly upstreamStatus?: number, readonly errorCode?: string) {
    super(message);
  }
}

const asProduct = (item: NaverShoppingServerItem): NaverShoppingProduct => ({
  productId: item.productId?.trim() ?? "",
  title: item.title?.trim() || "상품명 없음",
  imageUrl: item.image?.trim() ?? "",
  productUrl: item.link?.trim() ?? "",
  lowestPrice: Number.isFinite(item.lowestPrice) && (item.lowestPrice ?? 0) > 0 ? item.lowestPrice! : 0,
  highestPrice: Number.isFinite(item.highestPrice) && (item.highestPrice ?? 0) > 0 ? item.highestPrice! : 0,
  mallName: item.mallName?.trim() || "네이버",
  maker: item.maker?.trim() ?? "",
  brand: item.brand?.trim() ?? "",
  category: [item.category1, item.category2, item.category3, item.category4].filter((value): value is string => Boolean(value)),
  productType: item.productType?.trim() || undefined,
  source: "naver",
});

export const fetchNaverShoppingProducts = async (query: string, signal?: AbortSignal): Promise<NaverShoppingProduct[]> => {
  const response = await fetch(`/api/naver-shopping?query=${encodeURIComponent(query)}`, { signal });
  const payload = await response.json().catch(() => ({})) as { items?: NaverShoppingServerItem[]; message?: string; code?: string; upstreamStatus?: number; errorCode?: string };
  if (!response.ok) throw new NaverShoppingClientError(payload.message ?? "네이버 쇼핑 검색에 실패했습니다.", payload.code ?? "NAVER_REQUEST_FAILED", response.status, payload.upstreamStatus, payload.errorCode);
  if (!Array.isArray(payload.items)) throw new NaverShoppingClientError("네이버 쇼핑 검색 응답을 확인하지 못했습니다.", "NAVER_REQUEST_FAILED", 502);
  return payload.items.map(asProduct).filter((item) => Boolean(item.productId)).sort((a, b) => (a.lowestPrice || Number.POSITIVE_INFINITY) - (b.lowestPrice || Number.POSITIVE_INFINITY)).slice(0, 10);
};
