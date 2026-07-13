import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { FlowAnswers, FlowResult } from "../../chat-flow/core/types";
import type { ProductCategoryId } from "../../product-catalog/core/types";
import { buildNaverSearchQuery } from "../naver/buildSearchQuery";
import { matchInternalProduct } from "../naver/matchInternalProduct";
import { fetchNaverShoppingProducts } from "../naver/naverShoppingClient";
import type { NaverShoppingProduct } from "../types/recommendation";
import { initialRecommendationViewState, recommendationViewReducer } from "../types/recommendation";
import NaverLowestPriceList from "./NaverLowestPriceList";
import OptimizedRecommendationList from "./OptimizedRecommendationList";
import ProductDetailView from "./ProductDetailView";

export default function RecommendationSelectionView({ result }: { result: FlowResult }) {
  const [view, dispatch] = useReducer(recommendationViewReducer, initialRecommendationViewState);
  const [naverItems, setNaverItems] = useState<NaverShoppingProduct[]>([]);
  const [naverStatus, setNaverStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const metadata = result.metadata as { category?: ProductCategoryId; answers?: FlowAnswers } | undefined;
  const category = metadata?.category;
  const query = useMemo(() => category ? buildNaverSearchQuery(category, metadata?.answers ?? {}) : "", [category, metadata?.answers]);

  const loadNaver = useCallback(async (signal?: AbortSignal) => {
    dispatch({ type: "start-loading" }); setNaverStatus("loading"); setErrorMessage("");
    try { const items = await fetchNaverShoppingProducts(query, signal); setNaverItems(items); setNaverStatus("success"); }
    catch (error) { if (signal?.aborted) return; setNaverStatus("error"); setErrorMessage(error instanceof Error ? error.message : "네이버 쇼핑 검색에 실패했습니다."); }
    finally { if (!signal?.aborted) dispatch({ type: "recommendations-settled" }); }
  }, [query]);

  useEffect(() => { const controller = new AbortController(); void loadNaver(controller.signal); return () => controller.abort(); }, [loadNaver]);

  if (view.stage === "viewing-product-detail" && view.selectedProduct) {
    return <ProductDetailView selected={view.selectedProduct} internalRecommendations={result.recommendations ?? []} onBack={() => dispatch({ type: "back-to-list" })} />;
  }

  return (
    <div className="w-full space-y-4" data-stage={view.stage}>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm"><p className="text-xs font-black text-accent">상품을 직접 선택해주세요</p><h2 className="mt-1 text-base font-black text-primary">두 목록을 비교한 뒤 상세를 볼 상품을 골라주세요.</h2><p className="mt-2 text-xs text-muted-foreground">오른쪽은 “{query}” 검색어 기반 후보로, 내부 구매 조건이 검증된 결과가 아닙니다.</p></div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <OptimizedRecommendationList items={result.recommendations ?? []} onSelect={(recommendation) => dispatch({ type: "select-product", product: { source: "internal", recommendation } })} />
        <NaverLowestPriceList items={naverItems} status={naverStatus} errorMessage={errorMessage} onRetry={() => void loadNaver()} onSelect={(product) => dispatch({ type: "select-product", product: { source: "naver", product, matchedInternalProduct: matchInternalProduct(product, result.catalogProducts ?? []) } })} />
      </div>
    </div>
  );
}
