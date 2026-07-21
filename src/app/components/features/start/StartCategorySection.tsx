import React from "react";
import type { StartSection, SubCategory } from "../../../types/moit";
import SubCategoryButtonList from "./SubCategoryButtonList";

interface StartCategorySectionProps {
  section: StartSection;
  onSelectSubCategory: (item: SubCategory) => void;
}

export default function StartCategorySection({ section, onSelectSubCategory }: StartCategorySectionProps) {
  return (
    <section className="space-y-6">
      
      {/* 🎨 1. 상단 섹션 구분선 타이틀 ("── 똑똑한 소비 ──" 형태) */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-[1px] w-8 bg-blue-300 sm:w-12" />
        <span className="rounded-full border border-blue-200 bg-white px-4 py-1.5 text-sm font-bold text-blue-600 shadow-sm">
          {section.title}
        </span>
        <div className="h-[1px] w-8 bg-blue-300 sm:w-12" />
      </div>
      
      {/* 🎨 2. 중분류 영역 (가전제품, 통신비 등) */}
      <div className="space-y-8">
        {section.middleCategories.map((category) => (
          
          /* 💡 피그마 시안 1.png처럼 연한 연두/파랑 배경으로 크게 감싸는 컨테이너 박스 */
          <div 
            key={category.id} 
            className="rounded-3xl border border-blue-100/80 bg-[#f4f7ff] p-6 shadow-sm sm:p-8"
          >
            {/* 박스 내부 제목 ("| 가전제품") */}
            <div className="mb-6 flex items-center gap-2">
              <div className="h-5 w-1.5 rounded-full bg-[#2A6CB6]" />
              <h3 className="text-xl font-bold text-slate-800">
                {category.title}
              </h3>
            </div>
            
            {/* 💡 안쪽에 가로로 4개 들어가는 카드 리스트 */}
            <SubCategoryButtonList items={category.subCategories} onSelect={onSelectSubCategory} />
          </div>

        ))}
      </div>
    </section>
  );
}