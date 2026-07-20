// src/app/features/chat-flow/flows/telecom/bundle/mockData.ts

export const BUNDLE_MOCK_RESULT = {
  title: "결합상품 요금 비교·추천 솔루션",
  summary: "고객님의 조건에 맞춘 최적의 결합 상품 진단 결과입니다.",
  highlights: ["가족 결합 할인 재설계 가능성 확인", "인터넷·IPTV·이동전화 약정 및 고정비 비교"],
  warnings: ["기존 가입한 결합의 상세 약정 해지 대행금액은 통신사 고객센터를 통해 최종 재확인해 주세요."],
  recommendedActions: ["통신사 고객센터에 기존 결합 위약금 최종 확인", "추천 설계안으로 번호이동 및 신규 결합 가능 여부 타진"],
};

export interface BundlePlan {
  id: string;
  carrier: string;
  name: string;
  price: number;
  services: string[];
}

export const mockBundlePlans: BundlePlan[] = [
  // SK브로드밴드 (SK)
  {
    id: "bundle-sk-all",
    carrier: "SK",
    name: "[더미] SK 온가족할인 결합 패키지 (이동전화+인터넷+IPTV)",
    price: 55000,
    services: ["phone", "internet", "iptv"],
  },
  {
    id: "bundle-sk-dual",
    carrier: "SK",
    name: "[더미] SK 온가족 프리미엄 실속 결합 (이동전화+인터넷)",
    price: 44000,
    services: ["phone", "internet"],
  },
  {
    id: "bundle-sk-full",
    carrier: "SK",
    name: "[더미] SK 온가족 올인원 결합 (이동전화+인터넷+IPTV+집전화)",
    price: 62000,
    services: ["phone", "internet", "iptv", "home-phone"],
  },

  // KT올레 (KT)
  {
    id: "bundle-kt-all",
    carrier: "KT",
    name: "[더미] KT 총액 결합할인 패키지 (이동전화+인터넷+IPTV)",
    price: 58000,
    services: ["phone", "internet", "iptv"],
  },
  {
    id: "bundle-kt-dual",
    carrier: "KT",
    name: "[더미] KT 패밀리 안심 결합 (이동전화+인터넷)",
    price: 46200,
    services: ["phone", "internet"],
  },
  {
    id: "bundle-kt-full",
    carrier: "KT",
    name: "[더미] KT 홈 패키지 플러스 (이동전화+인터넷+IPTV+집전화)",
    price: 65000,
    services: ["phone", "internet", "iptv", "home-phone"],
  },

  // LG유플러스 (LGU)
  {
    id: "bundle-lgu-all",
    carrier: "LGU",
    name: "[더미] LGU+ 참 쉬운 가족 결합 패키지 (이동전화+인터넷+IPTV)",
    price: 54000,
    services: ["phone", "internet", "iptv"],
  },
  {
    id: "bundle-lgu-dual",
    carrier: "LGU",
    name: "[더미] LGU+ 와이파이 결합 (이동전화+인터넷)",
    price: 42900,
    services: ["phone", "internet"],
  },
  {
    id: "bundle-lgu-full",
    carrier: "LGU",
    name: "[더미] LGU+ 홈 투게더 결합 (이동전화+인터넷+IPTV+집전화)",
    price: 60500,
    services: ["phone", "internet", "iptv", "home-phone"],
  },

  // 스카이라이프/케이블 (SKYLIFE)
  {
    id: "bundle-skylife-all",
    carrier: "SKYLIFE",
    name: "[더미] 스카이라이프 홈 결합 패키지 (이동전화+인터넷+IPTV)",
    price: 38500,
    services: ["phone", "internet", "iptv"],
  },
  {
    id: "bundle-skylife-dual",
    carrier: "SKYLIFE",
    name: "[더미] 스카이라이프 실속 결합 (이동전화+인터넷)",
    price: 29700,
    services: ["phone", "internet"],
  },
  {
    id: "bundle-skylife-full",
    carrier: "SKYLIFE",
    name: "[더미] 스카이라이프 올인원 (이동전화+인터넷+IPTV+집전화)",
    price: 44000,
    services: ["phone", "internet", "iptv", "home-phone"],
  },
  // 테스트용 시나리오 플랜 추가
  {
    id: "bundle-test-gold",
    carrier: "알뜰폰+최저가결합",
    name: "[더미] 모바일 알뜰폰 + 인터넷/TV 최저가 결합",
    price: 55000,
    services: ["phone", "internet", "iptv"],
  },
  {
    id: "bundle-test-silver",
    carrier: "알뜰가족결합",
    name: "[더미] 알뜰폰 가족 연계 전부 결합",
    price: 100000,
    services: ["phone", "internet", "iptv"],
  },
  {
    id: "bundle-test-bronze",
    carrier: "인터넷+TV저가결합",
    name: "[더미] 인터넷 + IPTV 저가 알뜰망 결합",
    price: 62000,
    services: ["phone", "internet", "iptv"],
  }
];

// 🔄 10번 질문: 결합 조건에 따른 추천 결합 요금제 API 매칭 함수
export const fetchBundlePlansFromApi = (carrier: string, currentFee: number) => {
  const carrierLabel = carrier === "SK" ? "SK브로드밴드" 
                     : carrier === "KT" ? "KT올레" 
                     : carrier === "LGU" ? "LG유플러스" 
                     : "스카이라이프";

  const feeLabel = typeof currentFee === "number" ? currentFee.toLocaleString("ko-KR") : "0";

  let planName = `[더미] ${carrierLabel} 온가족 결합상품`;
  if (currentFee >= 60000) {
    planName = `[더미] ${carrierLabel} 프리미엄 패밀리 결합`;
  } else if (currentFee < 40000) {
    planName = `[더미] ${carrierLabel} 실속 세이브 결합`;
  }

  return [
    { value: "bundle-api-1", label: `${planName} (기본제공, 월 ${feeLabel}원)` },
  ];
};
