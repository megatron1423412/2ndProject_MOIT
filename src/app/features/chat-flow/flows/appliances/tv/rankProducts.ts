import type { FlowAnswers } from "../../../core/types";
import { getPricePositionScore } from "../../../../product-catalog/core/priceHistory";
import { dataCompleteness, sortRecommendations } from "../../../../product-catalog/core/ranking";
import type { ExcludedProduct, ProductRecommendation, TvProduct } from "../../../../product-catalog/core/types";
import { TV_CRITERIA } from "./criteria";

export const rankTvs = (products: TvProduct[], answers: FlowAnswers) => {
  const a = (key: string) => answers[`tv.${key}`];
  const useDefaults = a("useDefaults") === "yes";
  const fourKRequired = useDefaults ? TV_CRITERIA.defaults.fourKRequired : a("fourKRequired") === true;
  const minimumWarranty = useDefaults ? TV_CRITERIA.defaults.minimumWarrantyYears : a("minimumWarranty") === "any" ? 0 : Number(a("minimumWarranty"));
  const excludedProducts: ExcludedProduct[] = [];
  const recommendations: ProductRecommendation[] = [];
  for (const product of products) {
    const reasons: string[] = [];
    if (fourKRequired && product.specs.resolution !== "4k-uhd") reasons.push("4K UHD 필수 조건 미충족");
    if (!Number.isFinite(product.specs.warrantyYears) || product.specs.warrantyYears < minimumWarranty) reasons.push(`무상 보증 ${minimumWarranty}년 미충족`);
    if (a("hdrRequired") === true && product.specs.hdr !== true) reasons.push("HDR 필수 조건 미충족");
    if (a("rebate") === "required" && product.specs.mockRebateEligible !== true) reasons.push("더미 환급 조건 미충족");
    if (reasons.length) { excludedProducts.push({ productId: product.id, productName: product.name, reasons }); continue; }
    const w = TV_CRITERIA.weights; const budget = Number(a("budget"));
    const matchedPanel = a("panel") === "any" || product.specs.panel === a("panel");
    const matchedSize = product.specs.screenSizeInches === Number(a("screenSize"));
    const matchedOs = a("os") === "any" || a("os") === "either" || product.specs.os === a("os");
    const specsScore = (matchedPanel ? 0.25 : 0.1) * w.specifications + (matchedSize ? 0.25 : 0.05) * w.specifications + (matchedOs ? 0.2 : 0.05) * w.specifications + (product.specs.hdr ? 0.15 : 0.05) * w.specifications + (product.specs.resolution === "4k-uhd" ? 0.15 : 0) * w.specifications;
    const score = (budget > 0 ? Math.min(1, budget / product.currentPrice) * w.budget : 0) + specsScore + ((6 - product.specs.energyGrade) / 5) * w.efficiency + Math.min(1, product.specs.warrantyYears / 4) * w.warranty + (product.specs.hdr ? w.convenience : w.convenience * 0.3) + getPricePositionScore(product.currentPrice, product.priceHistory) / 100 * w.marketPrice;
    const preferences = [product.currentPrice <= budget, matchedPanel, matchedSize, matchedOs, product.specs.hdr, product.specs.energyGrade <= 2, product.specs.mockRebateEligible].filter(Boolean).length;
    recommendations.push({ product, score: Math.round(score), matchedCoreCriteria: [...(fourKRequired ? ["4K UHD"] : []), `보증 ${product.specs.warrantyYears}년`, ...(matchedSize ? [`${product.specs.screenSizeInches}인치 선호 일치`] : []), ...(matchedOs ? ["OS 선호 일치"] : [])], unmatchedOrUnknownCriteria: [...(!matchedSize ? [`화면 크기 선호 불일치 (${product.specs.screenSizeInches}인치)`] : []), ...(!matchedOs ? ["OS 선호 불일치"] : []), ...(!matchedPanel ? ["패널 선호 불일치"] : []), ...(product.currentPrice > budget ? ["예산 초과"] : []), ...(!product.specs.mockRebateEligible ? ["더미 환급 대상 아님"] : [])], recommendationReasons: ["필수 화질·보증 조건 충족", "크기·OS·패널 선호와 가격 위치 반영"], preferenceMatchCount: preferences, dataCompleteness: dataCompleteness(product.specs) });
  }
  return { recommendations: sortRecommendations(recommendations).slice(0, 10), excludedProducts };
};
