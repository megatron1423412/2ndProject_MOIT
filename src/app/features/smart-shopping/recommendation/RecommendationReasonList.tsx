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
    <section className="mt-4 rounded-lg border border-border bg-muted/20 py-2.5 px-4" data-recommendation-reasons>
      <h4 className="text-sm font-black text-primary">추천 이유</h4>
      <div className="mt-1.5 space-y-1">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="text-xs leading-relaxed text-muted-foreground" data-recommendation-reason-item style={{ lineHeight: 1.15 }}>
            <span className="font-semibold text-primary">{item.label}</span>
            {" - "}
            <span className="font-normal leading-relaxed" style={{ lineHeight: 1.15 }}>{item.description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
