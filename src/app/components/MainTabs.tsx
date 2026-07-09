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
    <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-black transition-all ${
              isActive
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
