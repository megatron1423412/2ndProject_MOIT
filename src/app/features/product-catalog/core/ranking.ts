import type { ProductRecommendation } from "./types";

export const dataCompleteness = (value: unknown): number => {
  if (!value || typeof value !== "object") return 0;
  const entries = Object.values(value as Record<string, unknown>);
  return entries.length === 0 ? 0 : Math.round((entries.filter((item) => item !== undefined && item !== null).length / entries.length) * 100);
};

/** 동점은 조건 충족 수, 현재가, 데이터 완성도 순으로 결정합니다. */
export const sortRecommendations = (items: ProductRecommendation[]) =>
  [...items].sort((a, b) =>
    b.score - a.score ||
    b.preferenceMatchCount - a.preferenceMatchCount ||
    a.product.currentPrice - b.product.currentPrice ||
    b.dataCompleteness - a.dataCompleteness,
  );
