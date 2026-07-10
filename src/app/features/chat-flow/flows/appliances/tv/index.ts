import type { ChatFlowModule } from "../../../core/types";
import { tvFlow } from "./flow";
import { buildTvResult } from "./result";

export const flowModule: ChatFlowModule = {
  id: "tv",
  categoryId: "appliances",
  definition: tvFlow,
  buildResult: buildTvResult,
};
