// src/app/features/chat-flow/flows/telecom/bundle/BundleGradeReport.tsx

import React from "react";
import { ShieldCheck, Tv, AlertTriangle, ArrowDown } from "lucide-react";
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

  const monthlySaving = Number(metadata.saving || 0);
  const savingRate = Number(metadata.savingRate || 0);
  const yearlySaving = monthlySaving * 12;
  const savingPercent = Math.round(savingRate * 100);
  const penaltyAmount = Number(metadata.penaltyAmount || 0);

  const currentMembers = answers["bundle.allMembers"] || answers["bundle.ptaMembers"] || answers["bundle.ptbMembers"] || answers["bundle.ptcMembers"] || answers["bundle.diffMembers"] || answers["bundle.desiredMembers"] || "-";

  // Calculate payback period (손익분기점)
  const paybackPeriod = monthlySaving > 0 && penaltyAmount > 0
    ? Math.ceil(penaltyAmount / monthlySaving)
    : 0;

  // Grade calculation logic: monthlySaving >= threshold OR savingRate >= threshold
  let grade: "Gold" | "Silver" | "Bronze" | "Normal" = "Normal";
  if (monthlySaving >= 45000 || savingRate >= 0.35) {
    grade = "Gold";
  } else if (monthlySaving >= 25000 || savingRate >= 0.20) {
    grade = "Silver";
  } else if (monthlySaving >= 10000 || savingRate >= 0.10) {
    grade = "Bronze";
  }

  const gradeInfo = {
    Gold: {
      label: "골드 등급",
      subLabel: "절감 효과 극대화! 최상의 가성비 구간",
      status: "골드 단계이며 갈아타기를 강력 추천합니다.",
      emoji: "🏆",
      iconSrc: "/assets/icons/gold_medal.png",
      theme: {
        bg: "bg-[#FFFEF0]",
        text: "text-[#6B4D1E]",
        border: "border-[#C9A65A]",
        gradient: "from-[#F3D78B] to-[#C9A65A]",
        ring: "ring-[#C9A65A]/30",
        bar: "bg-[#C9A65A]",
        badgeBg: "bg-[#FFF9E6]",
        badgeText: "text-[#6B4D1E]",
        badgeBorder: "border-[#C9A65A]",
      },
      feature: "연간 압도적인 절감 이득 구간으로, 환승 시 가계부에 가장 극적인 변화를 주는 등급입니다.",
      scenario: "기존 약정이 만료되었거나 위약금이 0원이라 환승 즉시 100% 이득이 발생하는 경우입니다.",
      precautions: [
        "신규 알뜰폰 가입 시 기존 대기업망과의 품질 일치 여부 확인 필요",
        "기존 유선 장비 반납 시 추가 부과 비용 존재 여부 체크",
        "가입 사은품 혜택은 가입 시점의 대리점 정책에 따라 일부 오차가 발생할 수 있습니다."
      ]
    },
    Silver: {
      label: "실버 등급",
      subLabel: "확실한 고정비 절감이 체감되는 알뜰 구간",
      status: "실버 단계이며 조건부 환승을 추천합니다.",
      emoji: "🥈",
      iconSrc: "/assets/icons/silver_medal.png",
      theme: {
        bg: "bg-[#F9FAFB]",
        text: "text-[#4B5563]",
        border: "border-[#D1D5DB]",
        gradient: "from-[#E5E7EB] to-[#9CA3AF]",
        ring: "ring-[#9CA3AF]/30",
        bar: "bg-[#9CA3AF]",
        badgeBg: "bg-[#F3F4F6]",
        badgeText: "text-[#4B5563]",
        badgeBorder: "border-[#D1D5DB]",
      },
      feature: "대기업 결합 혜택의 착시를 깨고 실속을 챙길 수 있는 영리한 대안 구간입니다.",
      scenario: "해지 위약금이 발생하지만 단기간에 요금 절감액으로 전액 회수가 가능한 경우입니다.",
      precautions: [
        paybackPeriod > 0
          ? `계산된 손익분기점 기간인 ${paybackPeriod}개월 동안의 해지 미발생 조건 확인 필요`
          : "계산된 손익분기점 기간 동안의 해지 미발생 조건 확인 필요",
        "기존 통신사 고객센터를 통한 실제 위약금 공식 누적액 최종 재확인 필요",
        "새로 제공되는 와이파이6 혹은 와이파이7 공유기의 무상 임대 범위 확인이 필요합니다."
      ]
    },
    Bronze: {
      label: "브론즈 등급",
      subLabel: "소소하지만 실속 있게 아끼는 절약 구간",
      status: "브론즈 단계이며 현재 결합 상품 유지를 권장합니다.",
      emoji: "🥉",
      iconSrc: "/assets/icons/bronze_medal.png",
      theme: {
        bg: "bg-[#FDF2E9]",
        text: "text-[#7C4A2E]",
        border: "border-[#D4A574]",
        gradient: "from-[#D4A574] to-[#9C6B4A]",
        ring: "ring-[#9C6B4A]/30",
        bar: "bg-[#9C6B4A]",
        badgeBg: "bg-[#FBEBE1]",
        badgeText: "text-[#7C4A2E]",
        badgeBorder: "border-[#D4A574]",
      },
      feature: "절약 폭이 크지는 않지만, 약정 만료 상태이거나 위약금이 없다면 충분히 전환을 고려할 만한 구간입니다.",
      scenario: "약정 초반이라 위약금 페널티가 너무 커서 현재 바꾸면 오히려 금전적 손해가 발생하는 경우입니다.",
      precautions: [
        "남은 약정 기간이 6개월 이하로 줄어들어 위약금이 낮아지는 시점까지 대기 필요",
        "인터넷 속도를 낮출 경우 가족들의 동시 4K 동영상 시청 환경 변화 여부 확인 필요",
        "모바일 데이터 쉐어링 옵션 해제 시 기존 서브 기기 이용 제한 여부 체크가 필요합니다."
      ]
    },
    Normal: {
      label: "일반 등급",
      subLabel: "지출 낭비 없이 안정적인 유지 구간",
      status: "진단 보류 및 현 상태 유지",
      emoji: "🌱",
      iconSrc: "/assets/icons/glossy_seedling.png",
      theme: {
        bg: "bg-[#F1F5F9]",
        text: "text-[#334155]",
        border: "border-[#94A3B8]",
        gradient: "from-[#CBD5E1] to-[#64748B]",
        ring: "ring-[#64748B]/30",
        bar: "bg-[#64748B]",
        badgeBg: "bg-[#E2E8F0]",
        badgeText: "text-[#334155]",
        badgeBorder: "border-[#94A3B8]",
      },
      feature: "이동할 때 드는 번거로움이나 위약금 리스크에 비해 얻는 요금 메리트가 적어, 기존 결합을 유지하는 것이 더 이득인 구간입니다.",
      scenario: "기존 결합의 할인 혜택이 이미 최적화되어 있거나, 추가 절약 메리트가 크지 않은 상태입니다.",
      precautions: [
        "기존 결합 해지 시 결합 구성원 할인 변동성 최종 확인 필요",
        "현재 조건 유지 시 통신사 1년 재약정 추가 혜택 가능 여부 문의 필요"
      ]
    }
  }[grade];

  const hasPenalty = penaltyAmount > 0 || answers["bundle.allContract"] === "남음" ||
    answers["bundle.ptaContract"] === "남음" || answers["bundle.ptaComboContract"] === "남음" ||
    answers["bundle.ptbContract"] === "남음" || answers["bundle.ptbComboContract"] === "남음" ||
    answers["bundle.ptcContract"] === "남음" || answers["bundle.ptcComboContract"] === "남음" ||
    answers["bundle.diffContract"] === "남음" || answers["bundle.diffInternetContract"] === "남음" || answers["bundle.diffTvContract"] === "남음" ||
    answers["bundle.newAContract"] === "남음" || answers["bundle.newBContract"] === "남음";

  return (
    // 카드의 전체 외곽 구조: rounded-3xl (24px 모서리), border-[1.5px], shadow-lg 모던 카드 뷰
    <div className={`w-full max-w-sm rounded-3xl border-[1.5px] shadow-lg transition-all hover:shadow-xl relative flex flex-col overflow-hidden ${gradeInfo.theme.bg} ${gradeInfo.theme.border}`}>

      {/* 카드 오른쪽 상단 공유 버튼 */}
      <div className="absolute right-4 top-4 z-20">
        <PurchaseGradeShareButton />
      </div>

      {/* 1. 등급별 히어로 헤더 영역 (그라데이션, 등급 메달/명칭) */}
      <div className={`bg-gradient-to-b ${gradeInfo.theme.gradient} px-6 pt-7 pb-6 flex flex-col items-center text-center relative`}>
        {/* 최상단 뱃지("소비 패턴 분석")는 요구사항에 따라 절대 생성하지 않음 */}
        <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white/90 drop-shadow-sm">
          나의 결합 요금 소비 등급
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
          <span className="text-xs font-bold text-muted-foreground">절감률</span>
          
          {/* 가성비/절감 수치: text-2xl 이상, font-extrabold 중앙 배치 */}
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${gradeInfo.theme.text}`}>
            {savingPercent > 0 ? `${savingPercent}% 절감` : "절감률 진단 대기"}
          </div>

          {/* 점선 구분선 및 화살표 아이콘 */}
          <div className="w-full relative flex items-center justify-center my-2">
            <div className="w-full border-b border-dashed border-border/60"></div>
            <div className="absolute rounded-full bg-muted/60 border border-border/40 p-1 text-muted-foreground">
              <ArrowDown className="w-3 h-3" />
            </div>
          </div>

          <span className="text-xs font-bold text-muted-foreground">월 절감 가능액</span>

          {/* 차이 금액 수치: 알약 형태 둥근 뱃지 (rounded-full, px-4 py-1.5, border, font-bold) */}
          <div className={`rounded-full px-4 py-1.5 border font-bold text-sm shadow-sm inline-flex items-center justify-center mt-0.5 ${gradeInfo.theme.badgeBg} ${gradeInfo.theme.badgeText} ${gradeInfo.theme.badgeBorder}`}>
            {monthlySaving > 0 ? `월 ${fmt(monthlySaving)}원 절감 가능` : "월 절감 가능액 확인 중"}
          </div>

          {/* 가성비 프로그레스 바 */}
          {savingPercent > 0 && (
            <div className="w-full flex flex-col gap-1 pt-2">
              <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full ${gradeInfo.theme.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(100, savingPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* 부가 정보(1년 환산액 & 손익분기점) 요약 */}
          {monthlySaving > 0 && (
            <div className="w-full pt-2 mt-1 border-t border-border/30 text-center text-xs flex flex-col gap-0.5">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                (1년 환산 시 약 {fmt(yearlySaving)}원 절약)
              </p>
              {paybackPeriod > 0 && (
                <p className="text-[11px] font-medium text-muted-foreground">
                  위약금 손익분기점: 약 {paybackPeriod}개월 소요
                </p>
              )}
            </div>
          )}
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

        {/* 4. 약정 및 위약금 주의 안내 카드 */}
        {hasPenalty && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle size={15} className="shrink-0" />
              <span>약정 및 위약금 주의 안내</span>
            </div>
            <p className="text-muted-foreground font-medium text-[11.5px] leading-snug">
              현재 약정이 남아있다면 발생하는 위약금이 절감액보다 클 수 있으니, 전환 전 통신사 고객센터를 통해 남은 위약금을 꼭 재확인해 주세요! 💡
            </p>
          </div>
        )}

        {/* 공유 링크 안내 */}
        <div className="text-[10px] text-center text-muted-foreground/60 leading-normal pt-1">
          나의 등급을 인스타그램 등 SNS에 인증하여<br />
          주변 지인들과 스마트한 소비를 공유해 보세요!
        </div>

        {/* 하단 채팅 종료하기 버튼 */}
        {onEndChat && (
          <div className="border-t border-border/40 pt-2">
            <button
              type="button"
              onClick={onEndChat}
              className="w-full rounded-xl bg-[#1E3ABA] hover:bg-[#2A6CB6] py-2.5 text-xs font-black text-white transition-all shadow-sm active:scale-[0.98]"
            >
              채팅 종료하기
            </button>
          </div>
        )}

      </div>

    </div>
  );
}


