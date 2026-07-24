// src/app/features/smart-shopping/grade/PurchaseGradeResultCard.tsx

import React from "react";
import { AlertTriangle } from "lucide-react";
import type { PurchaseGradeDiagnosisInput } from "../types/recommendation";
import type { PurchaseGradeResult } from "./calculatePurchaseGrade";
import PurchaseGradeShareButton from "../share/PurchaseGradeShareButton";
import { collectAppliancesGradeReportData } from "./collectAppliancesGradeReportData";

interface PurchaseGradeResultCardProps {
  input: PurchaseGradeDiagnosisInput;
  result: PurchaseGradeResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function PurchaseGradeResultCard({ input, result }: PurchaseGradeResultCardProps) {
  // 1. 흩어진 등급 진단 데이터 수집 및 단일 표준 객체 변환
  const data = collectAppliancesGradeReportData(input, result);
  const { gradeInfo } = data;

  return (
    // 2. 대표 GradeReport 규격 (BundleGradeReport.tsx와 100% 동일한 레이아웃 및 디자인)
    <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-md transition-all hover:shadow-lg relative flex flex-col gap-5 ${gradeInfo.theme.bg} ${gradeInfo.theme.border}`}>

      {/* 카드 오른쪽 상단 공유 버튼 */}
      <div className="absolute right-4 top-4 z-20">
        <PurchaseGradeShareButton />
      </div>

      {/* 1. Header (메달 아이콘 + 등급 + 동적 서브타이틀) */}
      <div className="flex flex-col items-center text-center gap-1 border-b border-border/40 pb-4">
        <span className="rounded-full bg-[#1E3ABA]/10 px-2.5 py-0.5 text-[9px] font-black text-[#1E3ABA] uppercase">
          소비 패턴 분석
        </span>
        <h3 className="text-base font-black tracking-tight text-primary">
          나의 가전 구매 소비 등급
        </h3>

        <div className="mt-4 flex flex-col items-center justify-center">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-inner ring-8 ${gradeInfo.theme.ring} animate-pulse`}>
            <img src={gradeInfo.iconSrc} alt={gradeInfo.label} className="h-16 w-16 object-contain select-none" />
          </div>
          <span className={`mt-3 text-lg font-black tracking-tight ${gradeInfo.theme.text}`}>
            {gradeInfo.label}
          </span>
          <span className="text-xs text-muted-foreground font-extrabold mt-1">
            {gradeInfo.subLabel}
          </span>
        </div>
      </div>

      {/* 2. 진단 소견 카드 (핵심 통일 영역: 절약액 & 프로그레스 바 + 종합 진단 소견) */}
      <div className="rounded-xl bg-background/60 border border-border/40 p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-black text-muted-foreground truncate" title={data.productName}>
            {data.productName} ({data.modelNumber})
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm font-black text-[#1E3ABA]">
              {data.currentPrice > 0 ? `현재가 ${fmt(data.currentPrice)}원` : "가격 정보 확인 중"}
            </p>
            {data.savingPercent > 0 && (
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                {data.savingPercent}% 가성비
              </span>
            )}
          </div>
          {data.allTimeLow ? (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              (역대 최저가: 약 {fmt(data.allTimeLow)}원
              {data.savingAmount > 0 ? ` / ${fmt(data.savingAmount)}원 차이` : ""})
            </p>
          ) : (
            <p className="text-xs font-medium text-muted-foreground">
              (역대 최저가 기록 정보 대기 중)
            </p>
          )}
        </div>

        {/* 가성비 프로그레스 바 */}
        {data.savingPercent > 0 && (
          <div className="flex flex-col gap-1 pt-1">
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${gradeInfo.theme.bar} transition-all duration-500`}
                style={{ width: `${Math.min(100, data.savingPercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* 그래프 아래 배치된 종합 진단 소견 타이틀 및 연속 본문 */}
        <div className="flex flex-col gap-2 pt-3 border-t border-border/30 mt-1 text-xs">
          <span className="text-xs font-black text-primary">💡 모잇의 종합 진단 소견</span>
          <div className="flex flex-col gap-2 text-primary/90 font-medium leading-relaxed">
            <p>{gradeInfo.feature}</p>
            <p className="font-bold text-[#1E3ABA] text-[11.5px]">{gradeInfo.status}</p>
            <p>{gradeInfo.scenario}</p>
          </div>
        </div>
      </div>

      {/* 3. 추가비용 및 주의 안내 카드 */}
      {data.additionalCostCheck && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle size={15} className="shrink-0" />
            <span>구매 및 추가비용 주의 안내</span>
          </div>
          <p className="text-muted-foreground font-medium text-[11.5px] leading-snug">
            {data.additionalCostCheck} — 최종 결제 전 배송비, 설치비 및 특수 조건 여부를 꼭 확인해 주세요! 💡
          </p>
        </div>
      )}

      {/* 공유 링크 안내 */}
      <div className="text-[10px] text-center text-muted-foreground/60 leading-normal">
        나의 등급을 인스타그램 등 SNS에 인증하여<br />
        주변 지인들과 스마트한 소비를 공유해 보세요!
      </div>

    </div>
  );
}
