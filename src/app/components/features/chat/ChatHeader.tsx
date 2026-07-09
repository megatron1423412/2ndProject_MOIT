import React from "react";
import type { TopActionState } from "../../../types/moit";
import ChatHeaderActions from "./ChatHeaderActions";

interface ChatHeaderProps {
  actions: TopActionState;
  areActionsCollapsed: boolean;
  onToggleActionsCollapsed: () => void;
}

export default function ChatHeader({
  actions,
  areActionsCollapsed,
  onToggleActionsCollapsed,
}: ChatHeaderProps) {
  return (
    <header className="flex h-[68px] flex-shrink-0 items-center justify-end border-b border-border bg-card px-5 shadow-sm">
      <ChatHeaderActions
        actions={actions}
        isCollapsed={areActionsCollapsed}
        onToggleCollapsed={onToggleActionsCollapsed}
      />
    </header>
  );
}
