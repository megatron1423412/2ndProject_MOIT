import React from "react";
import { Star } from "lucide-react";

interface Props {
  isFavorite: boolean;
  disabled?: boolean;
  onToggle: () => void;
  positionClassName?: string;
}

export const toggleFavoriteWithoutSelecting = (event: Pick<React.MouseEvent<HTMLButtonElement>, "stopPropagation">, onToggle: () => void) => {
  event.stopPropagation();
  onToggle();
};

export default function FavoriteToggleButton({ isFavorite, disabled = false, onToggle, positionClassName = "absolute right-3 top-3" }: Props) {
  const label = isFavorite ? "즐겨찾기에서 삭제" : "즐겨찾기에 추가";
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isFavorite}
      title={label}
      disabled={disabled}
      onClick={(event) => toggleFavoriteWithoutSelecting(event, onToggle)}
      className={`${positionClassName} z-10 inline-flex size-8 items-center justify-center rounded-full border border-border bg-card/95 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-amber-400/60 disabled:cursor-default disabled:opacity-60 ${isFavorite ? "text-amber-400 hover:text-amber-500" : "text-muted-foreground hover:border-amber-300 hover:text-amber-400"}`}
    >
      <Star size={17} fill={isFavorite ? "currentColor" : "none"} />
    </button>
  );
}
