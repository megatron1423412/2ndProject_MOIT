import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createTelecomMockResult } from "../../../shared/telecom/resultHelpers";
import { BUNDLE_MOCK_RESULT } from "./mockData";

export const buildBundleResult = (answers: FlowAnswers): FlowResult =>
  createTelecomMockResult({ namespace: "bundle", answers, savingsRate: 0.24, ...BUNDLE_MOCK_RESULT });
