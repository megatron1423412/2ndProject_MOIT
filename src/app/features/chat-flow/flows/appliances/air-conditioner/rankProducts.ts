import type { FlowAnswers } from "../../../core/types";
import { getPricePositionScore } from "../../../../product-catalog/core/priceHistory";
import { dataCompleteness, sortRecommendations } from "../../../../product-catalog/core/ranking";
import type { AirConditionerProduct, ExcludedProduct, ProductRecommendation } from "../../../../product-catalog/core/types";
import { AIR_CONDITIONER_CRITERIA, calculateRecommendedCoolingArea } from "./criteria";

export const rankAirConditioners = (products: AirConditionerProduct[], answers: FlowAnswers) => {
  const a = (key: string) => answers[`airConditioner.${key}`];
  const requiredArea = a("coolingAreaMode") === "custom" ? Number(a("customCoolingArea")) : calculateRecommendedCoolingArea(Number(a("homePyeong")));
  const useDefaults = a("useDefaults") === "yes";
  const inverterRequired = useDefaults || a("inverterRequired") === true;
  const officialRequired = useDefaults || a("officialRequired") === true;
  const autoDryRequired = useDefaults || a("autoDryRequired") === true;
  const excludedProducts: ExcludedProduct[] = [];
  const recommendations: ProductRecommendation[] = [];

  for (const product of products) {
    const reasons: string[] = [];
    if (product.specs.type !== a("type")) reasons.push("선택한 타입과 다름");
    if (!Number.isFinite(product.specs.ratedCoolingAreaPyeong) || product.specs.ratedCoolingAreaPyeong < requiredArea) reasons.push(`정격 냉방 면적 ${requiredArea}평 미충족`);
    if (inverterRequired && product.specs.inverter !== true) reasons.push("인버터 컴프레서 조건 미충족");
    if (officialRequired && product.specs.officialInstallation !== true) reasons.push("공식 지정 설치 조건 미충족");
    if (autoDryRequired && product.specs.autoDry !== true) reasons.push("자동 건조 필수 조건 미충족");
    if (a("installationCost") === "required" && product.specs.basicInstallationIncluded !== true) reasons.push("기본 설치비 포함 조건 미충족");
    if (a("energyGrade") === "1-required" && product.specs.energyGrade !== 1) reasons.push("에너지 1등급 필수 조건 미충족");
    if (a("rebate") === "required" && product.specs.mockRebateEligible !== true) reasons.push("더미 환급 대상 조건 미충족");
    if (reasons.length) { excludedProducts.push({ productId: product.id, productName: product.name, reasons }); continue; }

    const w = AIR_CONDITIONER_CRITERIA.weights;
    const budget = Number(a("budget"));
    const budgetScore = budget > 0 ? Math.min(1, budget / product.currentPrice) * w.budget : 0;
    const efficiencyScore = ((6 - product.specs.energyGrade) / 5) * w.efficiency;
    const installationScore = (product.specs.basicInstallationIncluded ? w.installation : w.installation * 0.45);
    const convenienceScore = (product.specs.autoDry ? 1 : 0.25) * w.convenience;
    const marketScore = getPricePositionScore(product.currentPrice, product.priceHistory) / 100 * w.marketPrice;
    const matched = ["타입 일치", `냉방 ${requiredArea}평 이상`, ...(product.specs.inverter ? ["인버터"] : []), ...(product.specs.officialInstallation ? ["공식 지정 설치"] : [])];
    const preferences = [product.currentPrice <= budget, product.specs.energyGrade <= 2, product.specs.basicInstallationIncluded, product.specs.autoDry, product.specs.mockRebateEligible].filter(Boolean).length;
    recommendations.push({ product, score: Math.round(budgetScore + w.typeAndCapacity + efficiencyScore + installationScore + convenienceScore + marketScore), matchedCoreCriteria: matched, unmatchedOrUnknownCriteria: [
      ...(product.currentPrice > budget ? ["예산 초과"] : []), ...(!product.specs.basicInstallationIncluded ? ["기본 설치비 별도"] : []), ...(!product.specs.mockRebateEligible ? ["더미 환급 대상 아님"] : []),
    ], recommendationReasons: [`필수 타입·면적 조건 충족`, `효율 ${product.specs.energyGrade}등급과 현재 시세 위치를 점수에 반영`], preferenceMatchCount: preferences, dataCompleteness: dataCompleteness(product.specs) });
  }
  return { recommendations: sortRecommendations(recommendations).slice(0, 5), excludedProducts };
};
