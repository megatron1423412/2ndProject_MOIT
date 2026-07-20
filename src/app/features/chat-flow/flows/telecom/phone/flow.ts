import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { MOCK_CURRENT_PLANS, MOCK_RECOMMENDED_PLANS, fetchPlansFromApi } from "./mockData";
import { fetchSmartChoicePhonePlans } from "../shared/telecomApi";

const namespace = "phone";

// ── 스마트초이스 실시간 요금제 백그라운드 캐싱 ────────────────
interface CachedPlan {
  value: string;
  label: string;
  price: number;
}

const planCache: Record<string, CachedPlan[]> = {};
const isFetching: Record<string, boolean> = {};

export function prefetchPlans(carrier: string) {
  if (planCache[carrier] || isFetching[carrier]) return;
  isFetching[carrier] = true;

  const carrierUpper = carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : "알뜰폰";

  // LTE와 5G 모두 받아와서 합칩니다.
  Promise.all([
    fetchSmartChoicePhonePlans({ voice: "999999", data: "20480", sms: "999999", age: "20", type: "6", dis: "24" }),
    fetchSmartChoicePhonePlans({ voice: "999999", data: "20480", sms: "999999", age: "20", type: "3", dis: "24" }),
  ]).then(([res5g, resLte]) => {
    const allPlans = [...(res5g.plans || []), ...(resLte.plans || [])];
    
    const filtered = allPlans.filter(p => {
      if (carrier === "mvno") {
        return p.telecom !== "SKT" && p.telecom !== "KT" && p.telecom !== "LGU+";
      }
      return p.telecom === carrierUpper;
    });

    // 중복 제거 및 매핑
    const seenNames = new Set<string>();
    const mapped: CachedPlan[] = [];
    filtered.forEach(p => {
      if (!seenNames.has(p.planName)) {
        seenNames.add(p.planName);
        mapped.push({
          value: `plan-api|${p.planName}`,
          label: `${p.planName} (월 ${p.monthlyFee.toLocaleString("ko-KR")}원)`,
          price: p.monthlyFee
        });
      }
    });

    planCache[carrier] = mapped;
    isFetching[carrier] = false;
  }).catch(() => {
    isFetching[carrier] = false;
  });
}

// 모듈 로드 시점에 모든 통신사 요금제 백그라운드 선독취 시작
try {
  prefetchPlans("skt");
  prefetchPlans("kt");
  prefetchPlans("lgu");
  prefetchPlans("mvno");
} catch (e) {
  console.error("Prefetch plans failed", e);
}

