// src/app/features/smart-shopping/grade/collectAppliancesGradeReportData.ts
//
// appliances 파트 전반의 등급 진단 데이터 수집 및 규격 표준화 헬퍼

import type { PurchaseGradeDiagnosisInput } from "../types/recommendation";
import type { PurchaseGradeResult } from "./calculatePurchaseGrade";

export interface AppliancesGradeReportData {
  productName: string;
  modelNumber: string;
  currentPrice: number;
  allTimeLow?: number;
  savingAmount: number;
  savingPercent: number;
  grade: "Gold" | "Silver" | "Bronze" | "Normal";
  gradeInfo: {
    label: string;
    subLabel: string;
    status: string;
    emoji: string;
    theme: { bg: string; text: string; border: string; ring: string; bar: string };
    feature: string;
    scenario: string;
  };
  additionalCostCheck?: string;
  score?: number;
}

export function collectAppliancesGradeReportData(
  input: PurchaseGradeDiagnosisInput,
  result: PurchaseGradeResult
): AppliancesGradeReportData {
  const product = input.selectedProduct.source === "internal"
    ? input.selectedProduct.recommendation.product
    : input.selectedProduct.product;

  const productName = product.name ?? product.title ?? "선택 상품";
  const modelNumber = "modelNumber" in product && product.modelNumber
    ? product.modelNumber
    : input.selectedProduct.matchedInternalProduct?.modelNumber ?? "모델번호 정보 없음";

  const currentPrice = input.currentPrice || 0;
  const allTimeLow = input.allTimeLow;

  const savingAmount = allTimeLow && currentPrice > allTimeLow
    ? currentPrice - allTimeLow
    : (allTimeLow ? Math.max(0, currentPrice - allTimeLow) : 0);

  let savingPercent = 0;
  if (result.status === "available") {
    if (result.differencePct <= 0) {
      savingPercent = 35; // 최저가 이하/도달시 35% 기본 가성비
    } else {
      savingPercent = Math.max(5, Math.min(100, Math.round(100 - result.differencePct)));
    }
  } else if (allTimeLow && currentPrice > 0) {
    savingPercent = Math.max(0, Math.min(100, Math.round(((currentPrice - allTimeLow) / currentPrice) * 100)));
  }

  // 등급 매핑: 골드, 실버, 브론즈, Normal
  let grade: "Gold" | "Silver" | "Bronze" | "Normal" = "Normal";
  if (result.status === "available") {
    if (result.grade === "골드") grade = "Gold";
    else if (result.grade === "실버") grade = "Silver";
    else if (result.grade === "브론즈") grade = "Bronze";
  }

  const gradeInfoMap = {
    Gold: {
      label: "골드 등급",
      subLabel: "절감 효과 극대화! 최상의 가성비 구간",
      status: "골드 단계이며 구매를 강력 추천합니다.",
      emoji: "🏆",
      iconSrc: "/assets/icons/gold_medal.png",
      theme: { bg: "bg-amber-500/5", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", ring: "ring-amber-500/30", bar: "bg-amber-500" },
      feature: result.status === "available" ? result.reason : "현재 역대 최저가 근접 수준으로 최적의 가성비를 자랑합니다.",
      scenario: result.status === "available" ? result.timingGuide : "판매처의 쿠폰 및 혜택 조건을 확인 후 즉시 구매를 추천합니다.",
    },
    Silver: {
      label: "실버 등급",
      subLabel: "확실한 고정비 절감이 체감되는 알뜰 구간",
      status: "실버 단계이며 조건부 구매를 추천합니다.",
      emoji: "🥈",
      iconSrc: "/assets/icons/silver_medal.png",
      theme: { bg: "bg-slate-500/5", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20", ring: "ring-slate-500/30", bar: "bg-slate-500" },
      feature: result.status === "available" ? result.reason : "역대 최저가 대비 무난한 가격 수준을 유지하고 있습니다.",
      scenario: result.status === "available" ? result.timingGuide : "카드 할인 및 사은품 조건을 비교해보고 구매를 결정해보세요.",
    },
    Bronze: {
      label: "브론즈 등급",
      subLabel: "소소하지만 실속 있게 아끼는 절약 구간",
      status: "브론즈 단계이며 현재 가격 관망을 권장합니다.",
      emoji: "🥉",
      iconSrc: "/assets/icons/bronze_medal.png",
      theme: { bg: "bg-orange-500/5", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", ring: "ring-orange-500/30", bar: "bg-orange-500" },
      feature: result.status === "available" ? result.reason : "현재 가격이 다소 높게 형성되어 있는 구간입니다.",
      scenario: result.status === "available" ? result.timingGuide : "급하지 않다면 할인 행사나 가격 알림 설정을 권장합니다.",
    },
    Normal: {
      label: "일반 등급",
      subLabel: "지출 낭비 없이 안정적인 유지 구간",
      status: "진단 보류 및 현 상태 유지",
      emoji: "🌱",
      iconSrc: "/assets/icons/glossy_seedling.png",
      theme: { bg: "bg-muted/30", text: "text-muted-foreground", border: "border-border/60", ring: "ring-muted", bar: "bg-muted" },
      feature: result.reason || "가격 기록 데이터가 부족하여 정확한 가성비를 진단하기 어려운 상태입니다.",
      scenario: "추후 추가 데이터가 확보되면 다시 진단해보실 수 있습니다.",
    },
  };

  return {
    productName,
    modelNumber,
    currentPrice,
    allTimeLow,
    savingAmount,
    savingPercent,
    grade,
    gradeInfo: gradeInfoMap[grade],
    additionalCostCheck: input.additionalCostCheck,
    score: input.score,
  };
}
