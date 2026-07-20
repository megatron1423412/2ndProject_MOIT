import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

export default function ProductQuestionInput({ isLoading, errorMessage, onSubmit, onRetry, onCancel }: { isLoading: boolean; errorMessage: string; onSubmit: (question: string) => void; onRetry: (question: string) => void; onCancel: () => void }) {
  const [question, setQuestion] = useState("");
  const wasLoading = useRef(false);
  useEffect(() => {
    if (wasLoading.current && !isLoading && !errorMessage) setQuestion("");
    wasLoading.current = isLoading;
  }, [errorMessage, isLoading]);
  const canSubmit = Boolean(question.trim()) && !isLoading;
  const submit = () => { if (canSubmit) onSubmit(question.trim()); };
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <label htmlFor="product-detail-question" className="text-xs font-black text-primary">상품에 관해 더 물어보세요</label>
      <div className="mt-2 flex gap-2"><input id="product-detail-question" value={question} disabled={isLoading} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submit(); }} placeholder="예: 이 가격에서 설치비로 더 확인할 점은?" className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60" /><button type="button" aria-label="상품 질문 전송" disabled={!canSubmit} onClick={submit} className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"><Send size={16} /></button></div>
      {isLoading && <p className="mt-2 text-xs font-bold text-muted-foreground">답변을 준비하고 있어요…</p>}
      {errorMessage && <div className="mt-2 flex items-center justify-between gap-2"><p role="alert" className="text-xs font-bold text-destructive">{errorMessage}</p><button type="button" onClick={() => { if (question.trim() && !isLoading) onRetry(question.trim()); }} disabled={!question.trim() || isLoading} className="text-xs font-black text-accent underline disabled:opacity-50">재시도</button></div>}
      <button type="button" onClick={onCancel} disabled={isLoading} className="mt-2 text-xs font-bold text-muted-foreground underline">입력 닫기</button>
    </div>
  );
}
