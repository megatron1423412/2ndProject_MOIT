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
  { value: "rec-mock-1", label: "[추천 1순위] [이야기모바일(SKT)] 5G 데이터 무제한 가성비 팩 · 월 33,000원 · 15GB · 5G" },
  { value: "rec-mock-2", label: "[추천 2순위] [KT] 맞춤 청년 요금제 · 월 45,000원 · 30GB · 5G" },
  { value: "direct-choose", label: "직접 고를래요 (리스트 보기)", next: "phone-all-plans-select" },
];

export const fetchPlansFromApi = (carrier: string, currentFee: number) => {
  if (carrier === "skt") {
    return [
      { value: "plan-api-skt-1", label: `[SKT] 5G 레귤러 · 월 69,000원 · 데이터 110GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 69000 },
      { value: "plan-api-skt-2", label: `[SKT] 5G 언택트 62 · 월 62,000원 · 데이터 200GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 62000 },
      { value: "plan-api-skt-3", label: `[SKT] 5G 레귤러플러스 · 월 79,000원 · 데이터 250GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 79000 },
      { value: "plan-api-skt-4", label: `[SKT] 5G 슬림 · 월 55,000원 · 데이터 11GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 55000 },
      { value: "plan-api-skt-5", label: `[SKT] T플랜 에센스 · 월 69,000원 · 데이터 100GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (LTE)`, price: 69000 },
      { value: "plan-api-skt-6", label: `[SKT] T플랜 안심4G · 월 50,000원 · 데이터 4GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (LTE)`, price: 50000 },
      { value: "plan-api-skt-7", label: `[SKT] 5G 맞춤 24GB · 월 59,000원 · 데이터 24GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 59000 },
      { value: "plan-api-skt-8", label: `[SKT] 5G 맞춤 54GB · 월 65,000원 · 데이터 54GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 65000 },
    ];
  }

  if (carrier === "kt") {
    return [
      { value: "plan-api-kt-1", label: `[KT] 5G 심플 110GB · 월 69,000원 · 데이터 110GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 69000 },
      { value: "plan-api-kt-2", label: `[KT] 5G 슬림 14GB · 월 55,000원 · 데이터 14GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 55000 },
      { value: "plan-api-kt-3", label: `[KT] 5G 베이직 무제한 · 월 80,000원 · 데이터 200GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 80000 },
      { value: "plan-api-kt-4", label: `[KT] LTE 데이터 ON 비디오 · 월 69,000원 · 데이터 100GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (LTE)`, price: 69000 },
      { value: "plan-api-kt-5", label: `[KT] LTE 데이터 ON 톡 · 월 49,000원 · 데이터 3GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (LTE)`, price: 49000 },
      { value: "plan-api-kt-6", label: `[KT] Y덤 5G 슬림 21GB · 월 55,000원 · 데이터 21GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 55000 },
      { value: "plan-api-kt-7", label: `[KT] 5G 세미 심플 50GB · 월 63,000원 · 데이터 50GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 63000 },
      { value: "plan-api-kt-8", label: `[KT] LTE Y베이직 30GB · 월 65,800원 · 데이터 30GB (소진 시 3Mbps) · 음성 무제한 · 문자 기본제공 (LTE)`, price: 65800 },
    ];
  }

  if (carrier === "lgu") {
    return [
      { value: "plan-api-lgu-1", label: `[LGU+] 5G 레귤러 · 월 63,000원 · 데이터 95GB (소진 시 3Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 63000 },
      { value: "plan-api-lgu-2", label: `[LGU+] 5G 라이트+ · 월 55,000원 · 데이터 12GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 55000 },
      { value: "plan-api-lgu-3", label: `[LGU+] 5G 프리미어 레귤러 · 월 95,000원 · 데이터 250GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 95000 },
      { value: "plan-api-lgu-4", label: `[LGU+] 추가 에센셜 150GB · 월 69,000원 · 데이터 150GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 69000 },
      { value: "plan-api-lgu-5", label: `[LGU+] LTE 추가 마음껏 69 · 월 69,000원 · 데이터 100GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (LTE)`, price: 69000 },
      { value: "plan-api-lgu-6", label: `[LGU+] LTE 데이터 33 · 월 33,000원 · 데이터 1.5GB (소진 시 400kbps) · 음성 무제한 · 문자 기본제공 (LTE)`, price: 33000 },
      { value: "plan-api-lgu-7", label: `[LGU+] 5G 심플+ 50GB · 월 61,000원 · 데이터 50GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 61000 },
      { value: "plan-api-lgu-8", label: `[LGU+] LTE 데이터 49 30GB · 월 49,000원 · 데이터 30GB (소진 시 1Mbps) · 음성 무제한 · 문자 기본제공 (LTE)`, price: 49000 },
    ];
  }

  return [
    { value: "plan-api-mvno-1", label: `[이야기모바일(SKT)] 이야기 5G 100GB · 월 38,200원 · 데이터 100GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 38200 },
    { value: "plan-api-mvno-2", label: `[티플러스(SKT)] 티플러스 5G 110GB · 월 42,000원 · 데이터 110GB (소진 시 5Mbps) · 음성 무제한 · 문자 기본제공 (5G)`, price: 42000 },
    { value: "plan-api-mvno-3", label: `[스노우맨(KT)] 스노우맨 LTE 30GB · 월 24,200원 · 데이터 30GB · 음성 300분 · 문자 100건 (LTE)`, price: 24200 },
    { value: "plan-api-mvno-4", label: `[이야기모바일(LGU+)] 이야기 LTE 15GB · 월 17,600원 · 데이터 15GB · 음성 100분 · 문자 100건 (LTE)`, price: 17600 },
    { value: "plan-api-mvno-5", label: `[KT스카이라이프] 5G 모두다 110GB · 월 38,000원 · 데이터 110GB · 음성 무제한 · 문자 기본제공 (5G)`, price: 38000 },
    { value: "plan-api-mvno-6", label: `[헬로모바일(LGU+)] 5G 슬림 12GB · 월 28,000원 · 데이터 12GB · 음성 무제한 · 문자 기본제공 (5G)`, price: 28000 },
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

  const cleanName = (planIdOrName || "")
    .replace(/^plan-api\|/, "")
    .replace(/^\[추천\s*\d+순위\]\s*/, "")
    .trim();

  // 메이저 3사 태그([SKT], [KT], [LGU+])가 있으면 MVNO 매칭을 건너뜀 (오탐 방지)
  const isMajorCarrierLabel = /^\[(SKT|KT|LGU\+)\]/.test(cleanName);

  const priceMatch = cleanName.match(/월\s*([\d,]+)원/);
  const parsedPrice = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) : (currentFee || 0);

  // 1. ALL_MVNO_PLAN_SPECS 데이터셋에서 정확한 요금제 명칭 및 가격 매칭 탐색
  const mvnoMatch = isMajorCarrierLabel ? undefined : (
    ALL_MVNO_PLAN_SPECS.find(p =>
      (cleanName.includes(p.name) || cleanName.includes(`[${p.mvnoCarrier}] ${p.name}`)) &&
      (parsedPrice === 0 || p.price === parsedPrice)
    ) ||
    ALL_MVNO_PLAN_SPECS.find(p =>
      cleanName.includes(p.name) || cleanName.includes(`[${p.mvnoCarrier}] ${p.name}`)
    )
  );

  if (mvnoMatch) {
    return {
      carrier: mvnoMatch.mvnoCarrier || mvnoMatch.carrier,
      name: mvnoMatch.name.startsWith("[") ? mvnoMatch.name : `[${mvnoMatch.mvnoCarrier}] ${mvnoMatch.name}`,
      price: mvnoMatch.price || parsedPrice || currentFee,
      ageLimit: mvnoMatch.ageLimit || "제한 없음",
      signUpMethod: mvnoMatch.signUpMethod || "온라인 전용",
      data: mvnoMatch.data,
      dataValueMB: mvnoMatch.dataValueMB,
      hasQos: mvnoMatch.hasQos,
      qosSpeed: mvnoMatch.qosSpeed,
      voice: mvnoMatch.voice,
      voiceMin: mvnoMatch.voiceMin,
      sms: mvnoMatch.sms,
      smsCount: mvnoMatch.smsCount,
      link: mvnoMatch.link || "https://www.mvnohub.kr",
    };
  }

  // 2. 전달된 라벨 문자열 자체에서 데이터/음성/문자/통신사/가격 정보 파싱
  const carrierMatch = cleanName.match(/\[(.*?)\]/);
  const carrierLabel = carrierMatch
    ? carrierMatch[1]
    : carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : carrier === "mvno" ? "알뜰폰" : carrier;

  // QoS 파싱
  let hasQos = false;
  let qosSpeed: string | undefined = undefined;
  const qosMatch = cleanName.match(/(\d+(?:Mbps|kbps))/i);
  if (qosMatch) {
    hasQos = true;
    qosSpeed = qosMatch[1];
  } else if (cleanName.includes("소진 시") || cleanName.includes("QoS")) {
    hasQos = true;
    qosSpeed = "1Mbps";
  }

  // 데이터 용량 파싱 (7GB, 6GB, 100GB, 110GB 등)
  let dataStr = "";
  let dataMB = 10240;

  const gbMatch = cleanName.match(/(\d+(?:\.\d+)?)\s*GB/i);
  const mbMatch = cleanName.match(/(\d+)\s*MB/i);

  if (cleanName.includes("무제한") || cleanName.includes("무한")) {
    dataMB = 102400;
    dataStr = qosSpeed ? `무제한 (소진 시 ${qosSpeed})` : "무제한";
  } else if (gbMatch) {
    const valGB = parseFloat(gbMatch[1]);
    dataMB = Math.round(valGB * 1024);
    if (qosSpeed) {
      dataStr = `${valGB}GB (소진 시 ${qosSpeed})`;
    } else {
      dataStr = `${valGB}GB`;
    }
  } else if (mbMatch) {
    dataMB = parseInt(mbMatch[1], 10);
    dataStr = `${dataMB}MB`;
  } else {
    const val = (dataVolume || "").toLowerCase();
    if (val === "unlimited" || val.includes("100gb") || val.includes("over")) {
      dataStr = "무제한 (100GB + 5Mbps)";
      dataMB = 102400;
    } else if (val === "high" || val.includes("50gb")) {
      dataStr = "75GB (소진 시 1Mbps)";
      dataMB = 76800;
    } else {
      dataStr = "15GB (소진 시 400kbps)";
      dataMB = 15360;
    }
  }

  // 음성 및 문자 제공량 파싱
  let voiceMin = 9999;
  let voiceStr = "기본제공 (무제한)";
  const voiceMatch = cleanName.match(/음성\s*(\d+)\s*분/) || cleanName.match(/(\d+)\s*분/);
  if (voiceMatch) {
    voiceMin = parseInt(voiceMatch[1], 10);
    voiceStr = `${voiceMin}분`;
  } else if (cleanName.includes("음성 무제한") || cleanName.includes("무제한") || cleanName.includes("기본제공") || cleanName.includes("기본 제공")) {
    voiceMin = 9999;
    voiceStr = "기본제공 (무제한)";
  }

  let smsCount = 9999;
  let smsStr = "기본제공 (무제한)";
  const smsMatch = cleanName.match(/문자\s*(\d+)\s*건/) || cleanName.match(/(\d+)\s*건/);
  if (smsMatch) {
    smsCount = parseInt(smsMatch[1], 10);
    smsStr = `${smsCount}건`;
  } else if (cleanName.includes("문자 기본제공") || cleanName.includes("기본제공") || cleanName.includes("기본 제공") || cleanName.includes("무제한")) {
    smsCount = 9999;
    smsStr = "기본제공 (무제한)";
  }

  let officialLink = "https://www.tworld.co.kr";
  if (carrierLabel.includes("KT")) officialLink = "https://shop.kt.com";
  if (carrierLabel.includes("LGU") || carrierLabel.includes("유플러스")) officialLink = "https://www.lguplus.com";
  if (carrierLabel.includes("알뜰") || carrierLabel.includes("이야기") || carrierLabel.includes("스카이")) officialLink = "https://www.mvnohub.kr";

  let displayName = cleanName;
  const parenMatch = cleanName.match(/\(([^)]+)\)$/);
  if (parenMatch) {
    displayName = parenMatch[1].replace(/\s*·\s*(LTE|5G|4G)\s*$/i, "").trim();
  } else {
    const parts = cleanName.replace(/\[.*?\]\s*/, "").split(/\s*·\s*/);
    displayName = parts[0] || cleanName;
  }

  return {
    carrier: carrierLabel,
    name: displayName.startsWith("[") ? displayName : `[${carrierLabel}] ${displayName}`,
    price: parsedPrice,
    ageLimit: "제한 없음",
    signUpMethod: "온·오프라인 가능",
    data: dataStr,
    dataValueMB: dataMB,
    hasQos,
    qosSpeed,
    voice: voiceStr,
    voiceMin,
    sms: smsStr,
    smsCount,
    link: officialLink,
  };
};

// =================================================================
// 📱 알뜰폰 요금제 데이터 타입 정의
// =================================================================
export interface MvnoPlanSpec extends PlanSpec {
  networkType: "LTE" | "5G";
  mvnoCarrier: "이야기모바일(SKT)" | "스카이라이프(KT)" | "헬로비전(U+)";
}


export const ALL_MVNO_PLAN_SPECS = [
  // =================================================================
  // 1. SKT (이야기모바일) - LTE
  // =================================================================
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(100분+10GB)", price: 8800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(100분+15GB)", price: 1100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "100분", voiceMin: 100, sms: "150건", smsCount: 150, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(300분+10GB)", price: 9900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "300분", voiceMin: 300, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(300분+15GB)", price: 13200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "300분", voiceMin: 300, sms: "150건", smsCount: 150, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(500분+10GB)", price: 13200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "500분", voiceMin: 500, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(1000분+10GB)", price: 14300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "1000분", voiceMin: 1000, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(100분+20GB)", price: 15400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "100분", voiceMin: 100, sms: "200건", smsCount: 200, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(300분+20GB)", price: 5900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "300분", voiceMin: 300, sms: "200건", smsCount: 200, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(500분+20GB)", price: 19800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "500분", voiceMin: 500, sms: "200건", smsCount: 200, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(1000분+20GB)", price: 23500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "1000분", voiceMin: 1000, sms: "200건", smsCount: 200, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(100분+30GB)", price: 9900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "30GB", dataValueMB: 30720, hasQos: false, voice: "100분", voiceMin: 100, sms: "300건", smsCount: 300, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(200분+10GB)", price: 8800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(200분+15GB)", price: 13200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "200분", voiceMin: 200, sms: "150건", smsCount: 150, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(200분+20GB)", price: 5500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "200분", voiceMin: 200, sms: "200건", smsCount: 200, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(200분+30GB)", price: 23500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "30GB", dataValueMB: 30720, hasQos: false, voice: "200분", voiceMin: 200, sms: "300건", smsCount: 300, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(300분+30GB)", price: 24200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "30GB", dataValueMB: 30720, hasQos: false, voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(500분+30GB)", price: 27500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "30GB", dataValueMB: 30720, hasQos: false, voice: "500분", voiceMin: 500, sms: "300건", smsCount: 300, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S(1000분+30GB)", price: 33000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "30GB", dataValueMB: 30720, hasQos: false, voice: "1000분", voiceMin: 1000, sms: "300건", smsCount: 300, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S 무한 10GB", price: 13000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S 무한 20GB", price: 18800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "함께이야기해S 무한 30GB", price: 25400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "30GB", dataValueMB: 30720, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "내맘대로S(200+10GB)", price: 11000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "200분", voiceMin: 200, sms: "200건", smsCount: 200, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "내맘대로S(300+10GB)", price: 14300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기(100분+10GB)", price: 20900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 라이트S 7GB+", price: 12000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 라이트S 100분 7GB+", price: 19800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 라이트S 100분 10GB+", price: 23100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 라이트S 100분 11GB+", price: 23650, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 1Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 라이트S 100분 15GB+", price: 26400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 1Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 라이트S 300분 15GB+", price: 29150, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 1Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "1Mbps", voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 라이트S 100분 20GB+", price: 30800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB (소진 시 1Mbps)", dataValueMB: 20480, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 스탠다드S 100분 15GB+", price: 17000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 스탠다드S 300분 15GB+", price: 18000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 무한 10GB+", price: 16000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 스탠다드S 11GB+ (매일 2GB)", price: 20000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 매일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기S 폰케어 71GB+", price: 20000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 매일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기S 피싱케어 71GB+", price: 20000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 매일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기S 라이프케어 71GB+", price: 20000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 매일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기S 쇼핑케어 71GB+", price: 20000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 매일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기 스페셜S 100GB+", price: 23000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기S 폰케어 100GB+", price: 23000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기S 피싱케어 100GB+", price: 23000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기S 라이프케어 100GB+", price: 23000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "LTE", name: "이야기S 쇼핑케어 100GB+", price: 23000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },

  // =================================================================
  // 2. SKT (이야기모바일) - 5G
  // =================================================================
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S (200분+3GB)", price: 6600, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "3GB", dataValueMB: 3072, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S (200분+6GB)", price: 8800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "6GB", dataValueMB: 6144, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S (200분+10GB)", price: 11000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S (200분+15GB)", price: 14900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S (200분+20GB)", price: 18700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S (500분+30GB)", price: 28600, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "30GB", dataValueMB: 30720, hasQos: false, voice: "500분", voiceMin: 500, sms: "200건", smsCount: 200, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S (500분+50GB)", price: 37400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "50GB", dataValueMB: 51200, hasQos: false, voice: "500분", voiceMin: 500, sms: "200건", smsCount: 200, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S 무한 10GB", price: 14300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S 무한 15GB", price: 18700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 함께이야기해S 무한 20GB", price: 19900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 6GB", price: 23500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "6GB", dataValueMB: 6144, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 8GB", price: 27000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "8GB", dataValueMB: 8192, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 11GB", price: 31500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB", dataValueMB: 11264, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 15GB", price: 34500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 24GB", price: 37400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "24GB", dataValueMB: 24576, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 37GB", price: 38500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "37GB", dataValueMB: 37888, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 54GB", price: 39600, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "54GB", dataValueMB: 55296, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 74GB", price: 40700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "74GB", dataValueMB: 75776, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 99GB", price: 41800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "99GB", dataValueMB: 101376, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 110GB", price: 44000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "110GB (소진 시 5Mbps)", dataValueMB: 112640, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "이야기모바일(SKT)", networkType: "5G", name: "5G 이야기 무한 200GB", price: 49800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "200GB (소진 시 5Mbps)", dataValueMB: 204800, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.eyagi.co.kr" },

  // =================================================================
  // 3. KT (스카이라이프) - LTE
  // =================================================================
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "안심 골드 4GB+", price: 9900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "4GB (소진 시 400kbps)", dataValueMB: 4096, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "골드 4.0GB+", price: 9900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "4GB (소진 시 400kbps)", dataValueMB: 4096, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "통화 충분 6.5GB", price: 10900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "6.5GB", dataValueMB: 6656, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "스쿨 4GB+", price: 10900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "4GB (소진 시 400kbps)", dataValueMB: 4096, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "SOS 스쿨 2GB+", price: 11100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "2GB (소진 시 400kbps)", dataValueMB: 2048, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 2.2GB+/100분", price: 11700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "2.2GB (소진 시 400kbps)", dataValueMB: 2252, hasQos: true, qosSpeed: "400kbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 2.5GB+", price: 11800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "2.5GB (소진 시 400kbps)", dataValueMB: 2560, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "SOS 안심 골드 4GB+", price: 12100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "4GB (소진 시 400kbps)", dataValueMB: 4096, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "SOS 스쿨 4GB+", price: 13100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "4GB (소진 시 400kbps)", dataValueMB: 4096, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 4.5GB+", price: 13200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "4.5GB (소진 시 400kbps)", dataValueMB: 4608, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "통화 충분 10GB", price: 13900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "골드 8.0GB+", price: 13900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "8GB (소진 시 1Mbps)", dataValueMB: 8192, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 5GB+/100분", price: 14300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "5GB (소진 시 1Mbps)", dataValueMB: 5120, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 6GB+", price: 14900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "6GB (소진 시 1Mbps)", dataValueMB: 6144, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "스쿨 8GB+", price: 14900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "8GB (소진 시 1Mbps)", dataValueMB: 8192, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(후후안심)", price: 16200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "스쿨 7GB+(밀리의 서재)", price: 16200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(모아진)", price: 16200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(밀리의서재)", price: 16300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(CU)", price: 16700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "통화 충분 15GB", price: 16900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(Pay_3000)", price: 17600, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 10GB+", price: 17900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(올리브영_5000)", price: 18500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(Pay_5000)", price: 18500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(다이소_5000)", price: 18500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 10GB+(모아진)", price: 18900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 7GB+(지니뮤직)", price: 19000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 10GB+(밀리의서재)", price: 19000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 10GB+(CU)", price: 19400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "통화 충분 20GB", price: 20100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 15GB+(후후안심)", price: 20900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 10GB+(올리브영_5000)", price: 21200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 10GB+(다이소_5000)", price: 21200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 10GB+(Pay_5000)", price: 21200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 15GB+(모아진)", price: 21400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 15GB+(밀리의서재)", price: 21500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 10GB+(지니뮤직)", price: 21700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 15GB+(CU)", price: 21900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 15GB+(올리브영_5000)", price: 23700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 15GB+(다이소_5000)", price: 23700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 15GB+(Pay_5000)", price: 23700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 15GB+(지니뮤직)", price: 24200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 15GB+/100분(CU)", price: 25300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 15GB+/100분(모아진)", price: 25300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 15GB+/100분", price: 25300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 15GB+/300분(CU)", price: 27500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 15GB+/300분", price: 27500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 15GB+/100분(Pay_5000)", price: 27800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 15GB+/100분(지니뮤직)", price: 28800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "데이터 충분 15GB+/100분(웨이브)", price: 29300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(후후안심)", price: 33000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(CU)", price: 33000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(모아진)", price: 33000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(밀리의서재)", price: 33100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(Pay_5000)", price: 35300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11.0GB+(지니뮤직)", price: 35800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(왓챠)", price: 35900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11.0GB+(기프티쇼)", price: 36000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(요기요)", price: 36300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(배달의민족)", price: 36300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(멜론뮤직)", price: 36300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(올리브영_5000)", price: 36300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(다이소_5000)", price: 36300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 11GB+(웨이브)", price: 36600, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB (소진 시 3Mbps)", dataValueMB: 11264, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 100GB+(CU)", price: 38200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 100GB+(모아진)", price: 38200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 100GB+(밀리의서재)", price: 38300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 일5GB+(왓챠)", price: 41100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "일 5GB (소진 시 5Mbps)", dataValueMB: 153600, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 100GB+(Pay_5000)", price: 41700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 100GB+(웨이브)", price: 41700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 100GB+(올리브영_5000)", price: 41700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 100GB+(다이소_5000)", price: 41700, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "LTE", name: "모두 충분 100GB+(지니뮤직)", price: 42200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },

  // =================================================================
  // 4. KT (스카이라이프) - 5G
  // =================================================================
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 슬림 10GB/200분", price: 10900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 통화 충분 6GB", price: 11900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "6GB", dataValueMB: 6144, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 통화 충분 10GB", price: 14900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 슬림 20GB/200분", price: 18900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 통화 충분 20GB", price: 25900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "20GB", dataValueMB: 20480, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 통화 충분 30GB", price: 29900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "30GB", dataValueMB: 30720, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 모두 충분 14GB+", price: 32000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "14GB (소진 시 1Mbps)", dataValueMB: 14336, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 모두 충분 50GB+", price: 37900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "50GB (소진 시 1Mbps)", dataValueMB: 51200, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 모두 충분 70GB+(밀리의서재)", price: 39100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "70GB (소진 시 1Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 모두 충분 70GB+", price: 39100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "70GB (소진 시 1Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 모두 충분 90GB+(밀리의서재)", price: 40300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "90GB (소진 시 1Mbps)", dataValueMB: 92160, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 모두 충분 90GB+", price: 40300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "90GB (소진 시 1Mbps)", dataValueMB: 92160, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 모두 충분 110GB+(밀리의서재)", price: 42900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "110GB (소진 시 5Mbps)", dataValueMB: 112640, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },
  { carrier: "알뜰폰", mvnoCarrier: "스카이라이프(KT)", networkType: "5G", name: "5G 모두 충분 200GB+(밀리의서재)", price: 49200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "200GB (소진 시 5Mbps)", dataValueMB: 204800, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://www.skylife.co.kr" },

  // =================================================================
  // 5. U+ (헬로비전) - LTE
  // =================================================================
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "The 착한 데이터 유심 11GB", price: 32990, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 7GB", price: 15900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 일5GB", price: 41390, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "일 5GB (소진 시 5Mbps)", dataValueMB: 153600, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 10GB", price: 21300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 7GB", price: 18330, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 11GB", price: 35730, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 1GB", price: 9900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "1GB (소진 시 1Mbps)", dataValueMB: 1024, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 15GB 100분", price: 31220, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 데이터 더주는 유심 7GB", price: 19800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 데이터 더주는 유심 11GB", price: 37330, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 데이터 더주는 유심 일5GB", price: 43050, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "일 5GB (소진 시 5Mbps)", dataValueMB: 153600, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 데이터 더주는 유심 10GB", price: 22900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "데이터 더주는 유심 7GB", price: 17400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "데이터 더주는 유심 11GB", price: 34930, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "데이터 더주는 유심 15GB 100분", price: 29900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 5GB", price: 19200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "5GB (소진 시 1Mbps)", dataValueMB: 5120, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 15GB", price: 23350, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 1Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 데이터 더주는 유심 15GB", price: 24800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 1Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 일5GB", price: 38990, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "일 5GB (소진 시 5Mbps)", dataValueMB: 153600, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 1GB 100분", price: 7900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "1GB (소진 시 1Mbps)", dataValueMB: 1024, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 유심 5GB 200분", price: 9900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "5GB", dataValueMB: 5120, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "슬림 안심 유심 2.5GB 200분", price: 10500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "2.5GB (소진 시 1Mbps)", dataValueMB: 2560, hasQos: true, qosSpeed: "1Mbps", voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 3GB 200분", price: 12500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "3GB (소진 시 400kbps)", dataValueMB: 3072, hasQos: true, qosSpeed: "400kbps", voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "슬림 안심 유심 2.5GB 250분", price: 13200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "2.5GB (소진 시 1Mbps)", dataValueMB: 2560, hasQos: true, qosSpeed: "1Mbps", voice: "250분", voiceMin: 250, sms: "250건", smsCount: 250, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 5GB 100분", price: 13500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "5GB (소진 시 1Mbps)", dataValueMB: 5120, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 5GB 200분", price: 13900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "5GB (소진 시 1Mbps)", dataValueMB: 5120, hasQos: true, qosSpeed: "1Mbps", voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 5GB", price: 14400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "5GB (소진 시 1Mbps)", dataValueMB: 5120, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 4.5GB", price: 15000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "4.5GB (소진 시 1Mbps)", dataValueMB: 4608, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 6GB 200분", price: 15200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "6GB (소진 시 1Mbps)", dataValueMB: 6144, hasQos: true, qosSpeed: "1Mbps", voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "안심보험 유심 5GB", price: 15400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "5GB (소진 시 1Mbps)", dataValueMB: 5120, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "The 착한 데이터 유심 9GB 3000분", price: 16900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "9GB", dataValueMB: 9216, hasQos: false, voice: "3000분", voiceMin: 3000, sms: "1000건", smsCount: 1000, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 6GB", price: 16900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "6GB (소진 시 1Mbps)", dataValueMB: 6144, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "안심보험 유심 7GB", price: 17300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 유심 4.5GB", price: 17900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "4.5GB (소진 시 1Mbps)", dataValueMB: 4608, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "현대홈쇼핑 유심 7GB", price: 18100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 10GB 100분", price: 18500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 10GB 200분", price: 18900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 10GB", price: 18900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "현대홈쇼핑 데이터 더주는 유심 7GB", price: 19600, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "7GB (소진 시 1Mbps)", dataValueMB: 7168, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "데이터 더주는 유심 10GB", price: 20500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB (소진 시 1Mbps)", dataValueMB: 10240, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 15GB", price: 20950, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 1Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "데이터 더주는 유심 15GB", price: 22400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 1Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 2.5GB", price: 25100, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "2.5GB (소진 시 400kbps)", dataValueMB: 2560, hasQos: true, qosSpeed: "400kbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 15GB 100분", price: 28820, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 15GB 180분", price: 30800, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "180분", voiceMin: 180, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "보편 안심 유심 15GB 300분", price: 31900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "쿠폰팩 데이터 더주는 유심 15GB 100분", price: 32300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 3Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "3Mbps", voice: "100분", voiceMin: 100, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "[혜택형] The 착한 데이터 유심 11GB", price: 32990, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "현대홈쇼핑 유심 11GB", price: 35190, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "11GB + 일 2GB (소진 시 3Mbps)", dataValueMB: 71680, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "DATA 걱정없는 유심 100GB", price: 38200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "[혜택형] DATA 걱정없는 유심 100GB", price: 38200, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "[혜택형] DATA 걱정없는 유심 일5GB", price: 38990, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "일 5GB (소진 시 5Mbps)", dataValueMB: 153600, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "현대홈쇼핑 유심 100GB", price: 40400, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "100GB (소진 시 5Mbps)", dataValueMB: 102400, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "LTE", name: "데이터 더주는 유심 일5GB", price: 40650, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "일 5GB (소진 시 5Mbps)", dataValueMB: 153600, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },

  // =================================================================
  // 6. U+ (헬로비전) - 5G
  // =================================================================
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 10GB 200분", price: 9900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "10GB", dataValueMB: 10240, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 통화 맘편히 6GB", price: 11950, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "6GB", dataValueMB: 6144, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 통화 맘편히 9GB", price: 14500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "9GB", dataValueMB: 9216, hasQos: false, voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 15GB 200분", price: 14900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "200분", voiceMin: 200, sms: "100건", smsCount: 100, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G유심 15GB 300분", price: 16900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB", dataValueMB: 15360, hasQos: false, voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 라이트 유심 15GB 300분", price: 19900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "15GB (소진 시 1Mbps)", dataValueMB: 15360, hasQos: true, qosSpeed: "1Mbps", voice: "300분", voiceMin: 300, sms: "300건", smsCount: 300, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 라이트 유심 12GB", price: 33900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "12GB (소진 시 1Mbps)", dataValueMB: 12288, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 라이트 유심 14GB", price: 36300, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "14GB (소진 시 1Mbps)", dataValueMB: 14336, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 중간요금제 50GB", price: 38500, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "50GB (소진 시 1Mbps)", dataValueMB: 51200, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 중간요금제 31GB", price: 39600, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "31GB (소진 시 1Mbps)", dataValueMB: 31744, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 중간요금제 80GB", price: 42680, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "80GB (소진 시 1Mbps)", dataValueMB: 81920, hasQos: true, qosSpeed: "1Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 중간요금제 125GB", price: 43000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "125GB (소진 시 5Mbps)", dataValueMB: 128000, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "[혜택형] 5G 유심 중간요금제 125GB", price: 43000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "125GB (소진 시 5Mbps)", dataValueMB: 128000, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "[혜택형] 5G 유심 중간요금제 95GB", price: 44000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "95GB (소진 시 3Mbps)", dataValueMB: 97280, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 유심 중간요금제 95GB", price: 44000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "95GB (소진 시 3Mbps)", dataValueMB: 97280, hasQos: true, qosSpeed: "3Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 스탠다드 유심 150GB", price: 49900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "150GB (소진 시 5Mbps)", dataValueMB: 153600, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "[혜택형] 5G 스탠다드 유심 150GB", price: 49900, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "150GB (소진 시 5Mbps)", dataValueMB: 153600, hasQos: true, qosSpeed: "5Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
  { carrier: "알뜰폰", mvnoCarrier: "헬로비전(U+)", networkType: "5G", name: "5G 스페셜 유심 180GB", price: 55000, ageLimit: "제한 없음", signUpMethod: "온라인 전용", data: "180GB (소진 시 10Mbps)", dataValueMB: 184320, hasQos: true, qosSpeed: "10Mbps", voice: "기본제공 (무제한)", voiceMin: 9999, sms: "기본제공 (무제한)", smsCount: 9999, link: "https://direct.lghellovision.net" },
];