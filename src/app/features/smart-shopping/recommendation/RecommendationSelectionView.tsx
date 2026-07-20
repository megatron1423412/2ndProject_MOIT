import React, { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import type { FlowAnswers, FlowResult } from "../../chat-flow/core/types";
import type { ProductCategoryId, ProductRecommendation } from "../../product-catalog/core/types";
import { catalogProducts, catalogSourceByCategory } from "../../product-catalog/data/productCatalog";
import { buildPurchaseTipMessage } from "../actions/buildPurchaseTipMessage";
import { findAlternativeProducts, getSelectedPriceRisePct } from "../actions/findAlternativeProducts";
import { getProductDetailActionLabel, type ProductDetailActionId } from "../actions/productDetailActions";
import { calculatePurchaseGrade } from "../grade/calculatePurchaseGrade";
import { startPurchaseGradeDiagnosis } from "../grade/startPurchaseGradeDiagnosis";
import { endSmartShoppingChat } from "../next-actions/endSmartShoppingChat";
import { getNextActionLabel, type NextActionId } from "../next-actions/nextActionOptions";
import { resolvePurchaseLink } from "../next-actions/resolvePurchaseLink";
import type { PriceAlertDraft } from "../price-alerts/types";
import { getUpcomingPromotionMessage } from "../promotions/getUpcomingPromotionMessage";
import { buildProductQuestionRequest } from "../product-detail/productQuestionContext";
import { askProductQuestion } from "../product-detail/productQuestionClient";
import { PRODUCT_DETAIL_SETTINGS } from "../product-detail/productDetailSettings";
import { createSmartShoppingSession, smartShoppingSessionReducer } from "../session/smartShoppingSessionReducer";
import type { RecommendationSnapshot, TimelineActionGroupKind } from "../session/smartShoppingSessionTypes";
import { createActionGroupTimelineItem, createCriteriaSnapshot, createPriceAlertTimelineItem, createProductDetailSnapshot, createProductDetailTimelineItem, createPurchaseGradeTimelineItem, createPurchaseLinkTimelineItem, createQuestionInputTimelineItem, createRecommendationListTimelineItem, createRecommendationSnapshot, createTextTimelineItem } from "../timeline/createTimelineSnapshot";
import type { SmartShoppingTimelineRenderModel } from "../timeline/SmartShoppingTimeline";
import type { NaverShoppingProduct, SelectedShoppingProduct } from "../types/recommendation";
import { initialRecommendationViewState, recommendationViewReducer } from "../types/recommendation";
import type { FavoriteDraft, FavoriteProduct } from "../../favorites/types";
import { createFavoriteDraft } from "../../favorites/createFavoriteDraft";
import { getFavoriteProductIdentity } from "../../favorites/favoriteIdentity";
import { createDummyCatalogRecommendation, selectDummyNaverProducts } from "./selectDummyNaverProducts";

interface Props {
  result: FlowResult;
  onEndSmartShoppingChat: () => void;
  onCreatePriceAlert: (draft: PriceAlertDraft) => unknown;
  onTimelineChange?: () => void;
  userId: string;
  favorites: FavoriteProduct[];
  onToggleFavorite: (draft: FavoriteDraft) => void;
  renderTimeline: (model: SmartShoppingTimelineRenderModel) => React.ReactNode;
}

export default function RecommendationSelectionView({ result, onEndSmartShoppingChat, onCreatePriceAlert, onTimelineChange, userId, favorites, onToggleFavorite, renderTimeline }: Props) {
  const metadata = result.metadata as { category?: ProductCategoryId; answers?: FlowAnswers; overBudgetRecommendations?: ProductRecommendation[] } | undefined;
  const category = metadata?.category ?? "tv";
  const catalogSource = catalogSourceByCategory[category];
  const criteria = metadata?.answers ?? {};
  const [view, dispatch] = useReducer(recommendationViewReducer, initialRecommendationViewState);
  const [session, sessionDispatch] = useReducer(smartShoppingSessionReducer, { categoryId: category, criteria: createCriteriaSnapshot(criteria) }, createSmartShoppingSession);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [questionError, setQuestionError] = useState("");
  const [returnActionGroup, setReturnActionGroup] = useState<TimelineActionGroupKind>("next");
  const [showedOverBudget, setShowedOverBudget] = useState(false);
  const [activeRecommendations, setActiveRecommendations] = useState(result.recommendations ?? []);
  const favoriteIdentities = useMemo(() => new Set(favorites.map(getFavoriteProductIdentity)), [favorites]);

  useEffect(() => { sessionDispatch({ type: "set-stage", stage: view.stage }); }, [view.stage]);
  useEffect(() => { if (session.timeline.length) onTimelineChange?.(); }, [session.timeline.length, onTimelineChange]);

  const appendText = useCallback((type: "user-action" | "user-text" | "assistant-text", text: string, itemMetadata?: Record<string, unknown>) => {
    sessionDispatch({ type: "append", item: createTextTimelineItem(session.sessionId, type, text, itemMetadata) });
  }, [session.sessionId]);
  const appendActionGroup = useCallback((group: TimelineActionGroupKind, showAlternative?: boolean) => {
    sessionDispatch({ type: "append-action-group", item: createActionGroupTimelineItem(session.sessionId, group, showAlternative) });
  }, [session.sessionId]);
  const appendRecommendation = useCallback((snapshot: RecommendationSnapshot) => {
    sessionDispatch({ type: "append-recommendation-list", item: createRecommendationListTimelineItem(session.sessionId, snapshot) });
  }, [session.sessionId]);

  const snapshotRecommendations = useCallback((recommendations: ProductRecommendation[]) => {
    appendRecommendation(createRecommendationSnapshot({
      categoryId: category,
      recommendations,
      catalogSource,
      dummyProducts: selectDummyNaverProducts(catalogProducts, category, recommendations),
    }));
  }, [appendRecommendation, category, catalogSource]);

  useEffect(() => {
    dispatch({ type: "start-loading" });
    snapshotRecommendations(activeRecommendations);
    dispatch({ type: "recommendations-settled" });
  }, [snapshotRecommendations]);

  useEffect(() => {
    if (view.stage !== "grading-purchase") return;
    const gradeResult = calculatePurchaseGrade(view.purchaseGradeInput.currentPrice, view.purchaseGradeInput.allTimeLow);
    sessionDispatch({ type: "append", item: createPurchaseGradeTimelineItem(session.sessionId, view.purchaseGradeInput, gradeResult) });
    appendActionGroup("grade-followup");
    dispatch({ type: "complete-purchase-grade", result: gradeResult });
  }, [appendActionGroup, session.sessionId, view]);

  const selected = view.selectedProduct;
  const selectedInternal = selected?.source === "internal" ? selected.recommendation.product : selected?.matchedInternalProduct;
  const selectedCurrentPrice = selected ? (selected.source === "internal" ? selected.recommendation.product.currentPrice : selected.product.lowestPrice) : 0;
  const selectedCategory = selectedInternal?.categoryId ?? category;
  const priceRisePct = selected ? getSelectedPriceRisePct(selected) : null;
  const showAlternative = priceRisePct !== null && priceRisePct >= PRODUCT_DETAIL_SETTINGS.alternativeRecommendationThresholdPct;

  const selectProduct = (product: SelectedShoppingProduct) => {
    const name = product.source === "internal" ? product.recommendation.product.name : product.product.title;
    const productAlternative = getSelectedPriceRisePct(product);
    const productShowAlternative = productAlternative !== null && productAlternative >= PRODUCT_DETAIL_SETTINGS.alternativeRecommendationThresholdPct;
    sessionDispatch({ type: "deactivate-interactions" });
    sessionDispatch({ type: "select-product", product });
    appendText("user-action", `${name} 상품 선택`);
    sessionDispatch({ type: "append", item: createProductDetailTimelineItem(session.sessionId, createProductDetailSnapshot({ categoryId: category, selected: product, internalRecommendations: activeRecommendations, showAlternative: productShowAlternative })) });
    appendActionGroup("detail", productShowAlternative);
    setQuestionError("");
    dispatch({ type: "select-product", product });
  };

  const backToList = () => {
    sessionDispatch({ type: "deactivate-interactions" });
    appendText("user-action", "목록 다시 보기");
    appendText("assistant-text", "이전에 확인한 조건으로 상품 목록을 다시 보여드릴게요.");
    const reusableSnapshot = session.recommendationSnapshot ?? createRecommendationSnapshot({ categoryId: category, recommendations: activeRecommendations, catalogSource, dummyProducts: selectDummyNaverProducts(catalogProducts, category, activeRecommendations) });
    appendRecommendation(reusableSnapshot);
    setQuestionError("");
    dispatch({ type: "back-to-list" });
  };

  const handleDetailAction = (action: ProductDetailActionId) => {
    if (!selected || !selectedCategory) return;
    if (action === "question") {
      sessionDispatch({ type: "deactivate-interactions" });
      appendText("user-action", getProductDetailActionLabel(action));
      sessionDispatch({ type: "append", item: createQuestionInputTimelineItem(session.sessionId) });
      setQuestionError("");
      return;
    }
    appendText("user-action", getProductDetailActionLabel(action));
    if (action === "promotion") appendText("assistant-text", getUpcomingPromotionMessage({ categoryId: selectedCategory, currentPrice: selectedCurrentPrice, priceHistory: selectedInternal?.priceHistory ?? [] }));
    else if (action === "purchase-tip") appendText("assistant-text", buildPurchaseTipMessage(selectedCategory));
    else {
      const alternatives = findAlternativeProducts({ selected, recommendations: activeRecommendations });
      const riseText = priceRisePct === null ? "현재 가격 상태를 충분히 계산하기 어렵지만" : `이 상품은 내부 가격 이력의 역대 최저가보다 현재 가격이 ${priceRisePct}% 높아요.`;
      appendText("assistant-text", alternatives.length ? `${riseText} 비슷한 조건이면서 현재 가격 부담이 낮은 상품을 찾아봤어요.` : `${riseText} 현재 조건을 유지하면서 가격이 더 유리한 대체 상품은 찾지 못했어요. 할인 시기를 기다리거나 조건 일부를 조정해보는 편이 좋아요.`, alternatives.length ? { alternatives } : undefined);
    }
    appendActionGroup("detail", showAlternative);
  };

  const handleQuestionSubmit = async (question: string, addUserMessage = true) => {
    if (!selected || questionLoading) return;
    if (addUserMessage) appendText("user-text", question);
    setQuestionLoading(true); setQuestionError("");
    try {
      const request = buildProductQuestionRequest({ selected, recommendations: activeRecommendations, userCriteria: criteria });
      const response = await askProductQuestion({ ...request, question });
      appendText("assistant-text", [response.answer, ...response.optionalWarnings].join("\n"));
      appendActionGroup("detail", showAlternative);
    } catch (error) {
      setQuestionError(error instanceof Error ? error.message : "AI 답변 요청에 실패했습니다.");
    } finally { setQuestionLoading(false); }
  };

  const nextStep = () => {
    if (!selected) return;
    appendText("user-action", "다음 단계로");
    appendText("assistant-text", "이 상품으로 무엇을 해볼까요? 원하는 다음 단계를 선택해주세요.");
    appendActionGroup("next");
    dispatch({ type: "choose-next-action" });
  };

  const returnToActions = (group = returnActionGroup) => {
    sessionDispatch({ type: "deactivate-interactions" });
    appendActionGroup(group);
    dispatch({ type: "return-to-next-actions" });
  };

  const handleNextAction = (action: NextActionId) => {
    if (!selected) return;
    if (action === "back-to-list") return backToList();
    if (action === "end-chat") { appendText("user-action", getNextActionLabel(action)); return endSmartShoppingChat(onEndSmartShoppingChat); }
    const group = view.stage === "grade-complete" ? "grade-followup" : "next";
    setReturnActionGroup(group);
    sessionDispatch({ type: "deactivate-interactions" });
    appendText("user-action", getNextActionLabel(action));
    if (action === "purchase-grade") return dispatch({ type: "start-purchase-grade", input: startPurchaseGradeDiagnosis({ selected, recommendations: activeRecommendations, userCriteria: criteria }) });
    if (action === "purchase-link") {
      const purchaseLink = resolvePurchaseLink(selected, []);
      sessionDispatch({ type: "append", item: createPurchaseLinkTimelineItem(session.sessionId, purchaseLink) });
      return dispatch({ type: "confirm-purchase-link", purchaseLink });
    }
    const product = selected.source === "internal" ? selected.recommendation.product : selected.matchedInternalProduct;
    const currentPrice = selected.source === "internal" ? selected.recommendation.product.currentPrice : selected.product.lowestPrice;
    const allTimeLow = product?.priceHistory.length ? Math.min(...product.priceHistory.map((point) => point.lowestPrice)) : undefined;
    sessionDispatch({ type: "append", item: createPriceAlertTimelineItem(session.sessionId, { productName: product?.name ?? (selected.source === "naver" ? selected.product.title : "상품명 없음"), currentPrice, allTimeLow }) });
    dispatch({ type: "set-price-alert" });
  };

  const savePriceAlert = (targetPrice: number) => {
    if (!selected) return;
    const product = selected.source === "internal" ? selected.recommendation.product : selected.matchedInternalProduct;
    const currentPrice = selected.source === "internal" ? selected.recommendation.product.currentPrice : selected.product.lowestPrice;
    const productId = product?.id ?? `naver:${selected.source === "naver" ? selected.product.productId : "unknown"}`;
    const productName = product?.name ?? (selected.source === "naver" ? selected.product.title : "상품명 없음");
    onCreatePriceAlert({ userId, productId, productName, modelNumber: product?.modelNumber, source: selected.source, purchaseLink: resolvePurchaseLink(selected, []), currentPrice, targetPrice, active: true });
    appendText("assistant-text", `${productName}의 목표 가격을 ${targetPrice.toLocaleString("ko-KR")}원으로 저장했어요. 상시 감시는 아직 연결되지 않았으며, 가격을 다시 확인할 때 조건을 평가합니다.`);
    returnToActions();
  };

  const cancelPurchaseLink = () => { appendText("user-action", "취소"); appendText("assistant-text", "구매 링크 연결을 취소했어요."); returnToActions(); };
  const cancelPriceAlert = () => { appendText("user-action", "취소"); appendText("assistant-text", "최저가 알람 설정을 취소했어요."); returnToActions(); };

  const favoriteDraftFor = (selectedProduct: SelectedShoppingProduct) => createFavoriteDraft({ userId, categoryId: category, selected: selectedProduct, naverItems: [] });

  const showClosestOverBudget = () => {
    const alternatives = metadata?.overBudgetRecommendations ?? [];
    if (!alternatives.length || showedOverBudget) return;
    sessionDispatch({ type: "deactivate-interactions" });
    appendText("user-action", "예산 초과가 가장 적은 상품 보기");
    appendText("assistant-text", "타입·냉방 면적·인버터·판매 상태는 그대로 유지하고, 제품 가격 예산만 초과한 가까운 상품을 보여드릴게요.");
    appendRecommendation(createRecommendationSnapshot({ categoryId: category, recommendations: alternatives, catalogSource, dummyProducts: selectDummyNaverProducts(catalogProducts, category, alternatives) }));
    setActiveRecommendations(alternatives);
    setShowedOverBudget(true);
  };

  return renderTimeline({
    timeline: session.timeline,
    showClosestOverBudget: !showedOverBudget && (metadata?.overBudgetRecommendations?.length ?? 0) > 0,
    onShowClosestOverBudget: showClosestOverBudget,
    questionLoading,
    questionError,
    onSelectRecommendation: (recommendation) => selectProduct({ source: "internal", recommendation }),
    onSelectDummyProduct: (product) => selectProduct({ source: "internal", recommendation: createDummyCatalogRecommendation(product) }),
    onDetailAction: handleDetailAction,
    onBackToList: backToList,
    onNextStep: nextStep,
    onQuestionSubmit: (question) => void handleQuestionSubmit(question),
    onQuestionRetry: (question) => void handleQuestionSubmit(question, false),
    onQuestionCancel: () => { sessionDispatch({ type: "deactivate-interactions" }); appendText("user-action", "질문 입력 취소"); appendActionGroup("detail", showAlternative); },
    onNextAction: handleNextAction,
    onCancelPurchaseLink: cancelPurchaseLink,
    onSavePriceAlert: savePriceAlert,
    onCancelPriceAlert: cancelPriceAlert,
    isFavorite: (selectedProduct) => favoriteIdentities.has(getFavoriteProductIdentity(favoriteDraftFor(selectedProduct))),
    onToggleFavorite: (selectedProduct) => onToggleFavorite(favoriteDraftFor(selectedProduct)),
  });
}
