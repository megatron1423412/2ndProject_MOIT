import React from "react";
import { CheckCircle2, ShieldAlert, Sparkles, Tv, HelpCircle, ArrowRightLeft, Star, Award } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import { mockIptvPlans, calculateIptvGrade } from "./mockData";

interface IptvDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

const providerMap: Record<string, string> = {
  sk_btv: "B tv (SKB)",
  kt_genie: "지니 TV (KT)",
  lg_uplus: "U+ IPTV (LGU+)",
  dlive: "딜라이브",
  kt_hcn: "KT HCN",
  genie_skylife: "지니 skylife",
  kt_skylife: "KT 스카이라이프",
  none: "셋톱박스 없음",
};

export default function IptvDiagnosisReport({ result }: IptvDiagnosisReportProps) {
  const answers = result.metadata?.answers || {};

  const providerType = answers["iptv.providerType"] || "sk_btv";
  const inputMethod = answers["iptv.currentInputMethod"] || "list";
  const currentPlanId = answers["iptv.currentPlanId"];
  const currentPlanNameManual = answers["iptv.currentPlanNameManual"] || "기본 요금제";
  const userContractStatus = answers["iptv.userContractStatus"] || "unknown";
  const selectedPlanId = answers["iptv.selectedNewPlan"];
  
  // 1. 현재 요금 및 요금제 정보 추적
  let currentPrice = Number(answers["iptv.currentPlanPriceInput"] || 0);
  let currentPlanName = "";
  let currentChannels = 0;
  let currentCarrier = providerMap[providerType] || "기타";

  if (inputMethod === "list" && currentPlanId && currentPlanId !== "manual_fallback") {
    const foundPlan = mockIptvPlans.find(p => p.id === currentPlanId);
    if (foundPlan) {
      currentPrice = foundPlan.price;
      currentPlanName = foundPlan.name;
      currentChannels = foundPlan.channels;
      currentCarrier = foundPlan.carrier;
    }
  }

  if (!currentPlanName) {
    currentPlanName = currentPlanNameManual;
    currentChannels = 200; // 수동 입력 시 기본값 가정
  }

  // 2. 추천 선택한 요금제 추적
  const selectedPlan = mockIptvPlans.find(p => p.id === selectedPlanId);
  const selectedPrice = selectedPlan ? selectedPlan.price : 0;
  const selectedPlanName = selectedPlan ? selectedPlan.name : "미선택 요금제";
  const selectedChannels = selectedPlan ? selectedPlan.channels : 0;
  const selectedCarrier = selectedPlan ? selectedPlan.carrier : "";

  // 3. 진단 계산 수행
  const hasRequiredGenres = true;
  const gradeResult = calculateIptvGrade(currentPrice, selectedPrice, hasRequiredGenres);
  const savingPercent = currentPrice > 0 ? (gradeResult.netBenefit / currentPrice) * 100 : 0;

  // 약정 만료 알림
  const isExpired = userContractStatus === "expired";

  // 등급 메타 정보
  const gradeColorMap: Record<string, { bg: string, text: string, border: string }> = {
    A: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/30" },
    B: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/30" },
    C: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/30" },
    D: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  };
  const theme = gradeColorMap[gradeResult.grade] || gradeColorMap.C;

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-md transition-all hover:shadow-lg">
      
      {/* 상단 타이틀 */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase">
            IPTV 분석 솔루션
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
            <Sparkles size={12} /> 요금 및 소비 패턴 진단
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-primary">
            IPTV 요금제 비교서 & 등급 진단
          </h2>
          <span className="shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
            분석 완료
          </span>
        </div>
      </div>

      {/* 2. 카드 형식 스펙 비교 */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* 현재 IPTV 요약 카드 */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE</span>
            <span className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {currentCarrier}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate">
            {currentPlanName}
          </h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-black text-primary">{fmt(currentPrice)}</span>
            <span className="text-xs text-muted-foreground">원/월</span>
          </div>
          
          <div className="mt-4 border-t border-border/40 pt-3 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">제공 채널 수</span>
              <span className="font-bold text-primary">{currentChannels}개 채널</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">약정 만료 여부</span>
              <span className="font-bold text-primary">
                {isExpired ? "⚠️ 만료됨 (재약정 필요)" : "진행 중"}
              </span>
            </div>
          </div>
        </div>

        {/* 추천/선택한 IPTV 요약 카드 */}
        <div className="relative rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 shadow-sm">
          <div className="absolute -top-2.5 right-3 rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
            RECOMMENDED SPEC
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-purple-600 uppercase">OPTIMAL SPEC</span>
            <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-600">
              {selectedPlan ? selectedPlan.carrier : "선택 통신사"}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate">
            {selectedPlanName}
          </h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-black text-purple-600">{fmt(selectedPrice)}</span>
            <span className="text-xs text-muted-foreground">원/월</span>
          </div>

          <div className="mt-4 border-t border-purple-500/20 pt-3 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">제공 채널 수</span>
              <span className="font-bold text-primary">{selectedChannels}개 채널</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">추천 형태</span>
              <span className="font-bold text-purple-600">
                {selectedChannels >= 230 ? "고품질 전채널형" : "실속 요금절약형"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 금액 변동 문구 */}
      <div className="mt-5 rounded-xl bg-purple-500/5 border border-purple-500/20 p-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="text-purple-500" size={15} />
          <h4 className="text-xs font-black text-primary">매월 고정비 절감 비율</h4>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-primary/95 font-medium">
          {gradeResult.netBenefit > 0 ? (
            <>
              동일하거나 더 나은 스펙으로 매달 고정비 <span className="font-extrabold text-purple-600">{fmt(gradeResult.netBenefit)}원</span>을 아끼고, 
              1년이면 총 <span className="font-extrabold text-purple-600">{fmt(gradeResult.netBenefit * 12)}원</span>을 저축할 수 있어요!
            </>
          ) : gradeResult.netBenefit < 0 ? (
            <>
              채널 확장 및 셋톱박스 성능 상향으로 매달 요금이 약 <span className="font-extrabold text-destructive">{fmt(Math.abs(gradeResult.netBenefit))}원</span> 가량 추가됩니다. 
              (스포츠·키즈·해외 미디어 등 취향 장르를 다양하게 보실 때 만족스러운 가치입니다.)
            </>
          ) : (
            <>
              현재 납부하고 계신 요금과 추천 요금이 월 {fmt(currentPrice)}원으로 동일하여 추가 지출이 발생하지 않습니다.
            </>
          )}
        </p>
      </div>

      {/* 4. 등급 진단 카드 */}
      <div className={`mt-5 rounded-xl border p-4 ${theme.bg} ${theme.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="text-purple-600 dark:text-purple-400" size={18} />
            <h4 className="text-sm font-extrabold text-primary">소비 패턴 분석 등급</h4>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-black bg-background border shadow-sm ${theme.text}`}>
            🏆 {gradeResult.grade} 등급
          </span>
        </div>
        
        {/* 진단 소견 */}
        <div className="mt-3 border-t border-black/5 dark:border-white/5 pt-3">
          <p className="text-xs font-bold text-muted-foreground leading-normal">진단 소견</p>
          <p className="mt-1 text-xs leading-relaxed text-primary/90">
            {gradeResult.message}
          </p>
        </div>
      </div>

      {/* 5. 약정 만료 및 사은품 안내 */}
      {isExpired && (
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3 items-start">
          <ShieldAlert className="text-emerald-500 shrink-0 mt-0.5" size={16} />
          <div className="text-xs leading-relaxed">
            <p className="font-black text-emerald-600 dark:text-emerald-400">💡 3년 약정 만료 대상 사은품 안내</p>
            <p className="mt-1 text-muted-foreground">
              TV와 인터넷은 대다수 모바일 결합과 묶여 있습니다. 3년 만기 후 그대로 쓰시면 매달 손해입니다. 
              <span className="font-extrabold text-primary"> 인터넷과 함께 신규 통신사로 번이(번호이동) 결합 시 최대 45~48만 원 수준의 사은품</span>을 합법적으로 수령할 수 있으니 혜택을 꼭 챙기세요.
            </p>
          </div>
        </div>
      )}

      {/* 6. 상세 연동 및 하단 안내 */}
      <div className="mt-6 flex flex-col gap-2">
        <a
          href="https://www.mvnohub.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-purple-700 hover:scale-[1.01] active:scale-[0.99]"
        >
          통신3사 사은품 조건 및 결합 할인 조회 <Tv size={13} />
        </a>
        <p className="text-[10px] text-center text-muted-foreground/60 leading-normal">
          본 비교서는 셋톱박스 임대 조건 및 TV 수수료 구성에 따라 실제 단말기 이용요금이 변경될 수 있습니다. 
          정확한 요금 상세 청구 내역은 해당 통신사 고객센터에서 확인하실 수 있습니다.
        </p>
      </div>

    </div>
  );
}
