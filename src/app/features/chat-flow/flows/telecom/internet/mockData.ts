export const INTERNET_MOCK_RESULT = {
  title: "인터넷 속도·요금 mock 진단",
  summary: "가구원과 동시 사용 기기, 업로드 패턴을 기준으로 현재 속도 유지 여부를 살펴봤어요.",
  highlights: ["동시 사용 기기 수를 속도 선택에 반영", "업무·게임은 공유기와 업로드 품질도 확인"],
  warnings: ["실제 체감 속도는 설치 주소와 공유기 환경에 따라 달라져요."],
  recommendedActions: ["유선 속도 측정", "약정 만료일과 재약정 혜택 확인"],
};
export const carrierUrlMap: Record<string, string> = {
  SK: "https://www.bworld.co.kr",
  KT: "https://www.kt.com",
  LGU: "https://www.lguplus.com",
  HELLOVISION: "https://www.lghellovision.net",
  KTSKY: "https://www.skylife.co.kr",
  SKYLIFE: "https://www.skylife.co.kr",
  KTHCN: "https://www.hcn.co.kr",
  DLIVE: "https://www.dlive.kr",
};


export interface InternetPlanData {
  id: string;
  name: string;
  speed: string;
  speedMbps: number;
  prices: {
    discount3y: number; // 3년 약정
    discount2y?: number; // 2년 약정
    discount1y?: number; // 1년 약정
    noDiscount?: number; // 무약정
    onlineDiscount?: number; // 온라인 단독 할인 요금 (LG Uplus)
    discount4y?: number; // 4년 약정 (KT)
    discount5y?: number; // 5년 약정 (KT)
  };
  regions?: Record<string, string[]>;
}

// 🏢 SK 인터넷 요금제 데이터베이스
export const SK_INTERNET_PLANS: InternetPlanData[] = [
  {
    id: "plan-internet-wifi-1g",
    name: "기가인터넷 와이파이",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 40700, discount2y: 50600, discount1y: 58300, noDiscount: 66000 }
  },
  {
    id: "plan-internet-wifi-500m",
    name: "기가라이트인터넷 와이파이",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 35200, discount2y: 45100, discount1y: 52800, noDiscount: 60500 }
  },
  {
    id: "plan-internet-wifi-100m",
    name: "광랜인터넷 와이파이",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 24200, discount2y: 36300, discount1y: 40700, noDiscount: 47300 }
  },
  {
    id: "plan-internet-share-1g",
    name: "기가 쉐어",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 42900, discount2y: 53900, discount1y: 62700, noDiscount: 71500 }
  },
  {
    id: "plan-internet-share-500m",
    name: "기가라이트 쉐어",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 37400, discount2y: 48400, discount1y: 57200, noDiscount: 66000 }
  },
  {
    id: "plan-internet-share-100m",
    name: "광랜 쉐어",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 26400, discount2y: 39600, discount1y: 45100, noDiscount: 52800 }
  },
  {
    id: "plan-internet-premium-2.5g",
    name: "기가프리미엄X2.5",
    speed: "최대 2.5Gbps",
    speedMbps: 2500,
    prices: { discount3y: 44000, discount2y: 55000, discount1y: 60500, noDiscount: 71500 }
  },
  {
    id: "plan-internet-premium-5g",
    name: "기가프리미엄X5",
    speed: "최대 5Gbps",
    speedMbps: 5000,
    prices: { discount3y: 55000, discount2y: 60500, discount1y: 66000, noDiscount: 77000 }
  },
  {
    id: "plan-internet-premium-10g",
    name: "기가프리미엄X10",
    speed: "최대 10Gbps",
    speedMbps: 10000,
    prices: { discount3y: 82500, discount2y: 88000, discount1y: 93500, noDiscount: 104500 }
  },
  {
    id: "plan-internet-basic-100m",
    name: "광랜인터넷",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 22000, discount2y: 29700, discount1y: 31900, noDiscount: 36300 }
  },
  {
    id: "plan-internet-basic-500m",
    name: "기가라이트 인터넷",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 33000, discount2y: 38500, discount1y: 44000, noDiscount: 49500 }
  },
  {
    id: "plan-internet-basic-1g",
    name: "기가인터넷",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 38500, discount2y: 44000, discount1y: 49500, noDiscount: 55000 }
  }
];

