import React from "react";
import type { SubCategory } from "../../../types/moit";
import SubCategoryButton from "./SubCategoryButton";

interface SubCategoryButtonListProps {
  items: SubCategory[];
  onSelect: (item: SubCategory) => void;
}

export default function SubCategoryButtonList({ items, onSelect }: SubCategoryButtonListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        /* 💡 개별 크기 매핑(ICON_SIZE_MAP)이 적용된 SubCategoryButton을 사용합니다 */
        <SubCategoryButton key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}