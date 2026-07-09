import React from "react";
import type { SubCategory } from "../../../types/moit";
import SubCategoryButton from "./SubCategoryButton";

interface SubCategoryButtonListProps {
  items: SubCategory[];
  onSelect: (item: SubCategory) => void;
}

export default function SubCategoryButtonList({ items, onSelect }: SubCategoryButtonListProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/25 p-4">
      <div className="flex h-full flex-col gap-3">
        {items.map((item) => (
          <SubCategoryButton key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
