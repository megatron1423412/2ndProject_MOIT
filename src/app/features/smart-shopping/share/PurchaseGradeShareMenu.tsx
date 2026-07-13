import { Share2 } from "lucide-react";
import React from "react";
import { PURCHASE_GRADE_SHARE_CHANNELS, type ShareChannel } from "./shareChannels";

function ShareChannelIcon({ channel }: { channel: ShareChannel }) {
  const [hasImageError, setHasImageError] = React.useState(false);
  const canUseAsset = channel.iconPolicy === "official-local-asset" && channel.iconPath && !hasImageError;

  if (!canUseAsset) return <Share2 aria-hidden="true" className="size-4 text-muted-foreground" strokeWidth={2} />;

  return <img src={channel.iconPath} alt="" aria-hidden="true" className="size-5 object-contain" onError={() => setHasImageError(true)} />;
}

export default function PurchaseGradeShareMenu({ menuId, onSelect }: { menuId: string; onSelect: (channel: ShareChannel) => void }) {
  return <div id={menuId} role="menu" aria-label="공유하기" className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg dark:shadow-black/30">
    <p className="px-2 pb-2 pt-1 text-sm font-black text-primary">공유하기</p>
    <div className="space-y-1">
      {PURCHASE_GRADE_SHARE_CHANNELS.map((channel) => <button key={channel.id} type="button" role="menuitem" onClick={() => onSelect(channel)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-bold text-primary outline-none transition hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-accent/40">
        <span className="flex size-7 shrink-0 items-center justify-center" aria-hidden="true"><ShareChannelIcon channel={channel} /></span>
        {channel.label}
      </button>)}
    </div>
    <p className="mt-2 border-t border-border px-2 pt-2 text-[11px] text-muted-foreground">공유 기능 준비 중</p>
  </div>;
}
