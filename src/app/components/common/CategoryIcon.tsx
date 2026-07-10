import React, { useEffect, useState } from "react";
import type { IconKey } from "../../types/moit";
import MoitIcon from "./MoitIcon";

interface CategoryIconProps {
  fallback: IconKey;
  iconPath?: string;
  size?: number;
  className?: string;
}

/**
 * Asset icons are rendered as a CSS mask, so monochrome SVG/transparent PNG
 * assets inherit the current theme color. The Lucide icon remains a fallback
 * until a real file is supplied or when its path cannot load.
 */
export default function CategoryIcon({ fallback, iconPath, size = 18, className = "" }: CategoryIconProps) {
  const [canUseAsset, setCanUseAsset] = useState(Boolean(iconPath));

  useEffect(() => setCanUseAsset(Boolean(iconPath)), [iconPath]);

  if (!iconPath || !canUseAsset) {
    return <MoitIcon name={fallback} size={size} className={className} />;
  }

  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src={iconPath} alt="" onError={() => setCanUseAsset(false)} className="sr-only" />
      <span
        className="h-full w-full bg-current"
        style={{
          maskImage: `url(${iconPath})`,
          maskRepeat: "no-repeat",
          maskPosition: "center",
          maskSize: "contain",
          WebkitMaskImage: `url(${iconPath})`,
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          WebkitMaskSize: "contain",
        }}
      />
    </span>
  );
}
