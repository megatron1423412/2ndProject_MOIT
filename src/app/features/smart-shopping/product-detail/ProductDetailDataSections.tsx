import React from "react";
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
  return (
    <>
      <section className="mt-3 rounded-lg bg-muted/30 p-3">
        <p className="text-[11px] font-black text-primary">AI 리뷰 요약</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{reviewSummary ?? "저장된 AI 리뷰 요약이 없습니다."}</p>
      </section>
      <div className="mt-3 grid items-start gap-3 md:grid-cols-2" data-detail-strengths-chart-row>
        <section className="rounded-lg border border-border p-3" data-strengths-card>
          <p className="text-[11px] font-black text-primary">장점</p>
          {strengths.length
            ? strengths.map((item) => <p key={item} className="mt-1 text-xs text-muted-foreground">+ {item}</p>)
            : <p className="mt-2 text-xs text-muted-foreground">등록된 장점 정보가 없습니다.</p>}
        </section>
        <PriceHistoryChart productId={productId} history={priceHistory} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" data-price-summary>
        <PriceMetric label="현재가" value={Number.isFinite(currentPrice) && currentPrice > 0 ? won(currentPrice) : "이용 불가"} sub={currentPriceLabel} />
        <PriceMetric label="역대 최저가" value={summary ? won(summary.allTimeLow) : "이용 불가"} />
        <PriceMetric label="평균가" value={summary ? won(summary.averagePrice) : "이용 불가"} />
        <PriceMetric label="최저가 대비" value={summary ? `${signedWon(summary.differenceFromLow)} (${summary.percentAboveLow}%)` : "이용 불가"} />
      </div>
    </>
  );
}

function PriceMetric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-lg bg-muted/30 p-3"><p className="text-[10px] font-bold text-muted-foreground">{label}</p><p className="mt-1 text-xs font-black text-primary">{value}</p>{sub && <p className="mt-1 text-[9px] text-muted-foreground">{sub}</p>}</div>;
}
