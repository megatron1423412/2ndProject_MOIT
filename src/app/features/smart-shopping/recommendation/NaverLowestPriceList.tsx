import React from "react";
import ProductImage from "../../../components/product-catalog/ProductImage";
import type { CatalogProduct } from "../../product-catalog/core/types";
import FavoriteToggleButton from "../../favorites/FavoriteToggleButton";

interface Props {
  items: CatalogProduct[];
  onSelect: (item: CatalogProduct) => void;
  isFavorite: (item: CatalogProduct) => boolean;
  onToggleFavorite: (item: CatalogProduct) => void;
  isActive?: boolean;
}

export default function NaverLowestPriceList({ items, onSelect, isFavorite, onToggleFavorite, isActive = true }: Props) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div><p className="text-xs font-black text-emerald-600">NAVER 검색어 기반 DUMMY 상품 리스트</p><h3 className="mt-1 text-base font-black text-primary">인기 상품순 TOP 5</h3><p className="mt-1 text-xs text-muted-foreground">내부 데이터를 활용한 더미 인기 상품 목록이며, 실제 네이버 쇼핑 인기 순위가 아닙니다.</p></div>
      {items.length === 0 && <p className="mt-4 rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">왼쪽 추천 결과와 겹치지 않는 내부 상품이 없습니다.</p>}
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="relative">
            <button type="button" disabled={!isActive} onClick={() => onSelect(item)} className="flex w-full items-start gap-3 rounded-lg border border-border p-3 pr-12 text-left transition hover:border-accent hover:bg-muted/25 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-default disabled:opacity-75">
              <ProductImage productId={item.id} imagePath={item.imagePath} alt={`${item.brand} ${item.name} 상품 이미지`} className="h-20 w-20 flex-none rounded-lg border border-border bg-muted object-cover" />
              <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-muted-foreground">{item.brand} · {item.modelNumber}</p><p className="mt-1 line-clamp-2 font-black text-primary">{item.name}</p><div className="mt-2 flex items-center justify-between"><span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">MOIT 내부 DB · DUMMY</span><strong className="text-sm text-primary">{item.currentPrice.toLocaleString("ko-KR")}원</strong></div></div>
            </button>
            <FavoriteToggleButton isFavorite={isFavorite(item)} disabled={!isActive} onToggle={() => onToggleFavorite(item)} />
          </div>
        ))}
      </div>
    </section>
  );
}
