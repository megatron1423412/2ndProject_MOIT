import React from "react";
import type { StartSection, SubCategory } from "../../../types/moit";
import SubCategoryButtonList from "./SubCategoryButtonList";

interface StartCategorySectionProps {
  section?: StartSection;       // 💡 기존 단수 props 호환
  sections?: StartSection[];     // 💡 좌우 병렬 배치를 위한 복수 props
  onSelectSubCategory: (item: SubCategory) => void;
}

export default function StartCategorySection({
  section,
  sections,
  onSelectSubCategory,
}: StartCategorySectionProps) {
  const sectionList = sections || (section ? [section] : []);

  return (
    /* 🎨 "가전제품"과 "통신비" 컨테이너를 수평 2컬럼(lg:grid-cols-2)으로 배치 */
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {sectionList.map((sec) => (
        <section key={sec.id} className="flex flex-col">
          {/* 🎨 1. 컨테이너 상단 외부 섹션 타이틀 ("똑똑한 소비", "생활비 진단") */}
          <h2 className="mb-5 pl-2 text-[18px] font-black text-[#1E3ABA]">
            {sec.title}
          </h2>

          {sec.middleCategories?.map((category) => (
            /* 💡 컨테이너 박스: 중분류 및 하위 카테고리 카드 포함 */
            <div
              key={category.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-[#f4f7ff] p-5 shadow-sm sm:p-5"
            >
              {/* 🎨 2. 중분류 타이틀 ("가전제품" / "통신비")*/}
              <div className="mb-3 pl-2 flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-[#1E3ABA]">
                  {category.title}
                </h3>
              </div>

              {/* 💡 컨테이너 내부 카드 그리드 리스트 */}
              <SubCategoryButtonList
                items={category.subCategories}
                onSelect={onSelectSubCategory}
              />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}