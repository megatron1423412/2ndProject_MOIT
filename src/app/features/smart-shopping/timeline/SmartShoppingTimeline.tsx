import React from "react";
import type { ProductDetailActionId } from "../actions/productDetailActions";
import PurchaseGradeResultCard from "../grade/PurchaseGradeResultCard";
import NextActionSelection from "../next-actions/NextActionSelection";
import PriceAlertForm from "../next-actions/PriceAlertForm";
import PurchaseLinkAction from "../next-actions/PurchaseLinkAction";
import ProductDetailActionBar from "../product-detail/ProductDetailActionBar";
import ProductQuestionInput from "../product-detail/ProductQuestionInput";
import OptimizedRecommendationList, { OPTIMIZED_RECOMMENDATION_CARD_LAYOUT } from "../recommendation/OptimizedRecommendationList";
import SelectableRecommendationCard from "../recommendation/SelectableRecommendationCard";
import NaverLowestPriceList from "../recommendation/NaverLowestPriceList";
import { createDummyCatalogRecommendation } from "../recommendation/selectDummyNaverProducts";
import ProductDetailView from "../recommendation/ProductDetailView";
import type { NextActionId } from "../next-actions/nextActionOptions";
import type { SmartShoppingTimelineItem } from "../session/smartShoppingSessionTypes";
import type { ProductRecommendation } from "../../product-catalog/core/types";
import type { CatalogProduct } from "../../product-catalog/core/types";
import type { SelectedShoppingProduct } from "../types/recommendation";
import type { QuestionSourceMode } from "../product-detail/questionSourceMode";

export interface SmartShoppingTimelineBindings {
  questionLoading: boolean;
  questionError: string;
  questionSourceMode: QuestionSourceMode;
  onQuestionSourceModeChange: (mode: QuestionSourceMode) => void;
  onSelectRecommendation: (item: ProductRecommendation) => void;
  onSelectDummyProduct: (item: CatalogProduct) => void;
  onDetailAction: (action: ProductDetailActionId) => void;
  onBackToList: () => void;
  onRestartConditionSearch: () => void;
  onNextStep: () => void;
  onQuestionSubmit: (question: string, mode: QuestionSourceMode) => void;
  onQuestionRetry: (question: string, mode: QuestionSourceMode) => void;
  onQuestionCancel: () => void;
  onNextAction: (action: NextActionId) => void;
  onCancelPurchaseLink: () => void;
  onSavePriceAlert: (targetPrice: number) => void;
  onCancelPriceAlert: () => void;
  isFavorite: (product: SelectedShoppingProduct) => boolean;
  onToggleFavorite: (product: SelectedShoppingProduct) => void;
  onProductSelectionAnchorMount?: (anchorId: string, element: HTMLDivElement | null) => void;
}

export interface SmartShoppingTimelineRenderModel extends SmartShoppingTimelineBindings {
  timeline: SmartShoppingTimelineItem[];
  showClosestOverBudget: boolean;
  onShowClosestOverBudget: () => void;
}

export const isSmartShoppingConversationItem = (item: SmartShoppingTimelineItem): item is Extract<SmartShoppingTimelineItem, { type: "user-action" | "user-text" | "assistant-text" }> =>
  item.type === "user-action" || item.type === "user-text" || item.type === "assistant-text";

