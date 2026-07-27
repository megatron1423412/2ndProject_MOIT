import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { BRAND } from "../../config/brand";

export type MoitBrandVariant = "full" | "compact";
export type MoitBrandLayoutMode = "horizontal" | "stacked";

export interface MoitBrandProps {
  variant?: MoitBrandVariant;
  layoutMode?: MoitBrandLayoutMode;
  className?: string;
  /** 🎨 마스코트 캐릭터 아이콘 크기 클래스 (예: h-14, h-11 등 개별 지정) */
  mascotSizeClass?: string;
  /** 🎨 MOiT 레터링 로고 이미지 크기 클래스 (예: h-8, h-6 등 개별 지정) */
  logoHeightClass?: string;
  /** 🎨 슬로건 문구 스타일 및 크기 클래스 (예: text-[15px], text-[11px] 등 개별 지정) */
  sloganSizeClass?: string;
  /** 🎨 세로 구분선 (|) 스타일 클래스 (horizontal 모드 전용) */
  dividerClassName?: string;
  /** 🎨 로고 및 슬로건 수직 래퍼 커스텀 클래스 */
  contentWrapperClass?: string;
}

function BrandMark({ compact, mascotSizeClass }: { compact: boolean; mascotSizeClass?: string }) {
  const [hasAsset, setHasAsset] = useState(true);
  const assetPath = compact ? BRAND.compactLogoPath : BRAND.logoPath;

  useEffect(() => setHasAsset(true), [assetPath]);

  const defaultSize = compact ? "h-10 w-auto" : "h-11 w-auto";
  const sizeClass = mascotSizeClass ?? defaultSize;

  return (
    <div className={`relative flex flex-none items-center justify-center overflow-hidden bg-transparent shadow-none ${sizeClass}`}>
      {hasAsset && (
        <img
          src={assetPath}
          alt={BRAND.logoAlt}
          onError={() => setHasAsset(false)}
          className="h-full w-auto object-contain p-0"
        />
      )}
      {!hasAsset && <Sparkles aria-hidden="true" size={20} className="text-accent" />}
    </div>
  );
}

/** Shared brand UI for the main header and chat sidebar with independent controls. */
export default function MoitBrand({
  variant = "full",
  layoutMode = "horizontal",
  className = "",
  mascotSizeClass,
  logoHeightClass,
  sloganSizeClass,
  dividerClassName = "h-7 w-[1.5px] bg-slate-300 mx-2",
  contentWrapperClass = ""
}: MoitBrandProps) {
  if (variant === "compact") {
    return <BrandMark compact mascotSizeClass={mascotSizeClass} />;
  }

  // 1. [메인 페이지 상단 가로 나열 모드]
  if (layoutMode === "horizontal") {
    const mascotSize = mascotSizeClass ?? "h-13 sm:h-14 w-auto";
    const logoHeight = logoHeightClass ?? "h-7 sm:h-8 w-auto";
    const sloganSize = sloganSizeClass ?? "text-[14px] sm:text-[15px] font-bold text-[#1F2937]";

    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* 마스코트 이미지 (독립 크기 조절 가능) */}
        <BrandMark compact={false} mascotSizeClass={mascotSize} />

        {/* 레터링 로고 이미지 (독립 크기 조절 가능) */}
        <img
          src="/assets/brand/moit_logo_blue_silver_transparent.png"
          alt={BRAND.name}
          className={`${logoHeight} object-contain`}
        />

        {/* 세로 구분선 */}
        <div className={dividerClassName} />

        {/* 슬로건 (독립 크기 조절 가능) */}
        <p className={`whitespace-nowrap ${sloganSize} leading-none`}>
          {BRAND.tagline}
        </p>
      </div>
    );
  }

  // 2. [채팅 사이드바 상단 수직 수평 스택 모드] (슬로건이 레터링 로고 아래 수직 배치 & 왼쪽 정렬)
  const mascotSize = mascotSizeClass ?? "h-10 sm:h-11 w-auto";
  const logoHeight = logoHeightClass ?? "h-5 sm:h-6 w-auto";
  const sloganSize = sloganSizeClass ?? "text-[10px] sm:text-[11px] font-bold text-[#1F2937]";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* 마스코트 이미지 (독립 크기 조절 가능) */}
      <BrandMark compact={false} mascotSizeClass={mascotSize} />

      {/* 레터링 로고 아래 슬로건 수직 컬럼 배치 (왼쪽 정렬) */}
      <div className={`flex flex-col items-start justify-center text-left min-w-0 ${contentWrapperClass}`}>
        <img
          src="/assets/brand/moit_logo_blue_silver_transparent.png"
          alt={BRAND.name}
          className={`${logoHeight} object-contain self-start`}
        />
        <p className={`whitespace-nowrap ${sloganSize} text-left leading-tight mt-0.5 tracking-tight`}>
          {BRAND.tagline}
        </p>
      </div>
    </div>
  );
}