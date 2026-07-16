import React from "react";
import ChatMessage from "../../../components/features/chat/ChatMessage";
import type { ProductDetailActionId } from "../actions/productDetailActions";
import PurchaseGradeResultCard from "../grade/PurchaseGradeResultCard";
import NextActionSelection from "../next-actions/NextActionSelection";
import PriceAlertForm from "../next-actions/PriceAlertForm";
import PurchaseLinkAction from "../next-actions/PurchaseLinkAction";
import ProductDetailActionBar from "../product-detail/ProductDetailActionBar";
import ProductQuestionInput from "../product-detail/ProductQuestionInput";
import OptimizedRecommendationList from "../recommendation/OptimizedRecommendationList";
import NaverLowestPriceList from "../recommendation/NaverLowestPriceList";
import ProductDetailView from "../recommendation/ProductDetailView";
import type { NextActionId } from "../next-actions/nextActionOptions";
import type { NaverShoppingProduct } from "../types/recommendation";
import type { SmartShoppingTimelineItem } from "../session/smartShoppingSessionTypes";
import type { ProductRecommendation } from "../../product-catalog/core/types";
import type { CatalogProduct } from "../../product-catalog/core/types";
import type { SelectedShoppingProduct } from "../types/recommendation";
import { matchInternalProduct } from "../naver/matchInternalProduct";

interface Props {
  timeline: SmartShoppingTimelineItem[];
  questionLoading: boolean;
  questionError: string;
  onSelectRecommendation: (item: ProductRecommendation) => void;
  onSelectNaverProduct: (item: NaverShoppingProduct) => void;
  onRetryNaver: () => void;
  onDetailAction: (action: ProductDetailActionId) => void;
  onBackToList: () => void;
  onNextStep: () => void;
  onQuestionSubmit: (question: string) => void;
  onQuestionRetry: (question: string) => void;
  onQuestionCancel: () => void;
  onNextAction: (action: NextActionId) => void;
  onCancelPurchaseLink: () => void;
  onSavePriceAlert: (targetPrice: number) => void;
  onCancelPriceAlert: () => void;
  catalogProducts: CatalogProduct[];
  isFavorite: (product: SelectedShoppingProduct) => boolean;
  onToggleFavorite: (product: SelectedShoppingProduct) => void;
}

export default function SmartShoppingTimeline(props: Props) {
  return <div className="flex w-full min-w-0 flex-col gap-4" aria-live="polite" data-smart-shopping-timeline>{props.timeline.map((item) => <TimelineItemRenderer key={item.id} item={item} {...props} />)}</div>;
}

export type SmartShoppingTimelineRowKind = "assistant" | "user" | "wide";

export function SmartShoppingTimelineRow({ kind, children }: { kind: SmartShoppingTimelineRowKind; children: React.ReactNode }) {
  const alignment = kind === "user" ? "justify-end" : "justify-start";
  return (
    <div
      className={kind === "wide" ? "w-full min-w-0" : `flex w-full min-w-0 ${alignment}`}
      data-timeline-row={kind}
    >
      {children}
    </div>
  );
}

