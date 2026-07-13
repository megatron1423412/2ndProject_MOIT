import type { NaverShoppingProduct } from "../types/recommendation";

export interface NaverShoppingApiItem {
  productId?: string | number;
  title?: string;
  link?: string;
  image?: string;
  lprice?: string | number;
  hprice?: string | number;
  mallName?: string;
  brand?: string;
  maker?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
}

export const stripHtml = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
const numericPrice = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

export const normalizeNaverShoppingItems = (items: NaverShoppingApiItem[]): NaverShoppingProduct[] => {
  const seen = new Set<string>();
  return items.flatMap((item) => {
    const productId = String(item.productId ?? "").trim();
    if (!productId || seen.has(productId)) return [];
    seen.add(productId);
    return [{
      productId,
      title: stripHtml(item.title ?? "상품명 없음"),
      imageUrl: item.image ?? "",
      productUrl: item.link ?? "",
      lowestPrice: numericPrice(item.lprice),
      highestPrice: numericPrice(item.hprice),
      mallName: item.mallName?.trim() || "네이버",
      brand: item.brand?.trim() ?? "",
      maker: item.maker?.trim() ?? "",
      category: [item.category1, item.category2, item.category3, item.category4].filter((value): value is string => Boolean(value)),
      source: "naver" as const,
    }];
  }).sort((a, b) => (a.lowestPrice || Number.POSITIVE_INFINITY) - (b.lowestPrice || Number.POSITIVE_INFINITY)).slice(0, 10);
};
