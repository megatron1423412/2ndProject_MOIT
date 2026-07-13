import React from "react";
import { CheckCircle2, ClipboardCheck, Star, TriangleAlert } from "lucide-react";
import type { FlowResult } from "../../../features/chat-flow/core/types";
import RecommendationSelectionView from "../../../features/smart-shopping/recommendation/RecommendationSelectionView";
import type { ChatFlowMessage } from "../../../features/chat-flow/core/types";
import type { PriceAlertDraft } from "../../../features/smart-shopping/price-alerts/types";

interface DiagnosisResultCardProps {
  result: FlowResult;
  supplementalMessages?: ChatFlowMessage[];
  onAppendSupplementalMessage?: (message: { sender: "ai" | "user"; text: string; metadata?: Record<string, unknown> }) => void;
  onClearSupplementalMessages?: () => void;
  onEndSmartShoppingChat?: () => void;
  onCreatePriceAlert?: (draft: PriceAlertDraft) => unknown;
  userId?: string;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function DiagnosisResultCard({ result, supplementalMessages = [], onAppendSupplementalMessage, onClearSupplementalMessages, onEndSmartShoppingChat, onCreatePriceAlert, userId }: DiagnosisResultCardProps) {
  if (result.recommendations) {
    return <RecommendationSelectionView result={result} supplementalMessages={supplementalMessages} onAppendSupplementalMessage={onAppendSupplementalMessage ?? (() => {})} onClearSupplementalMessages={onClearSupplementalMessages ?? (() => {})} onEndSmartShoppingChat={onEndSmartShoppingChat ?? (() => {})} onCreatePriceAlert={onCreatePriceAlert ?? (() => {})} userId={userId ?? "mock-user"} />;
  }
  return (
    <div className="w-full max-w-xl rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black text-accent">MOIT mock 진단</p>
          <h3 className="mt-1 text-base font-black text-primary">{result.title}</h3>
        </div>
        {result.grade && <span className="rounded-lg bg-brand-surface px-3 py-1.5 text-sm font-black text-brand-surface-foreground">{result.grade}</span>}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {result.monthlySaving !== undefined && <Metric icon={<Star size={15} />} label="예상 월 절감액" value={`${fmt(result.monthlySaving)}원`} />}
        {result.yearlySaving !== undefined && <Metric icon={<Star size={15} />} label="연간 환산" value={`${fmt(result.yearlySaving)}원`} />}
        {result.score !== undefined && <Metric icon={<Star size={15} />} label="mock 적합도" value={`${result.score}점`} />}
        {result.metrics?.map((metric) => <Metric key={metric.label} icon={<CheckCircle2 size={15} />} label={metric.label} value={metric.value} />)}
      </div>
      <div className="mt-4 rounded-lg bg-muted/35 p-3">
        <p className="text-xs font-black text-primary">핵심 요약</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {result.highlights.map((item) => <p key={item} className="text-xs leading-relaxed text-muted-foreground">- {item}</p>)}
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-border p-3">
        <p className="flex items-center gap-1.5 text-xs font-black text-primary"><TriangleAlert size={14} />확인 필요</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {result.warnings.map((item) => <p key={item} className="text-xs leading-relaxed text-muted-foreground">- {item}</p>)}
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-muted/35 p-3">
        <p className="flex items-center gap-1.5 text-xs font-black text-primary"><ClipboardCheck size={14} />다음 행동</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {result.recommendedActions.map((item) => <p key={item} className="text-xs leading-relaxed text-muted-foreground">- {item}</p>)}
        </div>
      </div>
      <p className="mt-3 rounded-lg bg-amber-100 p-3 text-xs font-bold leading-relaxed text-amber-800 dark:bg-amber-300/15 dark:text-amber-200">{result.mockNotice}</p>
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
