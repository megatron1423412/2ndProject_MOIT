import React from "react";
import { ImageWithFallback } from "../../figma/ImageWithFallback";
import type { ProductRecommendation } from "../../../features/product-catalog/core/types";
import { summarizePriceHistory } from "../../../features/product-catalog/core/priceHistory";
import CriteriaMatchList from "./CriteriaMatchList";
import PriceTrendMiniChart from "./PriceTrendMiniChart";
import FavoriteToggleButton from "../../../features/favorites/FavoriteToggleButton";

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

const specLabels = (product: ProductRecommendation["product"]) => {
  switch (product.categoryId) {
    case "air-conditioner": return [product.specs.type, `냉방 ${product.specs.ratedCoolingAreaPyeong}평`, `효율 ${product.specs.energyGrade}등급`];
    case "tv": return [`${product.specs.screenSizeInches}인치`, product.specs.resolution.toUpperCase(), product.specs.panel.toUpperCase(), `보증 ${product.specs.warrantyYears}년`];
    case "refrigerator": return [`${product.specs.capacityLiters}L`, product.specs.doorType, `핵심부품 ${product.specs.corePartWarrantyYears}년 보증`];
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
  const price = summarizePriceHistory(product.currentPrice, product.priceHistory);
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex gap-4">
        <ImageWithFallback src={product.imagePath} alt={`${product.brand} ${product.name} 더미 상품 이미지`} className="h-28 w-28 flex-none rounded-lg border border-border bg-muted object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="text-xs font-bold text-muted-foreground">{product.brand} · {product.modelNumber}</p><h4 className="mt-1 font-black text-primary">{product.name}</h4></div>
            <div className="flex items-center gap-2"><span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-black text-brand-surface-foreground">{recommendation.score}점</span>{onToggleFavorite && <FavoriteToggleButton isFavorite={isFavorite} onToggle={onToggleFavorite} positionClassName="relative right-auto top-auto" />}</div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{product.shortInfo}</p>
          <div className="mt-2 flex flex-wrap gap-1">{specLabels(product).map((label) => <span key={label} className="rounded-full border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground">{label}</span>)}</div>
          <span className="mt-2 inline-flex rounded bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-800 dark:bg-amber-300/15 dark:text-amber-200">MOCK DATA</span>
        </div>
      </div>
      <div className="mt-4"><CriteriaMatchList matched={recommendation.matchedCoreCriteria} unmatched={recommendation.unmatchedOrUnknownCriteria} /></div>
      <div className="mt-3 rounded-lg bg-muted/30 p-3"><p className="text-[11px] font-black text-primary">더미 AI 리뷰 요약</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{product.aiReviewSummary}</p></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-3"><p className="text-[11px] font-black text-primary">장점</p>{product.strengths.map((item) => <p key={item} className="mt-1 text-xs text-muted-foreground">+ {item}</p>)}</div>
        <div className="rounded-lg border border-border p-3"><p className="text-[11px] font-black text-primary">주의점</p>{product.weaknesses.map((item) => <p key={item} className="mt-1 text-xs text-muted-foreground">- {item}</p>)}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <PriceMetric label="현재가" value={won(product.currentPrice)} />
        <PriceMetric label="역대 최저가" value={won(price.allTimeLow)} />
        <PriceMetric label="평균가" value={won(price.averagePrice)} />
        <PriceMetric label="최저가 대비" value={`+${won(price.differenceFromLow)} (${price.percentAboveLow}%)`} />
      </div>
      <div className="mt-3"><PriceTrendMiniChart history={product.priceHistory} /></div>
      <p className="mt-3 text-xs font-bold text-primary">추천 이유: {recommendation.recommendationReasons.join(" · ")}</p>
    </article>
  );
}

function PriceMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted/30 p-2"><p className="text-[10px] font-bold text-muted-foreground">{label}</p><p className="mt-1 text-xs font-black text-primary">{value}</p></div>;
}
