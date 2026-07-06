export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  avgPrice: number;
  rating: number;
  reviews: number;
  reviewSummary: string;
  valueScore: number;
  badge: "buy" | "wait" | "alt";
  discount: number;
  brand: string;
  pros: string[];
  cons: string[];
}

export interface FixedCat {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  savings: number;
  tipTitle: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "삼성 갤럭시북4 Pro 360",
    price: 1489000,
    originalPrice: 1890000,
    avgPrice: 1650000,
    rating: 4.7,
    reviews: 2341,
    reviewSummary: "배터리 15시간, 가볍고 화면 선명. 발열 거의 없음",
    valueScore: 92,
    badge: "buy",
    discount: 21,
    brand: "삼성",
    pros: ["배터리 15시간", "1.16kg 경량", "AMOLED 터치스크린"],
    cons: ["RAM 16GB 고정", "USB-C 포트 2개"],
  },
  {
    id: 2,
    name: "LG 그램17 2024 Ultra",
    price: 1689000,
    originalPrice: 1899000,
    avgPrice: 1780000,
    rating: 4.6,
    reviews: 1876,
    reviewSummary: "17인치 대화면, 해상도 최고. 무게 1.35kg 아쉬움",
    valueScore: 88,
    badge: "wait",
    discount: 11,
    brand: "LG",
    pros: ["17인치 WQXGA", "배터리 80Wh", "견고한 섀시"],
    cons: ["무게 1.35kg", "발열 있음"],
  },
  {
    id: 3,
    name: "애플 맥북에어 M3 15인치",
    price: 1590000,
    originalPrice: 1590000,
    avgPrice: 1590000,
    rating: 4.9,
    reviews: 4521,
    reviewSummary: "성능 압도적, 배터리 18시간. macOS 호환성 사전 확인 필요",
    valueScore: 85,
    badge: "buy",
    discount: 0,
    brand: "애플",
    pros: ["M3칩 압도적 성능", "배터리 18시간", "무팬 무소음"],
    cons: ["macOS 호환성", "USB-C 2포트"],
  },
  {
    id: 4,
    name: "레노버 ThinkPad X1 Carbon",
    price: 1320000,
    originalPrice: 1650000,
    avgPrice: 1480000,
    rating: 4.5,
    reviews: 987,
    reviewSummary: "업무용 최강, 키감 훌륭. 게임·미디어 용도는 비추",
    valueScore: 90,
    badge: "alt",
    discount: 20,
    brand: "레노버",
    pros: ["비즈니스 최적화", "키보드 키감 최고", "경량 1.12kg"],
    cons: ["그래픽 약함", "화면 밝기 아쉬움"],
  },
  {
    id: 5,
    name: "ASUS 젠북 14 OLED",
    price: 989000,
    originalPrice: 1290000,
    avgPrice: 1100000,
    rating: 4.4,
    reviews: 1203,
    reviewSummary: "OLED 화면 아름다움. 예산 한정 시 최고의 선택",
    valueScore: 87,
    badge: "buy",
    discount: 23,
    brand: "ASUS",
    pros: ["OLED 2.8K 화면", "가성비 최고", "경량 1.39kg"],
    cons: ["RAM 16GB", "발열 약간"],
  },
  {
    id: 6,
    name: "HP 엔비 x360 15 OLED",
    price: 1150000,
    originalPrice: 1350000,
    avgPrice: 1200000,
    rating: 4.3,
    reviews: 756,
    reviewSummary: "OLED 터치스크린, 2-in-1 활용. 배터리 12시간",
    valueScore: 83,
    badge: "alt",
    discount: 15,
    brand: "HP",
    pros: ["2-in-1 태블릿 변환", "OLED 터치", "포트 풍부"],
    cons: ["무게 1.7kg", "팬 소음"],
  },
];

export const CATEGORIES = [
  { id: "notebook", label: "노트북", emoji: "💻" },
  { id: "phone", label: "스마트폰", emoji: "📱" },
  { id: "appliance", label: "가전제품", emoji: "🏠" },
  { id: "fashion", label: "패션/의류", emoji: "👕" },
  { id: "beauty", label: "뷰티", emoji: "💄" },
  { id: "food", label: "식품", emoji: "🛒" },
  { id: "sports", label: "스포츠", emoji: "⚽" },
  { id: "furniture", label: "가구", emoji: "🪑" },
];

export const BUDGETS = ["30만원 이하", "50만원", "100만원", "150만원", "200만원", "제한없음"];

export const FIXED_CATS: FixedCat[] = [
  { id: "telecom", label: "통신비", emoji: "📱", desc: "LTE/5G 요금제", savings: 23000, tipTitle: "요금제 최적화" },
  { id: "utility", label: "공과금", emoji: "⚡", desc: "전기·가스·수도", savings: 18000, tipTitle: "에너지 절약" },
  { id: "subscription", label: "구독 서비스", emoji: "📺", desc: "OTT·음악·앱", savings: 14900, tipTitle: "구독 정리" },
  { id: "insurance", label: "보험료", emoji: "🛡️", desc: "생명·의료·자동차", savings: 45000, tipTitle: "보험 재검토" },
  { id: "card", label: "카드 연회비", emoji: "💳", desc: "신용·체크카드", savings: 15000, tipTitle: "카드 혜택 정리" },
  { id: "rent", label: "월세·관리비", emoji: "🏠", desc: "주거 고정비", savings: 80000, tipTitle: "주거비 절감" },
];

export const QUICK_AMOUNTS: Record<string, number[]> = {
  telecom: [29000, 45000, 69000, 89000, 110000],
  utility: [30000, 60000, 90000, 120000, 180000],
  subscription: [9900, 19900, 29900, 49900, 79900],
  insurance: [50000, 100000, 150000, 200000, 300000],
  card: [10000, 20000, 30000, 50000, 100000],
  rent: [300000, 500000, 700000, 1000000, 1500000],
};

export const SAVINGS_TIPS: Record<string, string[]> = {
  telecom: [
    "알뜰폰으로 전환 시 월 2~3만원 절약 가능",
    "현재 데이터 사용량 확인 후 요금제 다운그레이드",
    "가족 결합 할인 혜택 체크 (최대 50% 할인)",
  ],
  utility: [
    "에너지 효율 1등급 가전 교체 시 연 12만원 절약",
    "스마트 플러그로 대기전력 차단",
    "심야 요금제 활용 (밤 11시~오전 9시 전력 50% 저렴)",
  ],
  subscription: [
    "사용 안 하는 구독 서비스 3개 발견 → 월 2.8만원 절약",
    "넷플릭스+왓챠 중 하나만 선택 시 월 1.7만원 절약",
    "음악 스트리밍: 통신사 결합 상품 이용 시 무료",
  ],
  insurance: [
    "중복 보험 항목 정리 시 월 4.5만원 절약 가능",
    "온라인 전용 상품 전환 시 보험료 20~30% 절감",
    "연납 결제 시 12~15% 할인 적용",
  ],
  card: [
    "연회비 대비 혜택 미달 카드 2장 해지 권장",
    "중복 혜택 카드 통합으로 한 장만 유지",
    "실적 미달 카드는 혜택 없음 → 즉시 해지",
  ],
  rent: [
    "전세 대출 금리 비교로 연 80만원 절약 가능",
    "인근 단지 관리비 비교 시 월 4~8만원 차이",
    "주거급여 수혜 여부 확인 (최대 월 33만원)",
  ],
};
