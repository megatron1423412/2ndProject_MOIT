import React from "react";
import type { ProductDetailActionId } from "../actions/productDetailActions";
import { PRODUCT_DETAIL_ACTIONS } from "../actions/productDetailActions";

interface Props {
  showAlternative: boolean;
  isQuestionLoading: boolean;
  onAction: (action: ProductDetailActionId) => void;
  onBack: () => void;
  onNext: () => void;
  isActive?: boolean;
}

export default function ProductDetailActionBar({ isQuestionLoading, onAction, onBack, onNext, isActive = true }: Props) {
  const ordinaryActions = PRODUCT_DETAIL_ACTIONS.filter((action) => action.id !== "next-step");
  const nextAction = PRODUCT_DETAIL_ACTIONS.find((action) => action.id === "next-step");
  const ordinaryClassName = "whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3ABA]/20 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="flex flex-col gap-3" aria-label="상품 상세 후속 액션" data-product-action-toolbar>
      {/* 🎨 1. 빨간색 지시 위치: 솔루션 실행 후 챗봇 대사 */}
      <div className="flex items-start gap-2.5 px-1 pt-1">
        <div className="flex flex-col space-y-0.5 text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
          <p>유저님이 고른 상품의 분석 리포트예요!</p>
          <p>더 궁금한 점이 있거나 다른 조언이 필요하신가요?</p>
        </div>
      </div>

      {/* 🎨 2. 챗봇 대사창 아래 선택 버튼형 (다음 단계로 버튼 색상 차별화) */}
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 lg:flex-row lg:items-center justify-between" data-product-action-row>
        <div className="flex min-w-0 flex-1 flex-wrap gap-2 lg:flex-nowrap" data-product-action-group="ordinary">
          {ordinaryActions.map((action) => {
            const isBack = action.id === "back-to-list";
            const onClick = isBack ? onBack : () => onAction(action.id as ProductDetailActionId);
            return (
              <button
                key={action.id}
                type="button"
                aria-label={action.label}
                disabled={!isActive || isQuestionLoading}
                onClick={onClick}
                className={ordinaryClassName}
              >
                {action.label}
              </button>
            );
          })}
        </div>
        {nextAction && (
          <button
            type="button"
            aria-label={nextAction.label}
            disabled={!isActive || isQuestionLoading}
            onClick={onNext}
            className="whitespace-nowrap rounded-xl bg-[#1E3ABA] px-5 py-2 text-xs font-extrabold text-white shadow-xs transition-all hover:bg-[#152B88] focus:outline-none focus:ring-2 focus:ring-[#1E3ABA]/30 disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
            data-product-progress-action
          >
            {nextAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
