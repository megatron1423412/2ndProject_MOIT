import assert from "node:assert/strict";
import { existsSync, readdirSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const load = (path) => server.ssrLoadModule(path);

try {
  const { currentUser } = await load("/src/app/features/smart-shopping/user/userProfile.ts");
  const { buildSmartShoppingGreeting } = await load("/src/app/features/smart-shopping/greeting/buildSmartShoppingGreeting.ts");
  const { getSubCategoryById } = await load("/src/app/data/categories.ts");
  assert.equal(currentUser.displayName, "김철수", "기본 사용자 이름");
  assert.equal(buildSmartShoppingGreeting("박영희", "TV"), "안녕하세요! 합리적인 소비 요정, 모잇이에요.\n박영희님이 고르신 TV, 후회 없는 소비가 되도록 제가 꼼꼼히 따져볼게요.", "사용자 이름 동적 인사말");
  for (const [id, title] of [["air-conditioner", "에어컨"], ["tv", "TV"], ["refrigerator", "냉장고"], ["vacuum", "청소기"]]) {
    assert.ok(buildSmartShoppingGreeting(currentUser.displayName, getSubCategoryById(id).title).includes(`${currentUser.displayName}님이 고르신 ${title}`), `${title} 동적 인사말`);
  }

  const recommendationState = await load("/src/app/features/smart-shopping/types/recommendation.ts");
  assert.equal(recommendationState.initialRecommendationViewState.selectedProduct, null, "첫 상품 자동 선택 금지");
  const choosingState = recommendationState.recommendationViewReducer(recommendationState.initialRecommendationViewState, { type: "recommendations-settled" });
  assert.equal(choosingState.stage, "choosing-product", "추천 후 목록 선택 단계");

  const airCriteria = await load("/src/app/features/chat-flow/flows/appliances/air-conditioner/criteria.ts");
  assert.equal(airCriteria.calculateRecommendedCoolingArea(33), 17, "에어컨 냉방 면적 계수");

  const { AIR_CONDITIONER_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/air-conditioner/products.ts");
  const { rankAirConditioners, getAirConditionerRankingWeights } = await load("/src/app/features/chat-flow/flows/appliances/air-conditioner/rankProducts.ts");
  const airAnswers = {
    "airConditioner.type": "wall", "airConditioner.actualCoolingArea": 8,
    "airConditioner.dailyUsage": "4to8", "airConditioner.valuePriority": "balanced", "airConditioner.budget": 1_000_000,
  };
  const airResult = rankAirConditioners(AIR_CONDITIONER_PRODUCTS, airAnswers);
  assert.deepEqual(airResult.recommendations.map(({ product }) => product.id), ["ac-pure-wall-10"], "에어컨 필수 조건 제외");
  assert.ok(airResult.excludedProducts.some(({ productId, reasons }) => productId === "ac-value-wall-8" && reasons.some((reason) => reason.includes("인버터"))));
  assert.ok(airResult.recommendations.every(({ verificationNeeded, verificationRequiredFields }) => !verificationNeeded && !verificationRequiredFields), "설치·환급 미확인은 후보 분류에 사용하지 않음");
  assert.ok(airResult.recommendations.every((item) => JSON.stringify(item).match(/basicInstallationIncluded|officialInstallation|rebateEligible|공식 지정 설치|환급/) === null), "제거된 에어컨 필드가 추천 설명·검증 상태에 없음");
  assert.ok(getAirConditionerRankingWeights({ "airConditioner.dailyUsage": "under4", "airConditioner.valuePriority": "balanced" }).currentPrice > getAirConditionerRankingWeights({ "airConditioner.dailyUsage": "over8", "airConditioner.valuePriority": "balanced" }).currentPrice, "짧은 사용은 현재가 비중 증가");
  assert.ok(getAirConditionerRankingWeights({ "airConditioner.dailyUsage": "over8", "airConditioner.valuePriority": "electricity-saving" }).energyGrade > getAirConditionerRankingWeights({ "airConditioner.dailyUsage": "under4", "airConditioner.valuePriority": "low-purchase-price" }).energyGrade, "긴 사용·전기요금 우선은 효율 비중 증가");
  const pricedBase = { ...AIR_CONDITIONER_PRODUCTS.find(({ id }) => id === "ac-pure-wall-10"), currentPrice: 780_000 };
  const favorableHistory = { ...pricedBase, id: "history-good", modelNumber: "HISTORY-GOOD", priceHistory: [{ date: "2026-06-01", lowestPrice: 760_000 }, { date: "2026-07-01", lowestPrice: 800_000 }] };
  const unfavorableHistory = { ...pricedBase, id: "history-bad", modelNumber: "HISTORY-BAD", priceHistory: [{ date: "2026-06-01", lowestPrice: 400_000 }, { date: "2026-07-01", lowestPrice: 500_000 }] };
  const historyRanked = rankAirConditioners([unfavorableHistory, favorableHistory], { ...airAnswers, "airConditioner.valuePriority": "good-current-price" });
  assert.deepEqual(historyRanked.recommendations.map(({ product }) => product.id), ["history-good", "history-bad"], "가격 이력이 있으면 현재가의 과거 위치를 순위에 반영");
  const emptyHistory = { ...favorableHistory, id: "history-empty", modelNumber: "HISTORY-EMPTY", priceHistory: [] };
  const emptyHistoryResult = rankAirConditioners([emptyHistory], airAnswers);
  assert.equal(emptyHistoryResult.recommendations[0].recommendationReasons.some((reason) => reason.includes("과거 최저가")), false, "빈 가격 이력은 역사 가격 점수 생략");
  assert.ok(emptyHistoryResult.recommendations[0].unmatchedOrUnknownCriteria.includes("가격 이력 없음"), "빈 가격 이력을 사실대로 표시");
  const budgetOnlyMiss = rankAirConditioners([favorableHistory], { ...airAnswers, "airConditioner.budget": 100_000 });
  assert.equal(budgetOnlyMiss.recommendations.length, 0); assert.deepEqual(budgetOnlyMiss.overBudgetRecommendations.map(({ product }) => product.id), ["history-good"], "예산만 초과한 필수조건 충족 상품 제공");

  const { TV_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/tv/products.ts");
  const { rankTvs } = await load("/src/app/features/chat-flow/flows/appliances/tv/rankProducts.ts");
  const tvCriteria = await load("/src/app/features/chat-flow/flows/appliances/tv/criteria.ts");
  const { buildTvSearchQuery } = await load("/src/app/features/smart-shopping/naver/buildSearchQuery.ts");
  const tvAnswers = { "tv.viewingDistance": "1.5-2.5", "tv.screenSize": "55", "tv.primaryUse": "broadcast-streaming", "tv.dailyUsage": "3to6", "tv.platformRequirement": "other-allowed", "tv.valuePriority": "balanced", "tv.budget": 2_000_000 };
  const tvResult = rankTvs(TV_PRODUCTS, tvAnswers);
  assert.ok(tvResult.excludedProducts.some(({ productId, reasons }) => productId === "tv-basic-55" && reasons.some((reason) => reason.includes("4K"))), "TV 4K 필터");
  const oneYearWarrantyResult = rankTvs(TV_PRODUCTS, { ...tvAnswers, "tv.screenSize": "43", "tv.platformRequirement": "none" });
  assert.ok(oneYearWarrantyResult.recommendations.some(({ product }) => product.id === "tv-android-43"), "TV 1년 보증은 필수 제외하지 않음");
  const otherPlatformTv = { ...TV_PRODUCTS[0], id: "tv-other-platform", modelNumber: "TV-OTHER", specs: { ...TV_PRODUCTS[0].specs, os: "other" } };
  const requiredPlatformResult = rankTvs([TV_PRODUCTS[0], otherPlatformTv], { ...tvAnswers, "tv.platformRequirement": "google-android-required" });
  assert.deepEqual(requiredPlatformResult.recommendations.map(({ product }) => product.id), ["tv-google-55"], "명시한 Google/Android 플랫폼 필터");
  assert.ok(requiredPlatformResult.excludedProducts.some(({ productId, reasons }) => productId === "tv-other-platform" && reasons.some((reason) => reason.includes("Google TV 또는 Android TV"))), "다른 플랫폼은 명시적 필수일 때만 제외");
  const emptyTvHistory = { ...TV_PRODUCTS[0], id: "tv-empty-history", modelNumber: "TV-EMPTY-HISTORY", priceHistory: [] };
  const emptyTvHistoryResult = rankTvs([emptyTvHistory], { ...tvAnswers, "tv.valuePriority": "good-current-price" });
  assert.ok(emptyTvHistoryResult.recommendations[0].unmatchedOrUnknownCriteria.includes("가격 이력 없음") && emptyTvHistoryResult.recommendations[0].recommendationReasons.every((reason) => !reason.includes("역대 최저가")), "TV 빈 가격 이력은 역사 점수·이유 생략");
  const tvHistoryGood = { ...TV_PRODUCTS[0], id: "tv-history-good", modelNumber: "TV-HISTORY-GOOD", currentPrice: 900_000, priceHistory: [{ date: "2026-06-01", lowestPrice: 880_000 }, { date: "2026-07-01", lowestPrice: 950_000 }] };
  const tvHistoryBad = { ...TV_PRODUCTS[0], id: "tv-history-bad", modelNumber: "TV-HISTORY-BAD", currentPrice: 900_000, priceHistory: [{ date: "2026-06-01", lowestPrice: 400_000 }, { date: "2026-07-01", lowestPrice: 500_000 }] };
  assert.deepEqual(rankTvs([tvHistoryBad, tvHistoryGood], { ...tvAnswers, "tv.valuePriority": "good-current-price" }).recommendations.map(({ product }) => product.id), ["tv-history-good", "tv-history-bad"], "TV 현재 가격의 저장 이력 위치를 순위에 반영");
  const vaCinemaTv = { ...TV_PRODUCTS[2], id: "tv-cinema-va", modelNumber: "TV-CINEMA-VA", specs: { ...TV_PRODUCTS[2].specs, panel: "VA" } };
  const ipsCinemaTv = { ...TV_PRODUCTS[2], id: "tv-cinema-ips", modelNumber: "TV-CINEMA-IPS", specs: { ...TV_PRODUCTS[2].specs, panel: "IPS" } };
  assert.equal(rankTvs([ipsCinemaTv, vaCinemaTv], { ...tvAnswers, "tv.screenSize": "65", "tv.primaryUse": "movies-dramas" }).recommendations[0].product.id, "tv-cinema-va", "영화·드라마는 HDR과 VA 특성 비중 증가");
  assert.equal(rankTvs([vaCinemaTv, ipsCinemaTv], { ...tvAnswers, "tv.screenSize": "65", "tv.primaryUse": "family-wide-viewing" }).recommendations[0].product.id, "tv-cinema-ips", "여러 방향 가족 시청은 IPS 시야각 특성 비중 증가");
  assert.equal(rankTvs([TV_PRODUCTS[0]], { ...tvAnswers, "tv.budget": 100_000 }).recommendations.length, 0, "TV 예산은 currentPrice 상한 필터로 적용");
  assert.ok(tvCriteria.getTvRankingWeights({ ...tvAnswers, "tv.dailyUsage": "under3" }).currentPrice > tvCriteria.getTvRankingWeights({ ...tvAnswers, "tv.dailyUsage": "over6" }).currentPrice, "TV 짧은 사용은 현재가 비중 증가");
  assert.ok(tvCriteria.getTvRankingWeights({ ...tvAnswers, "tv.dailyUsage": "over6", "tv.valuePriority": "electricity-saving" }).energyGrade > tvCriteria.getTvRankingWeights({ ...tvAnswers, "tv.dailyUsage": "under3", "tv.valuePriority": "low-purchase-price" }).energyGrade, "TV 긴 사용·전기요금 우선은 효율 비중 증가");
  assert.equal(buildTvSearchQuery({ "tv.viewingDistance": "2.5-3", "tv.recommendedScreenSize": "65" }), "TV 65인치 4K", "거리 추천 크기도 기존 네이버 검색어에 전달");
  assert.ok(tvResult.recommendations.every((item, index, list) => index === 0 || list[index - 1].score >= item.score), "필수 필터 후 선호 점수 정렬");

  const refrigeratorCriteria = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/criteria.ts");
  const { REFRIGERATOR_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/products.ts");
  const { rankRefrigerators } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/rankProducts.ts");
  const { buildRefrigeratorSearchQuery } = await load("/src/app/features/smart-shopping/naver/buildSearchQuery.ts");
  const capacityValue = (household, habit) => refrigeratorCriteria.getRecommendedCapacityStage(household, habit).value;
  assert.deepEqual([capacityValue("1", "general"), capacityValue("2", "general"), capacityValue("3-4", "general"), capacityValue("5-plus", "general")], ["under-500", "500-600", "600-800", "over-800"], "가구원별 기본 냉장고 용량 단계");
  assert.deepEqual([capacityValue("1", "small-frequent"), capacityValue("2", "small-frequent"), capacityValue("3-4", "bulk"), capacityValue("3-4", "frozen-meal-prep"), capacityValue("5-plus", "bulk")], ["under-500", "under-500", "over-800", "over-800", "over-800"], "보관 습관별 한 단계 조정과 최저·최고 제한");

  const refrigeratorAnswers = { "refrigerator.householdSize": "3-4", "refrigerator.storageHabit": "general", "refrigerator.capacityMode": "recommended", "refrigerator.installationType": "unknown", "refrigerator.doorType": "any", "refrigerator.valuePriority": "balanced", "refrigerator.budget": "none" };
  assert.equal(refrigeratorCriteria.getSelectedCapacityRange({ ...refrigeratorAnswers, "refrigerator.capacityMode": "custom", "refrigerator.customCapacity": "500-600" }).label, "500~600L", "직접 수정한 용량 범위 적용");
  assert.equal(buildRefrigeratorSearchQuery({ ...refrigeratorAnswers, "refrigerator.doorType": "four-door-value" }), "냉장고 600~800L 4도어", "냉장고 검색어도 계산 용량과 표시 도어 사용");

  const refrigeratorBase = REFRIGERATOR_PRODUCTS.find(({ id }) => id === "rf-value-650");
  const kitchenFit = { ...refrigeratorBase, id: "rf-kitchen-fit", modelNumber: "RF-KITCHEN-FIT", specs: { ...refrigeratorBase.specs, freestanding: false } };
  const generalInstall = { ...refrigeratorBase, id: "rf-general-install", modelNumber: "RF-GENERAL-INSTALL", specs: { ...refrigeratorBase.specs, freestanding: true } };
  assert.deepEqual(rankRefrigerators([generalInstall, kitchenFit], { ...refrigeratorAnswers, "refrigerator.installationType": "kitchen-fit" }).recommendations.map(({ product }) => product.id), ["rf-kitchen-fit"], "키친핏은 freestanding false만 필터 통과");
  assert.deepEqual(rankRefrigerators([generalInstall, kitchenFit], { ...refrigeratorAnswers, "refrigerator.installationType": "general" }).recommendations.map(({ product }) => product.id), ["rf-general-install"], "일반 설치는 freestanding true만 필터 통과");
  assert.equal(rankRefrigerators([generalInstall, kitchenFit], refrigeratorAnswers).recommendations.length, 2, "설치 공간 모름은 설치 형태로 필터하지 않음");

  const twoDoor = { ...refrigeratorBase, id: "rf-two-door", modelNumber: "RF-TWO-DOOR", specs: { ...refrigeratorBase.specs, doorType: "two-door" } };
  const fourDoor = { ...refrigeratorBase, id: "rf-four-door", modelNumber: "RF-FOUR-DOOR", specs: { ...refrigeratorBase.specs, doorType: "four-door-value" } };
  assert.deepEqual(rankRefrigerators([twoDoor, fourDoor], { ...refrigeratorAnswers, "refrigerator.doorType": "two-door" }).recommendations.map(({ product }) => product.id), ["rf-two-door"], "명시한 2도어만 필터 통과");
  assert.deepEqual(rankRefrigerators([twoDoor, fourDoor], { ...refrigeratorAnswers, "refrigerator.doorType": "four-door-value" }).recommendations.map(({ product }) => product.id), ["rf-four-door"], "명시한 4도어만 필터 통과");
  assert.equal(rankRefrigerators([twoDoor, fourDoor], refrigeratorAnswers).recommendations.length, 2, "도어 상관없음은 도어 형태로 필터하지 않음");

  const basicTechnology = { ...refrigeratorBase, id: "rf-basic-technology", modelNumber: "RF-BASIC-TECH", currentPrice: 500_000, priceHistory: [], specs: { ...refrigeratorBase.specs, metalDoor: false, coolingMethod: "direct", inverter: false, corePartWarrantyYears: 3, energyGrade: 5 } };
  const premiumTechnology = { ...refrigeratorBase, id: "rf-premium-technology", modelNumber: "RF-PREMIUM-TECH", currentPrice: 1_000_000, priceHistory: [], specs: { ...refrigeratorBase.specs, metalDoor: true, coolingMethod: "indirect", inverter: true, corePartWarrantyYears: 10, energyGrade: 1 } };
  assert.equal(rankRefrigerators([basicTechnology], refrigeratorAnswers).recommendations.length, 1, "직접 냉각·비인버터·10년 미만 보증은 자동 탈락하지 않음");
  assert.equal(rankRefrigerators([basicTechnology], { ...refrigeratorAnswers, "refrigerator.budget": 400_000 }).recommendations.length, 0, "냉장고 예산은 currentPrice 상한 필터로만 적용");
  assert.equal(rankRefrigerators([{ ...basicTechnology, dataStatus: "unverified" }, { ...premiumTechnology, dataStatus: "stale" }], refrigeratorAnswers).recommendations.length, 2, "unverified와 stale은 추천 후보 유지");
  assert.equal(rankRefrigerators([{ ...basicTechnology, dataStatus: "discontinued" }], refrigeratorAnswers).recommendations.length, 0, "discontinued만 일반 추천에서 제외");
  assert.equal(rankRefrigerators([basicTechnology, premiumTechnology], { ...refrigeratorAnswers, "refrigerator.valuePriority": "low-purchase-price" }).recommendations[0].product.id, "rf-basic-technology", "구매가격 우선은 낮은 currentPrice 비중 상승");
  assert.equal(rankRefrigerators([basicTechnology, premiumTechnology], { ...refrigeratorAnswers, "refrigerator.valuePriority": "electricity-saving" }).recommendations[0].product.id, "rf-premium-technology", "전기요금 우선은 에너지등급과 인버터 비중 상승");
  const refrigeratorWeights = refrigeratorCriteria.getRefrigeratorRankingWeights;
  assert.ok(refrigeratorWeights({ "refrigerator.valuePriority": "storage-convenience" }).capacity > refrigeratorWeights({ "refrigerator.valuePriority": "low-purchase-price" }).capacity && refrigeratorWeights({ "refrigerator.valuePriority": "storage-convenience" }).storageConvenience > refrigeratorWeights({ "refrigerator.valuePriority": "balanced" }).storageConvenience, "수납 편의 우선은 용량 적합도와 도어 비중 상승");
  assert.ok(refrigeratorWeights({ "refrigerator.valuePriority": "good-current-price" }).marketPrice > refrigeratorWeights({ "refrigerator.valuePriority": "balanced" }).marketPrice, "현재 가격 우선은 저장 가격 이력 위치 비중 상승");

  const favorableRefrigeratorHistory = { ...refrigeratorBase, id: "rf-history-good", modelNumber: "RF-HISTORY-GOOD", currentPrice: 900_000, priceHistory: [{ date: "2026-06-01", lowestPrice: 880_000 }, { date: "2026-07-01", lowestPrice: 950_000 }] };
  const unfavorableRefrigeratorHistory = { ...refrigeratorBase, id: "rf-history-bad", modelNumber: "RF-HISTORY-BAD", currentPrice: 900_000, priceHistory: [{ date: "2026-06-01", lowestPrice: 400_000 }, { date: "2026-07-01", lowestPrice: 500_000 }] };
  assert.deepEqual(rankRefrigerators([unfavorableRefrigeratorHistory, favorableRefrigeratorHistory], { ...refrigeratorAnswers, "refrigerator.valuePriority": "good-current-price" }).recommendations.map(({ product }) => product.id), ["rf-history-good", "rf-history-bad"], "현재가의 저장된 역대 최저가 위치를 냉장고 순위에 반영");
  const noRefrigeratorHistory = rankRefrigerators([basicTechnology], { ...refrigeratorAnswers, "refrigerator.valuePriority": "good-current-price" }).recommendations[0];
  assert.ok(noRefrigeratorHistory.unmatchedOrUnknownCriteria.includes("가격 이력 없음") && noRefrigeratorHistory.recommendationReasons.every((reason) => !reason.includes("역대 최저가")), "가격 이력이 없으면 가짜 최저가 점수·이유를 만들지 않음");
  const metalFalseScore = rankRefrigerators([{ ...premiumTechnology, id: "rf-metal-false", specs: { ...premiumTechnology.specs, metalDoor: false } }], refrigeratorAnswers).recommendations[0].score;
  const metalTrueScore = rankRefrigerators([{ ...premiumTechnology, id: "rf-metal-true", specs: { ...premiumTechnology.specs, metalDoor: true } }], refrigeratorAnswers).recommendations[0].score;
  assert.equal(metalFalseScore, metalTrueScore, "metalDoor는 가성비 필터나 추천 점수에 사용하지 않음");

  const runtime = await load("/src/app/features/chat-flow/engine/flowRuntime.ts");
  const { FLOW_REGISTRY, getFlowModule } = await load("/src/app/features/chat-flow/registry/loadFlows.ts");
  const expectedModules = [
    ["air-conditioner", "appliances"], ["tv", "appliances"], ["refrigerator", "appliances"], ["vacuum", "appliances"],
    ["phone", "telecom"], ["internet", "telecom"], ["iptv", "telecom"], ["bundle", "telecom"],
  ];
  assert.equal(FLOW_REGISTRY.size, expectedModules.length, "가전·생활비 flow를 중복 없이 모두 등록");
  expectedModules.forEach(([id, categoryId]) => {
    const module = getFlowModule(id);
    assert.equal(module?.id, id, `${id} 전용 flow 선택`);
    assert.equal(module?.categoryId, categoryId, `${id} category 격리`);
    assert.equal(module?.definition.subCategoryId, id, `${id} definition 연결`);
  });
  assert.notEqual(getFlowModule("air-conditioner"), getFlowModule("phone"), "생활비 flow 등록 후에도 에어컨 module 유지");

  const submit = (module, state, value, displayValue = String(value)) =>
    runtime.submitFlowAnswer(module, state, { value, displayValue });
  const getRecommendationStartAnchor = (state) => state.messages.findLast(({ sender, text }) => sender === "user" && text === "추천 시작")?.metadata?.productSelectionAnchorId;
  const airModule = getFlowModule("air-conditioner");
  let airFlowState = runtime.createInitialFlowState(airModule);
  assert.equal(airFlowState.currentStepId, "ac-space", "에어컨 첫 질문은 설치 공간");
  assert.equal(airFlowState.checkpoints.length, 0, "첫 조건에는 undo checkpoint 없음");
  const airFlowMessages = airModule.definition.steps.filter((step) => "message" in step).map((step) => step.message).filter((message) => typeof message === "string").join("\n");
  assert.ok(airFlowMessages.includes("에어컨을 주로 어디에 설치할 예정인가요?") && airFlowMessages.includes("여름철 하루에 몇 시간 정도 사용할 예정인가요?") && airFlowMessages.includes("어떤 기준의 가성비를 가장 중요하게 볼까요?"), "새 에어컨 질문 문구");
  assert.ok(!airFlowMessages.includes("공식 지정 설치") && !airFlowMessages.includes("기본 설치비 포함") && !airFlowMessages.includes("환급"), "설치·공식설치·환급 질문 제거");
  assert.ok(!airModule.definition.steps.some((step) => "answerKey" in step && ["airConditioner.officialRequired", "airConditioner.installationCost", "airConditioner.rebate", "airConditioner.useDefaults"].includes(step.answerKey)), "기존 에어컨 조건 answerKey 제거");
  let twoInOneState = runtime.createInitialFlowState(airModule);
  twoInOneState = submit(airModule, twoInOneState, "multiple", "거실과 방");
  twoInOneState = submit(airModule, twoInOneState, "two-in-one", "2in1으로 진행");
  assert.equal(twoInOneState.currentStepId, "ac-home", "2in1은 집 전체 크기를 질문");
  twoInOneState = submit(airModule, twoInOneState, 30, "30평");
  assert.ok(twoInOneState.messages.some(({ text }) => text?.includes("주 실내기 냉방면적 15평") && text.includes("2in1 제품은 주 실내기의 냉방면적을 기준으로 비교")), "2in1 냉방면적은 자연스러운 한국어로 설명");
  assert.ok(twoInOneState.messages.every(({ text }) => !text?.includes("ratedCoolingAreaPyeong")), "계산 메시지에 내부 냉방면적 필드명 미노출");
  const initialAirMessages = airFlowState.messages.map(({ text }) => text);
  airFlowState = submit(airModule, airFlowState, "room", "방 또는 원룸");
  assert.equal(airFlowState.currentStepId, "ac-inferred-type");
  assert.ok(airFlowState.messages.some(({ text }) => text?.includes("벽걸이형이 선택한 공간에 가장 실용적")), "설치 공간에서 타입 추천");
  airFlowState = runtime.undoLatestFlowAnswer(airModule, airFlowState);
  assert.equal(airFlowState.currentStepId, "ac-space"); assert.deepEqual(airFlowState.messages.map(({ text }) => text), initialAirMessages, "첫 답과 파생 타입 추천·현재 질문을 한 번에 제거");
  assert.equal(airFlowState.answers["airConditioner.installationSpace"], undefined, "복원한 첫 입력은 비어 있음");
  airFlowState = submit(airModule, airFlowState, "room", "방 또는 원룸");
  airFlowState = submit(airModule, airFlowState, "wall", "벽걸이형으로 진행");
  assert.equal(airFlowState.currentStepId, "ac-area-direct");
  airFlowState = submit(airModule, airFlowState, "unknown", "잘 모르겠어요");
  assert.equal(airFlowState.currentStepId, "ac-home");
  const beforeHomeAnswerCount = airFlowState.messages.length;
  airFlowState = submit(airModule, airFlowState, 30, "30평");
  assert.equal(airFlowState.currentStepId, "ac-area-mode");
  assert.ok(airFlowState.messages.some(({ text }) => text?.includes("30평 집이라면 냉방면적 15평 이상")), "설정 계수 계산 안내");
  airFlowState = runtime.undoLatestFlowAnswer(airModule, airFlowState);
  assert.equal(airFlowState.currentStepId, "ac-home"); assert.equal(airFlowState.messages.length, beforeHomeAnswerCount, "Policy A가 집 평수 답·계산 안내·적용 질문을 제거");
  assert.equal(airFlowState.answers["airConditioner.homePyeong"], undefined); assert.equal(airFlowState.answers["airConditioner.actualCoolingArea"], "unknown", "이전 조건은 유지하고 복원 입력은 비움");
  airFlowState = submit(airModule, airFlowState, 30, "30평");
  airFlowState = submit(airModule, airFlowState, "recommended", "계산값 적용");
  assert.equal(airFlowState.currentStepId, "ac-usage");
  airFlowState = runtime.undoLatestFlowAnswer(airModule, airFlowState);
  assert.equal(airFlowState.currentStepId, "ac-area-mode"); assert.equal(airFlowState.answers["airConditioner.coolingAreaMode"], undefined, "한 번 누를 때 계산값 선택 한 단계만 undo");
  airFlowState = submit(airModule, airFlowState, "custom", "직접 수정");
  airFlowState = submit(airModule, airFlowState, 5, "5평");
  airFlowState = submit(airModule, airFlowState, "4to8", "4~8시간");
  let repeatedUndoState = runtime.undoLatestFlowAnswer(airModule, airFlowState);
  assert.equal(repeatedUndoState.currentStepId, "ac-usage", "첫 반복 undo는 사용 시간 한 단계 복원");
  repeatedUndoState = runtime.undoLatestFlowAnswer(airModule, repeatedUndoState);
  assert.equal(repeatedUndoState.currentStepId, "ac-area-custom", "두 번째 반복 undo는 바로 전 냉방 면적 단계만 추가 복원");
  assert.equal(repeatedUndoState.answers["airConditioner.homePyeong"], 30, "반복 undo 뒤에도 더 이른 집 크기 답 유지");
  airFlowState = submit(airModule, airFlowState, "balanced", "가격·효율 균형 추천");
  airFlowState = submit(airModule, airFlowState, 1_000_000, "1,000,000원");
  assert.equal(airFlowState.currentStepId, "ac-confirm"); assert.ok(airFlowState.messages.some(({ text }) => text?.includes("MOIT 자동 적용 규칙")), "최종 확인 규칙 표시");
  airFlowState = runtime.undoLatestFlowAnswer(airModule, airFlowState);
  assert.equal(airFlowState.currentStepId, "ac-budget"); assert.equal(airFlowState.answers["airConditioner.budget"], undefined, "최종 확인 undo는 빈 예산 단계 복원");
  assert.equal(airFlowState.messages.some(({ text }) => text?.startsWith("선택 조건")), false, "최종 요약도 예산 답의 파생 메시지로 제거");
  airFlowState = submit(airModule, airFlowState, "none", "예산 제한 없음");
  airFlowState = submit(airModule, airFlowState, true, "추천 시작");
  assert.equal(airFlowState.completed, true, "에어컨 질문 흐름 완료");
  assert.match(getRecommendationStartAnchor(airFlowState), /^air-conditioner-recommendation-start-\d+$/, "에어컨 추천 시작 사용자 행에 고유 스크롤 앵커를 기록");
  assert.ok(airFlowState.result.recommendations.length > 0 && airFlowState.result.recommendations.every(({ product, verificationNeeded }) => product.source === "real" && !verificationNeeded), "실제 에어컨을 설치·환급 확인 후보로 분류하지 않음");
  assert.equal(airFlowState.answers["airConditioner.dailyUsage"], "4to8"); assert.equal(airFlowState.answers["airConditioner.valuePriority"], "balanced", "사용 시간·가성비 우선순위 state 보존");
  assert.equal(airFlowState.result.metadata.category, "air-conditioner", "에어컨 전용 결과 사용");
  const airVisibleRecommendationCopy = airFlowState.result.recommendations.flatMap(({ recommendationReasons, matchedCoreCriteria, unmatchedOrUnknownCriteria }) => [...recommendationReasons, ...matchedCoreCriteria, ...unmatchedOrUnknownCriteria]).join("\n");
  assert.ok(airVisibleRecommendationCopy.includes("하루 4~8시간") && airVisibleRecommendationCopy.includes("가격·효율 균형 추천"), "추천 이유에 사용 시간·우선순위 표시 라벨 사용");
  assert.ok(!/ratedCoolingAreaPyeong|two-in-one|under4|4to8|over8|maintenance|good-current-price|airConditioner\./.test(airVisibleRecommendationCopy), "에어컨 추천 표시 문구에 내부 식별자·enum 미노출");
  assert.strictEqual(runtime.undoLatestFlowAnswer(airModule, airFlowState), airFlowState, "추천 생성 뒤 undo 비활성");

  const tvModule = getFlowModule("tv");
  let tvFlowState = runtime.createInitialFlowState(tvModule);
  assert.equal(tvFlowState.currentStepId, "tv-distance", "TV 첫 질문은 시청 거리");
  assert.equal(tvFlowState.checkpoints.length, 0, "TV 첫 질문에는 undo checkpoint 없음");
  const tvFlowCopy = tvModule.definition.steps.filter((step) => "message" in step).map((step) => step.message).filter((message) => typeof message === "string").join("\n");
  assert.ok(tvFlowCopy.includes("TV를 시청할 때 화면과의 거리는 어느 정도인가요?") && tvFlowCopy.includes("TV를 주로 어떻게 사용할 예정인가요?") && tvFlowCopy.includes("하루에 TV를 얼마나 사용할 예정인가요?") && tvFlowCopy.includes("스마트 TV 플랫폼에 꼭 필요한 조건이 있나요?") && tvFlowCopy.includes("어떤 기준의 가성비를 가장 중요하게 볼까요?") && tvFlowCopy.includes("TV 제품 가격은 최대 얼마까지 생각하고 있나요?"), "새 TV 질문 순서·문구");
  assert.ok(!/콘솔|게임|선호 패널|HDR 화질 개선|무상 A\/S 2년|환급/.test(tvFlowCopy), "게임·패널·HDR·보증 묶음·환급 질문 제거");
  assert.ok(!tvModule.definition.steps.some((step) => "answerKey" in step && ["tv.os", "tv.panel", "tv.useDefaults", "tv.fourKRequired", "tv.minimumWarranty", "tv.hdrRequired", "tv.rebate"].includes(step.answerKey)), "기존 TV 조건 answerKey 제거");
  assert.deepEqual(tvCriteria.TV_SIZE_BY_DISTANCE, { "under-1.5": 43, "1.5-2.5": 55, "2.5-3": 65, "over-3": 75 }, "TV 거리별 추천 크기 매핑");

  const initialTvMessages = tvFlowState.messages.map(({ text }) => text);
  tvFlowState = submit(tvModule, tvFlowState, "2.5-3", "2.5~3m");
  assert.equal(tvFlowState.currentStepId, "tv-recommended-size");
  assert.ok(tvFlowState.messages.some(({ text }) => text?.includes("이 거리에서는 65인치부터 살펴보는 것을 추천해요")), "거리에서 자연스러운 크기 추천");
  tvFlowState = runtime.undoLatestFlowAnswer(tvModule, tvFlowState);
  assert.equal(tvFlowState.currentStepId, "tv-distance"); assert.deepEqual(tvFlowState.messages.map(({ text }) => text), initialTvMessages, "TV 거리 답·파생 크기 추천·크기 확인을 Policy A로 제거");
  assert.equal(tvFlowState.answers["tv.viewingDistance"], undefined, "복원한 TV 거리 선택은 비어 있음");

  let directTvState = runtime.createInitialFlowState(tvModule);
  directTvState = submit(tvModule, directTvState, "unknown", "잘 모르겠어요");
  assert.equal(directTvState.currentStepId, "tv-size", "TV 거리 미확인은 크기 직접 선택으로 이동");
  assert.deepEqual(tvModule.definition.steps.find((step) => step.id === "tv-size").options.map(({ value }) => value), ["43", "55", "65", "75"], "지원하는 TV 크기 직접 선택");

  tvFlowState = runtime.createInitialFlowState(tvModule);
  for (const [value, label] of [["1.5-2.5", "1.5~2.5m"], ["55", "55인치 적용"], ["broadcast-streaming", "방송·유튜브·OTT 시청"], ["3to6", "3~6시간"], ["other-allowed", "삼성·LG 등 다른 스마트 OS도 괜찮음"], ["balanced", "가격·화질 균형 추천"], ["none", "예산 제한 없음"]]) {
    tvFlowState = submit(tvModule, tvFlowState, value, label);
  }
  assert.equal(tvFlowState.currentStepId, "tv-confirm", "TV 최종 확인 단계");
  assert.ok(tvFlowState.messages.some(({ text }) => text?.includes("선택 조건") && text.includes("화면 크기: 55인치") && text.includes("방송·유튜브·OTT 시청") && text.includes("하루 3~6시간") && text.includes("삼성·LG 등 다른 스마트 OS도 가능") && text.includes("가격·화질 균형 추천") && text.includes("예산 제한 없음")), "TV 최종 조건 요약 표시 라벨");
  assert.ok(tvFlowState.messages.some(({ text }) => text?.includes("4K UHD 제품만 추천") && text.includes("에너지 등급과 보증 기간을 순위에 반영")), "TV MOIT 자동 정책 표시");
  tvFlowState = runtime.undoLatestFlowAnswer(tvModule, tvFlowState);
  assert.equal(tvFlowState.currentStepId, "tv-budget"); assert.equal(tvFlowState.answers["tv.budget"], undefined, "TV 최종 확인 undo는 빈 예산 단계 복원");
  assert.equal(tvFlowState.messages.some(({ text }) => text?.startsWith("선택 조건")), false, "TV 예산 답에서 파생된 최종 요약 제거");
  tvFlowState = submit(tvModule, tvFlowState, "none", "예산 제한 없음");
  const tvConfirmationState = tvFlowState;
  tvFlowState = submit(tvModule, tvFlowState, true, "추천 시작");
  assert.equal(tvFlowState.completed, true, "TV 질문 흐름 완료");
  assert.match(getRecommendationStartAnchor(tvFlowState), /^tv-recommendation-start-\d+$/, "TV 추천 시작 사용자 행에 고유 스크롤 앵커를 기록");
  const repeatedTvRecommendationStart = submit(tvModule, tvConfirmationState, true, "추천 시작");
  assert.notEqual(getRecommendationStartAnchor(tvFlowState), getRecommendationStartAnchor(repeatedTvRecommendationStart), "추천을 다시 시작하면 가장 최근 사용자 행 전용 앵커를 새로 생성");
  assert.equal(tvFlowState.answers["tv.primaryUse"], "broadcast-streaming"); assert.equal(tvFlowState.answers["tv.dailyUsage"], "3to6"); assert.equal(tvFlowState.answers["tv.platformRequirement"], "other-allowed"); assert.equal(tvFlowState.answers["tv.valuePriority"], "balanced", "TV 용도·사용시간·플랫폼·가성비 state 보존");
  assert.strictEqual(runtime.undoLatestFlowAnswer(tvModule, tvFlowState), tvFlowState, "TV 추천 생성 뒤 undo 비활성");
  for (const id of ["air-conditioner", "tv", "refrigerator", "vacuum"]) assert.equal(getFlowModule(id).definition.enableConditionUndo, true, `${id} flow 공용 condition undo 활성`);
  assert.ok(tvFlowState.result.recommendations.length > 0 && tvFlowState.result.recommendations.every(({ product }) => product.source === "real"), "TV flow가 실제 카탈로그를 사용");
  assert.equal(tvFlowState.result.metadata.category, "tv", "TV 전용 결과 사용");

  const buildStepMessage = (module, stepId, answers) => module.definition.steps.find((step) => step.id === stepId).buildMessage(answers);
  const refrigeratorModule = getFlowModule("refrigerator");
  const refrigeratorSummaryAnswers = { ...refrigeratorAnswers, "refrigerator.installationType": "kitchen-fit", "refrigerator.doorType": "four-door-value", "refrigerator.valuePriority": "balanced", "refrigerator.budget": 2_000_000 };
  const refrigeratorSummary = buildStepMessage(refrigeratorModule, "rf-summary", refrigeratorSummaryAnswers);
  const vacuumFlowModule = getFlowModule("vacuum");
  const vacuumSummaryAnswers = { "vacuum.primaryUse": "short-daily", "vacuum.powerType": "wireless-value", "vacuum.floorEnvironment": "hard-floor", "vacuum.weightImportance": "very", "vacuum.valuePriority": "balanced", "vacuum.budget": 700_000 };
  const vacuumSummary = buildStepMessage(vacuumFlowModule, "vc-summary", vacuumSummaryAnswers);
  const refrigeratorFlowCopy = refrigeratorModule.definition.steps.filter((step) => "message" in step).map((step) => step.message).filter((message) => typeof message === "string").join("\n");
  assert.ok(refrigeratorFlowCopy.includes("함께 사용하는 가구원은 몇 명인가요?") && refrigeratorFlowCopy.includes("평소 식재료를 어떻게 보관하는 편인가요?") && refrigeratorFlowCopy.includes("추천 용량을 적용할까요?") && refrigeratorFlowCopy.includes("냉장고를 어떤 공간에 설치할 예정인가요?") && refrigeratorFlowCopy.includes("선호하는 도어 구조가 있나요?") && refrigeratorFlowCopy.includes("어떤 기준의 가성비를 가장 중요하게 볼까요?") && refrigeratorFlowCopy.includes("냉장고 제품 가격은 최대 얼마까지 생각하고 있나요?"), "새 냉장고 질문 순서·문구");
  assert.ok(!/원하는 도어 구조는요|메탈 소재 도어가 필수인가요|간접 냉각 또는 간랭식이 필수인가요|인버터 컴프레서가 필수인가요|핵심 부품 10년 이상 무상 보증이 필수인가요|프리스탠딩 설치 형태가 필수인가요|기본 기준.*필수로 적용할까요/.test(refrigeratorFlowCopy), "기존 냉장고 기술 조건 질문 제거");
  assert.ok(!refrigeratorModule.definition.steps.some((step) => "answerKey" in step && ["refrigerator.metalRequired", "refrigerator.useDefaults", "refrigerator.coolingRequired", "refrigerator.inverterRequired", "refrigerator.warrantyRequired", "refrigerator.freestandingRequired"].includes(step.answerKey)), "제거된 냉장고 기술 질문 answerKey 없음");
  assert.deepEqual(refrigeratorModule.definition.steps.find((step) => step.id === "rf-capacity-custom").options.map(({ label }) => label), ["500L 이하", "500~600L", "600~800L", "800L 이상"], "냉장고 용량 직접 수정 선택지");

  let refrigeratorUndoState = runtime.createInitialFlowState(refrigeratorModule);
  const initialRefrigeratorMessages = refrigeratorUndoState.messages.map(({ text }) => text);
  assert.equal(refrigeratorUndoState.currentStepId, "rf-household", "냉장고 첫 질문은 가구원");
  assert.equal(refrigeratorUndoState.checkpoints.length, 0, "냉장고 첫 질문에는 undo 없음");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, "3-4", "3~4명");
  assert.equal(refrigeratorUndoState.currentStepId, "rf-storage", "가구원 다음은 보관 습관");
  const beforeStorageAnswerCount = refrigeratorUndoState.messages.length;
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, "general", "일반적인 수준이에요");
  assert.equal(refrigeratorUndoState.currentStepId, "rf-capacity-mode", "보관 습관 다음은 추천 용량 확인");
  assert.ok(refrigeratorUndoState.messages.some(({ text }) => text?.includes("3~4명이 일반적으로 사용한다면 600~800L부터 살펴보는 것을 추천해요.")), "가구원과 보관 습관을 자연스러운 권장 용량 안내로 계산");
  refrigeratorUndoState = runtime.undoLatestFlowAnswer(refrigeratorModule, refrigeratorUndoState);
  assert.equal(refrigeratorUndoState.currentStepId, "rf-storage"); assert.equal(refrigeratorUndoState.messages.length, beforeStorageAnswerCount, "용량 확인 undo는 보관 습관 답·계산 안내·확인 질문을 함께 제거");
  assert.equal(refrigeratorUndoState.answers["refrigerator.storageHabit"], undefined); assert.equal(refrigeratorUndoState.answers["refrigerator.householdSize"], "3-4", "복원한 보관 습관은 비우고 앞선 가구원 답은 유지");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, "general", "일반적인 수준이에요");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, "recommended", "추천 범위 적용");
  assert.equal(refrigeratorUndoState.currentStepId, "rf-installation", "추천 범위 적용 후 설치 공간 질문");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, "kitchen-fit", "가구장에 맞추는 키친핏 공간");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, "four-door-value", "수납 정리가 편한 4도어");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, "balanced", "가격·용량·효율 균형 추천");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, 2_000_000, "2,000,000원");
  assert.equal(refrigeratorUndoState.currentStepId, "rf-confirm", "냉장고 최종 확인 단계");
  assert.ok(refrigeratorUndoState.messages.some(({ text }) => text?.includes("다음 조건으로 냉장고를 찾아볼게요.") && text.includes("가구원: 3~4명") && text.includes("보관 습관: 일반적인 수준") && text.includes("권장 용량: 600~800L") && text.includes("설치 형태: 키친핏") && text.includes("도어 구조: 4도어") && text.includes("가격·용량·효율 균형 추천") && text.includes("제품 예산: 최대 2,000,000원")), "냉장고 최종 조건을 자연스러운 표시 라벨로 요약");
  assert.ok(refrigeratorUndoState.messages.some(({ text }) => text?.includes("모잇 자동 기준") && text.includes("예산 초과 제품과 판매 중단 제품 제외") && text.includes("에너지등급, 인버터, 냉각 방식, 핵심부품 보증기간은 추천 점수에 반영")), "냉장고 자동 필터·점수 정책 안내");
  assert.ok(!/four-door-value|freestanding|recommended|refrigerator\./.test(refrigeratorUndoState.messages.map(({ text }) => text).join("\n")), "냉장고 사용자 메시지에 criteria key·enum 미노출");
  refrigeratorUndoState = runtime.undoLatestFlowAnswer(refrigeratorModule, refrigeratorUndoState);
  assert.equal(refrigeratorUndoState.currentStepId, "rf-budget"); assert.equal(refrigeratorUndoState.answers["refrigerator.budget"], undefined, "냉장고 최종 확인 undo는 빈 예산 단계");
  assert.equal(refrigeratorUndoState.messages.some(({ text }) => text?.startsWith("다음 조건으로 냉장고를 찾아볼게요.")), false, "냉장고 예산 답에서 파생된 최종 요약 제거");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, "none", "예산 제한 없음");
  refrigeratorUndoState = submit(refrigeratorModule, refrigeratorUndoState, true, "추천 시작");
  assert.equal(refrigeratorUndoState.completed, true, "냉장고 질문 흐름 완료");
  assert.match(getRecommendationStartAnchor(refrigeratorUndoState), /^refrigerator-recommendation-start-\d+$/, "냉장고 추천 시작 사용자 행에 고유 스크롤 앵커를 기록");
  assert.ok(refrigeratorUndoState.result.recommendations.length > 0, "새 냉장고 조건으로 실제 추천 생성");
  const refrigeratorVisibleRecommendationCopy = refrigeratorUndoState.result.recommendations.flatMap(({ recommendationReasons, matchedCoreCriteria, unmatchedOrUnknownCriteria }) => [...recommendationReasons, ...matchedCoreCriteria, ...unmatchedOrUnknownCriteria]).join("\n");
  assert.ok(!/four-door-value|freestanding|recommended|refrigerator\./.test(refrigeratorVisibleRecommendationCopy), "냉장고 추천 이유에도 내부 criteria 값 미노출");
  assert.strictEqual(runtime.undoLatestFlowAnswer(refrigeratorModule, refrigeratorUndoState), refrigeratorUndoState, "냉장고 추천 생성 뒤 undo 비활성");

  let customCapacityState = runtime.createInitialFlowState(refrigeratorModule);
  for (const [value, label] of [["2", "2명"], ["general", "일반적인 수준이에요"], ["custom", "직접 수정"], ["over-800", "800L 이상"]]) customCapacityState = submit(refrigeratorModule, customCapacityState, value, label);
  assert.equal(customCapacityState.currentStepId, "rf-installation"); assert.equal(refrigeratorCriteria.getSelectedCapacityRange(customCapacityState.answers).label, "800L 이상", "냉장고 용량 직접 수정 경로");

  const vacuumFlowCopy = vacuumFlowModule.definition.steps.filter((step) => "message" in step).map((step) => step.message).filter((message) => typeof message === "string").join("\n");
  assert.ok(vacuumFlowCopy.includes("청소기를 주로 어떻게 사용할 예정인가요?") && vacuumFlowCopy.includes("어떤 방식이 더 편한가요?") && vacuumFlowCopy.includes("주로 어떤 바닥을 청소하나요?") && vacuumFlowCopy.includes("청소기를 들고 움직일 때 가벼운 무게가 중요한가요?") && vacuumFlowCopy.includes("어떤 기준의 가성비를 가장 중요하게 볼까요?") && vacuumFlowCopy.includes("청소기 제품 가격은 최대 얼마까지 생각하고 있나요?"), "새 청소기 질문 순서·정확한 문구");
  assert.ok(!/실질 흡입력 기준을 골라주세요|배터리 분리·교체가 필수인가요|스탠드형 충전 거치대가 필수인가요|HEPA 필터가 필수인가요|소프트 롤러 브러시가 필수인가요|본체 중량 기준은요/.test(vacuumFlowCopy), "기존 청소기 기술 조건 질문 제거");
  assert.ok(!vacuumFlowModule.definition.steps.some((step) => "answerKey" in step && ["vacuum.suctionStandard", "vacuum.replaceableBatteryRequired", "vacuum.standingDockRequired", "vacuum.hepaRequired", "vacuum.softRollerRequired", "vacuum.weight"].includes(step.answerKey)), "제거된 청소기 기술 질문 answerKey 없음");

  let vacuumUndoState = runtime.createInitialFlowState(vacuumFlowModule);
  assert.equal(vacuumUndoState.currentStepId, "vc-usage", "청소기 첫 질문은 주 사용 방식");
  assert.equal(vacuumUndoState.checkpoints.length, 0, "청소기 첫 질문에는 undo 없음");
  const vacuumSteps = [
    ["vc-usage", "vacuum.primaryUse", "short-daily", "자주 짧게 일상 청소", "vc-power"],
    ["vc-power", "vacuum.powerType", "wireless-value", "이동이 편한 무선", "vc-floor"],
    ["vc-floor", "vacuum.floorEnvironment", "hard-floor", "마루·타일 위주", "vc-weight"],
    ["vc-weight", "vacuum.weightImportance", "very", "매우 중요해요", "vc-priority"],
    ["vc-priority", "vacuum.valuePriority", "balanced", "가격·성능 균형 추천", "vc-budget"],
    ["vc-budget", "vacuum.budget", 700_000, "700,000원", "vc-confirm"],
  ];
  for (const [stepId, answerKey, answerValue, answerLabel, nextStepId] of vacuumSteps) {
    assert.equal(vacuumUndoState.currentStepId, stepId);
    const beforeAnswerMessages = vacuumUndoState.messages.map(({ text }) => text);
    const beforeAnswers = { ...vacuumUndoState.answers };
    vacuumUndoState = submit(vacuumFlowModule, vacuumUndoState, answerValue, answerLabel);
    assert.equal(vacuumUndoState.currentStepId, nextStepId);
    const restored = runtime.undoLatestFlowAnswer(vacuumFlowModule, vacuumUndoState);
    assert.equal(restored.currentStepId, stepId); assert.equal(restored.answers[answerKey], undefined, `${stepId} undo는 복원 입력을 비움`);
    assert.deepEqual(restored.answers, beforeAnswers, `${stepId} undo는 더 이른 답변을 유지`);
    assert.deepEqual(restored.messages.map(({ text }) => text), beforeAnswerMessages, `${stepId} undo는 직전 답과 파생 질문·안내를 제거`);
    vacuumUndoState = submit(vacuumFlowModule, restored, answerValue, answerLabel);
  }
  assert.ok(vacuumUndoState.messages.some(({ text }) => text?.includes("다음 조건으로 청소기를 찾아볼게요.") && text.includes("주 사용 방식: 자주 짧게 일상 청소") && text.includes("동력 방식: 무선") && text.includes("바닥 환경: 마루·타일 위주") && text.includes("무게 중요도: 매우 중요") && text.includes("가성비 기준: 가격·성능 균형 추천") && text.includes("제품 예산: 최대 700,000원")), "청소기 최종 조건을 자연스러운 표시 라벨로 요약");
  assert.ok(vacuumUndoState.messages.some(({ text }) => text?.includes("모잇 자동 기준") && text.includes("예산 초과 제품과 판매 중단 제품 제외") && text.includes("표기 단위는 환산하지 않고 각각 비교") && text.includes("흡입력, 무게, 필터, 배터리, 롤러, 거치대, 보증기간 반영")), "청소기 자동 필터·점수 정책 안내");
  assert.ok(!/wireless-value|wired-major|short-daily|hard-floor|suctionAw|suctionPa|H13|vacuum\./.test(vacuumUndoState.messages.map(({ text }) => text).join("\n")), "청소기 사용자 메시지에 내부 필드·enum 미노출");
  vacuumUndoState = runtime.undoLatestFlowAnswer(vacuumFlowModule, vacuumUndoState);
  assert.equal(vacuumUndoState.currentStepId, "vc-budget"); assert.equal(vacuumUndoState.answers["vacuum.budget"], undefined, "청소기 최종 확인 undo는 빈 예산 단계");
  assert.equal(vacuumUndoState.messages.some(({ text }) => text?.startsWith("다음 조건으로 청소기를 찾아볼게요.")), false, "청소기 예산 답에서 파생된 최종 요약 제거");
  vacuumUndoState = submit(vacuumFlowModule, vacuumUndoState, "none", "예산 제한 없음");
  vacuumUndoState = submit(vacuumFlowModule, vacuumUndoState, true, "추천 시작");
  assert.equal(vacuumUndoState.completed, true, "청소기 질문 흐름 완료");
  assert.match(getRecommendationStartAnchor(vacuumUndoState), /^vacuum-recommendation-start-\d+$/, "청소기 추천 시작 사용자 행에 고유 스크롤 앵커를 기록");
  assert.ok(vacuumUndoState.result.recommendations.length > 0, "새 청소기 조건으로 실제 추천 생성");
  const vacuumVisibleRecommendationCopy = vacuumUndoState.result.recommendations.flatMap(({ recommendationReasons, matchedCoreCriteria, unmatchedOrUnknownCriteria }) => [...recommendationReasons, ...matchedCoreCriteria, ...unmatchedOrUnknownCriteria]).join("\n");
  assert.ok(!/wireless-value|wired-major|short-daily|hard-floor|suctionAw|suctionPa|H13|vacuum\./.test(vacuumVisibleRecommendationCopy), "청소기 추천 이유에 내부 필드·enum 미노출");
  assert.ok(!/자동 먼지|먼지 자동|자동 비움|청정스테이션/.test(vacuumVisibleRecommendationCopy), "스탠드 거치대를 자동 먼지 비움이나 청정스테이션으로 추론하지 않음");
  assert.strictEqual(runtime.undoLatestFlowAnswer(vacuumFlowModule, vacuumUndoState), vacuumUndoState, "청소기 추천 생성 뒤 undo 비활성");
  assert.ok(refrigeratorSummary.includes("4도어") && refrigeratorSummary.includes("600~800L") && refrigeratorSummary.includes("키친핏") && !/four-door-value|freestanding|recommended|refrigerator\./.test(refrigeratorSummary), "냉장고 요약에 내부 enum 미노출");
  assert.ok(vacuumSummary.includes("자주 짧게 일상 청소") && vacuumSummary.includes("무선") && vacuumSummary.includes("마루·타일 위주") && vacuumSummary.includes("매우 중요") && !/wireless-value|short-daily|hard-floor|suctionAw|H13/.test(vacuumSummary), "청소기 요약에 내부 enum 미노출");

  const { formatSmartShoppingCriteria } = await load("/src/app/features/chat-flow/flows/appliances/displayLabels.ts");
  const formattedCriteria = formatSmartShoppingCriteria({ "airConditioner.type": "two-in-one", "airConditioner.dailyUsage": "4to8", "airConditioner.valuePriority": "maintenance", "airConditioner.budget": "none" });
  assert.deepEqual(formattedCriteria, ["에어컨 타입: 2in1", "예상 사용 시간: 하루 4~8시간", "가성비 기준: 청소와 관리 편의", "제품 가격 예산: 예산 제한 없음"], "내부 조건 key·enum을 명시적 표시 라벨로 변환");
  const formattedTvCriteria = formatSmartShoppingCriteria(tvAnswers);
  assert.ok(formattedTvCriteria.includes("시청 거리: 1.5~2.5m") && formattedTvCriteria.includes("주 사용: 방송·유튜브·OTT 시청") && formattedTvCriteria.includes("예상 사용 시간: 하루 3~6시간") && formattedTvCriteria.includes("스마트 플랫폼: 삼성·LG 등 다른 스마트 OS도 가능") && formattedTvCriteria.includes("가성비 기준: 가격·화질 균형 추천"), "TV 조건을 사용자 표시 라벨로 변환");
  assert.ok(!/broadcast-streaming|3to6|other-allowed|balanced|tv\./.test(formattedTvCriteria.join("\n")), "TV 표시 조건에 내부 enum·key 미노출");
  const formattedRefrigeratorCriteria = formatSmartShoppingCriteria(refrigeratorSummaryAnswers);
  assert.ok(formattedRefrigeratorCriteria.includes("가구원: 3~4명") && formattedRefrigeratorCriteria.includes("보관 습관: 일반적인 수준") && formattedRefrigeratorCriteria.includes("설치 형태: 키친핏") && formattedRefrigeratorCriteria.includes("도어 구조: 4도어") && formattedRefrigeratorCriteria.includes("가성비 기준: 가격·용량·효율 균형 추천"), "냉장고 조건을 사용자 표시 라벨로 변환");
  assert.ok(!/four-door-value|freestanding|recommended|refrigerator\./.test(formattedRefrigeratorCriteria.join("\n")), "냉장고 표시 조건에 내부 enum·key 미노출");
  const formattedVacuumCriteria = formatSmartShoppingCriteria(vacuumSummaryAnswers);
  assert.ok(formattedVacuumCriteria.includes("주 사용 방식: 자주 짧게 일상 청소") && formattedVacuumCriteria.includes("동력 방식: 무선") && formattedVacuumCriteria.includes("바닥 환경: 마루·타일 위주") && formattedVacuumCriteria.includes("무게 중요도: 매우 중요") && formattedVacuumCriteria.includes("가성비 기준: 가격·성능 균형 추천"), "청소기 조건을 사용자 표시 라벨로 변환");
  assert.ok(!/wireless-value|short-daily|hard-floor|suctionAw|H13|vacuum\./.test(formattedVacuumCriteria.join("\n")), "청소기 표시 조건에 내부 enum·key 미노출");
  assert.deepEqual(formatSmartShoppingCriteria({ "tv.recommendedScreenSize": "other", "tv.screenSize": "65" }), ["화면 크기: 65인치"], "TV 다른 크기 선택 내부 결정은 숨기고 최종 크기만 표시");
  assert.equal(tvCriteria.getTvPlatformDisplayLabel({ brand: "삼성전자", specs: { os: "other" } }), "Tizen");
  assert.equal(tvCriteria.getTvPlatformDisplayLabel({ brand: "LG전자", specs: { os: "other" } }), "webOS");
  assert.ok(!["Tizen", "webOS", tvCriteria.getTvPlatformDisplayLabel({ brand: "기타", specs: { os: "other" } })].includes("other"), "TV 사용자 플랫폼 라벨에 내부 other 미노출");
  const { buildProductQuestionRequest } = await load("/src/app/features/smart-shopping/product-detail/productQuestionContext.ts");
  const productQuestionPayload = buildProductQuestionRequest({ selected: { source: "internal", recommendation: tvResult.recommendations[0] }, userCriteria: tvAnswers, timeline: [], sourceMode: "auto" });
  assert.equal(productQuestionPayload.productId, tvResult.recommendations[0].product.id, "직접 Q&A는 전체 상품이 아닌 선택 product id만 서버에 전달");
  assert.equal(productQuestionPayload.sourceMode, "auto", "직접 Q&A는 안정적인 출처 모드 enum을 전달");
  assert.ok(!("selectedProduct" in productQuestionPayload) && !("priceSummary" in productQuestionPayload), "브라우저 Q&A payload는 상품 객체와 가격 이력을 보내지 않음");

  const phoneModule = getFlowModule("phone");
  const phoneInitialState = runtime.createInitialFlowState(phoneModule);
  const phoneInitialStep = phoneModule.definition.steps.find(({ id }) => id === phoneInitialState.currentStepId);
  const phoneInitialOption = phoneInitialStep.options[0];
  const phoneFlowState = submit(phoneModule, phoneInitialState, phoneInitialOption.value, phoneInitialOption.label);
  assert.equal(phoneFlowState.flowId, "phone", "통합 우선순위 Living Cost flow identity 유지");
  assert.notEqual(phoneFlowState.currentStepId, phoneInitialState.currentStepId, "Living Cost 진단 시작 후 다음 단계 진행");
  assert.equal(Object.keys(phoneInitialState.answers).length, 0, "Living Cost 초기 상태 독립 보존");
  assert.ok(Object.keys(airFlowState.answers).every((key) => !key.startsWith("phone.")), "똑똑한 소비 state에 생활비 answer가 섞이지 않음");
  assert.ok(Object.keys(phoneFlowState.answers).every((key) => !key.startsWith("airConditioner.")), "생활비 state에 똑똑한 소비 answer가 섞이지 않음");

  const { normalizeNaverShoppingItems } = await load("/src/app/features/smart-shopping/naver/NaverShoppingAdapter.ts");
  const naverItems = normalizeNaverShoppingItems([
    { productId: "2", title: "<b>비싼</b> TV", lprice: "900000", brand: "MOIT View" },
    { productId: "1", title: "<b>저렴한</b> TV MV-G55", lprice: "700000", brand: "MOIT View" },
    { productId: "1", title: "중복", lprice: "600000" },
  ]);
  assert.deepEqual(naverItems.map((item) => item.productId), ["1", "2"], "네이버 중복 제거·최저가 오름차순");
  assert.equal(naverItems[0].title, "저렴한 TV MV-G55", "네이버 상품명 HTML 제거");
  const { NaverShoppingServiceError, searchNaverShopping } = await import("../server/naverShoppingService.mjs");
  let capturedNaverRequest;
  const serverNaverResult = await searchNaverShopping({
    query: "에어컨",
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    fetchImpl: async (url, init) => {
      capturedNaverRequest = { url: String(url), init };
      return new Response(JSON.stringify({ items: [{ productId: "naver-1", title: "<b>테스트</b> 에어컨", link: "https://example.test/product", image: "https://example.test/image.jpg", lprice: "100000", hprice: "0", mallName: "테스트몰", maker: "테스트제조사", brand: "테스트브랜드", category1: "디지털", productType: "1" }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });
  assert.equal(new URL(capturedNaverRequest.url).origin, "https://openapi.naver.com", "Naver server adapter uses the official API host");
  assert.deepEqual(Object.fromEntries(new URL(capturedNaverRequest.url).searchParams), { query: "에어컨", display: "10", start: "1", sort: "asc" }, "Naver server adapter uses required query parameters only");
  assert.equal(capturedNaverRequest.init.method, "GET"); assert.equal(capturedNaverRequest.init.headers["X-Naver-Client-Id"], "test-client-id"); assert.equal(capturedNaverRequest.init.headers["X-Naver-Client-Secret"], "test-client-secret", "Naver credentials stay in server request headers");
  assert.deepEqual(serverNaverResult.items[0], { productId: "naver-1", title: "테스트 에어컨", link: "https://example.test/product", image: "https://example.test/image.jpg", lowestPrice: 100000, highestPrice: null, mallName: "테스트몰", maker: "테스트제조사", brand: "테스트브랜드", category1: "디지털", category2: "", category3: "", category4: "", productType: "1" }, "Naver server adapter normalizes an item and treats zero price as unavailable");
  await assert.rejects(() => searchNaverShopping({ query: "TV", clientId: "test-client-id", clientSecret: "test-client-secret", fetchImpl: async () => new Response(JSON.stringify({ errorCode: "024" }), { status: 403 }) }), (error) => error instanceof NaverShoppingServiceError && error.code === "NAVER_PERMISSION_DENIED" && error.upstreamStatus === 403, "Naver permission errors retain only safe status and error code");

  const { matchInternalProduct } = await load("/src/app/features/smart-shopping/naver/matchInternalProduct.ts");
  const matchedTv = matchInternalProduct({ ...naverItems[0], modelNumber: "MV-G55" }, TV_PRODUCTS);
  assert.equal(matchedTv?.id, "tv-google-55", "정규화 모델번호 정확 일치");
  assert.equal(matchInternalProduct({ ...naverItems[0], productId: "x", title: "이름만 비슷한 상품", modelNumber: undefined, brand: "" }, TV_PRODUCTS), undefined, "상품명 유사도만으로 매칭 금지");

  const { combineProductDetail } = await load("/src/app/features/smart-shopping/recommendation/combineProductDetail.ts");
  const combinedMatch = combineProductDetail({ source: "naver", product: naverItems[0], matchedInternalProduct: matchedTv });
  assert.equal(combinedMatch.currentPrice, 700000); assert.equal(combinedMatch.priceHistory.length >= 6, true, "매칭 시 네이버 가격+내부 이력 결합");
  const combinedMiss = combineProductDetail({ source: "naver", product: naverItems[1] });
  assert.equal(combinedMiss.reviewSummary, null); assert.deepEqual(combinedMiss.priceHistory, [], "미매칭 시 검증되지 않은 정보 생성 금지");

  const detailState = recommendationState.recommendationViewReducer(choosingState, { type: "select-product", product: { source: "naver", product: naverItems[0], matchedInternalProduct: matchedTv } });
  assert.equal(detailState.stage, "viewing-product-detail", "상품 클릭 후 상세 단계");
  const returnedState = recommendationState.recommendationViewReducer(detailState, { type: "back-to-list" });
  assert.equal(returnedState.stage, "choosing-product"); assert.equal(returnedState.selectedProduct, null, "목록 복귀 시 선택만 해제");

  const { naverShoppingProxy } = await load("/server/naverShoppingProxy.ts");
  let proxyHandler;
  naverShoppingProxy({}).configureServer({ middlewares: { use: (handler) => { proxyHandler = handler; } } });
  let proxyStatus = 0; let proxyBody = "";
  await proxyHandler({ url: "/api/naver-shopping?query=TV", method: "GET" }, { setHeader: () => {}, end: (body) => { proxyBody = body; }, set statusCode(value) { proxyStatus = value; } }, () => {});
  assert.equal(proxyStatus, 503); assert.equal(JSON.parse(proxyBody).code, "NAVER_CREDENTIALS_MISSING", "API 키 미설정 상태 정규화");
  const naverClientSource = await readFile("src/app/features/smart-shopping/naver/naverShoppingClient.ts", "utf8");
  const recommendationSelectionSource = await readFile("src/app/features/smart-shopping/recommendation/RecommendationSelectionView.tsx", "utf8");
  const dummyNaverListSource = await readFile("src/app/features/smart-shopping/recommendation/NaverLowestPriceList.tsx", "utf8");
  assert.ok(naverClientSource.includes("/api/naver-shopping?query=") && !naverClientSource.includes("openapi.naver.com"), "브라우저는 같은 출처 네이버 프록시만 호출");
  assert.ok(!recommendationSelectionSource.includes("fetchNaverShoppingProducts") && !recommendationSelectionSource.includes("/api/naver-shopping") && !recommendationSelectionSource.includes("/api/shopping/search") && !recommendationSelectionSource.includes("openapi.naver.com"), "추천 화면은 네이버 네트워크 요청을 만들지 않음");
  assert.ok(dummyNaverListSource.includes("NAVER 검색어 기반 DUMMY 상품 리스트") && dummyNaverListSource.includes("인기 상품순 TOP 5") && dummyNaverListSource.includes("내부 데이터를 활용한 더미 인기 상품 목록이며, 실제 네이버 쇼핑 인기 순위가 아닙니다."), "더미 NAVER 패널의 고지 문구");
  assert.ok(!dummyNaverListSource.includes("낮은 가격순 TOP 10") && !dummyNaverListSource.includes("다시 시도") && !dummyNaverListSource.includes("auth-error") && !dummyNaverListSource.includes("Scope Status Invalid"), "이전 네이버 가격·인증 오류 UI 제거");
  const { selectDummyNaverProducts, createDummyCatalogRecommendation } = await load("/src/app/features/smart-shopping/recommendation/selectDummyNaverProducts.ts");
  const dummyCatalog = Array.from({ length: 7 }, (_, index) => ({ ...TV_PRODUCTS[0], id: `dummy-tv-${index}`, modelNumber: `DUMMY-TV-${index}`, dataStatus: index === 2 ? "discontinued" : "mock" }));
  const leftDummyRecommendation = { ...tvResult.recommendations[0], product: dummyCatalog[0] };
  const dummyItems = selectDummyNaverProducts([...dummyCatalog, AIR_CONDITIONER_PRODUCTS[0]], "tv", [leftDummyRecommendation]);
  assert.deepEqual(dummyItems.map(({ id }) => id), ["dummy-tv-1", "dummy-tv-3", "dummy-tv-4", "dummy-tv-5", "dummy-tv-6"], "더미 목록은 활성 카테고리의 카탈로그 순서를 유지하며 왼쪽·판매중단 상품을 제외한 TOP 5");
  assert.ok(dummyItems.every((item) => item.categoryId === "tv" && item.dataStatus !== "discontinued" && item.id !== leftDummyRecommendation.product.id), "더미 목록은 다른 카테고리·왼쪽 목록·판매중단 상품을 포함하지 않음");
  assert.deepEqual(selectDummyNaverProducts([...dummyCatalog, AIR_CONDITIONER_PRODUCTS[0]], "tv", [leftDummyRecommendation]).map(({ id }) => id), dummyItems.map(({ id }) => id), "더미 목록은 재렌더링에도 결정적");
  assert.deepEqual(selectDummyNaverProducts(dummyCatalog.slice(0, 3), "tv", [leftDummyRecommendation]).map(({ id }) => id), ["dummy-tv-1"], "다섯 개 미만은 중복 없이 모두 표시");
  assert.deepEqual(selectDummyNaverProducts(dummyCatalog, "tv", dummyCatalog.filter((product) => product.dataStatus !== "discontinued").map((product) => ({ ...leftDummyRecommendation, product }))), [], "남은 상품이 없으면 자연스러운 빈 목록");
  assert.equal(createDummyCatalogRecommendation(dummyItems[0]).product.id, "dummy-tv-1", "더미 카드 선택은 같은 내부 상품 identity를 사용");

  const { getRecommendedCapacityRange } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/criteria.ts");
  assert.equal(getRecommendedCapacityRange(2).label, "500~600L", "2인 기본 용량 추천");
  assert.equal(getRecommendedCapacityRange(4).label, "600~800L", "3~4인 기본 용량 추천");

  const vacuumState = runtime.createInitialFlowState(vacuumFlowModule);
  const detailedConversationState = runtime.appendSupplementalFlowMessage(vacuumState, { sender: "user", text: "싸게 구매하는 법 TIP", type: "text" });
  const detailedConversationReply = runtime.appendSupplementalFlowMessage(detailedConversationState, { sender: "ai", text: "제공된 정보만 기준으로 안내해요.", type: "text" });
  assert.equal(detailedConversationReply.supplementalMessages.length, 2, "상세 후속 대화도 기존 ChatFlowMessage 형식 사용");

  const { VACUUM_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/vacuum/products.ts");
  const { rankVacuums, getIndependentSuctionScores } = await load("/src/app/features/chat-flow/flows/appliances/vacuum/rankProducts.ts");
  const vacuumCriteria = await load("/src/app/features/chat-flow/flows/appliances/vacuum/criteria.ts");
  const vacuumRankerSource = await readFile("src/app/features/chat-flow/flows/appliances/vacuum/rankProducts.ts", "utf8");
  assert.ok(!/product\.(strengths|aiReviewSummary)|autoEmptyStation/.test(vacuumRankerSource), "자유 형식 리뷰·장점과 존재하지 않는 자동 비움 필드를 필터·점수에 사용하지 않음");
  const vacuumBase = { "vacuum.primaryUse": "balanced", "vacuum.powerType": "any", "vacuum.floorEnvironment": "mixed", "vacuum.weightImportance": "somewhat", "vacuum.valuePriority": "balanced", "vacuum.budget": "none" };
  const awResult = rankVacuums(VACUUM_PRODUCTS, vacuumBase);
  assert.equal(awResult.recommendations.length, VACUUM_PRODUCTS.length, "흡입력·배터리·필터·롤러·거치대·무게·보증은 하드 필터가 아님");
  assert.ok(rankVacuums(VACUUM_PRODUCTS, { ...vacuumBase, "vacuum.powerType": "wireless-value" }).recommendations.every(({ product }) => product.specs.powerType === "wireless-value"), "명시한 무선만 동력 방식 하드 필터");
  assert.deepEqual(rankVacuums(VACUUM_PRODUCTS, { ...vacuumBase, "vacuum.powerType": "wired-major" }).recommendations.map(({ product }) => product.id), ["vc-cord-pro"], "명시한 유선만 동력 방식 하드 필터");
  assert.equal(rankVacuums(VACUUM_PRODUCTS, { ...vacuumBase, "vacuum.powerType": "any" }).recommendations.length, VACUUM_PRODUCTS.length, "동력 방식 상관없음은 타입으로 필터하지 않음");

  const vacuumProductBase = VACUUM_PRODUCTS.find(({ id }) => id === "vc-air-220");
  const awLow = { ...vacuumProductBase, id: "vc-aw-low", modelNumber: "VC-AW-LOW", specs: { ...vacuumProductBase.specs, suctionAw: 100, suctionPa: undefined } };
  const awHigh = { ...vacuumProductBase, id: "vc-aw-high", modelNumber: "VC-AW-HIGH", specs: { ...vacuumProductBase.specs, suctionAw: 200, suctionPa: undefined } };
  const paLow = { ...vacuumProductBase, id: "vc-pa-low", modelNumber: "VC-PA-LOW", specs: { ...vacuumProductBase.specs, suctionAw: undefined, suctionPa: 10_000 } };
  const paHigh = { ...vacuumProductBase, id: "vc-pa-high", modelNumber: "VC-PA-HIGH", specs: { ...vacuumProductBase.specs, suctionAw: undefined, suctionPa: 20_000 } };
  const independentSuctionScores = getIndependentSuctionScores([awLow, awHigh, paLow, paHigh]);
  assert.deepEqual([independentSuctionScores.get("vc-aw-low"), independentSuctionScores.get("vc-aw-high")], [0, 1], "AW 제품은 AW 그룹 안에서만 정규화");
  assert.deepEqual([independentSuctionScores.get("vc-pa-low"), independentSuctionScores.get("vc-pa-high")], [0, 1], "Pa 제품은 Pa 그룹 안에서만 정규화");
  assert.equal(independentSuctionScores.get("vc-aw-high"), independentSuctionScores.get("vc-pa-high"), "단위별 평가 뒤 비교 가능한 점수로만 결합하고 AW·Pa 수치는 환산하지 않음");

  const weights = vacuumCriteria.getVacuumRankingWeights;
  const weightFor = (overrides) => weights({ ...vacuumBase, ...overrides });
  assert.ok(weightFor({ "vacuum.primaryUse": "short-daily" }).weight > weightFor({ "vacuum.primaryUse": "balanced" }).weight && weightFor({ "vacuum.primaryUse": "short-daily" }).standingDock > weightFor({ "vacuum.primaryUse": "balanced" }).standingDock, "짧은 일상 청소는 낮은 무게와 충전·보관 편의 비중 상승");
  assert.ok(weightFor({ "vacuum.primaryUse": "whole-home" }).suction > weightFor({ "vacuum.primaryUse": "balanced" }).suction && weightFor({ "vacuum.primaryUse": "whole-home" }).replaceableBattery > weightFor({ "vacuum.primaryUse": "balanced" }).replaceableBattery, "집 전체 청소는 흡입력과 교체형 배터리 비중 상승");
  assert.ok(weightFor({ "vacuum.primaryUse": "dust-hair" }).suction > weightFor({ "vacuum.primaryUse": "balanced" }).suction && weightFor({ "vacuum.primaryUse": "dust-hair" }).softRoller > weightFor({ "vacuum.primaryUse": "balanced" }).softRoller, "먼지·머리카락 청소는 흡입력과 소프트 롤러 비중 상승");
  assert.ok(weightFor({ "vacuum.primaryUse": "allergy" }).filtration > weightFor({ "vacuum.primaryUse": "balanced" }).filtration, "알레르기 관리는 확인된 필터 등급 비중 상승");
  assert.ok(weightFor({ "vacuum.floorEnvironment": "hard-floor" }).softRoller > weightFor({ "vacuum.floorEnvironment": "mixed" }).softRoller && weightFor({ "vacuum.floorEnvironment": "carpet-rug" }).suction > weightFor({ "vacuum.floorEnvironment": "mixed" }).suction, "바닥 환경은 마루 롤러 또는 같은 단위 흡입력 비중에 반영");
  assert.ok(weightFor({ "vacuum.weightImportance": "very" }).weight > weightFor({ "vacuum.weightImportance": "somewhat" }).weight && weightFor({ "vacuum.weightImportance": "none" }).weight === 0, "무게 중요도에 따라 본체 무게 비중을 강함·중간·없음으로 조정");
  assert.ok(weightFor({ "vacuum.valuePriority": "low-purchase-price" }).currentPrice > weightFor({ "vacuum.valuePriority": "balanced" }).currentPrice && weightFor({ "vacuum.valuePriority": "good-current-price" }).marketPrice > weightFor({ "vacuum.valuePriority": "balanced" }).marketPrice && weightFor({ "vacuum.valuePriority": "strong-suction" }).suction > weightFor({ "vacuum.valuePriority": "balanced" }).suction, "가성비 기준별 현재가·가격 이력·흡입력 비중 변화");

  const vacuumOneYearWarrantyResult = rankVacuums([VACUUM_PRODUCTS.find(({ id }) => id === "vc-pa-30000")], vacuumBase);
  assert.equal(vacuumOneYearWarrantyResult.recommendations.length, 1, "1년 보증도 정상 추천 후보이며 탈락 조건이 아님");
  assert.equal(rankVacuums([vacuumProductBase], { ...vacuumBase, "vacuum.budget": 100_000 }).recommendations.length, 0, "청소기 예산은 currentPrice 상한 필터로만 적용");
  assert.equal(rankVacuums([{ ...vacuumProductBase, dataStatus: "discontinued" }], vacuumBase).recommendations.length, 0, "판매 중단 상품 제외");
  assert.equal(rankVacuums([{ ...vacuumProductBase, id: "vc-unverified", dataStatus: "unverified" }, { ...vacuumProductBase, id: "vc-stale", dataStatus: "stale" }], vacuumBase).recommendations.length, 2, "unverified와 stale 청소기는 추천 후보 유지");

  const missingVacuumData = { ...vacuumProductBase, id: "vc-missing-data", modelNumber: "VC-MISSING", priceHistory: [], specs: { ...vacuumProductBase.specs, suctionAw: undefined, suctionPa: undefined, hepaGrade: undefined, bodyWeightKg: undefined } };
  const missingVacuumRecommendation = rankVacuums([missingVacuumData], vacuumBase).recommendations[0];
  assert.ok(missingVacuumRecommendation.unmatchedOrUnknownCriteria.includes("흡입력 정보 없음") && missingVacuumRecommendation.unmatchedOrUnknownCriteria.includes("필터 등급 정보 없음") && missingVacuumRecommendation.unmatchedOrUnknownCriteria.includes("가격 이력 없음"), "누락된 흡입력·필터·가격 이력을 사실대로 표시");
  assert.ok(missingVacuumRecommendation.recommendationReasons.every((reason) => !/고성능 필터|역대 최저가/.test(reason)), "누락된 필터나 가격 이력에 가짜 값·이유를 만들지 않음");

  const favorableVacuumHistory = { ...vacuumProductBase, id: "vc-history-good", modelNumber: "VC-HISTORY-GOOD", currentPrice: 500_000, priceHistory: [{ date: "2026-06-01", lowestPrice: 480_000 }, { date: "2026-07-01", lowestPrice: 540_000 }] };
  const unfavorableVacuumHistory = { ...vacuumProductBase, id: "vc-history-bad", modelNumber: "VC-HISTORY-BAD", currentPrice: 500_000, priceHistory: [{ date: "2026-06-01", lowestPrice: 200_000 }, { date: "2026-07-01", lowestPrice: 300_000 }] };
  assert.deepEqual(rankVacuums([unfavorableVacuumHistory, favorableVacuumHistory], { ...vacuumBase, "vacuum.valuePriority": "good-current-price" }).recommendations.map(({ product }) => product.id), ["vc-history-good", "vc-history-bad"], "유효한 저장 가격 이력의 현재가 위치를 순위에 반영");
  const structuredVacuumReasons = rankVacuums([vacuumProductBase], { ...vacuumBase, "vacuum.floorEnvironment": "carpet-rug" }).recommendations[0].recommendationReasonItems;
  assert.ok(["사용 방식", "흡입 성능", "무게와 이동 편의", "필터 관리", "현재 가격"].every((label) => structuredVacuumReasons.some((item) => item.label === label)), "실제로 적용한 청소기 점수 요소만 자연스러운 구조화 이유로 설명");
  assert.ok(structuredVacuumReasons.some(({ description }) => description.includes("전용 브러시 성능을 의미하지 않아요")), "흡입력만으로 카펫 전용 성능을 주장하지 않음");

  const { summarizePriceHistory, summarizeStoredPriceHistory, getValidPriceHistory } = await load("/src/app/features/product-catalog/core/priceHistory.ts");
  const metricHistory = [{ date: "2026-07-13", lowestPrice: 140 }, { date: "2026-05-01", lowestPrice: 100 }];
  assert.deepEqual(summarizePriceHistory(120, metricHistory), { allTimeLow: 100, averagePrice: 120, differenceFromLow: 20, percentAboveLow: 20 }, "가격 이력 계산");
  assert.deepEqual(summarizeStoredPriceHistory(1_200, [{ date: "2026-01-01", lowestPrice: 800 }, { date: "2026-02-01", lowestPrice: 1_000 }]), { allTimeLow: 800, averagePrice: 900, differenceFromLow: 400, percentAboveLow: 50 }, "현재가·최저가·평균가·차액·비율 정확성");
  assert.equal(summarizeStoredPriceHistory(1_200, []), null, "빈 가격 이력은 역사 지표를 만들지 않음");
  assert.deepEqual(getValidPriceHistory(metricHistory).map(({ date }) => date), ["2026-05-01", "2026-07-13"], "저장 날짜 기준 오름차순 정렬");

  const { default: PriceHistoryChart, buildPriceHistoryChartPoints, formatPriceHistoryAxisDate, getDefaultPriceHistoryPoint, getPriceBubblePlacement, getPriceHistoryAxisLabelIndexes, resolvePriceHistoryDisplayIndex, PRICE_HISTORY_CHART_LAYOUT } = await load("/src/app/features/smart-shopping/product-detail/PriceHistoryChart.tsx");
  const storedChartHistory = [
    { date: "2026-07-13", lowestPrice: 970_600 },
    { date: "2026-05-01", lowestPrice: 1_080_000 },
    { date: "2026-06-25", lowestPrice: 970_000 },
  ];
  const chartPoints = buildPriceHistoryChartPoints(storedChartHistory);
  assert.deepEqual(chartPoints.map(({ date, lowestPrice }) => ({ date, lowestPrice })), [
    { date: "2026-05-01", lowestPrice: 1_080_000 },
    { date: "2026-06-25", lowestPrice: 970_000 },
    { date: "2026-07-13", lowestPrice: 970_600 },
  ], "실제 저장 날짜와 lowestPrice가 모두 차트 점으로 전달");
  assert.equal(buildPriceHistoryChartPoints([{ date: "2026-07-13", lowestPrice: 970_600 }]).length, 1, "한 점 가격 이력 안전 처리");
  assert.equal(buildPriceHistoryChartPoints([]).length, 0, "빈 가격 이력 안전 처리");
  assert.deepEqual(getDefaultPriceHistoryPoint([
    { date: "2026-07-15", lowestPrice: 950_000 },
    { date: "2026-07-05", lowestPrice: 980_000 },
    { date: "2026-07-09", lowestPrice: 970_000 },
  ]), { date: "2026-07-15", lowestPrice: 950_000 }, "배열 순서나 오늘 날짜가 아니라 역사적 최저가를 기본 강조");
  assert.deepEqual(getDefaultPriceHistoryPoint([
    { date: "2026-05-05", lowestPrice: 950_000 },
    { date: "2026-07-15", lowestPrice: 950_000 },
    { date: "2026-06-16", lowestPrice: 970_000 },
  ]), { date: "2026-07-15", lowestPrice: 950_000 }, "동일 역사적 최저가는 가장 최근 저장 날짜를 기본 강조");
  assert.equal(formatPriceHistoryAxisDate("2026-07-15"), "7.15.", "X축 날짜는 연도 없는 M.D. 형식");
  assert.equal(resolvePriceHistoryDisplayIndex(1, 0, null), 0, "hover 강조가 역사적 최저가 강조보다 일시 우선");
  assert.equal(resolvePriceHistoryDisplayIndex(1, null, 2), 2, "키보드 focus 강조가 역사적 최저가 강조보다 일시 우선");
  assert.equal(resolvePriceHistoryDisplayIndex(1, null, null), 1, "hover/focus 종료 시 역사적 최저가 강조 복원");
  assert.ok(PRICE_HISTORY_CHART_LAYOUT.axisY - PRICE_HISTORY_CHART_LAYOUT.plotBaselineY >= 48, "최저점과 X축 기준선 사이에 확대된 내부 거리 확보");
  assert.ok(PRICE_HISTORY_CHART_LAYOUT.axisLabelY > PRICE_HISTORY_CHART_LAYOUT.axisY, "날짜 라벨은 분리된 X축 기준선 아래에 배치");
  const centeredPlacement = getPriceBubblePlacement([{ date: "2026-01-15", lowestPrice: 100, x: 320, y: PRICE_HISTORY_CHART_LAYOUT.plotBaselineY }], 0);
  const leftEdgePlacement = getPriceBubblePlacement([{ date: "2026-01-01", lowestPrice: 100, x: 42, y: PRICE_HISTORY_CHART_LAYOUT.plotBaselineY }], 0);
  const rightEdgePlacement = getPriceBubblePlacement([{ date: "2026-01-01", lowestPrice: 110, x: 42, y: 120 }, { date: "2026-02-01", lowestPrice: 100, x: 616, y: PRICE_HISTORY_CHART_LAYOUT.plotBaselineY }], 1);
  assert.equal(centeredPlacement.placement, "above", "일반 최저가 버블은 점 바로 위에 배치");
  assert.equal(centeredPlacement.x + centeredPlacement.width / 2, 320, "일반 최저가 버블 중심은 점의 X 좌표와 일치");
  assert.equal(centeredPlacement.anchorX, 320, "일반 최저가 버블 포인터도 점과 수직 정렬");
  assert.equal(leftEdgePlacement.placement, "above-clamped-left", "왼쪽 가장자리에서만 버블을 안쪽으로 clamp");
  assert.equal(rightEdgePlacement.placement, "above-clamped-right", "오른쪽 가장자리에서만 버블을 안쪽으로 clamp");
  for (const placement of [leftEdgePlacement, rightEdgePlacement]) assert.ok(placement.x >= 8 && placement.x + placement.width <= PRICE_HISTORY_CHART_LAYOUT.width - 8, "가격 버블은 chart viewBox 안으로 clamp");
  assert.ok(leftEdgePlacement.y + leftEdgePlacement.height < PRICE_HISTORY_CHART_LAYOUT.plotBaselineY - 12 && leftEdgePlacement.y + leftEdgePlacement.height < PRICE_HISTORY_CHART_LAYOUT.axisY, "가격 버블은 선택점 halo와 X축 영역을 덮지 않음");
  const denseAxisPoints = buildPriceHistoryChartPoints(Array.from({ length: 12 }, (_, index) => ({ date: `2026-${String(index + 1).padStart(2, "0")}-05`, lowestPrice: 1_000_000 - index * 1_000 })));
  const denseLabelIndexes = getPriceHistoryAxisLabelIndexes(denseAxisPoints);
  assert.ok(denseLabelIndexes.size < denseAxisPoints.length && denseLabelIndexes.has(0) && denseLabelIndexes.has(denseAxisPoints.length - 1), "겹치는 축 라벨만 건너뛰고 첫·마지막 라벨은 유지");
  const emptyChartMarkup = renderToStaticMarkup(React.createElement(PriceHistoryChart, { productId: "empty-product", history: [] }));
  const singleChartMarkup = renderToStaticMarkup(React.createElement(PriceHistoryChart, { productId: "single-product", history: [{ date: "2026-07-13", lowestPrice: 970_600 }] }));
  const manyChartMarkup = renderToStaticMarkup(React.createElement(PriceHistoryChart, { productId: "many-product", history: storedChartHistory }));
  assert.ok(emptyChartMarkup.includes("저장된 가격 이력이 없습니다."), "빈 차트의 진실한 empty state");
  assert.equal((singleChartMarkup.match(/data-price-point="true"/g) ?? []).length, 1, "한 점 차트는 가상 점을 추가하지 않음");
  assert.ok(singleChartMarkup.includes("2026-07-13 970,600원"), "한 점에도 정확한 날짜·가격 접근성 정보");
  assert.equal((manyChartMarkup.match(/data-price-point="true"/g) ?? []).length, storedChartHistory.length, "축 라벨 간격과 무관하게 저장된 모든 점 유지");
  assert.ok(manyChartMarkup.includes("data-price-area=\"true\"") && manyChartMarkup.includes("opacity=\"0.12\"") && manyChartMarkup.includes(`data-area-baseline=\"${PRICE_HISTORY_CHART_LAYOUT.axisY}\"`), "영역 채움은 가격선에서 X축 기준선까지 이어짐");
  assert.ok(!manyChartMarkup.includes("data-price-plot-baseline") && manyChartMarkup.includes("data-price-axis-baseline=\"true\""), "별도 높은 면적 기준선 없이 실제 X축 기준선을 사용");
  assert.ok(manyChartMarkup.indexOf("data-price-chart-svg") < manyChartMarkup.indexOf("data-price-area") && manyChartMarkup.indexOf("data-price-area") < manyChartMarkup.indexOf("data-price-axis-baseline") && manyChartMarkup.indexOf("data-price-axis-baseline") < manyChartMarkup.lastIndexOf("</svg>"), "선·면적·X축·라벨은 하나의 chart SVG 안에 유지");
  assert.ok(manyChartMarkup.includes("data-price-point-bubble=\"true\"") && manyChartMarkup.includes("data-default-price-label=\"true\"") && manyChartMarkup.includes("970,000원") && manyChartMarkup.includes("data-historical-lowest=\"true\"") && manyChartMarkup.includes("data-price-highlight-halo=\"true\""), "호버 전에도 최저가 점에 연결된 speech bubble과 halo 표시");
  assert.ok(manyChartMarkup.includes("data-price-bubble-pointer=\"true\"") && manyChartMarkup.includes("data-bubble-pointer-x") && manyChartMarkup.includes("data-pointer-tip-x"), "가격 버블 포인터는 선택점 좌표로 직접 연결");
  assert.ok(!manyChartMarkup.includes("absolute") && !manyChartMarkup.includes("top-right"), "지속 가격은 차트 모서리 요약이 아니라 SVG 점 연결 버블로 렌더링");
  assert.ok(manyChartMarkup.includes(">5.1.<") && manyChartMarkup.includes(">7.13.<") && !manyChartMarkup.match(/<text[^>]*>2026-/), "X축은 첫·마지막 M.D. 라벨을 사용하고 연도를 숨김");

  const { PRODUCT_DETAIL_ACTIONS } = await load("/src/app/features/smart-shopping/actions/productDetailActions.ts");
  assert.deepEqual(PRODUCT_DETAIL_ACTIONS.map((item) => item.label), ["예상 세일 달 제안", "다른 제품 추천", "싸게 구매하는 법 TIP", "기타·직접 질문 입력", "목록 다시 보기", "다음 단계로"], "상세 하단 액션 순서와 표시 문구");
  const { default: ProductDetailActionBar } = await load("/src/app/features/smart-shopping/product-detail/ProductDetailActionBar.tsx");
  const productActionMarkup = renderToStaticMarkup(React.createElement(ProductDetailActionBar, { showAlternative: true, isQuestionLoading: false, onAction: () => {}, onBack: () => {}, onNext: () => {} }));
  const productActionWithoutPriceSignalMarkup = renderToStaticMarkup(React.createElement(ProductDetailActionBar, { showAlternative: false, isQuestionLoading: false, onAction: () => {}, onBack: () => {}, onNext: () => {} }));
  const ordinaryActionMarkup = productActionMarkup.match(/data-product-action-group="ordinary"[^>]*>(.*?)<\/div>/)?.[1] ?? "";
  assert.equal((ordinaryActionMarkup.match(/<button/g) ?? []).length, 5, "다섯 일반 액션은 하나의 왼쪽 그룹");
  assert.ok(productActionWithoutPriceSignalMarkup.includes("다른 제품 추천"), "다른 제품 추천은 가격 이력 상태와 무관하게 공용 툴바에 유지");
  assert.ok(ordinaryActionMarkup.includes("목록 다시 보기") && ordinaryActionMarkup.includes("text-primary") && !ordinaryActionMarkup.includes("text-muted-foreground"), "목록 다시 보기는 다른 일반 액션과 동일한 활성 스타일");
  assert.ok(productActionMarkup.indexOf('data-product-action-group="ordinary"') < productActionMarkup.indexOf('data-product-progress-action="true"') && productActionMarkup.includes("flex-1"), "일반 그룹이 남는 공간을 사용하고 진행 액션은 맨 오른쪽 독립 요소로 렌더링");
  const detailViewSource = await readFile("src/app/features/smart-shopping/recommendation/ProductDetailView.tsx", "utf8");
  const detailSectionsSource = await readFile("src/app/features/smart-shopping/product-detail/ProductDetailDataSections.tsx", "utf8");
  const priceChartSource = await readFile("src/app/features/smart-shopping/product-detail/PriceHistoryChart.tsx", "utf8");
  const recommendationCardSource = await readFile("src/app/components/features/chat/ProductRecommendationCard.tsx", "utf8");
  assert.ok(!detailViewSource.includes("ArrowLeft") && !detailViewSource.includes("BackButton"), "상세 최상단 목록 복귀 버튼 제거");
  assert.ok(!detailViewSource.includes("MOCK DATA") && !detailViewSource.includes("REAL DATA") && !recommendationCardSource.includes("MOCK DATA") && !recommendationCardSource.includes("REAL DATA") && !detailViewSource.includes("모잇 DB 모델 매칭"), "상품 상세 데이터 출처 배지 제거");
  assert.ok(detailSectionsSource.includes(">AI 리뷰 요약<") && !detailSectionsSource.includes("더미 AI 리뷰 요약"), "상세 섹션 제목은 정확히 AI 리뷰 요약");
  assert.ok(!detailSectionsSource.includes("주의점") && !detailViewSource.includes("주의점") && !recommendationCardSource.includes("주의점"), "모든 상세에서 주의점 카드 제거");
  assert.ok(detailSectionsSource.indexOf("<PriceHistoryChart") < detailSectionsSource.indexOf("data-strengths-card") && detailSectionsSource.indexOf("data-strengths-card") < detailSectionsSource.indexOf("data-price-summary"), "반응형 DOM 순서는 차트·장점·가격 요약");
  assert.ok(detailSectionsSource.includes("data-detail-lower-grid") && detailSectionsSource.includes("md:row-span-2") && detailSectionsSource.includes("data-detail-right-top") && detailSectionsSource.includes("data-detail-right-bottom"), "데스크톱에서 차트는 왼쪽 두 행, 장점과 통합 가격 요약은 오른쪽 상·하단");
  assert.ok(detailSectionsSource.includes("data-price-summary-grid") && detailSectionsSource.includes("grid-cols-[minmax(0,1fr)_minmax(8.5rem,auto)]") && !detailSectionsSource.includes("<PriceMetric"), "가격 요약은 두 정렬 열을 가진 하나의 통합 패널");
  assert.ok(!detailSectionsSource.includes("평균가") && (detailSectionsSource.match(/<PriceSummaryRow/g) ?? []).length === 3, "가격 요약은 현재가·역대 최저가·최저가 대비 세 행만 렌더링");
  assert.ok(detailSectionsSource.includes('label="최저가 대비"') && detailSectionsSource.includes("text-red-600 dark:text-red-400") && detailSectionsSource.includes("text-right"), "최저가 대비 라벨·값은 빨간색이고 두 열은 오른쪽 정렬");
  assert.equal((detailSectionsSource.match(/<PriceHistoryChart/g) ?? []).length, 1, "상세의 가격 그래프는 한 번만 렌더링");
  assert.ok(priceChartSource.includes('"tooltip"') && priceChartSource.includes("point.date") && priceChartSource.includes("won(point.lowestPrice)") && priceChartSource.includes("onMouseEnter") && priceChartSource.includes("onFocus"), "호버·키보드 포커스 tooltip의 정확한 전체 날짜·원화 가격");
  assert.ok(priceChartSource.includes("setHoveredIndex(index)") && priceChartSource.includes("setFocusedIndex(index)") && priceChartSource.includes("onMouseLeave={() => setHoveredIndex(null)}") && priceChartSource.includes("onBlur={() => setFocusedIndex(null)"), "hover/focus가 일시 강조를 우선하고 각각 종료 시 기본 강조로 복귀");
  assert.ok(priceChartSource.includes("points.map") && priceChartSource.includes("getPriceHistoryAxisLabelIndexes") && priceChartSource.includes("getPriceBubblePlacement") && priceChartSource.includes('key={`${productId}|${pointIdentity}`}') && priceChartSource.includes("text-sm\">{formatPriceHistoryAxisDate"), "모든 점 유지·축 라벨 간격·충돌 대응 버블·상품별 상태 초기화·표준 UI 날짜 크기");
  const { rankRefrigerators: rankRepresentativeRefrigerators } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/rankProducts.ts");
  const { default: ProductRecommendationCard } = await load("/src/app/components/features/chat/ProductRecommendationCard.tsx");
  const { default: ProductDetailView } = await load("/src/app/features/smart-shopping/recommendation/ProductDetailView.tsx");
  const detailRecommendation = (product) => ({ product, score: 90, matchedCoreCriteria: ["대표 조건 충족"], unmatchedOrUnknownCriteria: [], recommendationReasons: ["테스트 추천 이유"], preferenceMatchCount: 1, dataCompleteness: 100 });
  const representativeDetailProducts = [AIR_CONDITIONER_PRODUCTS[0], TV_PRODUCTS[0], REFRIGERATOR_PRODUCTS[0], VACUUM_PRODUCTS[0]];
  for (const product of representativeDetailProducts) {
    const markup = renderToStaticMarkup(React.createElement(ProductRecommendationCard, { recommendation: detailRecommendation(product) }));
    assert.ok(markup.includes("AI 리뷰 요약") && markup.includes(product.aiReviewSummary), `${product.categoryId} 저장 aiReviewSummary 렌더링`);
    assert.ok(!markup.includes("MOCK DATA") && !markup.includes("REAL DATA") && !markup.includes("주의점"), `${product.categoryId} 상세 출처 배지·주의점 없음`);
    assert.ok(markup.indexOf('data-price-history-card="true"') < markup.indexOf('data-strengths-card="true"') && markup.indexOf('data-strengths-card="true"') < markup.indexOf('data-price-summary="true"'), `${product.categoryId} 차트·장점·가격 요약 공용 그리드 순서`);
    assert.equal((markup.match(/data-price-summary-label=/g) ?? []).length, 3, `${product.categoryId} 통합 가격 요약은 세 행`);
    assert.ok(!markup.includes("평균가") && markup.includes('data-price-summary-label="현재가"') && markup.includes('data-price-summary-label="역대 최저가"') && markup.includes('data-price-summary-label="최저가 대비"'), `${product.categoryId} 평균가 없이 요청된 세 지표만 표시`);
    assert.equal((markup.match(/역대 최저가 추이/g) ?? []).length, 1, `${product.categoryId} 상세 그래프 중복 없음`);
    assert.ok(!/two-in-one|four-door-value|two-door|4k-uhd|full-hd|wireless-value|wired-major/.test(markup), `${product.categoryId} 상세 스펙에 raw enum 미노출`);
  }
  const refrigeratorReasonResult = rankRepresentativeRefrigerators(REFRIGERATOR_PRODUCTS, { ...refrigeratorAnswers, "refrigerator.budget": 10_000_000 });
  const structuredReasonRecommendations = [airFlowState.result.recommendations[0], tvResult.recommendations[0], refrigeratorReasonResult.recommendations[0], awResult.recommendations[0]];
  for (const recommendation of structuredReasonRecommendations) {
    assert.ok(recommendation.recommendationReasonItems?.length >= 3, `${recommendation.product.categoryId} 실제 적용 이유를 구조화해 저장`);
    const reasonMarkup = renderToStaticMarkup(React.createElement(ProductRecommendationCard, { recommendation }));
    assert.ok(reasonMarkup.includes("추천 이유") && (reasonMarkup.match(/data-recommendation-reason-item/g) ?? []).length === recommendation.recommendationReasonItems.length, `${recommendation.product.categoryId} 이유를 별도 항목으로 렌더링`);
    assert.ok(!reasonMarkup.includes("추천 이유:") && !/two-in-one|under4|4to8|over8|maintenance|balanced|airConditioner\./.test(recommendation.recommendationReasonItems.map(({ label, description }) => `${label} ${description}`).join("\n")), `${recommendation.product.categoryId} 긴 inline 문장·raw 조건값 미노출`);
  }
  assert.equal(emptyHistoryResult.recommendations[0].recommendationReasonItems.some(({ label }) => label === "현재 가격"), false, "유효 가격 이력이 없으면 역사 가격 이유 항목 생략");
  const recommendationReasonListSource = await readFile("src/app/features/smart-shopping/recommendation/RecommendationReasonList.tsx", "utf8");
  assert.ok(recommendationReasonListSource.includes("data-recommendation-reason-item") && recommendationReasonListSource.includes("font-semibold") && recommendationReasonListSource.includes("font-normal leading-relaxed"), "공용 추천 이유 라벨·보통 굵기 설명·읽기 쉬운 행간");
  const airDetailMarkup = renderToStaticMarkup(React.createElement(ProductRecommendationCard, { recommendation: detailRecommendation(AIR_CONDITIONER_PRODUCTS[0]) }));
  const tvDetailMarkup = renderToStaticMarkup(React.createElement(ProductRecommendationCard, { recommendation: detailRecommendation(TV_PRODUCTS[0]) }));
  assert.ok(airDetailMarkup.includes("구매 전 확인") && airDetailMarkup.includes("설치비 확인 필요"), "에어컨 상세의 공통 구매 전 설치비 알림");
  assert.ok(!tvDetailMarkup.includes("설치비 확인 필요") && tvDetailMarkup.includes("미충족·확인 필요"), "다른 상품군에는 에어컨 설치비 알림 미적용");
  const unmatchedNaverAirMarkup = renderToStaticMarkup(React.createElement(ProductDetailView, { categoryId: "air-conditioner", selected: { source: "naver", product: naverItems[1] }, internalRecommendations: [], interactive: false }));
  assert.ok(unmatchedNaverAirMarkup.includes("구매 전 확인") && unmatchedNaverAirMarkup.includes("설치비 확인 필요"), "내부 매칭 없는 네이버 에어컨 상세도 공통 설치비 알림");
  const diagnosisResultSource = await readFile("src/app/components/features/chat/DiagnosisResultCard.tsx", "utf8");
  const chatScreenSource = await readFile("src/app/components/features/chat/ChatScreen.tsx", "utf8");
  const chatMessageSource = await readFile("src/app/components/features/chat/ChatMessage.tsx", "utf8");
  const chatTimelineRowSource = await readFile("src/app/components/features/chat/ChatTimelineRow.tsx", "utf8");
  const smartShoppingTimelineSource = await readFile("src/app/features/smart-shopping/timeline/SmartShoppingTimeline.tsx", "utf8");
  const chatFlowInputSource = await readFile("src/app/components/features/chat/ChatFlowInput.tsx", "utf8");
  const chatConversationTurnSource = await readFile("src/app/components/features/chat/ChatConversationTurn.tsx", "utf8");
  const recommendationViewSource = await readFile("src/app/features/smart-shopping/recommendation/RecommendationSelectionView.tsx", "utf8");
  const { ChatScreenSmartShoppingTimeline, getProductSelectionScrollPosition, scrollContainerToProductSelectionAnchor, shouldCorrectRecommendationStartScroll, PRODUCT_SELECTION_SCROLL_OFFSET } = await load("/src/app/components/features/chat/ChatScreen.tsx");
  const { default: ChatConversationTurn } = await load("/src/app/components/features/chat/ChatConversationTurn.tsx");
  const { default: ChatTimelineRow } = await load("/src/app/components/features/chat/ChatTimelineRow.tsx");
  const assistantRailMarkup = renderToStaticMarkup(React.createElement(ChatTimelineRow, { kind: "assistant" }, React.createElement("span", null, "assistant")));
  const userRailMarkup = renderToStaticMarkup(React.createElement(ChatTimelineRow, { kind: "user" }, React.createElement("span", null, "user")));
  const wideRailMarkup = renderToStaticMarkup(React.createElement(ChatTimelineRow, { kind: "wide" }, React.createElement("span", null, "wide")));
  const alignmentTimeline = [
    { id: "assistant-before", type: "assistant-text", text: "상품을 골라볼게요.", timestamp: "오전 10:00" },
    { id: "user-product", type: "user-action", text: "상품 선택", timestamp: "오전 10:01", metadata: { productSelectionAnchorId: "test-product-selection" } },
    { id: "product-detail", type: "product-detail", snapshot: { categoryId: "tv", selected: { source: "internal", recommendation: tvResult.recommendations[0] }, internalRecommendations: tvResult.recommendations, showAlternative: false } },
    { id: "wide-action", type: "action-group", group: "detail", isActive: false },
    { id: "user-after", type: "user-action", text: "예상 세일 달 제안", timestamp: "오전 10:02" },
    { id: "assistant-after", type: "assistant-text", text: "세일 달 답변", timestamp: "오전 10:03" },
    { id: "wide-action-later", type: "action-group", group: "detail", isActive: false },
    { id: "user-tip", type: "user-action", text: "싸게 구매하는 법 TIP", timestamp: "오전 10:04" },
    { id: "assistant-tip", type: "assistant-text", text: "구매 팁 답변", timestamp: "오전 10:05" },
    { id: "wide-action-tip", type: "action-group", group: "detail", isActive: false },
    { id: "user-alternative", type: "user-action", text: "다른 제품 추천", timestamp: "오전 10:06" },
    { id: "assistant-alternative", type: "assistant-text", text: "대체 상품 답변", timestamp: "오전 10:07" },
    { id: "wide-action-alternative", type: "action-group", group: "detail", isActive: false },
    { id: "user-return", type: "user-action", text: "목록 다시 보기", timestamp: "오전 10:08", metadata: { productSelectionAnchorId: "test-back-to-list" } },
    { id: "assistant-return", type: "assistant-text", text: "목록 복원 답변", timestamp: "오전 10:09" },
    { id: "recommendation-list", type: "recommendation-list", isActive: false, snapshot: { snapshotId: "restored-list", categoryId: "tv", recommendations: tvResult.recommendations, catalogSource: "mock", dummyProducts: [] } },
    { id: "user-question", type: "user-text", text: "직접 질문", timestamp: "오전 10:10" },
    { id: "assistant-question", type: "assistant-text", text: "직접 질문 답변", timestamp: "오전 10:11" },
    { id: "wide-action-question", type: "action-group", group: "detail", isActive: false },
    { id: "user-next", type: "user-action", text: "다음 단계로", timestamp: "오전 10:12" },
    { id: "assistant-next", type: "assistant-text", text: "구매 단계 답변", timestamp: "오전 10:13" },
    { id: "wide-next-action", type: "action-group", group: "next", isActive: false },
  ];
  const timelineRailModel = { timeline: alignmentTimeline, showClosestOverBudget: false, onShowClosestOverBudget: () => {}, questionLoading: false, questionError: "", onSelectRecommendation: () => {}, onSelectDummyProduct: () => {}, onDetailAction: () => {}, onBackToList: () => {}, onNextStep: () => {}, onQuestionSubmit: () => {}, onQuestionRetry: () => {}, onQuestionCancel: () => {}, onNextAction: () => {}, onCancelPurchaseLink: () => {}, onSavePriceAlert: () => {}, onCancelPriceAlert: () => {}, isFavorite: () => false, onToggleFavorite: () => {} };
  const alignedTimelineMarkup = renderToStaticMarkup(React.createElement("div", { "data-chat-timeline-root": true }, React.createElement(ChatConversationTurn, { sender: "ai", text: "초기 조건 질문" }), React.createElement(ChatScreenSmartShoppingTimeline, { model: timelineRailModel })));
  let selectionScrollOptions;
  scrollContainerToProductSelectionAnchor({
    container: { scrollTop: 180, getBoundingClientRect: () => ({ top: 100 }), scrollTo: (options) => { selectionScrollOptions = options; }, scrollHeight: 50_000, clientHeight: 500 },
    anchor: { getBoundingClientRect: () => ({ top: 340 }) },
    behavior: "smooth",
  });
  const recommendationStartAnchorId = getRecommendationStartAnchor(tvFlowState);
  const mountedRecommendationStartCalls = [];
  const recommendationStartTurn = ChatConversationTurn({
    sender: "user",
    text: "추천 시작",
    selectionAnchorId: recommendationStartAnchorId,
    onSelectionAnchorMount: (anchorId, anchor) => {
      mountedRecommendationStartCalls.push(anchorId);
      scrollContainerToProductSelectionAnchor({
        container: { scrollTop: 64, getBoundingClientRect: () => ({ top: 100 }), scrollTo: (options) => { selectionScrollOptions = options; }, scrollHeight: 1_000, clientHeight: 500 },
        anchor,
        behavior: "smooth",
      });
    },
  });
  const recommendationStartRow = ChatTimelineRow(recommendationStartTurn.props);
  recommendationStartRow.ref({ getBoundingClientRect: () => ({ top: 260 }) });
  const initiallyClampedPosition = getProductSelectionScrollPosition({
    container: { scrollTop: 220, scrollHeight: 600, clientHeight: 500, getBoundingClientRect: () => ({ top: 100 }) },
    anchor: { getBoundingClientRect: () => ({ top: 480 }) },
  });
  let correctedRecommendationScrollOptions;
  scrollContainerToProductSelectionAnchor({
    container: { scrollTop: initiallyClampedPosition.targetScrollTop, scrollHeight: 1_100, clientHeight: 500, getBoundingClientRect: () => ({ top: 100 }), scrollTo: (options) => { correctedRecommendationScrollOptions = options; } },
    anchor: { getBoundingClientRect: () => ({ top: 600 }) },
    behavior: "smooth",
  });
  let shortRecommendationScrollOptions;
  scrollContainerToProductSelectionAnchor({
    container: { scrollTop: initiallyClampedPosition.targetScrollTop, scrollHeight: 660, clientHeight: 500, getBoundingClientRect: () => ({ top: 100 }), scrollTo: (options) => { shortRecommendationScrollOptions = options; } },
    anchor: { getBoundingClientRect: () => ({ top: 600 }) },
    behavior: "smooth",
  });
  assert.ok(!diagnosisResultSource.includes("RecommendationSelectionView") && !diagnosisResultSource.includes("result.recommendations"), "스마트쇼핑 렌더 경로를 생활비 결과 컴포넌트에서 제거");
  assert.ok(diagnosisResultSource.includes("PhoneDiagnosisReport") && diagnosisResultSource.includes("InternetDiagnosisReport") && diagnosisResultSource.includes("IptvDiagnosisReport"), "생활비 전용 결과 화면 보존");
  assert.ok(chatScreenSource.includes("buildSmartShoppingGreeting") && chatScreenSource.includes("onCreatePriceAlert") && chatScreenSource.includes("onEndSmartShoppingChat"), "스마트쇼핑 인사·알람·종료 경계 연결");
  assert.ok(chatScreenSource.includes("smartShoppingResult && (") && chatScreenSource.includes("<RecommendationSelectionView") && chatScreenSource.includes("renderTimeline={(model) => <ChatScreenSmartShoppingTimeline model={model} />}") && chatScreenSource.includes("renderedResult && !isSmartShoppingResult") && chatScreenSource.includes('className="w-full self-start pl-11"'), "ChatScreen이 스마트쇼핑 컨트롤러와 outer 타임라인 렌더러를 직접 소유하고 생활비 결과 들여쓰기는 보존");
  assert.ok(chatScreenSource.includes("grid-cols-[minmax(0,1fr)]") && assistantRailMarkup.includes('data-chat-rail-track="shared"') && wideRailMarkup.includes('data-chat-rail-track="shared"'), "대화와 wide 행이 하나의 명시적 minmax(0,1fr) 최상위 트랙을 공유");
  assert.deepEqual(mountedRecommendationStartCalls, [recommendationStartAnchorId], "추천 시작 메시지는 실제 공용 대화 행 ref 마운트에서 앵커 콜백을 한 번 호출");
  assert.equal(recommendationStartRow.props["data-chat-timeline-row"], "user", "추천 시작 앵커는 오른쪽 사용자 대화 행에 부착");
  assert.deepEqual(selectionScrollOptions, { top: 64 + 260 - 100 - PRODUCT_SELECTION_SCROLL_OFFSET, behavior: "smooth" }, "추천 시작도 페이지 끝이 아닌 내부 채팅 컨테이너에서 사용자 행 위치로 스크롤");
  assert.deepEqual(initiallyClampedPosition, { currentScrollTop: 220, desiredScrollTop: 584, targetScrollTop: 100, scrollHeight: 600, clientHeight: 500, maxScrollTop: 100, wasClamped: true }, "추천 시작 즉시 스크롤은 실제 컨테이너 범위를 계산해 처음 클램프 여부를 기록");
  assert.equal(shouldCorrectRecommendationStartScroll({ initialMaxScrollTop: 100, nextMaxScrollTop: 600, isCurrentAnchor: true, userScrolled: false, corrected: false }), true, "추천 결과 컨테이너가 스크롤 범위를 늘리면 같은 추천 시작 앵커만 한 번 보정");
  assert.deepEqual(correctedRecommendationScrollOptions, { top: 584, behavior: "smooth" }, "보정 스크롤은 늘어난 범위 안에서 desiredScrollTop으로 이동");
  assert.deepEqual(shortRecommendationScrollOptions, { top: 160, behavior: "smooth" }, "짧은 추천 목록이 조금만 늘어난 경우에도 보정은 가능한 최대 scrollTop에서 끝냄");
  assert.equal(shouldCorrectRecommendationStartScroll({ initialMaxScrollTop: 100, nextMaxScrollTop: 160, isCurrentAnchor: true, userScrolled: false, corrected: true }), false, "짧은 목록의 최대 위치 보정도 한 번만 실행");
  assert.equal(shouldCorrectRecommendationStartScroll({ initialMaxScrollTop: 100, nextMaxScrollTop: 100, isCurrentAnchor: true, userScrolled: false, corrected: false }), false, "짧은 추천 목록은 이미 가능한 최대 위치에서 추가 보정하지 않음");
  assert.equal(shouldCorrectRecommendationStartScroll({ initialMaxScrollTop: 100, nextMaxScrollTop: 160, isCurrentAnchor: true, userScrolled: true, corrected: false }), false, "사용자가 수동 스크롤하면 추천 시작 보정을 취소");
  assert.equal(shouldCorrectRecommendationStartScroll({ initialMaxScrollTop: 100, nextMaxScrollTop: 160, isCurrentAnchor: false, userScrolled: false, corrected: false }), false, "새 추천 시작 앵커가 생기면 이전 앵커는 보정하지 않음");
  assert.equal(shouldCorrectRecommendationStartScroll({ initialMaxScrollTop: 100, nextMaxScrollTop: 160, isCurrentAnchor: true, userScrolled: false, corrected: true }), false, "성공한 추천 시작 보정은 반복하지 않음");
  assert.ok(alignedTimelineMarkup.includes('data-product-selection-anchor="test-product-selection"') && alignedTimelineMarkup.includes('data-product-selection-anchor="test-back-to-list"') && chatTimelineRowSource.includes("onSelectionAnchorMount") && chatScreenSource.includes("requestAnimationFrame") && chatScreenSource.includes("scrollContainerRef"), "선택·목록 복귀 메시지 행의 앵커 마운트 직후 내부 채팅 컨테이너를 스크롤");
  assert.ok(chatScreenSource.includes('message.metadata?.productSelectionAnchorId') && chatScreenSource.includes('selectionAnchorId={flowSelectionAnchorId}') && chatScreenSource.includes('onSelectionAnchorMount={scrollToProductSelectionAnchor}'), "추천 시작 사용자 행도 기존 ChatScreen 앵커 마운트·내부 스크롤 경로를 재사용");
  assert.ok(chatScreenSource.indexOf("scrolledProductSelectionAnchorsRef.current.add(anchorId)") > chatScreenSource.indexOf("scrollContainerToProductSelectionAnchor({ container, anchor, behavior: reducedMotion"), "공용 앵커 가드는 실제 내부 컨테이너 스크롤 요청 이후에만 완료 처리");
  assert.ok(recommendationViewSource.includes("useLayoutEffect") && recommendationViewSource.includes("hasRecommendationList") && chatScreenSource.includes("onRecommendationResultContainerMount={correctRecommendationStartScroll}"), "추천 결과 컨테이너가 마운트된 직후에만 클램프된 추천 시작 스크롤 보정 경로를 호출");
  assert.ok(chatScreenSource.includes("scrolledProductSelectionAnchorsRef") && chatScreenSource.includes("shouldStickToBottomRef.current = false") && !chatScreenSource.includes("ResizeObserver"), "상세·이미지·차트의 후속 렌더는 스크롤을 반복 실행하거나 페이지 끝으로 끌고 가지 않음");
  assert.ok(chatScreenSource.includes("data-chat-timeline-root") && assistantRailMarkup.includes('data-chat-rail-width="outer"') && userRailMarkup.includes('data-chat-rail-width="outer"'), "초기·후속 대화가 동일한 최상위 폭 계약 사용");
  assert.ok(chatScreenSource.includes('<ChatConversationTurn sender="ai"') && /<ChatConversationTurn\r?\n\s+sender=\{message\.sender\}/.test(chatScreenSource) && chatScreenSource.includes('<ChatConversationTurn sender={isAssistant ? "ai" : "user"}'), "초기·조건·post-detail 대화가 정확히 같은 ChatConversationTurn 렌더러 사용");
  assert.ok(chatConversationTurnSource.includes("<ChatTimelineRow") && chatConversationTurnSource.includes("<ChatMessage {...props}") && !chatConversationTurnSource.includes('kind="wide"'), "공용 대화 턴은 assistant/user 행과 ChatMessage만 생성");
  assert.ok(assistantRailMarkup.includes('data-chat-timeline-row="assistant"') && assistantRailMarkup.includes("justify-start"), "모든 assistant 턴은 공용 왼쪽 레일");
  assert.ok(userRailMarkup.includes('data-chat-timeline-row="user"') && userRailMarkup.includes("justify-end"), "모든 user 턴은 공용 오른쪽 레일");
  assert.ok(wideRailMarkup.includes('data-chat-timeline-row="wide"') && !wideRailMarkup.includes("justify-end") && !wideRailMarkup.includes("justify-start"), "넓은 카드 행은 메시지 정렬 부모와 독립");
  assert.ok(chatTimelineRowSource.includes('CHAT_ASSISTANT_AVATAR_WIDTH_CLASS = "w-8"') && chatTimelineRowSource.includes('CHAT_ASSISTANT_RAIL_GAP_CLASS = "gap-3"') && chatMessageSource.includes("CHAT_ASSISTANT_AVATAR_WIDTH_CLASS") && chatMessageSource.includes("CHAT_ASSISTANT_RAIL_GAP_CLASS"), "assistant avatar 폭과 gap을 wide 행이 같은 토큰으로 공유");
  assert.ok(wideRailMarkup.includes("data-chat-wide-avatar-column") && wideRailMarkup.includes("data-chat-wide-content-inner") && smartShoppingTimelineSource.includes('data-chat-content="recommendation-shell"') && smartShoppingTimelineSource.includes('data-chat-content="action-toolbar"') && !smartShoppingTimelineSource.includes('className="ml-11 grid'), "wide 콘텐츠는 공용 빈 avatar 열 뒤 content 열을 사용하고 대체 상품 중복 inset 없음");
  assert.equal((alignedTimelineMarkup.match(/data-chat-timeline-row="user"/g) ?? []).length, 7, "상품 선택과 모든 후속 액션의 사용자 턴이 같은 오른쪽 행 사용");
  assert.equal((alignedTimelineMarkup.match(/data-chat-timeline-row="assistant"/g) ?? []).length, 8, "초기 조건 질문과 세일·팁·대체 상품·목록 복원·Q&A·구매 단계 답변이 같은 왼쪽 행 사용");
  assert.equal((alignedTimelineMarkup.match(/data-chat-assistant-logo="true"/g) ?? []).length, 8, "상품 상세 전후 모든 assistant MOIT 로고가 동일한 outer 렌더러 사용");
  assert.equal((alignedTimelineMarkup.match(/data-chat-timeline-row="wide"/g) ?? []).length, 8, "상세·액션·복원 목록이 후속 대화와 형제인 독립 wide 행 사용");
  const rowAncestors = []; const markupStack = [];
  const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  for (const match of alignedTimelineMarkup.matchAll(/<\/?([a-z][a-z0-9-]*)([^>]*)>/gi)) {
    const [token, tagName, attributes] = match;
    if (token.startsWith("</")) { markupStack.pop(); continue; }
    if (attributes.includes("data-chat-conversation-row=")) rowAncestors.push([...markupStack]);
    if (!voidElements.has(tagName.toLowerCase()) && !token.endsWith("/>")) markupStack.push(attributes);
  }
  assert.ok(rowAncestors.length > 0 && rowAncestors.every((ancestors) => ancestors.length === 1 && ancestors[0].includes("data-chat-timeline-root")), "모든 assistant/user 행의 유일한 DOM 조상은 같은 outer ChatScreen 타임라인");
  assert.ok(rowAncestors.every((ancestors) => ancestors.every((attributes) => !attributes.includes("data-chat-wide-content"))), "assistant/user 행은 wide-content 조상을 가질 수 없음");
  for (const categoryId of ["air-conditioner", "tv", "refrigerator", "vacuum"]) {
    const categoryMarkup = renderToStaticMarkup(React.createElement(ChatScreenSmartShoppingTimeline, { model: { ...timelineRailModel, timeline: alignmentTimeline.map((entry) => ({ ...entry, id: `${categoryId}-${entry.id}` })) } }));
    assert.equal((categoryMarkup.match(/data-chat-timeline-row="user"/g) ?? []).length, 7, `${categoryId} 공용 사용자 레일`);
    assert.equal((categoryMarkup.match(/data-chat-timeline-row="assistant"/g) ?? []).length, 7, `${categoryId} 공용 assistant 레일`);
  }
  assert.ok(chatScreenSource.includes("isLast && isAi && Boolean(flow.currentStep) && flow.canUndo"), "최신 활성 질문에만 undo 전달");
  assert.ok(chatMessageSource.includes("⤴️") && chatMessageSource.includes('title="이전 조건 다시 입력"') && chatMessageSource.includes('aria-label="이전 조건 다시 입력"'), "undo 문자·도움말·접근성 이름");
  assert.ok(chatMessageSource.indexOf("{isAi && canUndo && onUndo") > chatMessageSource.indexOf("{/* 선택지 컴포넌트"), "undo 버튼은 질문 버블 내용 뒤의 형제 요소로 렌더링");
  assert.ok(chatMessageSource.includes('className="flex max-w-full items-end gap-2"') && !chatMessageSource.includes("fixed bottom") && !chatMessageSource.includes("fixed right"), "undo는 버블 하단 우측 바깥에 gap으로 고정하고 viewport fixed를 사용하지 않음");
  assert.ok(chatMessageSource.includes("disabled={undoDisabled}") && chatFlowInputSource.includes("setInputValue(\"\")") && chatFlowInputSource.includes("setSelectedValues([])"), "전환 중 반복 undo 방지·복원 입력/선택 초기화");
  const { getSelectedPriceRisePct, findAlternativeProducts } = await load("/src/app/features/smart-shopping/actions/findAlternativeProducts.ts");
  const elevatedRecommendation = { ...tvResult.recommendations[0], product: { ...tvResult.recommendations[0].product, currentPrice: tvResult.recommendations[0].product.priceHistory[0].lowestPrice * 1.2 } };
  const elevatedSelected = { source: "internal", recommendation: elevatedRecommendation };
  assert.ok(getSelectedPriceRisePct(elevatedSelected) >= 15, "대체 상품 버튼 가격 상승률 임계값");
  const noHistorySelected = { source: "internal", recommendation: { ...elevatedRecommendation, product: { ...elevatedRecommendation.product, priceHistory: [] } } };
  assert.equal(getSelectedPriceRisePct(noHistorySelected), null, "가격 이력 없으면 대체 상품 조건 숨김");
  assert.ok(Array.isArray(findAlternativeProducts({ selected: elevatedSelected, recommendations: tvResult.recommendations })), "대체 상품은 내부 추천 목록에서 검색");

  const { getUpcomingPromotionMessage } = await load("/src/app/features/smart-shopping/promotions/getUpcomingPromotionMessage.ts");
  assert.ok(getUpcomingPromotionMessage({ categoryId: "tv", currentPrice: 100, priceHistory: [], now: new Date("2026-08-21") }).includes("추석"), "가까운 추석 프로모션 메시지 선택");
  const { buildPurchaseTipMessage } = await load("/src/app/features/smart-shopping/actions/buildPurchaseTipMessage.ts");
  assert.ok(buildPurchaseTipMessage("air-conditioner").includes("기본 배관 길이"), "에어컨 설치비 구매 팁");

  const { startPurchaseGradeDiagnosis } = await load("/src/app/features/smart-shopping/grade/startPurchaseGradeDiagnosis.ts");
  const gradeInput = startPurchaseGradeDiagnosis({ selected: elevatedSelected, recommendations: tvResult.recommendations, userCriteria: tvAnswers });
  assert.equal(gradeInput.selectedProduct, elevatedSelected); assert.equal(gradeInput.userCriteria, tvAnswers); assert.equal(gradeInput.score, elevatedRecommendation.score, "구매등급진단에 선택 상품·조건·점수 전달");
  const nextActionState = recommendationState.recommendationViewReducer(detailState, { type: "choose-next-action" });
  assert.equal(nextActionState.stage, "choosing-next-action", "다음 단계에서 구매등급진단 자동 시작 금지");
  const gradeState = recommendationState.recommendationViewReducer(nextActionState, { type: "start-purchase-grade", input: gradeInput });
  assert.equal(gradeState.stage, "grading-purchase", "구매등급진단 전용 상태 전환");
  const { NEXT_ACTION_OPTIONS } = await load("/src/app/features/smart-shopping/next-actions/nextActionOptions.ts");
  assert.deepEqual(NEXT_ACTION_OPTIONS.map((item) => item.label), ["⭐구매등급진단⭐", "구매 링크 연결", "최저가 알람 설정", "목록 다시 보기", "채팅 종료하기"], "다음 단계 선택 순서");
  assert.ok(NEXT_ACTION_OPTIONS[0].description && NEXT_ACTION_OPTIONS[0].primary, "구매등급진단 강조 설명");
  const { getVisibleNextActionOptions } = await load("/src/app/features/smart-shopping/next-actions/nextActionOptions.ts");
  assert.deepEqual(getVisibleNextActionOptions(false).map((item) => item.label), ["구매 링크 연결", "최저가 알람 설정", "목록 다시 보기", "채팅 종료하기"], "등급 완료 후 공통 후속 액션 순서");
  const gradeResultSource = await readFile("src/app/features/smart-shopping/grade/PurchaseGradeResultCard.tsx", "utf8");
  assert.ok(!gradeResultSource.includes("채팅 종료하기"), "등급 결과의 단독 종료 버튼 제거");
  assert.ok(gradeResultSource.includes("PurchaseGradeShareButton"), "등급 결과 카드 공유 버튼 연결");
  const { PURCHASE_GRADE_SHARE_CHANNELS } = await load("/src/app/features/smart-shopping/share/shareChannels.ts");
  assert.deepEqual(PURCHASE_GRADE_SHARE_CHANNELS.map((channel) => channel.label), ["Instagram", "Threads", "TikTok"], "SNS 공유 채널 순서");
  assert.deepEqual(PURCHASE_GRADE_SHARE_CHANNELS.map((channel) => channel.iconPath), ["/assets/brands/social/instagram.svg", "/assets/brands/social/threads.svg", undefined], "공식 로컬 자산·TikTok 일반 아이콘 정책");
  const shareButtonSource = await readFile("src/app/features/smart-shopping/share/PurchaseGradeShareButton.tsx", "utf8");
  assert.ok(shareButtonSource.includes('aria-label="공유하기"') && shareButtonSource.includes('aria-haspopup="menu"') && shareButtonSource.includes("aria-expanded={isOpen}"), "공유 버튼 접근성 상태");
  assert.ok(shareButtonSource.includes('event.key === "Escape"') && shareButtonSource.includes("closeOnOutsideClick"), "공유 메뉴 닫기 동작");
  const shareMenuSource = await readFile("src/app/features/smart-shopping/share/PurchaseGradeShareMenu.tsx", "utf8");
  assert.ok(shareMenuSource.includes("공유 기능 준비 중") && shareMenuSource.includes("onError"), "공유 준비 안내·로컬 아이콘 fallback");
  assert.ok(!shareButtonSource.includes("window.open") && !shareMenuSource.includes("window.open"), "SNS 외부 이동 미구현");
  const { calculatePurchaseGrade } = await load("/src/app/features/smart-shopping/grade/calculatePurchaseGrade.ts");
  assert.equal(calculatePurchaseGrade(100, 100).grade, "골드", "현재가가 최저가 이하면 골드");
  assert.equal(calculatePurchaseGrade(105, 100).grade, "골드", "5% 이하면 골드");
  assert.equal(calculatePurchaseGrade(115, 100).grade, "실버", "5~15% 이하면 실버");
  assert.equal(calculatePurchaseGrade(116, 100).grade, "브론즈", "15% 초과 브론즈");
  assert.equal(calculatePurchaseGrade(0, 100).status, "unavailable", "가격 부족은 진단 불가");
  const { resolvePurchaseLink } = await load("/src/app/features/smart-shopping/next-actions/resolvePurchaseLink.ts");
  const linkedNaverProduct = { ...naverItems[0], productUrl: "https://example.test/naver-offer" };
  assert.equal(resolvePurchaseLink({ source: "naver", product: linkedNaverProduct }, []), "https://example.test/naver-offer", "네이버 선택 상품 링크 사용");
  assert.equal(resolvePurchaseLink(elevatedSelected, [{ ...linkedNaverProduct, title: `${linkedNaverProduct.title} ${elevatedRecommendation.product.modelNumber}`, brand: elevatedRecommendation.product.brand }]), "https://example.test/naver-offer", "내부 상품은 매칭된 네이버 offer 링크 사용");
  assert.equal(resolvePurchaseLink(elevatedSelected, []), undefined, "링크 없으면 임의 검색 URL 생성 금지");

  const memoryStore = new Map();
  globalThis.window = { localStorage: { getItem: (key) => memoryStore.get(key) ?? null, setItem: (key, value) => memoryStore.set(key, value) } };
  const { LocalStoragePriceAlertRepository } = await load("/src/app/features/smart-shopping/price-alerts/LocalStoragePriceAlertRepository.ts");
  const alertRepository = new LocalStoragePriceAlertRepository();
  const alert = alertRepository.createAlert({ userId: "mock-user", productId: "tv-google-55", productName: "클리어 Google 55", modelNumber: "MV-G55", source: "internal", purchaseLink: "https://example.test/naver-offer", currentPrice: 900000, targetPrice: 800000, active: true });
  assert.equal(alertRepository.getAlertsForUser("mock-user").length, 1, "목표가 알람 저장");
  const alertNotifications = alertRepository.evaluateAlerts("mock-user", [{ productId: alert.productId, currentPrice: 800000 }]);
  assert.equal(alertNotifications.length, 1, "목표가 이하에서 알림 발생");
  alertRepository.markNotificationRead(alertNotifications[0].id);
  assert.equal(alertRepository.getNotificationsForUser("mock-user")[0].read, true, "알림 읽음 처리");
  const { LocalFavoriteRepository } = await load("/src/app/features/favorites/LocalFavoriteRepository.ts");
  const { createFavoriteDraft } = await load("/src/app/features/favorites/createFavoriteDraft.ts");
  const { getFavoriteProductIdentity } = await load("/src/app/features/favorites/favoriteIdentity.ts");
  const { toggleFavoriteInRepository } = await load("/src/app/features/favorites/toggleFavorite.ts");
  const favoriteRepository = new LocalFavoriteRepository();
  const favorite = favoriteRepository.addFavorite({ userId: "mock-user", productId: "tv-google-55", source: "internal", categoryId: "tv", name: "클리어 Google 55", brand: "MOIT View", modelNumber: "MV-G55", imagePath: "/assets/products/mock/tv/tv-google-55.svg", currentPrice: 900000, allTimeLow: 750000, purchaseLink: "https://example.test/naver-offer", internalProductId: "tv-google-55", dataStatus: "mock" });
  assert.equal(favoriteRepository.getFavoritesForUser("mock-user").length, 1, "즐겨찾기 localStorage 저장");
  assert.equal(favoriteRepository.addFavorite({ ...favorite, id: undefined, createdAt: undefined, lastCheckedAt: undefined }).id, favorite.id, "같은 상품 중복 즐겨찾기 방지");
  favoriteRepository.removeFavorite(favorite.id);
  assert.equal(favoriteRepository.getFavoritesForUser("mock-user").length, 0, "즐겨찾기 개별 삭제");
  const internalFavoriteDraft = createFavoriteDraft({ userId: "mock-user", categoryId: "tv", selected: elevatedSelected, naverItems: [{ ...linkedNaverProduct, title: `${linkedNaverProduct.title} ${elevatedRecommendation.product.modelNumber}`, brand: elevatedRecommendation.product.brand }] });
  const matchedNaverSelection = { source: "naver", product: { ...linkedNaverProduct, modelNumber: "MV-G55" }, matchedInternalProduct: matchedTv };
  const naverFavoriteDraft = createFavoriteDraft({ userId: "mock-user", categoryId: "tv", selected: matchedNaverSelection, naverItems });
  assert.equal(internalFavoriteDraft.internalProductId, "tv-google-55", "내부 상품 즐겨찾기 정보 보존");
  assert.equal(naverFavoriteDraft.productId, linkedNaverProduct.productId, "네이버 상품 id 보존");
  assert.equal(naverFavoriteDraft.purchaseLink, "https://example.test/naver-offer", "네이버 구매 링크 보존");
  assert.equal(getFavoriteProductIdentity(internalFavoriteDraft), getFavoriteProductIdentity(naverFavoriteDraft), "매칭 내부 id를 네이버 id보다 우선 식별");
  assert.equal(toggleFavoriteInRepository(favoriteRepository, internalFavoriteDraft), true, "내부 상품 별 토글로 추가");
  assert.equal(favoriteRepository.getFavoritesForUser("mock-user").length, 1, "추천 카드 추가가 기존 저장소에 즉시 반영");
  assert.equal(favoriteRepository.getFavoritesForUser("mock-user").some((item) => getFavoriteProductIdentity(item) === getFavoriteProductIdentity(internalFavoriteDraft)), true, "목록에서 추가한 즐겨찾기를 동일 상품 상세도 같은 identity로 확인");
  assert.equal(toggleFavoriteInRepository(favoriteRepository, naverFavoriteDraft), false, "같은 내부 상품에 매칭된 네이버 별 토글로 삭제");
  assert.equal(favoriteRepository.getFavoritesForUser("mock-user").length, 0, "채워진 별 재클릭 삭제");
  assert.equal(favoriteRepository.getFavoritesForUser("mock-user").some((item) => getFavoriteProductIdentity(item) === getFavoriteProductIdentity(naverFavoriteDraft)), false, "상세 또는 목록에서 해제하면 동일 identity의 즐겨찾기도 제거");
  const unmatchedNaverDraft = createFavoriteDraft({ userId: "mock-user", categoryId: "tv", selected: { source: "naver", product: { ...naverItems[1], productUrl: "https://example.test/naver-unmatched" } }, naverItems });
  assert.equal(getFavoriteProductIdentity(unmatchedNaverDraft), `naver:${naverItems[1].productId}`, "미매칭 네이버 product id 식별");
  assert.equal(toggleFavoriteInRepository(favoriteRepository, unmatchedNaverDraft), true, "네이버 상품 별 토글로 추가");
  assert.equal(toggleFavoriteInRepository(favoriteRepository, unmatchedNaverDraft), false, "네이버 상품 별 재클릭 삭제");
  const naverErrorInternalDraft = createFavoriteDraft({ userId: "mock-user", categoryId: "tv", selected: elevatedSelected, naverItems: [] });
  assert.equal(toggleFavoriteInRepository(favoriteRepository, naverErrorInternalDraft), true, "네이버 오류와 무관하게 내부 상품 즐겨찾기 추가");
  assert.equal(toggleFavoriteInRepository(favoriteRepository, naverErrorInternalDraft), false, "네이버 오류 상태 내부 상품 즐겨찾기 삭제");
  assert.equal(getFavoriteProductIdentity({ source: "naver", productId: "", modelNumber: " mv-g 55 ", purchaseLink: "https://example.test/fallback" }), "model:MVG55", "정규화 모델번호 fallback");
  assert.equal(getFavoriteProductIdentity({ source: "naver", productId: "", purchaseLink: "https://example.test/fallback" }), "naver:url:https://example.test/fallback", "출처·URL 최종 fallback");
  assert.equal(alertRepository.getAlertsForUser("mock-user").length, 1, "즐겨찾기 삭제가 가격 알람을 삭제하지 않음");
  alertRepository.deleteNotification(alertNotifications[0].id);
  assert.equal(alertRepository.getNotificationsForUser("mock-user").length, 0, "알림 개별 삭제");
  assert.equal(alertRepository.getAlertsForUser("mock-user").length, 1, "알림 삭제가 가격 알람을 삭제하지 않음");
  const topActionSource = await readFile("src/app/components/layout/TopActionBar.tsx", "utf8");
  const appSource = await readFile("src/app/App.tsx", "utf8");
  const topActionTypeSource = await readFile("src/app/types/moit.ts", "utf8");
  const favoritesPageSource = await readFile("src/app/features/favorites/FavoritesPage.tsx", "utf8");
  assert.ok(topActionSource.includes("onOpenNotifications") && appSource.includes('setUtilityPage("favorites")'), "상단 알림·즐겨찾기 전용 페이지 진입");
  assert.ok(appSource.includes("utilityPage === \"favorites\"") && appSource.includes("utilityPage === \"notifications\""), "원래 화면 위의 보조 페이지 오버레이");
  assert.ok(appSource.includes("toggleFavoriteInRepository") && appSource.includes("refreshFavorites()"), "추천 카드와 즐겨찾기 페이지가 App 저장소 상태 공유");
  assert.ok(!topActionSource.includes("active={isFavorite}") && !topActionSource.includes("fill-amber-400") && !appSource.includes("isFavorite: favorites.length") && !topActionTypeSource.includes("isFavorite:"), "상단 전역 즐겨찾기는 저장 상태와 무관한 중립 내비게이션 버튼");
  assert.ok(favoritesPageSource.indexOf("상세 정보 보기") < favoritesPageSource.indexOf("구매 링크") && favoritesPageSource.indexOf("구매 링크") < favoritesPageSource.indexOf("최저가 알람 가격 설정") && favoritesPageSource.indexOf("최저가 알람 가격 설정") < favoritesPageSource.indexOf("즐겨찾기 삭제"), "즐겨찾기 카드 액션 순서");
  const favoriteButtonSource = await readFile("src/app/features/favorites/FavoriteToggleButton.tsx", "utf8");
  const optimizedListSource = await readFile("src/app/features/smart-shopping/recommendation/OptimizedRecommendationList.tsx", "utf8");
  const naverListSource = await readFile("src/app/features/smart-shopping/recommendation/NaverLowestPriceList.tsx", "utf8");
  const productDetailViewSource = await readFile("src/app/features/smart-shopping/recommendation/ProductDetailView.tsx", "utf8");
  const productRecommendationCardSource = await readFile("src/app/components/features/chat/ProductRecommendationCard.tsx", "utf8");
  const timelineSource = await readFile("src/app/features/smart-shopping/timeline/SmartShoppingTimeline.tsx", "utf8");
  const productActionBarSource = await readFile("src/app/features/smart-shopping/product-detail/ProductDetailActionBar.tsx", "utf8");
  assert.ok(favoriteButtonSource.includes('aria-pressed={isFavorite}') && favoriteButtonSource.includes("즐겨찾기에 추가") && favoriteButtonSource.includes("즐겨찾기에서 삭제"), "별 버튼 접근성 상태·안내");
  assert.ok(favoriteButtonSource.includes("event.stopPropagation()") && optimizedListSource.includes("FavoriteToggleButton") && naverListSource.includes("FavoriteToggleButton") && productDetailViewSource.includes("FavoriteToggleButton"), "별 클릭과 내부·더미 상품 선택 이벤트 분리");
  assert.ok(optimizedListSource.includes("onClick={() => onSelect(item)}") && naverListSource.includes("onClick={() => onSelect(item)}") && recommendationViewSource.includes("productSelectionAnchorId") && recommendationViewSource.includes('createConversationAnchorId("product-selection")') && recommendationViewSource.includes('createConversationAnchorId("back-to-list")') && recommendationViewSource.includes('if (action === "back-to-list") return backToList()') && timelineSource.includes("onBack={props.onBackToList}") && recommendationViewSource.includes("onSelectRecommendation: (recommendation) => selectProduct") && recommendationViewSource.includes("onSelectDummyProduct: (product) => selectProduct"), "AI 최적화·인기 상품 목록과 두 목록 복귀 진입점이 공통 앵커 스크롤 경로를 사용");
  assert.ok(optimizedListSource.includes("disabled={!isActive}") && !optimizedListSource.includes("<FavoriteToggleButton isFavorite={isFavorite(item)} disabled={!isActive}"), "AI 목록의 과거 읽기 전용 상품 선택과 전역 즐겨찾기 토글을 분리");
  assert.ok(productRecommendationCardSource.includes("recommendation.score") && productRecommendationCardSource.includes("FavoriteToggleButton") && productDetailViewSource.includes("<NaverProductDetail") && productDetailViewSource.includes("onToggleFavorite={props.onToggleFavorite}"), "상세 카드의 점수 배지를 보존하고 내부·네이버 별 버튼 연결");
  assert.ok(productRecommendationCardSource.includes("RecommendationReasonList") && !productRecommendationCardSource.includes('recommendationReasons.join(" · ")'), "상품 상세는 공용 구조화 추천 이유 컴포넌트만 사용");
  assert.ok(timelineSource.includes("isFavorite={props.isFavorite(item.snapshot.selected)}") && timelineSource.includes("onToggleFavorite={() => props.onToggleFavorite(item.snapshot.selected)}"), "누적 상품 상세 snapshot은 제품 정보는 유지하고 현재 즐겨찾기 저장소 상태를 사용");
  assert.ok(!timelineSource.includes("ChatTimelineRow") && !timelineSource.includes("ChatMessage") && timelineSource.includes("SmartShoppingWideTimelineContent") && timelineSource.includes("Renders wide content only"), "SmartShoppingTimeline은 wide 콘텐츠만 렌더링하고 대화 DOM을 생성하지 않음");
  assert.ok(!productDetailViewSource.includes("ProductDetailConversation") && !timelineSource.includes("<ChatConversationTurn") && chatScreenSource.includes("isSmartShoppingConversationItem"), "post-detail assistant/user 렌더 경로를 ChatScreen 한 곳으로 제거·통합");
  assert.ok(productActionBarSource.includes("data-product-action-group=\"ordinary\"") && productActionBarSource.includes("lg:flex-nowrap") && productActionBarSource.includes("data-product-progress-action"), "데스크톱 일반 액션 한 행과 독립 진행 액션 계약");
  const { toggleFavoriteWithoutSelecting } = await load("/src/app/features/favorites/FavoriteToggleButton.tsx");
  let propagationStopped = false; let favoriteToggled = false;
  toggleFavoriteWithoutSelecting({ stopPropagation: () => { propagationStopped = true; } }, () => { favoriteToggled = true; });
  assert.equal(propagationStopped, true, "별 클릭 이벤트 전파 차단"); assert.equal(favoriteToggled, true, "별 클릭 토글 실행");
  const { endSmartShoppingChat } = await load("/src/app/features/smart-shopping/next-actions/endSmartShoppingChat.ts");
  let didEndChat = false; endSmartShoppingChat(() => { didEndChat = true; }); assert.equal(didEndChat, true, "동일 종료 함수 재사용");

  const sessionModule = await load("/src/app/features/smart-shopping/session/smartShoppingSessionReducer.ts");
  const timelineSnapshots = await load("/src/app/features/smart-shopping/timeline/createTimelineSnapshot.ts");
  let shoppingSession = sessionModule.createSmartShoppingSession({ categoryId: "tv", criteria: tvAnswers });
  const loadingTimelineSnapshot = timelineSnapshots.createRecommendationSnapshot({ categoryId: "tv", recommendations: tvResult.recommendations, catalogSource: "mock", dummyProducts: dummyItems });
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, loadingTimelineSnapshot) });
  const timelineSnapshot = timelineSnapshots.createRecommendationSnapshot({ categoryId: "tv", recommendations: tvResult.recommendations, catalogSource: "mock", dummyProducts: dummyItems });
  assert.equal(loadingTimelineSnapshot.snapshotId, timelineSnapshot.snapshotId, "동일 추천 결과와 더미 목록의 안정적 snapshotId");
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, timelineSnapshot) });
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "recommendation-list").length, 1, "동일 목록 snapshot은 중복 없이 교체");
  assert.deepEqual(shoppingSession.timeline.find((item) => item.type === "recommendation-list").snapshot.dummyProducts.map(({ id }) => id), dummyItems.map(({ id }) => id), "단일 목록에 결정적 내부 더미 목록 보존");
  const timelineSelected = { source: "internal", recommendation: JSON.parse(JSON.stringify(tvResult.recommendations[0])) };
  const productTimelineSnapshot = timelineSnapshots.createProductDetailSnapshot({ categoryId: "tv", selected: timelineSelected, internalRecommendations: tvResult.recommendations, showAlternative: false });
  const snapshottedHistory = JSON.parse(JSON.stringify(productTimelineSnapshot.selected.recommendation.product.priceHistory));
  timelineSelected.recommendation.product.priceHistory[0].lowestPrice = 1;
  assert.deepEqual(productTimelineSnapshot.selected.recommendation.product.priceHistory, snapshottedHistory, "상세 snapshot이 실제 저장 가격 이력을 독립 보존");
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "select-product", product: timelineSelected });
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append", item: timelineSnapshots.createProductDetailTimelineItem(shoppingSession.sessionId, productTimelineSnapshot) });
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append", item: timelineSnapshots.createTextTimelineItem(shoppingSession.sessionId, "assistant-text", "예상 세일 달 제안 답변") });
  const timelineLengthBeforeStageChange = shoppingSession.timeline.length;
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "set-stage", stage: "choosing-next-action" });
  assert.equal(shoppingSession.timeline.length, timelineLengthBeforeStageChange, "단계 전환은 누적 타임라인을 초기화하지 않음");
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-action-group", item: timelineSnapshots.createActionGroupTimelineItem(shoppingSession.sessionId, "detail") });
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-action-group", item: timelineSnapshots.createActionGroupTimelineItem(shoppingSession.sessionId, "next") });
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "action-group" && item.isActive).length, 1, "가장 최근 액션 그룹만 활성화");
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "product-detail").length, 1, "세일 답변 후 기존 상품 상세 유지");
  const historicalDetail = shoppingSession.timeline.find((item) => item.type === "product-detail");
  timelineSelected.recommendation = { ...timelineSelected.recommendation, product: { ...timelineSelected.recommendation.product, name: "변경되면 안 되는 현재 선택값" } };
  assert.notEqual(historicalDetail.snapshot.selected.recommendation.product.name, timelineSelected.recommendation.product.name, "과거 상품 상세 스냅샷 격리");
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append", item: timelineSnapshots.createTextTimelineItem(shoppingSession.sessionId, "user-action", "목록 다시 보기") });
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, shoppingSession.recommendationSnapshot) });
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "recommendation-list").length, 1, "목록 복귀 시 기존 추천 snapshot item 재사용");
  assert.equal(shoppingSession.timeline.at(-1).type, "recommendation-list", "재사용 목록을 현재 타임라인 끝의 활성 UI로 이동");
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "product-detail").length, 1, "목록 복귀 후 이전 상세 기록 유지");
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "assistant-text" && item.text === "예상 세일 달 제안 답변").length, 1, "목록 복귀 후 이전 후속 답변 유지");
  const refrigeratorSession = sessionModule.createSmartShoppingSession({ categoryId: "refrigerator", criteria: {} });
  assert.notEqual(shoppingSession.sessionId, refrigeratorSession.sessionId, "다른 소분류 세션 격리");
  assert.ok(recommendationViewSource.includes("SmartShoppingTimelineRenderModel") && recommendationViewSource.includes("session.recommendationSnapshot"), "컨트롤러가 타임라인 모델과 목록 스냅샷을 보존");
  assert.ok(recommendationViewSource.includes("return renderTimeline({") && !recommendationViewSource.includes("ChatTimelineRow") && !recommendationViewSource.includes("ChatMessage") && !recommendationViewSource.includes("SmartShoppingWideTimelineContent") && recommendationViewSource.includes('appendText("assistant-text", getUpcomingPromotionMessage') && recommendationViewSource.includes('appendText("assistant-text", buildPurchaseTipMessage') && recommendationViewSource.includes('appendText("assistant-text", alternatives.length') && recommendationViewSource.includes('appendText("assistant-text", response.answer') && recommendationViewSource.includes('appendText("assistant-text", "이전에 확인한 조건으로 상품 목록을 다시 보여드릴게요."') && recommendationViewSource.includes('appendText("assistant-text", "이 상품으로 무엇을 해볼까요?'), "컨트롤러는 모든 응답을 데이터로만 만들고 assistant/user DOM을 렌더링하지 않음");
  assert.ok(![recommendationViewSource, productActionBarSource, await readFile("src/app/features/smart-shopping/actions/productDetailActions.ts", "utf8"), await readFile("src/app/features/smart-shopping/next-actions/nextActionOptions.ts", "utf8")].join("\n").includes("목록으로 돌아가기"), "모든 스마트쇼핑 액션 경로에서 이전 목록 문구 제거");
  assert.ok(!recommendationViewSource.includes("onClearSupplementalMessages"), "단계 전환 시 보조 대화 초기화 제거");

  const { productQuestionRoute } = await load("/server/productQuestionRoute.ts");
  let productQuestionHandler;
  productQuestionRoute({}).configureServer({ middlewares: { use: (handler) => { productQuestionHandler = handler; } } });
  let questionStatus = 0; let questionBody = "";
  await productQuestionHandler({ url: "/api/ai/product-question", method: "POST" }, { setHeader: () => {}, end: (body) => { questionBody = body; }, set statusCode(value) { questionStatus = value; } }, () => {});
  assert.equal(questionStatus, 503); assert.equal(JSON.parse(questionBody).code, "OPENAI_CONFIG_MISSING", "OpenAI 키 미설정 안내");

  const airState = runtime.createInitialFlowState(airModule);
  const freshVacuumState = runtime.createInitialFlowState(vacuumFlowModule);
  assert.notStrictEqual(airState.answers, freshVacuumState.answers, "상품군별 답변 상태 격리");
  assert.equal(airState.flowId, "air-conditioner"); assert.equal(freshVacuumState.flowId, "vacuum");

  const { mockProducts } = await load("/src/app/features/product-catalog/data/mockProducts.ts");
  const { realProducts } = await load("/src/app/features/product-catalog/data/realProducts.ts");
  const { REAL_AIR_CONDITIONER_PRODUCTS } = await load("/src/app/features/product-catalog/data/real/airConditioners.ts");
  const { REAL_TV_PRODUCTS } = await load("/src/app/features/product-catalog/data/real/televisions.ts");
  const { REAL_REFRIGERATOR_PRODUCTS } = await load("/src/app/features/product-catalog/data/real/refrigerators.ts");
  const { REAL_VACUUM_PRODUCTS } = await load("/src/app/features/product-catalog/data/real/vacuumCleaners.ts");
  const { buildCatalogProducts, catalogProducts, catalogSourceByCategory, productRepository } = await load("/src/app/features/product-catalog/data/productCatalog.ts");
  const { StaticProductRepository } = await load("/src/app/features/product-catalog/repositories/StaticProductRepository.ts");
  const { validateProductData } = await load("/src/app/features/product-catalog/data/validateProducts.ts");
  assert.equal(mockProducts.length, 20, "기존 더미 상품 20개를 mockProducts로 보존");
  assert.deepEqual(realProducts, [...REAL_AIR_CONDITIONER_PRODUCTS, ...REAL_TV_PRODUCTS, ...REAL_REFRIGERATOR_PRODUCTS, ...REAL_VACUUM_PRODUCTS], "realProducts는 네 상품군 실제 배열을 집계");
  assert.ok(REAL_AIR_CONDITIONER_PRODUCTS.every((product) => product.categoryId === "air-conditioner") && REAL_TV_PRODUCTS.every((product) => product.categoryId === "tv") && REAL_REFRIGERATOR_PRODUCTS.every((product) => product.categoryId === "refrigerator") && REAL_VACUUM_PRODUCTS.every((product) => product.categoryId === "vacuum"), "상품군별 실제 배열의 categoryId 정확성");
  assert.deepEqual(Object.fromEntries(["air-conditioner", "tv", "refrigerator", "vacuum"].map((categoryId) => [categoryId, realProducts.filter((product) => product.categoryId === categoryId).length])), { "air-conditioner": 28, tv: 25, refrigerator: 25, vacuum: 22 }, "네 실제 상품군 파일의 집계 수");
  assert.ok(realProducts.every((product) => product.source === "real" && product.categoryId && product.dataStatus !== "mock"), "실제 상품의 출처·카테고리 상태");
  const imageIntegrityFailures = [];
  for (const product of realProducts) {
    const imagePath = product.imagePath;
    const expectedFilesystemPath = join(process.cwd(), "public", imagePath.replace(/^\//, ""));
    const reportFailure = (reason) => imageIntegrityFailures.push({
      category: product.categoryId,
      modelNumber: product.modelNumber,
      imagePath,
      expectedFilesystemPath,
      reason,
    });

    if (imagePath.startsWith("/public/")) { reportFailure("public directory prefix is not a browser path"); continue; }
    if (!imagePath.startsWith("/assets/")) { reportFailure("unresolved local asset path"); continue; }
    if (/\/(?:draft|mock)\//i.test(imagePath)) { reportFailure("unresolved draft asset path"); continue; }

    let directory = join(process.cwd(), "public");
    let exactFileName = "";
    let missing = false;
    for (const segment of imagePath.slice(1).split("/")) {
      if (!existsSync(directory)) { reportFailure("parent directory does not exist"); missing = true; break; }
      const entries = readdirSync(directory);
      if (!entries.includes(segment)) {
        const caseInsensitiveMatch = entries.find((entry) => entry.toLowerCase() === segment.toLowerCase());
        reportFailure(caseInsensitiveMatch ? `path casing mismatch (found ${caseInsensitiveMatch})` : "asset file does not exist");
        missing = true;
        break;
      }
      directory = join(directory, segment);
      exactFileName = segment;
    }
    if (missing) continue;
    const stat = statSync(directory);
    if (!stat.isFile()) { reportFailure("asset path is not a file"); continue; }
    if (stat.size === 0) { reportFailure("asset file is empty"); continue; }
    if (extname(exactFileName) !== extname(imagePath)) reportFailure(`extension mismatch (found ${extname(exactFileName) || "none"})`);
  }
  for (const failure of imageIntegrityFailures) {
    console.error(`real product image integrity failure: category=${failure.category} model=${failure.modelNumber} imagePath=${failure.imagePath} expected=${failure.expectedFilesystemPath} reason=${failure.reason}`);
  }
  assert.equal(imageIntegrityFailures.length, 0, "모든 실제 상품의 로컬 이미지 경로가 public 자산과 정확히 일치");
  assert.ok([...mockProducts, ...realProducts].every((product) => !("weaknesses" in product)), "모든 real/mock 상품에서 weaknesses 제거");
  assert.ok([...mockProducts, ...realProducts].filter((product) => product.categoryId === "air-conditioner").every((product) => ["basicInstallationIncluded", "officialInstallation", "rebateEligible"].every((field) => !(field in product.specs))), "모든 에어컨 real/mock specs에서 설치·환급 필드 제거");
  assert.ok([...mockProducts, ...realProducts].filter((product) => product.categoryId === "tv").every((product) => !("rebateEligible" in product.specs)), "모든 TV real/mock specs에서 rebateEligible 제거");
  assert.deepEqual(validateProductData(mockProducts, realProducts), [], "weaknesses 없는 전체 real/mock 상품 검증 통과");
  const catalogTypesSource = await readFile("src/app/features/product-catalog/core/types.ts", "utf8");
  const airSpecsTypeSource = catalogTypesSource.slice(catalogTypesSource.indexOf("export interface AirConditionerSpecs"), catalogTypesSource.indexOf("export interface TvSpecs"));
  const tvSpecsTypeSource = catalogTypesSource.slice(catalogTypesSource.indexOf("export interface TvSpecs"), catalogTypesSource.indexOf("export interface RefrigeratorSpecs"));
  assert.ok(!catalogTypesSource.includes("weaknesses:") && !airSpecsTypeSource.includes("basicInstallationIncluded") && !airSpecsTypeSource.includes("officialInstallation") && !airSpecsTypeSource.includes("rebateEligible"), "공통 상품·에어컨 타입 스키마 정리");
  assert.ok(!tvSpecsTypeSource.includes("rebateEligible"), "TV 타입 스키마에서 rebateEligible 제거");
  assert.deepEqual(catalogSourceByCategory, { "air-conditioner": "real", tv: "real", refrigerator: "real", vacuum: "real" }, "실제 데이터가 있는 카테고리는 real 선택");
  const repository = productRepository;
  assert.equal(repository.getProducts("air-conditioner").length, 28); assert.equal(repository.getProducts("tv").length, 25);
  assert.equal(repository.getProducts("refrigerator").length, 25); assert.equal(repository.getProducts("vacuum").length, 22);
  assert.ok(repository.getProducts("tv").every((product) => product.categoryId === "tv"), "Repository 상품군 격리");
  assert.ok(catalogProducts.every((product) => product.source === "real"), "활성 카탈로그는 real·mock을 섞지 않음");
  const realTv = repository.getProducts("tv")[0];
  assert.equal(repository.getProductById(realTv.id)?.modelNumber, realTv.modelNumber, "getProductById는 실제 상품을 조회");
  assert.equal(repository.findProductByModelNumber(` ${realTv.modelNumber.toLowerCase()} `)?.id, realTv.id, "실제 모델번호 조회는 공백·대소문자를 정규화");
  const realAirProduct = { ...mockProducts[0], id: "real-ac-01", modelNumber: "REAL-AC-01", source: "real", dataStatus: "unverified", priceHistory: [] };
  const mixedCatalog = buildCatalogProducts(mockProducts, [realAirProduct]);
  const mixedRepository = new StaticProductRepository(mixedCatalog);
  assert.deepEqual(mixedRepository.getProducts("air-conditioner").map((product) => product.id), ["real-ac-01"], "실제 상품이 있으면 해당 카테고리는 real만 사용");
  assert.ok(mixedRepository.getProducts("tv").every((product) => product.source === "mock"), "실제 상품이 없는 카테고리는 mock fallback");
  assert.ok(mixedRepository.getProducts("air-conditioner").every((product) => product.source === "real"), "한 카테고리 안에 real·mock 혼합 금지");
  assert.equal(mixedRepository.getProductById("real-ac-01")?.source, "real", "getProductById는 real 상품을 조회");
  assert.equal(mixedRepository.getProductById("tv-google-55")?.source, "mock", "getProductById는 fallback mock 상품도 조회");
  assert.deepEqual(validateProductData(mockProducts, [realAirProduct]), [], "빈 priceHistory 실제 상품도 유효");
  const legacyWeaknessProduct = { ...realAirProduct, id: "legacy-weakness", modelNumber: "LEGACY-WEAKNESS", weaknesses: [] };
  assert.ok(validateProductData([], [legacyWeaknessProduct]).some((error) => error.includes("legacy-weakness") && error.includes("weaknesses")), "validator가 제거된 weaknesses를 상품 id와 함께 보고");
  const legacyAirSpecProduct = { ...realAirProduct, id: "legacy-air-spec", modelNumber: "LEGACY-AIR-SPEC", specs: { ...realAirProduct.specs, officialInstallation: null } };
  assert.ok(validateProductData([], [legacyAirSpecProduct]).some((error) => error.includes("legacy-air-spec") && error.includes("specs.officialInstallation")), "validator가 제거된 에어컨 스펙을 상품 id와 함께 보고");
  const legacyTvRebateProduct = { ...REAL_TV_PRODUCTS[0], id: "legacy-tv-rebate", modelNumber: "LEGACY-TV-REBATE", specs: { ...REAL_TV_PRODUCTS[0].specs, rebateEligible: null } };
  assert.ok(validateProductData([], [legacyTvRebateProduct]).some((error) => error.includes("legacy-tv-rebate") && error.includes("specs.rebateEligible")), "validator가 제거된 TV rebateEligible을 상품 id와 함께 보고");
  const malformedHistoryProduct = { ...realAirProduct, id: "malformed-history", modelNumber: "MALFORMED-HISTORY", priceHistory: [{ date: "bad-date", lowestPrice: -1 }] };
  const malformedHistoryErrors = validateProductData([], [malformedHistoryProduct]);
  assert.ok(malformedHistoryErrors.some((error) => error.includes("malformed-history") && error.includes("priceHistory[0].date")) && malformedHistoryErrors.some((error) => error.includes("malformed-history") && error.includes("priceHistory[0].lowestPrice")), "잘못된 가격 이력은 정확한 상품 id·필드로 보고");
  assert.ok(validateProductData(mockProducts, [{ ...realAirProduct, id: "tv-google-55" }]).some((error) => error.includes("id가")), "중복 id 검출");
  assert.ok(validateProductData(mockProducts, [{ ...realAirProduct, modelNumber: "MV-G55" }]).some((error) => error.includes("modelNumber")), "중복 모델번호 검출");
  assert.ok(validateProductData(mockProducts, [{ ...realTv, specs: { ...realTv.specs, os: "invalid-os" } }]).some((error) => error.includes(`${realTv.id}: specs.os`)), "잘못된 카테고리 스키마는 정확한 상품·필드를 보고");
  const realTvResult = rankTvs(repository.getProducts("tv"), tvAnswers);
  assert.ok(realTvResult.recommendations.length > 0 && realTvResult.recommendations.every(({ product }) => product.dataStatus === "unverified"), "unverified 실제 상품도 추천 대상");
  const discontinuedTv = { ...realTv, id: `${realTv.id}-discontinued`, modelNumber: `${realTv.modelNumber}-DISCONTINUED`, dataStatus: "discontinued" };
  assert.ok(rankTvs([realTv, discontinuedTv], tvAnswers).excludedProducts.some(({ productId, reasons }) => productId === discontinuedTv.id && reasons.includes("판매 중단 상품")), "discontinued 상품은 일반 추천에서 제외");
  const representativeAir = rankAirConditioners(repository.getProducts("air-conditioner"), { "airConditioner.type": "wall", "airConditioner.actualCoolingArea": 1, "airConditioner.dailyUsage": "unknown", "airConditioner.valuePriority": "balanced", "airConditioner.budget": "none" });
  const representativeRefrigerator = rankRefrigerators(repository.getProducts("refrigerator"), { ...refrigeratorAnswers, "refrigerator.budget": 10_000_000 });
  const representativeVacuum = rankVacuums(repository.getProducts("vacuum"), { ...vacuumBase, "vacuum.powerType": "wireless-value", "vacuum.budget": 10_000_000 });
  assert.ok(representativeAir.recommendations.length > 0 && realTvResult.recommendations.length > 0 && representativeRefrigerator.recommendations.length > 0 && representativeVacuum.recommendations.length > 0, "각 실제 카테고리에서 일치 조건은 내부 결과를 생성");
  assert.ok(optimizedListSource.includes("catalogSource") && optimizedListSource.includes('isReal ? "REAL" : "MOCK"') && !optimizedListSource.includes("MOIT 내부 DB · MOCK"), "내부 결과 출처 배지는 활성 카탈로그에서 유도");
  assert.ok(optimizedListSource.includes("실제 상품 데이터") && optimizedListSource.includes("내부 더미 상품"), "REAL 빈 상태는 더미 표현을 쓰지 않고 mock fallback 문구는 보존");
  const realRecommendation = realTvResult.recommendations[0];
  const realFavoriteDraft = createFavoriteDraft({ userId: "real-user", categoryId: "tv", selected: { source: "internal", recommendation: realRecommendation }, naverItems: [] });
  assert.equal(realFavoriteDraft.productId, realRecommendation.product.id, "실제 상품 즐겨찾기는 동일한 product id 사용");
  const realDetail = combineProductDetail({ source: "internal", recommendation: realRecommendation });
  assert.deepEqual(realDetail.priceHistory, realRecommendation.product.priceHistory, "실제 상품 상세는 같은 identity의 가격 이력을 조회");
  const realGradeInput = startPurchaseGradeDiagnosis({ selected: { source: "internal", recommendation: realRecommendation }, recommendations: realTvResult.recommendations, userCriteria: tvAnswers });
  assert.equal(realGradeInput.selectedProduct.recommendation.product.id, realRecommendation.product.id, "구매등급진단은 실제 상품 identity를 유지");

  const registry = await load("/src/app/features/chat-flow/registry/loadFlows.ts");
  assert.ok(["air-conditioner", "tv", "refrigerator", "vacuum", "phone", "internet", "iptv", "bundle"].every((id) => registry.getFlowModule(id)), "전체 flow registry 검증");

  console.log("smart-shopping focused checks: passed");
} finally {
  await server.close();
}