// 🏢 KT 인터넷 요금제 데이터베이스
export const KT_INTERNET_PLANS: InternetPlanData[] = [
  {
    id: "plan-kt-yogo-essence-wifi",
    name: "요고 인터넷 에센스 와이파이",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { noDiscount: 63800, discount1y: 37400, discount2y: 35200, discount3y: 33000, discount4y: 31900, discount5y: 30800 }
  },
  {
    id: "plan-kt-yogo-basic-wifi",
    name: "요고 인터넷 베이직 와이파이",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { noDiscount: 55000, discount1y: 30800, discount2y: 30140, discount3y: 29450, discount4y: 28710, discount5y: 27800 }
  },
  {
    id: "plan-kt-yogo-slim-wifi",
    name: "요고 인터넷 슬림 와이파이",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { noDiscount: 48400, discount1y: 24200, discount2y: 21780, discount3y: 19250, discount4y: 19030, discount5y: 18700 }
  },
  {
    id: "plan-kt-yogo-essence",
    name: "요고 인터넷 에센스",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { noDiscount: 55000, discount1y: 35200, discount2y: 34100, discount3y: 33000, discount4y: 31900, discount5y: 30800 }
  },
  {
    id: "plan-kt-yogo-basic",
    name: "요고 인터넷 베이직",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { noDiscount: 46200, discount1y: 28600, discount2y: 28490, discount3y: 28350, discount4y: 27610, discount5y: 26700 }
  },
  {
    id: "plan-kt-yogo-slim",
    name: "요고 인터넷 슬림",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { noDiscount: 39600, discount1y: 22000, discount2y: 20130, discount3y: 18150, discount4y: 17930, discount5y: 17600 }
  },
  {
    id: "plan-kt-total-premium",
    name: "토탈안심 인터넷 프리미엄",
    speed: "최대 2.5Gbps",
    speedMbps: 2500,
    prices: { noDiscount: 68200, discount1y: 60500, discount2y: 53900, discount3y: 47300 }
  },
  {
    id: "plan-kt-total-essence",
    name: "토탈안심 인터넷 에센스",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { noDiscount: 62700, discount1y: 55000, discount2y: 48400, discount3y: 41800 }
  },
  {
    id: "plan-kt-total-basic",
    name: "토탈안심 인터넷 베이직",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { noDiscount: 53900, discount1y: 47300, discount2y: 41800, discount3y: 36300 }
  },
  {
    id: "plan-kt-total-slim",
    name: "토탈안심 인터넷 슬림",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { noDiscount: 47300, discount1y: 40150, discount2y: 34100, discount3y: 25300 }
  },
  {
    id: "plan-kt-basic-essence",
    name: "인터넷 에센스",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { noDiscount: 55000, discount1y: 49500, discount2y: 44000, discount3y: 38500 }
  },
  {
    id: "plan-kt-basic-basic",
    name: "인터넷 베이직",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { noDiscount: 46200, discount1y: 41800, discount2y: 37400, discount3y: 33000 }
  },
  {
    id: "plan-kt-basic-slimplus",
    name: "인터넷 슬림플러스",
    speed: "최대 200Mbps",
    speedMbps: 200,
    prices: { noDiscount: 41800, discount1y: 38500, discount2y: 35200, discount3y: 30250 }
  },
  {
    id: "plan-kt-basic-slim",
    name: "인터넷 슬림",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { noDiscount: 39600, discount1y: 34650, discount2y: 29700, discount3y: 22000 }
  },
  {
    id: "plan-kt-wifi-premium",
    name: "인터넷 프리미엄 와이파이",
    speed: "최대 2.5Gbps",
    speedMbps: 2500,
    prices: { noDiscount: 70400, discount1y: 63250, discount2y: 56100, discount3y: 44000 }
  },
  {
    id: "plan-kt-wifi-essence",
    name: "인터넷 에센스 와이파이",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { noDiscount: 64900, discount1y: 57750, discount2y: 50600, discount3y: 39600 }
  },
  {
    id: "plan-kt-wifi-basic",
    name: "인터넷 베이직 와이파이",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { noDiscount: 56100, discount1y: 50050, discount2y: 44000, discount3y: 35200 }
  },
  {
    id: "plan-kt-wifi-slim",
    name: "인터넷 슬림 와이파이",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { noDiscount: 49500, discount1y: 42900, discount2y: 36300, discount3y: 24200 }
  },
  {
    id: "plan-kt-single-basic",
    name: "싱글 인터넷 베이직",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { noDiscount: 47300, discount1y: 41250, discount2y: 35200, discount3y: 26400 }
  }
];

