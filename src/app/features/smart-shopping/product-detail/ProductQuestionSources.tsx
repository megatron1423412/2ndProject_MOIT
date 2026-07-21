import React from "react";
import type { ProductQuestionSource } from "./productQuestionClient";

const safeUrl = (value?: string) => {
  try { const url = new URL(value ?? ""); return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined; }
  catch { return undefined; }
};
const displayHeading = (source: Extract<ProductQuestionSource, { kind: "rag" }>) => {
  const heading = source.section?.split(/\s*>\s*|\s*\/\s*/).filter(Boolean).at(-1)?.trim();
  return heading && heading !== source.title && heading.length <= 80 ? heading : "";
};

export default function ProductQuestionSources({ sources }: { sources: ProductQuestionSource[] }) {
  const deduplicated = Array.from(new Map(sources.map((source) => [source.id, source])).values());
  if (!deduplicated.length) return null;
  return (
    <div className="mt-3 border-t border-border/60 pt-2.5 text-xs text-muted-foreground" data-product-question-sources>
      <p className="font-black text-foreground">답변 근거</p>
      <ul className="mt-1.5 space-y-1">
        {deduplicated.map((source) => {
          if (source.kind !== "rag") return <li key={source.id}>· {source.title}</li>;
          const url = safeUrl(source.sourceUrl);
          const label = `${source.sourceName} — ${source.title}${displayHeading(source) ? ` · ${displayHeading(source)}` : ""}`;
          return <li key={source.id}>· {url ? <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-primary">{label}</a> : label}</li>;
        })}
      </ul>
    </div>
  );
}
