
import React, { useState, useEffect } from "react";
import { CheckCircle2, ClipboardCheck, ArrowRightLeft, ShieldAlert, Sparkles, ExternalLink, Activity, Loader2, AlertTriangle } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import { getPlanSpec, ALL_MVNO_PLAN_SPECS, PlanSpec } from "./mockData";
import {
  mapDataVolumeToMB,
  mapNetworkToType,
  mapAgeGroupToAge,
  fetchSmartChoicePhonePlans,
  mapContractToDis,
} from "../shared/telecomApi";

interface PhoneDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function PhoneDiagnosisReport({ result }: PhoneDiagnosisReportProps) {
  const answers = result.metadata?.answers || {};
  
  const carrier = answers["phone.carrier"] || "skt";
  const currentFee = Number(answers["phone.currentFee"]) || 0;
  const confirmedPlanRaw = answers["phone.confirmedPlan"] || answers["phone.confirmedPlanList"] || "";
  let confirmedPlan = "";
  if (confirmedPlanRaw.startsWith("plan-api|")) {
    confirmedPlan = confirmedPlanRaw.split("|")[1];
  } else if (confirmedPlanRaw === "direct-input" || confirmedPlanRaw === "direct-select" || confirmedPlanRaw === "none-of-them") {
    const listRaw = answers["phone.confirmedPlanList"] || "";
    if (listRaw.startsWith("plan-api|")) {
      confirmedPlan = listRaw.split("|")[1];
    } else if (listRaw && listRaw !== "none-of-them") {
      confirmedPlan = listRaw;
    } else {
      confirmedPlan = answers["phone.customPlan"] || "";
    }
  } else {
    confirmedPlan = confirmedPlanRaw || answers["phone.customPlan"] || "";
  }
  const selectedRecommendedPlan = answers["phone.selectedRecommendedPlan"] || "rec-mock-1";
  const dataVolume = (answers["phone.dataVolume"] || "mid") as string;
  const ageGroup = (answers["phone.ageGroup"] || "normal") as string;
  const desiredNetwork = (answers["phone.desiredNetwork"] || "5g") as string;
  const contractPeriod = (answers["phone.contractPeriod"] || "") as string;
  const isContractRemaining = contractPeriod === "remaining" || contractPeriod === "unknown";
  const discountOptionValue = Array.isArray(answers["phone.discountOption"])
    ? (answers["phone.discountOption"] as string[]).join(",")
    : String(answers["phone.discountOption"] || "");
  const hasSelectDiscount = Array.isArray(answers["phone.discountOption"])
    ? (answers["phone.discountOption"] as string[]).includes("select-discount")
    : answers["phone.discountOption"] === "select-discount";
  const currentPlanFee = hasSelectDiscount ? Math.round(currentFee / 0.75) : currentFee;

  // ── 스마트초이스 실시간 API 요금제 페칭 ───────────────────────
  const [apiPlan, setApiPlan] = useState<any | null>(null);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const reqData = mapDataVolumeToMB(dataVolume);
    const reqAge = mapAgeGroupToAge(ageGroup);
    const reqType = mapNetworkToType(desiredNetwork);
    const reqDis = mapContractToDis(discountOptionValue || undefined);

    setApiLoading(true);
    setApiPlan(null);

    fetchSmartChoicePhonePlans({
      voice: "999999",
      data: reqData,
      sms: "999999",
      age: reqAge,
      type: reqType,
      dis: reqDis
    }).then((res) => {
      if (cancelled) return;
      if (res.success && res.plans && res.plans.length > 0) {
        const p = res.plans[0]; // 가장 조건에 잘 맞는 최저가/추천 요금제
        
        let dataValueMB = 10240;
        const gbMatch = p.data.match(/(\d+)GB/);
        const mbMatch = p.data.match(/(\d+)MB/);
        if (gbMatch) dataValueMB = parseInt(gbMatch[1], 10) * 1024;
        else if (mbMatch) dataValueMB = parseInt(mbMatch[1], 10);
        else if (p.data.includes("무제한")) dataValueMB = 102400;

        const qosMatch = p.data.match(/(\d+(Mbps|kbps))/);
        const qosSpeed = qosMatch ? qosMatch[1] : undefined;
        const hasQos = p.data.includes("속도제어") || p.data.includes("QoS") || !!qosSpeed;

        let voiceMin = 300;
        const voiceMatch = p.voice.match(/(\d+)분/);
        if (voiceMatch) voiceMin = parseInt(voiceMatch[1], 10);
        else if (p.voice.includes("기본") || p.voice.includes("무제한")) voiceMin = 9999;

        let smsCount = 100;
        if (p.sms.includes("기본") || p.sms.includes("무제한")) smsCount = 9999;

        const getCarrierLink = (telecomStr?: string, linkUrl?: string) => {
          if (linkUrl && linkUrl.trim() !== "" && !linkUrl.includes("smartchoice.or.kr")) {
            return linkUrl;
          }
          const t = (telecomStr || "").toUpperCase();
          if (t.includes("SKT") || t.includes("SK")) return "https://www.tworld.co.kr";
          if (t.includes("KT")) return "https://shop.kt.com";
          if (t.includes("LGU") || t.includes("LG") || t.includes("유플러스")) return "https://www.lguplus.com";
          if (t.includes("알뜰") || t.includes("MVNO")) return "https://www.mvnohub.kr";
          return "https://www.tworld.co.kr";
        };

        setApiPlan({
          carrier: p.telecom,
          name: p.planName,
          price: p.monthlyFee,
          ageLimit: "스마트초이스 추천 기준",
          signUpMethod: "온라인/오프라인",
          data: p.data,
          dataValueMB,
          hasQos,
          qosSpeed,
          voice: p.voice,
          voiceMin,
          sms: p.sms,
          smsCount,
          link: getCarrierLink(p.telecom, p.link),
        });
      }
      setApiLoading(false);
    });

