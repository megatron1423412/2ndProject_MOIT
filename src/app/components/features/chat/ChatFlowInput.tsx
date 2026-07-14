import React, { useEffect, useState } from "react";
import { Send } from "lucide-react";
import type { AnswerInputStep, SubmittedFlowAnswer } from "../../../features/chat-flow/core/types";
import QuickReplyChips from "./QuickReplyChips";

interface ChatFlowInputProps {
  step: AnswerInputStep | null;
  completed: boolean;
  onSubmit: (answer: SubmittedFlowAnswer) => void;
  onReset: () => void;
}

export default function ChatFlowInput({ step, completed, onSubmit, onReset }: ChatFlowInputProps) {
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
    if (step.id === "phone-current-plan-api" || step.id === "internet-current-plan-api" || step.id === "iptv-current-plan-api") {
      const planOption = step.options.find(
        (o) => o.value !== "direct-select" && o.value !== "direct-input"
      );
      
      const directSelectOption = step.options.find((o) => o.value === "direct-select");
      const directInputOption = step.options.find((o) => o.value === "direct-input");
      
      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {planOption && (
            <div 
              onClick={() => onSubmit({ value: planOption.value, displayValue: planOption.label })}
              className="group relative cursor-pointer rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm hover:shadow-md hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-200 active:scale-[0.99] flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  조회된 기존 요금제 (추정)
                </span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 group-hover:underline">
                  이 요금제 선택하기 →
                </span>
              </div>
              <h4 className="text-sm font-black text-primary group-hover:text-emerald-600 transition-colors">
                {planOption.label}
              </h4>
              <p className="text-xs text-muted-foreground leading-normal">
                고객님이 입력하신 납부 금액 정보를 기반으로 통신사 API에서 조회 및 추정한 기존 가입 요금제 스펙입니다.
              </p>
            </div>
          )}
          
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
        </div>
      );
    }
    if (step.id === "phone-recommendation-api" || step.id === "internet-recommendation-api" || step.id === "iptv-select-new-plan" || step.id === "bundle-recommendation-api") {
      const isInternet = step.id === "internet-recommendation-api";
      const isIptv = step.id === "iptv-select-new-plan";
      const isBundle = step.id === "bundle-recommendation-api";

      let rec1 = null;
      let rec2 = null;

      if (isIptv || isBundle) {
        const validOptions = step.options.filter((o) => o.value !== "direct-choose" && o.value !== "direct-select" && o.value !== "direct-input");
        rec1 = validOptions[0];
        rec2 = validOptions[1];
      } else {
        const rec1Val = isInternet ? "rec-internet-1" : "rec-mock-1";
        const rec2Val = isInternet ? "rec-internet-2" : "rec-mock-2";
        rec1 = step.options.find((o) => o.value === rec1Val);
        rec2 = step.options.find((o) => o.value === rec2Val);
      }

      const directChoose = step.options.find((o) => o.value === "direct-choose");
      const directSelect = step.options.find((o) => o.value === "direct-select");
      const directInput = step.options.find((o) => o.value === "direct-input");
      
      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="grid grid-cols-2 gap-3">
            {rec1 && (
              <div 
                onClick={() => onSubmit({ value: rec1.value, displayValue: rec1.label })}
                className="group cursor-pointer rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm hover:shadow-md hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-200 active:scale-[0.99] flex flex-col gap-2 h-full justify-between"
              >
                <div className="flex flex-col gap-1">
                  <span className="self-start rounded bg-emerald-600 px-1.5 py-0.5 text-[8px] font-black text-white uppercase">
                    1순위 추천
                  </span>
                  <h4 className="text-xs font-black text-primary group-hover:text-emerald-600 transition-colors mt-1">
                    {rec1.label.replace("[추천 1순위] ", "")}
                  </h4>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline text-right mt-2">
                  선택하기 →
                </span>
              </div>
            )}
            
            {rec2 && (
              <div 
                onClick={() => onSubmit({ value: rec2.value, displayValue: rec2.label })}
                className="group cursor-pointer rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm hover:shadow-md hover:border-blue-500/50 hover:bg-blue-500/10 transition-all duration-200 active:scale-[0.99] flex flex-col gap-2 h-full justify-between"
              >
                <div className="flex flex-col gap-1">
                  <span className="self-start rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-black text-white uppercase">
                    2순위 추천
                  </span>
                  <h4 className="text-xs font-black text-primary group-hover:text-blue-600 transition-colors mt-1">
                    {rec2.label.replace("[추천 2순위] ", "")}
                  </h4>
                </div>
                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 group-hover:underline text-right mt-2">
                  선택하기 →
                </span>
              </div>
            )}
          </div>
          
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
        </div>
      );
    }

    return (
      <QuickReplyChips
        replies={step.options.map((option) => option.label)}
        onSelect={(label) => {
          const option = step.options.find((item) => item.label === label);
          if (option) onSubmit({ value: option.value, displayValue: option.label });
        }}
      />
    );
  }

  if (step.type === "confirmation") {
    const confirmLabel = step.confirmLabel ?? "확인";
    const cancelLabel = step.cancelLabel ?? "취소";
    return (
      <QuickReplyChips
        replies={[confirmLabel, cancelLabel]}
        onSelect={(label) => onSubmit({ value: label === confirmLabel, displayValue: label })}
      />
    );
  }

  if (step.type === "multi-choice") {
    const minimum = step.minSelections ?? 1;
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {step.options.map((option) => {
            const selected = selectedValues.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedValues((current) => selected ? current.filter((value) => value !== option.value) : [...current, option.value])}
                className={`rounded-full border px-3.5 py-2 text-xs font-bold shadow-sm transition-all active:scale-[0.98] ${selected ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card text-primary hover:border-accent/50 hover:bg-secondary"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
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
