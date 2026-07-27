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
  const formattedReviewSummary = reviewSummary ? reviewSummary.replace(/,\s*/g, ", ") : null;

  return (
    <>
      {/* 🎨 1. AI 리뷰 요약 섹션 (| ✧ AI 리뷰 요약) */}
      <section className="mt-5">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="h-4 w-1 rounded-full bg-[#1E3ABA]" />
          <svg className="h-4 w-4 text-[#1E3ABA]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h3 className="text-sm sm:text-base font-extrabold text-[#1E3ABA]">AI 리뷰 요약</h3>
        </div>

        <div className="rounded-2xl border border-slate-100/80 bg-[#F5F7FA] p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-[#1E3ABA] bg-white text-xs font-bold text-[#1E3ABA]">
              ✓
            </span>
            <p className="text-xs sm:text-sm font-[20px] text-slate-800">
              실사용자 <strong className="font-extrabold text-[#1E3ABA]">1,243건</strong> 분석 결과, 냉방·소음 만족도 <strong className="font-extrabold text-[#1E3ABA]">상위 8%</strong>
            </p>
          </div>

          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 pl-7.5">
            {formattedReviewSummary ? (
              `"${formattedReviewSummary}"`
            ) : (
              `"설치 다음날부터 조용하고, AI가 알아서 습도까지 잡아줘서 여름 내내 쾌적했어요." · 전기료는 전월 대비 -12% 언급 다수`
            )}
          </p>
        </div>
      </section>

      {/* 🎨 2. 하단 2컬럼 레이아웃: 역대 최저가 추이 & (장점 + 가격 요약) */}
      <div className="mt-4 grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1.3fr_1fr]" data-detail-lower-grid>
        {/* 좌측: 역대 최저가 추이 차트 */}
        <div className="min-w-0 flex flex-col h-full" data-detail-chart-column>
          <PriceHistoryChart productId={productId} history={priceHistory} />
        </div>

        {/* 우측: 장점 및 가격 요약 */}
        <div className="flex flex-col justify-between gap-3">
          {/* 2-1. 장점 카드 */}
          <section className="rounded-2xl border border-slate-100/90 bg-white p-4 shadow-2xs" data-strengths-card data-detail-right-top>
            <h4 className="mb-2.5 text-sm font-extrabold text-[#1F2937]">장점</h4>
            <div className="space-y-1.5">
              {strengths.length > 0 ? (
                strengths.map((item) => (
                  <p key={item} className="flex items-center text-xs sm:text-sm font-medium text-slate-700">
                    <span className="mr-1.5 font-bold text-[#4ADE80]">+</span> {item}
                  </p>
                ))
              ) : (
                <>
                  <p className="flex items-center text-xs sm:text-sm font-medium text-slate-700">
                    <span className="mr-1.5 font-bold text-[#4ADE80]">+</span> 초저소음·빠른 냉방
                  </p>
                  <p className="flex items-center text-xs sm:text-sm font-medium text-slate-700">
                    <span className="mr-1.5 font-bold text-[#4ADE80]">+</span> AI 절전 1등급 효율
                  </p>
                  <p className="flex items-center text-xs sm:text-sm font-medium text-slate-700">
                    <span className="mr-1.5 font-bold text-[#4ADE80]">+</span> 자동 건조·청정
                  </p>
                </>
              )}
            </div>
          </section>

          {/* 2-2. 가격 요약 카드 */}
          <section className="rounded-2xl border border-slate-100/90 bg-white p-4 shadow-2xs" data-price-summary data-detail-right-bottom>
            <h4 className="mb-2.5 text-sm font-extrabold text-[#1F2937]">가격 요약</h4>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">현재 구매가</span>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {Number.isFinite(currentPrice) && currentPrice > 0 ? won(currentPrice) : "이용 불가"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">역대 최저가</span>
                <span className="font-bold text-slate-700 text-sm sm:text-base">
                  {summary ? won(summary.allTimeLow) : "이용 불가"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">최저가 대비</span>
                {summary ? (
                  <span className="rounded-full bg-[#FFF1F1] px-2.5 py-0.5 text-[16px] sm:text-[16px] font-extrabold text-[#E53E3E]">
                    {signedWon(summary.differenceFromLow)}
                  </span>
                ) : (
                  <span className="text-slate-400 text-sm sm:text-base">이용 불가</span>
                )}
              </div>
            </div>
          </section>
        </div>
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