    return () => { cancelled = true; };
  }, [dataVolume, ageGroup, desiredNetwork, discountOptionValue]);

  // 기존 요금제 스펙 & 추천 요금제 스펙 매칭 (유저가 추천 카드 또는 '직접 고를래요'에서 선택한 요금제 최우선 적용)
  const currentSpec = getPlanSpec(confirmedPlan, carrier, currentPlanFee, dataVolume);

  const rawSelectedPlan = (answers["phone.manualSelectedPlan"] && answers["phone.manualSelectedPlan"] !== "direct-choose")
    ? (answers["phone.manualSelectedPlan"] as string)
    : (answers["phone.selectedRecommendedPlan"] as string) || "";

  let selectedPlanClean = rawSelectedPlan;
  if (selectedPlanClean.startsWith("plan-api|")) {
    selectedPlanClean = selectedPlanClean.split("|")[1];
  }
  selectedPlanClean = selectedPlanClean.replace(/^\[추천\s*\d+순위\]\s*/, "").trim();

  let userSelectedSpec: PlanSpec | null = null;
  if (selectedPlanClean && selectedPlanClean !== "direct-choose") {
    userSelectedSpec = getPlanSpec(selectedPlanClean, carrier, currentFee, dataVolume);
  }

  const recommendedSpec = userSelectedSpec || (apiPlan && !selectedPlanClean ? apiPlan : getPlanSpec(selectedRecommendedPlan, carrier, currentFee, dataVolume));
  const recommendedPaidFee = hasSelectDiscount ? Math.round(recommendedSpec.price * 0.75) : recommendedSpec.price;

  // 차액 계산
  const priceDiff = currentFee - recommendedPaidFee;
  const dataDiffMB = recommendedSpec.dataValueMB - currentSpec.dataValueMB;
  const dataDiffLabel = dataDiffMB > 0 
    ? `${(dataDiffMB / 1024).toFixed(1)}GB` 
    : `${(Math.abs(dataDiffMB) / 1024).toFixed(1)}GB`;

  // 데이터 가치 계산 (MB당 22.53원)
  const dataBenefit = Math.round(Math.max(0, dataDiffMB) * 22.53);
  
  // 통화 가치 계산 (분당 118.8원)
  const voiceValue = Math.round(recommendedSpec.voiceMin * 118.8);
  
  // 문자 가치 계산 (건당 22원)
  const smsValue = Math.round(recommendedSpec.smsCount * 22);

  // 안심 캡 상한선 계산 (최대 19,800원)
  const capBenefit = Math.round(Math.min(Math.max(0, dataDiffMB) * 22.53, 19800));

  // 데이터 구간 분류
  const isMidRange = dataDiffMB >= 5120 && dataDiffMB < 15360;
  const isHighRange = dataDiffMB >= 15360 && dataDiffMB < 30720;
  const isUltraRange = dataDiffMB >= 30720;

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-md transition-all hover:shadow-lg">
      
      {/* 1. 상단 타이틀 */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
            {currentSpec.carrier} 요금 분석
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
            <Sparkles size={12} /> 요금 비교·추천 솔루션
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-primary">
            통신 설계 비교 분석 리포트
          </h2>
          <span className="shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
            진단 완료
          </span>
        </div>
      </div>

      {/* 2. 대조 요약 */}
      <div className="mt-5 rounded-xl bg-muted/20 p-4 border border-border/40 text-xs sm:text-sm">
        <p className="font-black text-primary leading-relaxed text-center">
          현재 당신의 요금제는 <span className="text-accent font-extrabold">"{currentSpec.name}"</span> 입니다.
        </p>
      </div>

      {/* 2-1. 약정 확인 경고 안내 */}
      {isContractRemaining && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex gap-3 items-start">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
          <div className="text-xs leading-relaxed">
            <p className="font-black text-amber-600 dark:text-amber-400">📌 변경 전 확인사항</p>
            <p className="mt-1 text-muted-foreground font-medium">
              현재 약정이 남아 있는 것으로 확인되었습니다. 요금제 변경 또는 통신사 이동 전 위약금 및 약정 조건을 확인하시기 바랍니다.
            </p>
          </div>
        </div>
      )}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* 기존 요금제 */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-primary">현재 사용 중인 요금</span>
            <span className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {currentSpec.carrier}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate">
            {currentSpec.name}
          </h4>
          
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold">할인 전</span>
              <span className="font-semibold">{fmt(currentSpec.price)}원/월</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm rounded-lg bg-accent/10 p-2 border border-accent/20">
              <span className="font-black text-accent">실납부액</span>
              <span className="font-black text-accent">{fmt(currentFee)}원/월</span>
            </div>
          </div>
          
          <div className="mt-4 border-t border-border/40 pt-3 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">사용가능 데이터</span>
              <span className="font-bold text-primary">{currentSpec.data}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">무료 통화 시간</span>
              <span className="font-bold text-primary">
                {currentSpec.voiceMin === 9999 ? "무제한" : `${currentSpec.voiceMin}분`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">무료 문자 건수</span>
              <span className="font-bold text-primary">
                {currentSpec.smsCount === 9999 ? "기본제공" : `${currentSpec.smsCount}건`}
              </span>
            </div>
          </div>
        </div>

        {/* 추천 요금제 */}
        <div className="relative rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm min-h-[180px] flex flex-col justify-between">
          <div className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
            추천 요금제
          </div>
          {apiLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2">
              <Loader2 size={20} className="animate-spin text-emerald-500" />
              <span className="text-xs text-muted-foreground font-black">실시간 요금제 조회 중...</span>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-600">추천하는 요금제</span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    {recommendedSpec.carrier}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-black text-primary truncate" title={recommendedSpec.name}>
                  {recommendedSpec.name}
                </h4>
                
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                    <span className="font-semibold">요금액</span>
                    <span className="font-semibold">{fmt(recommendedSpec.price)}원/월</span>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-black text-emerald-700 dark:text-emerald-300">실납부액</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">{fmt(recommendedPaidFee)}원/월</span>
                    </div>
                    {hasSelectDiscount && (
                      <span className="text-[10px] font-medium text-emerald-600/80 text-right">선택약정 25% 할인 반영</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-emerald-500/20 pt-3 flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">사용가능 데이터</span>
                  <span className="font-bold text-primary">{recommendedSpec.data}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">무료 통화 시간</span>
                  <span className="font-bold text-primary">
                    {recommendedSpec.voiceMin === 9999 ? "무제한" : `${recommendedSpec.voiceMin}분`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">무료 문자 건수</span>
                  <span className="font-bold text-primary">
                    {recommendedSpec.smsCount === 9999 ? "기본제공" : `${recommendedSpec.smsCount}건`}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. 금액 변동 */}
      <div className="mt-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
        <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-2">
          <ArrowRightLeft className="text-emerald-500" size={15} />
          <h4 className="text-xs font-black text-primary">금액 변동 솔루션</h4>
        </div>
        <div className="mt-2 space-y-2 text-xs leading-relaxed text-primary/95 font-medium">
          {priceDiff > 0 ? (
            <p>
              • 기존 요금제보다 매달 고정비 <span className="font-extrabold text-emerald-600">{fmt(priceDiff)}원</span>을 아끼고, 1년이면 총 <span className="font-extrabold text-emerald-600">{fmt(priceDiff * 12)}원</span>을 저축할 수 있어요!
            </p>
          ) : priceDiff < 0 ? (
            <p>
              • 매달 <span className="font-extrabold text-destructive">{fmt(Math.abs(priceDiff))}원</span>이 더 지출되지만, <span className="font-bold text-accent">원하시는 데이터 스펙을 훨씬 넉넉하게 채울 수 있어 훨씬 효율적이에요!</span>
            </p>
          ) : null}
          <p>
            • 기존 요금제 대비 숨은 통신 생활비 고정 지출이 매달 <span className="font-extrabold">{fmt(Math.abs(priceDiff))}원</span> {priceDiff > 0 ? "감소" : priceDiff < 0 ? "증가" : "변동"}됩니다.
          </p>
        </div>
      </div>

      {/* 부가서비스 링크 버튼 */}
      <div className="mt-4 flex flex-col gap-2.5">
        <a
          href={recommendedSpec.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-surface py-3 text-xs font-black text-brand-surface-foreground shadow-sm transition-all hover:bg-brand-surface/90 hover:scale-[1.01] active:scale-[0.99]"
        >
          {recommendedSpec.carrier} 요금제 상세 정보 및 부가서비스 확인 <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-center text-muted-foreground/60 leading-normal">
          본 리포트는 고객님이 입력하신 정보를 바탕으로 모잇(MOIT)에서 계산한 참고용 자료입니다.
          실제 가입 시점의 결합 조건 및 프로모션에 따라 다를 수 있습니다.<br />
          <span className="text-muted-foreground/50">[요금제 데이터 출처: 스마트초이스(https://www.smartchoice.or.kr)]</span>
        </p>
      </div>

    </div>
  );
}
