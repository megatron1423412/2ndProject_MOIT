import { useState } from "react";
import {
  Home, BarChart3, FileText, Star, TrendingDown, TrendingUp,
  Check, ShoppingBag, ArrowLeft, Bell, AlertCircle,
  Zap, ChevronDown, ChevronUp, Wifi,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | "home"
  | "product-input"
  | "product-results"
  | "product-detail"
  | "fixed"
  | "report";
type Tab = "home" | "product" | "fixed" | "report";
type Badge = "buy" | "wait" | "alt";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  avgPrice: number;
  rating: number;
  reviews: number;
  reviewSummary: string;
  valueScore: number;
  badge: Badge;
  discount: number;
  brand: string;
  pros: string[];
  cons: string[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "notebook", label: "노트북", emoji: "💻" },
  { id: "phone", label: "스마트폰", emoji: "📱" },
  { id: "appliance", label: "가전제품", emoji: "🏠" },
  { id: "fashion", label: "패션/의류", emoji: "👕" },
  { id: "beauty", label: "뷰티", emoji: "💄" },
  { id: "food", label: "식품", emoji: "🛒" },
  { id: "sports", label: "스포츠", emoji: "⚽" },
  { id: "furniture", label: "가구", emoji: "🪑" },
];

const BUDGETS = ["30만원 이하", "50만원", "100만원", "150만원", "200만원", "제한없음"];

