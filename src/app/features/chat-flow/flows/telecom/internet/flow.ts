import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { fetchInternetPlansFromApi, MOCK_ALL_INTERNET_PLANS, MOCK_RECOMMENDED_INTERNET_PLANS, getInternetPlansForCarrier, getRecommendedInternetPlans, isPlanAvailableInRegion, getFilteredAllInternetPlans } from "./mockData";
import { regionDetailsMap } from "../iptv/mockData";

const namespace = "internet";

const generateRegionDetailSteps = (namespace: string, nextStepId: string): FlowStep[] => {
  const korRegionNames: Record<string, string> = {
    seoul: "서울", gyeonggi: "경기", incheon: "인천", daegu: "대구", busan: "부산",
    ulsan: "울산", gyeongbuk: "경북", gyeongnam: "경남", daejeon: "대전", sejong: "세종",
    chungbuk: "충북", chungnam: "충남", jeonbuk: "전북", jeonnam: "전남", gangwon: "강원", jeju: "제주"
  };

  return Object.entries(regionDetailsMap).map(([regionKey, districts]) => {
    const suffix = regionKey.charAt(0).toUpperCase() + regionKey.slice(1);
    const answerKey = `${namespace}.regionDetail${suffix}`;
    const korName = korRegionNames[regionKey] ?? regionKey;

    const sortedDistricts = [...districts].sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));

    return {
      id: `${namespace}-region-${regionKey}`,
      type: "single-choice",
      message: `${korName}의 상세 지역을 선택해주세요.`,
      answerKey,
      options: sortedDistricts.map(d => ({
        value: d.value,
        label: d.label,
        next: nextStepId,
      })),
    };
  });
};

// ── 인터넷 요금제 백그라운드 캐싱 ────────────────
interface CachedPlan {
  value: string;
  label: string;
  price: number;
}

const planCache: Record<string, CachedPlan[]> = {};

