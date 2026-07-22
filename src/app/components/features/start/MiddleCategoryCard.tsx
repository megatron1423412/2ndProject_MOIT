import React from "react";
import type { MiddleCategory } from "../../../types/moit";
import CategoryIcon from "../../common/CategoryIcon";

interface MiddleCategoryCardProps {
  category: MiddleCategory;
}

export default function MiddleCategoryCard({ category }: MiddleCategoryCardProps) {
  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 1: 중분류 카드 외곽 전체 스타일 & 높이]
       - min-h-[238px]: 카드의 최소 세로 높이 (예: min-h-[200px], min-h-[260px] 등)
       - rounded-lg: 모서리 둥글기 (rounded-md, rounded-xl, rounded-2xl 등)
       - border border-border: 카드 테두리 굵기 및 색상
       - bg-brand-surface / text-brand-surface-foreground: 브랜드 전용 배경색 및 글자색
       - p-6: 카드 내부 패딩 여백 (p-4, p-5, p-8 등)
       - shadow-sm: 그림자 효과 (shadow-md, shadow-none 등)
    */
    <div className="flex min-h-[238px] flex-col justify-between rounded-lg border border-border bg-brand-surface p-6 text-brand-surface-foreground shadow-sm">
      
      {/* 🎨 [프론트엔드 수정 가능 Zone 2: 상단 아이콘 박스 배경 및 크기]
         - h-16 w-16: 아이콘 배경 상자의 가로/세로 크기 (h-12 w-12, h-14 w-14 등)
         - rounded-lg: 아이콘 박스 모서리 둥글기
         - bg-white/12: 아이콘 박스 배경 투명도/색상
         - text-accent: 아이콘 전용 색상
      */}
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white/12 text-accent">
        
        {/* 🎨 [프론트엔드 수정 가능 Zone 3: 카테고리 아이콘 자체 크기]
           - size={30}: 아이콘 크기 (size={24}, size={32}, size={36} 등)
        */}
        <CategoryIcon fallback={category.icon} iconPath={category.iconPath} size={30} />
      </div>

      {/* 🎨 [프론트엔드 수정 가능 Zone 4: 중분류 카테고리 제목(에어컨, TV 등) 폰트 스타일]
         - text-3xl: 카테고리 제목 글자 크기 (text-2xl, text-4xl 등)
         - font-black: 폰트 굵기 (font-bold, font-extrabold 등)
      */}
      <div>
        <h3 className="text-3xl font-black">{category.title}</h3>
      </div>
    </div>
  );
}