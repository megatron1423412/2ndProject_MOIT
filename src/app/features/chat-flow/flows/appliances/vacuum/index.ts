import type { ChatFlowModule } from "../../../core/types";
import { vacuumFlow } from "./flow";
import { buildVacuumResult } from "./result";

export const flowModule: ChatFlowModule = {
  id: "vacuum",
  categoryId: "appliances",
  definition: vacuumFlow,
  buildResult: buildVacuumResult,
};
