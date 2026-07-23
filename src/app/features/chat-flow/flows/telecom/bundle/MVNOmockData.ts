// src/app/features/chat-flow/flows/telecom/bundle/MVNOmockData.ts
// bundle/
// ├── mockData.ts      # 3사 결합 데이터
// └── MVNOmockData.ts  # 알뜰 결합 데이터



// ----------------------------------------------------
// 진단 결과 메타 데이터 (알뜰 결합 vs 이야기 3사 연동 결합)
// ----------------------------------------------------

// 1. [알뜰폰 + 알뜰인터넷/IPTV] 전용 (KT Skylife, LG 헬로비전)
export const MVNO_BUNDLE_MOCK_RESULT = {
  title: "알뜰 결합상품 요금 비교·추천 솔루션",
  summary: "고객님의 조건에 맞춘 최적의 [알뜰모바일 + 알뜰인터넷 + IPTV] 진단 결과입니다.",
  highlights: [
    "알뜰폰 전용 홈결합 추가 할인 적용",
    "이동전화 및 인터넷·IPTV 약정 기반 고정비 극대화 절감"
  ],
  warnings: ["기존 가입한 통신사의 상세 약정 해지 위약금은 각 고객센터를 통해 최종 재확인해 주세요."],
  recommendedActions: [
    "현재 이용 중인 통신사 위약금 조회",
    "추천 알뜰 결합 상품 가입 가능 여부(인터넷 설치 가능 지역) 확인"
  ],
};

// 2. [알뜰모바일 + 3사 인터넷/IPTV] 전용 (이야기 모바일)
export const EYAGI_BUNDLE_MOCK_RESULT = {
  title: "알뜰-3사 결합상품 요금 비교·추천 솔루션",
  summary: "고객님의 조건에 맞춘 최적의 [알뜰모바일 + 3사 (인터넷 + IPTV)] 진단 결과입니다.",
  highlights: [
    "이야기모바일 X 통신3사(SKT/LGU+) 동시 결합 할인 적용",
    "알뜰폰 요금제의 가성비와 3사 인터넷의 안정성을 동시에 확보"
  ],
  warnings: ["기존 가입한 통신사의 상세 약정 해지 위약금은 각 고객센터를 통해 최종 재확인해 주세요."],
  recommendedActions: [
    "현재 이용 중인 통신사 위약금 조회",
    "추천 알뜰 결합 상품 가입 가능 여부(인터넷 설치 가능 지역) 확인"
  ],
};


// ----------------------------------------------------
// 1. KT Skylife 전용 인터페이스 및 Mock 데이터
// ----------------------------------------------------

export interface MVNOMobilePlan {
  id: string;
  carrier: string;          // 통신사
  mobilePlanName: string;   // 모바일 요금제명
  price: number;            // 모바일 가격
  data: string;             // 데이터량 / 속도제어
  call: string;             // 전화
  sms: string;              // 문자
  mobileBenefits: string[]; // 추가 혜택
}

export interface MVNOHomeBundle {
  id: string;
  carrier: string;          // 통신사
  internetName: string;     // 인터넷 상품명
  internetSpeed: string;    // 인터넷 속도
  tvName: string;           // TV 상품명
  channels: number;         // 채널수
  bundleMonthlyFee: number; // 결합 월 납부액
  bundleBenefits: string[]; // 결합 혜택
}

export interface TotalBundleCombination {
  carrier: string;
  mobilePlanName: string;
  mobilePrice: number;
  data: string;
  call: string;
  sms: string;
  mobileBenefits: string[];
  internetName: string;
  internetSpeed: string;    // 인터넷 속도
  tvName: string;
  channels: number;
  bundleMonthlyFee: number;
  bundleBenefits: string[];
  totalMonthlyFee: number;
}

