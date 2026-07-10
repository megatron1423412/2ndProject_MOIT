import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createApplianceMockResult } from "../../../shared/appliances/resultHelpers";
import { AIR_CONDITIONER_MOCK_RESULT } from "./mockData";

export const buildAirConditionerResult = (answers: FlowAnswers): FlowResult =>
  createApplianceMockResult({ namespace: "airConditioner", answers, ...AIR_CONDITIONER_MOCK_RESULT });
