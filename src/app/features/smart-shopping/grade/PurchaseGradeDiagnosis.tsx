import React from "react";
import ChatMessage from "../../../components/features/chat/ChatMessage";
import type { PurchaseGradeDiagnosisInput } from "../types/recommendation";
import { PURCHASE_GRADE_DIAGNOSIS_START_MESSAGE } from "./startPurchaseGradeDiagnosis";

export default function PurchaseGradeDiagnosis({ input }: { input: PurchaseGradeDiagnosisInput }) {
  const name = input.selectedProduct.source === "internal" ? input.selectedProduct.recommendation.product.name : input.selectedProduct.product.title;
  return <div className="space-y-3" data-stage="purchase-grade-diagnosis"><ChatMessage sender="ai" text={PURCHASE_GRADE_DIAGNOSIS_START_MESSAGE} /><div className="rounded-xl border border-border bg-card p-4"><p className="text-xs font-black text-accent">구매등급진단 준비</p><h2 className="mt-1 text-base font-black text-primary">{name}</h2><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><p>조건 적합도: {input.score !== undefined ? `${input.score}점` : "검증 정보 없음"}</p><p>현재가: {input.currentPrice ? `${input.currentPrice.toLocaleString("ko-KR")}원` : "가격 정보 없음"}</p><p>최저가 대비: {input.priceRisePct !== null && input.priceRisePct !== undefined ? `${input.priceRisePct}%` : "계산 불가"}</p><p>추가비용: {input.additionalCostCheck}</p></div><p className="mt-3 text-xs text-muted-foreground">최종 골드·실버·브론즈 계산 기준은 아직 확정하지 않았습니다.</p></div></div>;
}
