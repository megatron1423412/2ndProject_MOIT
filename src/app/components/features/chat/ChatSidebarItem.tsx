import React from "react";
import type { SubCategory } from "../../../types/moit";

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
      className={`w-full rounded-md px-3 py-2 text-left text-sm font-bold transition-all ${
        isActive
          ? "bg-accent/20 text-accent"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
      }`}
    >
      {item.title}
    </button>
  );
}
