import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MiddleCategory, MiddleCategoryId, SubCategory, SubCategoryId } from "../../../types/moit";
import CategoryIcon from "../../common/CategoryIcon";
import SidebarBrandButton from "./SidebarBrandButton";

interface CollapsedSidebarRailProps {
  categories: MiddleCategory[];
  activeSubCategoryId: SubCategoryId;
  openCategoryIds: MiddleCategoryId[];
  onExpand: () => void;
  onToggleCategory: (id: MiddleCategoryId) => void;
  onSelectSubCategory: (item: SubCategory) => void;
}

export default function CollapsedSidebarRail({
  categories,
  activeSubCategoryId,
  openCategoryIds,
  onExpand,
  onToggleCategory,
  onSelectSubCategory,
}: CollapsedSidebarRailProps) {
  return (
    <aside className="flex h-full w-[72px] flex-shrink-0 flex-col items-center overflow-y-auto border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground">
      <SidebarBrandButton onExpand={onExpand} />
      <div className="mt-5 flex w-full flex-col items-center gap-3 px-2">
        {categories.map((category) => {
          const isOpen = openCategoryIds.includes(category.id);
          const isParentActive = category.subCategories.some((item) => item.id === activeSubCategoryId);

          return (
            <div key={category.id} className="flex w-full flex-col items-center">
              <button
                type="button"
                onClick={() => onToggleCategory(category.id)}
                aria-label={`${category.title} 세부 항목 ${isOpen ? "접기" : "펼치기"}`}
                aria-expanded={isOpen}
                title={category.title}
                className={`relative flex h-11 w-11 items-center justify-center rounded-lg border outline-none transition-all hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
                  isParentActive
                    ? "border-accent bg-accent/15 text-accent shadow-sm"
                    : "border-transparent text-sidebar-foreground/75"
                }`}
              >
                <CategoryIcon fallback={category.icon} iconPath={category.iconPath} size={21} />
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground">
                  {isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </span>
              </button>

              <div className={`grid w-full transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="min-h-0 overflow-hidden">
                  <div className="flex flex-col items-center gap-2 border-l border-sidebar-border py-1">
                    {category.subCategories.map((item) => {
                      const isActive = item.id === activeSubCategoryId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onSelectSubCategory(item)}
                          aria-label={`${item.title} 챗봇으로 이동`}
                          aria-current={isActive ? "page" : undefined}
                          title={item.title}
                          className={`relative flex h-9 w-9 items-center justify-center rounded-md border outline-none transition-all hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
                            isActive
                              ? "border-accent bg-accent text-accent-foreground shadow-sm before:absolute before:-left-[7px] before:h-4 before:w-1 before:rounded-full before:bg-accent"
                              : "border-transparent text-sidebar-foreground/75"
                          }`}
                        >
                          <CategoryIcon fallback={item.icon} iconPath={item.iconPath} size={17} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
