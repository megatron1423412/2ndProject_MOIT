import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { ChatFlowMessage, FlowAnswers, FlowResult } from "../../chat-flow/core/types";
import type { ProductCategoryId } from "../../product-catalog/core/types";
import { buildPurchaseTipMessage } from "../actions/buildPurchaseTipMessage";
import { findAlternativeProducts, getSelectedPriceRisePct } from "../actions/findAlternativeProducts";
import type { ProductDetailActionId } from "../actions/productDetailActions";
import { getProductDetailActionLabel } from "../actions/productDetailActions";
import { startPurchaseGradeDiagnosis } from "../grade/startPurchaseGradeDiagnosis";
import PurchaseGradeDiagnosis from "../grade/PurchaseGradeDiagnosis";
import { buildNaverSearchQuery } from "../naver/buildSearchQuery";
import { matchInternalProduct } from "../naver/matchInternalProduct";
import { fetchNaverShoppingProducts } from "../naver/naverShoppingClient";
import { getUpcomingPromotionMessage } from "../promotions/getUpcomingPromotionMessage";
import { buildProductQuestionRequest } from "../product-detail/productQuestionContext";
import { askProductQuestion } from "../product-detail/productQuestionClient";
import { PRODUCT_DETAIL_SETTINGS } from "../product-detail/productDetailSettings";
import type { NaverShoppingProduct, SelectedShoppingProduct } from "../types/recommendation";
import { initialRecommendationViewState, recommendationViewReducer } from "../types/recommendation";
import NaverLowestPriceList from "./NaverLowestPriceList";
import OptimizedRecommendationList from "./OptimizedRecommendationList";
import ProductDetailView from "./ProductDetailView";

interface Props {
  result: FlowResult;
  supplementalMessages: ChatFlowMessage[];
  onAppendSupplementalMessage: (message: { sender: "ai" | "user"; text: string; metadata?: Record<string, unknown> }) => void;
  onClearSupplementalMessages: () => void;
}

