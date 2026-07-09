import React from "react";
import { Ellipsis } from "lucide-react";
import type { TopActionState } from "../../../types/moit";
import TopActionBar from "../../layout/TopActionBar";
import IconButton from "../../common/IconButton";

interface ChatHeaderActionsProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  actions: TopActionState;
}

export default function ChatHeaderActions({ isCollapsed, onToggleCollapsed, actions }: ChatHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {!isCollapsed && (
        <TopActionBar
          isLoggedIn={actions.isLoggedIn}
          isDarkMode={actions.isDarkMode}
          isFavorite={actions.isFavorite}
          onToggleLogin={actions.onToggleLogin}
          onToggleTheme={actions.onToggleTheme}
          onToggleFavorite={actions.onToggleFavorite}
        />
      )}
      <IconButton label={isCollapsed ? "액션 펼치기" : "액션 접기"} onClick={onToggleCollapsed}>
        <Ellipsis size={19} />
      </IconButton>
    </div>
  );
}
