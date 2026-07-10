import type { ChatFlowModule } from "../../../core/types";
import { iptvFlow } from "./flow";
import { buildIptvResult } from "./result";

export const flowModule: ChatFlowModule = {
  id: "iptv",
  categoryId: "telecom",
  definition: iptvFlow,
  buildResult: buildIptvResult,
};
