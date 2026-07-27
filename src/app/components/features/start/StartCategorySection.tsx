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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:gap-8 2xl:gap-10">
      {sectionList.map((sec) => {
        const isSmartSpending = sec.id === "smart-spending" || sec.title.includes("똑똑한 소비");
        return (
          <section key={sec.id} className="flex flex-col h-full">
            {/* 🎨 1. 컨테이너 상단 외부 섹션 타이틀 ("똑똑한 소비", "생활비 진단") */}
            <div className="flex items-center mb-8 pl-1">
              <h2 className="text-[18px] font-black text-[#1E3ABA] xl:text-[20px] 2xl:text-[22px]">
                {isSmartSpending ? "똑똑한 소비" : "생활비 진단"}
              </h2>
              <div className="h-3.5 w-[1.5px] bg-slate-300 mx-2 shrink-0" />
              <span className="text-xs font-normal text-[#6E7581] xl:text-sm">
                {isSmartSpending ? "가전제품 가격·스펙 맞춤 분석" : "통신비·고정 지출 절감 솔루션"}
              </span>
            </div>

            {sec.middleCategories?.map((category) => (
              /* 💡 컨테이너 박스: 중분류 및 하위 카테고리 카드 포함 */
              <div
                key={category.id}
                className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-100 bg-[#f4f7ff] p-5 shadow-sm sm:p-4 xl:p-5 2xl:p-5 h-full"
              >
                {/* 🎨 2. 중분류 타이틀 ("가전제품" / "통신비")*/}
                <div className="mb-6 pl-2 flex items-center gap-2">
                  <h3 className="text-[16px] font-bold text-[#1F2937] xl:text-[18px] 2xl:text-[20px]">
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
        );
      })}
    </div>
  );
}