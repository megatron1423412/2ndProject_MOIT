import React from "react";
import type { ProductDetailActionId } from "../actions/productDetailActions";
import { PRODUCT_DETAIL_ACTIONS } from "../actions/productDetailActions";

interface Props {
  showAlternative: boolean;
  isQuestionLoading: boolean;
  onAction: (action: ProductDetailActionId) => void;
  onBack: () => void;
  onNext: () => void;
  isActive?: boolean;
}

export default function ProductDetailActionBar({ isQuestionLoading, onAction, onBack, onNext, isActive = true }: Props) {
  const ordinaryActions = PRODUCT_DETAIL_ACTIONS.filter((action) => action.id !== "next-step");
  const nextAction = PRODUCT_DETAIL_ACTIONS.find((action) => action.id === "next-step");
  const ordinaryClassName = "whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs font-black text-primary transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 lg:flex-row lg:items-center" aria-label="상품 상세 후속 액션" data-product-action-toolbar>
      <div className="flex min-w-0 flex-1 flex-wrap gap-2 lg:flex-nowrap" data-product-action-group="ordinary">
      {ordinaryActions.map((action) => {
        const isBack = action.id === "back-to-list";
        const onClick = isBack ? onBack : () => onAction(action.id as ProductDetailActionId);
        return <button key={action.id} type="button" aria-label={action.label} disabled={!isActive || isQuestionLoading} onClick={onClick} className={ordinaryClassName}>{action.label}</button>;
      })}
      </div>
      {nextAction && <button type="button" aria-label={nextAction.label} disabled={!isActive || isQuestionLoading} onClick={onNext} className="whitespace-nowrap rounded-lg bg-brand-surface px-4 py-2 text-xs font-black text-brand-surface-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50" data-product-progress-action>{nextAction.label}</button>}
    </div>
  );
}
