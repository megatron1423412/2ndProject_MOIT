import React from "react";
import type { HistoryStatus } from "../../types/moit";

interface BadgeProps {
  children: React.ReactNode;
  tone?: "default" | "success" | "info" | "warning";
}

const toneClass = {
  default: "bg-secondary text-primary border-border",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  info: "bg-sky-50 text-sky-700 border-sky-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
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
