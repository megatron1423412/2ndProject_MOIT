import type { ChatFlowModule } from "../../../core/types";
import { refrigeratorFlow } from "./flow";
import { buildRefrigeratorResult } from "./result";

export const flowModule: ChatFlowModule = {
  id: "refrigerator",
  categoryId: "appliances",
  definition: refrigeratorFlow,
  buildResult: buildRefrigeratorResult,
};
