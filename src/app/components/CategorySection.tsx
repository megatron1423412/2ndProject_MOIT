import React from "react";
import type { CategorySectionData, DiagnosisItem } from "../data";
import CategoryButton from "./CategoryButton";

interface CategorySectionProps {
  section: CategorySectionData;
  onSelectItem: (item: DiagnosisItem) => void;
}

export default function CategorySection({ section, onSelectItem }: CategorySectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-primary">{section.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {section.items.map((item) => (
          <CategoryButton key={item.id} item={item} onSelect={onSelectItem} />
        ))}
      </div>
    </section>
  );
}
