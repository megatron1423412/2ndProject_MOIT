import React from "react";

export default function PurchaseLinkAction({ link, onCancel, isActive = true }: { link?: string; onCancel: () => void; isActive?: boolean }) {
  const targetLink = link || "https://shopping.naver.com/ns/home";
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm font-bold text-primary">네이버 쇼핑 판매 페이지로 이동할게요. 최종 결제 전 설치비와 판매 조건을 다시 확인해주세요.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!isActive} onClick={() => window.open(targetLink, "_blank", "noopener,noreferrer")} className="rounded-lg bg-brand-surface px-3 py-2 text-xs font-black text-brand-surface-foreground disabled:cursor-default disabled:opacity-60">구매 페이지 열기</button><button type="button" disabled={!isActive} onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-xs font-black text-primary disabled:cursor-default disabled:opacity-60">취소</button></div></div>;
}
