import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { BRAND } from "../../config/brand";

type MoitBrandVariant = "full" | "compact";

interface MoitBrandProps {
  variant?: MoitBrandVariant;
  className?: string;
}

function BrandMark({ compact }: { compact: boolean }) {
  const [hasAsset, setHasAsset] = useState(true);
  const assetPath = compact ? BRAND.compactLogoPath : BRAND.logoPath;

  useEffect(() => setHasAsset(true), [assetPath]);

  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 1: 로고 심볼/캐릭터 크기 및 박스]
       - h-14 w-14: 캐릭터 마크 크기
       - bg-transparent: 배경 상자 제거
    */
    <div className="relative flex h-30 w-auto flex-none items-center justify-center overflow-hidden bg-transparent shadow-none">
      {hasAsset && (
        <img
          src={assetPath}
          alt={BRAND.logoAlt}
          onError={() => setHasAsset(false)}
          className="h-full w-full object-contain p-0"
        />
      )}
      {!hasAsset && <Sparkles aria-hidden="true" size={24} className="text-accent" />}
    </div>
  );
}

/** Shared brand UI for the main header and chat sidebar. */
export default function MoitBrand({ variant = "full", className = "" }: MoitBrandProps) {
  if (variant === "compact") {
    return <BrandMark compact />;
  }

  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 2: 전체 로고 그룹 레이아웃 간격]
       - gap-3: 캐릭터 심볼과 우측 텍스트/레터링 영역 간격
    */
    <div className={`flex items-center gap-4 ${className}`}>
      <BrandMark compact={false} />
      <div className="min-w-0 flex flex-col justify-center pt-[20px]">
        
        {/* 🎨 [프론트엔드 수정 가능 Zone 3: "모잇, MOIT" 텍스트 대신 들어가는 레터링 로고 이미지]
           - h-6: 레터링 로고 이미지의 높이 (h-5, h-7 등으로 비율에 맞게 조절)
           - src 경로: 레터링 로고 전용 파일 경로 (예: "/assets/brand/lettering.png")
        */}
        <div className="flex items-center pb-1">
          <img
            src="/assets/brand/moit_logo_blue_silver_transparent.png" 
            alt={BRAND.name}
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* 🎨 [프론트엔드 수정 가능 Zone 4: 하단 슬로건/태그라인 문구 (유지)]
           - whitespace-nowrap: 줄바꿈 방지
           - text-xs: 슬로건 글자 크기
           - text-muted-foreground: 텍스트 색상
        */}
        <p className="whitespace-nowrap text-[13px] font-bold text-muted-foreground">{BRAND.tagline}</p>
      </div>
    </div>
  );
}