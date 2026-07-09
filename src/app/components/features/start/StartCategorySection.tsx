import React from "react";
import type { StartSection, SubCategory } from "../../../types/moit";
import MiddleCategoryCard from "./MiddleCategoryCard";
import SubCategoryButtonList from "./SubCategoryButtonList";

interface StartCategorySectionProps {
  section: StartSection;
  onSelectSubCategory: (item: SubCategory) => void;
}

export default function StartCategorySection({ section, onSelectSubCategory }: StartCategorySectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-primary">{section.title}</h2>
      <div className="space-y-4">
        {section.middleCategories.map((category) => (
          <div key={category.id} className="grid gap-4 sm:grid-cols-[minmax(170px,220px)_minmax(0,1fr)]">
            <MiddleCategoryCard category={category} />
            <SubCategoryButtonList items={category.subCategories} onSelect={onSelectSubCategory} />
          </div>
        ))}
      </div>
    </section>
  );
}
