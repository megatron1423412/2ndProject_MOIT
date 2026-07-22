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
  // 💡 sections가 넘어오면 sections를 쓰고, section 단수만 넘어오면 배열로 만들어서 처리합니다.
  const sectionList = sections || (section ? [section] : []);

  return (
    /* 🎨 최상위를 2컬럼 그리드(lg:grid-cols-2)로 묶어 "똑똑한 소비"와 "생활비 진단"을 한 줄에 나란히 배치 */
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {sectionList.map((sec) => (
        <section key={sec.id} className="flex flex-col space-y-6">
          
          {/* 🎨 1. 상단 섹션 구분선 타이틀 ("── 똑똑한 소비 ──", "── 생활비 진단 ──") */}
          <div className="flex items-center justify-center gap-3 py-2">
            <div className="h-[1px] w-8 bg-blue-300 sm:w-12" />
            <span className="rounded-full border border-blue-200 bg-white px-4 py-1.5 text-sm font-bold text-blue-600 shadow-sm">
              {sec.title}
            </span>
            <div className="h-[1px] w-8 bg-blue-300 sm:w-12" />
          </div>

          {/* 🎨 2. 중분류 영역 (가전제품, 통신비 박스) */}
          <div className="flex-1 space-y-6">
            {sec.middleCategories?.map((category) => (
              
              /* 💡 중분류 컨테이너 박스 */
              <div
                key={category.id}
                className="flex flex-col justify-between rounded-3xl border border-blue-100/80 bg-[#f4f7ff] p-6 shadow-sm sm:p-7"
              >
                {/* 박스 내부 제목 ("| 가전제품" / "| 통신비") */}
                <div className="mb-5 flex items-center gap-2">
                  <div className="h-5 w-1.5 rounded-full bg-[#2A6CB6]" />
                  <h3 className="text-xl font-bold text-slate-800">
                    {category.title}
                  </h3>
                </div>

                {/* 💡 안쪽에 2x2로 들어가는 카드 리스트 */}
                <SubCategoryButtonList
                  items={category.subCategories}
                  onSelect={onSelectSubCategory}
                />
              </div>

            ))}
          </div>

        </section>
      ))}
    </div>
  );
}