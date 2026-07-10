import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { INTERNET_MOCK_RESULT } from "./mockData";

export const buildInternetResult = (answers: FlowAnswers): FlowResult =>
  createTelecomMockResult({ namespace: "internet", answers, savingsRate: 0.2, ...INTERNET_MOCK_RESULT });
