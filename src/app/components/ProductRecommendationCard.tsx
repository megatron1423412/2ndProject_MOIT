import React, { useState } from "react";
import { Star, Check, AlertCircle, ChevronDown, ChevronUp, TrendingDown, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";

type BadgeType = "buy" | "wait" | "alt";

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
  badge: BadgeType;
  discount: number;
  brand: string;
  pros: string[];
  cons: string[];
}

interface ProductRecommendationCardProps {
  product: Product;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

function BadgeLabel({ badge }: { badge: BadgeType }) {
  const map = {
    buy: { text: "지금 사도 됨 ✓", cls: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
    wait: { text: "기다리기 ⏳", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
    alt: { text: "대안 추천 →", cls: "bg-sky-100 text-sky-700 border border-sky-200" },
  };
  const { text, cls } = map[badge];
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={10}
          className={
            i <= Math.round(rating)
              ? "text-amber-400 fill-amber-400"
              : "text-gray-200 fill-gray-200"
          }
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-1">{rating}</span>
    </div>
  );
}

export default function ProductRecommendationCard({ product }: ProductRecommendationCardProps) {
  const [expanded, setExpanded] = useState(false);

  const diff = product.avgPrice - product.price;
  const pct = Math.round(Math.abs(diff / product.avgPrice) * 100);
  const cheaper = diff > 0;

  // Generate price history based on current price
  const priceHistory = [
    { month: "1월", price: Math.round(product.price * 1.15) },
    { month: "2월", price: Math.round(product.price * 1.20) },
    { month: "3월", price: Math.round(product.price * 1.10) },
    { month: "4월", price: Math.round(product.price * 1.05) },
    { month: "5월", price: Math.round(product.price * 1.08) },
    { month: "6월", price: product.price },
  ];

  // AI one-line reasons based on badge
  const aiReason = {
    buy: "현재 역대 최저가 부근이며, 예산 대비 최고의 성능을 자랑하여 즉시 구매를 강력히 권장합니다.",
    wait: "곧 후속 모델 발표 및 할인 프로모션이 예정되어 있으므로 1~2주 대기 후 구매하시는 것을 추천합니다.",
    alt: "원하시는 기능적 요소를 충족하면서도 약 20만원 더 저렴한 대체 모델을 추천해 드립니다.",
  }[product.badge];

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow w-full max-w-lg mb-2">
      {/* Basic Info Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-1.5">
          <span className="text-xs font-semibold text-muted-foreground">{product.brand}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">합리성 점수:</span>
            <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
              {product.valueScore}점
            </span>
          </div>
        </div>

        <h4 className="font-black text-sm text-primary leading-tight mb-2">
          {product.name}
        </h4>

        <div className="flex items-center gap-2 mb-3">
          <BadgeLabel badge={product.badge} />
          {product.discount > 0 && (
            <span className="text-[10px] font-black text-red-500">{product.discount}% 할인</span>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-primary">{fmt(product.price)}</span>
              <span className="text-xs font-bold text-primary">원</span>
            </div>
            {product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {fmt(product.originalPrice)}원
              </span>
            )}
          </div>
          <StarRow rating={product.rating} />
        </div>

        {/* AI One-line Reason */}
        <div className="mt-3 p-2.5 bg-muted/40 rounded-xl border border-border/50 text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-bold text-primary block mb-0.5">💡 AI 추천 이유</span>
          {aiReason}
        </div>

        {/* Action button to expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2 hover:bg-muted/30 border border-dashed border-border rounded-xl text-xs font-bold text-primary flex items-center justify-center gap-1 transition-colors"
        >
          <span>{expanded ? "상세 분석 접기" : "상세 분석 & 가격 차트 보기"}</span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Expanded detailed analysis */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          {/* Pros & Cons */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
              <p className="text-[11px] font-black text-emerald-700 mb-1.5">장점</p>
              {product.pros.map((p, i) => (
                <div key={i} className="flex items-start gap-1 mb-1 last:mb-0">
                  <Check size={9} className="text-accent flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-900 leading-tight">{p}</p>
                </div>
              ))}
            </div>
            <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100">
              <p className="text-[11px] font-black text-orange-700 mb-1.5">단점</p>
              {product.cons.map((c, i) => (
                <div key={i} className="flex items-start gap-1 mb-1 last:mb-0">
                  <AlertCircle size={9} className="text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-orange-900 leading-tight">{c}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Price History Chart */}
          <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-[11px] text-primary">6개월 가격 추이</h5>
              <div className="flex items-center gap-1 text-[10px]">
                {cheaper ? (
                  <span className="text-accent font-bold">평균가 대비 {pct}% 저렴</span>
                ) : (
                  <span className="text-red-500 font-bold">평균가 대비 {pct}% 비쌈</span>
                )}
              </div>
            </div>
            <div style={{ height: "110px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 8, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 8, fill: "#9ca3af" }}
                    tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${fmt(v)}원`, "가격"]}
                    contentStyle={{ fontSize: "10px", borderRadius: "8px" }}
                  />
                  <ReferenceLine
                    y={product.avgPrice}
                    stroke="#00B87A"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={{
                      value: "평균가",
                      position: "insideTopRight",
                      fontSize: 8,
                      fill: "#00B87A",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#1B3A5C"
                    strokeWidth={2}
                    fill="url(#priceGrad)"
                    dot={{ fill: "#1B3A5C", r: 2.5 }}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
