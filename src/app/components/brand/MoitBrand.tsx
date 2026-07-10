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
    <div className="relative flex h-11 w-11 flex-none items-center justify-center overflow-hidden rounded-lg bg-brand-surface text-brand-surface-foreground shadow-sm">
      {hasAsset && (
        <img
          src={assetPath}
          alt={BRAND.logoAlt}
          onError={() => setHasAsset(false)}
          className="h-full w-full object-contain p-1.5"
        />
      )}
      {!hasAsset && <Sparkles aria-hidden="true" size={19} className="text-accent" />}
    </div>
  );
}

/** Shared brand UI for the main header and chat sidebar. */
export default function MoitBrand({ variant = "full", className = "" }: MoitBrandProps) {
  if (variant === "compact") {
    return <BrandMark compact />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BrandMark compact={false} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-primary">모</span>
          <span className="text-2xl font-black text-accent">잇</span>
          <span className="ml-1 text-xs font-black tracking-widest text-muted-foreground">{BRAND.nameEnglish}</span>
        </div>
        <p className="whitespace-nowrap text-xs font-bold text-muted-foreground">{BRAND.tagline}</p>
      </div>
    </div>
  );
}
