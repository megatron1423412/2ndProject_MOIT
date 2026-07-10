import React from "react";
import type { SubCategory } from "../../../types/moit";
import CategoryIcon from "../../common/CategoryIcon";

interface ChatSidebarItemProps {
  item: SubCategory;
  isActive: boolean;
  showTreeConnector?: boolean;
  onSelect: (item: SubCategory) => void;
}

export default function ChatSidebarItem({ item, isActive, showTreeConnector = false, onSelect }: ChatSidebarItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-bold outline-none transition-all focus-visible:ring-2 focus-visible:ring-sidebar-ring ${showTreeConnector ? "pl-4" : ""} ${
        isActive
          ? "border-[var(--sidebar-item-active)] bg-[var(--sidebar-item-active)] text-[var(--sidebar-item-active-text)] shadow-sm before:absolute before:left-0 before:h-5 before:w-1 before:rounded-r-full before:bg-brand-surface"
          : "border-transparent text-sidebar-foreground/80 hover:bg-[var(--sidebar-item-hover)] hover:text-sidebar-foreground"
      }`}
    >
      {showTreeConnector && <span aria-hidden="true" className="absolute -left-2 top-1/2 h-px w-2 bg-[var(--sidebar-tree-line)]" />}
      <CategoryIcon fallback={item.icon} iconPath={item.iconPath} size={17} />
      {item.title}
    </button>
  );
}
