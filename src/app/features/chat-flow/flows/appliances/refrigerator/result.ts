import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createApplianceMockResult } from "../../../shared/appliances/resultHelpers";
import { REFRIGERATOR_MOCK_RESULT } from "./mockData";

export const buildRefrigeratorResult = (answers: FlowAnswers): FlowResult =>
  createApplianceMockResult({ namespace: "refrigerator", answers, ...REFRIGERATOR_MOCK_RESULT });
