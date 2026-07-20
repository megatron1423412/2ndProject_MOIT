export const PHONE_MOCK_RESULT = {
  title: "휴대폰 요금제 mock 진단",
  summary: "최근 데이터 사용량과 약정 상태를 기준으로 중간 요금제 또는 알뜰폰 비교 여지를 확인했어요.",
  highlights: ["최근 3개월 평균 데이터로 요금제 구간 비교", "선택약정과 결합 할인 유지 여부 확인"],
  warnings: ["단말기 할부금과 위약금은 mock 절감액에 포함되지 않았어요."],
  recommendedActions: ["통신사 앱에서 최근 사용량 확인", "전환 전 위약금 조회"],
};

// 🔄 Part 1용 가짜 요금제 선택지 목록
export const MOCK_CURRENT_PLANS = [
  { value: "plan-mock-1", label: "선택하신 금액과 일치하는 요금제 A" },
  { value: "plan-mock-2", label: "비슷한 금액대 인기 요금제 B" },
  { value: "direct-select", label: "해당되는 요금제가 없음 (유사 리스트 보기)" },
  { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)" },
];

// 🚀 Part 2용 가짜 추천 요금제 목록
export const MOCK_RECOMMENDED_PLANS = [
  { value: "rec-mock-1", label: "[추천 1순위] 알뜰폰 5G 데이터 무제한 가성비 팩 (월 33,000원)" },
  { value: "rec-mock-2", label: "[추천 2순위] 메이저 통신사 맞춤 청년 요금제 (월 45,000원)" },
  { value: "direct-choose", label: "직접 고를래요 (리스트 보기)", next: "phone-all-plans-select" },
];

// 🌟 요금조회 API 연결용 함수 (API 키 연동 틀 설계)
export const fetchPlansFromApi = (carrier: string, currentFee: number) => {
  const carrierLabel = carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : "알뜰폰";
  const feeLabel = typeof currentFee === "number" ? currentFee.toLocaleString("ko-KR") : "0";

  let planName = `${carrierLabel} T플랜 에센스`;
  if (carrier === "kt") planName = `${carrierLabel} 데이터 ON 비디오`;
  if (carrier === "lgu") planName = `${carrierLabel} 추가 걱정 없는 데이터 69`;
  if (carrier === "mvno") planName = `${carrierLabel} 유심 데이터 11GB+`;

  return [
    { value: "plan-api-1", label: `${planName} (기본제공, 월 ${feeLabel}원)` },
  ];
};

export interface PlanSpec {
  carrier: string;
  name: string;
  price: number;
  ageLimit: string;
  signUpMethod: string;
  data: string;
  dataValueMB: number;
  hasQos: boolean;
  qosSpeed?: string;
  voice: string;
  voiceMin: number;
  sms: string;
  smsCount: number;
  link: string;
}

