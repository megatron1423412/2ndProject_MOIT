// src/app/features/chat-flow/flows/telecom/bundle/BundleDiagnosisReport.tsx

import React from "react";
import { CheckCircle2, ShieldAlert, Sparkles, ExternalLink, ArrowRightLeft } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import { mockBundlePlans } from "./mockData";

interface BundleDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

const carrierLabelMap: Record<string, string> = {
  SK: "SK브로드밴드",
  KT: "KT올레",
  LGU: "LG유플러스",
  SKYLIFE: "스카이라이프",
};

const serviceLabelMap: Record<string, string> = {
  phone: "이동전화",
  internet: "인터넷",
  iptv: "IPTV",
  "home-phone": "집전화",
};

export default function BundleDiagnosisReport({ result }: BundleDiagnosisReportProps) {
  const answers = result.metadata?.answers || {};

  const currentCarrier = answers["bundle.currentCarrier"] as string;
  const currentCarrierLabel = carrierLabelMap[currentCarrier] || "기존 통신사";
  
  const currentServicesRaw = answers["bundle.currentServices"] as string[];
  const currentServicesList = Array.isArray(currentServicesRaw) ? currentServicesRaw : [];
  const currentServicesLabels = currentServicesList
    .filter((s) => s !== "done")
    .map((s) => serviceLabelMap[s] || s);
  
  const currentServicesString = currentServicesLabels.join(", ") || "선택 안 됨";
  
  const currentFee = Number(answers["bundle.currentFee"] || 0);
  const currentPlanString = `[${currentCarrierLabel}] 결합상품 (월 ${fmt(currentFee)}원)`;

  const knowPenalty = answers["bundle.knowPenalty"] === "yes";
  const penaltyAmount = Number(answers["bundle.penalty"] || 0);

  const desiredCarrier = answers["bundle.desiredCarrier"] as string;
  const desiredCarrierLabel = carrierLabelMap[desiredCarrier] || "희망 통신사";

  const desiredServicesRaw = answers["bundle.desiredServices"] as string[];
  const desiredServicesList = Array.isArray(desiredServicesRaw) ? desiredServicesRaw : [];
  const desiredServicesLabels = desiredServicesList
    .filter((s) => s !== "done")
    .map((s) => serviceLabelMap[s] || s);
  const desiredServicesString = desiredServicesLabels.join(", ") || "선택 안 됨";

  // 사용자가 최종 선택한 추천 요금제
  const selectedPlanId = answers["bundle.selectedRecommendedPlan"] || answers["bundle.manualSelectedPlan"];
  const customPlanName = answers["bundle.customPlanName"] as string;

  let selectedPlanName = "";
  let selectedPrice = 0;

  if (customPlanName) {
    selectedPlanName = `[${desiredCarrierLabel}] ${customPlanName}`;
    // 직접 입력 시 적절한 가격 유추 (없으면 기본값 45000)
    const matchingPlans = mockBundlePlans.filter((p) => p.carrier === desiredCarrier);
    const avgPrice = matchingPlans.length > 0 
      ? Math.round(matchingPlans.reduce((sum, p) => sum + p.price, 0) / matchingPlans.length)
      : 45000;
    selectedPrice = avgPrice;
  } else {
    const selectedPlan = mockBundlePlans.find((p) => p.id === selectedPlanId);
    if (selectedPlan) {
      selectedPlanName = selectedPlan.name;
      selectedPrice = selectedPlan.price;
    } else {
      // fallback
      selectedPlanName = `[${desiredCarrierLabel}] 맞춤 추천 결합 요금제`;
      selectedPrice = 55000;
    }
  }

  // 연산 공식: {{기존 결합 총액 - 바꾼 결합 총액}}
  const savingDiff = currentFee - selectedPrice;
  const monthlySaving = Math.max(0, savingDiff);
  const yearlySaving = monthlySaving * 12;

  const currentMembers = answers["bundle.currentMembers"] || "1인";
  const desiredMembers = answers["bundle.desiredMembers"] || "1인";

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-md transition-all hover:shadow-lg">
      
      {/* 1. 상단 타이틀 및 기존 결합 요금제 안내 */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
            결합상품 분석 솔루션
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
            <Sparkles size={12} /> 요금 비교·추천 솔루션
          </span>
        </div>
      </div>

      {/* 현재 결합 요금제 안내 */}
      <div className="mt-5 rounded-xl bg-muted/20 p-4 border border-border/40 text-xs sm:text-sm">
        <p className="font-black text-primary leading-relaxed text-center">
          현재 당신의 결합 요금제는 <span className="text-accent font-extrabold">"{currentServicesString}"</span>의 <span className="text-accent font-extrabold">"{currentPlanString}"</span>입니다.
        </p>
      </div>

      {/* 2. 현재 요금제, 선택 요금제를 카드 형식으로 보여줌 */}
      <div className="mt-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 현재 요금제 카드 */}
          <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE</span>
              <span className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">현재 상태</span>
            </div>
            <h4 className="mt-2 text-sm font-black text-primary truncate">
              {currentCarrierLabel} 결합상품
            </h4>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-lg font-black text-primary">{fmt(currentFee)}</span>
              <span className="text-xs text-muted-foreground">원/월</span>
            </div>
            <div className="mt-4 border-t border-border/40 pt-3 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">결합 구성</span>
                <span className="font-bold text-primary truncate max-w-[120px]">{currentServicesString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">결합 인원</span>
                <span className="font-bold text-primary">{currentMembers}</span>
              </div>
            </div>
          </div>

          {/* 선택 요금제 카드 */}
          <div className="relative rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 shadow-sm">
            <div className="absolute -top-2.5 right-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
              SELECTED SPEC
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase">RECOMMENDED SPEC</span>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-600">선택 요금제</span>
            </div>
            <h4 className="mt-2 text-sm font-black text-primary truncate" title={selectedPlanName}>
              {selectedPlanName}
            </h4>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-lg font-black text-indigo-600">{fmt(selectedPrice)}</span>
              <span className="text-xs text-muted-foreground">원/월</span>
            </div>
            <div className="mt-4 border-t border-indigo-500/20 pt-3 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">결합 구성</span>
                <span className="font-bold text-indigo-600 truncate max-w-[120px]">{desiredServicesString}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">결합 인원</span>
                <span className="font-bold text-indigo-600">{desiredMembers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 & 4. 솔루션 문구 및 위약금 고지 */}
      <div className="mt-6 border-t border-border/40 pt-4 flex flex-col gap-4">
        
        {/* 월 절약액 솔루션 문구 */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
          <p className="text-xs font-black flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} /> 맞춤 절약 솔루션
          </p>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-primary/95 font-medium">
            "숨어있던 가족 결합 할인을 재조정하여 매달 고정비 <span className="font-extrabold text-emerald-600">{fmt(monthlySaving)}원</span> / 연 <span className="font-extrabold text-emerald-600">{fmt(yearlySaving)}원</span>을 통장에 남길 수 있어요!"
          </p>
        </div>

        {/* 위약금 유무에 따른 고지 */}
        {knowPenalty ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-start">
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="text-xs leading-relaxed">
              <p className="font-black text-amber-600 dark:text-amber-400">⚠️ 이동 전, 탈출 비용(위약금)을 꼭 확인하세요!</p>
              <p className="mt-1 text-muted-foreground font-medium">
                지금 해지 시 약 <span className="font-extrabold text-primary">{fmt(penaltyAmount)}원</span>의 위약금이 발생할 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-start">
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={16} />
            <div className="text-xs leading-relaxed">
              <p className="font-black text-amber-600 dark:text-amber-400">⚠️ 이동 전, 탈출 비용(위약금)을 꼭 확인하세요!</p>
              <p className="mt-1 text-muted-foreground font-medium">
                현재 기존 약정 금액이 확인되지 않아, 지금 해지 시 예상치 못한 중도 해지 위약금이 발생할 수 있습니다.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* 4. 부가서비스 링크 버튼 */}
      <div className="mt-6 flex flex-col gap-2.5">
        <a
          href="https://www.moit.co.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-surface py-3 text-xs font-black text-brand-surface-foreground shadow-sm transition-all hover:bg-brand-surface/90 hover:scale-[1.01] active:scale-[0.99]"
        >
          {desiredCarrierLabel} 결합상품 할인 혜택 및 상세 조건 확인 <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-center text-muted-foreground/60 leading-normal">
          본 리포트는 고객님이 입력하신 정보를 바탕으로 모잇(MOIT)에서 계산한 참고용 자료입니다. 
          실제 가입 시점의 결합 조건 및 프로모션에 따라 다를 수 있습니다.
        </p>
      </div>

    </div>
  );
}
