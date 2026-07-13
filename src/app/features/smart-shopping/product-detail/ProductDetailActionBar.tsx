import React from "react";
import type { ProductDetailActionId } from "../actions/productDetailActions";
import { PRODUCT_DETAIL_ACTIONS } from "../actions/productDetailActions";

interface Props {
  showAlternative: boolean;
  isQuestionLoading: boolean;
  onAction: (action: ProductDetailActionId) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function ProductDetailActionBar({ showAlternative, isQuestionLoading, onAction, onBack, onNext }: Props) {
  const actionIds = PRODUCT_DETAIL_ACTIONS.filter((action) => action.id !== "alternative" || showAlternative);
  return (
    <div className="flex flex-wrap gap-2 border-t border-border pt-4" aria-label="상품 상세 후속 액션">
      {actionIds.map((action) => {
        const isBack = action.id === "back-to-list";
        const isNext = action.id === "next-step";
        const onClick = isBack ? onBack : isNext ? onNext : () => onAction(action.id as ProductDetailActionId);
        return <button key={action.id} type="button" aria-label={action.label} disabled={isQuestionLoading} onClick={onClick} className={isNext ? "rounded-lg bg-brand-surface px-4 py-2 text-xs font-black text-brand-surface-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" : isBack ? "rounded-lg border border-border bg-card px-3 py-2 text-xs font-black text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" : "rounded-lg border border-border bg-card px-3 py-2 text-xs font-black text-primary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"}>{action.label}</button>;
      })}
    </div>
  );
}