const opening: FlowStep[] = [
  { 
    id: "phone-intro", 
    type: "assistant-message", 
    message: "휴대폰 요금제 진단을 시작할게요. 현재 요금 조건부터 확인해볼게요.", 
    next: "phone-carrier" 
  },
  
  // [Part 1 - 1번] 통신사 선택
  {
    id: "phone-carrier",
    type: "single-choice",
    message: "현재 사용하는 통신사를 선택해주세요.",
    answerKey: `${namespace}.carrier`,
    options: [
      { value: "skt", label: "SKT" },
      { value: "kt", label: "KT" },
      { value: "lgu", label: "LGU+" },
      { value: "mvno", label: "알뜰폰(MVNO)" },
    ],
    next: "phone-plan-fee"
  },

  // [Part 1 - 2번] 현재 사용하는 요금제 금액 입력
  {
    id: "phone-plan-fee",
    type: "number-input",
    message: "현재 납부하는 요금액을 입력해주세요.",
    answerKey: `${namespace}.currentFee`,
    placeholder: "금액만 적어주세요.",
    min: 0,
    unit: "원",
    next: "phone-current-plan-api"
  },

  // [Part 1 - 3번] 🔄 요금조회 API 결과를 매칭하는 동적 스텝
  {
    id: "phone-current-plan-api",
    type: "single-choice", 
    message: "현재 사용하시는 요금제가 맞을까요?",
    answerKey: `${namespace}.confirmedPlan`,
    options: [
      { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "phone-current-plans-list" },
      { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "phone-custom-plan-input" },
    ],
    optionsResolver: (answers) => {
      const carrier = answers[`phone.carrier`] as string;
      const currentFee = answers[`phone.currentFee`] as number;
      
      prefetchPlans(carrier);

      const cached = planCache[carrier] || [];
      // 1순위 후보 (금액 차이 3,000원 이하 가장 가까운 요금제 하나만 추천)
      let matched = cached
        .filter(p => Math.abs(p.price - currentFee) <= 3000)
        .slice(0, 1);

      // 캐시에 결과가 아직 없거나 매칭되는 요금제가 없을 때, 입력 가격 기준 임시 요금제 카드를 항상 노출하여 카드 뷰를 유지합니다.
      if (matched.length === 0) {
        const apiPlans = fetchPlansFromApi(carrier, currentFee);
        matched = apiPlans.map(p => ({
          value: p.value,
          label: p.label,
          price: currentFee
        }));
      }

      return [
        ...matched.map(m => ({ value: m.value, label: m.label, next: "phone-contract-period" })),
        { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "phone-current-plans-list" },
        { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "phone-custom-plan-input" },
      ];
    },
    next: "phone-contract-period"
  },

  // [Part 1 - 3-1번] 🔄 입력 요금 기준 ±25,000원 범위 요금제 리스트 선택 스텝
  {
    id: "phone-current-plans-list",
    type: "single-choice",
    message: "입력하신 요금대와 비슷한 요금제 목록입니다. 현재 요금제를 선택해주세요.",
    answerKey: `${namespace}.confirmedPlanList`,
    options: [
      { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "phone-contract-period" }
    ],
    optionsResolver: (answers) => {
      const carrier = answers[`phone.carrier`] as string;
      const currentFee = answers[`phone.currentFee`] as number;
      const cached = planCache[carrier] || [];

      // 유저 입력 요금 기준 ±25,000원 이하 요금제들 필터링 (최대 4개 카드로 제한)
      const matched = cached
        .filter(p => Math.abs(p.price - currentFee) <= 25000)
        .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee))
        .slice(0, 4);

      if (matched.length > 0) {
        return [
          ...matched.map(m => ({ value: m.value, label: m.label, next: "phone-contract-period" })),
          { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "phone-contract-period" }
        ];
      }

      return [
        { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "phone-contract-period" }
      ];
    },
    next: "phone-contract-period"
  },

  // 직접 요금제명을 입력하는 분기 스텝
  {
    id: "phone-custom-plan-input",
    type: "text-input",
    message: "사용 중이신 요금제 이름을 입력해주세요.",
    answerKey: `${namespace}.customPlan`,
    placeholder: "예: 슬림 요금제",
    next: "phone-contract-period"
  },

  // 약정기간 질문 스텝
  {
    id: "phone-contract-period",
    type: "single-choice",
    message: " 약정 기간 진단 여부 확인",
    answerKey: `${namespace}.contractPeriod`,
    options: [
      { value: "expired", label: "가입한 지 3년 넘음 (또는 만료됨)" },
      { value: "remaining", label: "아직 약정 기간 남음" },
      { value: "unknown", label: "잘 모르겠음" },
    ],
    next: "phone-desired-network"
  }
];

