import { matchesCondition } from "../core/conditions";
import type {
  AnswerInputStep,
  ChatFlowMessage,
  ChatFlowModule,
  FlowRuntimeState,
  FlowStep,
  SubmittedFlowAnswer,
} from "../core/types";

const getTimeString = () => {
  const date = new Date();
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const SMART_SHOPPING_FLOW_IDS = new Set(["air-conditioner", "tv", "refrigerator", "vacuum"]);
let recommendationStartAnchorSequence = 0;

const getRecommendationStartAnchorId = (module: ChatFlowModule, flowId: string, answer: SubmittedFlowAnswer) => {
  if (!SMART_SHOPPING_FLOW_IDS.has(module.id) || answer.displayValue !== "추천 시작") return undefined;
  recommendationStartAnchorSequence += 1;
  return `${flowId}-recommendation-start-${recommendationStartAnchorSequence}`;
};

const appendMessage = (
  state: FlowRuntimeState,
  message: Omit<ChatFlowMessage, "id" | "timestamp">,
): FlowRuntimeState => ({
  ...state,
  messageSequence: state.messageSequence + 1,
  messages: [
    ...state.messages,
    {
      ...message,
      id: `${state.flowId}-message-${state.messageSequence + 1}`,
      timestamp: getTimeString(),
    },
  ],
});

const getStep = (module: ChatFlowModule, stepId: string): FlowStep | undefined =>
  module.definition.steps.find((step) => step.id === stepId);

const isInputStep = (step: FlowStep): step is AnswerInputStep =>
  ["single-choice", "multi-choice", "text-input", "number-input", "confirmation"].includes(step.type);

export const getNestedAnswers = (answers: Record<string, unknown>) => {
  const nested: Record<string, unknown> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const parts = key.split(".");
    if (parts.length === 2) {
      const [ns, field] = parts;
      const namespace = (nested[ns] ?? {}) as Record<string, unknown>;
      namespace[field] = value;
      nested[ns] = namespace;
    } else {
      nested[key] = value;
    }
  });
  return nested;
};

const advanceToStep = (
  module: ChatFlowModule,
  initialState: FlowRuntimeState,
  initialStepId: string,
): FlowRuntimeState => {
  let state = initialState;
  let stepId = initialStepId;

  for (let guard = 0; guard < 100; guard += 1) {
    const step = getStep(module, stepId);
    if (!step) return { ...state, currentStepId: null, error: `step '${stepId}'를 찾을 수 없습니다.` };

    if (step.type === "assistant-message") {
      const text = step.buildMessage?.(state.answers)
        ?? (typeof step.message === "function" ? step.message(getNestedAnswers(state.answers)) : step.message);
      state = appendMessage(state, { sender: "ai", text, type: "text" });
      stepId = step.next;
      continue;
    }

    if (step.type === "branch") {
      const matched = step.conditions.find((condition) => matchesCondition(condition, state.answers));
      stepId = matched?.next ?? step.defaultNext;
      continue;
    }

    if (step.type === "result") {
      try {
        const result = module.buildResult(state.answers);
        if (step.message) {
          const text = typeof step.message === "function" ? (step.message as Function)(getNestedAnswers(state.answers)) : step.message;
          state = appendMessage(state, { sender: "ai", text, type: "text" });
        }
        state = appendMessage(state, { sender: "ai", type: "result", result });
        
        if (step.next) {
          stepId = step.next;
          state = { ...state, result };
          continue;
        }

        return { ...state, currentStepId: step.id, completed: true, result };
      } catch (error) {
        const message = error instanceof Error ? error.message : "결과를 만들지 못했습니다.";
        return { ...state, currentStepId: step.id, error: message };
      }
    }

    let text = typeof step.message === "function" ? (step.message as Function)(getNestedAnswers(state.answers)) : step.message;
    
    // Append ⤴️ for telecom flows' input steps (except the start step)
    const isTelecom = module.id === "bundle" || module.id === "internet" || module.id === "iptv" || module.id === "phone";
    if (isTelecom && step.type !== "assistant-message" && step.type !== "result" && step.id !== module.definition.startStepId) {
      if (typeof text === "string" && !text.includes("⤴️")) {
        text = text.trim() + " ⤴️";
      }
    }
    
    const resolvedStep = { ...step };
    if (step.type === "single-choice" || step.type === "multi-choice") {
      const stepWithResolver = step as any;
      if (typeof stepWithResolver.optionsResolver === "function") {
        resolvedStep.options = stepWithResolver.optionsResolver(state.answers);
      }
    }

    state = appendMessage(state, { sender: "ai", text, type: "text", step: resolvedStep as AnswerInputStep });
    return { ...state, currentStepId: step.id };
  }

  return { ...state, currentStepId: null, error: "flow가 너무 많은 내부 step을 연속 실행했습니다." };
};

export const createInitialFlowState = (module: ChatFlowModule): FlowRuntimeState =>
  advanceToStep(
    module,
    {
      flowId: module.id,
      currentStepId: null,
      answers: {},
      messages: [],
      completed: false,
      result: null,
      error: null,
      messageSequence: 0,
      supplementalMessages: [],
      checkpoints: [],
    },
    module.definition.startStepId,
  );

