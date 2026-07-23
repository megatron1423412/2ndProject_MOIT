import React from "react";
import { CheckCircle2, ShieldAlert, Sparkles, ExternalLink, Activity, Wifi, Laptop, ArrowRightLeft, Users, AlertTriangle } from "lucide-react";
import type { FlowResult } from "../../../core/types";

interface InternetDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

const carrierMap: Record<string, string> = {
  SK: "SK브로드밴드",
  KT: "KT 올레",
  LGU: "LG 유플러스",
  HELLOVISION: "LG 헬로비전",
  KTSKY: "KT 스카이라이프",
  KTHCN: "KT HCN",
  SKYLIFE: "스카이라이프",
  DLIVE: "딜라이브",
  LOCAL: "지역 인터넷",
};

const speedMap: Record<string, string> = {
  "100": "100Mbps (슬림)",
  "200": "200Mbps (안심/슬림플러스)",
  "320": "320Mbps (세이브플러스)",
  "500": "500Mbps (베이직)",
  "1000": "1Gbps (기가)",
  "2500": "2.5Gbps (프리미엄)",
  "5000": "5Gbps (프리미엄)",
  "10000": "10Gbps (프리미엄)",
  unknown: "미확인 (기본형)",
};

import { MOCK_ALL_INTERNET_PLANS, SK_INTERNET_PLANS, KT_INTERNET_PLANS, LGU_INTERNET_PLANS, HELLOVISION_INTERNET_PLANS, SKYLIFE_INTERNET_PLANS, KTHCN_INTERNET_PLANS, DLIVE_INTERNET_PLANS, carrierUrlMap } from "./mockData";