const PRODUCTS: Product[] = [
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

const PRICE_HISTORY = [
  { month: "1월", price: 1750000 },
  { month: "2월", price: 1820000 },
  { month: "3월", price: 1680000 },
  { month: "4월", price: 1580000 },
  { month: "5월", price: 1620000 },
  { month: "6월", price: 1489000 },
];

const FIXED_CATS = [
  { id: "telecom", label: "통신비", emoji: "📱", desc: "LTE/5G 요금제", savings: 23000, tipTitle: "요금제 최적화" },
  { id: "utility", label: "공과금", emoji: "⚡", desc: "전기·가스·수도", savings: 18000, tipTitle: "에너지 절약" },
  { id: "subscription", label: "구독 서비스", emoji: "📺", desc: "OTT·음악·앱", savings: 32000, tipTitle: "구독 정리" },
  { id: "insurance", label: "보험료", emoji: "🛡️", desc: "생명·의료·자동차", savings: 45000, tipTitle: "보험 재검토" },
  { id: "card", label: "카드 연회비", emoji: "💳", desc: "신용·체크카드", savings: 15000, tipTitle: "카드 혜택 정리" },
  { id: "rent", label: "월세·관리비", emoji: "🏠", desc: "주거 고정비", savings: 80000, tipTitle: "주거비 절감" },
];

const QUICK_AMOUNTS: Record<string, number[]> = {
  telecom: [29000, 45000, 69000, 89000, 110000],
  utility: [30000, 60000, 90000, 120000, 180000],
  subscription: [9900, 19900, 29900, 49900, 79900],
  insurance: [50000, 100000, 150000, 200000, 300000],
  card: [10000, 20000, 30000, 50000, 100000],
  rent: [300000, 500000, 700000, 1000000, 1500000],
};

const SAVINGS_TIPS: Record<string, string[]> = {
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

const RECENT_DIAGNOSTICS = [
  { icon: "💻", title: "노트북 구매 진단", result: "87,600원 절약", date: "2일 전" },
  { icon: "📱", title: "통신비 다이어트", result: "월 23,000원 절감", date: "5일 전" },
  { icon: "📺", title: "구독 서비스 정리", result: "월 32,000원 절감", date: "1주 전" },
];

const MONTHLY_SPEND = [
  { month: "3월", spend: 1420000 },
  { month: "4월", spend: 1380000 },
  { month: "5월", spend: 1290000 },
  { month: "6월", spend: 1150000 },
];

const REPORT_ACTIONS = [
  { done: true, text: "통신비 알뜰폰 전환", savings: 23000 },
  { done: true, text: "OTT 구독 1개 해지", savings: 14900 },
  { done: false, text: "중복 보험 항목 정리", savings: 45000 },
  { done: false, text: "노트북 가성비 구매", savings: 87600 },
  { done: false, text: "카드 연회비 재점검", savings: 15000 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("ko-KR");

function BadgeLabel({ badge }: { badge: Badge }) {
  const map = {
    buy: { text: "지금 사도 됨 ✓", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
    wait: { text: "기다리기 ⏳", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
    alt: { text: "대안 추천 →", cls: "bg-sky-100 text-sky-700 border border-sky-200" },
  };
  const { text, cls } = map[badge];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={9}
          className={
            i <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}</span>
    </div>
  );
}

function ValueScore({ score }: { score: number }) {
  const bg =
    score >= 90 ? "bg-emerald-500" : score >= 85 ? "bg-sky-500" : "bg-amber-500";
  return (
    <span className={`${bg} text-white text-xs font-black px-2 py-0.5 rounded-lg`}>
      {score}점
    </span>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

function HomeScreen({ onNav }: { onNav: (s: Screen, t?: Tab) => void }) {
  return (
    <div className="px-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-5 pb-6">
        <div>
          <div className="flex items-baseline gap-0.5 mb-0.5">
            <span className="text-2xl font-black" style={{ color: "#1B3A5C" }}>모</span>
            <span className="text-2xl font-black text-accent">잇</span>
            <span className="ml-1 text-xs font-bold text-muted-foreground tracking-widest">MOIT</span>
          </div>
          <p className="text-sm text-muted-foreground">안녕하세요, 김지윤님 👋</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="relative p-2 rounded-full bg-card shadow-sm border border-border">
            <Bell size={17} style={{ color: "#1B3A5C" }} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
          </button>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black"
            style={{ background: "linear-gradient(135deg, #1B3A5C, #2563EB)" }}
          >
            김
          </div>
        </div>
      </div>

      {/* Savings Hero */}
      <div
        className="rounded-3xl p-5 mb-4 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #1e4d8c 55%, #0a6644 100%)" }}
      >
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute right-4 bottom-4 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={13} className="text-yellow-300" />
            <p className="text-white/70 text-xs font-semibold">오늘 절약 가능 금액</p>
          </div>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-4xl font-black tracking-tight">237,000</span>
            <span className="text-lg font-bold">원</span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
              <p className="text-white/60 text-xs mb-0.5">상품 진단</p>
              <p className="text-white font-black text-sm">148,000원</p>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
              <p className="text-white/60 text-xs mb-0.5">고정비 절감</p>
              <p className="text-white font-black text-sm">89,000원</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          onClick={() => onNav("product-input", "product")}
          className="bg-card rounded-2xl p-4 text-left shadow-sm border border-border active:scale-95 transition-transform"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl"
            style={{ background: "#EEF4FF" }}
          >
            🛍️
          </div>
          <p className="font-black text-sm leading-tight mb-1.5" style={{ color: "#1B3A5C" }}>
            새 상품<br />구매 진단
          </p>
          <p className="text-xs text-muted-foreground leading-snug">
            AI가 최고 가성비 상품을 골라드려요
          </p>
        </button>
        <button
          onClick={() => onNav("fixed", "fixed")}
          className="rounded-2xl p-4 text-left text-white active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #00B87A, #059669)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-xl bg-white/20">
            💰
          </div>
          <p className="font-black text-sm leading-tight mb-1.5">
            고정비<br />다이어트
          </p>
          <p className="text-xs text-white/70 leading-snug">
            매달 빠져나가는 돈 줄이기
          </p>
        </button>
      </div>

      {/* Recent Diagnostics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm" style={{ color: "#1B3A5C" }}>
            최근 진단 리포트
          </h3>
          <button className="text-xs text-accent font-bold">전체보기</button>
        </div>
        <div className="flex flex-col gap-2">
          {RECENT_DIAGNOSTICS.map((item, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-3.5 flex items-center gap-3 shadow-sm border border-border"
            >
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: "#1B3A5C" }}>
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.date}</p>
              </div>
              <p className="text-sm font-black text-accent whitespace-nowrap">{item.result}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Product Input ─────────────────────────────────────────────────────────────

function ProductInputScreen({ onNav }: { onNav: (s: Screen, t?: Tab) => void }) {
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [purpose, setPurpose] = useState("");
  const canAnalyze = !!category && !!budget;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-background">
        <div className="flex items-center gap-2 mb-0.5">
          <button onClick={() => onNav("home", "home")} className="p-1 -ml-1">
            <ArrowLeft size={21} style={{ color: "#1B3A5C" }} />
          </button>
          <h1 className="text-base font-black" style={{ color: "#1B3A5C" }}>
            상품 구매 진단
          </h1>
        </div>
        <p className="text-xs text-muted-foreground ml-7">
          카테고리와 예산을 알려주시면 AI가 최적 상품을 찾아드려요
        </p>
      </div>

      <div className="px-5 pb-8 pt-2">
        {/* Category */}
        <div className="mb-5">
          <label className="text-sm font-black mb-2.5 block" style={{ color: "#1B3A5C" }}>
            카테고리 선택
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border-2 transition-all ${
                  category === cat.id
                    ? "border-accent bg-emerald-50"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span
                  className="text-xs font-semibold leading-tight text-center"
                  style={{ color: category === cat.id ? "#059669" : "#6B7A9A" }}
                >
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="mb-5">
          <label className="text-sm font-black mb-2.5 block" style={{ color: "#1B3A5C" }}>
            예산 범위
          </label>
          <div className="flex flex-wrap gap-2">
            {BUDGETS.map((b) => (
              <button
                key={b}
                onClick={() => setBudget(b)}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                  budget === b
                    ? "border-accent bg-accent text-white"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Purpose */}
        <div className="mb-6">
          <label className="text-sm font-black mb-2.5 block" style={{ color: "#1B3A5C" }}>
            사용 목적{" "}
            <span className="text-muted-foreground font-normal">(선택)</span>
          </label>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="예: 대학원 논문 작업, 영상 편집, 가벼운 인터넷 사용..."
            className="w-full bg-card border-2 border-border rounded-2xl p-4 text-sm resize-none focus:outline-none focus:border-accent transition-colors placeholder:text-muted-foreground"
            style={{ color: "#1B3A5C", minHeight: "76px" }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={() => canAnalyze && onNav("product-results")}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
            canAnalyze
              ? "text-white active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
          style={
            canAnalyze
              ? { background: "linear-gradient(135deg, #1B3A5C, #2563EB)" }
              : {}
          }
        >
          {canAnalyze ? "✨ AI 분석 시작하기" : "카테고리와 예산을 선택해주세요"}
        </button>
      </div>
    </div>
  );
}

// ─── Product Results ───────────────────────────────────────────────────────────

function ProductResultsScreen({
  onNav,
  onSelectProduct,
}: {
  onNav: (s: Screen, t?: Tab) => void;
  onSelectProduct: (p: Product) => void;
}) {
  const rankColors = ["#F59E0B", "#94A3B8", "#B45309"];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-background border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => onNav("product-input", "product")} className="p-1 -ml-1">
            <ArrowLeft size={21} style={{ color: "#1B3A5C" }} />
          </button>
          <div>
            <h1 className="text-base font-black" style={{ color: "#1B3A5C" }}>
              AI 추천 Top {PRODUCTS.length}
            </h1>
            <p className="text-xs text-muted-foreground">노트북 · 100만원 이하</p>
          </div>
        </div>
        <div className="ml-7 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
          <Zap size={11} className="text-accent" />
          <span className="text-xs font-bold text-emerald-700">
            AI 분석 완료 · 리뷰 {(3200).toLocaleString()}개 반영
          </span>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        {PRODUCTS.map((product, index) => (
          <button
            key={product.id}
            onClick={() => {
              onSelectProduct(product);
              onNav("product-detail");
            }}
            className="bg-card rounded-2xl p-4 text-left shadow-sm border border-border active:scale-[0.98] transition-transform w-full"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                  style={{
                    background: rankColors[index] ?? "#1B3A5C",
                  }}
                >
                  {index + 1}
                </div>
                <span className="text-xs text-muted-foreground font-semibold">
                  {product.brand}
                </span>
              </div>
              <ValueScore score={product.valueScore} />
            </div>

            <p className="font-black text-sm mb-2 leading-snug" style={{ color: "#1B3A5C" }}>
              {product.name}
            </p>

            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <BadgeLabel badge={product.badge} />
              {product.discount > 0 && (
                <span className="text-xs font-black text-red-500">
                  {product.discount}% 할인
                </span>
              )}
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-black" style={{ color: "#1B3A5C" }}>
                  {fmt(product.price)}원
                </p>
                {product.originalPrice > product.price && (
                  <p className="text-xs text-muted-foreground line-through">
                    {fmt(product.originalPrice)}원
                  </p>
                )}
              </div>
              <StarRow rating={product.rating} />
            </div>

            <div className="mt-2.5 pt-2.5 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {product.reviewSummary}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Product Detail ────────────────────────────────────────────────────────────

function ProductDetailScreen({
  product,
  onNav,
}: {
  product: Product;
  onNav: (s: Screen, t?: Tab) => void;
}) {
  const diff = product.avgPrice - product.price;
  const pct = Math.round(Math.abs(diff / product.avgPrice) * 100);
  const cheaper = diff > 0;

  const savingTips = [
    {
      label: "카드 할인",
      tip: `삼성카드 결제 시 최대 ${fmt(Math.round(product.price * 0.1))}원 청구할인`,
      icon: "💳",
    },
    {
      label: "포인트 적립",
      tip: "OK캐쉬백 2% + 네이버페이 1.5% 적립 가능",
      icon: "🎁",
    },
    {
      label: "중고 시세",
      tip: `당근마켓 기준 ${fmt(Math.round(product.price * 0.6))}~${fmt(Math.round(product.price * 0.75))}원 (6개월 사용)`,
      icon: "♻️",
    },
    {
      label: "공동구매",
      tip: "네이버 쇼핑라이브 공구 참여 시 추가 5% 할인",
      icon: "👥",
    },
    {
      label: "쇼핑몰 비교",
      tip: "쿠팡 vs 11번가 vs G마켓 비교 → G마켓 최저가",
      icon: "🏪",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <button onClick={() => onNav("product-results", "product")} className="p-1 -ml-1">
            <ArrowLeft size={21} style={{ color: "#1B3A5C" }} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black truncate" style={{ color: "#1B3A5C" }}>
              {product.name}
            </h1>
            <StarRow rating={product.rating} />
          </div>
          <ValueScore score={product.valueScore} />
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4 pb-8">
        {/* Price Card */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">현재 최저가</p>
              <p className="text-2xl font-black" style={{ color: "#1B3A5C" }}>
                {fmt(product.price)}원
              </p>
            </div>
            <div className="text-right">
              <div
                className={`flex items-center gap-1 justify-end mb-0.5 ${
                  cheaper ? "text-accent" : "text-red-500"
                }`}
              >
                {cheaper ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                <span className="text-sm font-black">{fmt(Math.abs(diff))}원</span>
              </div>
              <p
                className={`text-xs font-bold ${cheaper ? "text-accent" : "text-red-500"}`}
              >
                {cheaper ? `평균보다 ${pct}% 저렴` : `평균보다 ${pct}% 비쌈`}
              </p>
              <p className="text-xs text-muted-foreground">평균 {fmt(product.avgPrice)}원</p>
            </div>
          </div>
          <BadgeLabel badge={product.badge} />
        </div>

        {/* Price Chart */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-sm" style={{ color: "#1B3A5C" }}>
              6개월 가격 추이
            </h3>
            <span className="text-xs font-bold text-accent">↓ 역대 최저가</span>
          </div>
          <div style={{ height: "140px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={PRICE_HISTORY}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "#6B7A9A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#6B7A9A" }}
                  tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [`${fmt(v)}원`, "가격"]}
                  contentStyle={{
                    fontSize: "12px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <ReferenceLine
                  y={product.avgPrice}
                  stroke="#00B87A"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: "평균",
                    position: "insideTopRight",
                    fontSize: 9,
                    fill: "#00B87A",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#1B3A5C"
                  strokeWidth={2.5}
                  fill="url(#priceGrad)"
                  dot={{ fill: "#1B3A5C", r: 3 }}
                  activeDot={{ r: 5, fill: "#1B3A5C" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pros / Cons */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-100">
            <p className="text-xs font-black text-emerald-700 mb-2">장점</p>
            {product.pros.map((p, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1.5 last:mb-0">
                <Check size={10} className="text-accent flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900 leading-tight">{p}</p>
              </div>
            ))}
          </div>
          <div className="bg-orange-50 rounded-2xl p-3.5 border border-orange-100">
            <p className="text-xs font-black text-orange-700 mb-2">단점</p>
            {product.cons.map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 mb-1.5 last:mb-0">
                <AlertCircle size={10} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-orange-900 leading-tight">{c}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Savings Tips */}
        <div>
          <h3 className="font-black text-sm mb-3" style={{ color: "#1B3A5C" }}>
            💡 싸게 사는 방법
          </h3>
          <div className="flex flex-col gap-2">
            {savingTips.map((tip, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl p-3.5 border border-border shadow-sm flex items-start gap-3"
              >
                <span className="text-lg flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="text-xs font-black mb-0.5" style={{ color: "#1B3A5C" }}>
                    {tip.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="w-full py-4 rounded-2xl font-black text-base text-white active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #00B87A, #059669)" }}
        >
          최저가로 구매하러 가기 →
        </button>
      </div>
    </div>
  );
}

// ─── Fixed Cost Screen ─────────────────────────────────────────────────────────

function FixedCostScreen({ onNav }: { onNav: (s: Screen, t?: Tab) => void }) {
  const [step, setStep] = useState<"select" | "amounts" | "results">("select");
  const [selected, setSelected] = useState<string[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [openTip, setOpenTip] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectedCats = FIXED_CATS.filter((c) => selected.includes(c.id));
  const totalSavings = selectedCats.reduce((acc, c) => acc + c.savings, 0);
  const totalCurrent = selectedCats.reduce(
    (acc, c) => acc + (amounts[c.id] ?? c.savings * 4),
    0
  );

  if (step === "results") {
    return (
      <div className="flex flex-col">
        <div className="px-5 pt-4 pb-3 bg-background border-b border-border">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("select")} className="p-1 -ml-1">
              <ArrowLeft size={21} style={{ color: "#1B3A5C" }} />
            </button>
            <h1 className="text-base font-black" style={{ color: "#1B3A5C" }}>
              절약 분석 결과
            </h1>
          </div>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 pb-8">
          {/* Result Hero */}
          <div
            className="rounded-3xl p-5 text-white relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #00B87A, #059669)" }}
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
            <div className="relative z-10">
              <p className="text-white/75 text-xs mb-1 font-semibold">예상 월 절감액</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black">{fmt(totalSavings)}</span>
                <span className="text-lg font-bold">원</span>
              </div>
              <p className="text-white/75 text-sm">
                연간{" "}
                <span className="text-white font-black">{fmt(totalSavings * 12)}원</span>{" "}
                절약 가능
              </p>
              <div className="mt-3 pt-3 border-t border-white/20 flex gap-4">
                <div>
                  <p className="text-white/60 text-xs">현재 지출</p>
                  <p className="text-white font-bold text-sm">{fmt(totalCurrent)}원/월</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">절약 후</p>
                  <p className="text-white font-bold text-sm">
                    {fmt(totalCurrent - totalSavings)}원/월
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Per-category */}
          <div>
            <h3 className="font-black text-sm mb-3" style={{ color: "#1B3A5C" }}>
              항목별 절약 방법
            </h3>
            <div className="flex flex-col gap-2">
              {selectedCats.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setOpenTip(openTip === cat.id ? null : cat.id)
                    }
                    className="w-full flex items-center gap-3 p-4"
                  >
                    <span className="text-xl">{cat.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="font-black text-sm" style={{ color: "#1B3A5C" }}>
                        {cat.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{cat.tipTitle}</p>
                    </div>
                    <p className="text-sm font-black text-accent mr-2">
                      월 -{fmt(cat.savings)}원
                    </p>
                    {openTip === cat.id ? (
                      <ChevronUp size={15} className="text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown size={15} className="text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  {openTip === cat.id && (
                    <div className="px-4 pb-4 pt-0 bg-muted/30 border-t border-border">
                      <div className="flex flex-col gap-1.5 pt-3">
                        {(SAVINGS_TIPS[cat.id] ?? []).map((tip, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-accent font-bold text-xs mt-0.5 flex-shrink-0">
                              →
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-muted/40 rounded-2xl p-4 border border-border">
            <h3 className="font-black text-sm mb-3" style={{ color: "#1B3A5C" }}>
              지금 바로 할 일
            </h3>
            {selectedCats.map((cat, i) => (
              <div key={i} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
                <div className="w-5 h-5 rounded border-2 border-accent flex-shrink-0" />
                <p className="text-sm" style={{ color: "#1B3A5C" }}>
                  {cat.tipTitle} 실행하기
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "amounts") {
    return (
      <div className="flex flex-col">
        <div className="px-5 pt-4 pb-3 bg-background border-b border-border">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("select")} className="p-1 -ml-1">
              <ArrowLeft size={21} style={{ color: "#1B3A5C" }} />
            </button>
            <div>
              <h1 className="text-base font-black" style={{ color: "#1B3A5C" }}>
                금액 입력
              </h1>
              <p className="text-xs text-muted-foreground">현재 매달 지출하는 금액</p>
            </div>
          </div>
        </div>
        <div className="px-5 py-4 pb-8">
          <div className="flex flex-col gap-4 mb-6">
            {selectedCats.map((cat) => (
              <div key={cat.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{cat.emoji}</span>
                  <p className="font-black text-sm flex-1" style={{ color: "#1B3A5C" }}>
                    {cat.label}
                  </p>
                  {amounts[cat.id] && (
                    <span className="text-sm font-black text-accent">
                      {fmt(amounts[cat.id])}원
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(QUICK_AMOUNTS[cat.id] ?? []).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAmounts((prev) => ({ ...prev, [cat.id]: a }))}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        amounts[cat.id] === a
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {a >= 10000 ? `${(a / 10000).toFixed(0)}만` : fmt(a)}원
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep("results")}
            className="w-full py-4 rounded-2xl font-black text-base text-white active:scale-95 transition-transform"
            style={{ background: "linear-gradient(135deg, #00B87A, #059669)" }}
          >
            💰 절약 분석 시작
          </button>
        </div>
      </div>
    );
  }

  // select step
  return (
    <div className="flex flex-col">
      <div className="px-5 pt-4 pb-3 bg-background">
        <div className="flex items-center gap-2 mb-0.5">
          <button onClick={() => onNav("home", "home")} className="p-1 -ml-1">
            <ArrowLeft size={21} style={{ color: "#1B3A5C" }} />
          </button>
          <h1 className="text-base font-black" style={{ color: "#1B3A5C" }}>
            고정비 다이어트
          </h1>
        </div>
        <p className="text-xs text-muted-foreground ml-7">
          진단받을 고정비 항목을 선택해주세요
        </p>
      </div>
      <div className="px-5 pb-8 pt-3">
        <div className="flex flex-col gap-2.5 mb-6">
          {FIXED_CATS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                selected.includes(cat.id)
                  ? "border-accent bg-emerald-50"
                  : "border-border bg-card"
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <div className="flex-1">
                <p className="font-black text-sm" style={{ color: "#1B3A5C" }}>
                  {cat.label}
                </p>
                <p className="text-xs text-muted-foreground">{cat.desc}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selected.includes(cat.id)
                    ? "border-accent bg-accent"
                    : "border-muted-foreground"
                }`}
              >
                {selected.includes(cat.id) && (
                  <Check size={11} className="text-white" />
                )}
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={() => selected.length > 0 && setStep("amounts")}
          className={`w-full py-4 rounded-2xl font-black text-base transition-all ${
            selected.length > 0
              ? "text-white active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
          style={
            selected.length > 0
              ? { background: "linear-gradient(135deg, #1B3A5C, #2563EB)" }
              : {}
          }
        >
          {selected.length > 0
            ? `${selected.length}개 항목 분석하기 →`
            : "항목을 선택해주세요"}
        </button>
      </div>
    </div>
  );
}

// ─── Report Screen ─────────────────────────────────────────────────────────────

function ReportScreen() {
  const doneAmount = REPORT_ACTIONS.filter((a) => a.done).reduce(
    (acc, a) => acc + a.savings,
    0
  );
  const pendingAmount = REPORT_ACTIONS.filter((a) => !a.done).reduce(
    (acc, a) => acc + a.savings,
    0
  );
  const [checkedItems, setCheckedItems] = useState<number[]>([0, 1]);

  const toggleCheck = (i: number) =>
    setCheckedItems((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  return (
    <div className="px-5 pb-8">
      <div className="pt-5 pb-5">
        <h1 className="text-xl font-black" style={{ color: "#1B3A5C" }}>
          절약 리포트
        </h1>
        <p className="text-xs text-muted-foreground">2026년 7월 기준</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
          <p className="text-xs text-muted-foreground mb-1">이미 절약 중</p>
          <p className="text-2xl font-black text-accent">{fmt(doneAmount)}원</p>
          <p className="text-xs text-muted-foreground">/ 월</p>
        </div>
        <div
          className="rounded-2xl p-4 text-white"
          style={{ background: "linear-gradient(135deg, #1B3A5C, #2563EB)" }}
        >
          <p className="text-xs text-white/70 mb-1">추가 절약 가능</p>
          <p className="text-2xl font-black">{fmt(pendingAmount)}원</p>
          <p className="text-xs text-white/70">더 줄일 수 있어요</p>
        </div>
      </div>

      {/* Spending trend chart */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm" style={{ color: "#1B3A5C" }}>
            월별 지출 추이
          </h3>
          <div className="flex items-center gap-1">
            <TrendingDown size={13} className="text-accent" />
            <span className="text-xs font-bold text-accent">계속 감소 중</span>
          </div>
        </div>
        <div style={{ height: "120px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={MONTHLY_SPEND}
              margin={{ top: 5, right: 5, left: -28, bottom: 0 }}
            >
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B87A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00B87A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10, fill: "#6B7A9A" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#6B7A9A" }}
                tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${fmt(v)}원`, "지출"]}
                contentStyle={{
                  fontSize: "12px",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#00B87A"
                strokeWidth={2.5}
                fill="url(#spendGrad)"
                dot={{ fill: "#00B87A", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            3개월간{" "}
            <span className="text-accent font-black">{fmt(270000)}원</span> 절약
            달성! 🎉
          </p>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-sm" style={{ color: "#1B3A5C" }}>
            절약 액션 체크리스트
          </h3>
          <span className="text-xs text-accent font-bold">
            {checkedItems.length}/{REPORT_ACTIONS.length} 완료
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {REPORT_ACTIONS.map((action, i) => {
            const done = checkedItems.includes(i);
            return (
              <button
                key={i}
                onClick={() => toggleCheck(i)}
                className="flex items-center gap-3 text-left"
              >
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                    done ? "border-accent bg-accent" : "border-muted-foreground"
                  }`}
                >
                  {done && <Check size={10} className="text-white" />}
                </div>
                <p
                  className={`text-sm flex-1 ${
                    done ? "line-through text-muted-foreground" : ""
                  }`}
                  style={!done ? { color: "#1B3A5C" } : {}}
                >
                  {action.text}
                </p>
                <span
                  className={`text-xs font-black ${
                    done ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {fmt(action.savings)}원
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Annual projection */}
      <div
        className="rounded-2xl p-5 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #00B87A 0%, #1B3A5C 100%)" }}
      >
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="relative z-10">
          <p className="text-white/75 text-xs mb-1 font-semibold">
            모든 액션 완료 시 연간 절약액
          </p>
          <p className="text-3xl font-black mb-1">
            {fmt((doneAmount + pendingAmount) * 12)}원
          </p>
          <p className="text-white/70 text-sm">
            ☕ 스타벅스 라떼{" "}
            {Math.floor(((doneAmount + pendingAmount) * 12) / 6500).toLocaleString()}잔
            값이에요!
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Bottom Nav ────────────────────────────────────────────────────────────────

function BottomNav({
  tab,
  onNav,
}: {
  tab: Tab;
  onNav: (s: Screen, t: Tab) => void;
}) {
  const items: { id: Tab; label: string; icon: typeof Home; screen: Screen }[] = [
    { id: "home", label: "홈", icon: Home, screen: "home" },
    { id: "product", label: "상품진단", icon: ShoppingBag, screen: "product-input" },
    { id: "fixed", label: "고정비", icon: BarChart3, screen: "fixed" },
    { id: "report", label: "리포트", icon: FileText, screen: "report" },
  ];

  return (
    <div className="bg-card border-t border-border flex items-center">
      {items.map((item) => {
        const Icon = item.icon;
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNav(item.screen, item.id)}
            className="flex-1 flex flex-col items-center pt-2.5 pb-1 gap-0.5"
          >
            <Icon
              size={22}
              style={{ color: active ? "#00B87A" : "#94A3B8" }}
              strokeWidth={active ? 2.5 : 2}
            />
            <span
              className="text-xs font-bold"
              style={{ color: active ? "#00B87A" : "#94A3B8" }}
            >
              {item.label}
            </span>
            {active && (
              <div className="w-1 h-1 rounded-full bg-accent mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<Tab>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const onNav = (s: Screen, t?: Tab) => {
    setScreen(s);
    if (t) setTab(t);
  };

  const renderScreen = () => {
    switch (screen) {
      case "home":
        return <HomeScreen onNav={onNav} />;
      case "product-input":
        return <ProductInputScreen onNav={onNav} />;
      case "product-results":
        return (
          <ProductResultsScreen
            onNav={onNav}
            onSelectProduct={setSelectedProduct}
          />
        );
      case "product-detail":
        return selectedProduct ? (
          <ProductDetailScreen product={selectedProduct} onNav={onNav} />
        ) : (
          <ProductResultsScreen onNav={onNav} onSelectProduct={setSelectedProduct} />
        );
      case "fixed":
        return <FixedCostScreen onNav={onNav} />;
      case "report":
        return <ReportScreen />;
      default:
        return <HomeScreen onNav={onNav} />;
    }
  };

  return (
    <>
      <style>{`
        @media (min-width: 640px) {
          .phone-shell {
            border-radius: 48px !important;
            box-shadow: 0 0 0 14px #0f172a, 0 50px 100px rgba(0,0,0,0.55) !important;
            max-height: 844px !important;
          }
        }
        ::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>

      <div
        className="flex items-center justify-center min-h-screen w-full"
        style={{ background: "#1e293b" }}
      >
        <div
          className="phone-shell relative w-full sm:w-[390px] flex flex-col overflow-hidden"
          style={{ height: "100dvh", background: "#F2F6FC" }}
        >
          {/* Status bar — only shown as phone chrome on desktop */}
          <div className="hidden sm:flex flex-col items-center bg-card pt-3 pb-0.5 flex-shrink-0">
            <div
              className="w-28 h-7 rounded-full"
              style={{ background: "#0f172a" }}
            />
          </div>
          <div className="hidden sm:flex justify-between items-center px-8 py-1.5 bg-card text-xs font-bold flex-shrink-0">
            <span style={{ color: "#1B3A5C" }}>9:41</span>
            <div className="flex items-center gap-1.5" style={{ color: "#1B3A5C" }}>
              <Wifi size={12} />
              <span>5G</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{ background: "#F2F6FC" }}
          >
            {renderScreen()}
          </div>

          {/* Bottom nav */}
          <div className="flex-shrink-0">
            <BottomNav tab={tab} onNav={onNav} />
          </div>

          {/* Home indicator */}
          <div className="hidden sm:flex justify-center py-2 bg-card flex-shrink-0">
            <div
              className="w-32 h-1 rounded-full"
              style={{ background: "rgba(26,58,92,0.2)" }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
