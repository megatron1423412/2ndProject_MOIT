import type { ChatFlowModule } from "../../../core/types";
import { bundleFlow } from "./flow";
import { buildBundleResult } from "./result";

export const flowModule: ChatFlowModule = {
  id: "bundle",
  categoryId: "telecom",
  definition: bundleFlow,
  buildResult: buildBundleResult,
};
