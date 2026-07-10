import type { ChatFlowModule } from "../../../core/types";
import { internetFlow } from "./flow";
import { buildInternetResult } from "./result";

export const flowModule: ChatFlowModule = {
  id: "internet",
  categoryId: "telecom",
  definition: internetFlow,
  buildResult: buildInternetResult,
};
