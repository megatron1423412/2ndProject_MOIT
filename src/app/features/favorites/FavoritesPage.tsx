import React, { useMemo, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import UtilityPageShell from "../navigation/UtilityPageShell";
import PriceAlertForm from "../smart-shopping/next-actions/PriceAlertForm";
import ProductDetailView from "../smart-shopping/recommendation/ProductDetailView";
import type { ProductRecommendation } from "../product-catalog/core/types";
import type { PriceAlert, PriceAlertDraft } from "../smart-shopping/price-alerts/types";
import type { FavoriteProduct } from "./types";

interface Props {
  favorites: FavoriteProduct[];
  alerts: PriceAlert[];
  onBack: () => void;
  onDelete: (favoriteId: string) => void;
  onCreatePriceAlert: (draft: PriceAlertDraft) => void;
}

export default function FavoritesPage({ favorites, alerts, onBack, onDelete, onCreatePriceAlert }: Props) {
  const [detail, setDetail] = useState<FavoriteProduct | null>(null);
  const [alertFavorite, setAlertFavorite] = useState<FavoriteProduct | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const activeAlertIds = useMemo(() => new Set(alerts.filter((alert) => alert.active).map((alert) => alert.productId)), [alerts]);
  if (detail) return <FavoriteProductDetailPage favorite={detail} onBack={() => setDetail(null)} />;
  return <UtilityPageShell title="즐겨찾기" onBack={onBack}>{favorites.length === 0 ? <EmptyFavorites /> : <div className="space-y-3">{favorites.map((favorite) => <article key={favorite.id} className="rounded-xl border border-border bg-card p-4 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row"><ImageWithFallback src={favorite.imagePath} alt="" className="size-24 rounded-lg border border-border bg-muted object-cover" /><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><span className="rounded bg-muted px-2 py-1 text-[10px] font-black text-muted-foreground">{favorite.source === "internal" ? "MOIT 카탈로그" : "네이버 쇼핑"}</span>{activeAlertIds.has(favorite.productId) && <span className="rounded bg-brand-surface px-2 py-1 text-[10px] font-black text-brand-surface-foreground">최저가 알람 설정됨</span>}</div><p className="mt-2 text-xs font-bold text-muted-foreground">{favorite.brand}{favorite.modelNumber ? ` · ${favorite.modelNumber}` : ""}</p><h2 className="mt-1 font-black text-primary">{favorite.name}</h2><div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2"><p>현재 확인 가격: {favorite.currentPrice ? `${favorite.currentPrice.toLocaleString("ko-KR")}원` : "가격 정보 없음"}</p><p>역대 최저가: {favorite.allTimeLow ? `${favorite.allTimeLow.toLocaleString("ko-KR")}원` : "가격 이력 없음"}</p><p>등록일: {new Date(favorite.createdAt).toLocaleDateString("ko-KR")}</p></div></div></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setDetail(favorite)} className="rounded-lg border border-border px-3 py-2 text-xs font-black text-primary hover:bg-muted">상세 정보 보기</button><button type="button" onClick={() => { if (favorite.purchaseLink) window.open(favorite.purchaseLink, "_blank", "noopener,noreferrer"); else setNotice("현재 연결 가능한 구매 링크가 없어요."); }} className="rounded-lg border border-border px-3 py-2 text-xs font-black text-primary hover:bg-muted">구매 링크</button><button type="button" onClick={() => setAlertFavorite(favorite)} className="rounded-lg border border-border px-3 py-2 text-xs font-black text-primary hover:bg-muted">최저가 알람 가격 설정</button><button type="button" onClick={() => setPendingDelete(favorite.id)} className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-3 py-2 text-xs font-black text-destructive hover:bg-destructive/10"><Trash2 size={14} />즐겨찾기 삭제</button></div>{pendingDelete === favorite.id && <div className="mt-3 rounded-lg bg-muted/35 p-3 text-xs"><p className="font-bold text-primary">이 상품만 즐겨찾기에서 삭제할까요?</p><div className="mt-2 flex gap-2"><button type="button" onClick={() => { onDelete(favorite.id); setPendingDelete(null); }} className="rounded bg-destructive px-2 py-1.5 font-black text-destructive-foreground">삭제</button><button type="button" onClick={() => setAlertFavorite(null)} className="rounded border border-border px-2 py-1.5 font-black text-primary">취소</button></div></div>}</article>)}</div>}{notice && <p role="status" className="mt-4 text-sm font-bold text-muted-foreground">{notice}</p>}{alertFavorite && <div className="mt-5"><PriceAlertForm inputId={`favorite-target-${alertFavorite.id}`} productName={alertFavorite.name} currentPrice={alertFavorite.currentPrice} allTimeLow={alertFavorite.allTimeLow} onCancel={() => setAlertFavorite(null)} onSubmit={(targetPrice) => { onCreatePriceAlert({ userId: alertFavorite.userId, productId: alertFavorite.productId, productName: alertFavorite.name, modelNumber: alertFavorite.modelNumber, source: alertFavorite.source, purchaseLink: alertFavorite.purchaseLink, currentPrice: alertFavorite.currentPrice, targetPrice, active: true }); setAlertFavorite(null); }} /></div>}</UtilityPageShell>;
}

function FavoriteProductDetailPage({ favorite, onBack }: { favorite: FavoriteProduct; onBack: () => void }) {
  if (!favorite.selectedProduct) return <UtilityPageShell title="즐겨찾기 상품 상세" onBack={onBack}><div className="rounded-xl border border-border bg-card p-5"><p className="text-xs font-black text-accent">저장된 즐겨찾기 정보</p><h2 className="mt-2 text-lg font-black text-primary">{favorite.name}</h2><p className="mt-2 text-sm text-muted-foreground">모잇 DB 검증 상세 정보가 저장되어 있지 않습니다.</p></div></UtilityPageShell>;
  const recommendation: ProductRecommendation | undefined = favorite.selectedProduct.source === "internal" ? favorite.selectedProduct.recommendation : undefined;
  return <UtilityPageShell title="즐겨찾기 상품 상세" onBack={onBack}><ProductDetailView selected={favorite.selectedProduct} internalRecommendations={recommendation ? [recommendation] : []} interactive={false} /></UtilityPageShell>;
}

function EmptyFavorites() { return <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center"><Heart className="mx-auto size-7 text-muted-foreground" /><h2 className="mt-3 text-base font-black text-primary">아직 즐겨찾기한 상품이 없어요.</h2><p className="mt-2 text-sm text-muted-foreground">관심 있는 상품을 저장하면 가격과 상세 정보를 이곳에서 다시 확인할 수 있어요.</p></div>; }
