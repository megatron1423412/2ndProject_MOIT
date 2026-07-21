import React from "react";
import type { SubCategory } from "../../../types/moit";

interface SubCategoryButtonProps {
  item: SubCategory;
  onSelect: (item: SubCategory) => void;
}

/* 🎨 [핵심!] 아이콘 ID별 미세 크기/비율 조절 매핑
   - 시각적으로 너무 작아 보이는 아이콘은 scale을 키우거나 h/w를 다르게 줍니다.
   - 여기에 없는 id는 기본값("h-24 w-24")으로 자동 처리됩니다.
*/
const ICON_SIZE_MAP: Record<string, string> = {
  "air-conditioner": "h-20 w-28 scale-130", // 에어컨: 가로로 길어서 가로폭 늘리고 살짝 확대
  "tv": "h-24 w-24 scale-105",               // TV: 기본 형태 유지하며 미세 확대
  "refrigerator": "h-26 w-20 scale-105",      // 냉장고: 세로형
  "vacuum": "h-28 w-22 scale-95",            // 청소기: 작아 보일 경우 확대
  "phone": "h-26 w-20 scale-95",             // 폰: 세로형
  "internet": "h-22 w-26 scale-105",          // 인터넷
  "iptv": "h-22 w-28 scale-115",              // IPTV
  "bundle": "h-24 w-24 scale-100",            // 결합 상품
};

export default function SubCategoryButton({ item, onSelect }: SubCategoryButtonProps) {
  // item.id에 해당하는 크기 클래스를 가져오고, 없으면 기본값 적용
  const customIconSize = ICON_SIZE_MAP[item.id] || "h-24 w-24";

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      /* 💡 items-center, justify-center, text-center를 적용하여 카드 전체 및 텍스트를 중앙 정렬 */
      className="group flex min-h-[180px] w-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-5 text-center shadow-sm transition-all hover:border-accent/60 hover:bg-secondary/50 hover:shadow-md active:scale-[0.98]"
    >
      {/* 1. 상단 구역: 아이콘 위치 조절 Zone */}
      <div className="flex w-full justify-center">
        {/* 상자 틀 자체는 h-25 w-25로 동일하게 잡아 정렬 맞춤 */}
        <div className="flex h-25 w-25 shrink-0 items-center justify-center bg-transparent p-1">
          <img 
            src={item.iconPath || `/icons/${item.id}.png`} 
            alt={item.title} 
            /* 🎨 customIconSize 변수를 적용하여 개별 아이콘의 크기/비율만 변경 */
            className={`${customIconSize} object-contain transition-transform duration-300 group-hover:scale-110`} 
          />
        </div>
      </div>

      {/* 2. 하단 구역: 타이틀 & 서브텍스트 (중앙 정렬) */}
      <div className="mt-3 flex flex-col items-center justify-center space-y-1.5">
        <h4 className="text-base font-black text-primary transition-colors group-hover:text-accent">
          {item.title}
        </h4>
        
        <p className="text-xs text-muted-foreground leading-relaxed break-keep text-center">
          {(item as any).description || `${item.title} 진단 및 맞춤 추천`}
        </p>
      </div>
    </button>
  );
}