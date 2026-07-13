import type { MiddleCategoryId, SubCategoryId } from "../../../types/moit";

export type FlowAnswerValue = string | number | boolean | string[];
export type FlowAnswers = Record<string, FlowAnswerValue>;

export interface FlowChoiceOption {
  value: string;
  label: string;
  next?: string;
}

interface FlowStepBase {
  id: string;
  type: string;
}

export interface AssistantMessageStep extends FlowStepBase {
  type: "assistant-message";
  message: string | ((answers: Record<string, unknown>) => string);
  /** Appliance flows use flat, namespaced answer keys for calculated summaries. */
  buildMessage?: (answers: FlowAnswers) => string;
  next: string;
}

interface AnswerStepBase extends FlowStepBase {
  message: string;
  answerKey: string;
}

export interface SingleChoiceStep extends AnswerStepBase {
  type: "single-choice";
  options: FlowChoiceOption[];
  optionsResolver?: (answers: FlowAnswers) => FlowChoiceOption[];
  next?: string;
}

export interface MultiChoiceStep extends AnswerStepBase {
  type: "multi-choice";
  options: FlowChoiceOption[];
  optionsResolver?: (answers: FlowAnswers) => FlowChoiceOption[];
  minSelections?: number;
  next: string;
}

export interface TextInputStep extends AnswerStepBase {
  type: "text-input";
  placeholder?: string;
  next: string;
}

export interface NumberInputStep extends AnswerStepBase {
  type: "number-input";
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
  next: string;
}

export interface ConfirmationStep extends AnswerStepBase {
  type: "confirmation";
  confirmLabel?: string;
  cancelLabel?: string;
  confirmNext: string;
  cancelNext: string;
}

export type FlowConditionOperator = "equals" | "includes" | "truthy" | "gte";

export interface FlowCondition {
  answerKey: string;
  operator: FlowConditionOperator;
  value?: FlowAnswerValue;
  next: string;
}

export interface BranchStep extends FlowStepBase {
  type: "branch";
  conditions: FlowCondition[];
  defaultNext: string;
}

export interface ResultStep extends FlowStepBase {
  type: "result";
  message?: string | ((answers: Record<string, unknown>) => string);
  next?: string;
}

export type AnswerInputStep =
  | SingleChoiceStep
  | MultiChoiceStep
  | TextInputStep
  | NumberInputStep
  | ConfirmationStep;

export type FlowStep = AssistantMessageStep | AnswerInputStep | BranchStep | ResultStep;

export interface FlowDefinition {
  id: string;
  subCategoryId: SubCategoryId;
  categoryId: MiddleCategoryId;
  startStepId: string;
  steps: FlowStep[];
}

export interface FlowResultMetric {
  label: string;
  value: string;
}

/** Common result shape consumed by the shared result card. */
export interface FlowResult {
  title: string;
  summary: string;
  grade?: string;
  monthlySaving?: number;
  yearlySaving?: number;
  score?: number;
  metrics?: FlowResultMetric[];
  highlights: string[];
  warnings: string[];
  recommendedActions: string[];
  mockNotice: string;
  recommendations?: import("../../product-catalog/core/types").ProductRecommendation[];
  catalogProducts?: import("../../product-catalog/core/types").CatalogProduct[];
  excludedProducts?: import("../../product-catalog/core/types").ExcludedProduct[];
  metadata?: Record<string, unknown>;
}

export interface ChatFlowModule {
  id: SubCategoryId;
  categoryId: MiddleCategoryId;
  definition: FlowDefinition;
  buildResult: (answers: FlowAnswers) => FlowResult;
}

export interface ChatFlowMessage {
  id: string;
  sender: "ai" | "user";
  text?: string;
  timestamp: string;
  type: "text" | "result";
  /** Supplemental smart-shopping timeline data. */
  metadata?: Record<string, unknown>;
  /** Result snapshots let living-cost flows continue after an intermediate result. */
  result?: FlowResult;
}

export interface FlowRuntimeState {
  flowId: string;
  currentStepId: string | null;
  answers: FlowAnswers;
  messages: ChatFlowMessage[];
  supplementalMessages: ChatFlowMessage[];
  completed: boolean;
  result: FlowResult | null;
  error: string | null;
  messageSequence: number;
}

export interface SubmittedFlowAnswer {
  value: FlowAnswerValue;
  displayValue: string;
}
