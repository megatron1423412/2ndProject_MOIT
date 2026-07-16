import React from "react";

export type ChatTimelineRowKind = "assistant" | "user" | "wide";

/** One shared rail contract for condition turns and post-recommendation turns. */
export default function ChatTimelineRow({ kind, children }: { kind: ChatTimelineRowKind; children: React.ReactNode }) {
  const alignment = kind === "user" ? "justify-end" : "justify-start";
  return (
    <div
      className={kind === "wide" ? "w-full min-w-0 self-stretch" : `flex w-full min-w-0 max-w-none self-stretch ${alignment}`}
      data-chat-timeline-row={kind}
      data-chat-rail-width="outer"
    >
      {children}
    </div>
  );
}
