import React, { useEffect, useMemo, useState } from "react";
import { PanelLeftClose } from "lucide-react";
import { MOCK_CONVERSATIONS } from "../../../data/mockConversations";
import { START_SECTIONS } from "../../../data/categories";
import type { ConversationHistoryItem, MiddleCategoryId, SubCategory, SubCategoryId } from "../../../types/moit";
import BrandHeader from "../../layout/BrandHeader";
import IconButton from "../../common/IconButton";
import CompactConversationList from "../history/CompactConversationList";
import ChatSidebarSection from "./ChatSidebarSection";
import CollapsedSidebarRail from "./CollapsedSidebarRail";

interface ChatSidebarProps {
  activeSubCategoryId: SubCategoryId;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onBackToMain: () => void;
  onSelectSubCategory: (item: SubCategory) => void;
  onSelectHistory: (item: ConversationHistoryItem) => void;
}

export default function ChatSidebar({
  activeSubCategoryId,
  isCollapsed,
  onToggleCollapsed,
  onBackToMain,
  onSelectSubCategory,
  onSelectHistory,
}: ChatSidebarProps) {
  const categories = useMemo(
    () => START_SECTIONS.flatMap((section) => section.middleCategories.map((category) => ({ ...category, sectionTitle: section.title }))),
    [],
  );
  const activeCategoryId = categories.find((category) =>
    category.subCategories.some((item) => item.id === activeSubCategoryId),
  )?.id;
  const [openCategoryIds, setOpenCategoryIds] = useState<MiddleCategoryId[]>(() => (activeCategoryId ? [activeCategoryId] : []));

  useEffect(() => {
    if (activeCategoryId) {
      setOpenCategoryIds((current) => (current.includes(activeCategoryId) ? current : [...current, activeCategoryId]));
    }
  }, [activeCategoryId]);

  const toggleCategory = (id: MiddleCategoryId) => {
    setOpenCategoryIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  if (isCollapsed) {
    return (
      <CollapsedSidebarRail
        categories={categories}
        activeSubCategoryId={activeSubCategoryId}
        openCategoryIds={openCategoryIds}
        onExpand={onToggleCollapsed}
        onToggleCategory={toggleCategory}
        onSelectSubCategory={onSelectSubCategory}
      />
    );
  }

  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 1: 사이드바 외형 & 전체 너비 & 테마]
       - w-[292px]: 사이드바 전체 가로 너비 (예: w-[260px], w-[300px] 등)
       - border-r border-sidebar-border: 오른쪽 경계선 굵기/색상
       - bg-sidebar / text-sidebar-foreground: 사이드바 전용 배경색 및 기본 글자색
    */
    <aside className="flex h-full w-[292px] flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      
      {/* 🎨 [프론트엔드 수정 가능 Zone 2: 사이드바 상단 헤더 영역]
         - border-b border-sidebar-border: 상단 구분선 스타일
         - p-4: 헤더 내부 패딩 여백 (p-3, p-5 등)
         - PanelLeftClose: lucide-react에서 다른 토글 아이콘(ChevronLeft, Menu 등)으로 교체 및 size={18} 수치 조정
      */}
      <div className="flex items-center justify-between gap-3 border-b border-sidebar-border p-4">
        <BrandHeader onClick={onBackToMain} />
        <IconButton label="사이드바 접기" onClick={onToggleCollapsed}>
          <PanelLeftClose size={18} />
        </IconButton>
      </div>

      {/* 🎨 [프론트엔드 수정 가능 Zone 3: 카테고리 스크롤 메뉴 리스트 영역]
         - px-3 py-4: 메뉴 목록 내부의 상하좌우 여백(Padding)
         - space-y-5: 카테고리 항목들 사이의 세로 간격 (space-y-3, space-y-4 등)
         - overflow-y-auto: 스크롤바 모션 및 숨김 스타일(scrollbar-none 등) 적용 가능
      */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {categories.map((category) =>
              <ChatSidebarSection
                key={category.id}
                sectionTitle={category.sectionTitle}
                category={category}
                activeSubCategoryId={activeSubCategoryId}
                isOpen={openCategoryIds.includes(category.id)}
                onToggle={() => toggleCategory(category.id)}
                onSelectSubCategory={onSelectSubCategory}
              />
          )}
        </div>
      </div>

      {/* 🎨 [프론트엔드 수정 가능 Zone 4: 하단 '지난 대화' 히스토리 영역]
         - border-t border-sidebar-border: 하단 영역 구분선
         - p-3: 영역 패딩
         - mb-2 px-3 text-xs font-black text-sidebar-foreground: '지난 대화' 타이틀 문구 폰트 크기/굵기/여백/색상
      */}
      <div className="border-t border-sidebar-border p-3">
        <p className="mb-2 px-3 text-xs font-black text-sidebar-foreground">지난 대화</p>
        <CompactConversationList history={MOCK_CONVERSATIONS} onSelectHistory={onSelectHistory} />
      </div>
    </aside>
  );
}