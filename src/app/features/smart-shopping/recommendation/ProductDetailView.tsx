import React from "react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import CriteriaMatchList from "../../../components/features/chat/CriteriaMatchList";
import PriceTrendMiniChart from "../../../components/features/chat/PriceTrendMiniChart";
import ProductRecommendationCard from "../../../components/features/chat/ProductRecommendationCard";
import type { ChatFlowMessage } from "../../chat-flow/core/types";
import { summarizePriceHistory } from "../../product-catalog/core/priceHistory";
import type { ProductRecommendation } from "../../product-catalog/core/types";
import type { ProductDetailActionId } from "../actions/productDetailActions";
import ProductDetailActionBar from "../product-detail/ProductDetailActionBar";
import ProductDetailConversation from "../product-detail/ProductDetailConversation";
import ProductQuestionInput from "../product-detail/ProductQuestionInput";
import type { SelectedShoppingProduct } from "../types/recommendation";
import { combineProductDetail } from "./combineProductDetail";
import FavoriteToggleButton from "../../favorites/FavoriteToggleButton";

interface Props {
  selected: SelectedShoppingProduct;
  internalRecommendations: ProductRecommendation[];
  messages?: ChatFlowMessage[];
  showAlternative?: boolean;
  questionOpen?: boolean;
  questionLoading?: boolean;
  questionError?: string;
  onAction?: (action: ProductDetailActionId) => void;
  onQuestionSubmit?: (question: string) => void;
  onQuestionRetry?: (question: string) => void;
  onQuestionCancel?: () => void;
  onBack?: () => void;
  onNext?: () => void;
  /** Timeline history reuses the card without mounting a second interactive action area. */
  interactive?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function ProductDetailView(props: Props) {
  const { selected, internalRecommendations } = props;
  const interactive = props.interactive ?? true;
  const content = selected.source === "internal"
    ? <ProductRecommendationCard recommendation={selected.recommendation} isFavorite={props.isFavorite} onToggleFavorite={props.onToggleFavorite} />
    : <NaverProductDetail selected={selected} internalRecommendations={internalRecommendations} isFavorite={props.isFavorite ?? false} onToggleFavorite={props.onToggleFavorite} />;
  return (
    <div className="space-y-4" data-stage="viewing-product-detail">
      {content}
      {interactive && <><ProductDetailConversation messages={props.messages ?? []} /><div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <ProductDetailActionBar showAlternative={props.showAlternative ?? false} isQuestionLoading={props.questionLoading ?? false} onAction={props.onAction ?? (() => {})} onBack={props.onBack ?? (() => {})} onNext={props.onNext ?? (() => {})} />
        {props.questionOpen && <div className="mt-3"><ProductQuestionInput isLoading={props.questionLoading ?? false} errorMessage={props.questionError ?? ""} onSubmit={props.onQuestionSubmit ?? (() => {})} onRetry={props.onQuestionRetry ?? (() => {})} onCancel={props.onQuestionCancel ?? (() => {})} /></div>}
      </div></>}
    </div>
  );
}

function NaverProductDetail({ selected, internalRecommendations, isFavorite, onToggleFavorite }: { selected: Extract<SelectedShoppingProduct, { source: "naver" }>; internalRecommendations: ProductRecommendation[]; isFavorite: boolean; onToggleFavorite?: () => void }) {
  const { product: naver, matchedInternalProduct: internal } = selected;
  const combined = combineProductDetail(selected);
  const recommendation = internalRecommendations.find((item) => item.product.id === internal?.id);
  const price = internal ? summarizePriceHistory(naver.lowestPrice, internal.priceHistory) : null;
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row"><ImageWithFallback src={naver.imageUrl} alt={`${naver.title} 네이버 쇼핑 이미지`} className="h-40 w-40 flex-none rounded-lg border border-border bg-muted object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-2"><span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">네이버 쇼핑</span>{internal && <span className="rounded bg-brand-surface px-2 py-1 text-[10px] font-black text-brand-surface-foreground">모잇 DB 모델 매칭</span>}</div>{onToggleFavorite && <FavoriteToggleButton isFavorite={isFavorite} onToggle={onToggleFavorite} positionClassName="relative right-auto top-auto" />}</div><p className="mt-3 text-xs font-bold text-muted-foreground">{naver.brand || naver.maker || "브랜드 정보 없음"}{internal ? ` · ${internal.modelNumber}` : ""}</p><h3 className="mt-1 text-lg font-black text-primary">{naver.title}</h3><p className="mt-2 text-xs text-muted-foreground">{internal?.shortInfo ?? "모잇 DB 검증 정보 없음"}</p>{recommendation && <p className="mt-2 text-sm font-black text-accent">조건 적합도 {recommendation.score}점</p>}</div></div>
      <div className="mt-4"><CriteriaMatchList matched={recommendation?.matchedCoreCriteria ?? (internal ? ["모델번호 기준 내부 DB 매칭"] : [])} unmatched={recommendation?.unmatchedOrUnknownCriteria ?? [internal ? "현재 조건 추천 후보 여부 확인 필요" : "모잇 DB 검증 정보 없음"]} /></div>
      <div className="mt-3 rounded-lg bg-muted/30 p-3"><p className="text-[11px] font-black text-primary">리뷰 정보</p><p className="mt-1 text-xs text-muted-foreground">{combined.reviewSummary ?? "리뷰 데이터 미연동"}</p></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><InfoList title="장점" items={internal?.strengths ?? ["모잇 DB 검증 정보 없음"]} /><InfoList title="주의점" items={internal?.weaknesses ?? ["상세 스펙과 구매 조건을 네이버 상품 페이지에서 확인해주세요."]} /></div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="현재가" value={combined.currentPrice ? `${combined.currentPrice.toLocaleString("ko-KR")}원` : "가격 정보 없음"} sub={combined.currentPriceLabel} /><Metric label="역대 최저가" value={price ? `${price.allTimeLow.toLocaleString("ko-KR")}원` : "가격 이력 없음"} sub={price ? "모잇 내부 MOCK 이력" : undefined} /><Metric label="평균가" value={price ? `${price.averagePrice.toLocaleString("ko-KR")}원` : "가격 이력 없음"} sub={price ? "모잇 내부 MOCK 이력" : undefined} /><Metric label="최저가 대비" value={price && combined.currentPrice ? `${price.differenceFromLow >= 0 ? "+" : ""}${price.differenceFromLow.toLocaleString("ko-KR")}원 (${price.percentAboveLow}%)` : "계산 불가"} /></div>
      <div className="mt-3">{internal ? <><PriceTrendMiniChart history={internal.priceHistory} /><p className="mt-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">그래프는 모잇 내부 더미 가격 이력입니다.</p></> : <p className="rounded-lg bg-muted/30 p-4 text-xs text-muted-foreground">가격 이력 없음</p>}</div>
      {naver.productUrl && <a href={naver.productUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg border border-border px-3 py-2 text-xs font-black text-primary hover:bg-muted">네이버 상품 페이지 확인</a>}
    </article>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) { return <div className="rounded-lg border border-border p-3"><p className="text-[11px] font-black text-primary">{title}</p>{items.map((item) => <p key={item} className="mt-1 text-xs text-muted-foreground">- {item}</p>)}</div>; }
function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) { return <div className="rounded-lg bg-muted/30 p-3"><p className="text-[10px] font-bold text-muted-foreground">{label}</p><p className="mt-1 text-xs font-black text-primary">{value}</p>{sub && <p className="mt-1 text-[9px] text-muted-foreground">{sub}</p>}</div>; }
