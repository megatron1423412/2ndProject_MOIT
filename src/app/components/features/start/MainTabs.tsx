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
        className={`relative pb-3 text-[18px] font-extrabold transition-colors ${activeTab === "start"
          ? "border-b-2 border-[#1F2937] text-[#1F2937]"
          : "border-b-2 border-transparent text-[#9CA3AF] hover:text-[#1F2937]"
          }`}
      >
        모잇과 시작하기
      </button>

      {/* 2. "모잇과 나눈 대화" 탭 */}
      <button
        type="button"
        onClick={() => onChange("history")}
        className={`relative pb-3 text-[18px] font-extrabold transition-colors ${activeTab === "history"
          ? "border-b-2 border-[#1F2937] text-[#1F2937]"
          : "border-b-2 border-transparent text-[#9CA3AF] hover:text-[#1F2937]"
          }`}
      >
        모잇과 나눈 대화
      </button>
    </div>
  );
}