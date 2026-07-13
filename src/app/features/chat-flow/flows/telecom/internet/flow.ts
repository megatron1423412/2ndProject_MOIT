import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";

const namespace = "internet";

// =================================================================
// [Part 1] 현재 사용자 정보 입력 파트
// =================================================================
const opening: FlowStep[] = [
  // 1번 질문: 통신사 선택
  {
    id: "internet-intro",
    type: "single-choice",
    layout: "inline",
    message: "인터넷 요금제 진단을 시작합니다. 먼저 현재 이용 중이거나 관심 있는 통신사를 선택해 주세요.",
    answerKey: `${namespace}.commonCarrier`,
    options: [
      { value: "SK", label: "SK브로드밴드" },
      { value: "KT", label: "KT올레" },
      { value: "LGU", label: "LG유플러스" },
      { value: "SKYLIFE", label: "스카이라이프/케이블" },
    ],
    next: "internet-fee", // 바로 요금 입력으로 연결
  },

  // 2번 질문: 현재 인터넷 요금 입력
  {
    id: "internet-fee",
    type: "number-input",
    message: "현재 납부하고 계신 인터넷 요금은 매달 얼마인가요?",
    answerKey: `${namespace}.fee`,
    placeholder: "예: 25000",
    min: 0,
    unit: "원",
    next: "internet-contract-notice",
  },

  // 3번 질문: 약정 기간 진단 공지
  {
    id: "internet-contract-notice",
    type: "assistant-message",
    message: "인터넷은 3년 약정이 끝나면 무조건 사은품을 받거나 재약정 할인을 받아야 돈이 모입니다.",
    next: "internet-contract-period",
  },

  // 4번 질문: 현재 약정 기간 선택
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
    next: "internet-usage", // Part 2의 5번 질문으로 연결
  },
];

// =================================================================
// [Part 2] 원하는 요금제 및 서비스 조건 선택 파트
// =================================================================
const specific: FlowStep[] = [
  // 5번 질문: 조건에 맞는 인터넷 요금제 선택
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

  // 🆕 5-1번 질문: 원하시는 약정 할인 기간 선택 (신규 추가)
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
    next: "internet-confirm",
  },

  // 6번 질문: 결과 보기 전 최종 확인
  {
    id: "internet-confirm",
    type: "confirmation",
    message: "현재 속도를 낮출 수 있는지 mock 결과를 볼까요?",
    answerKey: `${namespace}.confirmed`,
    confirmNext: "internet-grade-branch", // 등급 판별 분기점으로 이동
    cancelNext: "internet-grade-branch",
    confirmLabel: "진단 보기",
    cancelLabel: "현재 조건으로 보기",
  },

  // =================================================================
  // 예외적인 조건 및 분기점 (Branch) & 등급별 결과 항목
  // =================================================================
  
  // 🛠 분기점 ID: 등급 판별을 위한 핵심 분기점
  {
    id: "internet-grade-branch",
    type: "branch",
    conditions: [
      // 비추천 조건 필터링 (현재 요금이 너무 낮아 리스크가 큰 경우 등)
      { answerKey: `${namespace}.fee`, operator: "lt", value: 15000, next: "internet-result-not-recommended" },
      // 골드 등급 조건 (30% 이상 혹은 월 1.5만 원 이상 절감 가능 구간 예시)
      { answerKey: `${namespace}.fee`, operator: "gte", value: 50000, next: "internet-result-gold" },
      // 실버 등급 조건 (15% 이상 혹은 월 8천 원 이상 절감 가능 구간 예시)
      { answerKey: `${namespace}.fee`, operator: "gte", value: 30000, next: "internet-result-silver" },
      // 브론즈 등급 조건 (월 3천 원 이상 절감 가능 구간 예시)
      { answerKey: `${namespace}.fee`, operator: "gte", value: 15000, next: "internet-result-bronze" },
    ],
    defaultNext: "internet-result-not-recommended",
  },

  // 🏆 최종 진단 결과 도출 항목들
  { 
    id: "internet-result-gold", 
    type: "result", 
    message: "🥇 속도 적합성 OK + 월 15,000원 이상 절감 또는 30% 이상 절감 가능합니다.",
    resolvedKeys: [`${namespace}.commonCarrier`, `${namespace}.fee`, `${namespace}.contractPeriod`, `${namespace}.desiredSpeed`, `${namespace}.planContract`]
  },
  { 
    id: "internet-result-silver", 
    type: "result", 
    message: "🥈 속도 적합성 OK / 일부 주의 + 월 8,000원 이상 절감 또는 15% 이상 절감 가능합니다.",
    resolvedKeys: [`${namespace}.commonCarrier`, `${namespace}.fee`, `${namespace}.contractPeriod`, `${namespace}.desiredSpeed`, `${namespace}.planContract`]
  },
  { 
    id: "internet-result-bronze", 
    type: "result", 
    message: "🥉 월 3,000원 이상 절감하지만, 현재 환경 대비 약간의 속도 체감 손실 가능성이 있습니다.",
    resolvedKeys: [`${namespace}.commonCarrier`, `${namespace}.fee`, `${namespace}.contractPeriod`, `${namespace}.desiredSpeed`, `${namespace}.planContract`]
  },
  { 
    id: "internet-result-not-recommended", 
    type: "result", 
    message: "❌ 비용 절감액보다 속도 패널티가 크거나, 입력하신 사용 패턴상 200Mbps급 이하의 속도는 부족하여 기존 유지를 권장합니다.",
    resolvedKeys: [`${namespace}.commonCarrier`, `${namespace}.fee`, `${namespace}.contractPeriod`, `${namespace}.desiredSpeed`, `${namespace}.planContract`]
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