import React from "react";

export type ChatTimelineRowKind = "assistant" | "user" | "wide";

export const CHAT_ASSISTANT_AVATAR_WIDTH_CLASS = "w-8";
export const CHAT_ASSISTANT_RAIL_GAP_CLASS = "gap-3";

/** One shared rail contract for condition turns and post-recommendation turns. */
export default function ChatTimelineRow({ kind, children }: { kind: ChatTimelineRowKind; children: React.ReactNode }) {
  if (kind === "wide") {
    return (
      <div
        className={`col-span-full flex w-full min-w-0 ${CHAT_ASSISTANT_RAIL_GAP_CLASS}`}
        data-chat-timeline-row="wide"
        data-chat-rail-width="outer"
        data-chat-rail-track="shared"
        data-chat-wide-content
        data-chat-layout-owner="chat-screen"
      >
        <div aria-hidden="true" className={`${CHAT_ASSISTANT_AVATAR_WIDTH_CLASS} flex-none`} data-chat-wide-avatar-column />
        <div className="min-w-0 flex-1" data-chat-wide-content-inner>
          {children}
        </div>
      </div>
    );
  }

  const alignment = kind === "user" ? "justify-end" : "justify-start";
  return (
    <div
      className={`col-span-full flex w-full min-w-0 max-w-none ${alignment}`}
      data-chat-timeline-row={kind}
      data-chat-rail-width="outer"
      data-chat-rail-track="shared"
      data-chat-conversation-row={kind}
      data-chat-layout-owner="chat-screen"
    >
      {children}
    </div>
  );
}
