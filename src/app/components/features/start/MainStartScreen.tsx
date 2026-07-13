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
      <main className="flex-1 py-8">
        <div className="mx-auto w-full max-w-[1180px]">
          <MainTabs activeTab={activeTab} onChange={setActiveTab} />

          <div className="mt-8">
            {activeTab === "start" ? (
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
              <ConversationHistory history={MOCK_CONVERSATIONS} onSelectHistory={handleHistorySelect} />
            )}
          </div>
        </div>
      </main>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-primary shadow-lg">
          {notice}
        </div>
      )}
    </PageShell>
  );
}
