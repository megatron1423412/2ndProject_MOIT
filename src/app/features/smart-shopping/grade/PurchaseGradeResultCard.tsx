// src/app/features/smart-shopping/grade/PurchaseGradeResultCard.tsx

import React from "react";
import { AlertTriangle, ArrowDown } from "lucide-react";
import type { PurchaseGradeDiagnosisInput } from "../types/recommendation";
import type { PurchaseGradeResult } from "./calculatePurchaseGrade";
import PurchaseGradeShareButton from "../share/PurchaseGradeShareButton";
import { collectAppliancesGradeReportData } from "./collectAppliancesGradeReportData";

import type { NextActionId } from "../next-actions/nextActionOptions";

interface PurchaseGradeResultCardProps {
  input: PurchaseGradeDiagnosisInput;
  result: PurchaseGradeResult;
  onNextAction?: (action: NextActionId) => void;
  onEndChat?: () => void;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function PurchaseGradeResultCard({ input, result, onNextAction, onEndChat }: PurchaseGradeResultCardProps) {
  // 1. 흩어진 등급 진단 데이터 수집 및 단일 표준 객체 변환
  const data = collectAppliancesGradeReportData(input, result);
  const { gradeInfo } = data;

  return (
    // 2. 카드의 전체 외곽 구조: rounded-3xl (24px 모서리), border-[1.5px], shadow-lg 모던 카드 뷰
    <div className={`w-full max-w-sm rounded-3xl border-[1.5px] shadow-lg transition-all hover:shadow-xl relative flex flex-col overflow-hidden ${gradeInfo.theme.bg} ${gradeInfo.theme.border}`}>

      {/* 카드 오른쪽 상단 공유 버튼 */}
      <div className="absolute right-4 top-4 z-20">
        <PurchaseGradeShareButton />
      </div>

      {/* 1. 등급별 히어로 헤더 영역 (그라데이션, 등급 메달/명칭) */}
      <div className={`bg-gradient-to-b ${gradeInfo.theme.gradient} px-6 pt-7 pb-6 flex flex-col items-center text-center relative`}>
        {/* 최상단 뱃지("소비 패턴 분석")는 요구사항에 따라 절대 생성하지 않음 */}
        <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white/90 drop-shadow-sm">
          나의 가전 구매 소비 등급
        </h3>

        <div className="mt-4 flex flex-col items-center justify-center relative">
          <div className="absolute w-20 h-20 rounded-full bg-white/20 blur-md pointer-events-none" />
          <img
            src={gradeInfo.iconSrc}
            alt={gradeInfo.label}
            className="h-20 w-20 object-contain select-none relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.55)] drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]"
          />
          <span className="mt-3 text-xl font-black tracking-tight text-white drop-shadow">
            {gradeInfo.label}
          </span>
          <span className="text-xs text-white/90 font-medium mt-1 drop-shadow-sm">
            {gradeInfo.subLabel}
          </span>
        </div>
      </div>

      {/* 카드 본문 콘텐츠 영역 */}
      <div className="p-5 flex flex-col gap-4">

        {/* 2. 수치 데이터 강조 레이아웃 (중앙 블록 영역) */}
        <div className="rounded-2xl bg-white dark:bg-card border border-border/50 p-4 shadow-sm flex flex-col items-center text-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground">가성비</span>
          
          {/* 가성비/절감 수치: text-2xl 이상, font-extrabold 중앙 배치 */}
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${gradeInfo.theme.text}`}>
            {data.savingPercent > 0 ? `${data.savingPercent}% 가성비` : "가성비 진단 대기"}
          </div>

          {/* 점선 구분선 및 화살표 아이콘 */}
          <div className="w-full relative flex items-center justify-center my-2">
            <div className="w-full border-b border-dashed border-border/60"></div>
            <div className="absolute rounded-full bg-muted/60 border border-border/40 p-1 text-muted-foreground">
              <ArrowDown className="w-3 h-3" />
            </div>
          </div>

          <span className="text-xs font-bold text-muted-foreground">최저가와의 차이</span>

          {/* 차이 금액 수치: 알약 형태 둥근 뱃지 (rounded-full, px-4 py-1.5, border, font-bold) */}
          <div className={`rounded-full px-4 py-1.5 border font-bold text-sm shadow-sm inline-flex items-center justify-center mt-0.5 ${gradeInfo.theme.badgeBg} ${gradeInfo.theme.badgeText} ${gradeInfo.theme.badgeBorder}`}>
            {data.allTimeLow ? (data.savingAmount > 0 ? `+${fmt(data.savingAmount)}원 차이` : "0원 차이") : "가격 정보 대기 중"}
          </div>

          {/* 가성비 프로그레스 바 */}
          {data.savingPercent > 0 && (
            <div className="w-full flex flex-col gap-1 pt-2">
              <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full ${gradeInfo.theme.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(100, data.savingPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* 상품 명칭 & 가격 요약 정보 */}
          <div className="w-full pt-2.5 mt-1 border-t border-border/30 text-left text-xs flex flex-col gap-0.5">
            <p className="font-bold text-primary truncate" title={data.productName}>
              {data.productName} ({data.modelNumber})
            </p>
            <div className="flex items-center justify-between text-muted-foreground font-medium text-[11px]">
              <span>{data.currentPrice > 0 ? `현재가 ${fmt(data.currentPrice)}원` : "가격 정보 확인 중"}</span>
              {data.allTimeLow && (
                <span>역대 최저가: 약 {fmt(data.allTimeLow)}원</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. 종합 진단 소견 영역 */}
        <div className="rounded-2xl bg-white/70 dark:bg-card/70 border border-border/40 p-4 flex flex-col gap-2 text-xs">
          <span className="font-black text-primary">💡 모잇의 종합 진단 소견</span>
          <div className="flex flex-col gap-1.5 text-primary/90 font-medium leading-relaxed">
            <p>{gradeInfo.feature}</p>
            <p className={`font-bold text-[11.5px] ${gradeInfo.theme.text}`}>{gradeInfo.status}</p>
            <p>{gradeInfo.scenario}</p>
          </div>
        </div>

        {/* 4. 추가비용 및 주의 안내 카드 */}
        {data.additionalCostCheck && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed flex flex-col gap-1">
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
        <div className="text-[10px] text-center text-muted-foreground/60 leading-normal pt-1">
          나의 등급을 인스타그램 등 SNS에 인증하여<br />
          주변 지인들과 스마트한 소비를 공유해 보세요!
        </div>

        {/* 하단 버튼 영역 */}
        {(onNextAction || onEndChat) && (
          <div className="border-t border-border/40 pt-3 flex flex-col gap-2">
            {/* 파란색 채팅 종료하기 버튼 */}
            <button
              type="button"
              onClick={() => (onNextAction ? onNextAction("end-chat") : onEndChat?.())}
              className="w-full rounded-xl bg-[#1E3ABA] hover:bg-[#2A6CB6] py-2.5 text-xs font-black text-white transition-all shadow-sm active:scale-[0.98]"
            >
              채팅 종료하기
            </button>

            {/* 채팅 종료하기 하단 3개 버튼: 구매 링크 연결, 최저가 알람 설정, 목록 다시 보기 */}
            {onNextAction && (
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => onNextAction("purchase-link")}
                  className="flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 py-2 px-1 text-[11px] font-bold transition-all shadow-2xs text-center active:scale-[0.98]"
                >
                  구매 링크 연결
                </button>
                <button
                  type="button"
                  onClick={() => onNextAction("price-alert")}
                  className="flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 py-2 px-1 text-[11px] font-bold transition-all shadow-2xs text-center active:scale-[0.98]"
                >
                  최저가 알람 설정
                </button>
                <button
                  type="button"
                  onClick={() => onNextAction("back-to-list")}
                  className="flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 py-2 px-1 text-[11px] font-bold transition-all shadow-2xs text-center active:scale-[0.98]"
                >
                  목록 다시 보기
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}

