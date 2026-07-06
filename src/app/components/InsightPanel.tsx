import React from "react";
import { Check, TrendingDown, Target, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ChecklistItem {
  id: string;
  text: string;
  savings: number;
  done: boolean;
  category: string;
}

interface InsightPanelProps {
  checklist: ChecklistItem[];
  onToggleCheck: (id: string) => void;
}

const fmt = (n: number) => n.toLocaleString("ko-KR");

export default function InsightPanel({ checklist, onToggleCheck }: InsightPanelProps) {
  // Calculate savings
  const totalPotential = checklist.reduce((acc, item) => acc + item.savings, 0);
  const totalAchieved = checklist.filter((item) => item.done).reduce((acc, item) => acc + item.savings, 0);
  
  // Calculate rationality score (starts at 75, max 98)
  const totalCount = checklist.length;
  const doneCount = checklist.filter((item) => item.done).length;
  const rationalityScore = totalCount === 0 ? 75 : 75 + Math.round((doneCount / totalCount) * 23);

  // Dynamic monthly spend data (current month's spend decreases by achieved savings!)
  const monthlySpendData = [
    { month: "3월", spend: 1420000 },
    { month: "4월", spend: 1380000 },
    { month: "5월", spend: 1290000 },
    { month: "6월", spend: 1150000 - totalAchieved },
  ];

  return (
    <aside className="w-[340px] bg-card border-l border-border flex flex-col h-full overflow-y-auto select-none">
      {/* Panel Header */}
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Target className="text-accent" size={18} />
        <h3 className="text-sm font-black text-primary">실시간 진단 요약</h3>
      </div>

      {/* Savings Summary Hero */}
      <div className="p-5 border-b border-border space-y-4">
        <div className="bg-gradient-to-br from-primary to-primary-foreground text-white rounded-2xl p-4 relative overflow-hidden shadow-md">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-1">
              <Zap size={12} className="text-yellow-300 fill-yellow-300" />
              <span className="text-[10px] text-white/70 font-bold">목표 절약 현황</span>
            </div>
            
            <div>
              <span className="text-[10px] text-white/60 block">오늘까지 달성한 월 절감액</span>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-black">{fmt(totalAchieved)}</span>
                <span className="text-xs font-bold">원 / 월</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px] text-white/75">
              <span>연간 환산 절약액</span>
              <span className="font-black text-accent">{fmt(totalAchieved * 12)}원</span>
            </div>

            <div className="text-[10px] text-white/50">
              총 잠재 절약 가능액: {fmt(totalPotential)}원/월
            </div>
          </div>
        </div>

        {/* Rationality Score Widget */}
        <div className="space-y-1.5 bg-muted/30 p-4 rounded-2xl border border-border/50">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-primary">소비 합리성 점수</span>
            <span className="font-black text-accent">{rationalityScore}점</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${(rationalityScore / 100) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground block">
            {doneCount === totalCount && totalCount > 0
              ? "🎉 완벽해요! 모든 절약 액션을 실행했습니다."
              : `할 일 ${totalCount - doneCount}개를 완료하면 점수가 올라갑니다.`}
          </span>
        </div>
      </div>

      {/* Today's Checklist */}
      <div className="p-5 border-b border-border flex-1 flex flex-col min-h-[220px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-primary">오늘 바로 할 일</span>
          <span className="text-[10px] text-accent font-bold">
            {doneCount}/{totalCount} 완료
          </span>
        </div>

        {checklist.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-muted/10 rounded-2xl border border-dashed border-border/75">
            <span className="text-2xl mb-1.5">📝</span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              채팅창에서 진단을 시작하면<br />
              해야 할 일 리스트가 여기에 나타나요.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {checklist.map((item) => (
              <button
                key={item.id}
                onClick={() => onToggleCheck(item.id)}
                className={`w-full flex items-center gap-3 text-left p-3 rounded-xl border transition-all ${
                  item.done
                    ? "bg-muted/30 border-border/40 text-muted-foreground"
                    : "bg-card hover:bg-secondary/40 border-border text-primary"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                    item.done ? "bg-accent border-accent text-white" : "border-muted-foreground bg-card"
                  }`}
                >
                  {item.done && <Check size={10} strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug truncate ${item.done ? "line-through" : "font-semibold"}`}>
                    {item.text}
                  </p>
                  <span className="text-[9px] text-muted-foreground block mt-0.5">
                    {item.category}
                  </span>
                </div>
                <span className={`text-[10px] font-bold whitespace-nowrap ${item.done ? "text-accent" : "text-muted-foreground"}`}>
                  +{fmt(item.savings)}원
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Spending Trend Chart */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-primary">월별 지출 추이</span>
          <div className="flex items-center gap-1 text-[9px] text-accent font-bold">
            <TrendingDown size={12} />
            <span>지출 하향 곡선</span>
          </div>
        </div>

        <div style={{ height: "100px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlySpendData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="panelSpendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B87A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00B87A" stopOpacity={0} />
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
                formatter={(v: number) => [`${fmt(v)}원`, "지출"]}
                contentStyle={{ fontSize: "9px", borderRadius: "6px" }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#00B87A"
                strokeWidth={2}
                fill="url(#panelSpendGrad)"
                dot={{ fill: "#00B87A", r: 2 }}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </aside>
  );
}
