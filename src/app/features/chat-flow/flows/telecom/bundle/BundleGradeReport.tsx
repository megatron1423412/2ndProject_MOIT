// src/app/features/chat-flow/flows/telecom/bundle/BundleGradeReport.tsx

import React from "react";
import { ShieldCheck, Tv, AlertTriangle } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import PurchaseGradeShareButton from "../../../../smart-shopping/share/PurchaseGradeShareButton";

interface BundleGradeReportProps {
  result: FlowResult;
  onEndChat?: () => void;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function BundleGradeReport({ result, onEndChat }: BundleGradeReportProps) {
  const metadata = result.metadata || {};
  const answers = metadata.answers || {};
  const startState = answers["bundle.startState"] as string;
  const isNewStart = startState === "new_start";

  const saving = Number(metadata.saving || 0);
  const savingRate = Number(metadata.savingRate || 0);
  const penaltyAmount = Number(metadata.penaltyAmount || 0);

  const currentMembers = answers["bundle.allMembers"] || answers["bundle.ptaMembers"] || answers["bundle.ptbMembers"] || answers["bundle.ptcMembers"] || answers["bundle.diffMembers"] || answers["bundle.desiredMembers"] || "-";

  // Calculate payback period (손익분기점)
  const paybackPeriod = saving > 0 && penaltyAmount > 0 
    ? Math.ceil(penaltyAmount / saving) 
    : 0;

  // Grade calculation logic: saving >= threshold OR savingRate >= threshold
  let grade: "Gold" | "Silver" | "Bronze" | "Normal" = "Normal";
  if (saving >= 45000 || savingRate >= 0.35) {
    grade = "Gold";
  } else if (saving >= 25000 || savingRate >= 0.20) {
    grade = "Silver";
  } else if (saving >= 10000 || savingRate >= 0.10) {
    grade = "Bronze";
  }

  const gradeInfo = {
    Gold: {
      label: "골드 (Gold)",
      subLabel: "무조건 갈아타세요! 가계부 구원 조합",
      status: "골드 단계이며 갈아타기를 강력 추천합니다.",
      emoji: "🏆",
      theme: { bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", ring: "ring-amber-500/30", bar: "bg-amber-500" },
      feature: "연간 50만 원 이상 아낄 수 있는 압도적인 이득 구간으로, 환승 시 가계부에 가장 극적인 변화를 주는 등급입니다.",
      scenario: "기존 약정이 만료되었거나 위약금이 0원이라 환승 즉시 100% 이득이 발생하는 경우입니다.",
      precautions: [
        "신규 알뜰폰 가입 시 기존 대기업망과의 품질 일치 여부 확인 필요",
        "기존 유선 장비 반납 시 추가 부과 비용 존재 여부 체크",
        "가입 사은품 혜택은 가입 시점의 대리점 정책에 따라 일부 오차가 발생할 수 있습니다."
      ]
    },
    Silver: {
      label: "실버 (Silver)",
      subLabel: "환승을 강력 추천합니다",
      status: "실버 단계이며 조건부 환승을 추천합니다.",
      emoji: "🥈",
      theme: { bg: "bg-slate-500/5", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20", ring: "ring-slate-500/30", bar: "bg-slate-500" },
      feature: "대기업 결합 혜택의 착시를 깨고 실속을 챙길 수 있는 영리한 대안 구간입니다.",
      scenario: "해지 위약금이 발생하지만 단기간에 요금 절감액으로 전액 회수가 가능한 경우입니다.",
      precautions: [
        `계산된 손익분기점 기간인 ${paybackPeriod}개월 동안의 해지 미발생 조건 확인 필요`,
        "기존 통신사 고객센터를 통한 실제 위약금 공식 누적액 최종 재확인 필요",
        "새로 제공되는 와이파이6 혹은 와이파이7 공유기의 무상 임대 범위 확인이 필요합니다."
      ]
    },
    Bronze: {
      label: "브론즈 (Bronze)",
      subLabel: "갈아타면 소소하게 이득입니다",
      status: "브론즈 단계이며 현재 결합 상품 유지를 권장합니다.",
      emoji: "🥉",
      theme: { bg: "bg-orange-500/5", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", ring: "ring-orange-500/30", bar: "bg-orange-500" },
      feature: "절약 폭이 엄청 크지는 않지만, 약정 만료 상태이거나 위약금이 없다면 충분히 전환을 고려할 만한 구간입니다.",
      scenario: "약정 초반이라 위약금 페널티가 너무 커서 현재 바꾸면 오히려 금전적 손해가 발생하는 경우입니다.",
      precautions: [
        "남은 약정 기간이 6개월 이하로 줄어들어 위약금이 낮아지는 시점까지 대기 필요",
        "인터넷 속도를 낮출 경우 가족들의 동시 4K 유튜브 시청 환경 변화 여부 확인 필요",
        "모바일 데이터 쉐어링 옵션 해제 시 기존 서브 기기 이용 제한 여부 체크가 필요합니다."
      ]
    },
    Normal: {
      label: "일반 (Normal)",
      subLabel: "현재 상태를 유지하셔도 좋습니다",
      status: "진단 보류 및 현 상태 유지",
      emoji: "🌱",
      theme: { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border/60", ring: "ring-muted", bar: "bg-muted" },
      feature: "이동할 때 드는 번거로움이나 위약금 리스크에 비해 얻는 요금 메리트가 적어, 기존 결합을 유지하는 것이 더 이득인 구간입니다.",
      scenario: "기존 결합의 할인 혜택이 이미 최적화되어 있거나, 추가 절약 메리트가 크지 않은 상태입니다.",
      precautions: [
        "기존 결합 해지 시 결합 구성원 할인 변동성 최종 확인 필요",
        "현재 조건 유지 시 통신사 1년 재약정 추가 혜택 가능 여부 문의 필요"
      ]
    }
  }[grade];

  // specialty badge conditions
  const showSafetyBadge = paybackPeriod > 0 && paybackPeriod <= 4;
  const showTrustBadge = answers["bundle.desiredCompanyType"] === "mvno";
  const showWarningBadge = answers["bundle.partSelect"] === "ptc" || (currentMembers !== "1인" && currentMembers !== "-");

  return (
    <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-md transition-all hover:shadow-lg relative flex flex-col gap-5 ${gradeInfo.theme.bg} ${gradeInfo.theme.border}`}>
      
      {/* 카드 오른쪽 상단 공유 버튼 */}
      <div className="absolute right-4 top-4 z-20">
        <PurchaseGradeShareButton />
      </div>

      {/* 상단 타이틀 */}
      <div className="flex flex-col items-center text-center gap-1 border-b border-border/40 pb-4">
        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">
          소비 패턴 분석
        </span>
        <h3 className="text-base font-black tracking-tight text-primary">
          나의 결합 요금 소비 등급
        </h3>
      </div>

      {/* 강조된 대형 등급 이모지 */}
      <div className="flex flex-col items-center justify-center">
        <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-background border shadow-inner ring-8 ${gradeInfo.theme.ring} animate-pulse`}>
          <span className="text-5xl select-none leading-none">{gradeInfo.emoji}</span>
        </div>
        <span className={`mt-3 text-lg font-black tracking-tight ${gradeInfo.theme.text}`}>
          {gradeInfo.label}
        </span>
        <span className="text-xs text-muted-foreground font-extrabold mt-1">
          {gradeInfo.subLabel}
        </span>
      </div>

      {/* 등급 특징 및 상태 */}
      <div className="rounded-xl bg-background/50 border border-border/40 p-4 space-y-2 text-xs">
        <div>
          <span className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">등급 특징</span>
          <p className="text-primary/95 font-medium leading-relaxed">{gradeInfo.feature}</p>
        </div>
        <div className="border-t border-border/30 pt-2">
          <span className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">진단 결과 상태</span>
          <p className="font-extrabold text-indigo-600 dark:text-indigo-400 leading-relaxed">{gradeInfo.status}</p>
        </div>
      </div>

      {/* 절약 지표 */}
      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-xs">
        <span className="font-extrabold text-[10px] text-emerald-600 uppercase tracking-wider block mb-0.5">절약 지표</span>
        <p className="font-black text-emerald-600 dark:text-emerald-400 leading-relaxed">
          월 {fmt(saving)}원, 1년 {fmt(saving * 12)}원 절약 가능합니다.
        </p>
      </div>

      {/* 적용 시나리오 */}
      <div className="rounded-xl bg-background/50 border border-border/40 p-4 text-xs">
        <span className="font-extrabold text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">적용 시나리오 케이스</span>
        <p className="text-primary/95 font-medium leading-relaxed">{gradeInfo.scenario}</p>
      </div>

      {/* 주의 체크 항목 */}
      <div className="rounded-xl bg-background/50 border border-border/40 p-4 text-xs space-y-2">
        <span className="font-bold text-muted-foreground block">⚠️ 주의 체크 항목</span>
        <ul className="list-disc pl-4 space-y-1 text-primary/90 font-medium">
          {gradeInfo.precautions.map((precaution, idx) => (
            <li key={idx} className="leading-relaxed">{precaution}</li>
          ))}
        </ul>
      </div>

      {/* 특화 안심 신뢰 및 주의 배지 */}
      {(showSafetyBadge || showTrustBadge || showWarningBadge) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
          <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">결합상품 특화 분석 배지</span>
          <div className="flex flex-col gap-1.5 mt-1">
            {showSafetyBadge && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                <span>위약금 보호 안심 배지 활성화</span>
              </div>
            )}
            {showTrustBadge && (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <Tv size={14} className="shrink-0 text-indigo-500" />
                <span>장비 업그레이드 신뢰 배지 활성화</span>
              </div>
            )}
            {showWarningBadge && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                <span>가족 결합 경고 주의 배지 활성화</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 공유 링크 안내 */}
      <div className="text-[10px] text-center text-muted-foreground/60 leading-normal">
        나의 등급을 인스타그램 등 SNS에 인증하여<br />
        주변 지인들과 스마트한 소비를 공유해 보세요!
      </div>

      {/* 하단 채팅 종료하기 버튼 */}
      {onEndChat && (
        <div className="border-t border-border/40 pt-4">
          <button
            type="button"
            onClick={onEndChat}
            className="w-full rounded-xl bg-brand-surface py-2.5 text-xs font-black text-brand-surface-foreground hover:opacity-90 active:scale-[0.98] transition-all"
          >
            채팅 종료하기
          </button>
        </div>
      )}

    </div>
  );
}
