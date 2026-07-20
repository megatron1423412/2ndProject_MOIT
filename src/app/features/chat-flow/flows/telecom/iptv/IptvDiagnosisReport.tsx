// src/app/features/chat-flow/flows/telecom/iptv/IptvDiagnosisReport.tsx

import React, { useState, useEffect } from "react";
import { CheckCircle2, ShieldAlert, Sparkles, ExternalLink, Activity, ArrowRightLeft, Bot, Loader2 } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import { mockIptvPlans } from "./mockData";
import { generateTelecomComment, buildIptvCommentPrompt } from "../shared/telecomApi";

interface IptvDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

const providerTypeLabelMap: Record<string, string> = {
  sk_btv: "B tv(SK브로드밴드)",
  kt_genie: "지니 TV",
  lg_uplus: "U+ IPTV",
  dlive: "딜라이브",
  kt_hcn: "KT HCN",
  genie_skylife: "지니 TV 스카이라이프",
  kt_skylife: "KT 스카이라이프",
  none: "셋톱박스 없음",
};

export default function IptvDiagnosisReport({ result }: IptvDiagnosisReportProps) {
  const answers = result.metadata?.answers || {};

  const currentPriceInput = Number(answers["iptv.currentPlanPriceInput"] || 0);

  const confirmedPlanId = answers["iptv.confirmedPlan"] || answers["iptv.confirmedPlanList"] || "";
  const planNameManual = answers["iptv.currentPlanNameManual"] as string;

  let currentPlanString = "";
  let currentChannels = 200;

  if (planNameManual) {
    const providerType = answers["iptv.providerType"] || "none";
    const providerLabel = providerTypeLabelMap[providerType] ?? "직접 입력 요금제";
    currentPlanString = `[${providerLabel}] ${planNameManual}`;
  } else if (confirmedPlanId) {
    const foundPlan = mockIptvPlans.find((p) => p.id === confirmedPlanId);
    if (foundPlan) {
      currentPlanString = `[${foundPlan.carrier}] ${foundPlan.name}`;
      currentChannels = foundPlan.channels;
    }
  }

  if (!currentPlanString) {
    const providerType = answers["iptv.providerType"] || "none";
    const providerLabel = providerTypeLabelMap[providerType] ?? "직접 입력 요금제";
    currentPlanString = `[${providerLabel}] 기본 요금제`;
  }

  const selectedPlanId = answers["iptv.selectedNewPlan"] || answers["iptv.selectedNewPlanDirect"];
  const selectedPlan = mockIptvPlans.find((p) => p.id === selectedPlanId);
  const selectedPlanString = selectedPlan
    ? `[${selectedPlan.carrier}] ${selectedPlan.name}`
    : "선택 요금제 정보 없음";
  const selectedPrice = selectedPlan ? selectedPlan.price : 0;
  const selectedChannels = selectedPlan ? selectedPlan.channels : 0;

  // ① 절약형 공식: 기존 요금 - 선택 요금
  const savingDiff = currentPriceInput - selectedPrice;
  // ② 지출형 공식: 선택 요금 - 기존 요금
  const spendingDiff = selectedPrice - currentPriceInput;

  const isSaving = savingDiff >= 0;

  // ── Ollama AI 코멘트 ────────────────────────────────────────
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  const providerLabel = providerTypeLabelMap[answers["iptv.providerType"] as string || "none"] || "IPTV";

  useEffect(() => {
    let cancelled = false;
    const prompt = buildIptvCommentPrompt({
      provider: providerLabel,
      currentFee: currentPriceInput,
      selectedPlanName: selectedPlanString,
      selectedFee: selectedPrice,
      selectedChannels,
    });
    generateTelecomComment(prompt, "iptv").then((comment) => {
      if (!cancelled) { setAiComment(comment); setAiLoading(false); }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-md transition-all hover:shadow-lg">
      
      {/* 1. 상단 타이틀 및 현재 요금제 안내 */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">
            IPTV 분석 솔루션
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
            <Sparkles size={12} /> 요금 비교·추천 솔루션
          </span>
        </div>
      </div>

      {/* 현재 사용중 요약 */}
      <div className="mt-5 rounded-xl bg-muted/20 p-4 border border-border/40 text-xs sm:text-sm">
        <p className="font-black text-primary leading-relaxed text-center">
          현재 당신의 요금제는 <span className="text-accent font-extrabold">"{currentPlanString}"</span> 입니다.
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
              {currentPlanString}
            </h4>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-lg font-black text-primary">{fmt(currentPriceInput)}</span>
              <span className="text-xs text-muted-foreground">원/월</span>
            </div>
            <div className="mt-4 border-t border-border/40 pt-3 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">채널 수</span>
                <span className="font-bold text-primary">약 {currentChannels}개 채널</span>
              </div>
            </div>
          </div>

          {/* 선택 요금제 카드 */}
          <div className="relative rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-sm">
            <div className="absolute -top-2.5 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
              SELECTED SPEC
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase">RECOMMENDED SPEC</span>
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600">선택 요금제</span>
            </div>
            <h4 className="mt-2 text-sm font-black text-primary truncate">
              {selectedPlanString}
            </h4>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-lg font-black text-blue-600">{fmt(selectedPrice)}</span>
              <span className="text-xs text-muted-foreground">원/월</span>
            </div>
            <div className="mt-4 border-t border-blue-500/20 pt-3 flex flex-col gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">채널 수</span>
                <span className="font-bold text-blue-600">{selectedChannels}개 채널</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 금액 변동 문구 */}
      <div className="mt-5 rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
        <div className="flex items-center gap-2 border-b border-blue-500/10 pb-2">
          <ArrowRightLeft className="text-blue-500" size={15} />
          <h4 className="text-xs font-black text-primary">"{selectedPlanString}"을 선택한다면</h4>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-primary/95 font-medium font-sans">
          {savingDiff > 0 ? (
            <>
              TV 요금제를 일상 실속형(~200개 채널)으로 낮추면, 매달 고정비 <span className="font-extrabold text-emerald-600">{fmt(savingDiff)}원</span> / 연 <strong>{fmt(savingDiff * 12)}원</strong>을 아낄 수 있어요!<br />
              (자주 안 보던 유료 전문 채널만 제외될 뿐, tvN이나 지상파·종편 등 주요 예능·드라마 본방사수는 똑같이 끊김 없이 가능합니다.)
            </>
          ) : savingDiff < 0 ? (
            <>
              매달 <span className="font-extrabold text-destructive">{fmt(spendingDiff)}원</span> / 연 <strong>{fmt(spendingDiff * 12)}원</strong>이 더 지출되지만, TV 채널이 전 채널 정석형(~230개 채널 이상)으로 늘어나 야구·축구 생중계, 애니메이션, 해외 드라마까지 채널 막힘없이 쾌적하게 즐길 수 있습니다.
            </>
          ) : (
            <>
              현재 납부하고 계신 요금({fmt(currentPriceInput)}원)은 선택 요금제 요금과 동일하여 금액 변동이 없습니다.
            </>
          )}
        </p>
      </div>

      {/* AI 맞춤 코멘트 (Ollama) */}
      <div className="mt-6 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <div className="flex items-center gap-2 border-b border-violet-500/10 pb-2">
          <Bot className="text-violet-500" size={14} />
          <span className="text-xs font-black text-violet-600 dark:text-violet-400">AI 맞춤 절약 가이드</span>
          <span className="ml-auto rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-500">Ollama</span>
        </div>
        {aiLoading ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={13} className="animate-spin text-violet-400" />
            AI가 맞춤 가이드를 생성 중입니다...
          </div>
        ) : aiComment ? (
          <p className="mt-3 text-xs leading-relaxed text-primary/90 font-medium whitespace-pre-wrap">{aiComment}</p>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground/70">AI 가이드를 불러올 수 없습니다. Ollama가 실행 중인지 확인해 주세요.</p>
        )}
      </div>

      {/* 하단 안내 */}
      <div className="mt-4 flex flex-col gap-2 text-[10px] text-center text-muted-foreground/60 leading-normal">
        <p>본 리포트는 고객님이 입력하신 정보와 추천 요금 데이터를 바탕으로 작성되었습니다.</p>
      </div>

    </div>
  );
}