export default function InternetDiagnosisReport({ result }: InternetDiagnosisReportProps) {
  const answers = result.metadata?.answers || {};

  const carrier = answers["internet.cableCarrier"] || answers["internet.commonCarrier"] || "KT";
  const currentFee = Number(answers["internet.fee"]) || 0;

  const confirmedPlanId = answers["internet.confirmedPlan"] || answers["internet.confirmedPlanList"] || "";
  const customPlan = answers["internet.customPlan"] as string;

  const foundPlan = SK_INTERNET_PLANS.find(p => p.id === confirmedPlanId) ||
    KT_INTERNET_PLANS.find(p => p.id === confirmedPlanId) ||
    LGU_INTERNET_PLANS.find(p => p.id === confirmedPlanId) ||
    HELLOVISION_INTERNET_PLANS.find(p => p.id === confirmedPlanId) ||
    SKYLIFE_INTERNET_PLANS.find(p => p.id === confirmedPlanId) ||
    KTHCN_INTERNET_PLANS.find(p => p.id === confirmedPlanId) ||
    DLIVE_INTERNET_PLANS.find(p => p.id === confirmedPlanId);

  let currentSpeedKey = answers["internet.currentSpeed"] || (foundPlan ? String(foundPlan.speedMbps) : "500");

  if (!answers["internet.currentSpeed"] && !foundPlan) {
    if (confirmedPlanId.includes("100Mbps") || confirmedPlanId.includes("100m")) {
      currentSpeedKey = "100";
    } else if (confirmedPlanId.includes("500Mbps") || confirmedPlanId.includes("500m")) {
      currentSpeedKey = "500";
    } else if (confirmedPlanId.includes("1Gbps") || confirmedPlanId.includes("1000m") || confirmedPlanId.includes("1g")) {
      currentSpeedKey = "1000";
    } else if (confirmedPlanId.includes("2.5Gbps") || confirmedPlanId.includes("2.5g")) {
      currentSpeedKey = "2500";
    } else if (confirmedPlanId.includes("5Gbps") || confirmedPlanId.includes("5g")) {
      currentSpeedKey = "5000";
    } else if (confirmedPlanId.includes("10Gbps") || confirmedPlanId.includes("10g")) {
      currentSpeedKey = "10000";
    }
  }

  let currentPlanName = "";
  if (customPlan) {
    currentPlanName = customPlan;
  } else if (foundPlan) {
    currentPlanName = `[${carrierMap[carrier] || carrier}] ${foundPlan.name}`;
  } else {
    currentPlanName = speedMap[currentSpeedKey] || currentSpeedKey;
  }

  const contractPeriod = answers["internet.contractPeriod"] || "unknown";
  const householdSize = Number(answers["internet.householdSize"]) || 1;
  const deviceCount = Number(answers["internet.deviceCount"]) || 1;
  const usage: string[] = Array.isArray(answers["internet.usage"]) ? answers["internet.usage"] : [];

  // 권장 속도 알고리즘
  let recommendedSpeedKey = "100";
  let recommendedReason = "";

  if (deviceCount >= 8 || (usage.includes("gaming") && usage.includes("work") && householdSize >= 3)) {
    recommendedSpeedKey = "1000";
    recommendedReason = "다수의 가구원이 동시에 대용량 게임 및 고화질 업무 파일을 송수신하므로 안정적인 1Gbps 속도가 적합합니다.";
  } else if (deviceCount >= 4 || householdSize >= 3 || usage.includes("streaming") || usage.includes("gaming")) {
    recommendedSpeedKey = "500";
    recommendedReason = "가구원 3인 이상 혹은 영상 OTT/게임 중심의 사용 패턴에는 끊김 없는 500Mbps가 가장 권장됩니다.";
  } else {
    recommendedSpeedKey = "100";
    recommendedReason = "1인 가구 또는 간단한 웹서핑 및 유튜브 시청 위주의 환경에는 실속형 100Mbps 속도로 충분히 쾌적하게 사용 가능합니다.";
  }

  // 권장 표준 요금 산정 (3년 약정 기준 일반적인 통신 3사 평균 요금제)
  const standardPrices: Record<string, number> = {
    "100": 22000,
    "500": 33000,
    "1000": 38500,
    "2500": 44000,
    "5000": 55000,
    "10000": 82500,
  };

  const recommendedPrice = standardPrices[recommendedSpeedKey] ?? 33000;

  // 약정 만료 여부 혜택 설명
  const isExpired = contractPeriod === "expired";
  const isRemaining = contractPeriod === "under2y" || contractPeriod === "under1y";

  // 선택 요금제 정보 (사용자가 internet-recommendation-api 또는 internet-all-plans-select 에서 고른 값)
  const selectedRecommended = answers["internet.selectedRecommendedPlan"] || "";
  const selectedPlanRaw = (selectedRecommended === "direct-choose"
    ? answers["internet.manualSelectedPlan"] || ""
    : selectedRecommended || answers["internet.manualSelectedPlan"] || "") as string;
  const contractKey = answers["internet.planContract"] || "discount3y";
  const contractLabelMap: Record<string, string> = {
    discount3y: "3년 약정",
    discount2y: "2년 약정",
    discount1y: "1년 약정",
    noDiscount: "무약정",
  };
  const selectedContractLabel = contractLabelMap[contractKey] || "3년 약정";

  const foundSelectedPlan = SK_INTERNET_PLANS.find(p => p.id === selectedPlanRaw) ||
    KT_INTERNET_PLANS.find(p => p.id === selectedPlanRaw) ||
    LGU_INTERNET_PLANS.find(p => p.id === selectedPlanRaw) ||
    HELLOVISION_INTERNET_PLANS.find(p => p.id === selectedPlanRaw) ||
    SKYLIFE_INTERNET_PLANS.find(p => p.id === selectedPlanRaw) ||
    KTHCN_INTERNET_PLANS.find(p => p.id === selectedPlanRaw) ||
    DLIVE_INTERNET_PLANS.find(p => p.id === selectedPlanRaw);

  let selectedPlanName = "";
  let selectedPrice = 0;
  let selectedSpeedText = "";

  if (foundSelectedPlan) {
    const isSk = SK_INTERNET_PLANS.some(p => p.id === selectedPlanRaw);
    const isKt = KT_INTERNET_PLANS.some(p => p.id === selectedPlanRaw);
    const isLgu = LGU_INTERNET_PLANS.some(p => p.id === selectedPlanRaw);
    const isHel = HELLOVISION_INTERNET_PLANS.some(p => p.id === selectedPlanRaw);
    const isSky = SKYLIFE_INTERNET_PLANS.some(p => p.id === selectedPlanRaw);
    const isHcn = KTHCN_INTERNET_PLANS.some(p => p.id === selectedPlanRaw);
    const isDlive = DLIVE_INTERNET_PLANS.some(p => p.id === selectedPlanRaw);
    const groupLabel = isSk ? "SK" : isKt ? "KT" : isLgu ? "LG" : isHel ? "헬로비전" : isSky ? "스카이라이프" : isHcn ? "KT HCN" : isDlive ? "딜라이브" : "";

    selectedPlanName = groupLabel ? `[${groupLabel}] ${foundSelectedPlan.name}` : foundSelectedPlan.name;
    selectedPrice = foundSelectedPlan.prices[contractKey as keyof typeof foundSelectedPlan.prices] ?? foundSelectedPlan.prices.discount3y;
    selectedSpeedText = foundSelectedPlan.speed;
  } else {
    const selectedSpeedKey = answers["internet.desiredSpeed"] as string || recommendedSpeedKey;
    selectedPrice = standardPrices[selectedSpeedKey] ?? recommendedPrice;
    selectedPlanName = `인터넷 ${speedMap[selectedSpeedKey] || selectedSpeedKey}`;
    selectedSpeedText = speedMap[selectedSpeedKey] || "500Mbps";
  }

  // 실제 절감액 계산 (현재 요금 - 최종 선택 요금제 가격)
  const actualSaving = currentFee - selectedPrice;
  const selectedSpeedKey = answers["internet.desiredSpeed"] as string || recommendedSpeedKey;

  // 약정 기간 남음 시 위약금 시뮬레이션 연산
  const penalty12 = Math.round(currentFee * 3.5);
  const penalty24 = Math.round(currentFee * 7.5);
  const bep12 = actualSaving > 0 ? Math.ceil(penalty12 / actualSaving) : null;
  const bep24 = actualSaving > 0 ? Math.ceil(penalty24 / actualSaving) : null;

  // 통신사 코드 감지 (결합 할인/사은품 링크용)
  let selectedCarrierCode = "";
  if (foundSelectedPlan) {
    if (SK_INTERNET_PLANS.some(p => p.id === selectedPlanRaw)) selectedCarrierCode = "SK";
    else if (KT_INTERNET_PLANS.some(p => p.id === selectedPlanRaw)) selectedCarrierCode = "KT";
    else if (LGU_INTERNET_PLANS.some(p => p.id === selectedPlanRaw)) selectedCarrierCode = "LGU";
    else if (HELLOVISION_INTERNET_PLANS.some(p => p.id === selectedPlanRaw)) selectedCarrierCode = "HELLOVISION";
    else if (SKYLIFE_INTERNET_PLANS.some(p => p.id === selectedPlanRaw)) selectedCarrierCode = "SKYLIFE";
    else if (KTHCN_INTERNET_PLANS.some(p => p.id === selectedPlanRaw)) selectedCarrierCode = "KTHCN";
    else if (DLIVE_INTERNET_PLANS.some(p => p.id === selectedPlanRaw)) selectedCarrierCode = "DLIVE";
  }
  const linkUrl = carrierUrlMap[selectedCarrierCode || answers["internet.cableCarrier"] || answers["internet.commonCarrier"] || ""] || "https://www.mvnohub.kr";

  const currentSpeedText = foundPlan
    ? foundPlan.speed
    : (speedMap[currentSpeedKey] || (Number(currentSpeedKey) >= 1000 ? `최대 ${Number(currentSpeedKey) / 1000}Gbps` : `최대 ${currentSpeedKey}Mbps`));

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-md transition-all hover:shadow-lg">

      {/* 상단 타이틀 */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">
            인터넷 분석 솔루션
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
            <Sparkles size={12} /> 요금 비교·추천 솔루션
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-primary">
            인터넷 설계 비교 분석 리포트
          </h2>
          <span className="shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
            진단 완료
          </span>
        </div>
      </div>

      {/* 현재 사용중 요약 */}
      <div className="mt-5 rounded-xl bg-muted/20 p-4 border border-border/40 text-xs sm:text-sm">
        <p className="font-black text-primary leading-relaxed text-center">
          현재 당신의 요금제는 <span className="text-accent font-extrabold">"{currentPlanName}"</span> 입니다.
        </p>
      </div>

      {/* 2. 카드 형식 스펙 비교 */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* 현재 인터넷 요약 카드 */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-primary">현재 사용 중인 요금</span>
            <span className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {carrierMap[carrier] || "통신사"}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate">
            {currentPlanName}
          </h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-black text-primary">{fmt(currentFee)}</span>
            <span className="text-xs text-muted-foreground">원/월</span>
          </div>

          <div className="mt-4 border-t border-border/40 pt-3 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">사용 중인 속도</span>
              <span className="font-bold text-primary">{currentSpeedText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">인터넷 가구원</span>
              <span className="font-bold text-primary">{householdSize}명 사용</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">연결 기기 수</span>
              <span className="font-bold text-primary">{deviceCount}대</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">약정 상태</span>
              <span className="font-bold text-primary">
                {isExpired ? "⚠️ 만료됨 (혜택 대상)" : "유지 중"}
              </span>
            </div>
          </div>
        </div>

        {/* 최종 추천·선택 요금제 요약 카드 */}
        <div className="relative rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-sm">
          <div className="absolute -top-2.5 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
            CONFIRMED PLAN
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-600">추천하는 요금제</span>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              최종 선택 요금제
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate" title={selectedPlanName}>
            {selectedPlanName}
          </h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-black text-blue-600">{fmt(selectedPrice)}</span>
            <span className="text-xs text-muted-foreground">원/월 ({selectedContractLabel})</span>
          </div>

          <div className="mt-4 border-t border-blue-500/20 pt-3 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">제공 속도</span>
              <span className="font-bold text-primary">{selectedSpeedText}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">약정 조건</span>
              <span className="font-bold text-primary">{selectedContractLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">예상 절감액</span>
              <span className="font-bold text-blue-600">
                {actualSaving > 0 ? `월 ${fmt(actualSaving)}원 절약` : actualSaving < 0 ? `월 ${fmt(Math.abs(actualSaving))}원 추가 지출` : "금액 변동 없음"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 금액 변동 문구 */}
      <div className="mt-5 rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
        <div className="flex items-center gap-2 border-b border-blue-500/10 pb-2">
          <ArrowRightLeft className="text-blue-500" size={15} />
          <h4 className="text-xs font-black text-primary">선택하신 요금제로 설계한다면</h4>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-primary/95 font-medium">
          {actualSaving > 0 ? (
            <>
              선택하신 요금제로 설계하시면, 매달 고정비 <span className="font-extrabold text-blue-600">{fmt(actualSaving)}원</span> / 연 <span className="font-extrabold text-blue-600">{fmt(actualSaving * 12)}원</span>을 아낄 수 있어요!<br />
              (요건에 맞춰 통신비를 효과적으로 줄이면서도 만족스러운 인터넷 속도로 쾌적하게 사용 가능합니다.)
            </>
          ) : actualSaving < 0 ? (
            <>
              매달 <span className="font-extrabold text-destructive">{fmt(Math.abs(actualSaving))}원</span> / 연 <span className="font-extrabold text-destructive">{fmt(Math.abs(actualSaving) * 12)}원</span>이 더 지출되지만, 인터넷 이용 목적과 연결 기기 상황에 최적화된 고화질 시청 및 빠른 작업 속도가 안정적으로 유지됩니다.
            </>
          ) : (
            <>
              현재 납부하고 계신 요금({fmt(currentFee)}원)은 최종 선택하신 요금제 요금과 동일하여 금액 변동이 없습니다.
            </>
          )}
        </p>
      </div>

      {/* 4. 약정 만료 혜택 안내 */}
      {isExpired && (
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3 items-start">
          <ShieldAlert className="text-emerald-500 shrink-0 mt-0.5" size={16} />
          <div className="text-xs leading-relaxed">
            <p className="font-black text-emerald-600 dark:text-emerald-400">🚨 3년 약정 만료 대상자 특별 안내</p>
            <p className="mt-1 text-muted-foreground">
              고객님은 현재 약정 기간이 모두 만료된 상태입니다. 지금은 통신사를 자유롭게 변경하거나 본사 재약정을 검토하기 가장 좋은 시기입니다.
              <span className="font-extrabold text-primary"> 홈페이지 또는 전화 상담을 통해 제공되는 할인 및 가입 혜택을 비교한 뒤</span>
              가장 유리한 조건으로 가입하시길 권장드립니다.
            </p>
          </div>
        </div>
      )}

      {/* 4-1. 약정 기간 남음 경고 배너 (isRemaining) */}
      {isRemaining && (
        <div className="mt-5 rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex gap-3 items-start">
          <AlertTriangle className="text-destructive shrink-0 mt-0.5" size={16} />
          <div className="text-xs leading-relaxed">
            <p className="font-black text-destructive">📌 변경 전 확인사항 </p>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              고객님은 현재 기존 통신사의 약정 기간이 남아있는 상태입니다. 지금 다른 통신사로 변경하시거나 중도 해지하실 경우
              <span className="font-extrabold text-destructive"> 상당한 금액의 위약금(할인반환금)이 발생</span>할 수 있습니다.
              <br />
              <span className="font-extrabold text-primary">반드시 현재 이용 중이신 통신사 고객센터를 통해 남은 위약금을 먼저 조회·확인</span>하신 후 가입을 진행해 주시기 바랍니다.
            </p>
          </div>
        </div>
      )}

      {/* 4-2. 남은 약정 기간별 위약금 시뮬레이션 (isRemaining) */}
      {isRemaining && (
        <div className="mt-5 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
            <AlertTriangle className="text-amber-500" size={16} />
            <h4 className="text-xs font-black text-primary">
              남은 약정 기간별 위약금 시뮬레이션
            </h4>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/40">
                  <th className="py-2.5 px-3 font-bold text-muted-foreground w-1/4">구분</th>
                  <th className="py-2.5 px-3 font-bold text-primary w-3/8 text-center">12개월 남았을 때</th>
                  <th className="py-2.5 px-3 font-bold text-primary w-3/8 text-center">24개월 남았을 때</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-muted-foreground">추정 위약금</td>
                  <td className="py-2.5 px-3 font-extrabold text-primary text-center">
                    {fmt(penalty12)}원
                  </td>
                  <td className="py-2.5 px-3 font-extrabold text-primary text-center">
                    {fmt(penalty24)}원
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-muted-foreground">손익분기점 (BEP)</td>
                  <td className="py-2.5 px-3 font-bold text-primary text-center">
                    {bep12 !== null ? `${bep12}개월` : "회수 불가"}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-primary text-center">
                    {bep24 !== null ? `${bep24}개월` : "회수 불가"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-muted-foreground">최종 진단</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-black ${bep12 !== null && bep12 <= 12
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      }`}>
                      {bep12 !== null && bep12 <= 12 ? "💡 조건부 변경" : "⚠️ 신중 권장"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block rounded-lg bg-destructive/15 px-2.5 py-1 text-[11px] font-black text-destructive">
                      ⛔ 지금 바꾸면 손해 (비추천)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground/80 border-t border-border/30 pt-2 font-medium">
            ※ 위 내용은 현재 사용 중인 요금 기준 약정 기간별 추정 위약금이며, 실제 위약금은 통신사 정책에 따라 다를 수 있습니다.
          </p>
        </div>
      )}

      {/* 5. 용도별 속도 추천 사유 */}
      <div className="mt-5 rounded-xl bg-muted/30 border border-border/50 p-4">
        <p className="text-xs font-black text-primary flex items-center gap-1.5">
          <Activity size={14} className="text-blue-500" /> 스펙 추천 세부 소견
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {recommendedReason}
        </p>
        {usage.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {usage.map((u, i) => (
              <span key={i} className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                #{u === "streaming" ? "넷플릭스·OTT" : u === "gaming" ? "온라인 게임" : u === "work" ? "재택근무·업로드" : "웹서핑"}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 6. 상세 연동 및 하단 안내 */}
      <div className="mt-4 flex flex-col gap-2">
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99]"
        >
          통신사별 결합 할인 및 사은품 혜택 확인 <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-center text-muted-foreground/60 leading-normal">
          본 리포트는 고객님이 입력하신 정보와 표준 요율을 비교하여 작성되었습니다. 실제 월 납부금은 더 낮아질 수 있습니다.
        </p>
      </div>

    </div>
  );
}
