import type { AnswerInputStep, FlowDefinition, FlowStep } from "./types";

export interface FlowValidationResult {
  errors: string[];
  warnings: string[];
}

const isAnswerStep = (step: FlowStep): step is AnswerInputStep =>
  ["single-choice", "multi-choice", "text-input", "number-input", "confirmation"].includes(step.type);

const getTargets = (step: FlowStep): string[] => {
  switch (step.type) {
    case "assistant-message":
    case "multi-choice":
    case "text-input":
    case "number-input":
      return [step.next];
    case "single-choice":
      return step.options.map((option) => option.next ?? step.next).filter((next): next is string => Boolean(next));
    case "confirmation":
      return [step.confirmNext, step.cancelNext];
    case "branch":
      return [...step.conditions.map((condition) => condition.next), step.defaultNext];
    case "result":
      return [];
  }
};

export const validateFlowDefinition = (definition: FlowDefinition): FlowValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const prefix = `[flow:${definition.id || "<missing>"}]`;

  if (!definition.id.trim()) errors.push(`${prefix} flow id가 없습니다.`);
  if (!definition.startStepId.trim()) errors.push(`${prefix} startStepId가 없습니다.`);

  const stepMap = new Map<string, FlowStep>();
  for (const step of definition.steps) {
    if (!step.id.trim()) {
      errors.push(`${prefix} id가 없는 ${step.type} step이 있습니다.`);
      continue;
    }
    if (stepMap.has(step.id)) errors.push(`${prefix} step id '${step.id}'가 중복됩니다.`);
    stepMap.set(step.id, step);
  }

  if (!stepMap.has(definition.startStepId)) {
    errors.push(`${prefix} 시작 step '${definition.startStepId}'를 찾을 수 없습니다.`);
  }

  const answerKeys = new Map<string, string>();
  for (const step of definition.steps) {
    if (isAnswerStep(step)) {
      if (!step.answerKey.trim()) errors.push(`${prefix} step '${step.id}'에 answerKey가 없습니다.`);
      const previousStep = answerKeys.get(step.answerKey);
      if (previousStep) {
        errors.push(`${prefix} answerKey '${step.answerKey}'가 '${previousStep}', '${step.id}'에서 중복됩니다.`);
      }
      answerKeys.set(step.answerKey, step.id);
    }
    if (step.type === "single-choice") {
      const hasResolver = typeof (step as any).optionsResolver === "function";
      if (step.options.length === 0 && !hasResolver) errors.push(`${prefix} step '${step.id}'에 선택지가 없습니다.`);
      step.options.forEach((option) => {
        if (!option.next && !step.next) errors.push(`${prefix} step '${step.id}'의 '${option.label}' 선택지에 next가 없습니다.`);
      });
    }
    for (const target of getTargets(step)) {
      if (!stepMap.has(target)) errors.push(`${prefix} step '${step.id}'의 next '${target}'를 찾을 수 없습니다.`);
    }
  }

  const reachable = new Set<string>();
  const visitReachable = (stepId: string) => {
    if (reachable.has(stepId)) return;
    reachable.add(stepId);
    const step = stepMap.get(stepId);
    if (step) getTargets(step).forEach(visitReachable);
  };
  visitReachable(definition.startStepId);

  for (const step of definition.steps) {
    if (!reachable.has(step.id)) warnings.push(`${prefix} step '${step.id}'에 도달할 수 없습니다.`);
  }

  const visiting = new Set<string>();
  const memo = new Map<string, boolean>();
  const reachesResult = (stepId: string): boolean => {
    if (memo.has(stepId)) return memo.get(stepId)!;
    if (visiting.has(stepId)) {
      errors.push(`${prefix} step '${stepId}' 주변에 종료되지 않는 순환 경로가 있습니다.`);
      return false;
    }
    const step = stepMap.get(stepId);
    if (!step) return false;
    if (step.type === "result") return true;
    visiting.add(stepId);
    const targets = getTargets(step);
    const result = targets.length > 0 && targets.every(reachesResult);
    visiting.delete(stepId);
    memo.set(stepId, result);
    return result;
  };

  if (stepMap.has(definition.startStepId) && !reachesResult(definition.startStepId)) {
    errors.push(`${prefix} 일부 경로가 result step 없이 종료됩니다.`);
  }

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
};
