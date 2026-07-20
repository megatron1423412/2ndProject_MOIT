// src/app/features/chat-flow/flows/telecom/bundle/BundleDiagnosisReport.tsx

import React, { useState, useEffect } from "react";
import { CheckCircle2, ShieldAlert, Sparkles, ExternalLink, Bot, Loader2 } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import { generateTelecomComment, buildBundleCommentPrompt } from "../shared/telecomApi";

interface BundleDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

const companyTypeMap: Record<string, string> = {
  mno: "품질 및 결합 혜택 우선 추천",
  mvno: "고정 비용 최소화 추천",
  any: "위약금 대비 실질 이득 추천",
};

const speedMap: Record<string, string> = {
  "~200Mbps": "~200Mbps(일상 실속)",
  "~1Gbps": "~1Gbps(초고속)",
  "~10Gbps": "~10Gbps(기업급)",
};

const dataMap: Record<string, string> = {
  "unlimited": "무제한 필요 (헤비 유저)",
  "50G-100G": "50GB ~ 100GB (일반 동영상 시청)",
  "10G-30G": "10GB ~ 30GB (출퇴근 웹서핑)",
  "under-10G": "10GB 미만 (주로 와이파이 사용)",
};

export default function BundleDiagnosisReport({ result }: BundleDiagnosisReportProps) {
  const metadata = result.metadata || {};
  const answers = metadata.answers || {};

  const startState = answers["bundle.startState"] as string;
  const isNewStart = startState === "new_start";

  // Parse contract info helper
  const getContractLabel = (val: string) => {
    if (!val) return "-";
    if (val === "만료") return "3년 이상 (만료)";
    if (val === "남음") return "약정 기간 남음";
    if (val === "모름") return "잘 모르겠음";
    return val;
  };

  // 1. 현재 상태 요약 (Current State Summary)
  let currentStateSummaryTitle = "";
  let currentStateComposition = "";
  let currentStateGuidance = "";

  if (startState === "all_same") {
    currentStateSummaryTitle = "전부 같아요";
    currentStateComposition = "모바일+인터넷+IPTV";
    currentStateGuidance = "현재 스마트폰, internet, IPTV를 하나로 묶은 [전부 결합] 실태로 통신 서비스를 이용하고 계십니다";
  } else if (startState === "part_same") {
    currentStateSummaryTitle = "일부만 같아요";
    const partSelect = answers["bundle.partSelect"] as string;
    if (partSelect === "pta") {
      currentStateComposition = "모바일(개인)/인터넷+IPTV";
      currentStateGuidance = "현재 개인 스마트폰 요금과 인터넷+TV 요금이 찢어진 [모바일/홈 개별 결합] 상태입니다.";
    } else if (partSelect === "ptc") {
      currentStateComposition = "모바일(다인)/인터넷+IPTV";
      currentStateGuidance = "현재 여러 명이 묶인 모바일 결합과 집 인터넷+TV 결합이 따로 노는 [그룹 분리 결합] 상태입니다.";
    } else if (partSelect === "ptb") {
      currentStateComposition = "모바일 + 인터넷";
      currentStateGuidance = "현재 스마트폰과 인터넷 위주로만 연계된 [모바일+인터넷 결합] 상태입니다.";
    } else {
      currentStateComposition = "일부 결합";
      currentStateGuidance = "현재 일부 상품만 결합된 상태로 이용하고 계십니다.";
    }
  } else if (startState === "all_diff") {
    currentStateSummaryTitle = "다 달라요";
    currentStateComposition = "모바일(개인)/인터넷/IPTV";
    currentStateGuidance = "현재 스마트폰, 인터넷, IPTV 모두 결합 할인을 전혀 받지 않는 [각자도생 무결합] 상태입니다.";
  } else if (isNewStart) {
    currentStateSummaryTitle = "새로 시작해요";
    const newSelect = answers["bundle.newSelect"] as string;
    if (newSelect === "new_mobile") {
      currentStateComposition = "모바일(신규/번이)+인터넷+IPTV";
      currentStateGuidance = "스마트폰 요금제부터 인터넷, TV까지 싹 다 새로 맞추는 [완전 신규 결합 설계] 상태입니다.";
    } else {
      currentStateComposition = "모바일(유지)+인터넷+IPTV";
      currentStateGuidance = "기존 스마트폰은 그대로 유지하고, 인터넷 & TV만 새로 얹는 [부분 신규 결합 설계] 상태입니다.";
    }
  }

  // Parse current state info variables
  let currentCarrierLabel = "기존 통신사";
  let currentServicesString = "선택 안 됨";
  let currentPlanString = "결합상품";

  if (startState === "all_same") {
    const carrier = answers["bundle.allCarrier"] || "기존 통신사";
    currentCarrierLabel = carrier;
    currentServicesString = "모바일 + 인터넷 + IPTV";
    currentPlanString = `[${carrier}] 결합상품`;
  } else if (startState === "part_same") {
    const partSelect = answers["bundle.partSelect"] as string;
    if (partSelect === "pta") {
      const mobCarrier = answers["bundle.ptaCarrier"] || "기존";
      const combCarrier = answers["bundle.ptaComboCarrier"] || "기존";
      currentCarrierLabel = `${mobCarrier} / ${combCarrier}`;
      currentServicesString = "모바일(개인) / 인터넷 + IPTV";
      currentPlanString = `[모바일: ${mobCarrier}, 유선: ${combCarrier}]`;
    } else if (partSelect === "ptb") {
      const mobCarrier = answers["bundle.ptbCarrier"] || "기존";
      const combCarrier = answers["bundle.ptbComboCarrier"] || "기존";
      currentCarrierLabel = `${mobCarrier} / ${combCarrier}`;
      currentServicesString = "모바일 + 인터넷";
      currentPlanString = `[결합: ${mobCarrier}, 유선: ${combCarrier}]`;
    } else if (partSelect === "ptc") {
      const mobCarrier = answers["bundle.ptcCarrier"] || "기존";
      const combCarrier = answers["bundle.ptcComboCarrier"] || "기존";
      currentCarrierLabel = `${mobCarrier} / ${combCarrier}`;
      currentServicesString = "모바일(다인) / 인터넷 + IPTV";
      currentPlanString = `[모바일: ${mobCarrier}, 유선: ${combCarrier}]`;
    }
  } else if (startState === "all_diff") {
    const selectedServices = (answers["bundle.diffServices"] as string[]) || [];
    const parts: string[] = [];
    const labels: string[] = [];
    const planParts: string[] = [];

    if (selectedServices.includes("phone")) {
      const mobCarrier = answers["bundle.diffCarrier"] || "모바일";
      parts.push(mobCarrier);
      labels.push("모바일");
      planParts.push(`모바일: ${mobCarrier}`);
    }
    if (selectedServices.includes("internet")) {
      const netCarrier = answers["bundle.diffInternetCarrier"] || "인터넷";
      parts.push(netCarrier);
      labels.push("인터넷");
      planParts.push(`인터넷: ${netCarrier}`);
    }
    if (selectedServices.includes("iptv")) {
      const tvCarrier = answers["bundle.diffTvCarrier"] || "TV";
      parts.push(tvCarrier);
      labels.push("IPTV");
      planParts.push(`TV: ${tvCarrier}`);
    }

    currentCarrierLabel = parts.join(" / ") || "선택 안 됨";
    currentServicesString = labels.length > 0 ? labels.join(", ") + " 개별" : "선택 안 됨";
    currentPlanString = planParts.length > 0 ? `[${planParts.join(", ")}]` : "선택 안 됨";
  } else if (isNewStart) {
    const newSelect = answers["bundle.newSelect"] as string;
    const mobCarrier = newSelect === "new_mobile"
      ? (answers["bundle.newACarrier"] || "기존")
      : (answers["bundle.newBCarrier"] || "기존");
    currentCarrierLabel = `${mobCarrier} (모바일)`;
    currentServicesString = newSelect === "new_mobile"
      ? "모바일 신규가입 / 인터넷+TV 신규"
      : "모바일 유지 / 인터넷+TV 신규";
    currentPlanString = `[모바일: ${mobCarrier}]`;
  }

  let currentContractString = "-";
  if (startState === "all_same") {
    currentContractString = getContractLabel(answers["bundle.allContract"] as string);
  } else if (startState === "part_same") {
    const partSelect = answers["bundle.partSelect"] as string;
    if (partSelect === "pta") {
      currentContractString = `모바일: ${getContractLabel(answers["bundle.ptaContract"] as string)} / 유선: ${getContractLabel(answers["bundle.ptaComboContract"] as string)}`;
    } else if (partSelect === "ptb") {
      currentContractString = `모바일: ${getContractLabel(answers["bundle.ptbContract"] as string)} / 유선: ${getContractLabel(answers["bundle.ptbComboContract"] as string)}`;
    } else if (partSelect === "ptc") {
      currentContractString = `모바일: ${getContractLabel(answers["bundle.ptcContract"] as string)} / 유선: ${getContractLabel(answers["bundle.ptcComboContract"] as string)}`;
    }
  } else if (startState === "all_diff") {
    const selectedServices = (answers["bundle.diffServices"] as string[]) || [];
    const contractParts: string[] = [];
    if (selectedServices.includes("phone")) {
      contractParts.push(`모바일: ${getContractLabel(answers["bundle.diffContract"] as string)}`);
    }
    if (selectedServices.includes("internet")) {
      contractParts.push(`인터넷: ${getContractLabel(answers["bundle.diffInternetContract"] as string)}`);
    }
    if (selectedServices.includes("iptv")) {
      contractParts.push(`TV: ${getContractLabel(answers["bundle.diffTvContract"] as string)}`);
    }
    currentContractString = contractParts.join(" / ") || "-";
  } else if (isNewStart) {
    const newSelect = answers["bundle.newSelect"] as string;
    const contract = newSelect === "new_mobile"
      ? answers["bundle.newAContract"]
      : answers["bundle.newBContract"];
    currentContractString = `모바일: ${getContractLabel(contract as string)}`;
  }

  // Parse members count
  const currentMembers = answers["bundle.allMembers"] || answers["bundle.ptaMembers"] || answers["bundle.ptbMembers"] || answers["bundle.ptcMembers"] || answers["bundle.diffMembers"] || answers["bundle.desiredMembers"] || "-";

  // Parse penalty info
  const currentFee = Number(metadata.currentFee || 0);
  const penaltyAmount = Number(metadata.penaltyAmount || 0);
  const knowPenalty = !!metadata.knowPenalty;

  // Recommended plan specs
  const selectedPlan = metadata.selectedPlan || {};
  const selectedPlanName = selectedPlan.name || "맞춤 추천 결합 요금제";
  const selectedPrice = selectedPlan.price || 55000;
  const recommendedCarrier = metadata.recommendedCarrier || "SK";
  const recommendedCarrierLabel = recommendedCarrier === "SKYLIFE" ? "스카이라이프" : `${recommendedCarrier}브로드밴드`;

  const desiredCompanyTypeLabel = companyTypeMap[answers["bundle.desiredCompanyType"] as string] || "상관없음";
  const desiredSpeedLabel = speedMap[answers["bundle.desiredSpeed"] as string] || "일반 가정용(500M)";
  const desiredDataLabel = dataMap[answers["bundle.desiredData"] as string] || "무제한 필요";

  // Calculate savings
  const monthlySaving = Math.max(0, currentFee - selectedPrice);
  const yearlySaving = monthlySaving * 12;

  // 2. 추천 지향점 (Recommendation Goal)
  const desiredCompanyType = answers["bundle.desiredCompanyType"] as string;
  let recommendationGoalText = "";
  if (desiredCompanyType === "mvno") {
    recommendationGoalText = "알뜰폰·케이블 최저가 위주로 추천해드려요";
  } else if (desiredCompanyType === "mno") {
    recommendationGoalText = "대기업 3사 결합 위주로 추천해드려요";
  } else {
    recommendationGoalText = "위약금을 내고 갈아타도 진짜 이득인지 비교해드려요";
  }

  // 3. 고객의 통신 성향 매칭 (Customer Telecom Disposition Matching)
  let dispositionMatchingText = "";
  if (desiredCompanyType === "mvno") {
    dispositionMatchingText = "유저님은 통신사에 매달 꼬박꼬박 나가는 고정 지출을 싹 걷어내고 내 지갑의 실속을 챙기는 고정 비용 최소화를 가장 중요하게 생각하시는 극강의 가성비파 성향이시군요! 매달 지출 부담을 가장 획기적으로 낮춰줄 최적의 절약 세트를 제안합니다.";
  } else if (desiredCompanyType === "mno") {
    dispositionMatchingText = "유저님은 여기저기 찢어져서 머리 아픈 것보다 하나로 깔끔하게 묶어 알아서 혜택이 커지는 [품질 및 결합 혜택 우선] 지향점을 선택하셨군요! 기존 통신망의 안정적인 품질은 유지하면서 결합 시너지를 극대화할 수 있는 안전한 맞춤 조합을 제안합니다.";
  } else {
    dispositionMatchingText = "유저님은 겉으로 보이는 위약금의 압박에 흔들리지 않고, 갈아탔을 때 내 지갑에 들어오는 순수 보너스가 더 큰지 따져보는 [위약금 대비 실질 이득 우선] 성향이시군요! 환승 리워드로 패널티를 완벽하게 상쇄하고도 넘는 가장 똑똑한 전환 타이밍 솔루션을 제안합니다.";
  }

  // Payback period
  const paybackPeriod = monthlySaving > 0 && penaltyAmount > 0 
    ? Math.ceil(penaltyAmount / monthlySaving) 
    : 0;

  // One line diagnosis
  let oneLineDiagnosis = "";
  if (isNewStart) {
    oneLineDiagnosis = "결합을 변경하면 절감 효과가 큽니다.";
  } else if (paybackPeriod === 0) {
    oneLineDiagnosis = "지금 갈아타는 것이 가장 유리합니다.";
  } else if (paybackPeriod > 0 && paybackPeriod <= 6) {
    oneLineDiagnosis = "지금 갈아타는 것이 가장 유리합니다.";
  } else if (paybackPeriod > 6 && paybackPeriod <= 12) {
    oneLineDiagnosis = "종료 후 변경을 추천합니다.";
  } else {
    oneLineDiagnosis = "현재는 유지하는 것이 유리합니다.";
  }

  // Ollama AI comment
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const prompt = buildBundleCommentPrompt({
      currentCarrier: currentCarrierLabel,
      currentFee,
      selectedPlanName,
      selectedFee: selectedPrice,
      knowPenalty,
      penaltyAmount,
    });
    generateTelecomComment(prompt, "bundle").then((comment) => {
      if (!cancelled) {
        setAiComment(comment);
        setAiLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-md transition-all hover:shadow-lg space-y-6">
      
      {/* 1. 상단 타이틀 */}
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

      {/* 현재 결합 요금제 안내 및 추천 지향점 */}
      <div className="rounded-xl bg-muted/20 p-4 border border-border/40 text-xs sm:text-sm space-y-3">
        <div>
          <span className="font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">현재 상태 요약 ({currentStateSummaryTitle})</span>
          <p className="font-black text-primary leading-relaxed">
            {currentStateGuidance}
          </p>
        </div>
        <div className="border-t border-border/30 pt-2">
          <span className="font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">추천 지향점</span>
          <p className="font-black text-indigo-600 dark:text-indigo-400 leading-relaxed">
            {desiredCompanyTypeLabel} - <span className="text-primary font-medium">{recommendationGoalText}</span>
          </p>
        </div>
      </div>

      {/* 2. 고객의 통신 성향 매칭 */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs sm:text-sm">
        <h5 className="font-extrabold text-indigo-700 dark:text-indigo-300">고객의 통신 성향 매칭</h5>
        <p className="mt-2 leading-relaxed text-primary font-semibold">{dispositionMatchingText}</p>
      </div>

      {/* 3. 요금 비교 카드 */}
      <div>
        <h5 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">요금 비교 리포트</h5>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 왼쪽 카드 - 유저의 현재 요약 */}
          {startState === "all_same" ? (
            /* 통합 카드 */
            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/10 p-4">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE (통합)</span>
              <div className="space-y-1.5 text-xs text-primary mt-2">
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">현재 통신사</span>
                  <span className="font-extrabold">{currentCarrierLabel}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">결합 형태</span>
                  <span className="font-bold text-accent">{currentStateComposition}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">결합 인원</span>
                  <span className="font-bold">{currentMembers}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">모바일 요금제</span>
                  <span className="font-bold truncate max-w-[150px]">{answers["bundle.allMobilePlan"] || "모바일 요금제"}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">인터넷 상품</span>
                  <span className="font-bold">초고속 인터넷</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">IPTV 상품</span>
                  <span className="font-bold">IPTV 일반형</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">할인 정보</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">결합 할인 적용 중</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">약정 상태</span>
                  <span className="font-bold">{currentContractString}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">위약금</span>
                  <span className="font-extrabold text-amber-600">{knowPenalty ? `${fmt(penaltyAmount)}원` : "미입력"}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground text-sm font-bold">월 납부 요금</span>
                  <span className="text-sm font-black text-primary">{fmt(currentFee)}원</span>
                </div>
              </div>
            </div>
          ) : (
            /* 개별 카드 */
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE (개별)</span>
              
              {/* 모바일 개별 카드 */}
              {(startState === "part_same" || startState === "all_diff" || isNewStart) && (
                <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-accent border-b border-border/30 pb-0.5 mb-1">
                    <span>모바일</span>
                    <span>{answers["bundle.newACarrier"] || answers["bundle.newBCarrier"] || answers["bundle.diffCarrier"] || answers["bundle.ptaCarrier"] || answers["bundle.ptbCarrier"] || answers["bundle.ptcCarrier"] || "선택됨"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">요금제</span>
                    <span className="font-bold truncate max-w-[120px]">{answers["bundle.diffMobilePlan"] || answers["bundle.ptaMobilePlan"] || answers["bundle.ptbMobilePlan"] || answers["bundle.ptcMobilePlan"] || "기본 요금제"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">데이터</span>
                    <span className="font-bold">{desiredDataLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">할인</span>
                    <span className="font-bold text-emerald-600">개별 할인 적용</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">약정</span>
                    <span className="font-bold">{getContractLabel(answers["bundle.diffContract"] || answers["bundle.ptaContract"] || answers["bundle.ptbContract"] || answers["bundle.ptcContract"] || answers["bundle.newAContract"] || answers["bundle.newBContract"])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">위약금</span>
                    <span className="font-bold text-amber-600">{answers["bundle.diffKnowPenalty"] === "yes" || answers["bundle.ptaKnowPenalty"] === "yes" || answers["bundle.ptbKnowPenalty"] === "yes" || answers["bundle.ptcKnowPenalty"] === "yes" ? "약정 위약금 있음" : "없음 또는 미입력"}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-extrabold">
                    <span>월 요금</span>
                    <span>{fmt(answers["bundle.diffMobileFee"] || answers["bundle.ptaMobileFee"] || answers["bundle.ptbMobileFee"] || answers["bundle.ptcMobileFee"] || answers["bundle.newAMobileFee"] || answers["bundle.newBMobileFee"] || 0)}원</span>
                  </div>
                </div>
              )}

              {/* 인터넷 개별 카드 */}
              {(startState === "part_same" || startState === "all_diff" || isNewStart) && (answers["bundle.ptaComboFee"] || answers["bundle.ptbComboFee"] || answers["bundle.ptcComboFee"] || answers["bundle.diffInternetFee"]) && (
                <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-accent border-b border-border/30 pb-0.5 mb-1">
                    <span>인터넷</span>
                    <span>{answers["bundle.ptaComboCarrier"] || answers["bundle.ptbComboCarrier"] || answers["bundle.ptcComboCarrier"] || answers["bundle.diffInternetCarrier"] || "선택됨"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품명</span>
                    <span className="font-bold truncate max-w-[120px]">{answers["bundle.ptaComboProduct"] || answers["bundle.ptbComboProduct"] || answers["bundle.ptcComboProduct"] || answers["bundle.diffInternetProduct"] || "초고속 인터넷"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">속도</span>
                    <span className="font-bold">{desiredSpeedLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">약정</span>
                    <span className="font-bold">{getContractLabel(answers["bundle.ptaComboContract"] || answers["bundle.ptbComboContract"] || answers["bundle.ptcComboContract"] || answers["bundle.diffInternetContract"])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">위약금</span>
                    <span className="font-bold text-amber-600">{answers["bundle.diffInternetKnowPenalty"] === "yes" ? "약정 위약금 있음" : "없음 또는 미입력"}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-extrabold">
                    <span>월 요금</span>
                    <span>{fmt(answers["bundle.ptaComboFee"] || answers["bundle.ptbComboFee"] || answers["bundle.ptcComboFee"] || answers["bundle.diffInternetFee"] || 0)}원</span>
                  </div>
                </div>
              )}

              {/* IPTV 개별 카드 */}
              {(startState === "part_same" || startState === "all_diff" || isNewStart) && (answers["bundle.ptaComboFee"] || answers["bundle.ptcComboFee"] || answers["bundle.diffTvFee"]) && (
                <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-accent border-b border-border/30 pb-0.5 mb-1">
                    <span>IPTV</span>
                    <span>{answers["bundle.ptaComboCarrier"] || answers["bundle.ptcComboCarrier"] || answers["bundle.diffTvCarrier"] || "선택됨"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품명</span>
                    <span className="font-bold truncate max-w-[120px]">{answers["bundle.ptaTvProduct"] || answers["bundle.ptcTvProduct"] || answers["bundle.diffTvProduct"] || "IPTV 기본형"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">약정</span>
                    <span className="font-bold">{getContractLabel(answers["bundle.diffTvContract"])}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">위약금</span>
                    <span className="font-bold text-amber-600">{answers["bundle.diffTvKnowPenalty"] === "yes" ? "약정 위약금 있음" : "없음 또는 미입력"}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-extrabold">
                    <span>월 요금</span>
                    <span>{fmt(answers["bundle.diffTvFee"] || 15000)}원</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 오른쪽 카드 - AI가 유저의 성향에 맞게 추천하는 상품의 요약 */}
          {startState === "all_same" ? (
            /* 통합 추천 카드 */
            <div className="relative rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 shadow-sm">
              <div className="absolute -top-2.5 right-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
                SELECTED SPEC
              </div>
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase">AI RECOMMENDED (통합)</span>
              
              <div className="space-y-1.5 text-xs text-indigo-900 dark:text-indigo-200 mt-2">
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 통신사</span>
                  <span className="font-extrabold">{recommendedCarrier}</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 결합 형태</span>
                  <span className="font-bold text-accent">전체 결합 패키지</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 모바일</span>
                  <span className="font-bold truncate max-w-[150px]">{selectedPlanName}</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 인터넷</span>
                  <span className="font-bold">초고속 기가 인터넷</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 IPTV</span>
                  <span className="font-bold">IPTV 베이직 서비스</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">가입 혜택</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">최대 47만원 상품권 + 추가 요금할인</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">월 절감액</span>
                  <span className="font-extrabold text-emerald-600">{fmt(monthlySaving)}원</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">연 절감액</span>
                  <span className="font-extrabold text-emerald-600">{fmt(yearlySaving)}원</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">손익분기점</span>
                  <span className="font-bold text-primary">{paybackPeriod > 0 ? `${paybackPeriod}개월` : "즉시 이득"}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground text-sm font-bold">예상 월 요금</span>
                  <span className="text-sm font-black text-indigo-600">{fmt(selectedPrice)}원</span>
                </div>
              </div>
            </div>
          ) : (
            /* 분리 추천 카드 */
            <div className="relative rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 shadow-sm flex flex-col gap-3">
              <div className="absolute -top-2.5 right-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
                SELECTED SPEC
              </div>
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase">AI RECOMMENDED (분리)</span>
              
              {/* 모바일 추천 */}
              <div className="rounded-lg border border-indigo-500/20 bg-card p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-indigo-600 border-b border-indigo-500/10 pb-0.5 mb-1">
                  <span>추천 모바일</span>
                  <span>{recommendedCarrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">추천 요금제</span>
                  <span className="font-bold truncate max-w-[120px]">알뜰폰 맞춤형 실속 요금제</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">데이터</span>
                  <span className="font-bold">{desiredDataLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">절감액</span>
                  <span className="font-bold text-emerald-600">{fmt(Math.round(monthlySaving * 0.4))}원</span>
                </div>
                <div className="flex justify-between border-t border-indigo-500/10 pt-1 mt-1 font-extrabold">
                  <span>월 요금</span>
                  <span>{fmt(Math.round(selectedPrice * 0.4))}원</span>
                </div>
              </div>

              {/* 인터넷 + IPTV 추천 */}
              <div className="rounded-lg border border-indigo-500/20 bg-card p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-indigo-600 border-b border-indigo-500/10 pb-0.5 mb-1">
                  <span>인터넷 + IPTV</span>
                  <span>{recommendedCarrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">인터넷</span>
                  <span className="font-bold">기가 인터넷</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IPTV</span>
                  <span className="font-bold">UHD TV 요금제</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">속도</span>
                  <span className="font-bold">{desiredSpeedLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wi-Fi</span>
                  <span className="font-bold">기가 와이파이 기본 제공</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">셋톱박스</span>
                  <span className="font-bold">최신 스마트 셋톱박스 무료</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">가입 혜택</span>
                  <span className="font-bold text-emerald-600">최대 47만원 상당 현금/상품권 지원</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">절감액</span>
                  <span className="font-bold text-emerald-600">{fmt(Math.round(monthlySaving * 0.6))}원</span>
                </div>
                <div className="flex justify-between border-t border-indigo-500/10 pt-1 mt-1 font-extrabold">
                  <span>월 요금</span>
                  <span>{fmt(Math.round(selectedPrice * 0.6))}원</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. AI 분석 */}
      <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={16} />
          <span className="text-sm font-black text-primary">AI 진단 및 분석</span>
        </div>
        <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4 text-xs sm:text-sm space-y-2">
          <div className="flex justify-between border-b border-indigo-500/15 pb-1.5">
            <span className="text-muted-foreground font-bold">한줄 진단</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">{oneLineDiagnosis}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-indigo-500/15 pb-1.5">
            <span className="text-muted-foreground font-bold">추천 이유</span>
            <ul className="list-disc pl-4 space-y-0.5 font-medium text-primary">
              <li>현재보다 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span> 절약됩니다.</li>
              {paybackPeriod > 0 && (
                <li>위약금은 <span className="font-black text-amber-600">{paybackPeriod}개월</span>이면 회수 가능합니다.</li>
              )}
              <li>품질은 현재와 비슷한 수준입니다.</li>
            </ul>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted-foreground font-bold">주요 지표</span>
            <div className="text-right space-y-0.5 font-medium">
              <div>절감액: <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span> (Base)</div>
              <div>연 절감액: <span className="font-black text-emerald-600">{fmt(yearlySaving)}원</span></div>
              <div>손익분기점: <span className="font-black text-indigo-600">{paybackPeriod > 0 ? `${paybackPeriod}개월` : "즉시 이득 (0개월)"}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 손익계산 */}
      <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" size={16} />
          <span className="text-sm font-black text-primary">손익계산 및 종합 솔루션</span>
        </div>
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-xs sm:text-sm">
          {monthlySaving > 0 ? (
            paybackPeriod === 0 ? (
              /* 이득일 때 - 케이스 1 */
              <p className="leading-relaxed text-primary/90 font-medium">
                현재 남은 약정이 없거나 위약금이 발생하지 않아 통신사를 변경하는 즉시 지출을 줄일 수 있어요. 지금 환승하시면 매달 절약액 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span> / 연간 <span className="font-black text-emerald-600">{fmt(yearlySaving)}원</span>의 고정비를 조건 없이 고스란히 아낄 수 있습니다. 해지 패널티가 전혀 없는 상태이므로 미룰 이유 없이 지금 변경하시는 것이 가장 유리합니다.
              </p>
            ) : (
              /* 이득일 때 - 케이스 2 */
              <p className="leading-relaxed text-primary/90 font-medium">
                지금 통신사를 바꾸면 해지 위약금 <span className="font-black text-amber-600">{fmt(penaltyAmount)}원</span>이 발생하지만, 매달 줄어드는 요금 덕분에 딱 <span className="font-black text-indigo-600">{paybackPeriod}개월</span>만 유지하면 위약금 지출을 모두 회수할 수 있어요. 손익분기점이 지난 이후부터는 매달 월 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span> / 연간 <span className="font-black text-emerald-600">{fmt(yearlySaving)}원</span>의 고정비가 전부 유저님의 순수 이득으로 쌓이게 됩니다. 신규 가입 시 제공되는 가입 사은품이나 지원금 혜택을 활용하시면 초기 위약금 부담을 더욱 빠르게 상쇄할 수 있습니다.
              </p>
            )
          ) : (
            /* 손해일 때 - 케이스 1 */
            <p className="leading-relaxed text-primary/90 font-medium">
              통신사를 변경할 경우 매달 월 절약 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span> 요금을 줄일 수는 있지만, 남은 기간 대비 위약금이 <span className="font-black text-amber-600">{fmt(penaltyAmount)}원</span>으로 너무 커서 손익분기점까지 무려 <span className="font-black text-indigo-600">{paybackPeriod}개월</span>이나 걸려요. 지금 환승하면 매달 아끼는 금액보다 당장 물어야 하는 패널티가 더 커서 오히려 금전적 손해가 발생하므로, 현재 결합상품을 일단 그대로 유지하는 것을 권장합니다. 약정 만료일이 6개월 이하로 남아서 위약금이 대폭 줄어드는 시점에 다시 진단해 보시는 것이 훨씬 현명합니다.
            </p>
          )}
        </div>
      </div>

      {/* AI 맞춤 코멘트 (Ollama) */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
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

      {/* 4. 부가서비스 링크 버튼 */}
      <div className="flex flex-col gap-2.5">
        <a
          href="https://www.moit.co.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-surface py-3 text-xs font-black text-brand-surface-foreground shadow-sm transition-all hover:bg-brand-surface/90 hover:scale-[1.01] active:scale-[0.99]"
        >
          {recommendedCarrierLabel} 결합상품 할인 혜택 및 상세 조건 확인 <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-center text-muted-foreground/60 leading-normal">
          본 리포트는 고객님이 입력하신 정보를 바탕으로 모잇(MOIT)에서 계산한 참고용 자료입니다. 실제 가입 시점의 결합 조건 및 프로모션에 따라 다를 수 있습니다.
        </p>
      </div>

    </div>
  );
}