// 🏢 LG Uplus 인터넷 요금제 데이터베이스
export const LGU_INTERNET_PLANS: InternetPlanData[] = [
  {
    id: "plan-lgu-wifi-basic-1g",
    name: "와이파이기본_기가안심 1G",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 38500, onlineDiscount: 36300, discount2y: 38500, discount1y: 38500, noDiscount: 38500 }
  },
  {
    id: "plan-lgu-wifi-basic-500m",
    name: "와이파이기본_기가슬림안심 500M",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 33000, onlineDiscount: 31350, discount2y: 33000, discount1y: 33000, noDiscount: 33000 }
  },
  {
    id: "plan-lgu-wifi-basic-200m",
    name: "와이파이기본_안심 200M",
    speed: "최대 200Mbps",
    speedMbps: 200,
    prices: { discount3y: 25300, onlineDiscount: 23900, discount2y: 25300, discount1y: 25300, noDiscount: 25300 }
  },
  {
    id: "plan-lgu-wifi-basic-100m",
    name: "와이파이기본_광랜안심 100M",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 22000, onlineDiscount: 20600, discount2y: 22000, discount1y: 22000, noDiscount: 22000 }
  },
  {
    id: "plan-lgu-premium-1g",
    name: "프리미엄 안심 보상 1G",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 45100, onlineDiscount: 42900, discount2y: 45100, discount1y: 45100, noDiscount: 45100 }
  },
  {
    id: "plan-lgu-premium-500m",
    name: "프리미엄 안심 보상 500M",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 39600, onlineDiscount: 37950, discount2y: 39600, discount1y: 39600, noDiscount: 39600 }
  },
  {
    id: "plan-lgu-premium-200m",
    name: "프리미엄 안심 보상 200M",
    speed: "최대 200Mbps",
    speedMbps: 200,
    prices: { discount3y: 30800, onlineDiscount: 29400, discount2y: 30800, discount1y: 30800, noDiscount: 30800 }
  },
  {
    id: "plan-lgu-premium-100m",
    name: "프리미엄 안심 보상 100M",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 27500, onlineDiscount: 26100, discount2y: 27500, discount1y: 27500, noDiscount: 27500 }
  },
  {
    id: "plan-lgu-premium-2.5g",
    name: "프리미엄 안심 보상 2.5G",
    speed: "최대 2.5Gbps",
    speedMbps: 2500,
    prices: { discount3y: 50600, onlineDiscount: 47850, discount2y: 50600, discount1y: 50600, noDiscount: 50600 }
  },
  {
    id: "plan-lgu-nugget-100m",
    name: "너겟 100M",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { noDiscount: 33000, discount1y: 19800, discount2y: 19800, discount3y: 19800 }
  },
  {
    id: "plan-lgu-nugget-500m",
    name: "너겟 500M",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { noDiscount: 46200, discount1y: 26400, discount2y: 26400, discount3y: 26400 }
  },
  {
    id: "plan-lgu-nugget-1g",
    name: "너겟 1G",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { noDiscount: 55000, discount1y: 33000, discount2y: 33000, discount3y: 33000 }
  },
  {
    id: "plan-lgu-nugget-wifi-100m",
    name: "너겟 와이파이기본 100M",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { noDiscount: 42900, discount1y: 24200, discount2y: 24200, discount3y: 24200 }
  },
  {
    id: "plan-lgu-nugget-wifi-500m",
    name: "너겟 와이파이기본 500M",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { noDiscount: 56100, discount1y: 30800, discount2y: 30800, discount3y: 30800 }
  },
  {
    id: "plan-lgu-nugget-wifi-1g",
    name: "너겟 와이파이기본 1G",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { noDiscount: 64900, discount1y: 37400, discount2y: 37400, discount3y: 37400 }
  }
];

// 🏢 LG 헬로비전 인터넷 요금제 데이터베이스
export const HELLOVISION_INTERNET_PLANS: InternetPlanData[] = [
  // 1. 일반 케이블 약정형
  {
    id: "plan-hel-cable-save-320m",
    name: "광랜 세이브 플러스(최대320Mb)",
    speed: "최대 320Mbps",
    speedMbps: 320,
    prices: { discount3y: 20350, discount2y: 26400, discount1y: 31900, noDiscount: 34100 }
  },
  {
    id: "plan-hel-cable-basic-100m",
    name: "광랜(최대100Mb)",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 18700, discount2y: 24200, discount1y: 29700, noDiscount: 32450 }
  },
  {
    id: "plan-hel-cable-plus-160m",
    name: "광랜 플러스(최대160Mb)",
    speed: "최대 160Mbps",
    speedMbps: 160,
    prices: { discount3y: 19800, discount2y: 25300, discount1y: 30800, noDiscount: 33000 }
  },
  {
    id: "plan-hel-cable-gig-1g",
    name: "기가인터넷(최대1Gb)",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 22330, discount2y: 28490, discount1y: 36630, noDiscount: 40700 }
  },
  // 2. WiFi / 안심케어형
  {
    id: "plan-hel-wifi-basic-1y-160m",
    name: "160M 초고속 인터넷 (1년 약정)",
    speed: "최대 160Mbps",
    speedMbps: 160,
    prices: { discount1y: 21670, discount3y: 18200, discount2y: 21670, noDiscount: 25060 }
  },
  {
    id: "plan-hel-wifi-care-160m",
    name: "160M 안심케어",
    speed: "최대 160Mbps",
    speedMbps: 160,
    prices: { discount3y: 21550, discount2y: 28360, discount1y: 28360, noDiscount: 28360 }
  },
  {
    id: "plan-hel-wifi-basic-160m",
    name: "160M WiFi6",
    speed: "최대 160Mbps",
    speedMbps: 160,
    prices: { discount3y: 18200, discount2y: 25060, discount1y: 25060, noDiscount: 25060 }
  },
  {
    id: "plan-hel-wifi-care-500m",
    name: "500M 안심케어",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 24500, discount2y: 31830, discount1y: 31830, noDiscount: 31830 }
  },
  {
    id: "plan-hel-wifi-basic-500m",
    name: "500M 기가라이트 WiFi",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 21200, discount2y: 28530, discount1y: 28530, noDiscount: 28530 }
  },
  {
    id: "plan-hel-wifi-only-500m",
    name: "500M WiFi 전용(무선)",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 17000, discount2y: 17000, discount1y: 17000, noDiscount: 17000 }
  },
  {
    id: "plan-hel-wifi-care-1g",
    name: "1G 안심케어",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 25500, discount2y: 33220, discount1y: 33220, noDiscount: 33220 }
  },
  {
    id: "plan-hel-wifi-basic-1g",
    name: "1G 기가인터넷",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 22200, discount2y: 29920, discount1y: 29920, noDiscount: 29920 }
  }
];

