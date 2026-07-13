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

export const getNestedAnswers = (answers: Record<string, any>) => {
  const nested: Record<string, any> = {};
  Object.entries(answers).forEach(([key, value]) => {
    const parts = key.split(".");
    if (parts.length === 2) {
      const [ns, field] = parts;
      if (!nested[ns]) nested[ns] = {};
      nested[ns][field] = value;
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
      const text = typeof step.message === "function" ? (step.message as Function)(getNestedAnswers(state.answers)) : step.message;
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

    const text = typeof step.message === "function" ? (step.message as Function)(getNestedAnswers(state.answers)) : step.message;
    state = appendMessage(state, { sender: "ai", text, type: "text" });
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
    },
    module.definition.startStepId,
  );

// 매개변수 내부 충돌을 막기 위해 FlowAnswers 대신 Record<string, any> 타입을 매칭했습니다.
const getNextStepId = (step: AnswerInputStep, answer: SubmittedFlowAnswer, answers: Record<string, any>): string => {
  switch (step.type) {
    case "single-choice": {
      const stepWithResolver = step as any;
      const options = typeof stepWithResolver.optionsResolver === "function"
        ? stepWithResolver.optionsResolver(answers)
        : step.options;
      const option = options.find((item: any) => item.value === answer.value);
      return option?.next ?? step.next ?? "";
    }
    case "confirmation":
      return answer.value ? step.confirmNext : step.cancelNext;
    case "multi-choice":
    case "text-input":
    case "number-input":
      return step.next;
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

  const stateWithAnswer = appendMessage(
    {
      ...currentState,
      answers: { ...currentState.answers, [step.answerKey]: answer.value },
      error: null,
    },
    { sender: "user", text: answer.displayValue, type: "text" },
  );

  return advanceToStep(module, stateWithAnswer, nextStepId);
};

// 💡 조원들이 추가한 누락된 함수 코드를 하단에 병합합니다.
export const appendSupplementalFlowMessage = (
  state: FlowRuntimeState,
  text: string,
  sender: "ai" | "user" = "ai",
): FlowRuntimeState => {
  return appendMessage(state, {
    sender,
    text,
    type: "text",
  });
};