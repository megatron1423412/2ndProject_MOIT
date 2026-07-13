import type { NaverShoppingProduct } from "../types/recommendation";

export class NaverShoppingClientError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
  }
}

export const fetchNaverShoppingProducts = async (query: string, signal?: AbortSignal): Promise<NaverShoppingProduct[]> => {
  const response = await fetch(`/api/shopping/search?query=${encodeURIComponent(query)}`, { signal });
  const payload = await response.json().catch(() => ({})) as { items?: NaverShoppingProduct[]; message?: string; code?: string };
  if (!response.ok) throw new NaverShoppingClientError(payload.message ?? "네이버 쇼핑 검색에 실패했습니다.", payload.code ?? "NAVER_API_ERROR", response.status);
  return [...(payload.items ?? [])].sort((a, b) => (a.lowestPrice || Number.POSITIVE_INFINITY) - (b.lowestPrice || Number.POSITIVE_INFINITY)).slice(0, 10);
};
