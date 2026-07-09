import React from "react";
import type { HistoryStatus } from "../../types/moit";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "default" | "success" | "info" | "warning";
}

const toneClass = {
  default: "bg-secondary text-primary border-border",
  success: "bg-accent/15 text-accent border-accent/20",
  info: "bg-secondary text-primary border-border",
  warning: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-300/15 dark:text-amber-200 dark:border-amber-200/20",
};

export const historyStatusTone: Record<HistoryStatus, BadgeProps["tone"]> = {
  완료: "success",
  "진행 중": "info",
  "다시 확인 필요": "warning",
};

export default function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
