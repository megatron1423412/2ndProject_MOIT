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
    /* 🎨 [프론트엔드 수정 가능 Zone: 챗봇 상단 헤더 바 스타일]
       - h-[68px]: 헤더의 높이 (예: h-[60px], h-[72px] 등)
       - justify-end: 상단 액션 버튼들의 정렬 위치 (justify-between으로 변경 후 좌측 타이틀 추가 가능)
       - border-b border-border: 하단 테두리 선 굵기 및 색상
       - bg-card: 헤더 배경색 (bg-background, bg-muted 등)
       - px-5: 좌우 내부 여백(Padding)
       - shadow-sm: 하단 그림자 효과 (shadow-none, shadow-md 등)
    */
    <header className="flex h-[68px] flex-shrink-0 items-center justify-end border-b border-border bg-card px-5 shadow-sm">
      <ChatHeaderActions
        actions={actions}
        isCollapsed={areActionsCollapsed}
        onToggleCollapsed={onToggleActionsCollapsed}
      />
    </header>
  );
}