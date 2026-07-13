import React from "react";
import { getVisibleNextActionOptions, type NextActionId } from "./nextActionOptions";

export default function NextActionSelection({ onSelect, showPurchaseGrade = true, isActive = true }: { onSelect: (action: NextActionId) => void; showPurchaseGrade?: boolean; isActive?: boolean }) {
  const visibleOptions = getVisibleNextActionOptions(showPurchaseGrade);
  const primary = visibleOptions.find((option) => option.primary);
  const secondary = visibleOptions.filter((option) => !option.primary);
  return <div className="space-y-3" data-stage="choosing-next-action">{showPurchaseGrade && <p className="text-sm font-bold text-primary">이 상품으로 무엇을 해볼까요? 원하는 다음 단계를 선택해주세요.</p>}{primary && <button type="button" aria-label="구매등급진단" disabled={!isActive} onClick={() => onSelect(primary.id)} className="w-full rounded-xl border-2 border-emerald-500 bg-emerald-50 p-5 text-left shadow-sm transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-default disabled:opacity-60 dark:bg-emerald-400/10 dark:hover:bg-emerald-400/15"><p className="text-lg font-black text-emerald-800 dark:text-emerald-200">{primary.label}</p><p className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">{primary.description}</p></button>}<div className="flex flex-wrap gap-2">{secondary.map((item) => <button key={item.id} type="button" disabled={!isActive} onClick={() => onSelect(item.id)} className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-black text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-default disabled:opacity-60">{item.label}</button>)}</div></div>;
}
