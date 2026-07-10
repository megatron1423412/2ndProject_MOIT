import type { FlowAnswers, FlowCondition } from "./types";

export const matchesCondition = (condition: FlowCondition, answers: FlowAnswers): boolean => {
  const actual = answers[condition.answerKey];

  switch (condition.operator) {
    case "equals":
      return actual === condition.value;
    case "includes":
      return Array.isArray(actual) && actual.includes(String(condition.value));
    case "truthy":
      return Boolean(actual);
    case "gte":
      return typeof actual === "number" && typeof condition.value === "number" && actual >= condition.value;
  }
};
