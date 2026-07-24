import React from "react";
import { Award } from "lucide-react";
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

  let grade = "Normal";
  let gradeLabel = "기본 등급";
  let gradeEmoji = "🌱";
  let gradeIconSrc = "/assets/icons/glossy_seedling.png";
  let gradeReason = "현재 이용 중인 요금제와 추천 요금제 간의 금액 차이가 크지 않습니다. 이미 사용량 패턴에 맞춰 알맞게 잘 쓰고 계신 상태입니다.";
  let gradeTheme = { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border/60", ring: "ring-muted" };

  if (saving >= 20000 || savingRate >= 0.30) {
    grade = "Gold";
    gradeLabel = "골드 등급";
    gradeEmoji = "🏆";
    gradeIconSrc = "/assets/icons/gold_medal.png";
    gradeReason = `월 ${fmt(saving)}원(${Math.round(savingRate * 100)}%)의 상당한 금액을 성공적으로 절감하셨습니다! 통신 고정비를 극한으로 낮추는 매우 우수한 소비 패턴을 보여주고 계십니다.`;
    gradeTheme = { bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", ring: "ring-amber-500/30" };
  } else if (saving >= 10000 || savingRate >= 0.15) {
    grade = "Silver";
    gradeLabel = "실버 등급";
    gradeEmoji = "🥈";
    gradeIconSrc = "/assets/icons/silver_medal.png";
    gradeReason = `월 ${fmt(saving)}원(${Math.round(savingRate * 100)}%)의 알찬 고정 지출을 줄이셨습니다. 생활비 낭비를 적절히 통제하여 건강한 소비 습관을 구축하고 계십니다.`;
    gradeTheme = { bg: "bg-slate-500/5", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20", ring: "ring-slate-500/30" };
  } else if (saving >= 3000 || savingRate >= 0.05) {
    grade = "Bronze";
    gradeLabel = "브론즈 등급";
    gradeEmoji = "🥉";
    gradeIconSrc = "/assets/icons/bronze_medal.png";
    gradeReason = `월 ${fmt(saving)}원(${Math.round(savingRate * 100)}%) 수준의 고정비를 확보하셨습니다. 조금 더 요령 있게 결합 할인 혜택을 챙기시면 한 단계 위 등급을 얻을 수 있습니다!`;
    gradeTheme = { bg: "bg-orange-500/5", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", ring: "ring-orange-500/30" };
  }

  const answers = metadata.answers || {};
  const contractPeriod = (answers["phone.contractPeriod"] || "") as string;
  const isRemaining = contractPeriod === "remaining" || contractPeriod === "under2y" || contractPeriod === "under1y" || contractPeriod === "unknown";

  return (
    <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-md transition-all hover:shadow-lg relative ${gradeTheme.bg} ${gradeTheme.border}`}>
      
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
          나의 휴대폰 요금 소비 등급
        </h3>
      </div>

      {/* 강조된 대형 등급 이모지 */}
      <div className="my-6 flex flex-col items-center justify-center">
        <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-background border shadow-inner ring-8 ${gradeTheme.ring} animate-pulse`}>
          <img src={gradeIconSrc} alt={gradeLabel} className="h-16 w-16 object-contain select-none" />
        </div>
        <span className={`mt-3 text-lg font-black tracking-tight ${gradeTheme.text}`}>
          {gradeLabel}
        </span>
      </div>

      {/* 진단 소견 */}
      <div className="rounded-xl bg-background/50 border border-border/40 p-4 text-xs leading-relaxed">
        <p className="font-bold text-muted-foreground mb-1">🔍 진단 소견</p>
        <p className="text-primary/95 font-medium leading-relaxed">
          {gradeReason}
        </p>
      </div>

      {/* 약정 기간 남음 특별 안내 문구 */}
      {isRemaining && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs leading-relaxed">
          <p className="font-bold text-amber-600 dark:text-amber-400 mb-1">
            유저님! 위에 표시된 등급은 약정 기간과 위약금이 없는 상태를 기준으로 산출된 등급이에요! 💡
          </p>
          <p className="text-muted-foreground font-medium">
            현재 약정이 남아있다면, 발생하는 위약금이 남은 기간 동안 아끼는 총금액보다 커서 해지 손실이 더 발생할 수 있어요.<br />
            실제 이득을 보시려면 통신사 고객센터나 앱에서 정확한 위약금을 먼저 꼭 확인해 보세요! 👍
          </p>
        </div>
      )}

      {/* 절감 비율 프로그레스 바 */}
      {saving > 0 && (
        <div className="mt-5">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-bold">
            <span>요금 절감 비율</span>
            <span>{Math.round(savingRate * 100)}% 절감</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${grade === "Gold" ? "bg-amber-500" : grade === "Silver" ? "bg-slate-500" : "bg-orange-500"}`}
              style={{ width: `${Math.min(100, savingRate * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 공유 링크 안내 */}
      <div className="mt-5 text-[10px] text-center text-muted-foreground/60 leading-normal">
        나의 등급을 인스타그램 등 SNS에 인증하여<br />
        주변 지인들과 스마트한 소비를 공유해 보세요!
      </div>

      {/* 하단 채팅 종료하기 버튼 */}
      {onEndChat && (
        <div className="mt-6 flex justify-center border-t border-border/40 pt-4">
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
