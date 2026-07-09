import React from "react";
import type { MiddleCategory } from "../../../types/moit";
import MoitIcon from "../../common/MoitIcon";

interface MiddleCategoryCardProps {
  category: MiddleCategory;
}

export default function MiddleCategoryCard({ category }: MiddleCategoryCardProps) {
  return (
    <div className="flex min-h-[238px] flex-col justify-between rounded-lg border border-border bg-brand-surface p-6 text-brand-surface-foreground shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/12 text-accent">
        <MoitIcon name={category.icon} size={30} />
      </div>
      <div>
        <h3 className="text-3xl font-black">{category.title}</h3>
      </div>
    </div>
  );
}
