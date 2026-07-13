import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const load = (path) => server.ssrLoadModule(path);

try {
  const airCriteria = await load("/src/app/features/chat-flow/flows/appliances/air-conditioner/criteria.ts");
  assert.equal(airCriteria.calculateRecommendedCoolingArea(33), 17, "에어컨 냉방 면적 계수");

  const { AIR_CONDITIONER_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/air-conditioner/products.ts");
  const { rankAirConditioners } = await load("/src/app/features/chat-flow/flows/appliances/air-conditioner/rankProducts.ts");
  const airResult = rankAirConditioners(AIR_CONDITIONER_PRODUCTS, {
    "airConditioner.type": "wall", "airConditioner.homePyeong": 16, "airConditioner.coolingAreaMode": "recommended",
    "airConditioner.useDefaults": "yes", "airConditioner.installationCost": "any", "airConditioner.energyGrade": "any",
    "airConditioner.rebate": "any", "airConditioner.budget": 1_000_000,
  });
  assert.deepEqual(airResult.recommendations.map(({ product }) => product.id), ["ac-pure-wall-10"], "에어컨 필수 조건 제외");
  assert.ok(airResult.excludedProducts.some(({ productId, reasons }) => productId === "ac-value-wall-8" && reasons.some((reason) => reason.includes("인버터"))));

  const { TV_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/tv/products.ts");
  const { rankTvs } = await load("/src/app/features/chat-flow/flows/appliances/tv/rankProducts.ts");
  const tvAnswers = { "tv.os": "any", "tv.screenSize": "55", "tv.panel": "any", "tv.useDefaults": "yes", "tv.hdrRequired": false, "tv.rebate": "any", "tv.budget": 2_000_000 };
  const tvResult = rankTvs(TV_PRODUCTS, tvAnswers);
  assert.ok(tvResult.excludedProducts.some(({ productId, reasons }) => productId === "tv-basic-55" && reasons.some((reason) => reason.includes("4K"))), "TV 4K 필터");
  assert.ok(tvResult.excludedProducts.some(({ productId, reasons }) => productId === "tv-android-43" && reasons.some((reason) => reason.includes("보증"))), "TV 보증 필터");
  assert.ok(tvResult.recommendations.every((item, index, list) => index === 0 || list[index - 1].score >= item.score), "필수 필터 후 선호 점수 정렬");

  const { getRecommendedCapacityRange } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/criteria.ts");
  assert.deepEqual(getRecommendedCapacityRange(2), { maxPeople: 2, minLiters: 300, maxLiters: 500 }, "1~2인 용량 추천");
  assert.deepEqual(getRecommendedCapacityRange(4), { maxPeople: 4, minLiters: 600, maxLiters: 800 }, "3~4인 용량 추천");

  const { vacuumFlow } = await load("/src/app/features/chat-flow/flows/appliances/vacuum/flow.ts");
  const vacuumModule = { id: "vacuum", categoryId: "appliances", definition: vacuumFlow, buildResult: () => ({}) };
  const runtime = await load("/src/app/features/chat-flow/engine/flowRuntime.ts");
  let vacuumState = runtime.createInitialFlowState(vacuumModule);
  vacuumState = runtime.submitFlowAnswer(vacuumModule, vacuumState, { value: "wired-major", displayValue: "대기업 유선" });
  vacuumState = runtime.submitFlowAnswer(vacuumModule, vacuumState, { value: "aw", displayValue: "200AW 이상" });
  assert.equal(vacuumState.currentStepId, "vc-hepa", "유선은 배터리·거치대 질문 건너뛰기");
  assert.equal(vacuumState.answers["vacuum.replaceableBatteryRequired"], undefined);

  const { VACUUM_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/vacuum/products.ts");
  const { rankVacuums } = await load("/src/app/features/chat-flow/flows/appliances/vacuum/rankProducts.ts");
  const vacuumBase = { "vacuum.powerType": "wireless-value", "vacuum.hepaRequired": false, "vacuum.softRollerRequired": false, "vacuum.weight": "any", "vacuum.budget": 1_000_000 };
  const awResult = rankVacuums(VACUUM_PRODUCTS, { ...vacuumBase, "vacuum.suctionStandard": "aw" });
  const paResult = rankVacuums(VACUUM_PRODUCTS, { ...vacuumBase, "vacuum.suctionStandard": "pa" });
  assert.ok(awResult.recommendations.every(({ product }) => product.specs.suctionAw !== undefined && product.specs.suctionAw >= 200), "AW 독립 판정");
  assert.deepEqual(paResult.recommendations.map(({ product }) => product.id), ["vc-pa-30000"], "Pa 독립 판정");

  const { summarizePriceHistory } = await load("/src/app/features/product-catalog/core/priceHistory.ts");
  assert.deepEqual(summarizePriceHistory(120, [{ date: "a", lowestPrice: 100 }, { date: "b", lowestPrice: 140 }]), { allTimeLow: 100, averagePrice: 120, differenceFromLow: 20, percentAboveLow: 20 }, "가격 이력 계산");

  const { airConditionerFlow } = await load("/src/app/features/chat-flow/flows/appliances/air-conditioner/flow.ts");
  const airModule = { id: "air-conditioner", categoryId: "appliances", definition: airConditionerFlow, buildResult: () => ({}) };
  const airState = runtime.createInitialFlowState(airModule);
  const freshVacuumState = runtime.createInitialFlowState(vacuumModule);
  assert.notStrictEqual(airState.answers, freshVacuumState.answers, "상품군별 답변 상태 격리");
  assert.equal(airState.flowId, "air-conditioner"); assert.equal(freshVacuumState.flowId, "vacuum");

  const { MockProductRepository } = await load("/src/app/features/product-catalog/mock/MockProductRepository.ts");
  const { REFRIGERATOR_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/products.ts");
  const repository = new MockProductRepository([...AIR_CONDITIONER_PRODUCTS, ...TV_PRODUCTS, ...REFRIGERATOR_PRODUCTS, ...VACUUM_PRODUCTS]);
  assert.equal(repository.getProducts("air-conditioner").length, 5); assert.equal(repository.getProducts("tv").length, 5);
  assert.equal(repository.getProducts("refrigerator").length, 5); assert.equal(repository.getProducts("vacuum").length, 5);
  assert.ok(repository.getProducts("tv").every((product) => product.categoryId === "tv"), "Repository 상품군 격리");
  assert.ok(["air-conditioner", "tv", "refrigerator", "vacuum"].flatMap((category) => repository.getProducts(category)).every((product) => product.dataStatus === "mock" && product.priceHistory.length >= 6 && product.imagePath.startsWith("/assets/products/mock/")), "20개 상품의 mock·가격·로컬 이미지 데이터");

  const registry = await load("/src/app/features/chat-flow/registry/loadFlows.ts");
  assert.ok(["air-conditioner", "tv", "refrigerator", "vacuum", "phone", "internet", "iptv", "bundle"].every((id) => registry.getFlowModule(id)), "전체 flow registry 검증");

  console.log("smart-shopping focused checks: 10 passed");
} finally {
  await server.close();
}
