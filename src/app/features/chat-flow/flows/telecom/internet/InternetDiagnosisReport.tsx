import React from "react";
import { CheckCircle2, ShieldAlert, Sparkles, ExternalLink, Activity, Wifi, Laptop, ArrowRightLeft, Users } from "lucide-react";
import type { FlowResult } from "../../../core/types";

interface InternetDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

const carrierMap: Record<string, string> = {
  SK: "SK브로드밴드",
  KT: "KT 지니",
  LGU: "LG 유플러스",
  SKYLIFE: "스카이라이프",
  LOCAL: "지역 인터넷",
};

const speedMap: Record<string, string> = {
  "100": "100Mbps (슬림)",
  "500": "500Mbps (베이직)",
  "1000": "1Gbps (기가)",
  unknown: "미확인 (기본형)",
};

export default function InternetDiagnosisReport({ result }: InternetDiagnosisReportProps) {
  const answers = result.metadata?.answers || {};
  
  const carrier = answers["internet.commonCarrier"] || "KT";
  const currentSpeedKey = answers["internet.currentSpeed"] || "500";
  const currentFee = Number(answers["internet.fee"]) || 0;
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
  };

  const recommendedPrice = standardPrices[recommendedSpeedKey];
  
  // 요금 절감 계산
  const priceDiff = currentFee - recommendedPrice;

  // 약정 만료 여부 혜택 설명
  const isExpired = contractPeriod === "expired";

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
          현재 당신의 요금제는 <span className="text-accent font-extrabold">"{speedMap[currentSpeedKey] || currentSpeedKey}"</span> 입니다.
        </p>
      </div>

      {/* 2. 카드 형식 스펙 비교 */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* 현재 인터넷 요약 카드 */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE</span>
            <span className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {carrierMap[carrier] || "통신사"}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate">
            {speedMap[currentSpeedKey]}
          </h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-black text-primary">{fmt(currentFee)}</span>
            <span className="text-xs text-muted-foreground">원/월</span>
          </div>
          
          <div className="mt-4 border-t border-border/40 pt-3 flex flex-col gap-2 text-xs">
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

        {/* 권장 인터넷 요약 카드 */}
        <div className="relative rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-sm">
          <div className="absolute -top-2.5 right-3 rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
            RECOMMENDED SPEC
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase">OPTIMAL SPEC</span>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600">
              최적 맞춤형
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate">
            {speedMap[recommendedSpeedKey]}
          </h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-black text-blue-600">{fmt(recommendedPrice)}</span>
            <span className="text-xs text-muted-foreground">원/월 (평균)</span>
          </div>

          <div className="mt-4 border-t border-blue-500/20 pt-3 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">연결 안정성</span>
              <span className="font-bold text-primary">매우 우수</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">권장 와이파이</span>
              <span className="font-bold text-primary">GiGA WiFi 기본 탑재</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">적정 용도</span>
              <span className="font-bold text-blue-600">
                {recommendedSpeedKey === "100" ? "가성비 중심" : recommendedSpeedKey === "500" ? "OTT·재택근무용" : "기가 다운로드"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 금액 변동 문구 */}
      <div className="mt-5 rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
        <div className="flex items-center gap-2 border-b border-blue-500/10 pb-2">
          <ArrowRightLeft className="text-blue-500" size={15} />
          <h4 className="text-xs font-black text-primary">"{speedMap[recommendedSpeedKey]}"를 선택한다면</h4>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-primary/95 font-medium">
          {priceDiff > 0 ? (
            <>
              인터넷 속도를 일상 실속형(~200Mbps)으로 낮추면, 매달 고정비 <span className="font-extrabold text-blue-600">{fmt(priceDiff)}원</span> / 연 <span className="font-extrabold text-blue-600">{fmt(priceDiff * 12)}원</span>을 아낄 수 있어요!<br />
              (기존 속도 대비 요금만 줄어들 뿐, 웹서핑이나 4K 유튜브 시청은 똑같이 끊김 없이 가능합니다.)
            </>
          ) : priceDiff < 0 ? (
            <>
              매달 <span className="font-extrabold text-destructive">{fmt(Math.abs(priceDiff))}원</span> / 연 <span className="font-extrabold text-destructive">{fmt(Math.abs(priceDiff) * 12)}원</span>이 더 지출되지만, 인터넷 속도가 초고속 기가(~1Gbps)로 빨라져 대용량 게임 다운로드나 재택근무 환경이 훨씬 쾌적해집니다.
            </>
          ) : (
            <>
              현재 납부하고 계신 요금({fmt(currentFee)}원)은 권장 요금제 스펙 요금과 동일하여 금액 변동이 없습니다.
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
              고객님은 현재 약정 기간(3년)이 완전히 끝난 상태입니다. 추가 비용 지출을 막기 위해 
              <span className="font-extrabold text-primary"> 즉시 본사 재약정(상품권/할인 요구) 또는 타사 신규 가입(최대 45만 원 사은품 확보)</span>을 
              진행하시는 것이 돈을 버는 가장 빠른 방법입니다.
            </p>
          </div>
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
      <div className="mt-6 flex flex-col gap-2">
        <a
          href="https://www.mvnohub.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99]"
        >
          통신사별 결합 할인 및 사은품 혜택 확인 <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-center text-muted-foreground/60 leading-normal">
          본 리포트는 고객님이 입력하신 정보와 표준 요율을 비교하여 작성되었습니다. 
          결합된 모바일 개수 및 제휴 카드 사용 조건에 따라 실제 월 납부금은 더 낮아질 수 있습니다.
        </p>
      </div>

    </div>
  );
}