// 🏢 스카이라이프 인터넷 요금제 데이터베이스
export const SKYLIFE_INTERNET_PLANS: InternetPlanData[] = [
  {
    id: "plan-sky-basic-100m",
    name: "스카이 100M",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 16500, discount2y: 16500, discount1y: 16500, noDiscount: 16500 }
  },
  {
    id: "plan-sky-basic-200m",
    name: "스카이 200M",
    speed: "최대 200Mbps",
    speedMbps: 200,
    prices: { discount3y: 18700, discount2y: 18700, discount1y: 18700, noDiscount: 18700 }
  },
  {
    id: "plan-sky-basic-500m",
    name: "스카이 500M",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 22000, discount2y: 22000, discount1y: 22000, noDiscount: 22000 }
  },
  {
    id: "plan-sky-basic-1g",
    name: "스카이 1G",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 25300, discount2y: 25300, discount1y: 25300, noDiscount: 25300 }
  }
];

// 🏢 KT HCN 인터넷 요금제 데이터베이스
export const KTHCN_INTERNET_PLANS: InternetPlanData[] = [
  {
    id: "plan-kthcn-sky-100m",
    name: "sky 100M",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 23100, discount2y: 23100, discount1y: 23100, noDiscount: 23100 }
  },
  {
    id: "plan-kthcn-sky-200m",
    name: "sky 200M",
    speed: "최대 200Mbps",
    speedMbps: 200,
    prices: { discount3y: 25300, discount2y: 25300, discount1y: 25300, noDiscount: 25300 }
  },
  {
    id: "plan-kthcn-sky-500m",
    name: "sky 500M",
    speed: "최대 500Mbps",
    speedMbps: 500,
    prices: { discount3y: 30800, discount2y: 30800, discount1y: 30800, noDiscount: 30800 }
  },
  {
    id: "plan-kthcn-basic-100m",
    name: "kt HCN 100M",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 21450, discount2y: 21450, discount1y: 21450, noDiscount: 21450 }
  },
  {
    id: "plan-kthcn-basic-1g",
    name: "kt HCN 1G",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 29700, discount2y: 29700, discount1y: 29700, noDiscount: 29700 }
  }
];

// 🏢 딜라이브 인터넷 요금제 데이터베이스
export const DLIVE_INTERNET_PLANS: InternetPlanData[] = [
  {
    id: "plan-dlive-cable-save-320m",
    name: "광랜 세이브 플러스(최대320Mb)",
    speed: "최대 320Mbps",
    speedMbps: 320,
    prices: { discount3y: 20350, discount2y: 26400, discount1y: 31900, noDiscount: 34100 },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "plan-dlive-cable-basic-100m",
    name: "광랜(최대100Mb)",
    speed: "최대 100Mbps",
    speedMbps: 100,
    prices: { discount3y: 18700, discount2y: 24200, discount1y: 29700, noDiscount: 32450 },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "plan-dlive-cable-plus-160m",
    name: "광랜 플러스(최대160Mb)",
    speed: "최대 160Mbps",
    speedMbps: 160,
    prices: { discount3y: 19800, discount2y: 25300, discount1y: 30800, noDiscount: 33000 },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "plan-dlive-cable-gig-1g",
    name: "기가인터넷(최대1Gb)",
    speed: "최대 1Gbps",
    speedMbps: 1000,
    prices: { discount3y: 22330, discount2y: 28490, discount1y: 36630, noDiscount: 40700 },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  }
];

