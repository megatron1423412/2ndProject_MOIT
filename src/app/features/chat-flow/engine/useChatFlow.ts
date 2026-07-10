import { useEffect, useMemo, useState } from "react";
import type { AnswerInputStep, FlowRuntimeState, SubmittedFlowAnswer } from "../core/types";
import { getFlowModule } from "../registry/loadFlows";
import { createInitialFlowState, submitFlowAnswer } from "./flowRuntime";
import type { SubCategoryId } from "../../../types/moit";

const EMPTY_STATE: FlowRuntimeState = {
  flowId: "",
  currentStepId: null,
  answers: {},
  messages: [],
  completed: false,
  result: null,
  error: null,
  messageSequence: 0,
};

export const useChatFlow = (subCategoryId: SubCategoryId) => {
  const module = useMemo(() => getFlowModule(subCategoryId), [subCategoryId]);
  const [state, setState] = useState<FlowRuntimeState>(() => module ? createInitialFlowState(module) : EMPTY_STATE);

  useEffect(() => {
    setState(module ? createInitialFlowState(module) : { ...EMPTY_STATE, error: `Flow '${subCategoryId}'를 찾을 수 없습니다.` });
  }, [module, subCategoryId]);

  const isCurrentFlow = Boolean(module && state.flowId === module.id);
  const currentStep = isCurrentFlow && state.currentStepId
    ? module!.definition.steps.find((step) => step.id === state.currentStepId)
    : undefined;
  const inputStep = currentStep && ["single-choice", "multi-choice", "text-input", "number-input", "confirmation"].includes(currentStep.type)
    ? currentStep as AnswerInputStep
    : null;

  const submitAnswer = (answer: SubmittedFlowAnswer) => {
    if (!module) return;
    setState((current) => current.flowId === module.id ? submitFlowAnswer(module, current, answer) : createInitialFlowState(module));
  };

  return {
    messages: isCurrentFlow ? state.messages : [],
    answers: isCurrentFlow ? state.answers : {},
    currentStep: inputStep,
    completed: isCurrentFlow && state.completed,
    result: isCurrentFlow ? state.result : null,
    error: module ? state.error : `이 챗봇의 Flow Definition을 찾을 수 없습니다: ${subCategoryId}`,
    submitAnswer,
    reset: () => module && setState(createInitialFlowState(module)),
  };
};
