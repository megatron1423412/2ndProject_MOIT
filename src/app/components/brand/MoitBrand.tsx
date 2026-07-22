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
       - h-20 w-auto: 캐릭터 박스 높이를 줄여 불필요한 투명 여백 제거 (h-16, h-24 등 조절)
       - bg-transparent: 배경 상자 제거
    */
    <div className="relative flex h-25 w-auto flex-none items-center justify-center overflow-hidden bg-transparent shadow-none">
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
       - gap-0: 심볼과 우측 텍스트 기본 간격
       - -ml-4: 마이너스 마진으로 레터링 영역을 심볼 쪽으로 바짝 당김 (-ml-3, -ml-5 등으로 미세조정)
    */
    <div className={`flex items-center gap-0 ${className}`}>
      <BrandMark compact={false} />
      <div className="min-w-0 flex flex-col justify-center -ml-3">
        
        {/* 🎨 [프론트엔드 수정 가능 Zone 3: "모잇, MOIT" 텍스트 대신 들어가는 레터링 로고 이미지]
           - h-12: 레터링 로고 이미지 높이 (h-10, h-14 등으로 비율 조절)
           - src 경로: 레터링 로고 전용 파일 경로
        */}
        <div className="flex items-center">
          <img
            src="/assets/brand/moit_logo_blue_silver_transparent.png" 
            alt={BRAND.name}
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* 🎨 [프론트엔드 수정 가능 Zone 4: 하단 슬로건/태그라인 문구 (유지)]
           - pl-1: 슬로건 좌측 패딩으로 레터링 로고와의 중심 정렬 미세 조정 (pl-0, pl-2 등)
           - whitespace-nowrap: 줄바꿈 방지
           - text-[13px]: 슬로건 글자 크기
           - text-muted-foreground: 텍스트 색상
        */}
        <p className="whitespace-nowrap text-[12px] font-bold text-muted-foreground pl-1">
          {BRAND.tagline}
        </p>
      </div>
    </div>
  );
}