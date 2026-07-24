import React from "react";
import ProductImage from "../../product-catalog/ProductImage";
import type { ProductRecommendation } from "../../../features/product-catalog/core/types";
import CriteriaMatchList from "./CriteriaMatchList";
import FavoriteToggleButton from "../../../features/favorites/FavoriteToggleButton";
import ProductDetailDataSections from "../../../features/smart-shopping/product-detail/ProductDetailDataSections";
import RecommendationReasonList from "../../../features/smart-shopping/recommendation/RecommendationReasonList";
import { AIR_CONDITIONER_TYPE_LABELS, displayLabel, REFRIGERATOR_DOOR_LABELS, TV_RESOLUTION_LABELS } from "../../../features/chat-flow/flows/appliances/displayLabels";

const specLabels = (product: ProductRecommendation["product"]) => {
  switch (product.categoryId) {
    case "air-conditioner": return [displayLabel(AIR_CONDITIONER_TYPE_LABELS, product.specs.type), `냉방 ${product.specs.ratedCoolingAreaPyeong}평`, `효율 ${product.specs.energyGrade}등급`];
    case "tv": return [`${product.specs.screenSizeInches}인치`, displayLabel(TV_RESOLUTION_LABELS, product.specs.resolution), product.specs.panel.toUpperCase(), `보증 ${product.specs.warrantyYears}년`];
    case "refrigerator": return [`${product.specs.capacityLiters}L`, displayLabel(REFRIGERATOR_DOOR_LABELS, product.specs.doorType), `핵심부품 ${product.specs.corePartWarrantyYears}년 보증`];
    case "vacuum": return [product.specs.suctionAw !== undefined ? `${product.specs.suctionAw}AW` : `${product.specs.suctionPa?.toLocaleString("ko-KR")}Pa`, product.specs.hepaGrade, `${product.specs.bodyWeightKg}kg`];
  }
};

interface Props {
  recommendation: ProductRecommendation;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function ProductRecommendationCard({ recommendation, isFavorite = false, onToggleFavorite }: Props) {
  const { product } = recommendation;
  const isAirConditioner = product.categoryId === "air-conditioner";
  const confirmationItems = isAirConditioner
    ? ["설치비 확인 필요", ...recommendation.unmatchedOrUnknownCriteria.filter((item) => item !== "설치비 확인 필요")]
    : recommendation.unmatchedOrUnknownCriteria;
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* 🎨 1. 상품 이미지 카드 썸네일 (bg-[#F5F7FA]) */}
        <div className="flex h-24 w-24 flex-none items-center justify-center rounded-2xl border border-slate-100 bg-[#F5F7FA] p-3 sm:h-28 sm:w-28">
          <ProductImage productId={product.id} imagePath={product.imagePath} alt={`${product.brand} ${product.name} 상품 이미지`} className="h-full w-full object-contain" />
        </div>

        {/* 🎨 2. 상품 정보 헤더 (모델 뱃지, 제목, 정보, 스펙 태그) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            {/* 상단 모델 뱃지 (● 브랜드 모델명) */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F7FA] px-3 py-1 text-xs font-semibold text-[#1E3ABA]">
              <span className="h-2 w-2 rounded-full bg-[#1E3ABA]" />
              <span>{product.brand} {product.modelNumber}</span>
            </div>
            {onToggleFavorite && <FavoriteToggleButton isFavorite={isFavorite} onToggle={onToggleFavorite} positionClassName="relative right-auto top-auto" />}
          </div>

          {/* 메인 상품명 */}
          <h4 className="mt-1.5 text-lg font-extrabold text-[#1F2937] sm:text-[20px] leading-snug">
            {product.name}
          </h4>

          {/* 짧은 정보 (연형 / 평형 / 케어) */}
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            {product.shortInfo}
          </p>

          {/* 하단 스펙 태그 뱃지 리스트 */}
          <div className="mt-3 flex flex-wrap gap-2">
            {specLabels(product).map((label) => (
              <span key={label} className="rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-medium text-slate-600 shadow-2xs">
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden" aria-hidden="true"><CriteriaMatchList matched={recommendation.matchedCoreCriteria} unmatched={confirmationItems} confirmationTitle={isAirConditioner ? "구매 전 확인" : undefined} /></div>
      <ProductDetailDataSections productId={product.id} reviewSummary={product.aiReviewSummary} strengths={product.strengths} currentPrice={product.currentPrice} currentPriceLabel="모잇 내부 카탈로그 현재가" priceHistory={product.priceHistory} />
      <RecommendationReasonList recommendation={recommendation} />
    </article>
  );
}
