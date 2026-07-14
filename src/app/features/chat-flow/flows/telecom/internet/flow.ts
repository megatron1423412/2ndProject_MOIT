import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { fetchInternetPlansFromApi, MOCK_ALL_INTERNET_PLANS, MOCK_RECOMMENDED_INTERNET_PLANS } from "./mockData";

const namespace = "internet";

// =================================================================
// [Part 1] 현재 사용자 정보 입력 파트
// =================================================================
const opening: FlowStep[] = [
  // [Part 1 - 0번] 시작 안내 메시지 (phone-intro 패턴 일치)
  {
    id: "internet-intro",
    type: "assistant-message",
    message: "인터넷 요금제 진단을 시작할게요. 현재 요금 조건부터 확인해볼게요.",
    next: "internet-carrier",
  },

  // [Part 1 - 1번] 통신사 선택 (인사말과 질문을 분리하여 답변 후 다음 질문이 나오도록 유도)
  {
    id: "internet-carrier",
    type: "single-choice",
    layout: "inline",
    message: "현재 사용하는 인터넷 통신사를 선택해주세요.",
    answerKey: `${namespace}.commonCarrier`,
    options: [
      { value: "SK", label: "SK 브로드밴드" },
      { value: "KT", label: "KT 올레" },
      { value: "LGU", label: "LG 유플러스" },
      { value: "HELLOVISION", label: "LG 헬로비전" },
      { value: "KTSKY", label: "KT 스카이라이프" },
      { value: "KTHCN", label: "KT HCN" },
      { value: "SKYLIFE", label: "스카이라이프" },
    ],
    next: "internet-fee",
  },

  // [Part 1 - 2번] 현재 사용하는 인터넷 요금 입력
  {
    id: "internet-fee",
    type: "number-input",
    message: "현재 납부하고 계신 인터넷 요금은 매달 얼마인가요?",
    answerKey: `${namespace}.fee`,
    placeholder: "예: 25000",
    min: 0,
    unit: "원",
    next: "internet-current-plan-api",
  },

  // [Part 1 - 3번] 🔄 요금조회 API 결과를 매칭하는 동적 스텝 (추천 요금제 카드 형식 노출)
  {
    id: "internet-current-plan-api",
    type: "single-choice",
    message: "현재 사용하시는 인터넷 요금제가 맞을까요?",
    answerKey: `${namespace}.confirmedPlan`,
    options: [
      { value: "direct-select", label: "직접 선택", next: "internet-all-plans-select" },
      { value: "direct-input", label: "직접 입력", next: "internet-custom-plan-input" },
    ],
    optionsResolver: (answers) => {
      const carrier = answers[`${namespace}.commonCarrier`] as string;
      const currentFee = answers[`${namespace}.fee`] as number;
      const apiPlans = fetchInternetPlansFromApi(carrier, currentFee);
      return [
        ...apiPlans,
        { value: "direct-select", label: "직접 선택", next: "internet-all-plans-select" },
        { value: "direct-input", label: "직접 입력", next: "internet-custom-plan-input" },
      ];
    },
    next: "internet-contract-notice",
  },

  // 직접 요금제명을 선택하는 분기 스텝
  {
    id: "internet-all-plans-select",
    type: "single-choice",
    message: "추천 요금제 외에 선택 가능한 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요.",
    answerKey: `${namespace}.manualSelectedPlan`,
    options: MOCK_ALL_INTERNET_PLANS,
    next: "internet-contract-notice",
  },

  // 직접 요금제명을 입력하는 분기 스텝
  {
    id: "internet-custom-plan-input",
    type: "text-input",
    message: "사용 중이신 인터넷 요금제 이름을 입력해주세요.",
    answerKey: `${namespace}.customPlan`,
    placeholder: "예: 기가 인터넷 요금제",
    next: "internet-contract-notice",
  },

  // [Part 1 - 4번] 약정 기간 진단 공지
  {
    id: "internet-contract-notice",
    type: "assistant-message",
    message: "인터넷은 3년 약정이 끝나면 무조건 사은품을 받거나 재약정 할인을 받아야 돈이 모입니다.",
    next: "internet-contract-period",
  },

  // [Part 1 - 5번] 현재 약정 기간 선택
  {
    id: "internet-contract-period",
    type: "single-choice",
    layout: "inline",
    message: "현재 인터넷 약정 기간은 얼마나 남으셨나요?",
    answerKey: `${namespace}.contractPeriod`,
    options: [
      { value: "expired", label: "가입한 지 3년 넘음 (또는 만료됨)" },
      { value: "under2y", label: "아직 약정 기간 남음 (2년 미만)" },
      { value: "under1y", label: "아직 약정 기간 남음 (1년 미만)" },
      { value: "unknown", label: "잘 모르겠음" },
    ],
    next: "internet-usage",
  },
];

