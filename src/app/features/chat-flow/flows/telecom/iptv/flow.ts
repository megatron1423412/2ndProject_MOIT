// src/app/features/chat-flow/flow/iptv/flow.ts

import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
// Mock 데이터 및 등급 계산 함수 불러오기
import { mockIptvPlans, calculateIptvGrade } from "./mockData";

const namespace = "iptv";

// providerType 값(value) -> 실제 노출용 라벨 매핑
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

// Part 1
const opening: FlowStep[] = [
  {
    id: "iptv-intro",
    type: "assistant-message",
    message: "TV·IPTV는 현재 요금과 실제 채널 사용량을 나눠서 볼게요.",
    next: "iptv-provider-type",
  },
  // 1. 통신사 선택 (정적 객체 배열 내부에 각각의 목적지 next 명시)
  {
    id: "iptv-provider-type",
    type: "single-choice",
    message: "현재 이용 중이신 TV·IPTV 서비스 형태를 선택해주세요.",
    answerKey: `${namespace}.providerType`,
    options: [
      { value: "sk_btv", label: providerTypeLabelMap.sk_btv, next: "iptv-current-price-input" },
      { value: "kt_genie", label: providerTypeLabelMap.kt_genie, next: "iptv-current-price-input" },
      { value: "lg_uplus", label: providerTypeLabelMap.lg_uplus, next: "iptv-current-price-input" },
      { value: "dlive", label: providerTypeLabelMap.dlive, next: "iptv-current-price-input" },
      { value: "kt_hcn", label: providerTypeLabelMap.kt_hcn, next: "iptv-current-price-input" },
      { value: "genie_skylife", label: providerTypeLabelMap.genie_skylife, next: "iptv-current-price-input" },
      { value: "kt_skylife", label: providerTypeLabelMap.kt_skylife, next: "iptv-current-price-input" },
      // 💡 셋톱박스 없음 선택 시 Part 2 약정 선택 구간(iptv-desired-contract)으로 다이렉트 이동하도록 지정
      { value: "none", label: providerTypeLabelMap.none, next: "iptv-desired-contract" },
    ],
  },
];

