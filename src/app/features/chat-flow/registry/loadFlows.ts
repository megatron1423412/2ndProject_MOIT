import type { ChatFlowModule } from "../core/types";
import { validateFlowDefinition } from "../core/validateFlow";
import type { SubCategoryId } from "../../../types/moit";

type FlowModuleExport = { flowModule?: ChatFlowModule };

const discoveredModules = import.meta.glob<FlowModuleExport>("../flows/**/index.ts", { eager: true });

const createRegistry = () => {
  const registry = new Map<SubCategoryId, ChatFlowModule>();
  const definitionIds = new Map<string, string>();

  Object.entries(discoveredModules).forEach(([path, exports]) => {
    const module = exports.flowModule;
    if (!module) throw new Error(`[chat-flow] ${path}에서 flowModule export를 찾을 수 없습니다.`);
    if (registry.has(module.id)) throw new Error(`[chat-flow] flow id '${module.id}'가 중복됩니다. (${path})`);
    const duplicateDefinitionPath = definitionIds.get(module.definition.id);
    if (duplicateDefinitionPath) {
      throw new Error(`[chat-flow] definition id '${module.definition.id}'가 중복됩니다. (${duplicateDefinitionPath}, ${path})`);
    }
    if (module.definition.subCategoryId !== module.id) {
      throw new Error(`[chat-flow] '${module.id}'의 definition.subCategoryId가 일치하지 않습니다. (${path})`);
    }
    if (module.definition.categoryId !== module.categoryId) {
      throw new Error(`[chat-flow] '${module.id}'의 categoryId가 일치하지 않습니다. (${path})`);
    }

    const validation = validateFlowDefinition(module.definition);
    if (validation.warnings.length && import.meta.env.DEV) console.warn(validation.warnings.join("\n"));
    if (validation.errors.length) throw new Error(validation.errors.join("\n"));
    registry.set(module.id, module);
    definitionIds.set(module.definition.id, path);
  });

  return registry;
};

export const FLOW_REGISTRY = createRegistry();

export const getFlowModule = (subCategoryId: SubCategoryId) => FLOW_REGISTRY.get(subCategoryId);
