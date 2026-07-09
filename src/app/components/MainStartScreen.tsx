import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { CATEGORY_SECTIONS, CONVERSATION_HISTORY } from "../data";
import type { ConversationHistoryItem, DiagnosisItem } from "../data";
import CategorySection from "./CategorySection";
import ConversationHistory from "./ConversationHistory";
import MainTabs from "./MainTabs";
import type { MainTab } from "./MainTabs";
import TopActionBar from "./TopActionBar";

interface MainStartScreenProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onSelectItem: (item: DiagnosisItem) => void;
}

export default function MainStartScreen({
  isDarkMode,
  onToggleTheme,
  onSelectItem,
}: MainStartScreenProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("start");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [notice, setNotice] = useState("");

  const handleHistorySelect = (item: ConversationHistoryItem) => {
    setNotice(`${item.title} 상세 화면은 다음 단계에서 연결할게요.`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <div className="h-screen w-screen overflow-y-auto bg-background text-foreground">
      <div className="mx-auto flex min-h-full w-full max-w-[1440px] flex-col px-5 py-5 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <button
            type="button"
            onClick={() => setActiveTab("start")}
            className="flex items-center gap-3 rounded-lg text-left transition-opacity hover:opacity-85"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <Sparkles size={19} className="text-accent" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-primary">모</span>
                <span className="text-2xl font-black text-accent">잇</span>
                <span className="ml-1 text-xs font-black tracking-widest text-muted-foreground">MOIT</span>
              </div>
              <p className="text-xs font-bold text-muted-foreground">돈값을 같이 따져보는 AI 코치</p>
            </div>
          </button>

          <TopActionBar
            isLoggedIn={isLoggedIn}
            isDarkMode={isDarkMode}
            isFavorite={isFavorite}
            onToggleLogin={() => setIsLoggedIn((value) => !value)}
            onToggleTheme={onToggleTheme}
            onToggleFavorite={() => setIsFavorite((value) => !value)}
          />
        </header>

        <main className="flex-1 py-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black text-accent">모잇과 시작하기</p>
              <h1 className="mt-1 text-3xl font-black text-primary">오늘 점검할 주제를 골라주세요</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                원하는 항목을 선택하면 해당 주제를 담당하는 모잇 챗봇으로 바로 이동합니다.
              </p>
            </div>
            <MainTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <div className="mt-8">
            {activeTab === "start" ? (
              <div className="space-y-10">
                {CATEGORY_SECTIONS.map((section) => (
                  <CategorySection key={section.id} section={section} onSelectItem={onSelectItem} />
                ))}
              </div>
            ) : (
              <ConversationHistory history={CONVERSATION_HISTORY} onSelectHistory={handleHistorySelect} />
            )}
          </div>
        </main>
      </div>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-primary shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}
