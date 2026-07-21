import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { QUESTION_SOURCE_MODE_LABELS, QUESTION_SOURCE_MODES, type QuestionSourceMode } from "./questionSourceMode";

interface Props {
  isLoading: boolean;
  errorMessage: string;
  sourceMode: QuestionSourceMode;
  onSourceModeChange: (mode: QuestionSourceMode) => void;
  onSubmit: (question: string, mode: QuestionSourceMode) => void;
  onRetry: (question: string, mode: QuestionSourceMode) => void;
  onCancel: () => void;
}

export default function ProductQuestionInput({ isLoading, errorMessage, sourceMode, onSourceModeChange, onSubmit, onRetry, onCancel }: Props) {
  const [question, setQuestion] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const wasLoading = useRef(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const submittedMode = useRef<QuestionSourceMode>(sourceMode);

  useEffect(() => {
    if (wasLoading.current && !isLoading && !errorMessage) setQuestion("");
    wasLoading.current = isLoading;
  }, [errorMessage, isLoading]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOutside = (event: PointerEvent) => { if (!selectorRef.current?.contains(event.target as Node)) setMenuOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    optionRefs.current[QUESTION_SOURCE_MODES.indexOf(sourceMode)]?.focus();
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, [menuOpen, sourceMode]);

  const canSubmit = Boolean(question.trim()) && !isLoading;
  const submit = () => {
    if (!canSubmit) return;
    submittedMode.current = sourceMode;
    onSubmit(question.trim(), sourceMode);
  };
  const moveOptionFocus = (event: React.KeyboardEvent, index: number) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? QUESTION_SOURCE_MODES.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + QUESTION_SOURCE_MODES.length) % QUESTION_SOURCE_MODES.length;
    optionRefs.current[next]?.focus();
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <div ref={selectorRef} className="relative shrink-0">
          <button ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-md border border-border bg-card px-2 py-1 text-xs font-black text-primary outline-none hover:bg-muted focus:ring-2 focus:ring-accent/40">
            {menuOpen ? "V" : ">"} {QUESTION_SOURCE_MODE_LABELS[sourceMode]}
          </button>
          {menuOpen && (
            <div role="menu" aria-label="질문 출처 선택" className="absolute left-0 top-full z-30 mt-1 min-w-36 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg">
              {QUESTION_SOURCE_MODES.map((mode, index) => <button key={mode} ref={(node) => { optionRefs.current[index] = node; }} type="button" role="menuitemradio" aria-checked={sourceMode === mode} onKeyDown={(event) => moveOptionFocus(event, index)} onClick={() => { onSourceModeChange(mode); setMenuOpen(false); triggerRef.current?.focus(); }} className="block w-full rounded-md px-2.5 py-2 text-left text-xs font-bold text-primary outline-none hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-inset focus:ring-accent/40" data-source-mode={mode}>{QUESTION_SOURCE_MODE_LABELS[mode]}</button>)}
            </div>
          )}
        </div>
        <label htmlFor="product-detail-question" className="text-xs font-black text-primary">상품에 관해 더 물어보세요</label>
      </div>
      <div className="mt-2 flex gap-2"><input id="product-detail-question" value={question} disabled={isLoading} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="예: 이 가격에서 설치비로 더 확인할 점은?" className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60" /><button type="button" aria-label="상품 질문 전송" disabled={!canSubmit} onClick={submit} className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"><Send size={16} /></button></div>
      {isLoading && <p className="mt-2 text-xs font-bold text-muted-foreground">답변을 준비하고 있어요…</p>}
      {errorMessage && <div className="mt-2 flex items-center justify-between gap-2"><p role="alert" className="text-xs font-bold text-destructive">{errorMessage}</p><button type="button" onClick={() => { if (question.trim() && !isLoading) onRetry(question.trim(), submittedMode.current); }} disabled={!question.trim() || isLoading} className="text-xs font-black text-accent underline disabled:opacity-50">재시도</button></div>}
      <button type="button" onClick={onCancel} disabled={isLoading} className="mt-2 text-xs font-bold text-muted-foreground underline">입력 닫기</button>
    </div>
  );
}
