import React from "react";

export type MainTab = "start" | "history";

interface MainTabsProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
}

export default function MainTabs({ activeTab, onChange }: MainTabsProps) {
  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 1: 탭 전체 하단 경계선 및 간격]
       - border-b border-border: 탭 영역 전체 아래에 얇은 회색 구분선 추가
       - gap-8: 두 탭 버튼 사이의 좌우 간격 (gap-6, gap-10 등)
    */
    <div className="flex items-center gap-8 border-b border-border/60 pb-0.5">
      
      {/* 🎨 [프론트엔드 수정 가능 Zone 2: "모잇과 시작하기" 탭 버튼] */}
      <button
        type="button"
        onClick={() => onChange("start")}
        /* 💡 activeTab이 'start'일 때 하단에 2px 두께의 #2A6CB6 색상 언더라인 바를 표시합니다 */
        className={`relative pb-3 text-xl font-bold transition-all ${
          activeTab === "start"
            ? "border-b-2 border-[#2A6CB6] text-[#2A6CB6]" /* 선택됨: 2px 언더라인 + 메인 파란색 글씨 */
            : "border-b-2 border-transparent text-muted-foreground hover:text-foreground" /* 미선택: 투명 밑줄 + 흐린 회색 */
        }`}
      >
        모잇과 시작하기
      </button>

      {/* 🎨 [프론트엔드 수정 가능 Zone 3: "모잇과 나눈 대화" 탭 버튼] */}
      <button
        type="button"
        onClick={() => onChange("history")}
        className={`relative pb-3 text-xl font-bold transition-all ${
          activeTab === "history"
            ? "border-b-2 border-[#2A6CB6] text-[#2A6CB6]" /* 선택됨: 2px 언더라인 + 메인 파란색 글씨 */
            : "border-b-2 border-transparent text-muted-foreground hover:text-foreground" /* 미선택: 투명 밑줄 + 흐린 회색 */
        }`}
      >
        모잇과 나눈 대화
      </button>
    </div>
  );
}