const getNextStepId = (step: AnswerInputStep, answer: SubmittedFlowAnswer, answers: FlowRuntimeState["answers"]): string => {
  switch (step.type) {
    case "single-choice": {
      const options = typeof step.optionsResolver === "function"
        ? step.optionsResolver(answers)
        : step.options;
      const option = options.find((item) => item.value === answer.value);
      return option?.next ?? step.next ?? "";
    }
    case "confirmation":
      return answer.value ? step.confirmNext : step.cancelNext;
    case "multi-choice":
    case "text-input":
      return step.next;
    case "number-input":
      return step.alternateOption?.value === answer.value
        ? step.alternateOption.next ?? step.next
        : step.next;
  }
};

export const submitFlowAnswer = (
  module: ChatFlowModule,
  currentState: FlowRuntimeState,
  answer: SubmittedFlowAnswer,
): FlowRuntimeState => {
  if (currentState.completed || !currentState.currentStepId) return currentState;
  const step = getStep(module, currentState.currentStepId);
  if (!step || !isInputStep(step)) return { ...currentState, error: "현재 step은 사용자 답변을 받을 수 없습니다." };

  const nextStepId = getNextStepId(step, answer, currentState.answers);
  if (!nextStepId) return { ...currentState, error: `step '${step.id}'의 다음 step이 없습니다.` };

  const recommendationStartAnchorId = getRecommendationStartAnchorId(module, currentState.flowId, answer);

  const checkpoint = {
    id: `${currentState.flowId}-checkpoint-${currentState.checkpoints.length + 1}-${step.id}`,
    answeredStepId: step.id,
    currentStepId: step.id,
    answers: { ...currentState.answers },
    messages: [...currentState.messages],
    supplementalMessages: [...currentState.supplementalMessages],
    completed: currentState.completed,
    result: currentState.result,
    error: currentState.error,
    messageSequence: currentState.messageSequence,
  };
  const stateWithAnswer = appendMessage(
    {
      ...currentState,
      answers: { ...currentState.answers, [step.answerKey]: answer.value },
      error: null,
      checkpoints: module.definition.enableConditionUndo
        ? [...currentState.checkpoints, checkpoint]
        : currentState.checkpoints,
    },
    {
      sender: "user",
      text: answer.displayValue,
      type: "text",
      metadata: recommendationStartAnchorId ? { productSelectionAnchorId: recommendationStartAnchorId } : undefined,
    },
  );

  if (nextStepId === "$restart") return createInitialFlowState(module);

  return advanceToStep(module, stateWithAnswer, nextStepId);
};

/** Restores the state before the latest committed answer. Derived turns are part of that transaction. */
export const undoLatestFlowAnswer = (
  module: ChatFlowModule,
  currentState: FlowRuntimeState,
): FlowRuntimeState => {
  if (!module.definition.enableConditionUndo || currentState.completed || currentState.checkpoints.length === 0) return currentState;
  const checkpoint = currentState.checkpoints[currentState.checkpoints.length - 1];
  return {
    flowId: currentState.flowId,
    currentStepId: checkpoint.currentStepId,
    answers: { ...checkpoint.answers },
    messages: [...checkpoint.messages],
    supplementalMessages: [...checkpoint.supplementalMessages],
    completed: checkpoint.completed,
    result: checkpoint.result,
    error: null,
    messageSequence: checkpoint.messageSequence,
    checkpoints: currentState.checkpoints.slice(0, -1),
  };
};

/** Flow 결과 후 보조 대화를 별도 배열에 누적합니다. 기존 문자열 호출도 호환합니다. */
export const appendSupplementalFlowMessage = (
  state: FlowRuntimeState,
  message: Omit<ChatFlowMessage, "id" | "timestamp"> | string,
  sender: "ai" | "user" = "ai",
): FlowRuntimeState => {
  const normalized = typeof message === "string" ? { sender, text: message, type: "text" as const } : message;
  return {
    ...state,
    messageSequence: state.messageSequence + 1,
    supplementalMessages: [...state.supplementalMessages, { ...normalized, id: `${state.flowId}-supplemental-${state.messageSequence + 1}`, timestamp: getTimeString() }],
  };
};

export const goBackFlow = (
  module: ChatFlowModule,
  currentState: FlowRuntimeState,
): FlowRuntimeState => {
  const submissionHistory: { step: AnswerInputStep; answer: SubmittedFlowAnswer }[] = [];
  
  currentState.messages.forEach((msg, idx) => {
    if (msg.sender === "user") {
      let step: AnswerInputStep | null = null;
      for (let i = idx - 1; i >= 0; i--) {
        if (currentState.messages[i].sender === "ai" && currentState.messages[i].step) {
          step = currentState.messages[i].step as AnswerInputStep;
          break;
        }
      }
      if (step) {
        const val = currentState.answers[step.answerKey];
        if (val !== undefined) {
          submissionHistory.push({
            step,
            answer: {
              value: val,
              displayValue: msg.text || String(val),
            }
          });
        }
      }
    }
  });

  if (submissionHistory.length === 0) return currentState;

  const remainingSubmissions = submissionHistory.slice(0, -1);

  let state = createInitialFlowState(module);
  for (const item of remainingSubmissions) {
    state = submitFlowAnswer(module, state, item.answer);
  }

  return state;
};
