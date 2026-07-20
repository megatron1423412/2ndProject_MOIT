// src/app/features/chat-flow/flows/telecom/bundle/flow.ts

import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { buildBundleResult } from "./result";

const namespace = "bundle";

// ──────────────────────────────────────────────
// 공통 컴포넌트 빌더 함수 (Common Component Builders)
// ──────────────────────────────────────────────

interface CarrierOption {
  value: string;
  label: string;
  next?: string;
}

function CarrierSelect(args: {
  id: string;
  message: string;
  answerKey: string;
  options: CarrierOption[];
  next?: string;
}): FlowStep {
  return {
    id: args.id,
    type: "single-choice",
    message: args.message,
    answerKey: args.answerKey,
    options: args.options,
    ...(args.next ? { next: args.next } : {}),
  };
}

function MonthlyFeeInput(args: {
  id: string;
  message: string;
  answerKey: string;
  placeholder?: string;
  next: string;
}): FlowStep {
  return {
    id: args.id,
    type: "number-input",
    message: args.message,
    answerKey: args.answerKey,
    placeholder: args.placeholder || "예: 55000",
    min: 0,
    unit: "원",
    next: args.next,
  };
}

function PlanCheckMethod(args: {
  id: string;
  message: string;
  answerKey: string;
  next: string;
}): FlowStep {
  return {
    id: args.id,
    type: "single-choice",
    message: args.message,
    answerKey: args.answerKey,
    options: [
      { value: "불러오기", label: "요금제 불러오기" },
      { value: "직접 선택", label: "직접 선택" },
      { value: "직접 입력", label: "직접 입력" },
    ],
    next: args.next,
  };
}

function ContractStatus(args: {
  id: string;
  message: string;
  answerKey: string;
  isMobile?: boolean;
  next: string;
  expiryNext?: string;
}): FlowStep {
  return {
    id: args.id,
    type: "single-choice",
    message: args.message,
    answerKey: args.answerKey,
    options: [
      {
        value: "만료",
        label: args.isMobile ? "가입한 지 3년 넘음 (또는 만료됨)" : "가입한 지 3년 넘음",
        next: args.expiryNext,
      },
      { value: "남음", label: "아직 약정 기간 남음" },
      { value: "모름", label: "잘 모르겠음" },
    ],
    next: args.next,
  };
}

function PenaltyQuestion(args: {
  id: string;
  message: string;
  answerKey: string;
  yesNext: string;
  noNext: string;
  isMobile?: boolean;
}): FlowStep {
  return {
    id: args.id,
    type: "single-choice",
    message: args.message,
    answerKey: args.answerKey,
    options: [
      { value: "yes", label: "알고 있습니다", next: args.yesNext },
      {
        value: "no",
        label: args.isMobile ? "잘 모르겠습니다 (건너뛰기)" : "잘 모르겠습니다",
        next: args.noNext,
      },
    ],
  };
}

function PenaltyInput(args: {
  id: string;
  message: string;
  answerKey: string;
  next: string;
}): FlowStep {
  return {
    id: args.id,
    type: "number-input",
    message: args.message,
    answerKey: args.answerKey,
    placeholder: "예: 100000",
    min: 0,
    unit: "원",
    next: args.next,
  };
}

// ──────────────────────────────────────────────
// 대분류 Flow 빌더 함수 (Major Flow Builders)
// ──────────────────────────────────────────────