const specific: FlowStep[] = [
  // --- 2. 요금제 금액 사용자가 입력하는 부분 ---
  {
    id: "iptv-current-price-input",
    type: "number-input",
    message: "현재 납부하고 계시는 TV·IPTV 요금제 금액을 입력해주세요.",
    answerKey: `${namespace}.currentPlanPriceInput`,
    placeholder: "예: 15400",
    min: 0,
    unit: "원",
    next: "iptv-select-current-method",
  },

  // --- 3. 요금제 입력 및 불러오기 선택 ---
  {
    id: "iptv-select-current-method",
    type: "single-choice",
    message: "현재 이용 중이신 요금제 정보를 어떻게 입력하시겠습니까?",
    answerKey: `${namespace}.currentInputMethod`,
    options: [
      { value: "list", label: "현재 요금제 리스트에서 직접 고르기", next: "iptv-choose-current-list" },
      { value: "manual", label: "요금제 직접 입력하기", next: "iptv-manual-name-input" },
    ],
  },
  // 3-1. 요금 리스트 직접 고르기
  {
    id: "iptv-choose-current-list",
    type: "single-choice",
    message: "현재 이용 중이신 요금제를 선택해주세요.",
    answerKey: `${namespace}.currentPlanId`,
    options: [
      ...mockIptvPlans.map((plan) => ({
        value: plan.id,
        label: `[${plan.carrier}] ${plan.name} - 월 ${plan.price.toLocaleString()}원`,
      })),
      { value: "manual_fallback", label: "⚠️ 리스트에 내 요금제가 없음 (직접 입력)", next: "iptv-manual-name-input" },
    ],
    next: "iptv-contract-diagnosis",
  },

  // 3-2. 요금제 직접 입력
  {
    id: "iptv-manual-name-input",
    type: "text-input",
    message: "현재 사용 중이신 요금제 이름을 입력해주세요.",
    answerKey: `${namespace}.currentPlanNameManual`,
    placeholder: "예: Btv 스탠다드",
    next: "iptv-manual-summary",
  },

  // 사용자가 입력/선택한 providerType, 요금제명, 금액을 실제 값으로 조합해 보여주는 동적 요약 스텝
  {
    id: "iptv-manual-summary",
    type: "assistant-message",
    message: (context: any) => {
      const data = context?.[namespace] || {};
      const providerLabel = providerTypeLabelMap[data.providerType] ?? data.providerType ?? "미확인 서비스 형태";
      const planName = data.currentPlanNameManual ?? "미입력";
      const rawPrice = data.currentPlanPriceInput;
      const priceText = rawPrice !== undefined && rawPrice !== null && rawPrice !== ""
        ? `${Number(rawPrice).toLocaleString()}원`
        : "미입력";

      return `[${providerLabel}] ${planName} - 월 ${priceText} 요금제를 사용하시고 계십니다.`;
    },
    next: "iptv-contract-diagnosis",
  },

  // --- 4. 남은 약정 기간 선택 ---
  {
    id: "iptv-contract-diagnosis",
    type: "single-choice",
    message:
      "현재 고객님의 약정 상태는 어떠신가요?\n\n💡 [공지] 인터넷·IPTV는 3년 약정이 끝나면 무조건 사은품을 받거나 재약정 할인을 받아야 돈이 모입니다.",
    answerKey: `${namespace}.userContractStatus`,
    options: [
      { value: "expired", label: "가입한 지 3년 넘음 (또는 만료됨)", next: "iptv-desired-contract" },
      { value: "remaining", label: "아직 약정 기간 남음", next: "iptv-desired-contract" },
      { value: "unknown", label: "잘 모르겠음", next: "iptv-desired-contract" },
    ],
  },

  // --- Part 2. 조건에 맞는 요금제 제시·선택 ---
  {
    id: "iptv-desired-contract",
    type: "single-choice",
    message: "이제 원하시는 TV·IPTV 요금제를 찾아볼까요.\n비교를 원하시는 약정 기간을 선택해주세요.\n선택하신 약정에 맞게 TV·IPTV 요금제를 알려 드립릴께요.",
    answerKey: `${namespace}.desiredContract`,
    options: [
      { value: "3years", label: "3년 약정 (추천)" },
      { value: "2years", label: "2년 약정" },
      { value: "1year", label: "1년 약정" },
      { value: "none", label: "무약정" },
    ],
    next: "iptv-select-new-plan",
  },
  {
    id: "iptv-select-new-plan",
    type: "single-choice",
    message: "선택하신 약정 조건에 맞는 TV·IPTV 요금제 리스트입니다. 변경을 고려 중이거나 관심 있는 요금제를 선택해주세요.\n※셋톱박스 대여, 출동비 별도※",
    answerKey: `${namespace}.selectedNewPlan`,
    next: "iptv-ask-comparison",
    options: [...mockIptvPlans]
      .sort((a, b) => {
        const order = { "SKT": 1, "KT": 2, "LGU+": 3 };
        return order[a.carrier] - order[b.carrier];
      })
      .map((plan) => ({
        value: plan.id,
        label: `[${plan.carrier}] ${plan.name} (${plan.channels}개 채널) - 월 ${plan.price.toLocaleString()}원`,
      })),
  },

  // --- 요금제 비교 의사 타진 분기점 ---
  {
    id: "iptv-ask-comparison",
    type: "single-choice",
    message: "선택하신 요금제와 현재 이용 중이신 요금제를 비교해 보시겠습니까?",
    answerKey: `${namespace}.askComparison`,
    options: [
      { value: "yes", label: "예, 비교해 주세요", next: "iptv-result" },
      { value: "no", label: "아니요", next: "iptv-ask-other-plan-natural" },
    ],
  },

  // 요금제 비교 '아니요' 선택 시 주관식 자연어 입력
  {
    id: "iptv-ask-other-plan-natural",
    type: "text-input",
    message: "그렇다면 혹시 다른 요금제나 통신사 조건을 내 요금과 비교해 보시겠어요? 원하시는 요금제나 제안 사항을 자유롭게 말씀해 주세요.",
    answerKey: `${namespace}.otherPlanNaturalResponse`,
    next: "iptv-natural-end-result",
  },

  // 무한 루프 차단용 전용 마감 결과 스텝
  {
    id: "iptv-natural-end-result",
    type: "result",
    message: "남겨주신 의견을 토대로 더 알맞은 맞춤 제안을 준비하겠습니다. 이용해 주셔서 감사합니다!",
  },

  // --- Part 3. 요금 비교 결과 출력 스텝 ---
  {
    id: "iptv-result",
    type: "assistant-message",
    message: (context: any) => {
      const inputMethod = context?.[namespace]?.currentInputMethod;
      const currentPlanId = context?.[namespace]?.currentPlanId;
      const currentPriceInput = Number(context?.[namespace]?.currentPlanPriceInput || 0);

      let currentPlanString = "";

      if (inputMethod === "list" && currentPlanId && currentPlanId !== "manual_fallback") {
        const foundPlan = mockIptvPlans.find(p => p.id === currentPlanId);
        if (foundPlan) {
          currentPlanString = `[${foundPlan.carrier}] ${foundPlan.name} - 월 ${foundPlan.price.toLocaleString()}원`;
        }
      }

      if (!currentPlanString) {
        const providerType = context?.[namespace]?.providerType;
        const providerLabel = providerTypeLabelMap[providerType] ?? "직접 입력 요금제";
        const planNameManual = context?.[namespace]?.currentPlanNameManual || "기본 요금제";

        currentPlanString = `[${providerLabel}] ${planNameManual} - 월 ${currentPriceInput.toLocaleString()}원`;
      }

      const selectedPlanId = context?.[namespace]?.selectedNewPlan;
      const selectedPlan = mockIptvPlans.find(p => p.id === selectedPlanId);
      const selectedPlanString = selectedPlan
        ? `${selectedPlan.name} (${selectedPlan.price.toLocaleString()}원)`
        : "선택 요금제 정보 없음";

      const selectedPrice = selectedPlan ? selectedPlan.price : 0;
      const priceDiff = currentPriceInput - selectedPrice;

      let solutionText = "";
      if (priceDiff > 0) {
        solutionText = `#### 💡 맞춤형 추천 솔루션\n**① 채널 스펙을 낮춰서 고정비를 줄일 때 (절약형)**\n> "TV 요금제를 일상 실속형(~200개 채널)으로 낮추면, 매달 고정비 **${priceDiff.toLocaleString()}원** / 연 **${(priceDiff * 12).toLocaleString()}원**을 아낄 수 있어요!\n> (자주 안 보던 유료 전문 채널만 제외될 뿐, tvN이나 지상파·종편 등 주요 예능·드라마 본방사수는 똑같이 끊김 없이 가능합니다.)"`;
      } else {
        const absoluteDiff = Math.abs(priceDiff);
        solutionText = `#### 💡 맞춤형 추천 솔루션\n**② 채널 스펙을 높여서 고정비가 늘어날 때 (지출형)**\n> "매달 **${absoluteDiff.toLocaleString()}원** / 연 **${(absoluteDiff * 12).toLocaleString()}원**이 더 지출되지만, TV 채널이 전 채널 정석형(~230개 채널 이상)으로 늘어나 야구·축구 생중계, 애니메이션, 해외 드라마까지 채널 막힘없이 쾌적하게 즐길 수 있습니다."`;
      }

      return `### 📊 요금 비교 결과\n현재 당신의 요금제는 **${currentPlanString}** 입니다.\n새롭게 선택하신 요금제는 **[추천 요금제] ${selectedPlanString}** 입니다.\n\n---\n\n${solutionText}`;
    },
    next: "iptv-ask-grade-diagnosis"
  },

  // --- 요금 비교 후 등급 진단 여부 분기점 ---
  {
    id: "iptv-ask-grade-diagnosis",
    type: "single-choice",
    message: "현재 요금 비교 내용을 토대로 고객님 맞춤형 'IPTV 소비 패턴 등급 진단'까지 연속해서 받아보시겠습니까?",
    answerKey: `${namespace}.askGradeDiagnosis`,
    options: [
      { value: "yes", label: "예, 등급 진단도 받을래요", next: "iptv-grade-result" },
      { value: "no", label: "아니요, 여기까지만 볼게요", next: "iptv-natural-end-result" },
    ],
  },

  // --- Part 4. 최종 등급 진단 결과 노출 ---
  {
    id: "iptv-grade-result",
    type: "result",
    message: (context: any) => {
      const inputMethod = context?.[namespace]?.currentInputMethod;
      const currentPlanId = context?.[namespace]?.currentPlanId;
      let currentPrice = Number(context?.[namespace]?.currentPlanPriceInput || 0);

      if (inputMethod === "list" && currentPlanId && currentPlanId !== "manual_fallback") {
        const foundPlan = mockIptvPlans.find(p => p.id === currentPlanId);
        if (foundPlan) currentPrice = foundPlan.price;
      }

      const selectedPlanId = context?.[namespace]?.selectedNewPlan;
      const selectedPlan = mockIptvPlans.find(p => p.id === selectedPlanId);
      const selectedPrice = selectedPlan ? selectedPlan.price : 0;

      const hasRequiredGenres = true;
      const result = calculateIptvGrade(currentPrice, selectedPrice, hasRequiredGenres);
      const savingPercent = currentPrice > 0 ? (result.netBenefit / currentPrice) * 100 : 0;

      return `### 🏅 IPTV 요금제 등급 진단 (소비 패턴 분석)
IPTV는 단순 가격이나 채널 개수보다 **'내가 보는 채널을 유지하며 비용을 아끼는가'**가 핵심입니다.

* **최종 진단 등급**:  🏆 **${result.grade} 등급**
* **실질 월 이득**:  **${result.netBenefit.toLocaleString()}원** (월간 절감 비율: ${savingPercent.toFixed(1)}%)
* **진단 소견**: ${result.message}`;
    },
  },
];

export const iptvFlow: FlowDefinition = {
  id: "iptv-flow",
  subCategoryId: "iptv",
  categoryId: "telecom",
  startStepId: "iptv-intro",
  steps: composeFlow(opening, specific),
};