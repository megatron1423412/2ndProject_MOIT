import React from "react";
import { ArrowDown, AlertTriangle } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import PurchaseGradeShareButton from "../../../../smart-shopping/share/PurchaseGradeShareButton";

interface PhoneGradeReportProps {
  result: FlowResult;
  onEndChat?: () => void;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function PhoneGradeReport({ result, onEndChat }: PhoneGradeReportProps) {
  const metadata = result.metadata || {};
  const saving = Number(metadata.saving || 0);
  const savingRate = Number(metadata.savingRate || 0);
  const savingPercent = Math.round(savingRate * 100);

  let grade = "Normal";
  let gradeLabel = "기본 등급";
  let gradeSubLabel = "지출 낭비 없이 안정적인 유지 구간";
  let gradeEmoji = "🌱";
  let gradeIconSrc = "/assets/icons/glossy_seedling.png";
  let gradeReason = "현재 이용 중인 요금제와 추천 요금제 간의 금액 차이가 크지 않습니다. 이미 사용량 패턴에 맞춰 알맞게 잘 쓰고 계신 상태입니다.";
  let gradeTheme = {
    bg: "bg-[#F1F5F9]",
    text: "text-[#334155]",
    border: "border-[#94A3B8]",
    gradient: "from-[#CBD5E1] to-[#64748B]",
    ring: "ring-[#64748B]/30",
    bar: "bg-[#64748B]",
    badgeBg: "bg-[#E2E8F0]",
    badgeText: "text-[#334155]",
    badgeBorder: "border-[#94A3B8]",
  };

  if (saving >= 20000 || savingRate >= 0.30) {
    grade = "Gold";
    gradeLabel = "골드 등급";
    gradeSubLabel = "절감 효과 극대화! 최상의 가성비 구간";
    gradeEmoji = "🏆";
    gradeIconSrc = "/assets/icons/gold_medal.png";
    gradeReason = `월 ${fmt(saving)}원(${savingPercent}%)의 상당한 금액을 성공적으로 절감하셨습니다! 통신 고정비를 극한으로 낮추는 매우 우수한 소비 패턴을 보여주고 계십니다.`;
    gradeTheme = {
      bg: "bg-[#FFFEF0]",
      text: "text-[#6B4D1E]",
      border: "border-[#C9A65A]",
      gradient: "from-[#F3D78B] to-[#C9A65A]",
      ring: "ring-[#C9A65A]/30",
      bar: "bg-[#C9A65A]",
      badgeBg: "bg-[#FFF9E6]",
      badgeText: "text-[#6B4D1E]",
      badgeBorder: "border-[#C9A65A]",
    };
  } else if (saving >= 10000 || savingRate >= 0.15) {
    grade = "Silver";
    gradeLabel = "실버 등급";
    gradeSubLabel = "확실한 고정비 절감이 체감되는 알뜰 구간";
    gradeEmoji = "🥈";
    gradeIconSrc = "/assets/icons/silver_medal.png";
    gradeReason = `월 ${fmt(saving)}원(${savingPercent}%)의 알찬 고정 지출을 줄이셨습니다. 생활비 낭비를 적절히 통제하여 건강한 소비 습관을 구축하고 계십니다.`;
    gradeTheme = {
      bg: "bg-[#F9FAFB]",
      text: "text-[#4B5563]",
      border: "border-[#D1D5DB]",
      gradient: "from-[#E5E7EB] to-[#9CA3AF]",
      ring: "ring-[#9CA3AF]/30",
      bar: "bg-[#9CA3AF]",
      badgeBg: "bg-[#F3F4F6]",
      badgeText: "text-[#4B5563]",
      badgeBorder: "border-[#D1D5DB]",
    };
  } else if (saving >= 3000 || savingRate >= 0.05) {
    grade = "Bronze";
    gradeLabel = "브론즈 등급";
    gradeSubLabel = "소소하지만 실속 있게 아끼는 절약 구간";
    gradeEmoji = "🥉";
    gradeIconSrc = "/assets/icons/bronze_medal.png";
    gradeReason = `월 ${fmt(saving)}원(${savingPercent}%) 수준의 고정비를 확보하셨습니다. 조금 더 요령 있게 결합 할인 혜택을 챙기시면 한 단계 위 등급을 얻을 수 있습니다!`;
    gradeTheme = {
      bg: "bg-[#FDF2E9]",
      text: "text-[#7C4A2E]",
      border: "border-[#D4A574]",
      gradient: "from-[#D4A574] to-[#9C6B4A]",
      ring: "ring-[#9C6B4A]/30",
      bar: "bg-[#9C6B4A]",
      badgeBg: "bg-[#FBEBE1]",
      badgeText: "text-[#7C4A2E]",
      badgeBorder: "border-[#D4A574]",
    };
  }

  const answers = metadata.answers || {};
  const contractPeriod = (answers["phone.contractPeriod"] || "") as string;
  const isRemaining = contractPeriod === "remaining" || contractPeriod === "under2y" || contractPeriod === "under1y" || contractPeriod === "unknown";

  return (
    // 카드의 전체 외곽 구조: rounded-3xl (24px 모서리), border-[1.5px], shadow-lg 모던 카드 뷰
    <div className={`w-full max-w-sm rounded-3xl border-[1.5px] shadow-lg transition-all hover:shadow-xl relative flex flex-col overflow-hidden ${gradeTheme.bg} ${gradeTheme.border}`}>
      
      {/* 카드 오른쪽 상단 공유 버튼 */}
      <div className="absolute right-4 top-4 z-20">
        <PurchaseGradeShareButton />
      </div>

      {/* 1. 등급별 히어로 헤더 영역 (그라데이션, 등급 메달/명칭) */}
      <div className={`bg-gradient-to-b ${gradeTheme.gradient} px-6 pt-7 pb-6 flex flex-col items-center text-center relative`}>
        {/* 최상단 뱃지("소비 패턴 분석")는 요구사항에 따라 절대 생성하지 않음 */}
        <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white/90 drop-shadow-sm">
          나의 휴대폰 요금 소비 등급
        </h3>

        <div className="mt-4 flex flex-col items-center justify-center relative">
          <div className="absolute w-20 h-20 rounded-full bg-white/20 blur-md pointer-events-none" />
          <img
            src={gradeIconSrc}
            alt={gradeLabel}
            className="h-20 w-20 object-contain select-none relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.55)] drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]"
          />
          <span className="mt-3 text-xl font-black tracking-tight text-white drop-shadow">
            {gradeLabel}
          </span>
          <span className="text-xs text-white/90 font-medium mt-1 drop-shadow-sm">
            {gradeSubLabel}
          </span>
        </div>
      </div>

      {/* 카드 본문 콘텐츠 영역 */}
      <div className="p-5 flex flex-col gap-4">

        {/* 2. 수치 데이터 강조 레이아웃 (중앙 블록 영역) */}
        <div className="rounded-2xl bg-white dark:bg-card border border-border/50 p-4 shadow-sm flex flex-col items-center text-center gap-1.5">
          <span className="text-xs font-bold text-muted-foreground">절감률</span>
          
          {/* 가성비/절감 수치: text-2xl 이상, font-extrabold 중앙 배치 */}
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${gradeTheme.text}`}>
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
          <div className={`rounded-full px-4 py-1.5 border font-bold text-sm shadow-sm inline-flex items-center justify-center mt-0.5 ${gradeTheme.badgeBg} ${gradeTheme.badgeText} ${gradeTheme.badgeBorder}`}>
            {saving > 0 ? `월 ${fmt(saving)}원 절감 가능` : "월 절감 가능액 확인 중"}
          </div>

          {/* 가성비 프로그레스 바 */}
          {saving > 0 && (
            <div className="w-full flex flex-col gap-1 pt-2">
              <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full ${gradeTheme.bar} transition-all duration-500`}
                  style={{ width: `${Math.min(100, savingRate * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. 진단 소견 영역 */}
        <div className="rounded-2xl bg-white/70 dark:bg-card/70 border border-border/40 p-4 flex flex-col gap-2 text-xs">
          <span className="font-black text-primary">🔍 진단 소견</span>
          <p className="text-primary/95 font-medium leading-relaxed">
            {gradeReason}
          </p>
        </div>

        {/* 4. 약정 기간 남음 특별 안내 문구 */}
        {isRemaining && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed flex flex-col gap-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle size={15} className="shrink-0" />
              <span>약정 및 위약금 주의 안내</span>
            </div>
            <p className="font-bold text-amber-600 dark:text-amber-400 text-[11.5px]">
              유저님! 위에 표시된 등급은 약정 기간과 위약금이 없는 상태를 기준으로 산출된 등급이에요! 💡
            </p>
            <p className="text-muted-foreground font-medium text-[11px] leading-snug">
              현재 약정이 남아있다면, 발생하는 위약금이 남은 기간 동안 아끼는 총금액보다 커서 해지 손실이 더 발생할 수 있어요.<br />
              실제 이득을 보시려면 통신사 고객센터나 앱에서 정확한 위약금을 먼저 꼭 확인해 보세요! 👍
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

