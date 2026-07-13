import React from "react";
import { CheckCircle2, ClipboardCheck, ArrowRightLeft, ShieldAlert, Sparkles, ExternalLink, Activity } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import { getPlanSpec } from "./mockData";

interface PhoneDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function PhoneDiagnosisReport({ result }: PhoneDiagnosisReportProps) {
  const answers = result.metadata?.answers || {};
  
  const carrier = answers["phone.carrier"] || "skt";
  const currentFee = Number(answers["phone.currentFee"]) || 0;
  const confirmedPlanRaw = answers["phone.confirmedPlan"] || "";
  const confirmedPlan = (confirmedPlanRaw === "direct-input" || confirmedPlanRaw === "direct-select")
    ? (answers["phone.customPlan"] || "")
    : (confirmedPlanRaw || answers["phone.customPlan"] || "");
  const selectedRecommendedPlan = answers["phone.selectedRecommendedPlan"] || "rec-mock-1";
  const dataVolume = answers["phone.dataVolume"] || "mid";

  // 기존 요금제 스펙 & 추천 요금제 스펙 매칭
  const currentSpec = getPlanSpec(confirmedPlan, carrier, currentFee, dataVolume);
  const recommendedSpec = getPlanSpec(selectedRecommendedPlan);

  // 차액 계산
  const priceDiff = currentSpec.price - recommendedSpec.price;
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
  // 5GB ~ 15GB 미만
  const isMidRange = dataDiffMB >= 5120 && dataDiffMB < 15360;
  // 15GB ~ 30GB 미만
  const isHighRange = dataDiffMB >= 15360 && dataDiffMB < 30720;
  // 30GB 이상 / 무제한
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
        <p className="text-xs font-bold text-muted-foreground">현재 요금제 대조 요약</p>
        <p className="mt-1 font-black text-primary leading-relaxed">
          기존 이용 요금제는 <span className="text-accent">"{currentSpec.name}"</span> 이며, 
          새롭게 추천된 요금제는 <span className="text-accent">"{recommendedSpec.name}"</span> 입니다.
        </p>
      </div>