// 요금제 가격 정보 반환 헬퍼 (contractKey 매개변수를 통해 약정별로 정확한 금액 조회 가능)
export const getInternetPlanPrice = (planId: string, contractKey: string = "discount3y"): number => {
  const plan = SK_INTERNET_PLANS.find(p => p.id === planId) || 
               KT_INTERNET_PLANS.find(p => p.id === planId) || 
               LGU_INTERNET_PLANS.find(p => p.id === planId) ||
               HELLOVISION_INTERNET_PLANS.find(p => p.id === planId) ||
               SKYLIFE_INTERNET_PLANS.find(p => p.id === planId) ||
               KTHCN_INTERNET_PLANS.find(p => p.id === planId) ||
               DLIVE_INTERNET_PLANS.find(p => p.id === planId);
  if (!plan) return 33000; // 기본값 (500Mbps)
  
  const key = contractKey === "discount2y" ? "discount2y"
            : contractKey === "discount1y" ? "discount1y"
            : contractKey === "noDiscount" ? "noDiscount"
            : "discount3y";
            
  return plan.prices[key] ?? plan.prices.discount3y;
};

// 통신사에 맞춘 요금제 리스트 생성 (prefetchPlans 용)
export const getInternetPlansForCarrier = (carrier: string) => {
  const carrierLabel = carrier === "SK" ? "SK 브로드밴드" 
                     : carrier === "KT" ? "KT 올레" 
                     : carrier === "LGU" ? "LG 유플러스"
                     : carrier === "HELLOVISION" ? "LG 헬로비전"
                     : carrier === "KTSKY" ? "KT 스카이라이프"
                     : carrier === "KTHCN" ? "KT HCN"
                     : carrier === "SKYLIFE" ? "스카이라이프"
                     : carrier === "DLIVE" ? "딜라이브"
                     : carrier;

  const isKtGroup = carrier === "KT";
  const isLgGroup = carrier === "LGU";
  const isHelGroup = carrier === "HELLOVISION";
  const isSkyGroup = ["KTSKY", "SKYLIFE"].includes(carrier);
  const isHcnGroup = carrier === "KTHCN";
  const isDliveGroup = carrier === "DLIVE";

  const database = isKtGroup ? KT_INTERNET_PLANS 
                 : isLgGroup ? LGU_INTERNET_PLANS 
                 : isHelGroup ? HELLOVISION_INTERNET_PLANS
                 : isSkyGroup ? SKYLIFE_INTERNET_PLANS
                 : isHcnGroup ? KTHCN_INTERNET_PLANS
                 : isDliveGroup ? DLIVE_INTERNET_PLANS
                 : SK_INTERNET_PLANS;
  
  const groupLabel = isKtGroup ? "KT" : isLgGroup ? "LG" : isHelGroup ? "헬로비전" : isSkyGroup ? "스카이라이프" : isHcnGroup ? "KT HCN" : isDliveGroup ? "딜라이브" : "SK";

  return database.map(plan => ({
    value: plan.id,
    label: `[${groupLabel}] ${carrierLabel} ${plan.name} (${plan.speed}, 월 ${plan.prices.discount3y.toLocaleString("ko-KR")}원)`,
    price: plan.prices.discount3y
  }));
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
                     : carrier === "DLIVE" ? "딜라이브"
                     : carrier;
  
  const feeLabel = typeof currentFee === "number" ? currentFee.toLocaleString("ko-KR") : "0";

  const isKtGroup = carrier === "KT";
  const isLgGroup = carrier === "LGU";
  const isHelGroup = carrier === "HELLOVISION";
  const isSkyGroup = ["KTSKY", "SKYLIFE"].includes(carrier);
  const isHcnGroup = carrier === "KTHCN";
  const isDliveGroup = carrier === "DLIVE";

  const database = isKtGroup ? KT_INTERNET_PLANS 
                 : isLgGroup ? LGU_INTERNET_PLANS 
                 : isHelGroup ? HELLOVISION_INTERNET_PLANS
                 : isSkyGroup ? SKYLIFE_INTERNET_PLANS
                 : isHcnGroup ? KTHCN_INTERNET_PLANS
                 : isDliveGroup ? DLIVE_INTERNET_PLANS
                 : SK_INTERNET_PLANS;
  
  const groupLabel = isKtGroup ? "KT" : isLgGroup ? "LG" : isHelGroup ? "헬로비전" : isSkyGroup ? "스카이라이프" : isHcnGroup ? "KT HCN" : isDliveGroup ? "딜라이브" : "SK";

  // 입력 요금과 가장 비슷한 3년 약정 요금제 찾기
  const sorted = [...database].sort((a, b) => 
    Math.abs(a.prices.discount3y - currentFee) - Math.abs(b.prices.discount3y - currentFee)
  );
  
  const bestPlan = sorted[0] || database[Math.min(database.length - 1, 10)];
  const planName = `[${groupLabel}] ${carrierLabel} ${bestPlan.name}`;

  return [
    { value: bestPlan.id, label: `${planName} (기본제공, 월 ${feeLabel}원)` },
  ];
};