export function prefetchPlans(carrier: string) {
  if (planCache[carrier]) return;
  planCache[carrier] = getInternetPlansForCarrier(carrier);
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

  // [Part 1 - 1번] 통신사 선택 (1차 목록 4개)
  {
    id: "internet-carrier",
    type: "single-choice",
    layout: "inline",
    message: "현재 사용하는 인터넷 통신사를 선택해주세요.",
    answerKey: `${namespace}.commonCarrier`,
    options: [
      { value: "SK", label: "SK 브로드밴드", next: "internet-fee" },
      { value: "KT", label: "KT 올레", next: "internet-fee" },
      { value: "LGU", label: "LG 유플러스", next: "internet-fee" },
      { value: "cable", label: "케이블/지역인터넷", next: "internet-carrier-cable" },
    ],
    next: "internet-fee",
  },

  // [Part 1 - 1-1번] 케이블/지역인터넷 세부 선택 (2차 목록)
  {
    id: "internet-carrier-cable",
    type: "single-choice",
    layout: "inline",
    message: "사용 중이신 케이블/지역인터넷 통신사를 선택해주세요.",
    answerKey: `${namespace}.cableCarrier`,
    options: [
      { value: "DLIVE", label: "딜라이브", next: "internet-fee" },
      { value: "KTHCN", label: "KT HCN", next: "internet-fee" },
      { value: "HELLOVISION", label: "LG헬로비전", next: "internet-fee" },
      { value: "SKYLIFE", label: "스카이라이프", next: "internet-fee" },
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
      { value: "direct-choose", label: "직접 고를래요(리스트 보기)", next: "internet-current-plans-list" },
      { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "internet-custom-plan-input" },
    ],
    optionsResolver: (answers) => {
      const carrier = (answers[`internet.cableCarrier`] || answers[`internet.commonCarrier`]) as string;
      const currentFee = Number(answers[`internet.fee`] || 0);

      prefetchPlans(carrier);

      const cached = planCache[carrier] || [];
      // 1순위 후보 (통신사 및 입력 금액에 가장 근접한 요금제 매칭)
      let matched = [...cached]
        .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee))
        .slice(0, 1);

      // 캐시에 결과가 아직 없거나 매칭되는 요금제가 없을 때, 입력 가격 기준 임시 요금제 카드를 노출합니다.
      if (matched.length === 0) {
        const apiPlans = fetchInternetPlansFromApi(carrier, currentFee);
        matched = apiPlans.map(p => ({
          value: p.value,
          label: p.label,
          price: currentFee
        }));
      }

      return [
        ...matched.map(m => ({ value: m.value, label: m.label, next: "internet-contract-period" })),
        { value: "direct-choose", label: "직접 고를래요(리스트 보기)", next: "internet-current-plans-list" },
        { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "internet-custom-plan-input" },
      ];
    },
    next: "internet-contract-period"
  },

  // [Part 1 - 3-1번] 🔄 입력 요금 기준 근접 요금제 리스트 선택 스텝
  {
    id: "internet-current-plans-list",
    type: "single-choice",
    message: "입력하신 요금대와 비슷한 요금제 목록입니다. 현재 요금제를 선택해주세요.",
    answerKey: `${namespace}.confirmedPlanList`,
    options: [
      { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "internet-contract-period" }
    ],
    optionsResolver: (answers) => {
      const carrier = (answers[`internet.cableCarrier`] || answers[`internet.commonCarrier`]) as string;
      const currentFee = Number(answers[`internet.fee`] || 0);

      prefetchPlans(carrier);
      const cached = planCache[carrier] || [];

      // 유저 입력 요금 기준 가장 근접한 요금제 순 정렬 (최대 6개)
      const matched = [...cached]
        .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee))
        .slice(0, 6);

      if (matched.length > 0) {
        return [
          ...matched.map(m => ({ value: m.value, label: m.label, next: "internet-contract-period" })),
          { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "internet-contract-period" }
        ];
      }

      return [
        { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "internet-contract-period" }
      ];
    },
    next: "internet-contract-period"
  },

  // 직접 요금제명을 선택하는 분기 스텝
  {
    id: "internet-all-plans-select",
    type: "single-choice",
    message: "추천 요금제 외에 선택 가능한 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요.",
    answerKey: `${namespace}.manualSelectedPlan`,
    options: [],
    optionsResolver: (answers) => {
      const contractKey = answers["internet.planContract"] || "discount3y";
      return getFilteredAllInternetPlans(contractKey, answers);
    },
    next: "internet-result",
  },

  // 직접 요금제명을 입력하는 분기 스텝
  {
    id: "internet-custom-plan-input",
    type: "text-input",
    message: "사용 중이신 인터넷 요금제 이름을 입력해주세요.",
    answerKey: `${namespace}.customPlan`,
    placeholder: "예: 기가 인터넷 요금제",
    next: "internet-contract-period",
  },

  // [Part 1 - 5번] 현재 약정 기간 선택
  {
    id: "internet-contract-period",
    type: "single-choice",
    layout: "inline",
    message: "현재 인터넷 가입 약정기간 상태가 어떻게 되시나요?",
    answerKey: `${namespace}.contractPeriod`,
    options: [
      { value: "expired", label: "약정이 만료됨" },
      { value: "under2y", label: "약정 기간 남음" },
      { value: "unknown", label: "잘 모르겠음" },
    ],
    next: "internet-usage",
  },
];

