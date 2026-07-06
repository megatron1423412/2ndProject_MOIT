import React from "react";
import { Zap, CheckSquare, Calendar, TrendingDown } from "lucide-react";

interface SavingsReportCardProps {
  categoryLabel: string;
  currentSpending: number;
  recommendedAction: string;
  monthlySavings: number;
  yearlySavings: number;
  checklist: string[];
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function SavingsReportCard({
  categoryLabel,
  currentSpending,
  recommendedAction,
  monthlySavings,
  yearlySavings,
  checklist,
}: SavingsReportCardProps) {
  const afterSpending = currentSpending - monthlySavings;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm max-w-lg mb-2">
      {/* Card Header (Green Gradient) */}
      <div className="bg-gradient-to-r from-accent to-emerald-600 p-4 text-white">
        <div className="flex items-center gap-1.5 mb-1">
          <Zap size={14} className="text-yellow-300 animate-bounce" />
          <span className="text-[10px] font-bold uppercase tracking-wider">고정비 절약 리포트</span>
        </div>
        <h4 className="text-base font-black">{categoryLabel} 다이어트 결과</h4>
      </div>

      {/* Main Details */}
      <div className="p-4 space-y-4">
        {/* Savings Stats Grid */}
        <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3.5 rounded-xl border border-border/50">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">예상 월 절감액</span>
            <div className="flex items-baseline gap-0.5 text-accent font-black text-xl">
              <span>-{fmt(monthlySavings)}</span>
              <span className="text-xs font-bold">원</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block mb-0.5">연간 절약 예상</span>
            <div className="flex items-baseline gap-0.5 text-primary font-black text-xl">
              <span>{fmt(yearlySavings)}</span>
              <span className="text-xs font-bold">원</span>
            </div>
          </div>
        </div>

        {/* Current vs. After Spending */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-primary block">💰 지출 변화 요약</span>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">현재 지출액</span>
            <span className="text-primary font-bold">{fmt(currentSpending)}원/월</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-dashed border-border">
            <span className="text-muted-foreground font-semibold">절약 후 지출액</span>
            <span className="text-accent font-black">{fmt(afterSpending)}원/월</span>
          </div>
        </div>

        {/* Recommended Action */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-primary block">💡 권장 사항</span>
          <p className="text-xs text-muted-foreground leading-relaxed">{recommendedAction}</p>
        </div>

        {/* Action Items List */}
        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-[11px] font-bold text-primary flex items-center gap-1">
            <CheckSquare size={12} className="text-accent" />
            <span>오늘 바로 할 일</span>
          </span>
          <div className="flex flex-col gap-1.5">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-muted/20 p-2 rounded-lg border border-border/30">
                <span className="text-accent font-bold text-xs mt-0.5 flex-shrink-0">✓</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sync Status Banner */}
        <div className="bg-emerald-50 text-[10px] text-emerald-700 font-bold p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
          <span>⚡ 우측 진단 요약 패널에 자동 연동되었습니다</span>
          <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded">
            연동완료
          </span>
        </div>
      </div>
    </div>
  );
}