const getAnswerValue = (answers: Record<string, any>, key: string): any => {
  if (key in answers) return answers[key];
  const parts = key.split(".");
  if (parts.length === 2) {
    const [ns, field] = parts;
    if (answers[ns] && typeof answers[ns] === "object") {
      return answers[ns][field];
    }
  }
  return undefined;
};

export const isPlanAvailableInRegion = (plan: InternetPlanData, answers: Record<string, any>): boolean => {
  if (!plan.regions) {
    return true; // 전국구 요금제
  }

  const regionLv1 = getAnswerValue(answers, "internet.regionLv1") as string;
  if (!regionLv1 || regionLv1 === "none") {
    return false;
  }

  let regionKey = regionLv1;
  let detailKey = "";

  // 1단계 선택에 따른 분기 처리 및 소분류 detailKey 결정
  if (regionLv1 === "seoul") {
    detailKey = "regionDetailSeoul";
  } else if (regionLv1 === "gyeonggi") {
    detailKey = "regionDetailGyeonggi";
  } else if (regionLv1 === "incheon") {
    detailKey = "regionDetailIncheon";
  } else if (regionLv1 === "gangwon") {
    detailKey = "regionDetailGangwon";
  } else if (regionLv1 === "jeju") {
    detailKey = "regionDetailJeju";
  } else if (regionLv1 === "gyeongsang") {
    const lv2 = (getAnswerValue(answers, "internet.regionLv2Gyeongsang") as string) || "";
    regionKey = lv2; // 대구, 부산, 울산, gyeongbuk, gyeongnam 등으로 맵 키 전환
    if (lv2 === "daegu") detailKey = "regionDetailDaegu";
    else if (lv2 === "busan") detailKey = "regionDetailBusan";
    else if (lv2 === "ulsan") detailKey = "regionDetailUlsan";
    else if (lv2 === "gyeongbuk") detailKey = "regionDetailGyeongbuk";
    else if (lv2 === "gyeongnam") detailKey = "regionDetailGyeongnam";
  } else if (regionLv1 === "chungcheong") {
    const lv2 = (getAnswerValue(answers, "internet.regionLv2Chungcheong") as string) || "";
    regionKey = lv2; // daejeon, sejong, chungbuk, chungnam 등으로 맵 키 전환
    if (lv2 === "daejeon") detailKey = "regionDetailDaejeon";
    else if (lv2 === "sejong") detailKey = "regionDetailSejong";
    else if (lv2 === "chungbuk") detailKey = "regionDetailChungbuk";
    else if (lv2 === "chungnam") detailKey = "regionDetailChungnam";
  } else if (regionLv1 === "jeolla") {
    const lv2 = (getAnswerValue(answers, "internet.regionLv2Jeolla") as string) || "";
    regionKey = lv2; // jeonbuk, jeonnam
    if (lv2 === "jeonbuk") detailKey = "regionDetailJeonbuk";
    else if (lv2 === "jeonnam") detailKey = "regionDetailJeonnam";
  }

  if (!regionKey || !detailKey) {
    return false;
  }

  const detail = getAnswerValue(answers, `internet.${detailKey}`) as string;
  if (!detail) {
    return false;
  }

  const districts = plan.regions[regionKey];
  if (!districts) {
    return false;
  }

  return districts.includes(detail);
};

