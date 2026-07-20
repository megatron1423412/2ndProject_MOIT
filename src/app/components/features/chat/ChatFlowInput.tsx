import React, { useEffect, useState } from "react";
import { Send, Star } from "lucide-react";
import type { AnswerInputStep, SubmittedFlowAnswer } from "../../../features/chat-flow/core/types";
import QuickReplyChips from "./QuickReplyChips";
import type { FavoriteProduct, FavoriteDraft } from "../../../features/favorites/types";

const getPlanDetails = (value: string, label: string, subCategoryId: string) => {
  let name = label;
  let price = 0;
  let brand = "통신사";

  // 1. Remove ranking prefix
  name = name.replace(/^\[추천 \d순위\]\s*/, "");

  // 2. Parse price (e.g. "월 33,000원", "월 33000원")
  const priceMatch = label.match(/월\s*([\d,]+)원/);
  if (priceMatch) {
    price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
  }

  // 3. Clean price parts from name
  name = name.replace(/\s*\(월\s*[\d,]+원\)/, "").trim();
  name = name.replace(/\s*-\s*월\s*[\d,]+원/, "").trim();

  // 4. Determine brand/carrier
  const valLower = value.toLowerCase();
  const catLower = subCategoryId.toLowerCase();

  if (catLower === "phone") {
    if (value === "rec-mock-1") {
      brand = "알뜰폰";
    } else if (value === "rec-mock-2") {
      brand = "KT";
    } else if (valLower.includes("skt") || valLower.includes("sk-")) {
      brand = "SKT";
    } else if (valLower.includes("kt")) {
      brand = "KT";
    } else if (valLower.includes("lgu") || valLower.includes("lg-")) {
      brand = "LGU+";
    }
  } else if (catLower === "internet") {
    if (valLower.includes("sk")) {
      brand = "SK브로드밴드";
    } else if (valLower.includes("kt")) {
      brand = "KT올레";
    } else if (valLower.includes("lg")) {
      brand = "LG유플러스";
    } else {
      brand = "인터넷";
    }
  } else if (catLower === "iptv") {
    if (valLower.includes("sk")) {
      brand = "SKT";
    } else if (valLower.includes("kt")) {
      brand = "KT";
    } else if (valLower.includes("lg")) {
      brand = "LGU+";
    } else {
      brand = "IPTV";
    }
  } else if (catLower === "bundle") {
    if (valLower.includes("sk")) {
      brand = "SK";
    } else if (valLower.includes("kt")) {
      brand = "KT";
    } else if (valLower.includes("lg")) {
      brand = "LGU";
    } else if (valLower.includes("skylife")) {
      brand = "SKYLIFE";
    } else {
      brand = "결합상품";
    }
  }

  return { name, price, brand };
};

interface ChatFlowInputProps {
  step: AnswerInputStep | null;
  completed: boolean;
  onSubmit: (answer: SubmittedFlowAnswer) => void;
  onReset: () => void;
  userId?: string;
  favorites?: FavoriteProduct[];
  onToggleFavoriteProduct?: (productId: string, draft: FavoriteDraft) => void;
  subCategoryId?: string;
  isHistorical?: boolean;
  answers?: Record<string, any>;
  onEndSmartShoppingChat?: () => void;
}

