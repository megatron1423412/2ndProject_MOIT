import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createApplianceMockResult } from "../../../shared/appliances/resultHelpers";
import { TV_MOCK_RESULT } from "./mockData";

export const buildTvResult = (answers: FlowAnswers): FlowResult =>
  createApplianceMockResult({ namespace: "tv", answers, ...TV_MOCK_RESULT });
