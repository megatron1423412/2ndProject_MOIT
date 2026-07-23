import React from "react";
import type { MiddleCategory, SubCategory, SubCategoryId } from "../../../types/moit";
import CategoryIcon from "../../common/CategoryIcon";
import ChatSidebarItem from "./ChatSidebarItem";
import SidebarAccordionChevron from "./SidebarAccordionChevron";

interface ChatSidebarSectionProps {
  sectionTitle: string;
  category: MiddleCategory;
  activeSubCategoryId: SubCategoryId;
  isOpen: boolean;
  onToggle: () => void;
  onSelectSubCategory: (item: SubCategory) => void;
}

export default function ChatSidebarSection({
  sectionTitle,
  category,
  activeSubCategoryId,
  isOpen,
  onToggle,
  onSelectSubCategory,
}: ChatSidebarSectionProps) {
  const containsActiveItem = category.subCategories.some((item) => item.id === activeSubCategoryId);

  return (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-black text-muted-foreground">{sectionTitle}</p>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={`${category.title} 세부 항목 ${isOpen ? "접기" : "펼치기"}`}
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-black outline-none transition-all hover:bg-[var(--sidebar-item-hover)] focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
          containsActiveItem
            ? "border-[var(--sidebar-group-border)] bg-[var(--sidebar-group-bg)] text-accent"
            : "border-transparent text-sidebar-foreground"
        }`}
      >
        <SidebarAccordionChevron isOpen={isOpen} />
        <CategoryIcon fallback={category.icon} iconPath={category.iconPath} size={18} />
        <span>{category.title}</span>
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="relative mt-2 rounded-lg border border-[var(--sidebar-group-border)] bg-[var(--sidebar-group-bg)] px-2 py-1.5">
            <div className="space-y-1">
              {category.subCategories.map((item) => (
                <ChatSidebarItem
                  key={item.id}
                  item={item}
                  isActive={item.id === activeSubCategoryId}
                  showTreeConnector={false}
                  onSelect={onSelectSubCategory}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
