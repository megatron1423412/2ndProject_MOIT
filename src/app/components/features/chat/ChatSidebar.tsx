import React from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { MOCK_CONVERSATIONS } from "../../../data/mockConversations";
import { START_SECTIONS } from "../../../data/categories";
import type { ConversationHistoryItem, SubCategory, SubCategoryId } from "../../../types/moit";
import BrandHeader from "../../layout/BrandHeader";
import IconButton from "../../common/IconButton";
import CompactConversationList from "../history/CompactConversationList";
import ChatSidebarSection from "./ChatSidebarSection";

interface ChatSidebarProps {
  activeSubCategoryId: SubCategoryId;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onBackToMain: () => void;
  onSelectSubCategory: (item: SubCategory) => void;
  onSelectHistory: (item: ConversationHistoryItem) => void;
}

export default function ChatSidebar({
  activeSubCategoryId,
  isCollapsed,
  onToggleCollapsed,
  onBackToMain,
  onSelectSubCategory,
  onSelectHistory,
}: ChatSidebarProps) {
  if (isCollapsed) {
    return (
      <aside className="flex h-full w-[64px] flex-shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-4">
        <IconButton label="사이드바 펼치기" onClick={onToggleCollapsed}>
          <PanelLeftOpen size={18} />
        </IconButton>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-[292px] flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between gap-3 border-b border-sidebar-border p-4">
        <BrandHeader onClick={onBackToMain} />
        <IconButton label="사이드바 접기" onClick={onToggleCollapsed}>
          <PanelLeftClose size={18} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {START_SECTIONS.map((section) =>
            section.middleCategories.map((category) => (
              <ChatSidebarSection
                key={category.id}
                sectionTitle={section.title}
                category={category}
                activeSubCategoryId={activeSubCategoryId}
                onSelectSubCategory={onSelectSubCategory}
              />
            )),
          )}
        </div>
      </div>

      <div className="border-t border-sidebar-border p-3">
        <p className="mb-2 px-3 text-xs font-black text-sidebar-foreground">지난 대화</p>
        <CompactConversationList history={MOCK_CONVERSATIONS} onSelectHistory={onSelectHistory} />
      </div>
    </aside>
  );
}
