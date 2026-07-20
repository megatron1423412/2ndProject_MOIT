import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { fetchInternetPlansFromApi, MOCK_ALL_INTERNET_PLANS, MOCK_RECOMMENDED_INTERNET_PLANS } from "./mockData";

const namespace = "internet";

// ── 인터넷 요금제 백그라운드 캐싱 ────────────────
interface CachedPlan {
  value: string;
  label: string;
  price: number;
}

const planCache: Record<string, CachedPlan[]> = {};

export function prefetchPlans(carrier: string) {
  if (planCache[carrier]) return;

  const carrierLabel = carrier === "SK" ? "SK 브로드밴드" 
                     : carrier === "KT" ? "KT 올레" 
                     : carrier === "LGU" ? "LG 유플러스"
                     : carrier === "HELLOVISION" ? "LG 헬로비전"
                     : carrier === "KTSKY" ? "KT 스카이라이프"
                     : carrier === "KTHCN" ? "KT HCN"
                     : carrier === "SKYLIFE" ? "스카이라이프"
                     : carrier;

  planCache[carrier] = [
    { value: "plan-internet-1", label: `[더미] ${carrierLabel} 광랜 인터넷 100Mbps (월 22,000원)`, price: 22000 },
    { value: "plan-internet-2", label: `[더미] ${carrierLabel} 베이직 인터넷 500Mbps (월 33,000원)`, price: 33000 },
    { value: "plan-internet-3", label: `[더미] ${carrierLabel} 기가 인터넷 1Gbps (월 38,500원)`, price: 38500 },
    { value: "plan-internet-4", label: `[더미] ${carrierLabel} 프리미엄 인터넷 2.5Gbps (월 44,000원)`, price: 44000 },
  ];
}

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

  // [Part 1 - 3번] 🔄 요금조회 API 결과를 매칭하는 동적 스텝
  {
    id: "internet-current-plan-api",
    type: "single-choice",
    message: "현재 사용하시는 인터넷 요금제가 맞을까요?",
    answerKey: `${namespace}.confirmedPlan`,
    options: [
      { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "internet-current-plans-list" },
      { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "internet-custom-plan-input" },
    ],
    optionsResolver: (answers) => {
      const carrier = answers[`internet.commonCarrier`] as string;
      const currentFee = answers[`internet.fee`] as number;
      
      prefetchPlans(carrier);

      const cached = planCache[carrier] || [];
      // 1순위 후보 (금액 차이 3,000원 이하 가장 가까운 요금제 하나만 추천)
      let matched = cached
        .filter(p => Math.abs(p.price - currentFee) <= 3000)
        .slice(0, 1);

      // 캐시에 결과가 아직 없거나 매칭되는 요금제가 없을 때, 입력 가격 기준 임시 요금제 카드를 항상 노출하여 카드 뷰를 유지합니다.
      if (matched.length === 0) {
        const apiPlans = fetchInternetPlansFromApi(carrier, currentFee);
        matched = apiPlans.map(p => ({
          value: p.value,
          label: p.label,
          price: currentFee
        }));
      }

      return [
        ...matched.map(m => ({ value: m.value, label: m.label, next: "internet-contract-notice" })),
        { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "internet-current-plans-list" },
        { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "internet-custom-plan-input" },
      ];
    },
    next: "internet-contract-notice"
  },

  // [Part 1 - 3-1번] 🔄 입력 요금 기준 ±15,000원 범위 요금제 리스트 선택 스텝
  {
    id: "internet-current-plans-list",
    type: "single-choice",
    message: "입력하신 요금대와 비슷한 요금제 목록입니다. 현재 요금제를 선택해주세요.",
    answerKey: `${namespace}.confirmedPlanList`,
    options: [
      { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "internet-contract-notice" }
    ],
    optionsResolver: (answers) => {
      const carrier = answers[`internet.commonCarrier`] as string;
      const currentFee = answers[`internet.fee`] as number;
      
      prefetchPlans(carrier);
      const cached = planCache[carrier] || [];

      // 유저 입력 요금 기준 ±15,000원 이하 요금제들 필터링
      const matched = cached
        .filter(p => Math.abs(p.price - currentFee) <= 15000)
        .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));

      if (matched.length > 0) {
        return [
          ...matched.map(m => ({ value: m.value, label: m.label, next: "internet-contract-notice" })),
          { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "internet-contract-notice" }
        ];
      }

      return [
        { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "internet-contract-notice" }
      ];
    },
    next: "internet-contract-notice"
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
      { value: "no", label: "NO", next: "internet-completed-exit" },
    ],
  },

  // 등급 진단 결과 노출 스텝
  {
    id: "internet-grade-result",
    type: "result",
    message: "소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다.",
  },

  // 종료 완료 스텝
  {
    id: "internet-completed-exit",
    type: "result",
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