import React from "react";
import type { FlowResult } from "../../../core/types";
import { mockIptvPlans } from "./mockData";
import PurchaseGradeShareButton from "../../../../smart-shopping/share/PurchaseGradeShareButton";

interface IptvGradeReportProps {
  result: FlowResult;
  onEndChat?: () => void;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function IptvGradeReport({ result, onEndChat }: IptvGradeReportProps) {
  const metadata = result.metadata || {};
  const saving = Number(metadata.saving || 0);
  const savingRate = Number(metadata.savingRate || 0);
  const answers = metadata.answers || {};

  const currentPlanId = answers["iptv.currentPlanId"];
  const inputMethod = answers["iptv.currentInputMethod"];

  let currentChannels = 200; // 수동 입력 시 기본값 가정

  if (inputMethod === "list" && currentPlanId && currentPlanId !== "manual_fallback") {
    const foundPlan = mockIptvPlans.find((p) => p.id === currentPlanId);
    if (foundPlan) {
      currentChannels = foundPlan.channels;
    }
  }

  const selectedNewPlan = answers["iptv.selectedNewPlan"];
  const selectedPlanId = (selectedNewPlan && selectedNewPlan !== "direct-choose")
    ? selectedNewPlan
    : answers["iptv.selectedNewPlanDirect"];
  const selectedPlan = mockIptvPlans.find((p) => p.id === selectedPlanId);
  const selectedChannels = selectedPlan ? selectedPlan.channels : 0;

  // 1. 월요금 절감액 계산: metadata.saving 사용
  // 2. 채널 감소율 계산
  const channelDiff = Math.max(0, currentChannels - selectedChannels);
  const channelReductionRate = currentChannels > 0 ? channelDiff / currentChannels : 0;

  // 3. 사용자가 실제로 보는 채널/장르가 유지되는지 확인 (채널 감소율이 15% 이하이면 필수 채널 유지로 간주)
  const isRequiredChannelsMaintained = channelReductionRate <= 0.15;

  // 4. 채널 손실 패널티 차감 (채널당 100원 패널티)
  const channelLossPenalty = channelDiff * 100;
  const netBenefit = saving - channelLossPenalty;

  // 5. 실질 월 이득 기준으로 골드/실버/브론즈 판정
  let grade = "Normal";
  let gradeLabel = "일반 등급";
  let gradeEmoji = "🌱";
  let gradeReason = "현재 이용 요금에 대비하여 실질 월 이득이 부족하거나, 채널 손실이 커 필수 채널 구성이 유지되지 않았습니다. 기존 요금제를 지키시는 것을 권장합니다.";
  let gradeTheme = { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border/60", ring: "ring-muted" };

  if (saving >= 10000 || netBenefit >= 10000 || savingRate >= 0.30) {
    grade = "Gold";
    gradeLabel = "골드 등급";
    gradeEmoji = "🏆";
    gradeReason = `월 ${fmt(saving > 0 ? saving : netBenefit)}원(${Math.round(savingRate * 100)}%) 상당의 뛰어난 통신 지출을 절감하셨습니다! 매우 합리적인 IPTV 소비 상태입니다.`;
    gradeTheme = { bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", ring: "ring-amber-500/30" };
  } else if (saving >= 5000 || netBenefit >= 5000 || savingRate >= 0.15) {
    grade = "Silver";
    gradeLabel = "실버 등급";
    gradeEmoji = "🥈";
    gradeReason = `월 ${fmt(saving > 0 ? saving : netBenefit)}원(${Math.round(savingRate * 100)}%) 가량의 고정비를 아꼈습니다. 현명한 지출 제어 패턴입니다.`;
    gradeTheme = { bg: "bg-slate-500/5", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20", ring: "ring-slate-500/30" };
  } else if (saving >= 2000 || netBenefit >= 2000 || savingRate >= 0.05) {
    grade = "Bronze";
    gradeLabel = "브론즈 등급";
    gradeEmoji = "🥉";
    gradeReason = `월 ${fmt(saving > 0 ? saving : netBenefit)}원(${Math.round(savingRate * 100)}%) 수준의 고정비를 확보하셨습니다. 자주 안 보는 선호 채널 리스트와 맞춤 비교를 추천드립니다.`;
    gradeTheme = { bg: "bg-orange-500/5", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", ring: "ring-orange-500/30" };
  }

  return (
    <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-md transition-all hover:shadow-lg relative ${gradeTheme.bg} ${gradeTheme.border}`}>
      
      {/* 카드 오른쪽 상단 공유 버튼 */}
      <div className="absolute right-4 top-4 z-20">
        <PurchaseGradeShareButton />
      </div>

      {/* 상단 타이틀 */}
      <div className="flex flex-col items-center text-center gap-1 border-b border-border/40 pb-4">
        <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">
          IPTV 소비 분석
        </span>
        <h3 className="text-base font-black tracking-tight text-primary">
          나의 IPTV 요금 소비 등급
        </h3>
      </div>

      {/* 강조된 대형 등급 이모지 */}
      <div className="my-6 flex flex-col items-center justify-center">
        <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-background border shadow-inner ring-8 ${gradeTheme.ring} animate-pulse`}>
          <span className="text-6xl select-none leading-none">{gradeEmoji}</span>
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

      {/* 절감 비율 프로그레스 바 */}
      {saving > 0 && (
        <div className="mt-5">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1 font-bold">
            <span>실질 월 이득</span>
            <span>{fmt(netBenefit)}원 이득</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${grade === "Gold" ? "bg-amber-500" : grade === "Silver" ? "bg-slate-500" : "bg-orange-500"}`}
              style={{ width: `${Math.min(100, Math.max(10, (netBenefit / 12000) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* 공유 링크 안내 */}
      <div className="mt-5 text-[10px] text-center text-muted-foreground/60 leading-normal">
        나의 등급을 인스타그램 등 SNS에 인증하여<br />
        주변 지인들과 스마트한 IPTV 소비를 공유해 보세요!
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
