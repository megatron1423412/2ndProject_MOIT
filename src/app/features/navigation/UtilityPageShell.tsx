import React from "react";
import { ArrowLeft } from "lucide-react";

export default function UtilityPageShell({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return <section className="fixed inset-0 z-[70] overflow-y-auto bg-background text-foreground" aria-label={`${title} 페이지`}><div className="mx-auto min-h-full w-full max-w-[1120px] px-5 py-5 lg:px-8"><header className="flex items-center justify-between gap-4 border-b border-border pb-4"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-black text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-accent/40"><ArrowLeft size={16} />이전으로 돌아가기</button><h1 className="text-lg font-black text-primary">{title}</h1><span className="w-28" aria-hidden="true" /></header><main className="py-6">{children}</main></div></section>;
}
