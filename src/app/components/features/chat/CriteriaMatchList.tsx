import React from "react";
import { Check, CircleAlert } from "lucide-react";

export default function CriteriaMatchList({ matched, unmatched }: { matched: string[]; unmatched: string[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-400/10">
        <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">핵심 조건 충족</p>
        {matched.map((item) => <p key={item} className="mt-1 flex items-center gap-1 text-xs text-emerald-800 dark:text-emerald-200"><Check size={12} />{item}</p>)}
      </div>
      <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-400/10">
        <p className="text-[11px] font-black text-amber-700 dark:text-amber-300">미충족·확인 필요</p>
        {unmatched.length ? unmatched.map((item) => <p key={item} className="mt-1 flex items-center gap-1 text-xs text-amber-800 dark:text-amber-200"><CircleAlert size={12} />{item}</p>) : <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">별도 확인 항목 없음</p>}
      </div>
    </div>
  );
}
