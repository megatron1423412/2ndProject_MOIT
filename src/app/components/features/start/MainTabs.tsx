import React from "react";

export type MainTab = "start" | "history";

interface MainTabsProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
}

export default function MainTabs({ activeTab, onChange }: MainTabsProps) {
  return (
    <div className="flex items-center gap-8 border-b border-border/60 pb-0.5">
      
      {/* 1. "모잇과 시작하기" 탭 */}
      <button
        type="button"
        onClick={() => onChange("start")}
        className={`relative pb-3 text-lg font-extrabold transition-colors ${
          activeTab === "start"
            ? "border-b-2 border-primary text-primary" /* 활성화: 진한 블루/포인트 컬러 + 밑줄 */
            : "border-b-2 border-transparent text-slate-400 hover:text-slate-600" /* 비활성화: 연한 회색 */
        }`}
      >
        모잇과 시작하기
      </button>

      {/* 2. "모잇과 나눈 대화" 탭 */}
      <button
        type="button"
        onClick={() => onChange("history")}
        className={`relative pb-3 text-lg font-extrabold transition-colors ${
          activeTab === "history"
            ? "border-b-2 border-primary text-primary"
            : "border-b-2 border-transparent text-slate-400 hover:text-slate-600"
        }`}
      >
        모잇과 나눈 대화
      </button>
    </div>
  );
}