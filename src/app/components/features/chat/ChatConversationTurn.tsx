import React from "react";
import ChatMessage, { type ChatMessageProps } from "./ChatMessage";
import ChatTimelineRow from "./ChatTimelineRow";

/** The only renderer for conversational turns in the outer ChatScreen timeline. */
export default function ChatConversationTurn(props: ChatMessageProps) {
  return (
    <ChatTimelineRow kind={props.sender === "ai" ? "assistant" : "user"}>
      <ChatMessage {...props} />
    </ChatTimelineRow>
  );
}