export const mockMvnoMobilePlans: MVNOMobilePlan[] = [
  { id: "sky-mob-01", carrier: "KT skylife", mobilePlanName: "안심 골드 4GB+", price: 9900, data: "4GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-02", carrier: "KT skylife", mobilePlanName: "골드 4.0GB+", price: 9900, data: "4GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-03", carrier: "KT skylife", mobilePlanName: "통화 충분 6.5GB", price: 10900, data: "6.5GB", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-04", carrier: "KT skylife", mobilePlanName: "스쿨 4GB+", price: 10900, data: "4GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-05", carrier: "KT skylife", mobilePlanName: "5G 슬림 10GB/200분", price: 10900, data: "10GB", call: "200분", sms: "100건", mobileBenefits: [] },
  { id: "sky-mob-06", carrier: "KT skylife", mobilePlanName: "SOS 스쿨 2GB+", price: 11100, data: "2GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-07", carrier: "KT skylife", mobilePlanName: "데이터 충분 2.2GB+/100분", price: 11700, data: "2.2GB+", call: "100분", sms: "100건", mobileBenefits: ["데이터쿠폰 20GB x 4회"] },
  { id: "sky-mob-08", carrier: "KT skylife", mobilePlanName: "모두 충분 2.5GB+", price: 11800, data: "2.5GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-09", carrier: "KT skylife", mobilePlanName: "5G 통화 충분 6GB", price: 11900, data: "6GB", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-10", carrier: "KT skylife", mobilePlanName: "SOS 안심 골드 4GB+", price: 12100, data: "4GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-11", carrier: "KT skylife", mobilePlanName: "SOS 스쿨 4GB+", price: 13100, data: "4GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-12", carrier: "KT skylife", mobilePlanName: "모두 충분 4.5GB+", price: 13200, data: "4.5GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-13", carrier: "KT skylife", mobilePlanName: "통화 충분 10GB", price: 13900, data: "10GB", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-14", carrier: "KT skylife", mobilePlanName: "골드 8.0GB+", price: 13900, data: "8GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-15", carrier: "KT skylife", mobilePlanName: "데이터 충분 5GB+/100분", price: 14300, data: "5GB+", call: "100분", sms: "100건", mobileBenefits: ["데이터쿠폰 20GB x 4회"] },
  { id: "sky-mob-16", carrier: "KT skylife", mobilePlanName: "모두 충분 6GB+", price: 14900, data: "6GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-17", carrier: "KT skylife", mobilePlanName: "5G 통화 충분 10GB", price: 14900, data: "10GB", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-18", carrier: "KT skylife", mobilePlanName: "스쿨 8GB+", price: 14900, data: "8GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-19", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(후후안심)", price: 16200, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "후후안심 무료", "데이터UP 10GB 매월 추가 제공"] },
  { id: "sky-mob-20", carrier: "KT skylife", mobilePlanName: "스쿨 7GB+(밀리의 서재)", price: 16200, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회"] },
  { id: "sky-mob-21", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(모아진)", price: 16200, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 제공 5800원", "모아진 국내 매거진 이용권 무료"] },
  { id: "sky-mob-22", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(밀리의서재)", price: 16300, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용", "밀리의서재 이용권 무료"] },
  { id: "sky-mob-23", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(CU)", price: 16700, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "CU 편의점 최대 5000원 할인"] },
  { id: "sky-mob-24", carrier: "KT skylife", mobilePlanName: "통화 충분 15GB", price: 16900, data: "15GB", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-25", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(Pay_3000)", price: 17600, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "Npay 포인트 3000원 쿠폰제공"] },
  { id: "sky-mob-26", carrier: "KT skylife", mobilePlanName: "모두 충분 10GB+", price: 17900, data: "10GB+", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-27", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(올리브영_5000)", price: 18500, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "올리브영 5,000포인트제공"] },
  { id: "sky-mob-28", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(Pay_5000)", price: 18500, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "Npay 포인트 5000원 쿠폰제공"] },
  { id: "sky-mob-29", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(다이소_5000)", price: 18500, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "매월 다이소 5000포인트 제공"] },
  { id: "sky-mob-30", carrier: "KT skylife", mobilePlanName: "모두 충분 10GB+(모아진)", price: 18900, data: "10GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 제공 5800원", "모아진 국내 매거진 이용권 무료"] },
  { id: "sky-mob-31", carrier: "KT skylife", mobilePlanName: "5G 슬림 20GB/200분", price: 18900, data: "20GB", call: "200분", sms: "100건", mobileBenefits: [] },
  { id: "sky-mob-32", carrier: "KT skylife", mobilePlanName: "모두 충분 7GB+(지니뮤직)", price: 19000, data: "7GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "지니뮤직 8000g 포인트 지급"] },
  { id: "sky-mob-33", carrier: "KT skylife", mobilePlanName: "모두 충분 10GB+(밀리의서재)", price: 19000, data: "10GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "밀리의서재 이용권 무료"] },
  { id: "sky-mob-34", carrier: "KT skylife", mobilePlanName: "모두 충분 10GB+(CU)", price: 19400, data: "10GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "CU 편의점 최대 5000원 할인"] },
  { id: "sky-mob-35", carrier: "KT skylife", mobilePlanName: "통화 충분 20GB", price: 20100, data: "20GB", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-36", carrier: "KT skylife", mobilePlanName: "모두 충분 15GB+(후후안심)", price: 20900, data: "15GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "후후안심 무료"] },
  { id: "sky-mob-37", carrier: "KT skylife", mobilePlanName: "모두 충분 10GB+(올리브영_5000)", price: 21200, data: "10GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 5000원 적용"] },
  { id: "sky-mob-38", carrier: "KT skylife", mobilePlanName: "모두 충분 10GB+(다이소_5000)", price: 21200, data: "10GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 5000원 적용", "매월 다이소 5000포인트 제공"] },
  { id: "sky-mob-39", carrier: "KT skylife", mobilePlanName: "모두 충분 10GB+(Pay_5000)", price: 21200, data: "10GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 5000원 적용"] },
  { id: "sky-mob-40", carrier: "KT skylife", mobilePlanName: "모두 충분 15GB+(모아진)", price: 21400, data: "15GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 15000원 적용"] },
  { id: "sky-mob-41", carrier: "KT skylife", mobilePlanName: "모두 충분 15GB+(밀리의서재)", price: 21500, data: "15GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 11900원 적용", "밀리의서재 이용권 무료"] },
  { id: "sky-mob-42", carrier: "KT skylife", mobilePlanName: "모두 충분 10GB+(지니뮤직)", price: 21700, data: "10GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 8000원 적용"] },
  { id: "sky-mob-43", carrier: "KT skylife", mobilePlanName: "모두 충분 15GB+(CU)", price: 21900, data: "15GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 5000원 적용"] },
  { id: "sky-mob-44", carrier: "KT skylife", mobilePlanName: "모두 충분 15GB+(올리브영_5000)", price: 23700, data: "15GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 5000원 적용"] },
  { id: "sky-mob-45", carrier: "KT skylife", mobilePlanName: "모두 충분 15GB+(다이소_5000)", price: 23700, data: "15GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 5000원 적용", "매월 다이소 5000포인트 제공"] },
  { id: "sky-mob-46", carrier: "KT skylife", mobilePlanName: "모두 충분 15GB+(Pay_5000)", price: 23700, data: "15GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 9300원 적용"] },
  { id: "sky-mob-47", carrier: "KT skylife", mobilePlanName: "모두 충분 15GB+(지니뮤직)", price: 24200, data: "15GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "2년간 매월 10GB 추가 제공", "프로모션 8000원 적용"] },
  { id: "sky-mob-48", carrier: "KT skylife", mobilePlanName: "데이터 충분 15GB+/100분(CU)", price: 25300, data: "15GB+", call: "100분", sms: "100건", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용"] },
  { id: "sky-mob-49", carrier: "KT skylife", mobilePlanName: "데이터 충분 15GB+/100분(모아진)", price: 25300, data: "15GB+", call: "100분", sms: "100건", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 15000원 적용"] },
  { id: "sky-mob-50", carrier: "KT skylife", mobilePlanName: "데이터 충분 15GB+/100분", price: 25300, data: "15GB+", call: "100분", sms: "100건", mobileBenefits: [] },
  { id: "sky-mob-51", carrier: "KT skylife", mobilePlanName: "5G 통화 충분 20GB", price: 25900, data: "20GB", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-52", carrier: "KT skylife", mobilePlanName: "데이터 충분 15GB+/300분(CU)", price: 27500, data: "15GB+", call: "300분", sms: "300건", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용"] },
  { id: "sky-mob-53", carrier: "KT skylife", mobilePlanName: "데이터 충분 15GB+/300분", price: 27500, data: "15GB+", call: "300분", sms: "300건", mobileBenefits: ["데이터쿠폰 20GB x 4회"] },
  { id: "sky-mob-54", carrier: "KT skylife", mobilePlanName: "데이터 충분 15GB+/100분(Pay_5000)", price: 27800, data: "15GB+", call: "100분", sms: "100건", mobileBenefits: [] },
  { id: "sky-mob-55", carrier: "KT skylife", mobilePlanName: "데이터 충분 15GB+/100분(지니뮤직)", price: 28800, data: "15GB+", call: "100분", sms: "100건", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 8000원 적용"] },
  { id: "sky-mob-56", carrier: "KT skylife", mobilePlanName: "데이터 충분 15GB+/100분(웨이브)", price: 29300, data: "15GB+", call: "100분", sms: "100건", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 7900원 적용", "웨이브 베이직 이용권"] },
  { id: "sky-mob-57", carrier: "KT skylife", mobilePlanName: "5G 통화 충분 30GB", price: 29900, data: "30GB", call: "무제한", sms: "무제한", mobileBenefits: [] },
  { id: "sky-mob-58", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 14GB+", price: 32000, data: "14GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 6500원 적용"] },
  { id: "sky-mob-59", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(후후안심)", price: 33000, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "후후안심 무료"] },
  { id: "sky-mob-60", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(CU)", price: 33000, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용"] },
  { id: "sky-mob-61", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(모아진)", price: 33000, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 15000원 적용"] },
  { id: "sky-mob-62", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(밀리의서재)", price: 33100, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 11900원 적용", "밀리의서재 이용권 무료"] },
  { id: "sky-mob-63", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(Pay_5000)", price: 35300, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용"] },
  { id: "sky-mob-64", carrier: "KT skylife", mobilePlanName: "모두 충분 11.0GB+(지니뮤직)", price: 35800, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 8000원 적용"] },
  { id: "sky-mob-65", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(왓챠)", price: 35900, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 7900원 적용"] },
  { id: "sky-mob-66", carrier: "KT skylife", mobilePlanName: "모두 충분 11.0GB+(기프티쇼)", price: 36000, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용"] },
  { id: "sky-mob-67", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(요기요)", price: 36300, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용"] },
  { id: "sky-mob-68", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(배달의민족)", price: 36300, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용"] },
  { id: "sky-mob-69", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(멜론뮤직)", price: 36300, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 6900원 적용"] },
  { id: "sky-mob-70", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(올리브영_5000)", price: 36300, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용"] },
  { id: "sky-mob-71", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(다이소_5000)", price: 36300, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5000원 적용", "매월 다이소 5000포인트 제공"] },
  { id: "sky-mob-72", carrier: "KT skylife", mobilePlanName: "모두 충분 11GB+(웨이브)", price: 36600, data: "11GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 7900원 적용", "웨이브 베이직 이용권"] },
  { id: "sky-mob-73", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 50GB+", price: 37900, data: "50GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 8300원 적용"] },
  { id: "sky-mob-74", carrier: "KT skylife", mobilePlanName: "모두 충분 100GB+(CU)", price: 38200, data: "100GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5800원 적용"] },
  { id: "sky-mob-75", carrier: "KT skylife", mobilePlanName: "모두 충분 100GB+(모아진)", price: 38200, data: "100GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5800원 적용"] },
  { id: "sky-mob-76", carrier: "KT skylife", mobilePlanName: "모두 충분 100GB+(밀리의서재)", price: 38300, data: "100GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 5700원 적용", "밀리의서재 이용권 무료"] },
  { id: "sky-mob-77", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 70GB+(밀리의서재)", price: 39100, data: "70GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 9300원 적용", "밀리의서재 이용권 무료"] },
  { id: "sky-mob-78", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 70GB+", price: 39100, data: "70GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 9300원 적용"] },
  { id: "sky-mob-79", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 90GB+(밀리의서재)", price: 40300, data: "90GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 10300원 적용", "밀리의서재 이용권 무료"] },
  { id: "sky-mob-80", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 90GB+", price: 40300, data: "90GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 10300원 적용"] },
  { id: "sky-mob-81", carrier: "KT skylife", mobilePlanName: "모두 충분 일5GB+(왓챠)", price: 41100, data: "5GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 800원 적용"] },
  { id: "sky-mob-82", carrier: "KT skylife", mobilePlanName: "모두 충분 100GB+(Pay_5000)", price: 41700, data: "100GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 4500원 적용"] },
  { id: "sky-mob-83", carrier: "KT skylife", mobilePlanName: "모두 충분 100GB+(웨이브)", price: 41700, data: "100GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 4500원 적용", "웨이브 베이직 이용권"] },
  { id: "sky-mob-84", carrier: "KT skylife", mobilePlanName: "모두 충분 100GB+(올리브영_5000)", price: 41700, data: "100GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 7800원 적용"] },
  { id: "sky-mob-85", carrier: "KT skylife", mobilePlanName: "모두 충분 100GB+(다이소_5000)", price: 41700, data: "100GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 7800원 적용", "매월 다이소 5000포인트 제공"] },
  { id: "sky-mob-86", carrier: "KT skylife", mobilePlanName: "모두 충분 100GB+(지니뮤직)", price: 42200, data: "100GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 4000원 적용"] },
  { id: "sky-mob-87", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 110GB+", price: 42900, data: "110GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 6600원 적용"] },
  { id: "sky-mob-88", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 110GB+(밀리의서재)", price: 42900, data: "110GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 6600원 적용", "밀리의서재 이용권 무료"] },
  { id: "sky-mob-89", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 200GB+", price: 49200, data: "200GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 2900원 적용"] },
  { id: "sky-mob-90", carrier: "KT skylife", mobilePlanName: "5G 모두 충분 200GB+(밀리의서재)", price: 49200, data: "200GB+", call: "무제한", sms: "무제한", mobileBenefits: ["데이터쿠폰 20GB x 4회", "프로모션 2900원 적용", "밀리의서재 이용권 무료"] },
];

export const mockMvnoHomeBundles: MVNOHomeBundle[] = [
  { id: "sky-home-01", carrier: "KT skylife", internetName: "스카이 인터넷 100M", internetSpeed: "100Mbps", tvName: "베이직", channels: 194, bundleMonthlyFee: 18095, bundleBenefits: ["모바일 매월 20GB 추가제공"] },
  { id: "sky-home-02", carrier: "KT skylife", internetName: "스카이 인터넷 200M", internetSpeed: "200Mbps", tvName: "베이직", channels: 194, bundleMonthlyFee: 20295, bundleBenefits: ["모바일 매월 20GB 추가제공"] },
  { id: "sky-home-03", carrier: "KT skylife", internetName: "스카이 인터넷 500M", internetSpeed: "500Mbps", tvName: "베이직", channels: 194, bundleMonthlyFee: 23595, bundleBenefits: ["모바일 매월 20GB 추가제공"] },
  { id: "sky-home-04", carrier: "KT skylife", internetName: "스카이 인터넷 1G", internetSpeed: "1Gbps", tvName: "베이직", channels: 194, bundleMonthlyFee: 26895, bundleBenefits: ["모바일 매월 20GB 추가제공"] },
  { id: "sky-home-05", carrier: "KT skylife", internetName: "스카이 인터넷 100M", internetSpeed: "100Mbps", tvName: "플러스", channels: 204, bundleMonthlyFee: 18590, bundleBenefits: ["모바일 매월 20GB 추가제공"] },
  { id: "sky-home-06", carrier: "KT skylife", internetName: "스카이 인터넷 200M", internetSpeed: "200Mbps", tvName: "플러스", channels: 204, bundleMonthlyFee: 20790, bundleBenefits: ["모바일 매월 20GB 추가제공"] },
  { id: "sky-home-07", carrier: "KT skylife", internetName: "스카이 인터넷 500M", internetSpeed: "500Mbps", tvName: "플러스", channels: 204, bundleMonthlyFee: 24090, bundleBenefits: ["모바일 매월 20GB 추가제공"] },
  { id: "sky-home-08", carrier: "KT skylife", internetName: "스카이 인터넷 1G", internetSpeed: "1Gbps", tvName: "플러스", channels: 204, bundleMonthlyFee: 27390, bundleBenefits: ["모바일 매월 20GB 추가제공"] },
];


// ----------------------------------------------------
// 2. LG 헬로비전 전용 인터페이스 및 Mock 데이터
// ----------------------------------------------------

export interface LgHelloBundleCombination {
  id: string;
  carrier: string;
  mobilePlanName: string;
  mobileBenefits: string[];
  data: string;
  call: string;
  sms: string;
  mobileFee: number;         // 모바일 개별 금액
  internetName: string;
  internetSpeed: string;
  tvName: string;
  channels: number;
  homeBundleFee: number;     // 인터넷 + IPTV 개별 금액
  totalMonthlyFee: number;   // 총 월 납부액
  bundleBenefits: string[];  // 유선 결합 혜택
  allBenefits: string[];     // 모바일 혜택 + 유선 결합 혜택 통합 리스트
}

export const mockLgHelloBundles: LgHelloBundleCombination[] = [
  // ====================================================
  // 1G 플래티넘 기가 라인업
  // ====================================================
  { id: "hello-1g-01", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 7GB", mobileBenefits: [], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 15900, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 38900, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-02", carrier: "LG 헬로비전", mobilePlanName: "안심보험 유심 7GB", mobileBenefits: ["롯데손해보험 불효자보험 12개월 보장(보장기간 1년)"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 17300, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 40300, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["롯데손해보험 불효자보험 12개월 보장(보장기간 1년)", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-03", carrier: "LG 헬로비전", mobilePlanName: "데이터 더주는 유심 7GB", mobileBenefits: ["2년간 데이터 10GB*24개월"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 17400, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 40400, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 데이터 10GB*24개월", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-04", carrier: "LG 헬로비전", mobilePlanName: "현대홈쇼핑 유심 7GB", mobileBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 18100, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 41100, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-05", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 7GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 18330, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 41330, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-06", carrier: "LG 헬로비전", mobilePlanName: "현대홈쇼핑 데이터 더주는 유심 7GB", mobileBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "매월 10GB 데이터"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 19600, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 42600, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "매월 10GB 데이터", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-07", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 7GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 19800, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 42800, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-08", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 10GB", mobileBenefits: [], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 18900, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 41900, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-09", carrier: "LG 헬로비전", mobilePlanName: "데이터 더주는 유심 10GB", mobileBenefits: ["2년간 매월 10GB 데이터"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 20500, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 43500, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 10GB 데이터", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-10", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 10GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 21300, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 44300, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-11", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 10GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 22900, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 45900, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-12", carrier: "LG 헬로비전", mobilePlanName: "[혜택형] The 착한 데이터 유심 11GB", mobileBenefits: ["2년간 매월 Npay 1만원 쿠폰"], data: "11GB", call: "무제한", sms: "무제한", mobileFee: 32990, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 55990, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 Npay 1만원 쿠폰", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-1g-13", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 11GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "11GB", call: "무제한", sms: "무제한", mobileFee: 37330, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 60330, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-unlim-01", carrier: "LG 헬로비전", mobilePlanName: "The 착한 데이터 유심 11GB+", mobileBenefits: ["데이터 소진 후 3Mbps 속도무제한"], data: "11GB+일2GB+3Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 33900, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 56900, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["데이터 소진 후 3Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-unlim-02", carrier: "LG 헬로비전", mobilePlanName: "The 착한 데이터 유심 100GB+", mobileBenefits: ["데이터 소진 후 5Mbps 속도무제한"], data: "100GB+5Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 39600, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 62600, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["데이터 소진 후 5Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-unlim-03", carrier: "LG 헬로비전", mobilePlanName: "[혜택형] The 착한 데이터 유심 11GB+", mobileBenefits: ["2년간 매월 Npay 1만원 쿠폰", "3Mbps 속도무제한"], data: "11GB+일2GB+3Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 38900, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 61900, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 Npay 1만원 쿠폰", "3Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-unlim-04", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 유심 11GB+", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한"], data: "11GB+일2GB+3Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 37330, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 60330, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-50to100-01", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 71GB+", mobileBenefits: ["데이터 소진 후 3Mbps 속도무제한"], data: "71GB+3Mbps", call: "무제한", sms: "무제한", mobileFee: 32000, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 55000, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["데이터 소진 후 3Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-50to100-02", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 71GB+", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한"], data: "71GB+3Mbps", call: "무제한", sms: "무제한", mobileFee: 34500, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 57500, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-50to100-03", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 50GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "50GB+1Mbps", call: "무제한", sms: "무제한", mobileFee: 29900, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 52900, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-10to30-01", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 15GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "15GB+1Mbps", call: "100분", sms: "100건", mobileFee: 20900, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 43900, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-10to30-02", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 25GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "25GB+1Mbps", call: "200분", sms: "100건", mobileFee: 24200, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 47200, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },
  { id: "hello-10to30-03", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 15GB+", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "1Mbps 속도무제한"], data: "15GB+1Mbps", call: "100분", sms: "100건", mobileFee: 23500, internetName: "1G 플래티넘기가 WiFi+", internetSpeed: "1G", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 23000, totalMonthlyFee: 46500, bundleBenefits: ["할인카드 적용시 월 4000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "1Mbps 속도무제한", "할인카드 적용시 월 4000원 할인"] },

  // ====================================================
  // 500M 기가라이트 라인업
  // ====================================================
  { id: "hello-500m-01", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 7GB", mobileBenefits: [], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 15900, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 37900, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-02", carrier: "LG 헬로비전", mobilePlanName: "안심보험 유심 7GB", mobileBenefits: ["롯데손해보험 불효자보험 12개월 보장(보장기간 1년)"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 17300, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 39300, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["롯데손해보험 불효자보험 12개월 보장(보장기간 1년)", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-03", carrier: "LG 헬로비전", mobilePlanName: "데이터 더주는 유심 7GB", mobileBenefits: ["2년간 데이터 10GB*24개월"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 17400, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 39400, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 데이터 10GB*24개월", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-04", carrier: "LG 헬로비전", mobilePlanName: "현대홈쇼핑 유심 7GB", mobileBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 18100, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 40100, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-05", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 7GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 18330, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 40330, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-06", carrier: "LG 헬로비전", mobilePlanName: "현대홈쇼핑 데이터 더주는 유심 7GB", mobileBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "매월 10GB 데이터"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 19600, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 41600, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "매월 10GB 데이터", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-07", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 7GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 19800, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 41800, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-08", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 10GB", mobileBenefits: [], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 18900, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 40900, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-09", carrier: "LG 헬로비전", mobilePlanName: "데이터 더주는 유심 10GB", mobileBenefits: ["2년간 매월 10GB 데이터"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 20500, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 42500, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 10GB 데이터", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-10", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 10GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 21300, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 43300, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-11", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 10GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 22900, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 44900, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-12", carrier: "LG 헬로비전", mobilePlanName: "[혜택형] The 착한 데이터 유심 11GB", mobileBenefits: ["2년간 매월 Npay 1만원 쿠폰"], data: "11GB", call: "무제한", sms: "무제한", mobileFee: 32990, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 54990, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 Npay 1만원 쿠폰", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-500m-13", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 11GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "11GB", call: "무제한", sms: "무제한", mobileFee: 37330, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 59330, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-unlim-05", carrier: "LG 헬로비전", mobilePlanName: "The 착한 데이터 유심 11GB+", mobileBenefits: ["데이터 소진 후 3Mbps 속도무제한"], data: "11GB+일2GB+3Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 33900, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 55900, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["데이터 소진 후 3Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-unlim-06", carrier: "LG 헬로비전", mobilePlanName: "The 착한 데이터 유심 100GB+", mobileBenefits: ["데이터 소진 후 5Mbps 속도무제한"], data: "100GB+5Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 39600, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 61600, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["데이터 소진 후 5Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-unlim-07", carrier: "LG 헬로비전", mobilePlanName: "[혜택형] The 착한 데이터 유심 11GB+", mobileBenefits: ["2년간 매월 Npay 1만원 쿠폰", "3Mbps 속도무제한"], data: "11GB+일2GB+3Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 38900, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 60900, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 Npay 1만원 쿠폰", "3Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-50to100-04", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 71GB+", mobileBenefits: ["데이터 소진 후 3Mbps 속도무제한"], data: "71GB+3Mbps", call: "무제한", sms: "무제한", mobileFee: 32000, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 54000, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["데이터 소진 후 3Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-50to100-05", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 71GB+", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한"], data: "71GB+3Mbps", call: "무제한", sms: "무제한", mobileFee: 34500, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 56500, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-50to100-06", carrier: "LG 헬로비전", mobilePlanName: "현대홈쇼핑 유심 71GB+", mobileBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "3Mbps 속도무제한"], data: "71GB+3Mbps", call: "무제한", sms: "무제한", mobileFee: 34300, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 56300, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "3Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-50to100-07", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 50GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "50GB+1Mbps", call: "무제한", sms: "무제한", mobileFee: 29900, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 51900, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-10to30-04", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 15GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "15GB+1Mbps", call: "100분", sms: "100건", mobileFee: 20900, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 42900, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-10to30-05", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 25GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "25GB+1Mbps", call: "200분", sms: "100건", mobileFee: 24200, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 46200, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-10to30-06", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 15GB+", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "1Mbps 속도무제한"], data: "15GB+1Mbps", call: "100분", sms: "100건", mobileFee: 23500, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 45500, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "1Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },
  { id: "hello-10to30-07", carrier: "LG 헬로비전", mobilePlanName: "현대홈쇼핑 유심 15GB+", mobileBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "1Mbps 속도무제한"], data: "15GB+1Mbps", call: "100분", sms: "100건", mobileFee: 23300, internetName: "500M 기가라이트 WiFi+", internetSpeed: "500MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 22000, totalMonthlyFee: 45300, bundleBenefits: ["할인카드 적용시 월 3000원 할인"], allBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "1Mbps 속도무제한", "할인카드 적용시 월 3000원 할인"] },

  // ====================================================
  // 160M 광랜 라인업
  // ====================================================
  { id: "hello-160m-01", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 7GB", mobileBenefits: [], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 15900, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 36400, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-02", carrier: "LG 헬로비전", mobilePlanName: "안심보험 유심 7GB", mobileBenefits: ["롯데손해보험 불효자보험 12개월 보장(보장기간 1년)"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 17300, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 37800, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["롯데손해보험 불효자보험 12개월 보장(보장기간 1년)", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-03", carrier: "LG 헬로비전", mobilePlanName: "데이터 더주는 유심 7GB", mobileBenefits: ["2년간 데이터 10GB*24개월"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 17400, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 37900, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 데이터 10GB*24개월", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-04", carrier: "LG 헬로비전", mobilePlanName: "현대홈쇼핑 유심 7GB", mobileBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 18100, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 38600, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-05", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 7GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 18330, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 38830, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-06", carrier: "LG 헬로비전", mobilePlanName: "현대홈쇼핑 데이터 더주는 유심 7GB", mobileBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "매월 10GB 데이터"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 19600, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 40100, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 2만원 현대홈쇼핑 혜택", "매월 10GB 데이터", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-07", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 7GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "7GB", call: "무제한", sms: "무제한", mobileFee: 19800, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 40300, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-08", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 10GB", mobileBenefits: [], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 18900, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 39400, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-09", carrier: "LG 헬로비전", mobilePlanName: "데이터 더주는 유심 10GB", mobileBenefits: ["2년간 매월 10GB 데이터"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 20500, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 41000, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 10GB 데이터", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-10", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 10GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 21300, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 41800, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-11", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 10GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "10GB", call: "무제한", sms: "무제한", mobileFee: 22900, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 43400, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-12", carrier: "LG 헬로비전", mobilePlanName: "[혜택형] The 착한 데이터 유심 11GB", mobileBenefits: ["2년간 매월 Npay 1만원 쿠폰"], data: "11GB", call: "무제한", sms: "무제한", mobileFee: 32990, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 53490, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 Npay 1만원 쿠폰", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-160m-13", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 더주는 유심 11GB", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터"], data: "11GB", call: "무제한", sms: "무제한", mobileFee: 37330, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 57830, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "매월 10GB 데이터", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-unlim-08", carrier: "LG 헬로비전", mobilePlanName: "The 착한 데이터 유심 11GB+", mobileBenefits: ["데이터 소진 후 3Mbps 속도무제한"], data: "11GB+일2GB+3Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 33900, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 54400, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["데이터 소진 후 3Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-unlim-09", carrier: "LG 헬로비전", mobilePlanName: "The 착한 데이터 유심 100GB+", mobileBenefits: ["데이터 소진 후 5Mbps 속도무제한"], data: "100GB+5Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 39600, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 60100, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["데이터 소진 후 5Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-unlim-10", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 데이터 유심 11GB+", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한"], data: "11GB+일2GB+3Mbps(무제한)", call: "무제한", sms: "무제한", mobileFee: 37330, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 57830, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-50to100-08", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 71GB+", mobileBenefits: ["데이터 소진 후 3Mbps 속도무제한"], data: "71GB+3Mbps", call: "무제한", sms: "무제한", mobileFee: 32000, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 52500, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["데이터 소진 후 3Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-50to100-09", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 71GB+", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한"], data: "71GB+3Mbps", call: "무제한", sms: "무제한", mobileFee: 34500, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 55000, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "3Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-50to100-10", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 50GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "50GB+1Mbps", call: "무제한", sms: "무제한", mobileFee: 29900, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 50400, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-10to30-08", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 15GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "15GB+1Mbps", call: "100분", sms: "100건", mobileFee: 20900, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 41400, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-10to30-09", carrier: "LG 헬로비전", mobilePlanName: "DATA 걱정없는 유심 25GB+", mobileBenefits: ["데이터 소진 후 1Mbps 속도무제한"], data: "25GB+1Mbps", call: "200분", sms: "100건", mobileFee: 24200, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 44700, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["데이터 소진 후 1Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] },
  { id: "hello-10to30-10", carrier: "LG 헬로비전", mobilePlanName: "쿠폰팩 유심 15GB+", mobileBenefits: ["2년간 매월 5천원 쿠폰팩", "1Mbps 속도무제한"], data: "15GB+1Mbps", call: "100분", sms: "100건", mobileFee: 23500, internetName: "160M 광랜 WiFi+", internetSpeed: "160MG", tvName: "247채널 뉴베이직", channels: 247, homeBundleFee: 20500, totalMonthlyFee: 44000, bundleBenefits: ["할인카드 적용시 월 1500원 할인"], allBenefits: ["2년간 매월 5천원 쿠폰팩", "1Mbps 속도무제한", "할인카드 적용시 월 1500원 할인"] }
];

// ----------------------------------------------------
// 3. 이야기 모바일 (3사 인터넷 연동) 인터페이스 및 Mock 데이터
// ----------------------------------------------------

export interface EyagiMobilePlan {
  id: string;
  mvnoCarrier: "이야기 SKT" | "이야기 LGU+"; // 알뜰폰 통신사
  mobilePlanName: string;                     // 요금제명
  data: string;                               // 용량 / 속도
  call: string;                               // 전화
  sms: string;                                // 문자
  price: number;                              // 월 모바일 금액
}

export interface MnoHomeBundle {
  id: string;
  mnoCarrier: "SKT" | "LGU+";                 // 연동되는 3사 통신사
  internetName: string;                       // 인터넷 요금제명
  internetSpeed: string;                      // 🟢 [추가] 인터넷 속도 (1G, 500M, 100M 등)
  tvName: string;                             // IPTV 상품명
  term: "3년 약정" | "2년 약정" | "1년 약정";  // 약정 기간
  bundleMonthlyFee: number;                   // 결합 월 납부액
  bundleBenefits: string[];                   // 결합/가입 혜택
}

export interface EyagiBundleTotalResult {
  mvnoCarrier: string;         // 이야기 SKT 또는 이야기 LGU+
  mnoCarrier: string;          // 연동 3사 (SKT 또는 LGU+)

  // 모바일 정보
  mobilePlanName: string;
  mobilePrice: number;
  data: string;                // 🟢 모바일 데이터량/속도제어
  call: string;
  sms: string;

  // 인터넷 + TV 정보
  internetName: string;
  internetSpeed: string;       // 🟢 [추가] 인터넷 속도
  tvName: string;
  term: string;
  homeBundlePrice: number;

  // 할인 및 총합
  discountAmount: number;      // 추가 할인액
  totalPrice: number;          // 총 금액
  bundleBenefits: string[];
}

// [데이터 1] 알뜰 SKT 이야기 모바일 요금제 목록
export const mockEyagiSktMobilePlans: EyagiMobilePlan[] = [
  { id: "eyagi-skt-01", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 이야기 무한 8GB", data: "8GB", call: "무제한", sms: "무제한", price: 22600 },
  { id: "eyagi-skt-02", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 이야기 무한 11GB", data: "11GB", call: "무제한", sms: "무제한", price: 27100 },
  { id: "eyagi-skt-03", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 이야기 무한 24GB", data: "24GB", call: "무제한", sms: "무제한", price: 33000 },
  { id: "eyagi-skt-04", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 이야기 무한 54GB", data: "54GB", call: "무제한", sms: "무제한", price: 35200 },
  { id: "eyagi-skt-05", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 이야기 무한 74GB", data: "74GB", call: "무제한", sms: "무제한", price: 36300 },
  { id: "eyagi-skt-06", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 이야기 무한 99GB", data: "99GB", call: "무제한", sms: "무제한", price: 37400 },
  { id: "eyagi-skt-07", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 이야기 무한 110GB", data: "110GB", call: "무제한", sms: "무제한", price: 39600 },
  { id: "eyagi-skt-08", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 이야기 무한 200GB", data: "200GB", call: "무제한", sms: "무제한", price: 45400 },
  { id: "eyagi-skt-09", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 함께이야기해S (200분+6GB)", data: "6GB", call: "200분", sms: "100건", price: 4400 },
  { id: "eyagi-skt-10", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 함께이야기해S (200분+10GB)", data: "10GB", call: "200분", sms: "100건", price: 6600 },
  { id: "eyagi-skt-11", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 함께이야기해S (200분+15GB)", data: "15GB", call: "200분", sms: "100건", price: 10500 },
  { id: "eyagi-skt-12", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 함께이야기해S (200분+20GB)", data: "20GB", call: "200분", sms: "100건", price: 14300 },
  { id: "eyagi-skt-13", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 함께이야기해S (500분+30GB)", data: "30GB", call: "500분", sms: "200건", price: 24200 },
  { id: "eyagi-skt-14", mvnoCarrier: "이야기 SKT", mobilePlanName: "5G 함께이야기해S (500분+50GB)", data: "50GB", call: "500분", sms: "200건", price: 33000 },
  { id: "eyagi-skt-15", mvnoCarrier: "이야기 SKT", mobilePlanName: "이야기 무한 1GB+", data: "1GB+", call: "무제한", sms: "무제한", price: 5500 },
  { id: "eyagi-skt-16", mvnoCarrier: "이야기 SKT", mobilePlanName: "이야기 라이트S 7GB+", data: "7GB+", call: "무제한", sms: "무제한", price: 7600 },
  { id: "eyagi-skt-17", mvnoCarrier: "이야기 SKT", mobilePlanName: "이야기 무한 10GB+", data: "10GB+", call: "무제한", sms: "무제한", price: 11600 },
  { id: "eyagi-skt-18", mvnoCarrier: "이야기 SKT", mobilePlanName: "이야기 스탠다드S 11GB+", data: "11GB+(매일 2GB)", call: "무제한", sms: "무제한", price: 15600 },
  { id: "eyagi-skt-19", mvnoCarrier: "이야기 SKT", mobilePlanName: "이야기 스탠다드S 100분15GB+", data: "15GB+", call: "100분", sms: "100건", price: 12600 },
  { id: "eyagi-skt-20", mvnoCarrier: "이야기 SKT", mobilePlanName: "이야기 스탠다드S 300분15GB+", data: "15GB+", call: "300분", sms: "300건", price: 13600 },
  { id: "eyagi-skt-21", mvnoCarrier: "이야기 SKT", mobilePlanName: "이야기 스페셜S 100GB+", data: "100GB+", call: "무제한", sms: "무제한", price: 18600 },
  { id: "eyagi-skt-22", mvnoCarrier: "이야기 SKT", mobilePlanName: "내맘대로S(200+10GB)", data: "10GB", call: "200분", sms: "200건", price: 6600 },
  { id: "eyagi-skt-23", mvnoCarrier: "이야기 SKT", mobilePlanName: "내맘대로S(300+10GB)", data: "10GB", call: "300분", sms: "300건", price: 9900 },
  { id: "eyagi-skt-24", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(100분+10GB)", data: "10GB", call: "100분", sms: "100건", price: 4400 },
  { id: "eyagi-skt-25", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(100분+20GB)", data: "20GB", call: "100분", sms: "200건", price: 11000 },
  { id: "eyagi-skt-26", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(100분+30GB)", data: "30GB", call: "100분", sms: "300건", price: 5500 },
  { id: "eyagi-skt-27", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(200분+10GB)", data: "10GB", call: "200분", sms: "100건", price: 4400 },
  { id: "eyagi-skt-28", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(200분+15GB)", data: "15GB", call: "200분", sms: "150건", price: 8800 },
  { id: "eyagi-skt-29", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(200분+20GB)", data: "20GB", call: "200분", sms: "200건", price: 1100 },
  { id: "eyagi-skt-30", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(200분+30GB)", data: "30GB", call: "200분", sms: "300건", price: 19100 },
  { id: "eyagi-skt-31", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(300분+10GB)", data: "10GB", call: "300분", sms: "100건", price: 5500 },
  { id: "eyagi-skt-32", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(300분+15GB)", data: "15GB", call: "300분", sms: "150건", price: 8800 },
  { id: "eyagi-skt-33", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(300분+20GB)", data: "20GB", call: "300분", sms: "200건", price: 1500 },
  { id: "eyagi-skt-34", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(300분+30GB)", data: "30GB", call: "300분", sms: "300건", price: 19800 },
  { id: "eyagi-skt-35", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(500분+10GB)", data: "10GB", call: "500분", sms: "100건", price: 8800 },
  { id: "eyagi-skt-36", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(500분+20GB)", data: "20GB", call: "500분", sms: "200건", price: 15400 },
  { id: "eyagi-skt-37", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(500분+30GB)", data: "30GB", call: "500분", sms: "300건", price: 23100 },
  { id: "eyagi-skt-38", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(1000분+10GB)", data: "10GB", call: "1000분", sms: "100건", price: 9900 },
  { id: "eyagi-skt-39", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(1000분+20GB)", data: "20GB", call: "1000분", sms: "200건", price: 19100 },
  { id: "eyagi-skt-40", mvnoCarrier: "이야기 SKT", mobilePlanName: "함께이야기해S(1000분+30GB)", data: "30GB", call: "1000분", sms: "300건", price: 28600 },
];

// [데이터 2] 3사 SKT 인터넷 + B tv 결합 데이터 (internetSpeed 속도 추가)
export const mockSktHomeBundles: MnoHomeBundle[] = [
  { id: "skt-home-01", mnoCarrier: "SKT", internetName: "안심 기가 윙즈 (1G)", internetSpeed: "1Gbps", tvName: "B tv+ max", term: "3년 약정", bundleMonthlyFee: 47300, bundleBenefits: ["알뜰 SKT 모바일 4,400원 추가 할인", "온라인 바로가입 시 사은품 + 2만원"] },
  { id: "skt-home-02", mnoCarrier: "SKT", internetName: "안심 기가 윙즈 (1G)", internetSpeed: "1Gbps", tvName: "B tv All 넷플릭스", term: "3년 약정", bundleMonthlyFee: 52200, bundleBenefits: ["알뜰 SKT 모바일 4,400원 추가 할인", "온라인 바로가입 시 사은품 + 2만원"] },
  { id: "skt-home-03", mnoCarrier: "SKT", internetName: "기가 와이파이 (1G)", internetSpeed: "1Gbps", tvName: "B tv+ max", term: "3년 약정", bundleMonthlyFee: 44000, bundleBenefits: ["알뜰 SKT 모바일 4,400원 추가 할인", "온라인 바로가입 시 사은품 + 2만원"] },
  { id: "skt-home-04", mnoCarrier: "SKT", internetName: "기가 와이파이 (1G)", internetSpeed: "1Gbps", tvName: "B tv All 넷플릭스", term: "3년 약정", bundleMonthlyFee: 48900, bundleBenefits: ["알뜰 SKT 모바일 4,400원 추가 할인", "온라인 바로가입 시 사은품 + 2만원"] },
  { id: "skt-home-05", mnoCarrier: "SKT", internetName: "기가 와이파이 (1G)", internetSpeed: "1Gbps", tvName: "B tv All (257개 채널)", term: "3년 약정", bundleMonthlyFee: 42900, bundleBenefits: ["알뜰 SKT 모바일 4,400원 추가 할인", "월 14,300원 할인", "최대 45만원 상품권 또는 월 11,000원 할인"] },
  { id: "skt-home-06", mnoCarrier: "SKT", internetName: "기가 와이파이 (1G)", internetSpeed: "1Gbps", tvName: "B tv pop 180+", term: "3년 약정", bundleMonthlyFee: 36300, bundleBenefits: ["알뜰 SKT 모바일 4,400원 추가 할인", "온라인 바로가입 시 사은품 + 2만원"] }
];

// [데이터 3] 알뜰 LG U+ 이야기모바일 요금제 목록
export const mockEyagiLguMobilePlans: EyagiMobilePlan[] = [
  { id: "eyagi-lgu-01", mvnoCarrier: "이야기 LGU+", mobilePlanName: "5G 이야기 라이트 9GB+", data: "9GB+", call: "무제한", sms: "기본제공", price: 28600 },
  { id: "eyagi-lgu-02", mvnoCarrier: "이야기 LGU+", mobilePlanName: "5G 이야기 라이트 12GB+", data: "12GB+", call: "무제한", sms: "기본제공", price: 29700 },
  { id: "eyagi-lgu-03", mvnoCarrier: "이야기 LGU+", mobilePlanName: "5G 이야기 프리미엄 180GB+", data: "180GB+", call: "무제한", sms: "기본제공", price: 46200 },
  { id: "eyagi-lgu-04", mvnoCarrier: "이야기 LGU+", mobilePlanName: "NH콕 이야기 15GB+", data: "15GB+", call: "100분", sms: "100건", price: 15400 },
  { id: "eyagi-lgu-05", mvnoCarrier: "이야기 LGU+", mobilePlanName: "NH콕 이야기 11GB+", data: "11GB+(매일 2GB)", call: "무제한", sms: "기본제공", price: 23100 },
  { id: "eyagi-lgu-06", mvnoCarrier: "이야기 LGU+", mobilePlanName: "NH콕 이야기 매일5GB+", data: "매일 5GB+", call: "무제한", sms: "기본제공", price: 29700 },
  { id: "eyagi-lgu-07", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 라이트 3.5GB+", data: "3.5GB+", call: "무제한", sms: "기본제공", price: 31900 },
  { id: "eyagi-lgu-08", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 스페셜 매일5GB+", data: "매일 5GB+", call: "무제한", sms: "기본제공", price: 23000 },
  { id: "eyagi-lgu-09", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 스페셜 100GB+", data: "100GB+", call: "무제한", sms: "기본제공", price: 23000 },
  { id: "eyagi-lgu-10", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 스탠다드 11GB+", data: "11GB+(매일 2GB)", call: "무제한", sms: "기본제공", price: 18000 },
  { id: "eyagi-lgu-11", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 스탠다드 100분15GB+", data: "15GB+", call: "100분", sms: "100건", price: 18700 },
  { id: "eyagi-lgu-12", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 스탠다드 300분15GB+", data: "15GB+", call: "300분", sms: "300건", price: 20900 },
  { id: "eyagi-lgu-13", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 폰케어 71GB+", data: "11GB+(매일 2GB)", call: "무제한", sms: "기본제공", price: 24500 },
  { id: "eyagi-lgu-14", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 폰케어 100GB+", data: "100GB+", call: "무제한", sms: "기본제공", price: 31000 },
  { id: "eyagi-lgu-15", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 피싱케어 71GB+", data: "11GB+(매일 2GB)", call: "무제한", sms: "기본제공", price: 24500 },
  { id: "eyagi-lgu-16", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 피싱케어 100GB+", data: "100GB+", call: "무제한", sms: "기본제공", price: 31000 },
  { id: "eyagi-lgu-17", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 쇼핑케어 71GB+", data: "11GB+(매일 2GB)", call: "무제한", sms: "기본제공", price: 26700 },
  { id: "eyagi-lgu-18", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 쇼핑케어 100GB+", data: "100GB+", call: "무제한", sms: "기본제공", price: 33200 },
  { id: "eyagi-lgu-19", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 데이터통화 완전 무제한 71GB+", data: "11GB+(매일 2GB)", call: "무제한", sms: "기본제공", price: 8800 },
  { id: "eyagi-lgu-20", mvnoCarrier: "이야기 LGU+", mobilePlanName: "이야기 데이터통화 완전 무제한 100GB+", data: "100GB+", call: "무제한", sms: "기본제공", price: 15000 },
  { id: "eyagi-lgu-21", mvnoCarrier: "이야기 LGU+", mobilePlanName: "요금걱정 제로 이야기 100GB+", data: "100GB+", call: "무제한", sms: "기본제공", price: 28600 },
];

// [데이터 4] 3사 LG U+ 인터넷 + IPTV 결합 요금제 목록 (internetSpeed 속도 추가)
export const mockLguHomeBundles: MnoHomeBundle[] = [
  { id: "lgu-home-01", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 1G", internetSpeed: "1Gbps", tvName: "프리미엄 VOD", term: "3년 약정", bundleMonthlyFee: 59400, bundleBenefits: ["상품권 42만원 증정", "결합 시 15만원 추가 상품권", "최대 43만원 상품권 또는 50인치 UHD TV 무료"] },
  { id: "lgu-home-02", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 500M", internetSpeed: "500Mbps", tvName: "프리미엄 VOD", term: "3년 약정", bundleMonthlyFee: 54450, bundleBenefits: ["상품권 39만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-03", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 500M", internetSpeed: "500Mbps", tvName: "프리미엄", term: "3년 약정", bundleMonthlyFee: 52250, bundleBenefits: ["상품권 39만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-04", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 1G", internetSpeed: "1Gbps", tvName: "프리미엄", term: "3년 약정", bundleMonthlyFee: 57200, bundleBenefits: ["상품권 42만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-05", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 500M", internetSpeed: "500Mbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 49280, bundleBenefits: ["상품권 39만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-06", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 1G", internetSpeed: "1Gbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 54230, bundleBenefits: ["상품권 42만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-07", mnoCarrier: "LGU+", internetName: "이코노미 100M", internetSpeed: "100Mbps", tvName: "이코노미", term: "3년 약정", bundleMonthlyFee: 31350, bundleBenefits: ["상품권 15만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-08", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 500M", internetSpeed: "500Mbps", tvName: "이코노미", term: "3년 약정", bundleMonthlyFee: 40700, bundleBenefits: ["상품권 34만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-09", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 1G", internetSpeed: "1Gbps", tvName: "이코노미", term: "3년 약정", bundleMonthlyFee: 45650, bundleBenefits: ["상품권 37만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-10", mnoCarrier: "LGU+", internetName: "와이파이기본_기가슬림안심 500M", internetSpeed: "500Mbps", tvName: "프리미엄 넷플릭스 HD", term: "3년 약정", bundleMonthlyFee: 56400, bundleBenefits: ["상품권 35만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-11", mnoCarrier: "LGU+", internetName: "와이파이기본_기가안심 1G", internetSpeed: "1Gbps", tvName: "프리미엄 넷플릭스 HD", term: "3년 약정", bundleMonthlyFee: 61350, bundleBenefits: ["상품권 38만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-12", mnoCarrier: "LGU+", internetName: "와이파이기본_기가슬림안심 500M", internetSpeed: "500Mbps", tvName: "프리미엄 넷플릭스 UHD", term: "3년 약정", bundleMonthlyFee: 59900, bundleBenefits: ["상품권 35만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-13", mnoCarrier: "LGU+", internetName: "와이파이기본_기가안심 1G", internetSpeed: "1Gbps", tvName: "프리미엄 넷플릭스 UHD", term: "3년 약정", bundleMonthlyFee: 64850, bundleBenefits: ["상품권 38만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-14", mnoCarrier: "LGU+", internetName: "와이파이기본_기가슬림안심 500M", internetSpeed: "500Mbps", tvName: "프리미엄 디즈니(+) 스탠다드", term: "3년 약정", bundleMonthlyFee: 53200, bundleBenefits: ["상품권 35만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-15", mnoCarrier: "LGU+", internetName: "와이파이기본_기가안심 1G", internetSpeed: "1Gbps", tvName: "프리미엄 디즈니(+) 스탠다드", term: "3년 약정", bundleMonthlyFee: 58150, bundleBenefits: ["상품권 38만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-16", mnoCarrier: "LGU+", internetName: "와이파이기본_기가슬림안심 500M", internetSpeed: "500Mbps", tvName: "프리미엄 티빙", term: "3년 약정", bundleMonthlyFee: 58200, bundleBenefits: ["상품권 35만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-17", mnoCarrier: "LGU+", internetName: "와이파이기본_기가안심 1G", internetSpeed: "1Gbps", tvName: "프리미엄 티빙", term: "3년 약정", bundleMonthlyFee: 63150, bundleBenefits: ["상품권 38만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-18", mnoCarrier: "LGU+", internetName: "와이파이기본_광랜안심 100M", internetSpeed: "100Mbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 37430, bundleBenefits: ["상품권 25만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-19", mnoCarrier: "LGU+", internetName: "와이파이기본_광랜안심 100M", internetSpeed: "100Mbps", tvName: "프리미엄", term: "3년 약정", bundleMonthlyFee: 40400, bundleBenefits: ["상품권 25만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-20", mnoCarrier: "LGU+", internetName: "와이파이기본_광랜안심 100M", internetSpeed: "100Mbps", tvName: "프리미엄 VOD", term: "3년 약정", bundleMonthlyFee: 42600, bundleBenefits: ["상품권 25만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-21", mnoCarrier: "LGU+", internetName: "와이파이기본_기가슬림안심 500M", internetSpeed: "500Mbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 42680, bundleBenefits: ["상품권 35만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-22", mnoCarrier: "LGU+", internetName: "와이파이기본_기가슬림안심 500M", internetSpeed: "500Mbps", tvName: "프리미엄", term: "3년 약정", bundleMonthlyFee: 45650, bundleBenefits: ["상품권 35만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-23", mnoCarrier: "LGU+", internetName: "와이파이기본_기가슬림안심 500M", internetSpeed: "500Mbps", tvName: "프리미엄 VOD", term: "3년 약정", bundleMonthlyFee: 47850, bundleBenefits: ["상품권 35만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-24", mnoCarrier: "LGU+", internetName: "와이파이기본_기가안심 1G", internetSpeed: "1Gbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 47630, bundleBenefits: ["상품권 38만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-25", mnoCarrier: "LGU+", internetName: "와이파이기본_기가안심 1G", internetSpeed: "1Gbps", tvName: "프리미엄", term: "3년 약정", bundleMonthlyFee: 50600, bundleBenefits: ["상품권 38만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-26", mnoCarrier: "LGU+", internetName: "와이파이기본_기가안심 1G", internetSpeed: "1Gbps", tvName: "프리미엄 VOD", term: "3년 약정", bundleMonthlyFee: 52800, bundleBenefits: ["상품권 38만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-27", mnoCarrier: "LGU+", internetName: "와이파이기본_안심 200M", internetSpeed: "200Mbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 40730, bundleBenefits: ["상품권 25만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-28", mnoCarrier: "LGU+", internetName: "와이파이기본_안심 200M", internetSpeed: "200Mbps", tvName: "프리미엄", term: "3년 약정", bundleMonthlyFee: 43700, bundleBenefits: ["상품권 25만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-29", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 100M", internetSpeed: "100Mbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 42930, bundleBenefits: ["상품권 29만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-30", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 1G", internetSpeed: "1Gbps", tvName: "프리미엄 넷플릭스 HD", term: "3년 약정", bundleMonthlyFee: 67950, bundleBenefits: ["상품권 42만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-31", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 200M", internetSpeed: "200Mbps", tvName: "프리미엄", term: "3년 약정", bundleMonthlyFee: 49200, bundleBenefits: ["상품권 29만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-32", mnoCarrier: "LGU+", internetName: "프리미엄 안심 보상 500M", internetSpeed: "500Mbps", tvName: "프리미엄 디즈니(+)", term: "3년 약정", bundleMonthlyFee: 63800, bundleBenefits: ["상품권 39만원 증정", "결합 시 15만원 추가 상품권"] },
  { id: "lgu-home-33", mnoCarrier: "LGU+", internetName: "너겟 라이트 100M", internetSpeed: "100Mbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 38530, bundleBenefits: ["상품권 29만원 증정", "인터넷 5년 약정, IPTV 3년 약정 기준"] },
  { id: "lgu-home-34", mnoCarrier: "LGU+", internetName: "너겟 라이트 500M", internetSpeed: "500Mbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 42680, bundleBenefits: ["상품권 39만원 증정", "인터넷 5년 약정, IPTV 3년 약정 기준"] },
  { id: "lgu-home-35", mnoCarrier: "LGU+", internetName: "너겟 라이트 1G", internetSpeed: "1Gbps", tvName: "실속형", term: "3년 약정", bundleMonthlyFee: 47630, bundleBenefits: ["상품권 42만원 증정", "인터넷 5년 약정, IPTV 3년 약정 기준"] }
];

// 5. 최종 결합 계산 결과 인터페이스
export interface EyagiBundleTotalResult {
  mvnoCarrier: string;         // 이야기 SKT 또는 이야기 LGU+
  mnoCarrier: string;          // 연동 3사 (SKT 또는 LGU+)

  // 모바일 정보
  mobilePlanName: string;
  mobilePrice: number;
  data: string;
  call: string;
  sms: string;

  // 인터넷 + TV 정보
  internetName: string;
  tvName: string;
  term: string;
  homeBundlePrice: number;

  // 할인 및 총합
  discountAmount: number;      // 추가 할인액
  totalPrice: number;          // 총 금액 = (모바일 + 인터넷/TV) - 할인액
  bundleBenefits: string[];
}