/** Renders wide content only. Conversational items are owned by ChatScreen. */
export function SmartShoppingWideTimelineContent({ item, ...props }: SmartShoppingTimelineBindings & { item: Exclude<SmartShoppingTimelineItem, { type: "user-action" | "user-text" | "assistant-text" }> }) {
  if (item.type === "recommendation-list") {
    const asInternal = (recommendation: ProductRecommendation): SelectedShoppingProduct => ({ source: "internal", recommendation });
    const asDummyInternal = (product: CatalogProduct): SelectedShoppingProduct => ({ source: "internal", recommendation: createDummyCatalogRecommendation(product) });
    return <div className="grid items-start gap-4 xl:grid-cols-2" data-chat-content="recommendation-shell"><div className="min-w-0"><OptimizedRecommendationList items={item.snapshot.recommendations} catalogSource={item.snapshot.catalogSource} isActive={item.isActive} onSelect={props.onSelectRecommendation} isFavorite={(recommendation) => props.isFavorite(asInternal(recommendation))} onToggleFavorite={(recommendation) => props.onToggleFavorite(asInternal(recommendation))} />{item.snapshot.recommendations.length === 0 && <button type="button" onClick={props.onRestartConditionSearch} className="mt-3 rounded-lg border border-accent/40 bg-card px-4 py-2 text-sm font-bold text-accent shadow-sm transition hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent/40" data-new-condition-search>새 조건으로 다시 검색하기</button>}</div><NaverLowestPriceList items={item.snapshot.dummyProducts} isActive={item.isActive} onSelect={props.onSelectDummyProduct} isFavorite={(product) => props.isFavorite(asDummyInternal(product))} onToggleFavorite={(product) => props.onToggleFavorite(asDummyInternal(product))} /></div>;
  }
  if (item.type === "product-detail") return <ProductDetailView categoryId={item.snapshot.categoryId} selected={item.snapshot.selected} internalRecommendations={item.snapshot.internalRecommendations} interactive={false} isFavorite={props.isFavorite(item.snapshot.selected)} onToggleFavorite={() => props.onToggleFavorite(item.snapshot.selected)} />;
  if (item.type === "action-group" && item.group === "detail") return <div className="rounded-xl border border-border bg-card p-4 shadow-sm" data-chat-content="action-toolbar"><ProductDetailActionBar showAlternative={item.showAlternative ?? false} isQuestionLoading={props.questionLoading} isActive={item.isActive} onAction={props.onDetailAction} onBack={props.onBackToList} onNext={props.onNextStep} /></div>;
  if (item.type === "action-group") return <NextActionSelection showPurchaseGrade={item.group === "next"} isActive={item.isActive} onSelect={props.onNextAction} />;
  if (item.type === "question-input") return item.isActive ? <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><ProductQuestionInput isLoading={props.questionLoading} errorMessage={props.questionError} sourceMode={props.questionSourceMode} onSourceModeChange={props.onQuestionSourceModeChange} onSubmit={props.onQuestionSubmit} onRetry={props.onQuestionRetry} onCancel={props.onQuestionCancel} /></div> : <p className="text-xs text-muted-foreground">직접 질문 입력을 완료했어요.</p>;
  if (item.type === "purchase-link") return <PurchaseLinkAction link={item.link} isActive={item.isActive} onCancel={props.onCancelPurchaseLink} />;
  if (item.type === "price-alert-form") return <PriceAlertForm inputId={`target-price-${item.id}`} productName={item.productName} currentPrice={item.currentPrice} allTimeLow={item.allTimeLow} isActive={item.isActive} onSubmit={props.onSavePriceAlert} onCancel={props.onCancelPriceAlert} />;
  return <PurchaseGradeResultCard input={item.input} result={item.result} />;
}

export function SmartShoppingAlternativeCards({ items, onSelect, isFavorite, onToggleFavorite }: { items: ProductRecommendation[]; onSelect: (item: ProductRecommendation) => void; isFavorite: (item: ProductRecommendation) => boolean; onToggleFavorite: (item: ProductRecommendation) => void }) {
  return <div className="grid w-max max-w-none gap-3" style={{ gridTemplateColumns: `repeat(2, ${OPTIMIZED_RECOMMENDATION_CARD_LAYOUT.cardWidth})`, minWidth: OPTIMIZED_RECOMMENDATION_CARD_LAYOUT.twoColumnMinWidth }} data-chat-content="alternative-products">{items.map((item) => <SelectableRecommendationCard key={item.product.id} recommendation={item} onSelect={onSelect} isFavorite={isFavorite(item)} onToggleFavorite={() => onToggleFavorite(item)} />)}</div>;
}
