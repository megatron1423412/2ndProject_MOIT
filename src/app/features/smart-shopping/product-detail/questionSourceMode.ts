export const DEFAULT_PRODUCT_QUESTION_MODEL = "gpt-4o-mini" as const;
export const PRODUCT_QUESTION_MODEL_LABEL = "GPT-4o mini" as const;

export const QUESTION_SOURCE_MODES = ["auto", "product_db", "rag", "model"] as const;
export type QuestionSourceMode = (typeof QUESTION_SOURCE_MODES)[number];

export const QUESTION_SOURCE_MODE_LABELS: Record<QuestionSourceMode, string> = {
  auto: "자동",
  product_db: "MOIT 상품 DB",
  rag: "RAG",
  model: PRODUCT_QUESTION_MODEL_LABEL,
};

export const isQuestionSourceMode = (value: unknown): value is QuestionSourceMode =>
  typeof value === "string" && QUESTION_SOURCE_MODES.includes(value as QuestionSourceMode);
