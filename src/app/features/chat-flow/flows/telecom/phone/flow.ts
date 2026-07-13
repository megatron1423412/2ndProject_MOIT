import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
// 깔끔하게 데이터만 가져오기
import { MOCK_CURRENT_PLANS, MOCK_RECOMMENDED_PLANS, fetchPlansFromApi } from "./mockData";

const namespace = "phone";

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
      { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "phone-desired-network" },
      { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "phone-custom-plan-input" },
    ], // 정적 검증 통과 및 대체 버튼용 기본 옵션
    optionsResolver: (answers) => {
      const carrier = answers[`phone.carrier`] as string;
      const currentFee = answers[`phone.currentFee`] as number;
      const apiPlans = fetchPlansFromApi(carrier, currentFee);
      return [
        ...apiPlans,
        { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "phone-desired-network" },
        { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "phone-custom-plan-input" },
      ];
    },
    next: "phone-desired-network"
  },

  // 직접 요금제명을 입력하는 분기 스텝
  {
    id: "phone-custom-plan-input",
    type: "text-input",
    message: "사용 중이신 요금제 이름을 입력해주세요.",
    answerKey: `${namespace}.customPlan`,
    placeholder: "예: 슬림 요금제",
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
      { value: "device-installment", label: "기기값 할부 있음" },
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
      { value: "no", label: "NO", next: "phone-exit" }
    ]
  },

  {
    id: "phone-grade-result",
    type: "result",
    message: "소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다.",
    next: "phone-ask-share"
  },

  {
    id: "phone-ask-share",
    type: "single-choice",
    message: "진단받은 나의 소비 패턴 등급을 공유하시겠습니까?",
    answerKey: `${namespace}.askShare`,
    options: [
      { value: "yes", label: "YES", next: "phone-sns-redirect" },
      { value: "no", label: "NO", next: "phone-exit" }
    ]
  },

  {
    id: "phone-sns-redirect",
    type: "assistant-message",
    message: "인스타그램으로 이동합니다. [여기를 클릭하여 인스타그램에서 결과를 공유](https://instagram.com)해 주세요.",
    next: "phone-exit"
  },

  {
    id: "phone-exit",
    type: "single-choice",
    message: "새로운 주제로 시작하시겠습니까?",
    answerKey: `${namespace}.exitRestart`,
    options: [],
    optionsResolver: () => [
      { value: "restart", label: "예, 새로운 주제로 시작할래요", next: "phone-intro" },
      { value: "exit", label: "아니요, 대화를 종료할래요", next: "phone-completed-exit" }
    ],
    next: "phone-completed-exit"
  },

  {
    id: "phone-completed-exit",
    type: "result",
    message: "휴대폰 요금제 진단 서비스를 이용해 주셔서 감사합니다. 안전하게 대화가 종료되었습니다."
  }
];

export const phoneFlow: FlowDefinition = {
  id: "phone-flow",
  subCategoryId: "phone",
  categoryId: "telecom",
  startStepId: "phone-intro",
  steps: composeFlow(opening, specific),
};