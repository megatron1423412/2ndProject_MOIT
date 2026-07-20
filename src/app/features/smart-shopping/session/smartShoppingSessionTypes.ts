import type { FlowAnswers } from "../../chat-flow/core/types";
import type { CatalogProduct, ProductCategoryId, ProductRecommendation, ProductSource } from "../../product-catalog/core/types";
import type { PurchaseGradeResult } from "../grade/calculatePurchaseGrade";
import type { PurchaseGradeDiagnosisInput, SelectedShoppingProduct, SmartShoppingStage } from "../types/recommendation";

export type TimelineTextKind = "user-action" | "user-text" | "assistant-text";
export type TimelineActionGroupKind = "detail" | "next" | "grade-followup";

export interface RecommendationSnapshot {
  snapshotId: string;
  categoryId: ProductCategoryId;
  recommendations: ProductRecommendation[];
  catalogSource: ProductSource;
  dummyProducts: CatalogProduct[];
}

export interface ProductDetailSnapshot {
  categoryId: ProductCategoryId;
  selected: SelectedShoppingProduct;
  internalRecommendations: ProductRecommendation[];
  showAlternative: boolean;
}

export type SmartShoppingTimelineItem =
  | { id: string; type: TimelineTextKind; text: string; timestamp: string; metadata?: Record<string, unknown> }
  | { id: string; type: "recommendation-list"; snapshot: RecommendationSnapshot; isActive: boolean }
  | { id: string; type: "product-detail"; snapshot: ProductDetailSnapshot }
  | { id: string; type: "action-group"; group: TimelineActionGroupKind; isActive: boolean; showAlternative?: boolean }
  | { id: string; type: "question-input"; isActive: boolean }
  | { id: string; type: "purchase-link"; link?: string; isActive: boolean }
  | { id: string; type: "price-alert-form"; productName: string; currentPrice: number; allTimeLow?: number; isActive: boolean }
  | { id: string; type: "purchase-grade-result"; input: PurchaseGradeDiagnosisInput; result: PurchaseGradeResult };

export interface SmartShoppingSession {
  sessionId: string;
  categoryId: ProductCategoryId;
  criteria: FlowAnswers;
  currentStage: SmartShoppingStage;
  timeline: SmartShoppingTimelineItem[];
  recommendationSnapshot?: RecommendationSnapshot;
  selectedProductId?: string;
  activeActionGroupId?: string;
}
