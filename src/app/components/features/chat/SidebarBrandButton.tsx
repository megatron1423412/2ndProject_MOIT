import React from "react";
import { PanelLeftOpen } from "lucide-react";
import MoitBrand from "../../brand/MoitBrand";

interface SidebarBrandButtonProps {
  onExpand: () => void;
}

/** Fixed-size control: compact logo changes to the expand affordance on hover/focus. */
export default function SidebarBrandButton({ onExpand }: SidebarBrandButtonProps) {
  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label="사이드바 펼치기"
      title="사이드바 펼치기"
      className="group relative flex h-11 w-11 items-center justify-center rounded-lg outline-none transition-colors hover:bg-sidebar-accent focus-visible:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <span className="absolute transition-all duration-150 ease-out group-hover:scale-75 group-hover:opacity-0 group-focus-visible:scale-75 group-focus-visible:opacity-0">
        <MoitBrand variant="compact" />
      </span>
      <PanelLeftOpen
        aria-hidden="true"
        size={19}
        className="absolute scale-75 opacity-0 transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
      />
    </button>
  );
}
