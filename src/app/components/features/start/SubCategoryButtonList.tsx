import React from "react";
import type { SubCategory } from "../../../types/moit";
import SubCategoryButton from "./SubCategoryButton";

interface SubCategoryButtonListProps {
  items: SubCategory[];
  onSelect: (item: SubCategory) => void;
}

export default function SubCategoryButtonList({ items, onSelect }: SubCategoryButtonListProps) {
  return (
    /* 💡 컨테이너 내부 카드를 2x2 수직 그리드(grid-cols-2)로 정렬합니다 */
    <div className="grid grid-cols-2 auto-rows-fr gap-2 sm:gap-2 xl:gap-2 2xl:gap-3 h-full flex-1">
      {items.map((item) => (
        <SubCategoryButton key={item.id} item={item} onSelect={onSelect} />
      ))}
    </div>
  );
}