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
      <main className="flex-1 bg-[#f8fafc]  pb-8">
        {/* 메인 대시보드 전체 감싸는 컨테이너 */}
        <div className="mx-auto w-full max-w-[1180px] xl:max-w-7xl 2xl:max-w-[1600px] px-4 xl:px-6 2xl:px-8">

          {/* ========================================================================= */}
          {/* 🚀 [ZONE 1: 상단 히어로 배너 - 수평 직사각형 둥근 박스] */}
          {/* ========================================================================= */}
          <div className="relative mb-6 flex h-24 xl:h-28 2xl:h-32 w-full items-center rounded-2xl bg-gradient-to-r from-[#1E3ABA] via-[#2A6CB6] to-blue-500 px-6 py-3 text-white shadow-md sm:px-8 xl:px-10 2xl:px-12">

            {/* 1-1. 은은한 배경 빛(Glow) 효과 */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative z-10 flex h-full w-full items-center justify-between gap-4">

              {/* 1-2. 히어로 배너 좌측 텍스트 영역 */}
              <div className="flex flex-col justify-center space-y-1">
                <h1 className="text-base font-extrabold leading-tight sm:text-lg md:text-[20px] xl:text-[22px] 2xl:text-[24px]">
                  지금, 더 현명하게 소비하고 있나요?
                </h1>
                <p className="text-[11px] leading-tight opacity-90 sm:text-xs xl:text-sm">
                  가전제품부터 통신비까지 — 나에게 딱 맞는 최적 소비를 진단해 드려요.
                </p>
              </div>

              {/* 1-3. 우측 마스코트 캐릭터 (배너 위치 유지 및 상자 밖 입체 튀어나옴 효과) */}
              <div className="flex shrink-0 items-center justify-end">
                <div className="flex h-24 w-24 -my-4 items-center justify-center sm:h-40 sm:w-40 sm:-my-5">
                  <img
                    src="/assets/brand/mascot_pose_piggy.png"
                    alt="MOiT 마스코트"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="h-full w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🎨 [ZONE 2: 메인 탭 전환 영역 (MainTabs)] */}
          {/* ========================================================================= */}
          <MainTabs activeTab={activeTab} onChange={setActiveTab} />

          {/* ========================================================================= */}
          {/* 🎨 [ZONE 3: 탭 선택에 따른 메인 본문 콘텐츠 영역] */}
          {/* ========================================================================= */}
          <div className="mt-8">
            {activeTab === "start" ? (
              /* 🎨 [카테고리 섹션] sections={START_SECTIONS} 전달을 통해 좌우 2컬럼 지원 */
              <StartCategorySection
                sections={START_SECTIONS}
                onSelectSubCategory={onSelectSubCategory}
              />
            ) : (
              /* 히스토리 대화 목록 영역 */
              <ConversationHistory
                history={MOCK_CONVERSATIONS}
                onSelectHistory={handleHistorySelect}
              />
            )}
          </div>

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