import { getSubCategoryById } from "../../../data/categories";
import type { FlowAnswers } from "../../chat-flow/core/types";
import { getRequiredCoolingArea, getSelectedAirConditionerType } from "../../chat-flow/flows/appliances/air-conditioner/criteria";
import { getRecommendedCapacityRange } from "../../chat-flow/flows/appliances/refrigerator/criteria";
import type { ProductCategoryId } from "../../product-catalog/core/types";

const itemName = (categoryId: ProductCategoryId) => getSubCategoryById(categoryId)?.title ?? categoryId;

export const buildAirConditionerSearchQuery = (answers: FlowAnswers) => {
  const type = String(getSelectedAirConditionerType(answers) ?? "");
  const typeLabel = { standing: "스탠드", wall: "벽걸이", "two-in-one": "2in1", window: "창문형" }[type] ?? "";
  const area = getRequiredCoolingArea(answers);
  return [itemName("air-conditioner"), typeLabel, Number.isFinite(area) ? `${area}평` : "", "인버터"].filter(Boolean).join(" ");
};

export const buildTvSearchQuery = (answers: FlowAnswers) =>
  [itemName("tv"), answers["tv.screenSize"] ? `${answers["tv.screenSize"]}인치` : "", "4K"].filter(Boolean).join(" ");

export const buildRefrigeratorSearchQuery = (answers: FlowAnswers) => {
  const capacityMode = answers["refrigerator.capacityMode"];
  const range = capacityMode === "recommended" ? getRecommendedCapacityRange(Number(answers["refrigerator.householdSize"])) : null;
  const capacity = range ? `${range.minLiters} ${range.maxLiters}L` : capacityMode ? `${capacityMode}L` : "";
  const door = answers["refrigerator.doorType"] === "two-door" ? "2도어" : "4도어";
  return [itemName("refrigerator"), capacity, door].filter(Boolean).join(" ");
};

export const buildVacuumSearchQuery = (answers: FlowAnswers) => {
  const power = answers["vacuum.powerType"] === "wired-major" ? "유선" : "무선";
  const suction = answers["vacuum.suctionStandard"] === "aw" ? "200AW" : answers["vacuum.suctionStandard"] === "pa" ? "25000Pa" : "";
  return [itemName("vacuum"), power, suction].filter(Boolean).join(" ");
};

export const buildNaverSearchQuery = (categoryId: ProductCategoryId, answers: FlowAnswers) => {
  switch (categoryId) {
    case "air-conditioner": return buildAirConditionerSearchQuery(answers);
    case "tv": return buildTvSearchQuery(answers);
    case "refrigerator": return buildRefrigeratorSearchQuery(answers);
    case "vacuum": return buildVacuumSearchQuery(answers);
  }
};
