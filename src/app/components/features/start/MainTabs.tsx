import React from "react";

export type MainTab = "start" | "history";

interface MainTabsProps {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
}

const tabs: Array<{ id: MainTab; label: string }> = [
  { id: "start", label: "모잇과 시작하기" },
  { id: "history", label: "모잇과 나눈 대화" },
];

export default function MainTabs({ activeTab, onChange }: MainTabsProps) {
  return (
    <div className="flex items-center gap-7">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`text-xl transition-colors ${
              isActive
                ? "font-black text-primary"
                : "font-bold text-muted-foreground/55 hover:text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
