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
      {/* 🎨 [프론트엔드 수정 가능 Zone 1: 메인 영역 상하 패딩]
         - py-8: 메인 컨텐츠 영역의 위아래 여백 (py-6, py-10, py-12 등)
      */}
      <main className="flex-1 py-10 bg-[#f5f7fa]">
        
        {/* 🎨 [프론트엔드 수정 가능 Zone 2: 메인 대시보드 최대 가로 너비 & 중앙 정렬]
           - max-w-[1180px]: 메인 페이지 전체의 최대 너비 제한 수치 (max-w-[1280px], max-w-6xl 등)
           - mx-auto: 좌우 중앙 정렬
           - px-4 등의 좌우 여백 패딩을 추가하여 모바일/작은 화면 대응 가능
        */}
        <div className="mx-auto w-full max-w-[1180px]">
          
          {/* 탭 영역 (MainTabs 컴포넌트) */}
          <MainTabs activeTab={activeTab} onChange={setActiveTab} />

          {/* 🎨 [프론트엔드 수정 가능 Zone 3: 탭과 본문 사이의 간격]
             - mt-8: 상단 탭 버튼들과 하단 카테고리/히스토리 카드 사이의 여백 (mt-6, mt-10 등)
          */}
          <div className="mt-8">
            {activeTab === "start" ? (
              
              /* 🎨 [프론트엔드 수정 가능 Zone 4: 카테고리 섹션 카드 그리드(Grid) 레이아웃]
                 - grid gap-6: 두 개의 큰 카테고리(가전/통신) 섹션 사이의 간격 (gap-4, gap-8 등)
                 - xl:grid-cols-2: 대형 화면에서의 2열(2컬럼) 배치 (lg:grid-cols-2 또는 1열 반응형 변경 가능)
              */
              <div className="grid gap-6 xl:grid-cols-2">
                {START_SECTIONS.map((section) => (
                  <StartCategorySection
                    key={section.id}
                    section={section}
                    onSelectSubCategory={onSelectSubCategory}
                  />
                ))}
              </div>
            ) : (
              /* 히스토리 탭 영역 */
              <ConversationHistory history={MOCK_CONVERSATIONS} onSelectHistory={handleHistorySelect} />
            )}
          </div>
        </div>
      </main>

      {/* 🎨 [프론트엔드 수정 가능 Zone 5: 메인 화면 플로팅 알림(Toast Notice) UI]
         - fixed bottom-5 left-1/2 -translate-x-1/2: 하단 중앙 고정 위치
         - z-50: 최상단 레이어 순서
         - rounded-lg / border / bg-card / shadow-lg: 토스트 팝업 둥글기, 배경색, 그림자
         - text-sm / font-bold / text-primary: 폰트 스타일
      */}
      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-primary shadow-lg">
          {notice}
        </div>
      )}
    </PageShell>
  );
}