const specific: FlowStep[] = [
  // [Part 2 - 4번] 원하는 데이터 종류
  {
    id: "phone-desired-network",
    type: "single-choice",
    message: "앞으로 이용하고 싶으신 희망 데이터 종류를 선택해주세요.",
    answerKey: `${namespace}.desiredNetwork`,
    options: [
      { value: "lte", label: "4G/LTE" },
      { value: "5g", label: "5G" },
      { value: "etc", label: "기타" },
    ],
    next: "phone-age-group"
  },

  // [Part 2 - 5번] 사용자의 연령대
  {
    id: "phone-age-group",
    type: "single-choice",
    message: "사용자의 연령대를 알려주세요.",
    answerKey: `${namespace}.ageGroup`,
    options: [
      { value: "normal", label: "일반(만 35~65세 이하)" },
      { value: "youth", label: "청년 (만 19~34세)" },
      { value: "senior", label: "시니어 (만 65세 이상)" },
      { value: "child", label: "어린이 (만 12세 이하)" },
      { value: "teen", label: "청소년 (만 13~18세)" },
    ],
    next: "phone-data-volume"
  },

  // [Part 2 - 6번] 데이터 사용량 조사
  {
    id: "phone-data-volume",
    type: "single-choice",
    message: "한 달 데이터 사용량을 알려주세요.",
    answerKey: `${namespace}.dataVolume`,
    options: [
      { value: "unlimited", label: "무제한 (헤비 유저)" },
      { value: "high", label: "50GB~100GB (일반 동영상 시청)" },
      { value: "mid", label: "10GB~30GB (출퇴근 웹서핑)" },
      { value: "low", label: "10GB 미만 (주로 와이파이 사용)" },
    ],
    next: "phone-discount-options"
  },

  // [Part 2 - 7번] 옵션 선택
  {
    id: "phone-discount-options",
    type: "multi-choice",
    message: "그 외에 현재 적용받고 있거나 해당되는 옵션을 알려주세요.",
    answerKey: `${namespace}.discountOption`,
    options: [
      { value: "select-discount", label: "선택약정 25% 할인 받는 중" },
      { value: "family-discount", label: "가족 결합 할인 중" },
      { value: "unknown", label: "잘 모르겠음" },
    ],
    minSelections: 1,
    next: "phone-recommendation-api"
  },

  // [Part 2 - 8번] 🚀 여기도 안전하게 single-choice 규격으로 연결
  {
    id: "phone-recommendation-api",
    type: "single-choice",
    message: "고객님의 조건을 분석하여 선정한 최적의 추천 요금제 리스트입니다.",
    answerKey: `${namespace}.selectedRecommendedPlan`,
    options: MOCK_RECOMMENDED_PLANS, // 외부에서 땡겨온 추천 mock 리스트 바인딩
    next: "phone-result"
  },

{
    id: "phone-all-plans-select",
    type: "single-choice",
    message: "추천 요금제 외에 선택 가능한 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요.",
    // 👇 여기 answerKey를 'manualSelectedPlan'으로 변경했습니다.
    answerKey: `${namespace}.manualSelectedPlan`,
    options: [
      { value: "rec-mock-1", label: "알뜰폰 5G 데이터 무제한 가성비 팩 (월 33,000원)", next: "phone-result" },
      { value: "rec-mock-2", label: "KT 맞춤 청년 요금제 (월 45,000원)", next: "phone-result" },
      { value: "plan-mock-1", label: "SKT 요금제 A (월 69,000원)", next: "phone-result" },
      { value: "plan-mock-2", label: "SKT 인기 요금제 B (월 59,000원)", next: "phone-result" },
      { value: "direct-select", label: "일반 LTE/5G 요금제 (월 55,000원)", next: "phone-result" }
    ],
    next: "phone-result"
  },

  { 
    id: "phone-result", 
    type: "result", 
    message: "모든 진단과 요금제 선택이 완료되었습니다! 상세 비교서 작성을 완료했어요.",
    next: "phone-ask-grade"
  },

  {
    id: "phone-ask-grade",
    type: "single-choice",
    message: "고객님의 요금 절감액을 분석하여 소비 패턴 등급을 진단받으시겠습니까?",
    answerKey: `${namespace}.askGrade`,
    options: [
      { value: "yes", label: "YES", next: "phone-grade-result" },
      { value: "no", label: "NO", next: "phone-completed-exit" }
    ]
  },

  {
    id: "phone-grade-result",
    type: "result",
    message: "소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다."
  },

  {
    id: "phone-completed-exit",
    type: "result"
  }
];

export const phoneFlow: FlowDefinition = {
  id: "phone-flow",
  subCategoryId: "phone",
  categoryId: "telecom",
  startStepId: "phone-intro",
  steps: composeFlow(opening, specific),
};