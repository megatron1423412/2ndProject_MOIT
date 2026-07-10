import React from "react";
import type { SubCategory } from "../../../types/moit";
import CategoryIcon from "../../common/CategoryIcon";

interface ChatSidebarItemProps {
  item: SubCategory;
  isActive: boolean;
  onSelect: (item: SubCategory) => void;
}

export default function ChatSidebarItem({ item, isActive, onSelect }: ChatSidebarItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
        isActive
          ? "border-accent bg-accent text-accent-foreground shadow-sm before:absolute before:left-0 before:h-5 before:w-1 before:rounded-r-full before:bg-brand-surface"
          : "border-transparent text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
    >
      <CategoryIcon fallback={item.icon} iconPath={item.iconPath} size={17} />
      {item.title}
    </button>
  );
}