// =================================================================
// [Part 2] 원하는 요금제 및 서비스 조건 선택 파트
// =================================================================
const specific: FlowStep[] = [
  // [Part 2 - 6번] 조건에 맞는 인터넷 속도 선택
  {
    id: "internet-usage",
    type: "single-choice",
    layout: "inline",
    message: "조건에 맞는 인터넷 속도를 선택해 주세요.",
    answerKey: `${namespace}.desiredSpeed`,
    options: [
      { value: "100Mbps", label: "100Mbps (웹서핑·유튜브)" },
      { value: "500Mbps", label: "500Mbps (고화질 영상·게임)" },
      { value: "1Gbps", label: "1Gbps (대용량 다운로드·방송)" },
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
    next: "internet-region-lv1",
  },

  {
    id: "internet-region-lv1",
    type: "single-choice",
    message: "사는 곳을 선택해주세요.",
    answerKey: `${namespace}.regionLv1`,
    options: [
      { value: "gangwon", label: "강원", next: "internet-region-gangwon" },
      { value: "gyeonggi", label: "경기", next: "internet-region-gyeonggi" },
      { value: "gyeongsang", label: "경상도", next: "internet-region-gyeongsang-lv2" },
      { value: "seoul", label: "서울", next: "internet-region-seoul" },
      { value: "incheon", label: "인천", next: "internet-region-incheon" },
      { value: "jeolla", label: "전라도", next: "internet-region-jeolla-lv2" },
      { value: "jeju", label: "제주", next: "internet-region-jeju" },
      { value: "chungcheong", label: "충청도", next: "internet-region-chungcheong-lv2" },
      { value: "none", label: "선택안함", next: "internet-recommendation-api" },
    ],
  },

  // 🔧 mockData 팩토리 함수를 이용한 동적 지역 디테일 Step 전개
  ...generateRegionDetailSteps(namespace, "internet-recommendation-api"),

  // 경상도 중분류
  {
    id: "internet-region-gyeongsang-lv2",
    type: "single-choice",
    message: "경상도의 세부 지역을 선택해주세요.",
    answerKey: `${namespace}.regionLv2Gyeongsang`,
    options: [
      { value: "gyeongnam", label: "경상남도", next: "internet-region-gyeongnam" },
      { value: "gyeongbuk", label: "경상북도", next: "internet-region-gyeongbuk" },
      { value: "daegu", label: "대구광역시", next: "internet-region-daegu" },
      { value: "busan", label: "부산광역시", next: "internet-region-busan" },
      { value: "ulsan", label: "울산광역시", next: "internet-region-ulsan" },
    ],
  },
  // 충청도 중분류
  {
    id: "internet-region-chungcheong-lv2",
    type: "single-choice",
    message: "충청도의 세부 지역을 선택해주세요.",
    answerKey: `${namespace}.regionLv2Chungcheong`,
    options: [
      { value: "daejeon", label: "대전광역시", next: "internet-region-daejeon" },
      { value: "sejong", label: "세종특별자치시", next: "internet-region-sejong" },
      { value: "chungnam", label: "충청남도", next: "internet-region-chungnam" },
      { value: "chungbuk", label: "충청북도", next: "internet-region-chungbuk" },
    ],
  },
  // 전라도 중분류
  {
    id: "internet-region-jeolla-lv2",
    type: "single-choice",
    message: "전라도의 세부 지역을 선택해주세요.",
    answerKey: `${namespace}.regionLv2Jeolla`,
    options: [
      { value: "jeonnam", label: "전라남도", next: "internet-region-jeonnam" },
      { value: "jeonbuk", label: "전라북도", next: "internet-region-jeonbuk" },
    ],
  },

  // [Part 2 - 8번] 🚀 요금 비교 추천 솔루션 요금제 선택 스텝
  {
    id: "internet-recommendation-api",
    type: "single-choice",
    message: "고객님의 조건을 분석하여 선정한 최적의 추천 요금제 리스트입니다.",
    answerKey: `${namespace}.selectedRecommendedPlan`,
    options: [
      ...MOCK_RECOMMENDED_INTERNET_PLANS,
      { value: "direct-choose", label: "직접 고를래요 (전체 리스트 보기)", next: "internet-all-plans-select" }
    ],
    optionsResolver: (answers) => {
      const carrier = answers["internet.cableCarrier"] || answers["internet.commonCarrier"] || "SK";
      const desiredSpeed = answers["internet.desiredSpeed"] || "500";
      const planContract = answers["internet.planContract"] || "discount3y";
      const recommendations = getRecommendedInternetPlans(carrier, desiredSpeed, planContract, answers);
      return [
        ...recommendations,
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