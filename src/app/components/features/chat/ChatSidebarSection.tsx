import React from "react";
import { ChevronDown } from "lucide-react";
import type { MiddleCategory, SubCategory, SubCategoryId } from "../../../types/moit";
import CategoryIcon from "../../common/CategoryIcon";
import ChatSidebarItem from "./ChatSidebarItem";

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
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-black outline-none transition-all hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
          containsActiveItem ? "border-accent/50 bg-accent/10 text-accent" : "border-transparent text-sidebar-foreground"
        }`}
      >
        <span className="flex items-center gap-2"><CategoryIcon fallback={category.icon} iconPath={category.iconPath} size={18} />{category.title}</span>
        <ChevronDown size={15} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-1">
          {category.subCategories.map((item) => (
            <ChatSidebarItem
              key={item.id}
              item={item}
              isActive={item.id === activeSubCategoryId}
              onSelect={onSelectSubCategory}
            />
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
