import type { FlowStep } from "../../core/types";

interface TelecomPlanBlockOptions {
  namespace: string;
  next: string;
  includeCarrier?: boolean;
  includeBundle?: boolean;
}

/** Shared telecom plan questions with namespaced ids and answer keys. */
export const createTelecomPlanBlock = ({
  namespace,
  next,
  includeCarrier = true,
  includeBundle = true,
}: TelecomPlanBlockOptions): FlowStep[] => {
  const feeStepId = `${namespace}-common-monthly-fee`;
  const contractStepId = `${namespace}-common-contract`;
  const bundleStepId = `${namespace}-common-bundle`;
  const steps: FlowStep[] = [];

  if (includeCarrier) {
    steps.push({
      id: `${namespace}-common-carrier`,
      type: "single-choice",
      message: "현재 이용 중인 통신사 또는 사업자는 어디인가요?",
      answerKey: `${namespace}.carrier`,
      options: [
        { value: "skt", label: "SKT·SK브로드밴드" },
        { value: "kt", label: "KT" },
        { value: "lg", label: "LG U+" },
        { value: "mvno", label: "알뜰폰·기타" },
      ],
      next: feeStepId,
    });
  }

  steps.push(
    {
      id: feeStepId,
      type: "number-input",
      message: "현재 월 납부액은 얼마인가요?",
      answerKey: `${namespace}.monthlyFee`,
      placeholder: "예: 55000",
      min: 0,
      unit: "원",
      next: contractStepId,
    },
    {
      id: contractStepId,
      type: "single-choice",
      message: "현재 약정은 얼마나 남았나요?",
      answerKey: `${namespace}.contractStatus`,
      options: [
        { value: "expired", label: "만료 또는 무약정" },
        { value: "under-6", label: "6개월 이하" },
        { value: "over-6", label: "6개월 초과" },
        { value: "unknown", label: "잘 모르겠어요" },
      ],
      next: includeBundle ? bundleStepId : next,
    },
  );

  if (includeBundle) {
    steps.push({
      id: bundleStepId,
      type: "confirmation",
      message: "현재 가족·유무선 결합 할인을 받고 있나요?",
      answerKey: `${namespace}.hasBundleDiscount`,
      confirmLabel: "네, 받고 있어요",
      cancelLabel: "아니요 / 모르겠어요",
      confirmNext: next,
      cancelNext: next,
    });
  }

  return steps;
};
