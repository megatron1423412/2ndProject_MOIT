import React, { useState } from "react";
import { MOCK_CONVERSATIONS } from "../../../data/mockConversations";
import { START_SECTIONS } from "../../../data/categories";
import type { ConversationHistoryItem, SubCategory, TopActionState } from "../../../types/moit";
import PageShell from "../../layout/PageShell";
import ConversationHistory from "../history/ConversationHistory";
import MainTabs from "./MainTabs";
import type { MainTab } from "./MainTabs";
import StartCategorySection from "./StartCategorySection";

interface MainStartScreenProps {
  actions: TopActionState;
  onSelectSubCategory: (item: SubCategory) => void;
}

export default function MainStartScreen({
  actions,
  onSelectSubCategory,
}: MainStartScreenProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("start");
  const [notice, setNotice] = useState("");

  const handleHistorySelect = (item: ConversationHistoryItem) => {
    setNotice(`${item.title} 상세 화면은 다음 단계에서 연결할게요.`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <PageShell
      isLoggedIn={actions.isLoggedIn}
      isDarkMode={actions.isDarkMode}
      onBrandClick={() => setActiveTab("start")}
      onToggleLogin={actions.onToggleLogin}
      onToggleTheme={actions.onToggleTheme}
      onToggleFavorite={actions.onToggleFavorite}
      onOpenNotifications={actions.onOpenNotifications}
      priceNotifications={actions.priceNotifications}
    >
      <main className="flex-1 py-8 bg-[#f8fafc]">
        
        {/* 메인 대시보드 전체 감싸는 컨테이너 */}
        <div className="mx-auto w-full max-w-[1180px] px-4">
          
          {/* ========================================================================= */}
          {/* 🚀 [ZONE 1: 상단 히어로 배너 - 마스코트 3D 돌출 입체 연출] */}
          {/* 💡 overflow-hidden을 삭제하고 mb-15로 하단 여백을 확보하여 캐릭터가 상단/우측 밖으로 나와도 겹치지 않음 */}
          {/* ========================================================================= */}
          <div className="relative mb-15 w-full rounded-3xl bg-gradient-to-r from-[#2A6CB6] via-indigo-600 to-blue-500 p-8 text-white shadow-lg">
            
            {/* 1-1. 은은한 배경 빛(Glow) 효과 - 배너 내부 틀에만 제한되도록 처리 */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              
              {/* 1-2. 히어로 배너 좌측 텍스트 영역 */}
              <div className="space-y-2 max-w-[600px]">
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  스마트 소비 진단 플랫폼
                </span>
                <h1 className="text-2xl font-black sm:text-3xl">
                  지금, 더 현명하게 소비하고 있나요?
                </h1>
                <p className="text-sm opacity-90 leading-relaxed">
                  가전제품부터 통신비까지 — 나에게 딱 맞는 최적 소비를 진단해 드려요.
                </p>
              </div>

              {/* 1-3. 우측 마스코트 캐릭터 (배너 위/우측 테두리 밖으로 돌출되는 3D 팝업 효과) */}
              {/* - md:absolute md:-right-0 md:-top-20: PC 화면에서 배너 상단 우측으로 머리가 튀어나오게 위치 보정 */}
              {/* - drop-shadow-xl: 배너 위에 살짝 떠 있는 듯한 입체 그림자 효과 */}
              <div className="relative md:absolute md:-right-0 md:-top-20 z-20 flex shrink-0 justify-end pointer-events-none">
                <img 
                  src="/assets/brand/mascot_pose_piggy.png" 
                  alt="MOiT 마스코트" 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  /* 
                    💡 마스코트 입체 팝업 스타일 가이드:
                    - h-40/w-40 (기본) -> sm:h-48/w-48 -> md:h-65/w-65 (확대)
                    - drop-shadow-2xl: 커진 캐릭터에 맞춰 입체 그림자 강화
                  */
                  className="h-40 w-40 object-contain sm:h-48 sm:w-48 md:h-65 md:w-65 drop-shadow-2xl transition-transform duration-300 hover:scale-105"
                />
              </div>

            </div>
          </div>
          {/* ========================================================================= */}


          {/* ========================================================================= */}
          {/* 🎨 [ZONE 2: 메인 탭 전환 영역 (MainTabs)] */}
          {/* ========================================================================= */}
          <MainTabs activeTab={activeTab} onChange={setActiveTab} />


          {/* ========================================================================= */}
          {/* 🎨 [ZONE 3: 탭 선택에 따른 메인 본문 콘텐츠 영역] */}
          {/* ========================================================================= */}
          <div className="mt-8">
            {activeTab === "start" ? (
              
              /* 🎨 [프론트엔드 핵심 수정 Zone: 카테고리 섹션 세로 배치 레이아웃]
                 - flex flex-col: '똑똑한 소비'와 '생활비 진단'이 좌우가 아닌 위아래로 배치됨
                 - space-y-12: 두 커다란 카테고리 섹션 사이의 위아래 간격 (space-y-10, space-y-16 등 조절 가능)
              */
              <div className="flex flex-col space-y-12">
                {START_SECTIONS.map((section) => (
                  <StartCategorySection
                    key={section.id}
                    section={section}
                    onSelectSubCategory={onSelectSubCategory}
                  />
                ))}
              </div>

            ) : (
              /* 히스토리 대화 목록 영역 */
              <ConversationHistory history={MOCK_CONVERSATIONS} onSelectHistory={handleHistorySelect} />
            )}
          </div>
          {/* ========================================================================= */}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 🎨 [ZONE 4: 플로팅 토스트 알림 팝업] */}
      {/* ========================================================================= */}
      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-primary shadow-lg">
          {notice}
        </div>
      )}

    </PageShell>
  );
}