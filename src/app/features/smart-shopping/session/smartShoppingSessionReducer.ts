import type { FlowAnswers } from "../../chat-flow/core/types";
import type { ProductCategoryId } from "../../product-catalog/core/types";
import type { SelectedShoppingProduct, SmartShoppingStage } from "../types/recommendation";
import type { RecommendationSnapshot, SmartShoppingSession, SmartShoppingTimelineItem } from "./smartShoppingSessionTypes";

export const createSmartShoppingSession = ({ categoryId, criteria }: { categoryId: ProductCategoryId; criteria: FlowAnswers }): SmartShoppingSession => ({
  sessionId: `${categoryId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  categoryId,
  criteria,
  currentStage: "loading-recommendations",
  timeline: [],
});

export type SmartShoppingSessionAction =
  | { type: "set-stage"; stage: SmartShoppingStage }
  | { type: "append"; item: SmartShoppingTimelineItem }
  | { type: "append-recommendation-list"; item: Extract<SmartShoppingTimelineItem, { type: "recommendation-list" }> }
  | { type: "append-action-group"; item: Extract<SmartShoppingTimelineItem, { type: "action-group" }> }
  | { type: "deactivate-interactions" }
  | { type: "select-product"; product: SelectedShoppingProduct };

const productId = (product: SelectedShoppingProduct) => product.source === "internal"
  ? product.recommendation.product.id
  : product.matchedInternalProduct?.id ?? `naver:${product.product.productId}`;

const deactivateInteractions = (timeline: SmartShoppingTimelineItem[]) => timeline.map((item) => {
  if (item.type === "action-group" || item.type === "question-input" || item.type === "purchase-link" || item.type === "price-alert-form") return { ...item, isActive: false };
  if (item.type === "recommendation-list") return { ...item, isActive: false };
  return item;
});

export const smartShoppingSessionReducer = (state: SmartShoppingSession, action: SmartShoppingSessionAction): SmartShoppingSession => {
  switch (action.type) {
    case "set-stage": return { ...state, currentStage: action.stage };
    case "append": return { ...state, timeline: [...state.timeline, action.item] };
    case "append-recommendation-list": return {
      ...state,
      recommendationSnapshot: action.item.snapshot,
      timeline: [...state.timeline.map((item) => item.type === "recommendation-list" ? { ...item, isActive: false } : item), action.item],
    };
    case "append-action-group": return {
      ...state,
      activeActionGroupId: action.item.id,
      timeline: [...state.timeline.map((item) => item.type === "action-group" ? { ...item, isActive: false } : item), action.item],
    };
    case "deactivate-interactions": return { ...state, activeActionGroupId: undefined, timeline: deactivateInteractions(state.timeline) };
    case "select-product": return { ...state, selectedProductId: productId(action.product) };
  }
};

export const updateRecommendationSnapshot = (snapshot: RecommendationSnapshot, updates: Partial<RecommendationSnapshot>): RecommendationSnapshot => ({ ...snapshot, ...updates });
