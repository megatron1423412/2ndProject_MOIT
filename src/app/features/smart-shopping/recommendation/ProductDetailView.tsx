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
import type { QuestionSourceMode } from "../product-detail/questionSourceMode";

interface Props {
  selected: SelectedShoppingProduct;
  internalRecommendations: ProductRecommendation[];
  categoryId?: ProductCategoryId;
  showAlternative?: boolean;
  questionOpen?: boolean;
  questionLoading?: boolean;
  questionError?: string;
  questionSourceMode?: QuestionSourceMode;
  onQuestionSourceModeChange?: (mode: QuestionSourceMode) => void;
  onAction?: (action: ProductDetailActionId) => void;
  onQuestionSubmit?: (question: string, mode: QuestionSourceMode) => void;
  onQuestionRetry?: (question: string, mode: QuestionSourceMode) => void;
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
        {props.questionOpen && <div className="mt-3"><ProductQuestionInput isLoading={props.questionLoading ?? false} errorMessage={props.questionError ?? ""} sourceMode={props.questionSourceMode ?? "auto"} onSourceModeChange={props.onQuestionSourceModeChange ?? (() => {})} onSubmit={props.onQuestionSubmit ?? (() => {})} onRetry={props.onQuestionRetry ?? (() => {})} onCancel={props.onQuestionCancel ?? (() => {})} /></div>}
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
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
      {/* 🎨 상단 타이틀 Header */}
      <div className="flex flex-col border-b border-slate-100 pb-5 mb-5">
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-[#F5F7FA] border border-slate-200/70 text-xs font-bold text-[#1E3ABA]">
            <span className="h-2 w-2 rounded-full bg-[#1E3ABA]"></span>
            <span>가전·구매 진단</span>
          </span>
        </div>
        <h1 className="text-2xl sm:text-2xl font-extrabold text-[#14B8A6] tracking-tight mt-0 mb-1">
          스마트 제품 분석 솔루션
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500">
          구매 적기 판단을 위한 맞춤 리포트
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* 🎨 1. 상품 이미지 썸네일 */}
        <div className="flex h-24 w-24 flex-none items-center justify-center rounded-2xl border border-slate-100 bg-[#F5F7FA] p-3 sm:h-28 sm:w-28">
          <ImageWithFallback src={naver.imageUrl} alt={`${naver.title} 네이버 쇼핑 이미지`} className="h-full w-full object-contain" />
        </div>

        {/* 🎨 2. 상품 정보 헤더 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-semibold text-[#1E3ABA]">
              <span className="h-2 w-2 rounded-full bg-[#1E3ABA]" />
              <span>{naver.brand || naver.maker || "네이버 상품"}{internal ? ` ${internal.modelNumber}` : ""}</span>
            </div>
            {onToggleFavorite && <FavoriteToggleButton isFavorite={isFavorite} onToggle={onToggleFavorite} positionClassName="relative right-auto top-auto" />}
          </div>

          <h3 className="mt-1.5 text-lg font-extrabold text-[#1F2937] sm:text-[20px] leading-snug">
            {naver.title}
          </h3>

          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            {internal?.shortInfo ?? "모잇 DB 검증 정보 연동"}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
              에너지 1등급
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
              AI 자동건조
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
              저소음 19dB
            </span>
          </div>
        </div>
      </div>

      <div className="hidden" aria-hidden="true"><CriteriaMatchList matched={recommendation?.matchedCoreCriteria ?? (internal ? ["모델번호 기준 내부 DB 매칭"] : [])} unmatched={confirmationItems} confirmationTitle={isAirConditioner ? "구매 전 확인" : undefined} /></div>
      <ProductDetailDataSections productId={`naver:${naver.productId}`} reviewSummary={combined.reviewSummary} strengths={internal?.strengths ?? []} currentPrice={combined.currentPrice} currentPriceLabel={combined.currentPriceLabel} priceHistory={combined.priceHistory} />
      {naver.productUrl && <a href={naver.productUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl border border-[#1E3ABA]/20 bg-[#F5F7FA] px-4 py-2 text-xs font-bold text-[#1E3ABA] transition-colors hover:bg-[#1E3ABA] hover:text-white">네이버 공식 판매처 상품 페이지 확인</a>}
    </article>
  );
}
