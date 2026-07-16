import type { FlowAnswers } from "../../chat-flow/core/types";
import type { ProductCategoryId, ProductRecommendation, ProductSource } from "../../product-catalog/core/types";
import type { PurchaseGradeResult } from "../grade/calculatePurchaseGrade";
import type { NaverShoppingProduct, PurchaseGradeDiagnosisInput, SelectedShoppingProduct } from "../types/recommendation";
import type { ProductDetailSnapshot, RecommendationSnapshot, SmartShoppingTimelineItem, TimelineActionGroupKind, TimelineTextKind } from "../session/smartShoppingSessionTypes";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const timestamp = () => new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
let timelineSequence = 0;
const id = (sessionId: string) => `${sessionId}-timeline-${++timelineSequence}`;

const stableHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36);
};

export const createRecommendationSnapshotId = (query: string, recommendations: ProductRecommendation[]) =>
  `recommendation-${stableHash(`${query.trim().toLowerCase()}|${recommendations.map(({ product, score }) => `${product.id}:${score}`).join(",")}`)}`;

export const createRecommendationSnapshot = ({ query, recommendations, catalogSource, naverItems, naverStatus, naverErrorMessage }: { query: string; recommendations: ProductRecommendation[]; catalogSource: ProductSource; naverItems: NaverShoppingProduct[]; naverStatus: RecommendationSnapshot["naverStatus"]; naverErrorMessage: string }): RecommendationSnapshot => clone({ snapshotId: createRecommendationSnapshotId(query, recommendations), query, recommendations, catalogSource, naverItems, naverStatus, naverErrorMessage });

export const createProductDetailSnapshot = ({ categoryId, selected, internalRecommendations, showAlternative }: { categoryId: ProductCategoryId; selected: SelectedShoppingProduct; internalRecommendations: ProductRecommendation[]; showAlternative: boolean }): ProductDetailSnapshot => clone({ categoryId, selected, internalRecommendations, showAlternative });

export const createTextTimelineItem = (sessionId: string, type: TimelineTextKind, text: string, metadata?: Record<string, unknown>): SmartShoppingTimelineItem => ({ id: id(sessionId), type, text, timestamp: timestamp(), metadata: metadata ? clone(metadata) : undefined });

export const createRecommendationListTimelineItem = (sessionId: string, snapshot: RecommendationSnapshot): Extract<SmartShoppingTimelineItem, { type: "recommendation-list" }> => ({ id: `${sessionId}-${snapshot.snapshotId}`, type: "recommendation-list", snapshot: clone(snapshot), isActive: true });

export const createProductDetailTimelineItem = (sessionId: string, snapshot: ProductDetailSnapshot): Extract<SmartShoppingTimelineItem, { type: "product-detail" }> => ({ id: id(sessionId), type: "product-detail", snapshot: clone(snapshot) });

export const createActionGroupTimelineItem = (sessionId: string, group: TimelineActionGroupKind, showAlternative?: boolean): Extract<SmartShoppingTimelineItem, { type: "action-group" }> => ({ id: id(sessionId), type: "action-group", group, isActive: true, showAlternative });

export const createQuestionInputTimelineItem = (sessionId: string): Extract<SmartShoppingTimelineItem, { type: "question-input" }> => ({ id: id(sessionId), type: "question-input", isActive: true });

export const createPurchaseLinkTimelineItem = (sessionId: string, link?: string): Extract<SmartShoppingTimelineItem, { type: "purchase-link" }> => ({ id: id(sessionId), type: "purchase-link", link, isActive: true });

export const createPriceAlertTimelineItem = (sessionId: string, values: Omit<Extract<SmartShoppingTimelineItem, { type: "price-alert-form" }>, "id" | "type" | "isActive">): Extract<SmartShoppingTimelineItem, { type: "price-alert-form" }> => ({ id: id(sessionId), type: "price-alert-form", isActive: true, ...clone(values) });

export const createPurchaseGradeTimelineItem = (sessionId: string, input: PurchaseGradeDiagnosisInput, result: PurchaseGradeResult): Extract<SmartShoppingTimelineItem, { type: "purchase-grade-result" }> => ({ id: id(sessionId), type: "purchase-grade-result", input: clone(input), result: clone(result) });

/** Criteria are snapshotted together with the session and never rebuilt when stages change. */
export const createCriteriaSnapshot = (criteria: FlowAnswers): FlowAnswers => clone(criteria);
