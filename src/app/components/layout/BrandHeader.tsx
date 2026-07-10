import React from "react";
import MoitBrand from "../brand/MoitBrand";

interface BrandHeaderProps {
  onClick?: () => void;
}

export default function BrandHeader({ onClick }: BrandHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg text-left transition-opacity hover:opacity-85"
    >
      <MoitBrand />
    </button>
  );
}
