// src/app/features/chat-flow/flows/telecom/bundle/flow.ts

import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { mockBundlePlans, fetchBundlePlansFromApi } from "./mockData";
import { buildBundleResult } from "./result";

const namespace = "bundle";

const opening: FlowStep[] = [
  // [Part 1 - 0번] 시작 안내 메시지
  {
    id: "bundle-intro",
    type: "assistant-message",
    message: "결합 상품은 가족 회선과 인터넷·IPTV 구성을 함께 확인할게요. 현재 요금 조건부터 확인해볼게요.",
    next: "bundle-current-carrier",
  },

  // [Part 1 - 1번] 현재 사용 중인 통신사 선택
  {
    id: "bundle-current-carrier",
    type: "single-choice",
    message: "현재 이용 중이신 주력 인터넷/통신사를 선택해 주세요.",
    answerKey: `${namespace}.currentCarrier`,
    options: [
      { value: "SK", label: "SK브로드밴드 (SK)" },
      { value: "KT", label: "KT올레 (KT)" },
      { value: "LGU", label: "LG유플러스 (LGU)" },
      { value: "SKYLIFE", label: "스카이라이프/케이블 (SKYLIFE)" },
    ],
    next: "bundle-current-members",
  },

  // [Part 1 - 2번] 이동전화 결합 인원
  {
    id: "bundle-current-members",
    type: "single-choice",
    message: "현재 이동전화(휴대폰) 결합에 묶여 있는 인원은 총 몇 명인가요?",
    answerKey: `${namespace}.currentMembers`,
    options: [
      { value: "1인", label: "1인" },
      { value: "2인", label: "2인" },
      { value: "3인", label: "3인" },
      { value: "4인", label: "4인" },
      { value: "5인 이상", label: "5인 이상" },
    ],
    next: "bundle-current-services",
  },

  // [Part 1 - 3번] 현재 결합 상품 조합 형태 선택
  {
    id: "bundle-current-services",
    type: "multi-choice",
    message: "현재 결합 상품에 포함되어 있는 항목을 모두 선택해 주세요.",
    answerKey: `${namespace}.currentServices`,
    options: [
      { value: "phone", label: "이동전화" },
      { value: "internet", label: "인터넷" },
      { value: "iptv", label: "IPTV" },
      { value: "home-phone", label: "집전화" },
    ],
    minSelections: 1,
    next: "bundle-current-fee",
  },

  // [Part 1 - 4번] 요금 입력
  {
    id: "bundle-current-fee",
    type: "number-input",
    message: "매달 납부하시는 총 금액(회선별 핸드폰 요금 + 인터넷 + IPTV 등 합산)은 얼마인가요?",
    answerKey: `${namespace}.currentFee`,
    placeholder: "금액만 적어주세요.",
    min: 0,
    unit: "원",
    next: "bundle-penalty-know",
  },

  // [Part 1 - 5번] 약정 기간 중도해지금액 여부
  {
    id: "bundle-penalty-know",
    type: "single-choice",
    message: "현재 약정 기간 중도 해지 시 발생하는 위약금(해지 대행금액)을 알고 계신가요?\n\n⚠️ 진단 솔루션 경고: 입력 단계에서 '잘 모르겠음'을 선택하실 경우, 최종 결과 금액에 위약금이 포함되지 않으니 이 점 유의하여 고려해 주세요.",
    answerKey: `${namespace}.knowPenalty`,
    options: [
      { value: "yes", label: "금액 입력하기", next: "bundle-penalty-input" },
      { value: "no", label: "건너뛰기 (잘 모르겠음)", next: "bundle-part2-intro" },
    ],
  },

  // [Part 1 - 5-1번] 약정 기간 중도해지금액 입력
  {
    id: "bundle-penalty-input",
    type: "number-input",
    message: "발생하는 위약금(해지 대행금액)을 입력해 주세요.",
    answerKey: `${namespace}.penalty`,
    placeholder: "예: 100000",
    min: 0,
    unit: "원",
    next: "bundle-part2-intro",
  },
];

