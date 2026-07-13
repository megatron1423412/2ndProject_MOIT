import React from "react";

export default function PurchaseLinkAction({ link, onCancel }: { link?: string; onCancel: () => void }) {
  if (!link) return <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm font-bold text-muted-foreground">현재 연결 가능한 구매 링크가 없어요.</p><button type="button" onClick={onCancel} className="mt-3 rounded-lg border border-border px-3 py-2 text-xs font-black text-primary">선택 화면으로 돌아가기</button></div>;
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-sm font-bold text-primary">네이버 쇼핑 판매 페이지로 이동할게요. 최종 결제 전 설치비와 판매 조건을 다시 확인해주세요.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => window.open(link, "_blank", "noopener,noreferrer")} className="rounded-lg bg-brand-surface px-3 py-2 text-xs font-black text-brand-surface-foreground">구매 페이지 열기</button><button type="button" onClick={onCancel} className="rounded-lg border border-border px-3 py-2 text-xs font-black text-primary">취소</button></div></div>;
}