// 동적 추천 요금제 리스트 생성 함수
export const getRecommendedInternetPlans = (carrier: string, desiredSpeed: string, contractKey: string, answers?: Record<string, any>) => {
  let speedVal = 500;
  const cleanSpeed = String(desiredSpeed).replace(/[^0-9]/g, "");
  if (cleanSpeed === "100" || cleanSpeed === "200") speedVal = 100;
  else if (cleanSpeed === "500") speedVal = 500;
  else if (cleanSpeed === "1" || cleanSpeed === "1000") speedVal = 1000;
  else if (cleanSpeed === "2" || cleanSpeed === "25" || cleanSpeed === "2500") speedVal = 2500;
  else if (cleanSpeed === "5" || cleanSpeed === "5000") speedVal = 5000;
  else if (cleanSpeed === "10" || cleanSpeed === "10000") speedVal = 10000;

  const carriers = ["SK", "KT", "LGU", "HELLOVISION", "KTSKY", "KTHCN", "SKYLIFE", "DLIVE"];
  
  const getCarrierDatabase = (c: string) => {
    switch (c) {
      case "KT": return KT_INTERNET_PLANS;
      case "LGU": return LGU_INTERNET_PLANS;
      case "HELLOVISION": return HELLOVISION_INTERNET_PLANS;
      case "KTSKY":
      case "SKYLIFE": return SKYLIFE_INTERNET_PLANS;
      case "KTHCN": return KTHCN_INTERNET_PLANS;
      case "DLIVE": return DLIVE_INTERNET_PLANS;
      default: return SK_INTERNET_PLANS;
    }
  };

  const getCarrierLabel = (c: string) => {
    switch (c) {
      case "SK": return "SK브로드밴드";
      case "KT": return "KT 올레";
      case "LGU": return "LG 유플러스";
      case "HELLOVISION": return "LG 헬로비전";
      case "KTSKY": return "KT 스카이라이프";
      case "KTHCN": return "KT HCN";
      case "SKYLIFE": return "스카이라이프";
      case "DLIVE": return "딜라이브";
      default: return c;
    }
  };

  const cheapestByCarrier: { plan: InternetPlanData; carrierCode: string; price: number }[] = [];
  const contract = (contractKey || "discount3y") as keyof InternetPlanData["prices"];

  carriers.forEach(c => {
    const database = getCarrierDatabase(c);
    let matchedPlans = database.filter(p => {
      if (speedVal === 100 && p.speedMbps <= 200) return true;
      if (speedVal === 500 && p.speedMbps > 200 && p.speedMbps <= 500) return true;
      if (speedVal === 1000 && p.speedMbps > 500 && p.speedMbps <= 1000) return true;
      if (speedVal === 2500 && p.speedMbps > 1000) return true;
      return false;
    });

    if (matchedPlans.length === 0) {
      matchedPlans = database.filter(p => p.speedMbps === 500);
    }

    if (answers) {
      matchedPlans = matchedPlans.filter(p => isPlanAvailableInRegion(p, answers));
    }

    let cheapestPlan: InternetPlanData | null = null;
    let cheapestPrice = Infinity;

    matchedPlans.forEach(plan => {
      const price = plan.prices[contract] ?? plan.prices.discount3y;
      if (price > 0 && price < cheapestPrice) {
        cheapestPrice = price;
        cheapestPlan = plan;
      }
    });

    if (cheapestPlan) {
      cheapestByCarrier.push({ plan: cheapestPlan, carrierCode: c, price: cheapestPrice });
    }
  });

  const majorList = cheapestByCarrier.filter(item => ["SK", "KT", "LGU"].includes(item.carrierCode));
  const mvnoList = cheapestByCarrier.filter(item => !["SK", "KT", "LGU"].includes(item.carrierCode));

  majorList.sort((a, b) => a.price - b.price);
  mvnoList.sort((a, b) => a.price - b.price);

  const selected: typeof cheapestByCarrier = [];
  
  // 3대 대형 통신사에서 최대 2개 선택
  const majorCount = Math.min(2, majorList.length);
  for (let i = 0; i < majorCount; i++) {
    selected.push(majorList[i]);
  }

  // 알뜰/케이블 통신사에서 최대 2개 선택
  const mvnoCount = Math.min(2, mvnoList.length);
  for (let i = 0; i < mvnoCount; i++) {
    selected.push(mvnoList[i]);
  }

  // 부족한 수량이 있다면 남은 것 중 저렴한 순으로 추가 채움
  if (selected.length < 4) {
    const remainingMajor = majorList.slice(majorCount);
    const remainingMvno = mvnoList.slice(mvnoCount);
    const combinedRemaining = [...remainingMajor, ...remainingMvno].sort((a, b) => a.price - b.price);
    const need = 4 - selected.length;
    for (let i = 0; i < Math.min(need, combinedRemaining.length); i++) {
      selected.push(combinedRemaining[i]);
    }
  }

  // 가격이 저렴한 순서로 표시되도록 정렬
  selected.sort((a, b) => a.price - b.price);

  const contractLabel = contractKey === "discount2y" ? "2년 약정"
                      : contractKey === "discount1y" ? "1년 약정"
                      : contractKey === "noDiscount" ? "무약정"
                      : "3년 약정";

  // 최종 추천 4종 리스트 매핑
  return selected.map((item, index) => {
    const carrierLabel = getCarrierLabel(item.carrierCode);
    return {
      value: item.plan.id,
      label: `[추천 ${index + 1}순위] [${carrierLabel}] ${item.plan.name} (${item.plan.speed}, ${contractLabel} 월 ${item.price.toLocaleString("ko-KR")}원)`,
    };
  });
};

// 추천 요금제 리스트 기본값 (하드코딩 호환용)
export const MOCK_RECOMMENDED_INTERNET_PLANS = [
  { value: "plan-internet-basic-500m", label: "[추천 1순위] [SK] 기가라이트 인터넷 (최대 500Mbps, 3년 약정 월 33,000원)" },
  { value: "plan-internet-basic-1g", label: "[추천 2순위] [SK] 기가인터넷 (최대 1Gbps, 3년 약정 월 38,500원)" },
];