function buildMobileFlow(args: {
  prefix: string;
  answerPrefix: string;
  nextForNoPenalty: string;
  nextForPenalty: string;
  skipMembers?: boolean;
}): FlowStep[] {
  const { prefix, answerPrefix, nextForNoPenalty, nextForPenalty, skipMembers } = args;

  const steps: FlowStep[] = [
    CarrierSelect({
      id: `${prefix}1`,
      message: "현재 사용 중인 모바일 통신사를 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Carrier`,
      options: [
        { value: "SKT", label: "SKT" },
        { value: "KT", label: "KT" },
        { value: "LG U+", label: "LG U+" },
        { value: "알뜰폰", label: "알뜰폰" },
      ],
      next: skipMembers ? `${prefix}2` : `${prefix}1_2`,
    }),
  ];

  if (!skipMembers) {
    steps.push({
      id: `${prefix}1_2`,
      type: "single-choice",
      message: "이동전화 결합 인원을 알려주세요",
      answerKey: `${namespace}.${answerPrefix}Members`,
      options: [
        { value: "1인", label: "1인" },
        { value: "2인", label: "2인" },
        { value: "3인", label: "3인" },
        { value: "4인", label: "4인" },
        { value: "5인 이상", label: "5인 이상" },
      ],
      next: `${prefix}2`,
    });
  }

  steps.push(
    MonthlyFeeInput({
      id: `${prefix}2`,
      message: "현재 모바일 요금으로 매달 내고 계신 실납부액을 입력해 주세요.",
      answerKey: `${namespace}.${answerPrefix}MobileFee`,
      placeholder: "예: 55000",
      next: `${prefix}3`,
    }),
    PlanCheckMethod({
      id: `${prefix}3`,
      message: "현재 이용 중인 요금제 확인 방식을 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}PlanCheck`,
      next: `${prefix}4`,
    }),
    {
      id: `${prefix}4`,
      type: "multi-choice",
      message: "현재 받고 계신 할인 옵션을 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Discount`,
      options: [
        { value: "선택약정", label: "선택약정 25% 할인 받는 중" },
        { value: "가족결합", label: "가족 결합 할인 중" },
        { value: "모름", label: "잘 모르겠음" },
      ],
      next: `${prefix}5`,
    },
    ContractStatus({
      id: `${prefix}5`,
      message: "현재 핸드폰 가입 약정 기간 상태가 어떻게 되시나요?",
      answerKey: `${namespace}.${answerPrefix}Contract`,
      isMobile: true,
      next: `${prefix}6`,
      expiryNext: nextForNoPenalty,
    }),
    PenaltyQuestion({
      id: `${prefix}6`,
      message: "현재 해지 시 발생하는 예상 위약금을 알고 계시나요?",
      answerKey: `${namespace}.${answerPrefix}KnowPenalty`,
      yesNext: `${prefix}7`,
      noNext: nextForNoPenalty,
      isMobile: true,
    }),
    PenaltyInput({
      id: `${prefix}7`,
      message: "알고 계신 예상 위약금 금액을 입력해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Penalty`,
      next: nextForPenalty,
    })
  );

  return steps;
}

function buildInternetFlow(args: {
  prefix: string;
  answerPrefix: string;
  isCombo: boolean;
  nextForNoPenalty: string;
  nextForPenalty: string;
}): FlowStep[] {
  const { prefix, answerPrefix, isCombo, nextForNoPenalty, nextForPenalty } = args;

  const carrierOptions = isCombo
    ? [
        { value: "SK브로드밴드(B tv)", label: "SK 브로드밴드(B tv)" },
        { value: "KT(지니 TV)", label: "KT(지니 TV)" },
        { value: "LG 유플러스(U+tv)", label: "LG 유플러스(U+tv)" },
        { value: "알뜰/지역케이블", label: "알뜰/지역케이블" },
      ]
    : [
        { value: "SK 브로드밴드", label: "SK 브로드밴드" },
        { value: "KT", label: "KT" },
        { value: "LG 유플러스", label: "LG 유플러스" },
        { value: "알뜰 인터넷", label: "알뜰 인터넷" },
      ];

  const carrierMessage = isCombo
    ? "현재 사용 중인 인터넷/TV 결합 통신사를 선택해 주세요."
    : "현재 사용 중인 인터넷 통신사를 선택해 주세요.";

  const feeMessage = isCombo
    ? "인터넷과 TV를 합쳐 매달 납부하시는 결합 실납부액을 입력해 주세요."
    : "인터넷 요금으로 매달 납부하시는 실납부액을 입력해 주세요.";

  const planCheckMessage = isCombo
    ? "결합 상품 요금제 확인 방식을 선택해 주세요."
    : "인터넷 요금제 확인 방식을 선택해 주세요.";

  const contractMessage = isCombo
    ? "인터넷/TV 결합 상품의 약정 기간 상태를 선택해 주세요."
    : "인터넷 상품의 약정 기간 상태를 선택해 주세요.";

  const penaltyMessage = isCombo
    ? "유선 상품 해지 시 발생하는 위약금 정보를 알고 계시나요?"
    : "인터넷 해지 시 발생하는 위약금 정보를 알고 계시나요?";

  const penaltyInputMessage = isCombo
    ? "유선 상품의 예상 위약금 금액을 입력해 주세요."
    : "인터넷의 예상 위약금 금액을 입력해 주세요.";

  return [
    CarrierSelect({
      id: `${prefix}1`,
      message: carrierMessage,
      answerKey: `${namespace}.${answerPrefix}Carrier`,
      options: carrierOptions,
      next: `${prefix}2`,
    }),
    MonthlyFeeInput({
      id: `${prefix}2`,
      message: feeMessage,
      answerKey: `${namespace}.${answerPrefix}Fee`,
      placeholder: isCombo ? "예: 35000" : "예: 25000",
      next: `${prefix}3`,
    }),
    PlanCheckMethod({
      id: `${prefix}3`,
      message: planCheckMessage,
      answerKey: `${namespace}.${answerPrefix}PlanCheck`,
      next: `${prefix}4`,
    }),
    ContractStatus({
      id: `${prefix}4`,
      message: contractMessage,
      answerKey: `${namespace}.${answerPrefix}Contract`,
      isMobile: false,
      next: `${prefix}5`,
      expiryNext: nextForNoPenalty,
    }),
    PenaltyQuestion({
      id: `${prefix}5`,
      message: penaltyMessage,
      answerKey: `${namespace}.${answerPrefix}KnowPenalty`,
      yesNext: `${prefix}6`,
      noNext: nextForNoPenalty,
      isMobile: false,
    }),
    PenaltyInput({
      id: `${prefix}6`,
      message: penaltyInputMessage,
      answerKey: `${namespace}.${answerPrefix}Penalty`,
      next: nextForPenalty,
    }),
  ];
}

