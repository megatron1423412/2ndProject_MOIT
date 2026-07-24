import React from "react";

interface ConditionSummaryCardProps {
  text: string;
  stepId?: string;
}

export default function ConditionSummaryCard({ text, stepId }: ConditionSummaryCardProps) {
  // Parse lines from text
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items: { label: string; value: string }[] = [];
  let categoryName = "에어컨";

  if (stepId?.startsWith("rf-") || text.includes("냉장고")) categoryName = "냉장고";
  else if (stepId?.startsWith("tv-") || text.includes("TV")) categoryName = "TV";
  else if (stepId?.startsWith("vc-") || text.includes("청소기")) categoryName = "청소기";

  for (const line of lines) {
    // Match line formats like:
    // • **타입**: 벽걸이형
    // • 타입: 벽걸이형
    // - 타입: 벽걸이형
    // · 타입: 벽걸이형
    const cleaned = line.replace(/^[•\-\·\*\s]+/, "").trim();
    if (cleaned.includes(":")) {
      const parts = cleaned.split(":");
      const rawLabel = parts[0].replace(/\*/g, "").trim();
      const rawValue = parts.slice(1).join(":").replace(/\*/g, "").trim();
      if (rawLabel && rawValue) {
        items.push({ label: rawLabel, value: rawValue });
      }
    }
  }

  // Find type or size for main title highlight
  const typeItem = items.find((i) => i.label.includes("타입") || i.label.includes("도어") || i.label.includes("화면") || i.label.includes("동력"));
  const mainTitle = typeItem
    ? `${typeItem.value} 맞춤 진단 조건`
    : `${categoryName} 맞춤 진단 조건`;

  return (
    <div className="w-full rounded-2xl border border-emerald-200/80 bg-[#F4FBF7] p-4 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-950/30 select-none my-1">
      {/* 1. 상단 태그 & 진단 안내 */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-block rounded-md bg-[#E8F5E9] px-2.5 py-1 text-xs font-semibold text-[#2E7D32] dark:bg-emerald-900/60 dark:text-emerald-200">
          입력해 주신 조건 요약
        </span>
        <span className="text-xs font-semibold text-[#2E7D32] dark:text-emerald-300 flex items-center gap-1">
          조건 설정 완료 ✓
        </span>
      </div>

      {/* 2. 메인 타이틀 */}
      <h4 className="mt-2.5 text-base font-bold text-slate-800 dark:text-slate-100">
        {mainTitle}
      </h4>

      {/* 3. 스펙 요약 내입 박스 */}
      <div className="mt-3 rounded-xl border border-[#C8E6C9] bg-[#E8F5E9]/70 p-3.5 dark:border-emerald-800/50 dark:bg-emerald-950/40">
        <div className="space-y-1.5 text-xs sm:text-sm font-semibold text-[#1B5E20] dark:text-emerald-200">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="opacity-70 flex-none">•</span>
              <span className="leading-snug">
                <strong className="font-bold text-[#1B5E20] dark:text-emerald-100">{item.label}</strong>: {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 하단 설명 문구 */}
      <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        고객님이 입력하신 조건 정보를 기반으로 최적의 {categoryName} 라인업을 진단합니다.
      </p>
    </div>
  );
}
