import React from "react";
import type { StartSection, SubCategory } from "../../../types/moit";
import SubCategoryButtonList from "./SubCategoryButtonList";

interface StartCategorySectionProps {
  section: StartSection;
  onSelectSubCategory: (item: SubCategory) => void;
}

export default function StartCategorySection({ section, onSelectSubCategory }: StartCategorySectionProps) {
  return (
    <section className="space-y-4">
      {/* 최상위 섹션 제목 */}
      <h2 className="text-2xl font-black text-primary">{section.title}</h2>
      
      <div className="space-y-6">
        {section.middleCategories.map((category) => (
          <div key={category.id} className="space-y-3">
            {/* 타이틀을 위로 올림 */}
            <h3 className="text-xl font-black text-foreground px-1">
              {category.title}
            </h3>
            
            {/* 세부 카드 2x2 목록 */}
            <SubCategoryButtonList items={category.subCategories} onSelect={onSelectSubCategory} />
          </div>
        ))}
      </div>
    </section>
  );
}

{/* 💡 기존: 단순 텍스트 -> 변경: 포인트 뱃지 형태 
<div className="flex items-center gap-2 mb-3">
  <span className="rounded-lg bg-[#2A6CB6] px-3 py-1.5 text-sm font-black text-white shadow-sm">
    가전제품
  </span>
  <span className="text-xs font-bold text-muted-foreground">맞춤 진단</span>
</div>*/}