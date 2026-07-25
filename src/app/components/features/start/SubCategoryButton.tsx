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
  "air-conditioner": "h-20 w-20",
  "tv": "h-20 w-15",
  "refrigerator": "h-20 w-15",
  "vacuum": "h-20 w-15",
  "phone": "h-18 w-15",
  "internet": "h-20 w-15",
  "iptv": "h-18 w-18",
  "bundle": "h-18 w-15",
};

export default function SubCategoryButton({ item, onSelect }: SubCategoryButtonProps) {
  const customIconSize = ICON_SIZE_MAP[item.id] || "h-18 w-18";

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      /* 💡 2x2 수직 그리드 카드 형태: 상단 아이콘 - 중앙 볼드 제목 - 하단 설명 텍스트 */
      className="group flex h-48 min-h-[145px] w-full max-w-[250px] sm:max-w-none flex-col items-center justify-between rounded-xl border border-slate-100 bg-white p-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-[#60A5FA]/20 hover:shadow-md active:scale-[0.98] sm:p-5 xl:p-6 2xl:p-7 xl:min-h-[165px] 2xl:min-h-[185px]"
    >
      {/* 1. 상단: 3D 아이콘 구역 (중앙 정렬) */}
      <div className="flex w-full justify-center pt-1">
        <div className="flex h-14 w-20 shrink-0 items-center justify-center bg-transparent xl:h-16 xl:w-24">
          <img
            src={item.iconPath || `/icons/${item.id}.png`}
            alt={item.title}
            className={`${customIconSize} object-contain transition-transform duration-300 group-hover:scale-110`}
          />
        </div>
      </div>

      {/* 2. 중앙 및 하단: 타이틀(볼드) 및 설명 텍스트 */}
      <div className="mt-3 flex flex-1 flex-col items-center justify-center space-y-1">
        <h4 className="text-sm font-bold text-[#6E7581] transition-colors group-hover:text-[#1F2937] sm:text-base xl:text-lg 2xl:text-lg">
          {item.title}
        </h4>

        <p className="text-[11px] sm:text-xs leading-relaxed text-slate-500 break-keep text-center xl:text-sm xl:text-lg">
          {(item as any).description || `${item.title} 진단 및 맞춤 추천`}
        </p>
      </div>
    </button>
  );
}