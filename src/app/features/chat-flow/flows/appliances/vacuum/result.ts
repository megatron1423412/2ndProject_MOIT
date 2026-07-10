import type { FlowAnswers, FlowResult } from "../../../core/types";
import { createApplianceMockResult } from "../../../shared/appliances/resultHelpers";
import { VACUUM_MOCK_RESULT } from "./mockData";

export const buildVacuumResult = (answers: FlowAnswers): FlowResult =>
  createApplianceMockResult({ namespace: "vacuum", answers, ...VACUUM_MOCK_RESULT });