function buildTvFlow(args: {
  prefix: string;
  answerPrefix: string;
  nextForNoPenalty: string;
  nextForPenalty: string;
}): FlowStep[] {
  const { prefix, answerPrefix, nextForNoPenalty, nextForPenalty } = args;

  return [
    CarrierSelect({
      id: `${prefix}1`,
      message: "현재 이용 중인 IPTV 통신사를 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Carrier`,
      options: [
        { value: "B tv", label: "B tv" },
        { value: "지니 TV", label: "지니 TV" },
        { value: "U+tv", label: "U+tv" },
        { value: "알뜰(지역케이블)", label: "알뜰(지역케이블)" },
      ],
      next: `${prefix}2`,
    }),
    MonthlyFeeInput({
      id: `${prefix}2`,
      message: "TV 상품 이용 요금으로 매달 납부하시는 금액을 입력해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Fee`,
      placeholder: "예: 15000",
      next: `${prefix}3`,
    }),
    PlanCheckMethod({
      id: `${prefix}3`,
      message: "TV 상품 요금제 확인 방식을 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}PlanCheck`,
      next: `${prefix}4`,
    }),
    ContractStatus({
      id: `${prefix}4`,
      message: "TV 상품의 약정 기간 상태를 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Contract`,
      isMobile: false,
      next: `${prefix}5`,
      expiryNext: nextForNoPenalty,
    }),
    PenaltyQuestion({
      id: `${prefix}5`,
      message: "TV 상품 해지 시 발생하는 위약금 정보를 알고 계시나요?",
      answerKey: `${namespace}.${answerPrefix}KnowPenalty`,
      yesNext: `${prefix}6`,
      noNext: nextForNoPenalty,
      isMobile: false,
    }),
    PenaltyInput({
      id: `${prefix}6`,
      message: "TV 상품의 예상 위약금 금액을 입력해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Penalty`,
      next: nextForPenalty,
    }),
  ];
}

// ──────────────────────────────────────────────
// 전체 Flow 구성 (Steps Definition)
// ──────────────────────────────────────────────

