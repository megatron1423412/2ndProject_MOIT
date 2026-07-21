import React from "react";
import type { SubCategory } from "../../../types/moit";
import SubCategoryButton from "./SubCategoryButton";

interface SubCategoryButtonListProps {
  items: SubCategory[];
  onSelect: (item: SubCategory) => void;
}

export default function SubCategoryButtonList({ items, onSelect }: SubCategoryButtonListProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      {/* 💡 grid-cols-2 로 변경하여 2x2 형태로 배치 */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <SubCategoryButton key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}