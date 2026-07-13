import { Share2 } from "lucide-react";
import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip";
import PurchaseGradeShareMenu from "./PurchaseGradeShareMenu";
import type { ShareChannel } from "./shareChannels";

const PURCHASE_GRADE_SHARE_MENU_ID = "purchase-grade-share-menu";

export default function PurchaseGradeShareButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const handleSelect = (_channel: ShareChannel) => {
    // Prototype only: never open an external SNS page or invoke a sharing SDK.
    setIsOpen(false);
    setNotice("SNS 공유 기능은 준비 중이에요.");
  };

  return <div className="flex min-h-9 flex-col items-end gap-2" ref={containerRef}>
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" aria-label="공유하기" aria-haspopup="menu" aria-expanded={isOpen} aria-controls={PURCHASE_GRADE_SHARE_MENU_ID} onClick={() => { setIsOpen((value) => !value); setNotice(null); }} className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent/50">
            <Share2 aria-hidden="true" className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>공유하기</TooltipContent>
      </Tooltip>
      {isOpen ? <PurchaseGradeShareMenu menuId={PURCHASE_GRADE_SHARE_MENU_ID} onSelect={handleSelect} /> : null}
    </div>
    {notice ? <p role="status" aria-live="polite" className="max-w-40 text-right text-xs font-medium text-muted-foreground">{notice}</p> : null}
  </div>;
}
