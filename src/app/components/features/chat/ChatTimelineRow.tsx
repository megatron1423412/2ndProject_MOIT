import React from "react";

export type ChatTimelineRowKind = "assistant" | "user" | "wide";

/** One shared rail contract for condition turns and post-recommendation turns. */
export default function ChatTimelineRow({ kind, children }: { kind: ChatTimelineRowKind; children: React.ReactNode }) {
  const alignment = kind === "user" ? "justify-end" : "justify-start";
  return (
    <div
      className={kind === "wide" ? "w-full min-w-0" : `flex w-full min-w-0 ${alignment}`}
      data-chat-timeline-row={kind}
    >
      {children}
    </div>
  );
}
