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