export default function RecommendationSelectionView({ result, supplementalMessages, onAppendSupplementalMessage, onClearSupplementalMessages }: Props) {
  const [view, dispatch] = useReducer(recommendationViewReducer, initialRecommendationViewState);
  const [naverItems, setNaverItems] = useState<NaverShoppingProduct[]>([]);
  const [naverStatus, setNaverStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const metadata = result.metadata as { category?: ProductCategoryId; answers?: FlowAnswers } | undefined;
  const category = metadata?.category;
  const criteria = metadata?.answers ?? {};
  const query = useMemo(() => category ? buildNaverSearchQuery(category, criteria) : "", [category, criteria]);

  const loadNaver = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: "start-loading" }); setNaverStatus("loading"); setErrorMessage("");
    try { const items = await fetchNaverShoppingProducts(query, signal); setNaverItems(items); setNaverStatus("success"); }
    catch (error) { if (signal?.aborted) return; setNaverStatus("error"); setErrorMessage(error instanceof Error ? error.message : "네이버 쇼핑 검색에 실패했습니다."); }
    finally { if (!signal?.aborted) dispatch({ type: "recommendations-settled" }); }
  }, [query]);

  useEffect(() => { const controller = new AbortController(); void loadNaver(controller.signal); return () => controller.abort(); }, [loadNaver]);

  const selectProduct = (product: SelectedShoppingProduct) => {
    onClearSupplementalMessages(); setQuestionOpen(false); setQuestionError(""); dispatch({ type: "select-product", product });
  };

  const selected = view.selectedProduct;
  const selectedInternal = selected?.source === "internal" ? selected.recommendation.product : selected?.matchedInternalProduct;
  const selectedCurrentPrice = selected ? (selected.source === "internal" ? selected.recommendation.product.currentPrice : selected.product.lowestPrice) : 0;
  const selectedCategory = selectedInternal?.categoryId ?? category;
  const priceRisePct = selected ? getSelectedPriceRisePct(selected) : null;
  const showAlternative = priceRisePct !== null && priceRisePct >= PRODUCT_DETAIL_SETTINGS.alternativeRecommendationThresholdPct;

  const appendActionExchange = (action: ProductDetailActionId, answer: string, metadata?: Record<string, unknown>) => {
    onAppendSupplementalMessage({ sender: "user", text: getProductDetailActionLabel(action) });
    onAppendSupplementalMessage({ sender: "ai", text: answer, metadata });
  };

  const handleAction = (action: ProductDetailActionId) => {
    if (!selected || !selectedCategory) return;
    if (action === "question") { setQuestionOpen(true); setQuestionError(""); return; }
    if (action === "promotion") {
      appendActionExchange(action, getUpcomingPromotionMessage({ categoryId: selectedCategory, currentPrice: selectedCurrentPrice, priceHistory: selectedInternal?.priceHistory ?? [] }));
      return;
    }
    if (action === "purchase-tip") { appendActionExchange(action, buildPurchaseTipMessage(selectedCategory)); return; }
    const alternatives = findAlternativeProducts({ selected, recommendations: result.recommendations ?? [] });
    const riseText = priceRisePct === null ? "현재 가격 상태를 충분히 계산하기 어렵지만" : `이 상품은 내부 가격 이력의 역대 최저가보다 현재 가격이 ${priceRisePct}% 높아요.`;
    appendActionExchange(action, alternatives.length ? `${riseText} 비슷한 조건이면서 현재 가격 부담이 낮은 상품을 찾아봤어요.` : `${riseText} 현재 조건을 유지하면서 가격이 더 유리한 대체 상품은 찾지 못했어요. 할인 시기를 기다리거나 조건 일부를 조정해보는 편이 좋아요.`, alternatives.length ? { alternatives } : undefined);
  };

  const handleQuestionSubmit = async (question: string, addUserMessage = true) => {
    if (!selected || questionLoading) return;
    if (addUserMessage) onAppendSupplementalMessage({ sender: "user", text: question });
    setQuestionLoading(true); setQuestionError("");
    try {
      const request = buildProductQuestionRequest({ selected, recommendations: result.recommendations ?? [], userCriteria: criteria });
      const response = await askProductQuestion({ ...request, question });
      onAppendSupplementalMessage({ sender: "ai", text: [response.answer, ...response.optionalWarnings].join("\n") });
      setQuestionOpen(false);
    } catch (error) {
      setQuestionError(error instanceof Error ? error.message : "AI 답변 요청에 실패했습니다.");
    } finally { setQuestionLoading(false); }
  };

  if (view.stage === "purchase-grade-diagnosis" && view.purchaseGradeInput) return <PurchaseGradeDiagnosis input={view.purchaseGradeInput} />;
  if (view.stage === "viewing-product-detail" && selected) {
    return <ProductDetailView selected={selected} internalRecommendations={result.recommendations ?? []} messages={supplementalMessages} showAlternative={showAlternative} questionOpen={questionOpen} questionLoading={questionLoading} questionError={questionError} onAction={handleAction} onQuestionSubmit={(question) => void handleQuestionSubmit(question)} onQuestionRetry={(question) => void handleQuestionSubmit(question, false)} onQuestionCancel={() => { setQuestionOpen(false); setQuestionError(""); }} onBack={() => { setQuestionOpen(false); onClearSupplementalMessages(); dispatch({ type: "back-to-list" }); }} onNext={() => dispatch({ type: "start-purchase-grade", input: startPurchaseGradeDiagnosis({ selected, recommendations: result.recommendations ?? [], userCriteria: criteria }) })} />;
  }

  return (
    <div className="w-full space-y-4" data-stage={view.stage}>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-xs font-black text-accent">상품을 직접 선택해주세요</p><h2 className="mt-1 text-base font-black text-primary">두 목록을 비교한 뒤 상세를 볼 상품을 골라주세요.</h2><p className="mt-2 text-xs text-muted-foreground">오른쪽은 “{query}” 검색어 기반 후보로, 내부 구매 조건이 검증된 결과가 아닙니다.</p></div>
      <div className="grid items-start gap-4 xl:grid-cols-2"><OptimizedRecommendationList items={result.recommendations ?? []} onSelect={(recommendation) => selectProduct({ source: "internal", recommendation })} /><NaverLowestPriceList items={naverItems} status={naverStatus} errorMessage={errorMessage} onRetry={() => void loadNaver()} onSelect={(product) => selectProduct({ source: "naver", product, matchedInternalProduct: matchInternalProduct(product, result.catalogProducts ?? []) })} /></div>
    </div>
  );
}
