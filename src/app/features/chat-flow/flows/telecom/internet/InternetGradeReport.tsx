import React from "react";
import type { FlowResult } from "../../../core/types";
import PurchaseGradeShareButton from "../../../../smart-shopping/share/PurchaseGradeShareButton";
import { SK_INTERNET_PLANS, KT_INTERNET_PLANS, LGU_INTERNET_PLANS, HELLOVISION_INTERNET_PLANS, SKYLIFE_INTERNET_PLANS, KTHCN_INTERNET_PLANS, DLIVE_INTERNET_PLANS } from "./mockData";

interface InternetGradeReportProps {
  result: FlowResult;
  onEndChat?: () => void;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function InternetGradeReport({ result, onEndChat }: InternetGradeReportProps) {
  const metadata = result.metadata || {};
  const saving = Number(metadata.saving || 0);
  const savingRate = Number(metadata.savingRate || 0);
  const answers = metadata.answers || {};

  const householdSize = Number(answers["internet.householdSize"]) || 1;
  const deviceCount = Number(answers["internet.deviceCount"]) || 1;
  const usage: string[] = Array.isArray(answers["internet.usage"]) ? answers["internet.usage"] : [];

  // 권장 속도 계산
  let recommendedSpeed = 100;
  if (deviceCount >= 8 || (usage.includes("gaming") && usage.includes("work") && householdSize >= 3)) {
    recommendedSpeed = 1000;
  } else if (deviceCount >= 4 || householdSize >= 3 || usage.includes("streaming") || usage.includes("gaming")) {
    recommendedSpeed = 500;
  }

  // 사용자가 선택한 속도 계산
  const selectedRecommendedPlan = answers["internet.selectedRecommendedPlan"] || "rec-internet-1";
  const manualSelectedPlan = answers["internet.manualSelectedPlan"] || "";
  const finalPlan = (selectedRecommendedPlan === "direct-choose" && manualSelectedPlan)
    ? manualSelectedPlan
    : (selectedRecommendedPlan || manualSelectedPlan || "rec-internet-1");

  const foundPlan = SK_INTERNET_PLANS.find(p => p.id === finalPlan) ||
                    KT_INTERNET_PLANS.find(p => p.id === finalPlan) ||
                    LGU_INTERNET_PLANS.find(p => p.id === finalPlan) ||
                    HELLOVISION_INTERNET_PLANS.find(p => p.id === finalPlan) ||
                    SKYLIFE_INTERNET_PLANS.find(p => p.id === finalPlan) ||
                    KTHCN_INTERNET_PLANS.find(p => p.id === finalPlan) ||
                    DLIVE_INTERNET_PLANS.find(p => p.id === finalPlan);

  let selectedSpeed = 500; // 기본값 500Mbps
  if (foundPlan) {
    selectedSpeed = foundPlan.speedMbps;
  } else if (finalPlan === "rec-internet-2" || finalPlan === "plan-internet-3") {
    selectedSpeed = 1000;
  } else if (finalPlan === "plan-internet-1") {
    selectedSpeed = 100;
  } else if (finalPlan === "plan-internet-4") {
    selectedSpeed = 2500;
  }

  const speedOk = selectedSpeed >= recommendedSpeed;

  // 등급 및 UI 테마 결정
  let grade = "Normal";
  let gradeLabel = "일반 등급";
  let gradeEmoji = "🌱";
  let gradeIconSrc = "/assets/icons/glossy_seedling.png";
  let gradeReason = "현재 이용 요금에 대비하여 큰 절감액이 없거나, 가구원 및 연결 기기 수 대비 200Mbps 인터넷의 속도가 다소 부족하여 기존 인터넷 환경을 그대로 유지하시는 것을 추천합니다.";
  let gradeTheme = { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border/60", ring: "ring-muted" };

  if ((saving >= 15000 || savingRate >= 0.30) && speedOk) {
    grade = "Gold";
    gradeLabel = "골드 등급";
    gradeEmoji = "🏆";
    gradeIconSrc = "/assets/icons/gold_medal.png";
    gradeReason = `속도 적합성을 만족하며 월 ${fmt(saving)}원(${Math.round(savingRate * 100)}%)의 우수한 통신 지출을 성공적으로 절감하셨습니다! 스마트한 인터넷 소비 설계를 유지하고 계십니다.`;
    gradeTheme = { bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", ring: "ring-amber-500/30" };
  } else if ((saving >= 8000 || savingRate >= 0.15) && speedOk) {
    grade = "Silver";
    gradeLabel = "실버 등급";
    gradeEmoji = "🥈";
    gradeIconSrc = "/assets/icons/silver_medal.png";
    gradeReason = `속도 적합성을 만족하며 월 ${fmt(saving)}원(${Math.round(savingRate * 100)}%) 가량의 소중한 고정비를 절약하셨습니다. 건강하고 낭비 없는 소비 패턴을 보유하고 계십니다.`;
    gradeTheme = { bg: "bg-slate-500/5", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20", ring: "ring-slate-500/30" };
  } else if (saving >= 3000) {
    grade = "Bronze";
    gradeLabel = "브론즈 등급";
    gradeEmoji = "🥉";
    gradeIconSrc = "/assets/icons/bronze_medal.png";
    gradeReason = `월 ${fmt(saving)}원 수준의 고정비를 절감하셨습니다. 조건에 맞는 요금제를 선택하여 알뜰하게 고정 지출을 아끼셨습니다.`;
    gradeTheme = { bg: "bg-orange-500/5", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", ring: "ring-orange-500/30" };
  }

  const contractPeriod = answers["internet.contractPeriod"] || "unknown";
  const isRemaining = contractPeriod === "under2y" || contractPeriod === "under1y" || contractPeriod === "remaining";

  return (
    <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-md transition-all hover:shadow-lg relative ${gradeTheme.bg} ${gradeTheme.border}`}>
      
      {/* 카드 오른쪽 상단 공유 버튼 */}
      <div className="absolute right-4 top-4 z-20">
        <PurchaseGradeShareButton />
      </div>

      {/* 상단 타이틀 */}
      <div className="flex flex-col items-center text-center gap-1 border-b border-border/40 pb-4">
        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">
          인터넷 소비 분석
        </span>
        <h3 className="text-base font-black tracking-tight text-primary">
          나의 인터넷 요금 소비 등급
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
        주변 지인들과 스마트한 인터넷 소비를 공유해 보세요!
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