// =================================================================
// [Part 2] 원하는 요금제 및 서비스 조건 선택 파트
// =================================================================
const specific: FlowStep[] = [
  // [Part 2 - 6번] 조건에 맞는 인터넷 요금제 선택
  {
    id: "internet-usage",
    type: "single-choice",
    layout: "inline",
    message: "조건에 맞는 인터넷 요금제를 선택해 주세요.",
    answerKey: `${namespace}.desiredSpeed`,
    options: [
      { value: "200", label: "200Mbps (일상 실속)" },
      { value: "500", label: "1Gbps (초고속)" },
      { value: "10000", label: "10Gbps (기업급)" },
    ],
    next: "internet-plan-contract",
  },

  // [Part 2 - 7번] 원하시는 약정 할인 기간 선택
  {
    id: "internet-plan-contract",
    type: "single-choice",
    layout: "inline",
    message: "원하시는 약정 할인 기간을 선택해 주세요.",
    answerKey: `${namespace}.planContract`,
    options: [
      { value: "discount3y", label: "3년 약정" },
      { value: "discount2y", label: "2년 약정" },
      { value: "discount1y", label: "1년 약정" },
      { value: "noDiscount", label: "무약정" },
    ],
    next: "internet-recommendation-api",
  },

  // [Part 2 - 8번] 🚀 요금 비교 추천 솔루션 요금제 선택 스텝
  {
    id: "internet-recommendation-api",
    type: "single-choice",
    message: "고객님의 조건을 분석하여 선정한 최적의 추천 요금제 리스트입니다.",
    answerKey: `${namespace}.selectedRecommendedPlan`,
    options: MOCK_RECOMMENDED_INTERNET_PLANS,
    optionsResolver: (answers) => {
      return [
        ...MOCK_RECOMMENDED_INTERNET_PLANS,
        { value: "direct-choose", label: "직접 고를래요 (전체 리스트 보기)", next: "internet-all-plans-select" },
      ];
    },
    next: "internet-result",
  },

  // 맞춤 절약 솔루션 결과 (DiagnosisResultCard에 바인딩)
  {
    id: "internet-result",
    type: "result",
    message: "모든 진단과 요금제 선택이 완료되었습니다! 상세 비교서 작성을 완료했어요.",
    next: "internet-ask-grade",
  },

  // 등급 진단 질문 스텝
  {
    id: "internet-ask-grade",
    type: "single-choice",
    message: "등급 진단을 받아보시겠습니까?",
    answerKey: `${namespace}.askGrade`,
    options: [
      { value: "yes", label: "YES", next: "internet-grade-result" },
      { value: "no", label: "NO", next: "internet-exit" },
    ],
  },

  // 등급 진단 결과 노출 스텝
  {
    id: "internet-grade-result",
    type: "result",
    message: "소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다.",
    next: "internet-ask-share",
  },

  // SNS 공유 확인 질문 스텝
  {
    id: "internet-ask-share",
    type: "single-choice",
    message: "진단받은 나의 소비 패턴 등급을 공유하시겠습니까?",
    answerKey: `${namespace}.askShare`,
    options: [
      { value: "yes", label: "YES", next: "internet-sns-redirect" },
      { value: "no", label: "NO", next: "internet-exit" },
    ],
  },

  // SNS 공유 리다이렉트 스텝
  {
    id: "internet-sns-redirect",
    type: "assistant-message",
    message: "인스타그램으로 이동합니다. [여기를 클릭하여 인스타그램에서 결과를 공유](https://instagram.com)해 주세요.",
    next: "internet-exit",
  },

  // 종료 및 새로운 주제 시작 질문 스텝
  {
    id: "internet-exit",
    type: "single-choice",
    message: "새로운 주제로 시작하시겠습니까?",
    answerKey: `${namespace}.exitRestart`,
    options: [],
    optionsResolver: () => [
      { value: "restart", label: "예, 새로운 주제로 시작할래요", next: "internet-intro" },
      { value: "exit", label: "아니요, 대화를 종료할래요", next: "internet-completed-exit" },
    ],
    next: "internet-completed-exit",
  },

  // 종료 완료 스텝
  {
    id: "internet-completed-exit",
    type: "result",
    message: "인터넷 요금제 진단 서비스를 이용해 주셔서 감사합니다. 안전하게 대화가 종료되었습니다.",
  },
];

// 최종 흐름 생성
export const internetFlow: FlowDefinition = {
  id: "internet-flow",
  subCategoryId: "internet",
  categoryId: "telecom",
  startStepId: "internet-intro",
  steps: composeFlow(opening, specific),
};