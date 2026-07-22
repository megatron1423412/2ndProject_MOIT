import React from "react";
import type { SubCategory } from "../../../types/moit";
import SubCategoryButton from "./SubCategoryButton";

interface SubCategoryButtonListProps {
  items: SubCategory[];
  onSelect: (item: SubCategory) => void;
}

export default function SubCategoryButtonList({ items, onSelect }: SubCategoryButtonListProps) {
  return (
    /* 💡 박스 안에서 4개 카드가 2x2 (grid-cols-2)로 정렬됩니다 */
    <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
      {items.map((item) => (
        <SubCategoryButton key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}