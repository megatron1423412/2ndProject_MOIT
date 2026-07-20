import { useEffect, useMemo, useState } from "react";
import type { AnswerInputStep, FlowRuntimeState, SubmittedFlowAnswer } from "../core/types";
import { getFlowModule } from "../registry/loadFlows";
import { appendSupplementalFlowMessage, createInitialFlowState, submitFlowAnswer, goBackFlow } from "./flowRuntime";
import type { SubCategoryId } from "../../../types/moit";

const EMPTY_STATE: FlowRuntimeState = {
  flowId: "",
  currentStepId: null,
  answers: {},
  messages: [],
  supplementalMessages: [],
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

  const resolvedStep = useMemo(() => {
    if (!currentStep) return null;
    if (currentStep.type === "single-choice" || currentStep.type === "multi-choice") {
      const stepWithResolver = currentStep as any;
      if (typeof stepWithResolver.optionsResolver === "function") {
        return {
          ...currentStep,
          options: stepWithResolver.optionsResolver(state.answers),
        } as AnswerInputStep;
      }
    }
    return currentStep as AnswerInputStep;
  }, [currentStep, state.answers]);

  const inputStep = resolvedStep && ["single-choice", "multi-choice", "text-input", "number-input", "confirmation"].includes(resolvedStep.type)
    ? resolvedStep
    : null;

  const submitAnswer = (answer: SubmittedFlowAnswer) => {
    if (!module) return;
    setState((current) => current.flowId === module.id ? submitFlowAnswer(module, current, answer) : createInitialFlowState(module));
  };

  const goBack = () => {
    if (!module) return;
    setState((current) => current.flowId === module.id ? goBackFlow(module, current) : current);
  };

  return {
    messages: isCurrentFlow ? state.messages : [],
    supplementalMessages: isCurrentFlow ? state.supplementalMessages : [],
    answers: isCurrentFlow ? state.answers : {},
    currentStep: inputStep,
    completed: isCurrentFlow && state.completed,
    result: isCurrentFlow ? state.result : null,
    error: module ? state.error : `이 챗봇의 Flow Definition을 찾을 수 없습니다: ${subCategoryId}`,
    submitAnswer,
    goBack,
    appendSupplementalMessage: (message: { sender: "ai" | "user"; text: string; metadata?: Record<string, unknown> }) => {
      if (!module) return;
      setState((current) => current.flowId === module.id
        ? appendSupplementalFlowMessage(current, { ...message, type: "text" })
        : current);
    },
    clearSupplementalMessages: () => {
      if (!module) return;
      setState((current) => current.flowId === module.id ? { ...current, supplementalMessages: [] } : current);
    },
    reset: () => module && setState(createInitialFlowState(module)),
  };
};