      {/* 3. 스펙 카드 비교 */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* 기존 요금제 */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE</span>
            <span className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {currentSpec.carrier}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate">
            {currentSpec.name}
          </h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-black text-primary">{fmt(currentSpec.price)}</span>
            <span className="text-xs text-muted-foreground">원/월</span>
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
        <div className="relative rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
          <div className="absolute -top-2.5 right-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
            RECOMMENDED SPEC
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-emerald-600 uppercase">OPTIMAL SPEC</span>
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              {recommendedSpec.carrier}
            </span>
          </div>
          <h4 className="mt-2 text-sm font-black text-primary truncate">
            {recommendedSpec.name}
          </h4>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-lg font-black text-emerald-600">{fmt(recommendedSpec.price)}</span>
            <span className="text-xs text-muted-foreground">원/월</span>
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
        </div>
      </div>

      {/* 4. 금액 변동 문구 */}
      <div className="mt-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="text-emerald-500" size={15} />
          <h4 className="text-xs font-black text-primary">매월 고정 지출비 변동 안내</h4>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-primary/95 font-medium">
          {priceDiff > 0 ? (
            <>
              기존 요금제보다 매달 고정비 <span className="font-extrabold text-emerald-600">{fmt(priceDiff)}원</span>을 아끼고, 
              1년이면 총 <span className="font-extrabold text-emerald-600">{fmt(priceDiff * 12)}원</span>을 저축할 수 있어요!
            </>
          ) : priceDiff < 0 ? (
            <>
              매달 <span className="font-extrabold text-destructive">{fmt(Math.abs(priceDiff))}원</span>이 더 
              지출되지만, 이용 패턴에 필요한 스펙(데이터 및 결합 속도 등)을 안정적으로 추가 확보하는 경제적인 투자입니다.
            </>
          ) : (
            <>
              현재 납부하고 계신 요금({fmt(currentSpec.price)}원)은 모잇에서 산정한 맞춤 설계안 요금과 정확히 매칭됩니다. 
              스펙 낭비 없이 현명하게 소비 중이십니다.
            </>
          )}
        </p>
      </div>

      {/* 5. 데이터 업그레이드 체감 가이드 */}
      {dataDiffMB > 0 && (
        <div className="mt-5 rounded-xl bg-muted/30 border border-border/50 p-4">
          <p className="text-xs font-black text-primary">💡 데이터 업그레이드 체감 가이드</p>
          
          {/* 5GB ~ 15GB 미만 */}
          {isMidRange && (
            <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
              <p className="font-black text-accent">알뜰한 업그레이드 구간</p>
              <p className="mt-1">
                기본 데이터가 {dataDiffLabel} 늘어나, 표준 요율 기준 매달 <span className="font-bold text-primary">{fmt(dataBenefit)}원</span> 상당의 데이터 요금을 아낄 수 있습니다.
              </p>
              <ul className="mt-2 list-disc pl-4 space-y-1 text-primary/70">
                <li>이제 지하철이나 카페 등 외부에서 친구가 보낸 고화질 사진이나 동영상 원본을 와이파이 찾지 않고 그 자리에서 바로 확인할 수 있어요.</li>
                <li>출퇴근길 내내 음악 스트리밍을 매일 끊김 없이 들을 수 있는 용량입니다.</li>
              </ul>
            </div>
          )}

          {/* 15GB ~ 30GB 미만 */}
          {isHighRange && (
            <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
              <p className="font-black text-accent">가장 대중적인 업그레이드 구간</p>
              <p className="mt-1">
                기본 데이터가 {dataDiffLabel} 대폭 늘어납니다. 이 용량을 초과 요금으로 환산하면 무려 월 <span className="font-bold text-primary">{fmt(dataBenefit)}원</span> 이득이에요!
              </p>
              <ul className="mt-2 list-disc pl-4 space-y-1 text-primary/70">
                <li>매일 출퇴근길(왕복 2시간) 동안 유튜브나 넷플릭스 영상을 고화질(720p)로 한 달 내내 볼 수 있는 용량입니다.</li>
                <li>이제 지하철이나 카페에서 웹서핑할 때 '동영상 자동 재생' 옵션을 켜두어도 한 달 내내 데이터가 모자라지 않는 환경이 됩니다.</li>
              </ul>
            </div>
          )}

          {/* 30GB 이상 / 무제한 */}
          {isUltraRange && (
            <div className="mt-2 text-xs leading-relaxed text-muted-foreground">
              <p className="font-black text-accent">거의 무제한급 구간</p>
              <p className="mt-1">
                매달 <span className="font-bold text-primary">{fmt(capBenefit)}원</span>의 요금 폭탄 걱정을 완벽히 차단하는 대용량 스펙입니다.
              </p>
              <ul className="mt-2 list-disc pl-4 space-y-1 text-primary/70">
                <li>주말 내내 카페에서 노트북에 핫스팟을 연결해 재택근무를 하거나 인터넷 강의를 들어도 끄떡없는 대용량입니다.</li>
                <li>모바일 고사양 게임의 대규모 패치 업데이트를 길거리에서 셀룰러 데이터로 부담 없이 즉시 내려받을 수 있게 됩니다.</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 6. 안심마크 안내 */}
      {recommendedSpec.hasQos && (
        <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3 items-start">
          <ShieldAlert className="text-emerald-500 shrink-0 mt-0.5" size={16} />
          <div className="text-xs leading-relaxed">
            <p className="font-black text-emerald-600 dark:text-emerald-400">속도 제어 안심 마크 제공</p>
            <p className="mt-1 text-muted-foreground">
              기본 데이터인 {recommendedSpec.data.split("(")[0]}를 모두 소진하더라도, 추가 요금 없이 
              <span className="font-extrabold text-primary"> {recommendedSpec.qosSpeed}</span> 속도로 
              카카오톡 메시지 전송이나 음악 감상을 끊김 없이 안심하고 이용할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      {/* 7. 부가서비스 링크 버튼 */}
      <div className="mt-6 flex flex-col gap-2.5">
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
          실제 가입 시점의 결합 조건 및 프로모션에 따라 다를 수 있습니다.
        </p>
      </div>

    </div>
  );
}
