import React from "react";
import { CheckCircle2, ClipboardCheck, Star, TrendingDown } from "lucide-react";
import type { DiagnosisItem, LivingCostDiagnosisResult, ProductDiagnosisResult } from "../data";

interface DiagnosisResultCardProps {
  item: DiagnosisItem;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function DiagnosisResultCard({ item }: DiagnosisResultCardProps) {
  if (item.result.type === "living") {
    return <LivingResultCard result={item.result} />;
  }

  return <ProductResultCard result={item.result} />;
}

function ProductResultCard({ result }: { result: ProductDiagnosisResult }) {
  return (
    <div className="w-full max-w-xl rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-accent">소비 최적화 진단</p>
          <h3 className="mt-1 text-base font-black text-primary">{result.headline}</h3>
        </div>
        <span className="rounded-lg bg-primary px-3 py-1.5 text-sm font-black text-white">
          {result.valueGrade}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Metric icon={<TrendingDown size={15} />} label="시세 기준" value={result.fairPrice} />
        <Metric icon={<Star size={15} />} label="시장 신호" value={result.marketSignal} />
        <Metric icon={<CheckCircle2 size={15} />} label="리뷰/평점" value={result.reviewSignal} />
        <Metric icon={<ClipboardCheck size={15} />} label="사용 목적" value={result.fitSignal} />
      </div>
      <div className="mt-4 rounded-lg bg-muted/35 p-3">
        <p className="text-xs font-black text-primary">구매 전 확인</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {result.nextChecks.map((check) => (
            <p key={check} className="text-xs leading-relaxed text-muted-foreground">
              - {check}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function LivingResultCard({ result }: { result: LivingCostDiagnosisResult }) {
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="bg-accent p-5 text-white">
        <p className="text-xs font-black text-white/75">생활비 절감 리포트</p>
        <h3 className="mt-1 text-base font-black">{result.headline}</h3>
      </div>
      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/35 p-3">
            <p className="text-[11px] font-bold text-muted-foreground">예상 월 절감액</p>
            <p className="mt-1 text-lg font-black text-accent">{fmt(result.monthlySavings)}원</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/35 p-3">
            <p className="text-[11px] font-bold text-muted-foreground">연간 환산</p>
            <p className="mt-1 text-lg font-black text-primary">{fmt(result.yearlySavings)}원</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/35 p-3">
            <p className="text-[11px] font-bold text-muted-foreground">진단 등급</p>
            <p className="mt-1 text-sm font-black text-primary">{result.grade}</p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-border p-3">
          <p className="text-xs font-black text-primary">확인 필요 사항</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {result.checks.map((check) => (
              <p key={check} className="text-xs leading-relaxed text-muted-foreground">
                - {check}
              </p>
            ))}
          </div>
        </div>
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-bold leading-relaxed text-amber-800">
          {result.caution}
        </p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/25 p-3">
      <div className="flex items-center gap-1.5 text-accent">
        {icon}
        <span className="text-[11px] font-black">{label}</span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{value}</p>
    </div>
  );
}
