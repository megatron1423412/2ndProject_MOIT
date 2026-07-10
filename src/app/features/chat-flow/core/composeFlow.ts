import type { FlowStep } from "./types";

const cloneStep = (step: FlowStep): FlowStep => {
  if (step.type === "single-choice" || step.type === "multi-choice") {
    return { ...step, options: step.options.map((option) => ({ ...option })) };
  }
  if (step.type === "branch") {
    return { ...step, conditions: step.conditions.map((condition) => ({ ...condition })) };
  }
  return { ...step };
};

/** Combines fresh block output without sharing mutable step or option objects. */
export const composeFlow = (...blocks: FlowStep[][]): FlowStep[] =>
  blocks.flatMap((block) => block.map(cloneStep));
