import type { ChatFlowModule, FlowRuntimeState, SubmittedFlowAnswer } from "../core/types";
import { createInitialFlowState, submitFlowAnswer } from "./flowRuntime";

export type FlowAction = { type: "answer"; answer: SubmittedFlowAnswer } | { type: "reset" };

/** Pure reducer factory, kept independent from React for focused testing later. */
export const createFlowReducer = (module: ChatFlowModule) =>
  (state: FlowRuntimeState, action: FlowAction): FlowRuntimeState => {
    if (action.type === "reset") return createInitialFlowState(module);
    return submitFlowAnswer(module, state, action.answer);
  };