const specific: FlowStep[] = [
  // [Part 2 - 6번] 원하는 요금제 파트 진입 안내
  {
    id: "bundle-part2-intro",
    type: "assistant-message",
    message: "지금부터 희망하시는 요금제 및 서비스 조건을 선택할게요.",
    next: "bundle-desired-carrier",
  },

  // [Part 2 - 7번] 원하는 통신사 선택
  {
    id: "bundle-desired-carrier",
    type: "single-choice",
    message: "희망하시는 통신사를 선택해 주세요.",
    answerKey: `${namespace}.desiredCarrier`,
    options: [
      { value: "SK", label: "SK브로드밴드 (SK)" },
      { value: "KT", label: "KT올레 (KT)" },
      { value: "LGU", label: "LG유플러스 (LGU)" },
      { value: "SKYLIFE", label: "스카이라이프/케이블 (SKYLIFE)" },
    ],
    next: "bundle-desired-members",
  },

  // [Part 2 - 8번] 이동전화 결합 인원
  {
    id: "bundle-desired-members",
    type: "single-choice",
    message: "이동전화 결합을 구성할 예상 인원을 선택해 주세요.",
    answerKey: `${namespace}.desiredMembers`,
    options: [
      { value: "1인", label: "1인" },
      { value: "2인", label: "2인" },
      { value: "3인", label: "3인" },
      { value: "4인", label: "4인" },
      { value: "5인 이상", label: "5인 이상" },
    ],
    next: "bundle-desired-services",
  },

  // [Part 2 - 9번] 결합 상품 조합 형태 선택
  {
    id: "bundle-desired-services",
    type: "multi-choice",
    message: "새로운 결합 상품 조합에 포함할 항목을 선택해 주세요.",
    answerKey: `${namespace}.desiredServices`,
    options: [
      { value: "phone", label: "이동전화" },
      { value: "internet", label: "인터넷" },
      { value: "iptv", label: "IPTV" },
      { value: "home-phone", label: "집전화" },
    ],
    minSelections: 1,
    next: "bundle-recommendation-api",
  },

  // [Part 2 - 10번] 🔄 결합 조건에 따른 요금제 리스트 선택 (API 연동 리스트 카드 선택형)
  {
    id: "bundle-recommendation-api",
    type: "single-choice",
    message: "선택하신 조건 기반의 최적화된 [추천 결합 요금제] 조합을 확인하세요.",
    answerKey: `${namespace}.selectedRecommendedPlan`,
    options: [], // optionsResolver로 바인딩
    optionsResolver: (answers) => {
      const desiredCarrier = answers["bundle.desiredCarrier"] as string;
      const desiredServices = (answers["bundle.desiredServices"] as string[]) || [];

      // Filter matching carrier
      const matchingCarrierPlans = mockBundlePlans.filter((p) => p.carrier === desiredCarrier);

      // Find plans that overlap with desiredServices
      const scoredPlans = matchingCarrierPlans.map((plan) => {
        let score = 0;
        plan.services.forEach((s) => {
          if (desiredServices.includes(s)) score += 1;
        });
        return { plan, score };
      });

      // Sort by score descending
      scoredPlans.sort((a, b) => b.score - a.score);

      const rec1 = scoredPlans[0]?.plan || mockBundlePlans[0];
      const rec2 = scoredPlans[1]?.plan || mockBundlePlans[1];

      return [
        { value: rec1.id, label: `[추천 1순위] ${rec1.name} (월 ${rec1.price.toLocaleString()}원)` },
        { value: rec2.id, label: `[추천 2순위] ${rec2.name} (월 ${rec2.price.toLocaleString()}원)` },
        { value: "direct-select", label: "해당되는 요금제가 없음 (유사 리스트 보기)", next: "bundle-all-plans-select" },
        { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "bundle-custom-plan-input" },
      ];
    },
    next: "bundle-result",
  },

  // [Part 2 - 10-1번] 전체 요금제 리스트 선택
  {
    id: "bundle-all-plans-select",
    type: "single-choice",
    message: "추천 요금제 외에 선택 가능한 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요.",
    answerKey: `${namespace}.manualSelectedPlan`,
    options: [],
    optionsResolver: (answers) => {
      const desiredCarrier = answers["bundle.desiredCarrier"] as string;
      return mockBundlePlans
        .filter((plan) => plan.carrier === desiredCarrier)
        .map((plan) => ({
          value: plan.id,
          label: `${plan.name} (월 ${plan.price.toLocaleString()}원)`,
        }));
    },
    next: "bundle-result",
  },

  // [Part 2 - 10-2번] 직접 입력 분기 스텝
  {
    id: "bundle-custom-plan-input",
    type: "text-input",
    message: "사용 중이신 요금제 이름을 입력해주세요.",
    answerKey: `${namespace}.customPlanName`,
    placeholder: "예: 온가족 할인 요금제",
    next: "bundle-result",
  },

  // [Part 2 - 11번] 요금 비교 결과 출력 스텝 (요금 비교·추천 솔루션)
  {
    id: "bundle-result",
    type: "result",
    resultBuilder: buildBundleResult,
    message: "선택하신 요금제를 바탕으로 결합상품 요금 비교·추천 솔루션 분석이 완료되었습니다. 아래 카드에서 비교 분석 리포트를 확인해 보세요.",
    next: "bundle-ask-grade",
  },

  // [Part 3 - 12번] 소비 패턴 등급 진단 여부 분기 질문
  {
    id: "bundle-ask-grade",
    type: "single-choice",
    message: "고객님의 요금 절감액을 분석하여 소비 패턴 등급을 진단받으시겠습니까?",
    answerKey: `${namespace}.askGrade`,
    options: [
      { value: "yes", label: "YES", next: "bundle-grade-result" },
      { value: "no", label: "NO", next: "bundle-completed-exit" },
    ],
  },

  // [Part 3 - 13번] 결합상품 소비 패턴 등급 진단 결과 노출
  {
    id: "bundle-grade-result",
    type: "result",
    resultBuilder: buildBundleResult,
    message: "소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다.",
  },

  // [Part 3 - 17번] 최종 대화 종료
  {
    id: "bundle-completed-exit",
    type: "result",
  },
];

export const bundleFlow: FlowDefinition = {
  id: "bundle-flow",
  subCategoryId: "bundle",
  categoryId: "telecom",
  startStepId: "bundle-intro",
  steps: composeFlow(opening, specific),
};
