import type { ChatFlowModule } from "../../../core/types";
import { airConditionerFlow } from "./flow";
import { buildAirConditionerResult } from "./result";

export const flowModule: ChatFlowModule = {
  id: "air-conditioner",
  categoryId: "appliances",
  definition: airConditionerFlow,
  buildResult: buildAirConditionerResult,
};