function TimelineItemRenderer({ item, ...props }: Props & { item: SmartShoppingTimelineItem }) {
  if (item.type === "user-action" || item.type === "user-text" || item.type === "assistant-text") {
    const alternatives = item.metadata?.alternatives as ProductRecommendation[] | undefined;
    const isAssistant = item.type === "assistant-text";
    return <>
      <SmartShoppingTimelineRow kind={isAssistant ? "assistant" : "user"}>
        <ChatMessage sender={isAssistant ? "ai" : "user"} text={item.text} timestamp={item.timestamp} />
      </SmartShoppingTimelineRow>
      {alternatives?.length ? <SmartShoppingTimelineRow kind="wide"><AlternativeCards items={alternatives} /></SmartShoppingTimelineRow> : null}
    </>;
  }
  if (item.type === "recommendation-list") {
    const asInternal = (recommendation: ProductRecommendation): SelectedShoppingProduct => ({ source: "internal", recommendation });
    const asNaver = (product: NaverShoppingProduct): SelectedShoppingProduct => ({ source: "naver", product, matchedInternalProduct: matchInternalProduct(product, props.catalogProducts) });
    return <SmartShoppingTimelineRow kind="wide"><div className="grid items-start gap-4 xl:grid-cols-2"><OptimizedRecommendationList items={item.snapshot.recommendations} catalogSource={item.snapshot.catalogSource} isActive={item.isActive} onSelect={props.onSelectRecommendation} isFavorite={(recommendation) => props.isFavorite(asInternal(recommendation))} onToggleFavorite={(recommendation) => props.onToggleFavorite(asInternal(recommendation))} /><NaverLowestPriceList items={item.snapshot.naverItems} status={item.snapshot.naverStatus} errorMessage={item.snapshot.naverErrorMessage} isActive={item.isActive} onRetry={props.onRetryNaver} onSelect={props.onSelectNaverProduct} isFavorite={(product) => props.isFavorite(asNaver(product))} onToggleFavorite={(product) => props.onToggleFavorite(asNaver(product))} /></div></SmartShoppingTimelineRow>;
  }
  if (item.type === "product-detail") return <SmartShoppingTimelineRow kind="wide"><ProductDetailView categoryId={item.snapshot.categoryId} selected={item.snapshot.selected} internalRecommendations={item.snapshot.internalRecommendations} interactive={false} isFavorite={props.isFavorite(item.snapshot.selected)} onToggleFavorite={() => props.onToggleFavorite(item.snapshot.selected)} /></SmartShoppingTimelineRow>;
  if (item.type === "action-group" && item.group === "detail") return <SmartShoppingTimelineRow kind="wide"><div className="rounded-xl border border-border bg-card p-4 shadow-sm"><ProductDetailActionBar showAlternative={item.showAlternative ?? false} isQuestionLoading={props.questionLoading} isActive={item.isActive} onAction={props.onDetailAction} onBack={props.onBackToList} onNext={props.onNextStep} /></div></SmartShoppingTimelineRow>;
  if (item.type === "action-group") return <SmartShoppingTimelineRow kind="wide"><NextActionSelection showPurchaseGrade={item.group === "next"} isActive={item.isActive} onSelect={props.onNextAction} /></SmartShoppingTimelineRow>;
  if (item.type === "question-input") return <SmartShoppingTimelineRow kind="wide">{item.isActive ? <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><ProductQuestionInput isLoading={props.questionLoading} errorMessage={props.questionError} onSubmit={props.onQuestionSubmit} onRetry={props.onQuestionRetry} onCancel={props.onQuestionCancel} /></div> : <p className="text-xs text-muted-foreground">직접 질문 입력을 완료했어요.</p>}</SmartShoppingTimelineRow>;
  if (item.type === "purchase-link") return <SmartShoppingTimelineRow kind="wide"><PurchaseLinkAction link={item.link} isActive={item.isActive} onCancel={props.onCancelPurchaseLink} /></SmartShoppingTimelineRow>;
  if (item.type === "price-alert-form") return <SmartShoppingTimelineRow kind="wide"><PriceAlertForm inputId={`target-price-${item.id}`} productName={item.productName} currentPrice={item.currentPrice} allTimeLow={item.allTimeLow} isActive={item.isActive} onSubmit={props.onSavePriceAlert} onCancel={props.onCancelPriceAlert} /></SmartShoppingTimelineRow>;
  return <SmartShoppingTimelineRow kind="wide"><PurchaseGradeResultCard input={item.input} result={item.result} /></SmartShoppingTimelineRow>;
}

function AlternativeCards({ items }: { items: ProductRecommendation[] }) {
  return <div className="ml-11 grid gap-2 sm:grid-cols-3">{items.map((item) => <div key={item.product.id} className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-black text-primary">{item.product.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.product.brand} · {item.product.modelNumber}</p><p className="mt-2 text-xs font-black text-accent">적합도 {item.score}점</p><p className="mt-1 text-xs text-primary">{item.product.currentPrice.toLocaleString("ko-KR")}원</p></div>)}</div>;
}
