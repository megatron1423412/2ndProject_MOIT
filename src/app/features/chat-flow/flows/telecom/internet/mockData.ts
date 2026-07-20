export const INTERNET_MOCK_RESULT = {
  title: "인터넷 속도·요금 mock 진단",
  summary: "가구원과 동시 사용 기기, 업로드 패턴을 기준으로 현재 속도 유지 여부를 살펴봤어요.",
  highlights: ["동시 사용 기기 수를 속도 선택에 반영", "업무·게임은 공유기와 업로드 품질도 확인"],
  warnings: ["실제 체감 속도는 설치 주소와 공유기 환경에 따라 달라져요."],
  recommendedActions: ["유선 속도 측정", "약정 만료일과 재약정 혜택 확인"],
};

// 🚀 [Part 1 - 3번] 🔄 요금조회 API 연결용 함수 (API 키 및 Ollama 연동)
export const fetchInternetPlansFromApi = (carrier: string, currentFee: number) => {
  const apiKey = import.meta.env.VITE_INTERNET_API_KEY || "";
  const ollamaUrl = import.meta.env.VITE_OLLAMA_API_URL || "http://localhost:11434";
  const ollamaModel = import.meta.env.VITE_OLLAMA_MODEL || "gemma3:latest";

  console.log("[API LOG] Using API Key:", apiKey ? "LOADED" : "NOT_FOUND");
  console.log("[OLLAMA LOG] Using Ollama URL:", ollamaUrl, "Model:", ollamaModel);

  const carrierLabel = carrier === "SK" ? "SK 브로드밴드" 
                     : carrier === "KT" ? "KT 올레" 
                     : carrier === "LGU" ? "LG 유플러스"
                     : carrier === "HELLOVISION" ? "LG 헬로비전"
                     : carrier === "KTSKY" ? "KT 스카이라이프"
                     : carrier === "KTHCN" ? "KT HCN"
                     : carrier === "SKYLIFE" ? "스카이라이프"
                     : carrier;
  
  const feeLabel = typeof currentFee === "number" ? currentFee.toLocaleString("ko-KR") : "0";

  let planName = `[더미] ${carrierLabel} 광랜 (100Mbps)`;
  if (currentFee >= 38500) {
    planName = `[더미] ${carrierLabel} 기가 (1Gbps)`;
  } else if (currentFee >= 33000) {
    planName = `[더미] ${carrierLabel} 베이직 (500Mbps)`;
  }

  return [
    { value: "internet-api-1", label: `${planName} (기본제공, 월 ${feeLabel}원)` },
  ];
};

// 추천 요금제 리스트 (카드 형식으로 보여질 것)
export const MOCK_RECOMMENDED_INTERNET_PLANS = [
  { value: "rec-internet-1", label: "[추천 1순위] [더미] 초고속 500Mbps 실속형 홈팩 (월 33,000원)" },
  { value: "rec-internet-2", label: "[추천 2순위] [더미] 1Gbps 기가 와이파이 패키지 (월 38,500원)" },
];

// 직접 선택 요금제 리스트
export const MOCK_ALL_INTERNET_PLANS = [
  { value: "plan-internet-1", label: "[더미] 광랜 인터넷 100Mbps (월 22,000원)" },
  { value: "plan-internet-2", label: "[더미] 베이직 인터넷 500Mbps (월 33,000원)" },
  { value: "plan-internet-3", label: "[더미] 기가 인터넷 1Gbps (월 38,500원)" },
  { value: "plan-internet-4", label: "[더미] 프리미엄 인터넷 2.5Gbps (월 44,000원)" },
];
