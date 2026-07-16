import React from "react";
import type { ProductRecommendation, RecommendationReasonItem } from "../../product-catalog/core/types";

const getItems = (recommendation: ProductRecommendation): RecommendationReasonItem[] =>
  recommendation.recommendationReasonItems?.length
    ? recommendation.recommendationReasonItems
    : recommendation.recommendationReasons.map((description) => ({ label: "추천 기준", description }));

export default function RecommendationReasonList({ recommendation }: { recommendation: ProductRecommendation }) {
  const items = getItems(recommendation);
  if (!items.length) return null;
  return (
    <section className="mt-4 rounded-lg border border-border bg-muted/20 p-4" data-recommendation-reasons>
      <h4 className="text-sm font-black text-primary">추천 이유</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="min-w-0" data-recommendation-reason-item>
            <p className="text-xs font-semibold text-primary">{item.label}</p>
            <p className="mt-1 text-xs font-normal leading-relaxed text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
