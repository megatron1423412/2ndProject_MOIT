import React from "react";

export type ChatTimelineRowKind = "assistant" | "user" | "wide";

/** One shared rail contract for condition turns and post-recommendation turns. */
export default function ChatTimelineRow({ kind, children }: { kind: ChatTimelineRowKind; children: React.ReactNode }) {
  const alignment = kind === "user" ? "justify-end" : "justify-start";
  return (
    <div
      className={kind === "wide" ? "col-span-full w-full min-w-0" : `col-span-full flex w-full min-w-0 max-w-none ${alignment}`}
      data-chat-timeline-row={kind}
      data-chat-rail-width="outer"
      data-chat-rail-track="shared"
      data-chat-conversation-row={kind === "wide" ? undefined : kind}
      data-chat-wide-content={kind === "wide" || undefined}
      data-chat-layout-owner="chat-screen"
    >
      {children}
    </div>
  );
}
