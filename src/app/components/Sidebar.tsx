import React from "react";
import { MessageSquare, Plus, Settings, User } from "lucide-react";

interface RecentDiagnostic {
  id: string;
  icon: string;
  title: string;
  result: string;
  date: string;
  type: "product" | "fixed";
}

interface SidebarProps {
  recentDiagnostics: RecentDiagnostic[];
  onNewDiagnosis: () => void;
  onSelectHistory: (id: string) => void;
  activeHistoryId: string | null;
}

export default function Sidebar({
  recentDiagnostics,
  onNewDiagnosis,
  onSelectHistory,
  activeHistoryId,
}: SidebarProps) {
  return (
    <aside className="w-[280px] bg-primary text-white flex flex-col h-full border-r border-primary/20 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-baseline gap-1 cursor-pointer" onClick={onNewDiagnosis}>
          <span className="text-2xl font-black text-white">모</span>
          <span className="text-2xl font-black text-accent">잇</span>
          <span className="ml-1.5 text-xs font-black text-white/50 tracking-widest">MOIT</span>
        </div>
        <span className="bg-accent/20 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full border border-accent/30">
          AI Coach
        </span>
      </div>

      {/* Action Button */}
      <div className="p-4">
        <button
          onClick={onNewDiagnosis}
          className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>새로운 진단 시작</span>
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <p className="text-[11px] font-bold text-white/40 px-3 py-2 uppercase tracking-wider">
          최근 진단 내역
        </p>
        {recentDiagnostics.length === 0 ? (
          <p className="text-xs text-white/30 px-3 py-4 text-center">진단 내역이 없습니다.</p>
        ) : (
          recentDiagnostics.map((item) => {
            const isActive = activeHistoryId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectHistory(item.id)}
                className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all ${
                  isActive
                    ? "bg-white/15 text-white font-bold"
                    : "hover:bg-white/5 text-white/70 hover:text-white"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-base flex-shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{item.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-accent font-semibold">{item.result}</span>
                    <span className="text-[9px] text-white/40">{item.date}</span>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-white/10 bg-black/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-accent text-sm font-black border border-white/15">
            김
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">김지윤 님</p>
            <p className="text-[10px] text-white/50 truncate">합리적인 소비 요정</p>
          </div>
          <button className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