export const PLAN_SPECS_TABLE: Record<string, PlanSpec> = {
  "rec-mock-1": {
    carrier: "알뜰폰",
    name: "5G 데이터 무제한 가성비 팩",
    price: 33000,
    ageLimit: "만 19세 이상",
    signUpMethod: "온라인 전용",
    data: "무제한 (기본 15GB + 소진 시 1Mbps)",
    dataValueMB: 15360,
    hasQos: true,
    qosSpeed: "1Mbps",
    voice: "기본제공 (무제한)",
    voiceMin: 300,
    sms: "기본제공 (무제한)",
    smsCount: 100,
    link: "https://www.mvnohub.kr",
  },
  "rec-mock-2": {
    carrier: "KT",
    name: "맞춤 청년 요금제",
    price: 45000,
    ageLimit: "만 34세 이하 청년",
    signUpMethod: "온·오프라인 가능",
    data: "30GB (소진 시 400kbps)",
    dataValueMB: 30720,
    hasQos: true,
    qosSpeed: "400kbps",
    voice: "기본제공 (무제한)",
    voiceMin: 300,
    sms: "기본제공 (무제한)",
    smsCount: 100,
    link: "https://shop.kt.com",
  },
  "plan-mock-1": {
    carrier: "SKT",
    name: "선택하신 금액과 일치하는 요금제 A",
    price: 69000,
    ageLimit: "연령 제한 없음",
    signUpMethod: "온·오프라인 가능",
    data: "10GB (소진 시 1Mbps)",
    dataValueMB: 10240,
    hasQos: true,
    qosSpeed: "1Mbps",
    voice: "기본 제공",
    voiceMin: 200,
    sms: "기본 제공",
    smsCount: 50,
    link: "https://www.tworld.co.kr",
  },
  "plan-mock-2": {
    carrier: "SKT",
    name: "비슷한 금액대 인기 요금제 B",
    price: 59000,
    ageLimit: "연령 제한 없음",
    signUpMethod: "온·오프라인 가능",
    data: "8GB (QoS 없음)",
    dataValueMB: 8192,
    hasQos: false,
    voice: "기본 제공",
    voiceMin: 150,
    sms: "기본 제공",
    smsCount: 50,
    link: "https://www.tworld.co.kr",
  },
  "direct-select": {
    carrier: "메이저 3사",
    name: "일반 LTE/5G 요금제",
    price: 55000,
    ageLimit: "제한 없음",
    signUpMethod: "온·오프라인 가능",
    data: "6GB (QoS 없음)",
    dataValueMB: 6144,
    hasQos: false,
    voice: "기본 제공",
    voiceMin: 150,
    sms: "기본 제공",
    smsCount: 50,
    link: "https://www.tworld.co.kr",
  },
  "plan-api-1": {
    carrier: "SKT",
    name: "입력 금액대 매칭 요금제 A",
    price: 69000,
    ageLimit: "제한 없음",
    signUpMethod: "온·오프라인 가능",
    data: "무제한 (기본 15GB + 소진 시 1Mbps)",
    dataValueMB: 15360,
    hasQos: true,
    qosSpeed: "1Mbps",
    voice: "기본 제공 (무제한)",
    voiceMin: 300,
    sms: "기본 제공 (무제한)",
    smsCount: 100,
    link: "https://www.tworld.co.kr",
  },
  "plan-api-2": {
    carrier: "SKT",
    name: "입력 금액대 인기 요금제 B",
    price: 59000,
    ageLimit: "제한 없음",
    signUpMethod: "온·오프라인 가능",
    data: "30GB (소진 시 400kbps)",
    dataValueMB: 30720,
    hasQos: true,
    qosSpeed: "400kbps",
    voice: "기본 제공 (무제한)",
    voiceMin: 300,
    sms: "기본 제공 (무제한)",
    smsCount: 100,
    link: "https://www.tworld.co.kr",
  },
};

export const getPlanSpec = (
  planIdOrName: string,
  carrier: string = "통신사",
  currentFee: number = 0,
  dataVolume: string = "mid"
): PlanSpec => {
  if (PLAN_SPECS_TABLE[planIdOrName] && planIdOrName !== "plan-api-1") {
    return PLAN_SPECS_TABLE[planIdOrName];
  }

  const carrierLabel = carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : carrier === "mvno" ? "알뜰폰" : carrier;
  
  let dataStr = "15GB (소진 시 400kbps)";
  let dataMB = 15360;
  let qosSpeed = "400kbps";
  let hasQos = true;

  if (dataVolume === "unlimited") {
    dataStr = "무제한 (100GB + 5Mbps)";
    dataMB = 102400;
    qosSpeed = "5Mbps";
  } else if (dataVolume === "high") {
    dataStr = "75GB (소진 시 1Mbps)";
    dataMB = 76800;
    qosSpeed = "1Mbps";
  } else if (dataVolume === "low") {
    dataStr = "5GB (소진 시 400kbps)";
    dataMB = 5120;
    qosSpeed = "400kbps";
  }

  const priceVal = typeof currentFee === "number" ? currentFee : 0;
  let planName = planIdOrName && planIdOrName.trim() ? planIdOrName : `기존 요금제 (월 ${priceVal.toLocaleString()}원)`;
  if (planIdOrName === "plan-api-1") {
    planName = `${carrierLabel} T플랜 에센스`;
    if (carrier === "kt") planName = `${carrierLabel} 데이터 ON 비디오`;
    if (carrier === "lgu") planName = `${carrierLabel} 추가 걱정 없는 데이터 69`;
    if (carrier === "mvno") planName = `${carrierLabel} 유심 데이터 11GB+`;
  }

  let officialLink = "https://www.tworld.co.kr";
  if (carrierLabel === "KT") officialLink = "https://shop.kt.com";
  if (carrierLabel === "LGU+") officialLink = "https://www.lguplus.com";
  if (carrierLabel === "알뜰폰") officialLink = "https://www.mvnohub.kr";

  return {
    carrier: carrierLabel,
    name: planName,
    price: priceVal,
    ageLimit: "제한 없음",
    signUpMethod: "온·오프라인 가능",
    data: dataStr,
    dataValueMB: dataMB,
    hasQos,
    qosSpeed,
    voice: "기본 제공",
    voiceMin: 200,
    sms: "기본 제공",
    smsCount: 50,
    link: officialLink,
  };
};