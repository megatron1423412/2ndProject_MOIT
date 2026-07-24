import React from "react";
import MoitBrand from "../brand/MoitBrand";

export interface BrandHeaderProps {
  onClick?: () => void;
  className?: string;
  layoutMode?: "horizontal" | "stacked";
  mascotSizeClass?: string;
  logoHeightClass?: string;
  sloganSizeClass?: string;
  dividerClassName?: string;
  contentWrapperClass?: string;
}

export default function BrandHeader({
  onClick,
  className = "",
  layoutMode,
  mascotSizeClass,
  logoHeightClass,
  sloganSizeClass,
  dividerClassName,
  contentWrapperClass
}: BrandHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg text-left transition-opacity hover:opacity-85 ${className}`}
    >
      <MoitBrand
        layoutMode={layoutMode}
        mascotSizeClass={mascotSizeClass}
        logoHeightClass={logoHeightClass}
        sloganSizeClass={sloganSizeClass}
        dividerClassName={dividerClassName}
        contentWrapperClass={contentWrapperClass}
      />
    </button>
  );
}
