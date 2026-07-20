import type { FlowAnswers } from "../../chat-flow/core/types";
import type { ProductCategoryId } from "../../product-catalog/core/types";
import type { SmartShoppingTimelineItem } from "../session/smartShoppingSessionTypes";
import type { SelectedShoppingProduct } from "../types/recommendation";

export interface ProductQuestionRequest {
  productId: string;
  categoryId: ProductCategoryId;
  question: string;
  criteria: FlowAnswers;
  recentTurns: Array<{ id: string; role: "user" | "assistant"; text: string }>;
}

export const buildProductQuestionRequest = ({ selected, userCriteria, timeline }: { selected: SelectedShoppingProduct; userCriteria: FlowAnswers; timeline: SmartShoppingTimelineItem[] }): Omit<ProductQuestionRequest, "question"> => {
  const product = selected.source === "internal" ? selected.recommendation.product : selected.matchedInternalProduct;
  return {
    productId: product?.id ?? "",
    categoryId: product?.categoryId ?? "tv",
    criteria: userCriteria,
    recentTurns: timeline
      .filter((item): item is Extract<SmartShoppingTimelineItem, { type: "user-text" | "assistant-text" }> => item.type === "user-text" || item.type === "assistant-text")
      .slice(-4)
      .map((item) => ({ id: item.id, role: item.type === "user-text" ? "user" : "assistant", text: item.text.slice(0, 600) })),
  };
};
