import type { FlowAnswers } from "./types";

export interface FlowActionResult {
  data: unknown;
}

/** Future backend/LLM/tool boundary. API keys must remain on a backend. */
export interface FlowActionExecutor {
  execute(actionId: string, answers: FlowAnswers): Promise<FlowActionResult>;
}

export class MockFlowActionExecutor implements FlowActionExecutor {
  async execute(actionId: string, answers: FlowAnswers): Promise<FlowActionResult> {
    return { data: { actionId, answers, source: "mock" } };
  }
}
