import type { ChatFlowModule } from "../../../core/types";
import { phoneFlow } from "./flow";
import { buildPhoneResult } from "./result";

export const flowModule: ChatFlowModule = {
  id: "phone",
  categoryId: "telecom",
  definition: phoneFlow,
  buildResult: buildPhoneResult,
};
