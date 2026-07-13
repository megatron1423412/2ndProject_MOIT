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
}

export default function SmartShoppingTimeline(props: Props) {
  return <div className="space-y-4" aria-live="polite">{props.timeline.map((item) => <TimelineItemRenderer key={item.id} item={item} {...props} />)}</div>;
}

function TimelineItemRenderer({ item, ...props }: Props & { item: SmartShoppingTimelineItem }) {
  if (item.type === "user-action" || item.type === "user-text" || item.type === "assistant-text") {
    const alternatives = item.metadata?.alternatives as ProductRecommendation[] | undefined;
    return <><ChatMessage sender={item.type === "assistant-text" ? "ai" : "user"} text={item.text} timestamp={item.timestamp} />{alternatives?.length ? <AlternativeCards items={alternatives} /> : null}</>;
  }
  if (item.type === "recommendation-list") return <div className="grid items-start gap-4 xl:grid-cols-2"><OptimizedRecommendationList items={item.snapshot.recommendations} isActive={item.isActive} onSelect={props.onSelectRecommendation} /><NaverLowestPriceList items={item.snapshot.naverItems} status={item.snapshot.naverStatus} errorMessage={item.snapshot.naverErrorMessage} isActive={item.isActive} onRetry={props.onRetryNaver} onSelect={props.onSelectNaverProduct} /></div>;
  if (item.type === "product-detail") return <ProductDetailView selected={item.snapshot.selected} internalRecommendations={item.snapshot.internalRecommendations} interactive={false} />;
  if (item.type === "action-group" && item.group === "detail") return <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><ProductDetailActionBar showAlternative={item.showAlternative ?? false} isQuestionLoading={props.questionLoading} isActive={item.isActive} onAction={props.onDetailAction} onBack={props.onBackToList} onNext={props.onNextStep} /></div>;
  if (item.type === "action-group") return <NextActionSelection showPurchaseGrade={item.group === "next"} isActive={item.isActive} onSelect={props.onNextAction} />;
  if (item.type === "question-input") return item.isActive ? <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><ProductQuestionInput isLoading={props.questionLoading} errorMessage={props.questionError} onSubmit={props.onQuestionSubmit} onRetry={props.onQuestionRetry} onCancel={props.onQuestionCancel} /></div> : <p className="text-xs text-muted-foreground">직접 질문 입력을 완료했어요.</p>;
  if (item.type === "purchase-link") return <PurchaseLinkAction link={item.link} isActive={item.isActive} onCancel={props.onCancelPurchaseLink} />;
  if (item.type === "price-alert-form") return <PriceAlertForm inputId={`target-price-${item.id}`} productName={item.productName} currentPrice={item.currentPrice} allTimeLow={item.allTimeLow} isActive={item.isActive} onSubmit={props.onSavePriceAlert} onCancel={props.onCancelPriceAlert} />;
  return <PurchaseGradeResultCard input={item.input} result={item.result} />;
}

function AlternativeCards({ items }: { items: ProductRecommendation[] }) {
  return <div className="ml-11 grid gap-2 sm:grid-cols-3">{items.map((item) => <div key={item.product.id} className="rounded-lg border border-border bg-card p-3"><p className="text-xs font-black text-primary">{item.product.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.product.brand} · {item.product.modelNumber}</p><p className="mt-2 text-xs font-black text-accent">적합도 {item.score}점</p><p className="mt-1 text-xs text-primary">{item.product.currentPrice.toLocaleString("ko-KR")}원</p></div>)}</div>;
}
