import React from "react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import type { NaverShoppingProduct } from "../types/recommendation";
import FavoriteToggleButton from "../../favorites/FavoriteToggleButton";

interface Props {
  items: NaverShoppingProduct[];
  status: "loading" | "success" | "error";
  errorMessage: string;
  onRetry: () => void;
  onSelect: (item: NaverShoppingProduct) => void;
  isFavorite: (item: NaverShoppingProduct) => boolean;
  onToggleFavorite: (item: NaverShoppingProduct) => void;
  isActive?: boolean;
}

export default function NaverLowestPriceList({ items, status, errorMessage, onRetry, onSelect, isFavorite, onToggleFavorite, isActive = true }: Props) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div><p className="text-xs font-black text-emerald-600">검색어 기반 후보 · NAVER</p><h3 className="mt-1 text-base font-black text-primary">낮은 가격순 TOP 10</h3><p className="mt-1 text-xs text-muted-foreground">네이버가 제공한 기본 상품·가격 정보만 표시하며 상세 조건 충족을 보장하지 않습니다.</p></div>
      {status === "loading" && <div className="mt-4 rounded-lg bg-muted/30 p-5 text-sm font-bold text-muted-foreground">네이버 쇼핑 가격을 불러오는 중이에요…</div>}
      {status === "error" && <div className="mt-4 rounded-lg border border-amber-300/50 bg-amber-50 p-4 dark:bg-amber-400/10"><p className="text-sm font-bold text-amber-800 dark:text-amber-200">{errorMessage}</p><button type="button" disabled={!isActive} onClick={onRetry} className="mt-3 rounded-lg bg-primary px-3 py-2 text-xs font-black text-primary-foreground disabled:cursor-default disabled:opacity-60">다시 시도</button></div>}
      {status === "success" && items.length === 0 && <p className="mt-4 rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">검색 결과가 없습니다. 왼쪽 내부 DB 목록을 이용해주세요.</p>}
      <div className="mt-4 space-y-2">
        {status === "success" && items.map((item, index) => (
          <div key={item.productId} className="relative">
            <button type="button" disabled={!isActive} onClick={() => onSelect(item)} className="flex w-full items-start gap-3 rounded-lg border border-border p-3 pr-12 text-left transition hover:border-accent hover:bg-muted/25 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-default disabled:opacity-75">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">{index + 1}</span>
              <ImageWithFallback src={item.imageUrl} alt="" className="h-20 w-20 flex-none rounded-lg border border-border bg-muted object-cover" />
              <div className="min-w-0 flex-1"><p className="text-xs font-bold text-muted-foreground">{item.brand || item.maker || "브랜드 정보 없음"}</p><p className="mt-1 line-clamp-2 font-black text-primary">{item.title}</p><p className="mt-2 text-xs text-muted-foreground">{item.mallName}</p><div className="mt-2 flex items-center justify-between"><span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">네이버 쇼핑</span><strong className="text-sm text-primary">{item.lowestPrice ? `${item.lowestPrice.toLocaleString("ko-KR")}원` : "가격 정보 없음"}</strong></div></div>
            </button>
            <FavoriteToggleButton isFavorite={isFavorite(item)} disabled={!isActive} onToggle={() => onToggleFavorite(item)} />
          </div>
        ))}
      </div>
    </section>
  );
}
