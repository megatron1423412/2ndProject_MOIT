// src/app/features/chat-flow/flows/telecom/iptv/IptvDiagnosisReport.tsx

import React from "react";
import { CheckCircle2, ShieldAlert, Sparkles, ExternalLink, Activity, ArrowRightLeft, AlertTriangle } from "lucide-react";
import type { FlowResult } from "../../../core/types";
import { mockIptvPlans, carrierUrlMap } from "./mockData";

interface IptvDiagnosisReportProps {
  result: FlowResult;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

const providerTypeLabelMap: Record<string, string> = {
  sk_btv: "SK 브로드밴드(B tv)",
  kt_genie: "KT (지니 TV)",
  lg_uplus: "LG유플러스 (U+tv)",
  dlive: "딜라이브",
  kt_hcn: "KT HCN",
  lg_hellovision: "LG헬로비전",
  hello_vision: "LG헬로비전",
  genie_skylife: "스카이라이프",
  kt_skylife: "KT 스카이라이프",
  cmb: "CMB",
  none: "셋톱박스 없음",
};

export default function IptvDiagnosisReport({ result }: IptvDiagnosisReportProps) {
  const answers = result.metadata?.answers || {};

  const inputMethod = answers["iptv.currentInputMethod"];
  const currentPlanId = answers["iptv.currentPlanId"];
  const currentPriceInput = Number(answers["iptv.currentPlanPriceInput"] || 0);
  const contractPeriod = answers["iptv.userContractStatus"] || "unknown"; // 약정 상태 가져오기

  let currentPlanString = "";
  let currentChannels = 200;

  if (inputMethod === "list" && currentPlanId && currentPlanId !== "manual_fallback") {
    const foundPlan = mockIptvPlans.find((p) => p.id === currentPlanId);
    if (foundPlan) {
      currentPlanString = `${providerTypeLabelMap[foundPlan.carrier] ?? foundPlan.carrier} ${foundPlan.name}`;
      currentChannels = foundPlan.channels;
    }
  }

  if (!currentPlanString) {
    const providerType = answers["iptv.providerType"] || answers["iptv.providerCategory"] || "none";
    const providerLabel = providerTypeLabelMap[providerType] ?? "직접 입력 요금제";
    const planNameManual = answers["iptv.currentPlanNameManual"] || "기본 요금제";
    currentPlanString = `[${providerLabel}] ${planNameManual}`;
  }

  const selectedNewPlan = answers["iptv.selectedNewPlan"];
  const selectedPlanId = (selectedNewPlan && selectedNewPlan !== "direct-choose")
    ? selectedNewPlan
    : (answers["iptv.selectedNewPlanDirect"] || answers["iptv.manualSelectedPlan"]);
  const selectedPlan = mockIptvPlans.find((p) => p.id === selectedPlanId);
  const selectedPlanString = selectedPlan
    ? `[${providerTypeLabelMap[selectedPlan.carrier] ?? selectedPlan.carrier}] ${selectedPlan.name}`
    : "선택 요금제 정보 없음";

  // 약정 조건에 따른 선택 요금 추출
  const desiredContract = (answers["iptv.desiredContract"] as string) || "3years";
  const priceMap = selectedPlan?.prices?.single as Record<string, number | undefined> | undefined;
  const selectedPrice = priceMap
    ? (priceMap[desiredContract] || priceMap["3years"] || priceMap["none"] || 0)
    : (result.metadata?.selectedPrice || 0);
  const selectedChannels = selectedPlan ? selectedPlan.channels : 0;

  // ① 절약형 공식: 기존 요금 - 선택 요금
  const savingDiff = currentPriceInput - selectedPrice;
  // ② 지출형 공식: 선택 요금 - 기존 요금
  const spendingDiff = selectedPrice - currentPriceInput;

  // 약정 상태 판별 변수
  const isExpired = contractPeriod === "expired";
  const isRemaining = contractPeriod === "remaining";

  /**
   * 💡 3. name, channels, prices 데이터를 조합한 동적 맞춤 사유 빌더 함수
   */
  const getDynamicCarrierReason = () => {
    if (!selectedPlan) {
      return "사용자의 시청 습관과 희망하시는 예산 범위에 꼭 맞춰 고안된 알뜰 맞춤형 요금 설계입니다.";
    }

    const { name, carrier, channels } = selectedPlan;
    const price = selectedPrice;

    // 3-1. KT 스카이라이프 (초저가형 베이직)
    if (carrier === "kt_skylife" && price <= 10000) {
      return "셋톱박스 임대료를 감안하더라도 매달 나가는 TV 기본 요금을 커피 한두 잔 값에 불과한 만 원 미만으로 극단적으로 다이어트하여 고정 지출을 아끼고 싶을 때 가장 이상적입니다.";
    }

    // 3-2. 지니 TV 스카이라이프 (1~2만 원대 유연성 상품)
    if (carrier === "genie_skylife") {
      return "약정 얽매임 없이 필요에 따라 무약정으로 안심하고 짧게 쓰거나, 약정을 걸어 대기업 IPTV 수준의 풍성한 채널(210~220ch)을 부담 없이 알뜰하게 누리고 싶을 때 최적의 유연한 선택지를 제공합니다.";
    }

    // 3-3. OTT 결합 초이스 요금제 (넷플릭스, 티빙, 디즈니 등)
    if (name.includes("초이스") || name.includes("넷플릭스") || name.includes("티빙") || name.includes("디즈니") || name.includes("유튜브")) {
      return "IPTV 채널 요금과 매월 개별 결제하던 OTT 구독료를 결합해 고지서 하나로 편리하게 청구받는 요금제입니다. 로그인 번거로움 없이 리모컨 클릭만으로 편리하게 콘텐츠를 넘나들고 싶을 때 최적입니다.";
    }

    // 3-4. 키즈/교육 특화 요금제 (키즈, 아이들나라, 교육 등)
    if (name.includes("키즈") || name.includes("아이들나라") || name.includes("교육") || name.includes("sil-sok")) {
      return "풍성한 키즈 채널 및 검증된 영유아 전용 교육 콘텐츠 무료 제공 혜택이 탄탄히 기본 탑재된 상품입니다. 월 요금을 알차게 다이어트하면서도 자녀 교육 인프라를 탄탄히 챙기길 원하는 부모님께 강력 추천합니다.";
    }

    // 3-5. VOD 및 지상파 다시보기 패키지 (방송패스 등)
    if (name.includes("방송패스") || name.includes("VOD")) {
      return "지상파 및 종편 드라마·예능 다시보기 자유이용 혜택이 요금제 자체에 빌트인된 특화 상품입니다. 제시간에 방송을 사수하기 어려워 개별 유료 다시보기 결제를 자주 하셨던 가구의 이중 지출을 완벽하게 차단해 줍니다.";
    }

    // 3-6. 딜라이브 / HCN 등 지역 알뜰 전용 요금제
    if ((carrier === "dlive" || carrier === "kt_hcn") && channels <= 120) {
      return "서울·경기 지역 가입자 중심의 특화된 초저가 알뜰형 디지털 라인입니다. 복잡한 가입 결합이나 불필요한 부가채널 없이, 주력 필수 실시간 방송 및 지상파 위주로 가볍고 실속 있게 TV를 보시기에 가장 좋습니다.";
    }

    // 3-7. 최고 스펙 요금제 (채널 250개 이상 프리미엄/All)
    if (channels >= 250) {
      return "해외 스포츠 생중계, 프리미엄 영화, 마이너 취미 방송까지 끊김 없이 완전 개방하여 안방을 극장처럼 만드는 풀 패키지입니다. 채널을 돌릴 때마다 뜨는 유료 가입 권유 화면 없이 쾌적하게 즐기고 싶은 분께 완벽합니다.";
    }

    // 3-8. 보편적인 가성비 스탠다드 요금제 (채널 200~240개 사이 기본형/베이직)
    if (channels >= 200) {
      return "지상파, 종편, 인기 드라마·예능(tvN, JTBC 등)을 포함해 가구 선호도가 높은 핵심 정규 채널을 모두 담은 정석 설계입니다. 가장 균형 잡힌 TV 환경을 적정 예산 범위 내에서 실속 있게 꾸미고 싶을 때 후회가 없습니다.";
    }

    // 3-9. 기타 가성비 요금제
    return "낭비되는 미사용 채널 비용을 최적화하여 꼭 필요한 방송만 실속 있게 챙겨갈 수 있도록 설계된 합리적인 가격의 실속형 맞춤 설계 요금제입니다.";
  };

  // 5. IPTV 맞춤형 세부 추천 소견 자동 생성
  let recommendationReason = "고객님의 TV 시청 패턴과 선호 채널 수에 가장 부합하는 실속형 요금 설계입니다.";
  if (selectedChannels >= 230) {
    recommendationReason = "해외 스포츠, 키즈, 영화 등 거의 모든 전문 유료 채널을 제한 없이 자유롭게 시청하고자 하는 온가족 다채널 중심의 프리미엄 설계입니다.";
  } else if (selectedChannels >= 200) {
    recommendationReason = "지상파, 종편, tvN을 비롯한 주요 예능/드라마 및 실시간 인기 채널이 모두 포함되어 대다수 가구가 가장 만족하며 이용하는 스탠다드 설계입니다.";
  } else if (selectedChannels > 0) {
    recommendationReason = "TV 시청량이 적거나 뉴스, 지상파 위주의 라이트 시청 환경에 맞춰 월 통신 고정비를 극한으로 아끼는 알뜰 가성비 설계입니다.";
  }

  const linkUrl = selectedPlan?.carrier ? (carrierUrlMap[selectedPlan.carrier] || "https://www.mvnohub.kr") : "https://www.mvnohub.kr";

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-md transition-all hover:shadow-lg">

      {/* 1. 상단 타이틀 및 배지 */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">
            TV·IPTV 분석 솔루션
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
            <Sparkles size={12} /> 요금 비교·추천 솔루션
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-black tracking-tight text-primary">
            IPTV 요금제 맞춤 설계 리포트
          </h2>
          <span className="shrink-0 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
            진단 완료
          </span>
        </div>
      </div>

      {/* 현재 사용중 요약 */}
      <div className="mt-5 rounded-xl bg-muted/20 p-4 border border-border/40 text-xs sm:text-sm">
        <p className="font-black text-primary leading-relaxed text-center">
          현재 당신의 요금제는 <span className="text-accent font-extrabold">"{currentPlanString}"</span> 입니다.
        </p>
      </div>

      {/* 2. 카드 형식 스펙 비교 */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* 현재 요금제 카드 */}
        <div className="rounded-xl border border-border/60 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE</span>
            <span className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">내 요금제</span>
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
              <span className="text-muted-foreground">제공 채널 수</span>
              <span className="font-bold text-primary">약 {currentChannels}개 채널</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">약정 상태</span>
              <span className="font-bold text-primary">
                {isExpired && "⚠️ 만료됨 (혜택 대상)"}
                {isRemaining && "⚡ 약정 기간 남음"}
                {!isExpired && !isRemaining && "미확인"}
              </span>
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
              <span className="text-muted-foreground">제공 채널 수</span>
              <span className="font-bold text-blue-600">{selectedChannels}개 채널</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">셋톱박스 지원</span>
              <span className="font-bold text-primary">최신형 스마트 셋톱 기본</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 금액 변동 분석 및 통신사별 가입 이유 (이미지 영역 대응 변경) */}
      <div className="mt-5 rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
        <div className="flex items-center gap-2 border-b border-blue-500/10 pb-2">
          <ArrowRightLeft className="text-blue-500" size={15} />
          <h4 className="text-xs font-black text-primary">"{selectedPlanString}"을 선택한다면</h4>
        </div>

        {/* 요금 변동 기본 설명 */}
        <p className="mt-2 text-xs leading-relaxed text-primary/95 font-medium font-sans">
          {savingDiff > 0 ? (
            <>
              현재 요금제 대비 매월 <span className="font-extrabold text-emerald-600">{fmt(savingDiff)}원</span> / 연간 총 <strong>{fmt(savingDiff * 12)}원</strong>을 절약할 수 있습니다.<br />
              <span className="text-muted-foreground text-[11px] block mt-1">
                (자주 안 보던 일부 유료 전문 채널만 제외될 뿐, tvN이나 지상파·종편 등 핵심 대중 채널 시청은 끊김 없이 그대로 가능합니다.)
              </span>
            </>
          ) : savingDiff < 0 ? (
            <>
              매달 <span className="font-extrabold text-destructive">{fmt(spendingDiff)}원</span> / 연간 <strong>{fmt(spendingDiff * 12)}원</strong>이 추가로 지출되지만, TV 시청 인프라가 넓어집니다.<br />
              <span className="text-muted-foreground text-[11px] block mt-1">
                (전 채널 가용형 설계로 야구·축구 생중계, 전문 어린이 콘텐츠, 해외 방송까지 어떤 채널이든 막힘없이 감상할 수 있습니다.)
              </span>
            </>
          ) : (
            <>
              현재 가입하고 계신 요금({fmt(currentPriceInput)}원)과 추천 설계 요금이 동일하여 추가 비용 변동이 없습니다.
            </>
          )}
        </p>

        {/* 요금제/채널/요금별 맞춤 가입 이유 (이미지 영역 동적 수정 사항) */}
        <div className="mt-3 border-t border-blue-500/10 pt-3 text-xs leading-relaxed">
          <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">💡 왜 이 통신사 요금제여야 할까요?</p>
          <p className="mt-1 text-muted-foreground">
            {getDynamicCarrierReason()}
          </p>
        </div>
      </div>

      {/* 4. 약정 만료 안내 배너 (isExpired) */}
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

      {/* 5. 용도별 속도 추천 사유 */}
      <div className="mt-5 rounded-xl bg-muted/30 border border-border/50 p-4">
        <p className="text-xs font-black text-primary flex items-center gap-1.5">
          <Activity size={14} className="text-blue-500" /> 스펙 추천 세부 소견
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {recommendationReason}
        </p>
      </div>

      {/* 6. 상세 연동 및 하단 안내 */}
      <div className="mt-6 flex flex-col gap-2">
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-black text-white shadow-sm transition-all hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99]"
        >
          통신사별 결합 할인 및 사은품 혜택 확인 <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-center text-muted-foreground/60 leading-normal">
          본 리포트는 고객님이 입력하신 정보와 추천 요금 데이터를 바탕으로 작성되었습니다.
          결합된 모바일 개수 및 제휴 카드 사용 조건에 따라 실제 월 납부금은 더 낮아질 수 있습니다.
        </p>
      </div>

    </div>
  );
}