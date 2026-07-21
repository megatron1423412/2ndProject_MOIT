import React, { useState, useRef, useEffect } from "react";
import { summarizeStoredPriceHistory } from "../../product-catalog/core/priceHistory";
import type { PriceHistoryPoint } from "../../product-catalog/core/types";
import PriceHistoryChart from "./PriceHistoryChart";

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const signedWon = (value: number) => `${value > 0 ? "+" : ""}${won(value)}`;

export default function ProductDetailDataSections({
  productId,
  reviewSummary,
  strengths,
  currentPrice,
  currentPriceLabel,
  priceHistory,
}: {
  productId: string;
  reviewSummary: string | null;
  strengths: readonly string[];
  currentPrice: number;
  currentPriceLabel?: string;
  priceHistory: readonly PriceHistoryPoint[];
}) {
  const summary = summarizeStoredPriceHistory(currentPrice, priceHistory);
  const formattedReviewSummary = reviewSummary ? reviewSummary.replace(/,\s*/g, ", ") : null;

  const [priceCardHeight, setPriceCardHeight] = useState<number | null>(null);
  const priceCardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = priceCardRef.current;
    if (!el) return;
    const updateHeight = () => {
      const height = el.getBoundingClientRect().height;
      if (height > 0) {
        setPriceCardHeight(height);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="mt-3 rounded-lg bg-muted/30 p-3">
        <p className="text-[11px] font-black text-primary">AI 리뷰 요약</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{formattedReviewSummary ?? "저장된 AI 리뷰 요약이 없습니다."}</p>
      </section>
      <div className="mt-3 grid items-stretch gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.85fr)] md:grid-rows-[auto_auto]" data-detail-lower-grid>
        <div className="min-w-0 md:row-span-2" data-detail-chart-column>
          <PriceHistoryChart productId={productId} history={priceHistory} style={priceCardHeight ? { height: priceCardHeight } : undefined} />
        </div>
        <section className="rounded-lg border border-border p-3" data-strengths-card data-detail-right-top>
          <p className="text-[11px] font-black text-primary">장점</p>
          {strengths.length
            ? strengths.map((item) => <p key={item} className="mt-1 text-xs text-muted-foreground">+ {item}</p>)
            : <p className="mt-2 text-xs text-muted-foreground">등록된 장점 정보가 없습니다.</p>}
        </section>
        <section ref={priceCardRef} className="rounded-lg border border-border bg-muted/30 p-2.5" data-price-summary data-detail-right-bottom>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(8.5rem,auto)] items-baseline gap-x-5 gap-y-1.5" data-price-summary-grid>
            <PriceSummaryRow label="현재가" value={Number.isFinite(currentPrice) && currentPrice > 0 ? won(currentPrice) : "이용 불가"} sub={currentPriceLabel} />
            <PriceSummaryRow label="역대 최저가" value={summary ? won(summary.allTimeLow) : "이용 불가"} />
            <PriceSummaryRow label="최저가 대비" value={summary ? `${signedWon(summary.differenceFromLow)} (${summary.percentAboveLow}%)` : "이용 불가"} emphasized />
          </div>
        </section>
      </div>
    </>
  );
}

function PriceSummaryRow({ label, value, sub, emphasized = false }: { label: string; value: string; sub?: string; emphasized?: boolean }) {
  const color = emphasized ? "text-red-600 dark:text-red-400" : "text-primary";
  const displayLabel = label === "현재가" ? "현재 구매가" : label;
  const selfAlign = label === "현재가" ? "self-end" : "";

  let amount = value;
  let pct = "";
  if (label === "최저가 대비" && value.includes(" (") && value.endsWith(")")) {
    const parts = value.split(" (");
    amount = parts[0];
    pct = `(${parts[1]}`;
  }

  return (
    <>
      <p className={`text-left text-xs font-semibold ${color} ${selfAlign}`} data-price-summary-label={label}>{displayLabel}</p>
      <div className={`min-w-0 flex flex-col items-end text-right ${color}`} data-price-summary-value={label}>
        {sub && <p className="mb-0.5 text-[10px] text-muted-foreground">{sub}</p>}
        <p className="whitespace-nowrap text-sm font-black tabular-nums">{amount}</p>
        {pct && <p className="mt-0.5 text-[0.85em] font-black tabular-nums">{pct}</p>}
      </div>
    </>
  );
}
