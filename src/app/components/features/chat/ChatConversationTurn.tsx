import React from "react";
import ChatMessage, { type ChatMessageProps } from "./ChatMessage";
import ChatTimelineRow from "./ChatTimelineRow";

/** The only renderer for conversational turns in the outer ChatScreen timeline. */
export default function ChatConversationTurn({ selectionAnchorId, onSelectionAnchorMount, ...props }: ChatMessageProps & { selectionAnchorId?: string; onSelectionAnchorMount?: (anchorId: string, element: HTMLDivElement | null) => void }) {
  return (
    <ChatTimelineRow kind={props.sender === "ai" ? "assistant" : "user"} selectionAnchorId={selectionAnchorId} onSelectionAnchorMount={onSelectionAnchorMount}>
      <ChatMessage {...props} />
    </ChatTimelineRow>
  );
}