export default function ChatFlowInput({
  step,
  completed,
  onSubmit,
  onReset,
  userId,
  favorites,
  onToggleFavoriteProduct,
  subCategoryId,
  isHistorical = false,
  answers,
  onEndSmartShoppingChat,
}: ChatFlowInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  useEffect(() => {
    setInputValue("");
    setSelectedValues([]);
  }, [step?.id]);

  if (completed) {
    return <QuickReplyChips replies={["처음부터 다시 진단하기"]} onSelect={onReset} />;
  }
  if (!step) return null;

  if (step.type === "single-choice") {
    if (step.id === "Q_P2_2" || step.id === "Q_P2_1") {
      const hasPenalty = answers && (
        answers["bundle.allPenalty"] || 
        answers["bundle.ptaPenalty"] || 
        answers["bundle.ptbPenalty"] || 
        answers["bundle.diffPenalty"] ||
        answers["bundle.ptaComboPenalty"] ||
        answers["bundle.ptbComboPenalty"] ||
        answers["bundle.diffInternetPenalty"] ||
        answers["bundle.diffTvPenalty"] ||
        answers["bundle.newAPenalty"] ||
        answers["bundle.newBPenalty"]
      );

      const cardOptions = [
        {
          value: "mvno",
          label: "고정 비용 최소화 추천",
          description: "알뜰폰·케이블 최저가 위주로 추천해드려요"
        },
        {
          value: "mno",
          label: "품질 및 결합 혜택 우선 추천",
          description: "대기업 3사 결합 위주로 추천해드려요"
        },
        {
          value: "any",
          label: "위약금 대비 실질 이득 추천",
          description: "위약금을 내고 갈아타도 진짜 이득인지 비교해드려요",
          subDescription: hasPenalty 
            ? undefined 
            : "- 위약금을 입력하지 않았을 경우, 정확한 진단이 어렵습니다. 제일 저렴한 상품 중심으로 추천됩니다."
        }
      ];

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {cardOptions.map((opt) => {
            const userSelectedThis = answers && answers[step.answerKey] === opt.value;
            let borderClass = "";
            if (isHistorical) {
              if (userSelectedThis) {
                borderClass = "border-indigo-500 bg-indigo-500/10 opacity-90 cursor-not-allowed";
              } else {
                borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
              }
            } else {
              borderClass = "border-border bg-card hover:border-indigo-500/50 hover:bg-indigo-500/5 active:scale-[0.99] cursor-pointer";
            }

            return (
              <div
                key={opt.value}
                onClick={isHistorical ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                className={`flex flex-col gap-1 rounded-xl border p-4 text-left shadow-sm transition-all duration-200 ${borderClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-primary">
                    {opt.label}
                  </span>
                  {isHistorical && userSelectedThis && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      선택됨 ✓
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {opt.description}
                </p>
                {opt.subDescription && (
                  <p className="mt-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-500 leading-normal">
                    {opt.subDescription}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (step.id === "Q_NEW_SELECT") {
      const cardOptions = [
        {
          value: "new_mobile",
          label: "모바일 요금제도 새로 가입할래요",
          description: "신규가입/번호이동"
        },
        {
          value: "keep_mobile",
          label: "모바일 요금제 유지",
          description: "결합 필요"
        }
      ];

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {cardOptions.map((opt) => {
            const userSelectedThis = answers && answers[step.answerKey] === opt.value;
            let borderClass = "";
            if (isHistorical) {
              if (userSelectedThis) {
                borderClass = "border-indigo-500 bg-indigo-500/10 opacity-90 cursor-not-allowed";
              } else {
                borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
              }
            } else {
              borderClass = "border-border bg-card hover:border-indigo-500/50 hover:bg-indigo-500/5 active:scale-[0.99] cursor-pointer";
            }

            return (
              <div
                key={opt.value}
                onClick={isHistorical ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                className={`flex flex-col gap-1 rounded-xl border p-4 text-left shadow-sm transition-all duration-200 ${borderClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-primary">
                    {opt.label}
                  </span>
                  {isHistorical && userSelectedThis && (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      선택됨 ✓
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            );
          })}
        </div>
      );
    }

    if (
      step.id === "phone-ask-grade" ||
      step.id === "internet-ask-grade" ||
      step.id === "iptv-ask-grade-diagnosis" ||
      step.id === "bundle-ask-grade"
    ) {
      const userSelectedYes = answers && answers[step.answerKey] === "yes";

      let borderClass = "";
      if (isHistorical) {
        if (userSelectedYes) {
          borderClass = "border-emerald-500 bg-emerald-500/10 opacity-90 cursor-not-allowed";
        } else {
          borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
        }
      } else {
        borderClass = "border-emerald-500 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-400/10 dark:hover:bg-emerald-400/15 cursor-pointer";
      }

      return (
        <div className="w-full max-w-md space-y-3">
          <div
            onClick={isHistorical ? undefined : () => onSubmit({ value: "yes", displayValue: "YES" })}
            className={`w-full rounded-xl border-2 p-5 text-left shadow-sm transition-all duration-200 ${borderClass}`}
          >
            <p className="text-lg font-black text-emerald-800 dark:text-emerald-200">
              ⭐구매등급진단⭐
            </p>
            <p className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
              해당 물건을 구매하시면 얼마나 가성비 있게 소비하시는지 알려드려요😇
            </p>
            {isHistorical && userSelectedYes && (
              <span className="mt-2 inline-block rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                선택됨 ✓
              </span>
            )}
          </div>
          
          {!isHistorical && (
            <div className="flex justify-start">
              <button
                type="button"
                onClick={onEndSmartShoppingChat}
                className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-black text-primary hover:bg-muted focus:outline-none transition-all active:scale-[0.98]"
              >
                채팅 종료하기
              </button>
            </div>
          )}
        </div>
      );
    }
    if (
      step.id === "phone-current-plans-list" ||
      step.id === "internet-current-plans-list" ||
      step.id === "iptv-current-plans-list" ||
      step.id === "bundle-current-plans-list"
    ) {
      const planOptions = step.options.filter((o) => o.value !== "none-of-them");
      const noneOfThemOption = step.options.find((o) => o.value === "none-of-them");

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {planOptions.map((opt) => {
              const userSelectedThis = answers && answers[step.answerKey] === opt.value;
              let borderClass = "";
              if (isHistorical) {
                if (userSelectedThis) {
                  borderClass = "border-emerald-500 bg-emerald-500/10 opacity-90 cursor-not-allowed";
                } else {
                  borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
                }
              } else {
                borderClass = "border-border bg-card hover:border-emerald-500/50 hover:bg-emerald-500/5 active:scale-[0.99] cursor-pointer";
              }

              return (
                <div
                  key={opt.value}
                  onClick={isHistorical ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                  className={`flex flex-col gap-1 rounded-xl border p-3.5 text-left shadow-sm transition-all duration-200 ${borderClass}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-primary">
                      {opt.label.split(" (월 ")[0]}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {(opt.label.match(/월\s*([\d,]+원)/)?.[1]) || ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {!isHistorical && noneOfThemOption && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => onSubmit({ value: noneOfThemOption.value, displayValue: noneOfThemOption.label })}
                className="rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
              >
                {noneOfThemOption.label}
              </button>
            </div>
          )}
        </div>
      );
    }

    if (
      step.id === "phone-current-plan-api" ||
      step.id === "internet-current-plan-api" ||
      step.id === "iptv-current-plan-api" ||
      step.id === "bundle-current-plan-api"
    ) {
      const planOption = step.options.find(
        (o) => o.value !== "direct-select" && o.value !== "direct-input"
      );
      
      const directSelectOption = step.options.find((o) => o.value === "direct-select");
      const directInputOption = step.options.find((o) => o.value === "direct-input");

      const userSelectedThis = planOption && answers && answers[step.answerKey] === planOption.value;

      let borderClass = "";
      if (isHistorical) {
        if (userSelectedThis) {
          borderClass = "border-emerald-500 bg-emerald-500/10 opacity-90 cursor-not-allowed";
        } else {
          borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
        }
      } else {
        borderClass = "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10";
      }

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {planOption && (
            <div 
              onClick={isHistorical ? undefined : () => onSubmit({ value: planOption.value, displayValue: planOption.label })}
              className={`group relative rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col gap-2 ${!isHistorical ? "cursor-pointer active:scale-[0.99] hover:shadow-md" : ""} ${borderClass}`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  조회된 기존 요금제 (추정)
                </span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 group-hover:underline">
                  {isHistorical ? (userSelectedThis ? "선택됨 ✓" : "") : "이 요금제 선택하기 →"}
                </span>
              </div>
              <h4 className="text-sm font-black text-primary transition-colors">
                {planOption.label}
              </h4>
              <p className="text-xs text-muted-foreground leading-normal">
                고객님이 입력하신 납부 금액 정보를 기반으로 통신사 API에서 조회 및 추정한 기존 가입 요금제 스펙입니다.
              </p>
            </div>
          )}
          
          {!isHistorical && (
            <div className="flex flex-wrap gap-2 justify-center">
              {directSelectOption && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directSelectOption.value, displayValue: directSelectOption.label })}
                  className="rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directSelectOption.label}
                </button>
              )}
              {directInputOption && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directInputOption.value, displayValue: directInputOption.label })}
                  className="rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directInputOption.label}
                </button>
              )}
            </div>
          )}
        </div>
      );
    }
    if (
      step.id === "phone-recommendation-api" ||
      step.id === "internet-recommendation-api" ||
      step.id === "iptv-select-new-plan" ||
      step.id === "bundle-recommendation-api" ||
      step.id === "bundle-all-plans-select"
    ) {
      const cardOptions = step.options.filter(
        (o) => !["direct-choose", "direct-select", "direct-input"].includes(o.value)
      );
      const directChoose = step.options.find((o) => o.value === "direct-choose");
      const directSelect = step.options.find((o) => o.value === "direct-select");
      const directInput = step.options.find((o) => o.value === "direct-input");
      
      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="grid grid-cols-2 gap-3">
            {cardOptions.map((opt, idx) => {
              const isFav = favorites?.some((f) => f.productId === opt.value);
              const cleanLabel = opt.label
                .replace("[추천 1순위] ", "")
                .replace("[추천 2순위] ", "");
              
              const isRec1 = opt.label.includes("1순위") || idx === 0;
              const isRec2 = opt.label.includes("2순위") || idx === 1;
              
              const userSelectedThis = answers && answers[step.answerKey] === opt.value;

              let borderClass = "";
              if (isHistorical) {
                if (userSelectedThis) {
                  borderClass = isRec1
                    ? "border-emerald-500 bg-emerald-500/10 opacity-90 cursor-not-allowed"
                    : isRec2
                      ? "border-blue-500 bg-blue-500/10 opacity-90 cursor-not-allowed"
                      : "border-accent bg-accent/10 opacity-90 cursor-not-allowed";
                } else {
                  borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
                }
              } else {
                borderClass = isRec1 
                  ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10" 
                  : isRec2 
                    ? "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/50 hover:bg-blue-500/10"
                    : "border-border bg-card hover:border-accent/50 hover:bg-secondary";
              }
              
              const textClass = isRec1 
                ? "text-emerald-600 dark:text-emerald-400" 
                : isRec2 
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-accent";

              const badgeBg = isRec1 ? "bg-emerald-600" : isRec2 ? "bg-blue-600" : "bg-accent";
              const badgeLabel = opt.label.includes("1순위") 
                ? "1순위 추천" 
                : opt.label.includes("2순위") 
                  ? "2순위 추천" 
                  : `선택안 ${idx + 1}`;

              return (
                <div 
                  key={opt.value}
                  onClick={isHistorical ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                  className={`group relative rounded-2xl border p-4 shadow-sm transition-all duration-200 flex flex-col gap-2 h-full justify-between ${!isHistorical ? "cursor-pointer active:scale-[0.99] hover:shadow-md" : ""} ${borderClass}`}
                >
                  <div className="flex flex-col gap-1 pr-6">
                    <span className={`self-start rounded px-1.5 py-0.5 text-[8px] font-black text-white uppercase ${badgeBg}`}>
                      {badgeLabel}
                    </span>
                    <h4 className="text-xs font-black text-primary transition-colors mt-1">
                      {cleanLabel}
                    </h4>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleFavoriteProduct) {
                        const details = getPlanDetails(opt.value, opt.label, subCategoryId || "");
                        onToggleFavoriteProduct(opt.value, {
                          userId: userId || "mock-user",
                          productId: opt.value,
                          source: "internal",
                          categoryId: subCategoryId as any,
                          name: details.name,
                          brand: details.brand,
                          currentPrice: details.price,
                          dataStatus: "mock",
                          imagePath: "",
                        });
                      }
                    }}
                    className="absolute right-2 top-2 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
                  >
                    {isFav ? (
                      <Star size={15} className="fill-yellow-400 text-yellow-400" />
                    ) : (
                      <Star size={15} className="text-muted-foreground" />
                    )}
                  </button>

                  <span className={`text-[9px] font-bold group-hover:underline text-right mt-2 ${textClass}`}>
                    {isHistorical ? (userSelectedThis ? "선택됨 ✓" : "") : "선택하기 →"}
                  </span>
                </div>
              );
            })}
          </div>
          
          {!isHistorical && (
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {directChoose && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directChoose.value, displayValue: directChoose.label })}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directChoose.label}
                </button>
              )}
              {directSelect && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directSelect.value, displayValue: directSelect.label })}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directSelect.label}
                </button>
              )}
              {directInput && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directInput.value, displayValue: directInput.label })}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directInput.label}
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    const selectedOpt = step.options.find(o => answers && answers[step.answerKey] === o.value);
    const selectedLabel = selectedOpt?.label;

    return (
      <QuickReplyChips
        replies={step.options.map((option) => option.label)}
        onSelect={(label) => {
          const option = step.options.find((item) => item.label === label);
          if (option) onSubmit({ value: option.value, displayValue: option.label });
        }}
        disabled={isHistorical}
        selectedValue={selectedLabel}
      />
    );
  }

  if (step.type === "confirmation") {
    const confirmLabel = step.confirmLabel ?? "확인";
    const cancelLabel = step.cancelLabel ?? "취소";
    const selectedVal = answers && answers[step.answerKey];
    const selectedLabel = selectedVal === true ? confirmLabel : (selectedVal === false ? cancelLabel : undefined);

    return (
      <QuickReplyChips
        replies={[confirmLabel, cancelLabel]}
        onSelect={(label) => onSubmit({ value: label === confirmLabel, displayValue: label })}
        disabled={isHistorical}
        selectedValue={selectedLabel}
      />
    );
  }

  if (step.type === "multi-choice") {
    const minimum = step.minSelections ?? 1;
    const currentSelections = answers ? (answers[step.answerKey] as string[] || []) : [];

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {step.options.map((option) => {
            const selected = isHistorical 
              ? currentSelections.includes(option.value)
              : selectedValues.includes(option.value);

            const btnClass = isHistorical
              ? selected
                ? "border-accent bg-accent text-accent-foreground opacity-90 cursor-not-allowed"
                : "border-border bg-card text-primary opacity-40 cursor-not-allowed"
              : selected
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-primary hover:border-accent/50 hover:bg-secondary";

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                disabled={isHistorical}
                onClick={() => !isHistorical && setSelectedValues((current) => selected ? current.filter((value) => value !== option.value) : [...current, option.value])}
                className={`rounded-full border px-3.5 py-2 text-xs font-bold shadow-sm transition-all active:scale-[0.98] ${btnClass}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {!isHistorical && (
          <button
            type="button"
            disabled={selectedValues.length < minimum}
            onClick={() => {
              const labels = step.options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label);
              onSubmit({ value: selectedValues, displayValue: labels.join(", ") });
            }}
            className="self-start rounded-lg bg-brand-surface px-4 py-2 text-xs font-black text-brand-surface-foreground transition-all enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            선택 완료
          </button>
        )}
      </div>
    );
  }

  const numeric = step.type === "number-input";
  const trimmed = inputValue.trim();
  const numericValue = numeric ? Number(trimmed) : null;
  const isValidNumber = !numeric || (
    trimmed !== "" && Number.isFinite(numericValue) &&
    (step.min === undefined || numericValue! >= step.min) &&
    (step.max === undefined || numericValue! <= step.max)
  );
  const canSubmit = trimmed !== "" && isValidNumber;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      value: numeric ? numericValue! : trimmed,
      displayValue: numeric && step.unit ? `${numericValue!.toLocaleString("ko-KR")}${step.unit}` : trimmed,
    });
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-input-background px-3 py-2">
      <input
        type={numeric ? "number" : "text"}
        inputMode={numeric ? "numeric" : "text"}
        min={numeric ? step.min : undefined}
        max={numeric ? step.max : undefined}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
        placeholder={step.placeholder ?? "답변을 입력해주세요"}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${canSubmit ? "bg-accent text-accent-foreground shadow-sm active:scale-[0.96]" : "bg-muted text-muted-foreground/60"}`}
        title="전송"
        aria-label="답변 전송"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
