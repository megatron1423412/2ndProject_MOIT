import React, { useEffect, useMemo, useState } from "react";
import { PanelLeftClose } from "lucide-react";
import { MOCK_CONVERSATIONS } from "../../../data/mockConversations";
import { START_SECTIONS } from "../../../data/categories";
import type { ConversationHistoryItem, MiddleCategoryId, SubCategory, SubCategoryId } from "../../../types/moit";
import BrandHeader from "../../layout/BrandHeader";
import IconButton from "../../common/IconButton";
import CompactConversationList from "../history/CompactConversationList";
import ChatSidebarSection from "./ChatSidebarSection";
import CollapsedSidebarRail from "./CollapsedSidebarRail";

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
  const categories = useMemo(
    () => START_SECTIONS.flatMap((section) => section.middleCategories.map((category) => ({ ...category, sectionTitle: section.title }))),
    [],
  );
  const activeCategoryId = categories.find((category) =>
    category.subCategories.some((item) => item.id === activeSubCategoryId),
  )?.id;
  const [openCategoryIds, setOpenCategoryIds] = useState<MiddleCategoryId[]>(() => (activeCategoryId ? [activeCategoryId] : []));

  useEffect(() => {
    if (activeCategoryId) {
      setOpenCategoryIds((current) => (current.includes(activeCategoryId) ? current : [...current, activeCategoryId]));
    }
  }, [activeCategoryId]);

  const toggleCategory = (id: MiddleCategoryId) => {
    setOpenCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  if (isCollapsed) {
    return (
      <CollapsedSidebarRail
        categories={categories}
        activeSubCategoryId={activeSubCategoryId}
        openCategoryIds={openCategoryIds}
        onExpand={onToggleCollapsed}
        onToggleCategory={toggleCategory}
        onSelectSubCategory={onSelectSubCategory}
      />
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
          {categories.map((category) =>
              <ChatSidebarSection
                key={category.id}
                sectionTitle={category.sectionTitle}
                category={category}
                activeSubCategoryId={activeSubCategoryId}
                isOpen={openCategoryIds.includes(category.id)}
                onToggle={() => toggleCategory(category.id)}
                onSelectSubCategory={onSelectSubCategory}
              />
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
