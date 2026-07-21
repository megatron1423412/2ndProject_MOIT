import React from "react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import CriteriaMatchList from "../../../components/features/chat/CriteriaMatchList";
import ProductRecommendationCard from "../../../components/features/chat/ProductRecommendationCard";
import type { ProductCategoryId, ProductRecommendation } from "../../product-catalog/core/types";
import type { ProductDetailActionId } from "../actions/productDetailActions";
import ProductDetailActionBar from "../product-detail/ProductDetailActionBar";
import ProductQuestionInput from "../product-detail/ProductQuestionInput";
import type { SelectedShoppingProduct } from "../types/recommendation";
import { combineProductDetail } from "./combineProductDetail";
import FavoriteToggleButton from "../../favorites/FavoriteToggleButton";
import ProductDetailDataSections from "../product-detail/ProductDetailDataSections";

interface Props {
  selected: SelectedShoppingProduct;
  internalRecommendations: ProductRecommendation[];
  categoryId?: ProductCategoryId;
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
    : <NaverProductDetail selected={selected} internalRecommendations={internalRecommendations} categoryId={props.categoryId} isFavorite={props.isFavorite ?? false} onToggleFavorite={props.onToggleFavorite} />;
  return (
    <div className="space-y-4" data-stage="viewing-product-detail" data-chat-content="product-detail">
      {content}
      {interactive && <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <ProductDetailActionBar showAlternative={props.showAlternative ?? false} isQuestionLoading={props.questionLoading ?? false} onAction={props.onAction ?? (() => {})} onBack={props.onBack ?? (() => {})} onNext={props.onNext ?? (() => {})} />
        {props.questionOpen && <div className="mt-3"><ProductQuestionInput isLoading={props.questionLoading ?? false} errorMessage={props.questionError ?? ""} onSubmit={props.onQuestionSubmit ?? (() => {})} onRetry={props.onQuestionRetry ?? (() => {})} onCancel={props.onQuestionCancel ?? (() => {})} /></div>}
      </div>}
    </div>
  );
}

function NaverProductDetail({ selected, internalRecommendations, categoryId, isFavorite, onToggleFavorite }: { selected: Extract<SelectedShoppingProduct, { source: "naver" }>; internalRecommendations: ProductRecommendation[]; categoryId?: ProductCategoryId; isFavorite: boolean; onToggleFavorite?: () => void }) {
  const { product: naver, matchedInternalProduct: internal } = selected;
  const combined = combineProductDetail(selected);
  const recommendation = internalRecommendations.find((item) => item.product.id === internal?.id);
  const detailCategory = internal?.categoryId ?? categoryId;
  const isAirConditioner = detailCategory === "air-conditioner";
  const unmatched = recommendation?.unmatchedOrUnknownCriteria ?? [internal ? "현재 조건 추천 후보 여부 확인 필요" : "모잇 DB 검증 정보 없음"];
  const confirmationItems = isAirConditioner ? ["설치비 확인 필요", ...unmatched.filter((item) => item !== "설치비 확인 필요")] : unmatched;
  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row"><ImageWithFallback src={naver.imageUrl} alt={`${naver.title} 네이버 쇼핑 이미지`} className="h-40 w-40 flex-none rounded-lg border border-border bg-muted object-cover" /><div className="min-w-0 flex-1"><div className="flex items-start justify-end">{onToggleFavorite && <FavoriteToggleButton isFavorite={isFavorite} onToggle={onToggleFavorite} positionClassName="relative right-auto top-auto" />}</div><p className="mt-3 text-xs font-bold text-muted-foreground">{naver.brand || naver.maker || "브랜드 정보 없음"}{internal ? ` · ${internal.modelNumber}` : ""}</p><h3 className="mt-1 text-lg font-black text-primary">{naver.title}</h3><p className="mt-2 text-xs text-muted-foreground">{internal?.shortInfo ?? "모잇 DB 검증 정보 없음"}</p>{recommendation && <p className="hidden" aria-hidden="true">조건 적합도 {recommendation.score}점</p>}</div></div>
      <div className="hidden" aria-hidden="true"><CriteriaMatchList matched={recommendation?.matchedCoreCriteria ?? (internal ? ["모델번호 기준 내부 DB 매칭"] : [])} unmatched={confirmationItems} confirmationTitle={isAirConditioner ? "구매 전 확인" : undefined} /></div>
      <ProductDetailDataSections productId={`naver:${naver.productId}`} reviewSummary={combined.reviewSummary} strengths={internal?.strengths ?? []} currentPrice={combined.currentPrice} currentPriceLabel={combined.currentPriceLabel} priceHistory={combined.priceHistory} />
      {naver.productUrl && <a href={naver.productUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg border border-border px-3 py-2 text-xs font-black text-primary hover:bg-muted">네이버 상품 페이지 확인</a>}
    </article>
  );
}
