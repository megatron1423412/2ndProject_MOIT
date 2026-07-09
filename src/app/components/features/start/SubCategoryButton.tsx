import React from "react";
import type { SubCategory } from "../../../types/moit";

interface SubCategoryButtonProps {
  item: SubCategory;
  onSelect: (item: SubCategory) => void;
}

export default function SubCategoryButton({ item, onSelect }: SubCategoryButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="w-full rounded-lg border border-border bg-card px-5 py-3.5 text-left text-base font-black text-primary shadow-sm transition-all hover:border-accent/50 hover:bg-secondary/60 active:scale-[0.99]"
    >
      {item.title}
    </button>
  );
}
