import React from "react";
import { ChevronRight } from "lucide-react";

interface SidebarAccordionChevronProps {
  isOpen: boolean;
  size?: number;
}

/** Fixed-width accordion affordance shared by expanded and collapsed navigation. */
export default function SidebarAccordionChevron({ isOpen, size = 15 }: SidebarAccordionChevronProps) {
  return (
    <span className="inline-flex w-4 shrink-0 items-center justify-center" aria-hidden="true">
      <ChevronRight size={size} className={`transition-transform duration-200 ease-out ${isOpen ? "rotate-90" : "rotate-0"}`} />
    </span>
  );
}
