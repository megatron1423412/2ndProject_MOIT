// src/app/features/chat-flow/flows/telecom/iptv/flow.ts

import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
// Mock 데이터 및 등급 계산 함수 불러오기
import { mockIptvPlans, fetchIptvPlansFromApi } from "./mockData";
import { buildIptvResult } from "./result";

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

// =================================================================
// [Part 1] 현재 사용자 정보 입력 파트
// =================================================================
const opening: FlowStep[] = [
  // [Part 1 - 1번] 시작 안내 메시지 (인사말 분리로 phone 패턴 일치)
  {
    id: "iptv-intro",
    type: "assistant-message",
    message: "TV·IPTV는 현재 요금과 실제 채널 사용량을 나눠서 볼게요.",
    next: "iptv-provider-type",
  },

  // [Part 1 - 2번] 통신사 (서비스 형태) 선택
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
      // 💡 셋톱박스 없음 선택 시 Part 2 약정 선택 구간(iptv-desired-contract)으로 다이렉트 이동하도록 복원
      { value: "none", label: providerTypeLabelMap.none, next: "iptv-desired-contract" },
    ],
  },
];

// =================================================================
// [Part 2] 원하는 요금제 및 서비스 조건 선택 파트
// =================================================================
const specific: FlowStep[] = [
  // [Part 1 - 3번] 현재 납부 요금 입력
  {
    id: "iptv-current-price-input",
    type: "number-input",
    message: "현재 납부하고 계시는 TV·IPTV 요금제 금액을 입력해주세요.",
    answerKey: `${namespace}.currentPlanPriceInput`,
    placeholder: "예: 15400",
    min: 0,
    unit: "원",
    next: "iptv-current-plan-api", // 동적 API 조회 스텝으로 연결
  },

  // [Part 1 - 4번] 🔄 요금조회 API 결과를 매칭하는 동적 스텝 (추천 요금제 카드 형식 노출)
  {
    id: "iptv-current-plan-api",
    type: "single-choice",
    message: "현재 사용하시는 IPTV 요금제가 맞을까요?",
    answerKey: `${namespace}.confirmedPlan`,
    options: [
      { value: "direct-select", label: "직접 선택", next: "iptv-choose-current-list" },
      { value: "direct-input", label: "직접 입력", next: "iptv-manual-name-input" },
    ],
    optionsResolver: (answers) => {
      const providerType = answers[`${namespace}.providerType`] as string;
      const currentPrice = answers[`${namespace}.currentPlanPriceInput`] as number;
      const apiPlans = fetchIptvPlansFromApi(providerType, currentPrice);
      return [
        ...apiPlans,
        { value: "direct-select", label: "직접 선택", next: "iptv-choose-current-list" },
        { value: "direct-input", label: "직접 입력", next: "iptv-manual-name-input" },
      ];
    },
    next: "iptv-contract-diagnosis",
  },

  // [Part 1 - 4-1번] 요금 리스트 직접 고르기
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

  // [Part 1 - 4-2번] 요금제 직접 입력
  {
    id: "iptv-manual-name-input",
    type: "text-input",
    message: "현재 사용 중이신 요금제 이름을 입력해주세요.",
    answerKey: `${namespace}.currentPlanNameManual`,
    placeholder: "예: Btv 스탠다드",
    next: "iptv-contract-diagnosis", // 직접 입력 완료 후 바로 약정진단으로 복귀
  },

  // [Part 1 - 5번] 현재 약정 기간 상태 확인
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

  // [Part 2 - 6번] 비교를 원하는 약정 기간 선택
  {
    id: "iptv-desired-contract",
    type: "single-choice",
    message: "이제 원하시는 TV·IPTV 요금제를 찾아볼까요.\n비교를 원하시는 약정 기간을 선택해주세요.\n선택하신 약정에 맞게 TV·IPTV 요금제를 알려 드릴게요.",
    answerKey: `${namespace}.desiredContract`,
    options: [
      { value: "3years", label: "3년 약정 (추천)" },
      { value: "2years", label: "2년 약정" },
      { value: "1year", label: "1년 약정" },
      { value: "none", label: "무약정" },
    ],
    next: "iptv-select-new-plan",
  },

  // [Part 2 - 7번] 요금제 리스트 선택 (추천 요금제 카드 형태로 변경)
  {
    id: "iptv-select-new-plan",
    type: "single-choice",
    message: "선택하신 약정 조건에 맞는 TV·IPTV 요금제 추천입니다. 변경을 고려 중이거나 관심 있는 요금제를 선택해주세요.\n※셋톱박스 대여, 출동비 별도※",
    answerKey: `${namespace}.selectedNewPlan`,
    options: [
      { value: "iptv-sk-std", label: "[추천 1순위] Btv 스탠다드 (220개 채널) - 월 15,400원", next: "iptv-result" },
      { value: "iptv-sk-all", label: "[추천 2순위] Btv All (252개 채널) - 월 19,800원", next: "iptv-result" },
      { value: "direct-choose", label: "직접 고를래요 (전체 리스트 보기)", next: "iptv-all-plans-select" },
    ],
    optionsResolver: (answers) => {
      const providerType = answers[`${namespace}.providerType`] as string;
      
      let carrier = "KT";
      if (providerType && providerType.startsWith("sk")) carrier = "SKT";
      else if (providerType && providerType.startsWith("lg")) carrier = "LGU+";

      // 해당 통신사의 요금제 2개 추출해서 카드용 1순위, 2순위 추천 옵션 생성
      const matchingPlans = mockIptvPlans.filter((p) => p.carrier === carrier);
      const rec1 = matchingPlans[0] || mockIptvPlans[0];
      const rec2 = matchingPlans[1] || mockIptvPlans[1];

      return [
        { value: rec1.id, label: `[추천 1순위] ${rec1.name} (${rec1.channels}개 채널) - 월 ${rec1.price.toLocaleString()}원`, next: "iptv-result" },
        { value: rec2.id, label: `[추천 2순위] ${rec2.name} (${rec2.channels}개 채널) - 월 ${rec2.price.toLocaleString()}원`, next: "iptv-result" },
        { value: "direct-choose", label: "직접 고를래요 (전체 리스트 보기)", next: "iptv-all-plans-select" },
      ];
    },
    next: "iptv-result",
  },

  // [Part 2 - 7-1번] 전체 요금제 리스트 직접 선택 스텝
  {
    id: "iptv-all-plans-select",
    type: "single-choice",
    message: "TV·IPTV 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요.",
    answerKey: `${namespace}.selectedNewPlanDirect`,
    options: [...mockIptvPlans]
      .sort((a, b) => {
        const order: Record<string, number> = { "SKT": 1, "KT": 2, "LGU+": 3 };
        return (order[a.carrier] || 99) - (order[b.carrier] || 99);
      })
      .map((plan) => ({
        value: plan.id,
        label: `[${plan.carrier}] ${plan.name} (${plan.channels}개 채널) - 월 ${plan.price.toLocaleString()}원`,
      })),
    next: "iptv-result",
  },

  // [Part 2 - 8번] 📊 요금 비교 결과 출력 스텝 (요금 비교·추천 솔루션)
  {
    id: "iptv-result",
    type: "result",
    resultBuilder: buildIptvResult,
    message: "선택하신 요금제를 바탕으로 IPTV 요금 비교·추천 솔루션 분석이 완료되었습니다. 아래 카드에서 비교 분석 리포트를 확인해 보세요.",
    next: "iptv-ask-grade-diagnosis"
  },

  // [Part 3 - 9번] 소비 패턴 등급 진단 여부 분기 질문
  {
    id: "iptv-ask-grade-diagnosis",
    type: "single-choice",
    message: "등급 진단을 받아보시겠습니까?",
    answerKey: `${namespace}.askGrade`,
    options: [
      { value: "yes", label: "YES", next: "iptv-grade-result" },
      { value: "no", label: "NO", next: "iptv-completed-exit" },
    ],
  },

  // [Part 3 - 10번] 🏅 IPTV 소비 패턴 등급 진단 결과 노출
  {
    id: "iptv-grade-result",
    type: "result",
    resultBuilder: buildIptvResult,
    message: "IPTV 소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다.",
  },

  // [Part 3 - 14번] 최종 대화 종료
  {
    id: "iptv-completed-exit",
    type: "result",
  },
];

// 최종 흐름 생성
export const iptvFlow: FlowDefinition = {
  id: "iptv-flow",
  subCategoryId: "iptv",
  categoryId: "telecom",
  startStepId: "iptv-intro",
  steps: composeFlow(opening, specific),
};