// 직접 선택 요금제 리스트 기본값 (하드코딩 호환용)
export const MOCK_ALL_INTERNET_PLANS = [
  ...SK_INTERNET_PLANS.map(plan => ({
    value: plan.id,
    label: `[SK] SK 브로드밴드 ${plan.name} (${plan.speed}, 월 ${plan.prices.discount3y.toLocaleString("ko-KR")}원)`
  })),
  ...KT_INTERNET_PLANS.map(plan => ({
    value: plan.id,
    label: `[KT] KT 올레 ${plan.name} (${plan.speed}, 월 ${plan.prices.discount3y.toLocaleString("ko-KR")}원)`
  })),
  ...LGU_INTERNET_PLANS.map(plan => ({
    value: plan.id,
    label: `[LG] LG 유플러스 ${plan.name} (${plan.speed}, 월 ${plan.prices.discount3y.toLocaleString("ko-KR")}원)`
  })),
  ...HELLOVISION_INTERNET_PLANS.map(plan => ({
    value: plan.id,
    label: `[헬로비전] LG 헬로비전 ${plan.name} (${plan.speed}, 월 ${plan.prices.discount3y.toLocaleString("ko-KR")}원)`
  })),
  ...SKYLIFE_INTERNET_PLANS.map(plan => ({
    value: plan.id,
    label: `[스카이라이프] 스카이라이프 ${plan.name} (${plan.speed}, 월 ${plan.prices.discount3y.toLocaleString("ko-KR")}원)`
  })),
  ...KTHCN_INTERNET_PLANS.map(plan => ({
    value: plan.id,
    label: `[KT HCN] KT HCN ${plan.name} (${plan.speed}, 월 ${plan.prices.discount3y.toLocaleString("ko-KR")}원)`
  })),
  ...DLIVE_INTERNET_PLANS.map(plan => ({
    value: plan.id,
    label: `[딜라이브] 딜라이브 ${plan.name} (${plan.speed}, 월 ${plan.prices.discount3y.toLocaleString("ko-KR")}원)`
  }))
];

export const getFilteredAllInternetPlans = (contractKey: string, answers: Record<string, any>) => {
  const carriers = ["SK", "KT", "LGU", "HELLOVISION", "KTSKY", "KTHCN", "SKYLIFE", "DLIVE"];
  
  const getCarrierDatabase = (c: string) => {
    switch (c) {
      case "KT": return KT_INTERNET_PLANS;
      case "LGU": return LGU_INTERNET_PLANS;
      case "HELLOVISION": return HELLOVISION_INTERNET_PLANS;
      case "KTSKY":
      case "SKYLIFE": return SKYLIFE_INTERNET_PLANS;
      case "KTHCN": return KTHCN_INTERNET_PLANS;
      case "DLIVE": return DLIVE_INTERNET_PLANS;
      default: return SK_INTERNET_PLANS;
    }
  };

  const getCarrierLabel = (c: string) => {
    switch (c) {
      case "SK": return "SK";
      case "KT": return "KT";
      case "LGU": return "LG";
      case "HELLOVISION": return "헬로비전";
      case "KTSKY": return "KT 스카이라이프";
      case "KTHCN": return "KT HCN";
      case "SKYLIFE": return "스카이라이프";
      case "DLIVE": return "딜라이브";
      default: return c;
    }
  };

  const getCarrierName = (c: string) => {
    switch (c) {
      case "SK": return "SK 브로드밴드";
      case "KT": return "KT 올레";
      case "LGU": return "LG 유플러스";
      case "HELLOVISION": return "LG 헬로비전";
      case "KTSKY": return "KT 스카이라이프";
      case "KTHCN": return "KT HCN";
      case "SKYLIFE": return "스카이라이프";
      case "DLIVE": return "딜라이브";
      default: return c;
    }
  };

  const resolved = [];
  for (const c of carriers) {
    const db = getCarrierDatabase(c);
    const filtered = db.filter(p => isPlanAvailableInRegion(p, answers));
    for (const plan of filtered) {
      const price = plan.prices[contractKey as keyof typeof plan.prices] ?? plan.prices.discount3y;
      resolved.push({
        value: plan.id,
        label: `[${getCarrierLabel(c)}] ${getCarrierName(c)} ${plan.name} (${plan.speed}, 월 ${price.toLocaleString("ko-KR")}원)`,
        price,
        next: "internet-result"
      });
    }
  }

  // 가격 기준 오름차순 정렬
  resolved.sort((a, b) => a.price - b.price);

  // 최대 15개로 제한
  const sliced = resolved.slice(0, 15);

  return sliced.map(item => ({
    value: item.value,
    label: item.label,
    next: item.next
  }));
};
