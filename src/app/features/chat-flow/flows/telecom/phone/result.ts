import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { PHONE_MOCK_RESULT } from "./mockData";

export const buildPhoneResult = (answers: FlowAnswers): FlowResult =>
  createTelecomMockResult({ namespace: "phone", answers, savingsRate: 0.28, ...PHONE_MOCK_RESULT });
