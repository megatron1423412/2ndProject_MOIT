import type { FlowStep } from "../../core/types";

interface AppliancePurchaseBlockOptions {
  namespace: string;
  next: string;
  includeSpaceLimit?: boolean;
}

/** Shared appliance questions. A new object graph is returned on every call. */
export const createAppliancePurchaseBlock = ({
  namespace,
  next,
  includeSpaceLimit = true,
}: AppliancePurchaseBlockOptions): FlowStep[] => {
  const budgetStepId = `${namespace}-common-budget`;
  const preferenceStepId = `${namespace}-common-preference`;
  const steps: FlowStep[] = [];

  if (includeSpaceLimit) {
    steps.push({
      id: `${namespace}-common-space-limit`,
      type: "single-choice",
      message: "설치 공간의 여유는 어느 정도인가요?",
      answerKey: `${namespace}.spaceLimit`,
      options: [
        { value: "tight", label: "치수 제한이 커요" },
        { value: "normal", label: "보통이에요" },
        { value: "roomy", label: "공간이 넉넉해요" },
      ],
      next: budgetStepId,
    });
  }

  steps.push(
    {
      id: budgetStepId,
      type: "number-input",
      message: "구매 예산은 최대 얼마인가요?",
      answerKey: `${namespace}.budget`,
      placeholder: "예: 1500000",
      min: 0,
      unit: "원",
      next: preferenceStepId,
    },
    {
      id: preferenceStepId,
      type: "single-choice",
      message: "가격과 성능 중 어떤 기준을 더 중요하게 보나요?",
      answerKey: `${namespace}.purchasePreference`,
      options: [
        { value: "price", label: "가격 우선" },
        { value: "balanced", label: "가격·성능 균형" },
        { value: "performance", label: "성능 우선" },
      ],
      next,
    },
  );

  return steps;
};
