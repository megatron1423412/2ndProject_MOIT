import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { IPTV_MOCK_RESULT } from "./mockData";

export const buildIptvResult = (answers: FlowAnswers): FlowResult =>
  createTelecomMockResult({ namespace: "iptv", answers, savingsRate: 0.14, ...IPTV_MOCK_RESULT });
