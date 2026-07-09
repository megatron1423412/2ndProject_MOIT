import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MiddleCategory, SubCategory, SubCategoryId } from "../../../types/moit";
import ChatSidebarItem from "./ChatSidebarItem";

interface ChatSidebarSectionProps {
  sectionTitle: string;
  category: MiddleCategory;
  activeSubCategoryId: SubCategoryId;
  onSelectSubCategory: (item: SubCategory) => void;
}

export default function ChatSidebarSection({
  sectionTitle,
  category,
  activeSubCategoryId,
  onSelectSubCategory,
}: ChatSidebarSectionProps) {
  const containsActiveItem = category.subCategories.some((item) => item.id === activeSubCategoryId);
  const [isOpen, setIsOpen] = useState(containsActiveItem);

  useEffect(() => {
    if (containsActiveItem) setIsOpen(true);
  }, [containsActiveItem]);

  return (
    <div className="space-y-2">
      <p className="px-3 text-[11px] font-black text-muted-foreground">{sectionTitle}</p>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-black text-sidebar-foreground transition-all hover:bg-sidebar-accent"
      >
        <span>{category.title}</span>
        <ChevronDown size={15} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
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
      )}
    </div>
  );
}