const steps: FlowStep[] = [
  // -------------------------------------------------------------
  // [Part 1] 현재 사용자 정보 입력 파트
  // -------------------------------------------------------------

  // 1번 질문 ID: Q_START
  {
    id: "Q_START",
    type: "single-choice",
    message: "결합상품의 통신사가 같나요?",
    answerKey: `${namespace}.startState`,
    options: [
      { value: "all_same", label: "전부 같아요", next: "Q_ALL_M1" },
      { value: "part_same", label: "일부만 같아요", next: "Q_PART_SELECT" },
      { value: "all_diff", label: "다 달라요", next: "Q_DIFF_START" },
      { value: "new_start", label: "새로 시작해요", next: "Q_NEW_SELECT" },
    ],
  },

  // 🟢 [전부 같아요 패스]
  ...buildMobileFlow({
    prefix: "Q_ALL_M",
    answerPrefix: "all",
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // 🟡 [일부만 같아요 패스]
  {
    id: "Q_PART_SELECT",
    type: "single-choice",
    message: "일부 결합 상품의 구체적인 형태를 선택해 주세요.",
    answerKey: `${namespace}.partSelect`,
    options: [
      { value: "pta", label: "모바일(개인) / 인터넷 + IPTV", next: "Q_PTA_M1" },
      { value: "ptc", label: "모바일(다인) / 인터넷 + IPTV", next: "Q_PTC_M1" },
      { value: "ptb", label: "모바일 + 인터넷", next: "Q_PTB_M1" },
    ],
  },

  // PTA 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTA_M",
    answerPrefix: "pta",
    nextForNoPenalty: "Q_PTA_I1",
    nextForPenalty: "Q_PTA_I1",
    skipMembers: true,
  }),

  // PTA 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTA_I",
    answerPrefix: "ptaCombo",
    isCombo: true,
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // PTB 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTB_M",
    answerPrefix: "ptb",
    nextForNoPenalty: "Q_PTB_I1",
    nextForPenalty: "Q_PTB_I1",
    skipMembers: true,
  }),

  // PTB 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTB_I",
    answerPrefix: "ptbCombo",
    isCombo: true,
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // PTC 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTC_M",
    answerPrefix: "ptc",
    nextForNoPenalty: "Q_PTC_I1",
    nextForPenalty: "Q_PTC_I1",
  }),

  // PTC 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTC_I",
    answerPrefix: "ptcCombo",
    isCombo: true,
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // 🔵 [다 달라요 패스]
  {
    id: "Q_DIFF_START",
    type: "multi-choice",
    message: "현재 개별적으로 사용 중인 서비스를 선택해주세요.",
    answerKey: `${namespace}.diffServices`,
    options: [
      { value: "phone", label: "모바일" },
      { value: "internet", label: "인터넷" },
      { value: "iptv", label: "IPTV" },
    ],
    next: "Q_DIFF_ROUTE_1",
  },
  {
    id: "Q_DIFF_ROUTE_1",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "phone", next: "Q_DIFF_M1" },
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "internet", next: "Q_DIFF_I1" },
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "iptv", next: "Q_DIFF_T1" },
    ],
    defaultNext: "Q_P2_1",
  },

  // 1-1. 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_DIFF_M",
    answerPrefix: "diff",
    nextForNoPenalty: "Q_DIFF_M_NEXT",
    nextForPenalty: "Q_DIFF_M_NEXT",
  }),
  {
    id: "Q_DIFF_M_NEXT",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "internet", next: "Q_DIFF_I1" },
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "iptv", next: "Q_DIFF_T1" },
    ],
    defaultNext: "Q_P2_1",
  },

  // 1-2. 인터넷 약정/위약금 수집 6단계
  ...buildInternetFlow({
    prefix: "Q_DIFF_I",
    answerPrefix: "diffInternet",
    isCombo: false,
    nextForNoPenalty: "Q_DIFF_I_NEXT",
    nextForPenalty: "Q_DIFF_I_NEXT",
  }),
  {
    id: "Q_DIFF_I_NEXT",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "iptv", next: "Q_DIFF_T1" },
    ],
    defaultNext: "Q_P2_1",
  },

  // 1-3. TV 약정/위약금 수집 6단계
  ...buildTvFlow({
    prefix: "Q_DIFF_T",
    answerPrefix: "diffTv",
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // ⚫ [새로 시작해요 패스]
  {
    id: "Q_NEW_SELECT",
    type: "single-choice",
    message: "세부 경로 선택",
    answerKey: `${namespace}.newSelect`,
    options: [
      { value: "new_mobile", label: "모바일 요금제도 새로 가입할래요 (신규가입/번호이동)", next: "Q_4A_M1" },
      { value: "keep_mobile", label: "모바일 요금제 유지 (결합 필요)", next: "Q_4B_M1" },
    ],
  },

  // 4-A 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_4A_M",
    answerPrefix: "newA",
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
    skipMembers: true,
  }),

  // 4-B 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_4B_M",
    answerPrefix: "newB",
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
    skipMembers: true,
  }),

  // -------------------------------------------------------------
  // [Part 2] 원하는 요금제 및 서비스 조건 선택 파트
  // -------------------------------------------------------------

  {
    id: "Q_P2_1",
    type: "multi-choice",
    message: "결합 상품 조합 형태 선택 (다중선택)",
    answerKey: `${namespace}.desiredProducts`,
    options: [
      { value: "phone", label: "이동전화" },
      { value: "internet", label: "인터넷" },
      { value: "iptv", label: "IPTV" },
    ],
    next: "Q_P2_2",
  },

  {
    id: "Q_P2_2",
    type: "single-choice",
    message: "가장 중요하게 생각하는 것은?\n[안내] 위약금 미입력 시 정확한 진단 어려움\n제일 저렴한 상품 중심으로 추천",
    answerKey: `${namespace}.desiredCompanyType`,
    options: [
      { value: "mvno", label: "고정 비용 최소화 추천 (알뜰폰/케이블 최저가 위주로 추천)" },
      { value: "mno", label: "품질 및 결합 혜택 우선 추천 (메이저 3사 결합 위주로 추천)" },
      { value: "any", label: "위약금 대비 실질 이득 추천 (위약금 내고 갈아타도 이득인지 비교)" },
    ],
    next: "Q_P2_3_ROUTE",
  },

  {
    id: "Q_P2_3_ROUTE",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.desiredProducts`, operator: "includes", value: "phone", next: "Q_P2_DATA" },
      { answerKey: `${namespace}.desiredProducts`, operator: "includes", value: "internet", next: "Q_P2_SPEED" },
    ],
    defaultNext: "Q_P2_4",
  },

  {
    id: "Q_P2_DATA",
    type: "single-choice",
    message: "원하시는 모바일 데이터 사용량 조사",
    answerKey: `${namespace}.desiredData`,
    options: [
      { value: "unlimited", label: "무제한 필요 (헤비 유저)" },
      { value: "50G-100G", label: "50GB ~ 100GB (일반 동영상 시청)" },
      { value: "10G-30G", label: "10GB ~ 30GB (출퇴근 웹서핑)" },
      { value: "under-10G", label: "10GB 미만 (주로 와이파이 사용)" },
    ],
    next: "Q_P2_MEMBERS",
  },

  {
    id: "Q_P2_MEMBERS",
    type: "single-choice",
    message: "이동전화 결합 인원을 알려주세요",
    answerKey: `${namespace}.desiredMembers`,
    options: [
      { value: "1인", label: "1인" },
      { value: "2인", label: "2인" },
      { value: "3인", label: "3인" },
      { value: "4인", label: "4인" },
      { value: "5인 이상", label: "5인 이상" },
    ],
    next: "Q_P2_MEMBERS_NEXT",
  },

  {
    id: "Q_P2_MEMBERS_NEXT",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.desiredProducts`, operator: "includes", value: "internet", next: "Q_P2_SPEED" },
    ],
    defaultNext: "Q_P2_4",
  },

  {
    id: "Q_P2_SPEED",
    type: "single-choice",
    message: "선호하시거나 원하시는 인터넷 속도 사양을 선택해 주세요.",
    answerKey: `${namespace}.desiredSpeed`,
    options: [
      { value: "~200Mbps", label: "~200Mbps(일상 실속)" },
      { value: "~1Gbps", label: "~1Gbps(초고속)" },
      { value: "~10Gbps", label: "~10Gbps(기업급)" },
    ],
    next: "Q_P2_4",
  },

  {
    id: "Q_P2_4",
    type: "assistant-message",
    message: "원하는 정보 입력 완료",
    next: "bundle-result",
  },

  {
    id: "bundle-result",
    type: "result",
    message: "입력하신 정보를 바탕으로 산출된 최적의 결합 상품 추천 리포트입니다.",
    next: "bundle-ask-grade",
  },

  // -------------------------------------------------------------
  // [Part 3] 소비 패턴 등급 진단
  // -------------------------------------------------------------
  {
    id: "bundle-ask-grade",
    type: "single-choice",
    message: "고객님의 요금 절감액을 분석하여 소비 패턴 등급을 진단받으시겠습니까?",
    answerKey: `${namespace}.askGrade`,
    options: [
      { value: "yes", label: "YES", next: "bundle-grade-result" },
      { value: "no", label: "NO", next: "bundle-completed-exit" },
    ],
    next: "bundle-completed-exit",
  },

  {
    id: "bundle-grade-result",
    type: "result",
    message: "소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다.",
  },

  {
    id: "bundle-completed-exit",
    type: "result",
  },
];

export const bundleFlow: FlowDefinition = {
  id: "bundle-flow",
  subCategoryId: "bundle",
  categoryId: "telecom",
  startStepId: "Q_START",
  steps: composeFlow(steps),
};
