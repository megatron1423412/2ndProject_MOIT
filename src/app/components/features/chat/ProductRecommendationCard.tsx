import React from "react";
import ProductImage from "../../product-catalog/ProductImage";
import type { ProductRecommendation } from "../../../features/product-catalog/core/types";
import CriteriaMatchList from "./CriteriaMatchList";
import FavoriteToggleButton from "../../../features/favorites/FavoriteToggleButton";
import ProductDetailDataSections from "../../../features/smart-shopping/product-detail/ProductDetailDataSections";
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
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex gap-4">
        <ProductImage productId={product.id} imagePath={product.imagePath} alt={`${product.brand} ${product.name} 상품 이미지`} className="h-28 w-28 flex-none rounded-lg border border-border bg-muted object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="text-xs font-bold text-muted-foreground">{product.brand} · {product.modelNumber}</p><h4 className="mt-1 font-black text-primary">{product.name}</h4></div>
            <div className="flex items-center gap-2"><span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-black text-brand-surface-foreground">{recommendation.score}점</span>{onToggleFavorite && <FavoriteToggleButton isFavorite={isFavorite} onToggle={onToggleFavorite} positionClassName="relative right-auto top-auto" />}</div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{product.shortInfo}</p>
          <div className="mt-2 flex flex-wrap gap-1">{specLabels(product).map((label) => <span key={label} className="rounded-full border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground">{label}</span>)}</div>
        </div>
      </div>
      <div className="mt-4"><CriteriaMatchList matched={recommendation.matchedCoreCriteria} unmatched={confirmationItems} confirmationTitle={isAirConditioner ? "구매 전 확인" : undefined} /></div>
      <ProductDetailDataSections productId={product.id} reviewSummary={product.aiReviewSummary} strengths={product.strengths} currentPrice={product.currentPrice} currentPriceLabel="모잇 내부 카탈로그 현재가" priceHistory={product.priceHistory} />
      <p className="mt-3 text-xs font-bold text-primary">추천 이유: {recommendation.recommendationReasons.join(" · ")}</p>
    </article>
  );
}
