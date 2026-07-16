import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  const tvAnswers = { "tv.os": "any", "tv.screenSize": "55", "tv.panel": "any", "tv.useDefaults": "yes", "tv.hdrRequired": false, "tv.rebate": "any", "tv.budget": 2_000_000 };
  const tvResult = rankTvs(TV_PRODUCTS, tvAnswers);
  assert.ok(tvResult.excludedProducts.some(({ productId, reasons }) => productId === "tv-basic-55" && reasons.some((reason) => reason.includes("4K"))), "TV 4K 필터");
  assert.ok(tvResult.excludedProducts.some(({ productId, reasons }) => productId === "tv-android-43" && reasons.some((reason) => reason.includes("보증"))), "TV 보증 필터");
  assert.ok(tvResult.recommendations.every((item, index, list) => index === 0 || list[index - 1].score >= item.score), "필수 필터 후 선호 점수 정렬");

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
  assert.ok(twoInOneState.messages.some(({ text }) => text?.includes("주 실내기 냉방면적 15평") && text.includes("ratedCoolingAreaPyeong")), "2in1은 기존 필드를 주 실내기 비교값으로 설명");
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
  assert.ok(airFlowState.result.recommendations.length > 0 && airFlowState.result.recommendations.every(({ product, verificationNeeded }) => product.source === "real" && !verificationNeeded), "실제 에어컨을 설치·환급 확인 후보로 분류하지 않음");
  assert.equal(airFlowState.answers["airConditioner.dailyUsage"], "4to8"); assert.equal(airFlowState.answers["airConditioner.valuePriority"], "balanced", "사용 시간·가성비 우선순위 state 보존");
  assert.equal(airFlowState.result.metadata.category, "air-conditioner", "에어컨 전용 결과 사용");
  assert.strictEqual(runtime.undoLatestFlowAnswer(airModule, airFlowState), airFlowState, "추천 생성 뒤 undo 비활성");

  const tvModule = getFlowModule("tv");
  let tvFlowState = runtime.createInitialFlowState(tvModule);
  assert.equal(tvFlowState.currentStepId, "tv-os", "TV 전용 첫 질문");
  for (const [value, label] of [["any", "상관없음"], ["55", "55인치"], ["any", "상관없음"], ["yes", "기본 기준 적용"], [false, "선호"], ["any", "상관없음"], [2_000_000, "2,000,000원"], [true, "추천 시작"]]) {
    tvFlowState = submit(tvModule, tvFlowState, value, label);
  }
  assert.equal(tvFlowState.checkpoints.length, 0, "TV flow에는 condition undo를 활성화하지 않음");
  for (const id of ["tv", "refrigerator", "vacuum"]) assert.equal(getFlowModule(id).definition.enableConditionUndo, undefined, `${id} flow undo 비활성 유지`);
  assert.ok(tvFlowState.messages.some(({ text }) => text?.includes("적용 조건: 55인치")), "TV 조건 요약에 전용 answer 전달");
  assert.ok(tvFlowState.result.recommendations.length > 0 && tvFlowState.result.recommendations.every(({ product }) => product.source === "real"), "TV flow가 실제 카탈로그를 사용");
  assert.equal(tvFlowState.result.metadata.category, "tv", "TV 전용 결과 사용");

  const phoneModule = getFlowModule("phone");
  let phoneFlowState = runtime.createInitialFlowState(phoneModule);
  for (const [value, label] of [["skt", "SKT"], [69_000, "69,000원"], ["direct-input", "직접 입력"], ["슬림 요금제", "슬림 요금제"], ["5g", "5G"], ["normal", "일반"], ["mid", "10GB~30GB"], [["unknown"], "잘 모르겠음"], ["rec-mock-1", "추천 요금제"]]) {
    phoneFlowState = submit(phoneModule, phoneFlowState, value, label);
  }
  assert.equal(phoneFlowState.currentStepId, "phone-ask-grade", "생활비 중간 결과 후 다음 단계 유지");
  assert.equal(phoneFlowState.messages.find(({ type }) => type === "result")?.result?.metadata?.category, "phone", "생활비 결과 snapshot 보존");
  phoneFlowState = submit(phoneModule, phoneFlowState, "yes", "YES");
  assert.equal(phoneFlowState.currentStepId, "phone-ask-share", "구매등급 결과 후 생활비 후속 질문 유지");
  assert.deepEqual(phoneFlowState.messages.filter(({ type }) => type === "result").map(({ result }) => result?.metadata?.category), ["phone", "phone-grade"], "연속 생활비 결과가 서로 덮이지 않음");
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
  await proxyHandler({ url: "/api/shopping/search?query=TV", method: "GET" }, { setHeader: () => {}, end: (body) => { proxyBody = body; }, set statusCode(value) { proxyStatus = value; } }, () => {});
  assert.equal(proxyStatus, 503); assert.equal(JSON.parse(proxyBody).code, "NAVER_API_NOT_CONFIGURED", "API 키 미설정 상태 정규화");
  assert.ok(airResult.recommendations.length > 0, "네이버 실패와 무관하게 내부 목록 유지");

  const { getRecommendedCapacityRange } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/criteria.ts");
  assert.deepEqual(getRecommendedCapacityRange(2), { maxPeople: 2, minLiters: 300, maxLiters: 500 }, "1~2인 용량 추천");
  assert.deepEqual(getRecommendedCapacityRange(4), { maxPeople: 4, minLiters: 600, maxLiters: 800 }, "3~4인 용량 추천");

  const { vacuumFlow } = await load("/src/app/features/chat-flow/flows/appliances/vacuum/flow.ts");
  const vacuumModule = { id: "vacuum", categoryId: "appliances", definition: vacuumFlow, buildResult: () => ({}) };
  let vacuumState = runtime.createInitialFlowState(vacuumModule);
  vacuumState = runtime.submitFlowAnswer(vacuumModule, vacuumState, { value: "wired-major", displayValue: "대기업 유선" });
  vacuumState = runtime.submitFlowAnswer(vacuumModule, vacuumState, { value: "aw", displayValue: "200AW 이상" });
  assert.equal(vacuumState.currentStepId, "vc-hepa", "유선은 배터리·거치대 질문 건너뛰기");
  assert.equal(vacuumState.answers["vacuum.replaceableBatteryRequired"], undefined);
  const detailedConversationState = runtime.appendSupplementalFlowMessage(vacuumState, { sender: "user", text: "싸게 구매하는 법 TIP", type: "text" });
  const detailedConversationReply = runtime.appendSupplementalFlowMessage(detailedConversationState, { sender: "ai", text: "제공된 정보만 기준으로 안내해요.", type: "text" });
  assert.equal(detailedConversationReply.supplementalMessages.length, 2, "상세 후속 대화도 기존 ChatFlowMessage 형식 사용");

  const { VACUUM_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/vacuum/products.ts");
  const { rankVacuums } = await load("/src/app/features/chat-flow/flows/appliances/vacuum/rankProducts.ts");
  const vacuumBase = { "vacuum.powerType": "wireless-value", "vacuum.hepaRequired": false, "vacuum.softRollerRequired": false, "vacuum.weight": "any", "vacuum.budget": 1_000_000 };
  const awResult = rankVacuums(VACUUM_PRODUCTS, { ...vacuumBase, "vacuum.suctionStandard": "aw" });
  const paResult = rankVacuums(VACUUM_PRODUCTS, { ...vacuumBase, "vacuum.suctionStandard": "pa" });
  assert.ok(awResult.recommendations.every(({ product }) => product.specs.suctionAw !== undefined && product.specs.suctionAw >= 200), "AW 독립 판정");
  assert.deepEqual(paResult.recommendations.map(({ product }) => product.id), ["vc-pa-30000"], "Pa 독립 판정");

  const { summarizePriceHistory, summarizeStoredPriceHistory, getValidPriceHistory } = await load("/src/app/features/product-catalog/core/priceHistory.ts");
  const metricHistory = [{ date: "2026-07-13", lowestPrice: 140 }, { date: "2026-05-01", lowestPrice: 100 }];
  assert.deepEqual(summarizePriceHistory(120, metricHistory), { allTimeLow: 100, averagePrice: 120, differenceFromLow: 20, percentAboveLow: 20 }, "가격 이력 계산");
  assert.deepEqual(summarizeStoredPriceHistory(1_200, [{ date: "2026-01-01", lowestPrice: 800 }, { date: "2026-02-01", lowestPrice: 1_000 }]), { allTimeLow: 800, averagePrice: 900, differenceFromLow: 400, percentAboveLow: 50 }, "현재가·최저가·평균가·차액·비율 정확성");
  assert.equal(summarizeStoredPriceHistory(1_200, []), null, "빈 가격 이력은 역사 지표를 만들지 않음");
  assert.deepEqual(getValidPriceHistory(metricHistory).map(({ date }) => date), ["2026-05-01", "2026-07-13"], "저장 날짜 기준 오름차순 정렬");

  const { default: PriceHistoryChart, buildPriceHistoryChartPoints, formatPriceHistoryAxisDate, getDefaultPriceHistoryPoint, resolvePriceHistoryDisplayIndex, PRICE_HISTORY_CHART_LAYOUT } = await load("/src/app/features/smart-shopping/product-detail/PriceHistoryChart.tsx");
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
  ], new Date("2026-07-10T12:00:00+09:00")), { date: "2026-07-09", lowestPrice: 970_000 }, "오늘 이전 중 가장 최신 유효 이력을 기본 강조");
  assert.deepEqual(getDefaultPriceHistoryPoint([
    { date: "2026-07-15", lowestPrice: 950_000 },
    { date: "2026-07-12", lowestPrice: 970_000 },
  ], new Date("2026-07-10T12:00:00+09:00")), { date: "2026-07-12", lowestPrice: 970_000 }, "모든 이력이 미래면 가장 가까운 미래 이력을 기본 강조");
  assert.equal(formatPriceHistoryAxisDate("2026-07-15"), "7.15.", "X축 날짜는 연도 없는 M.D. 형식");
  assert.equal(resolvePriceHistoryDisplayIndex(2, 0, null), 0, "hover 강조가 기본 최신 강조보다 우선");
  assert.equal(resolvePriceHistoryDisplayIndex(2, null, 1), 1, "키보드 focus 강조가 기본 최신 강조보다 우선");
  assert.equal(resolvePriceHistoryDisplayIndex(2, null, null), 2, "hover/focus 종료 시 기본 최신 강조 복원");
  const chartBaseline = PRICE_HISTORY_CHART_LAYOUT.height - PRICE_HISTORY_CHART_LAYOUT.padding.bottom;
  assert.ok(PRICE_HISTORY_CHART_LAYOUT.axisLabelY - chartBaseline >= 36, "플롯 기준선과 X축 날짜 사이의 충분한 하단 간격");
  const emptyChartMarkup = renderToStaticMarkup(React.createElement(PriceHistoryChart, { productId: "empty-product", history: [] }));
  const singleChartMarkup = renderToStaticMarkup(React.createElement(PriceHistoryChart, { productId: "single-product", history: [{ date: "2026-07-13", lowestPrice: 970_600 }] }));
  const manyChartMarkup = renderToStaticMarkup(React.createElement(PriceHistoryChart, { productId: "many-product", history: storedChartHistory }));
  assert.ok(emptyChartMarkup.includes("저장된 가격 이력이 없습니다."), "빈 차트의 진실한 empty state");
  assert.equal((singleChartMarkup.match(/data-price-point/g) ?? []).length, 1, "한 점 차트는 가상 점을 추가하지 않음");
  assert.ok(singleChartMarkup.includes("2026-07-13 970,600원"), "한 점에도 정확한 날짜·가격 접근성 정보");
  assert.equal((manyChartMarkup.match(/data-price-point/g) ?? []).length, storedChartHistory.length, "축 라벨 간격과 무관하게 저장된 모든 점 유지");
  assert.ok(manyChartMarkup.includes("data-price-area=\"true\"") && manyChartMarkup.includes("opacity=\"0.12\""), "녹색 선 아래의 절제된 투명 영역 채움");
  assert.ok(manyChartMarkup.includes("data-default-price-label=\"true\"") && manyChartMarkup.includes("970,600원") && manyChartMarkup.includes("data-price-highlight-halo=\"true\""), "호버 전에도 기본 최신 가격 라벨과 halo 표시");
  assert.ok(manyChartMarkup.includes(">5.1.<") && manyChartMarkup.includes(">7.13.<") && !manyChartMarkup.match(/<text[^>]*>2026-/), "X축은 첫·마지막 M.D. 라벨을 사용하고 연도를 숨김");

  const { PRODUCT_DETAIL_ACTIONS } = await load("/src/app/features/smart-shopping/actions/productDetailActions.ts");
  assert.deepEqual(PRODUCT_DETAIL_ACTIONS.map((item) => item.label), ["예상 세일 달 제안", "다른 제품 추천", "싸게 구매하는 법 TIP", "기타 · 직접 질문 입력", "목록으로 돌아가기", "다음 단계로"], "상세 하단 액션 순서");
  const detailViewSource = await readFile("src/app/features/smart-shopping/recommendation/ProductDetailView.tsx", "utf8");
  const detailSectionsSource = await readFile("src/app/features/smart-shopping/product-detail/ProductDetailDataSections.tsx", "utf8");
  const priceChartSource = await readFile("src/app/features/smart-shopping/product-detail/PriceHistoryChart.tsx", "utf8");
  const recommendationCardSource = await readFile("src/app/components/features/chat/ProductRecommendationCard.tsx", "utf8");
  assert.ok(!detailViewSource.includes("ArrowLeft") && !detailViewSource.includes("BackButton"), "상세 최상단 목록 복귀 버튼 제거");
  assert.ok(!detailViewSource.includes("MOCK DATA") && !detailViewSource.includes("REAL DATA") && !recommendationCardSource.includes("MOCK DATA") && !recommendationCardSource.includes("REAL DATA") && !detailViewSource.includes("모잇 DB 모델 매칭"), "상품 상세 데이터 출처 배지 제거");
  assert.ok(detailSectionsSource.includes(">AI 리뷰 요약<") && !detailSectionsSource.includes("더미 AI 리뷰 요약"), "상세 섹션 제목은 정확히 AI 리뷰 요약");
  assert.ok(!detailSectionsSource.includes("주의점") && !detailViewSource.includes("주의점") && !recommendationCardSource.includes("주의점"), "모든 상세에서 주의점 카드 제거");
  assert.ok(detailSectionsSource.indexOf("data-strengths-card") < detailSectionsSource.indexOf("<PriceHistoryChart"), "장점 왼쪽·가격 차트 오른쪽 공통 행");
  assert.equal((detailSectionsSource.match(/<PriceHistoryChart/g) ?? []).length, 1, "상세의 가격 그래프는 한 번만 렌더링");
  assert.ok(priceChartSource.includes('"tooltip"') && priceChartSource.includes("displayed.date") && priceChartSource.includes("won(displayed.lowestPrice)") && priceChartSource.includes("onMouseEnter") && priceChartSource.includes("onFocus"), "호버·키보드 포커스 tooltip의 정확한 전체 날짜·원화 가격");
  assert.ok(priceChartSource.includes("setHoveredIndex(index)") && priceChartSource.includes("setFocusedIndex(index)") && priceChartSource.includes("onMouseLeave={() => setHoveredIndex(null)}") && priceChartSource.includes("onBlur={() => setFocusedIndex(null)"), "hover/focus가 일시 강조를 우선하고 각각 종료 시 기본 강조로 복귀");
  assert.ok(priceChartSource.includes("points.map") && priceChartSource.includes("labelInterval") && priceChartSource.includes("[productId, pointIdentity]") && priceChartSource.includes("text-xs\">{formatPriceHistoryAxisDate"), "모든 점 유지·축 라벨 간격·상품 전환 초기화·읽기 쉬운 날짜 크기");
  const { REFRIGERATOR_PRODUCTS } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/products.ts");
  const { default: ProductRecommendationCard } = await load("/src/app/components/features/chat/ProductRecommendationCard.tsx");
  const { default: ProductDetailView } = await load("/src/app/features/smart-shopping/recommendation/ProductDetailView.tsx");
  const detailRecommendation = (product) => ({ product, score: 90, matchedCoreCriteria: ["대표 조건 충족"], unmatchedOrUnknownCriteria: [], recommendationReasons: ["테스트 추천 이유"], preferenceMatchCount: 1, dataCompleteness: 100 });
  const representativeDetailProducts = [AIR_CONDITIONER_PRODUCTS[0], TV_PRODUCTS[0], REFRIGERATOR_PRODUCTS[0], VACUUM_PRODUCTS[0]];
  for (const product of representativeDetailProducts) {
    const markup = renderToStaticMarkup(React.createElement(ProductRecommendationCard, { recommendation: detailRecommendation(product) }));
    assert.ok(markup.includes("AI 리뷰 요약") && markup.includes(product.aiReviewSummary), `${product.categoryId} 저장 aiReviewSummary 렌더링`);
    assert.ok(!markup.includes("MOCK DATA") && !markup.includes("REAL DATA") && !markup.includes("주의점"), `${product.categoryId} 상세 출처 배지·주의점 없음`);
    assert.ok(markup.indexOf('data-strengths-card="true"') < markup.indexOf('data-price-history-card="true"'), `${product.categoryId} 장점 왼쪽·차트 오른쪽 순서`);
    assert.equal((markup.match(/역대 최저가 추이/g) ?? []).length, 1, `${product.categoryId} 상세 그래프 중복 없음`);
  }
  const airDetailMarkup = renderToStaticMarkup(React.createElement(ProductRecommendationCard, { recommendation: detailRecommendation(AIR_CONDITIONER_PRODUCTS[0]) }));
  const tvDetailMarkup = renderToStaticMarkup(React.createElement(ProductRecommendationCard, { recommendation: detailRecommendation(TV_PRODUCTS[0]) }));
  assert.ok(airDetailMarkup.includes("구매 전 확인") && airDetailMarkup.includes("설치비 확인 필요"), "에어컨 상세의 공통 구매 전 설치비 알림");
  assert.ok(!tvDetailMarkup.includes("설치비 확인 필요") && tvDetailMarkup.includes("미충족·확인 필요"), "다른 상품군에는 에어컨 설치비 알림 미적용");
  const unmatchedNaverAirMarkup = renderToStaticMarkup(React.createElement(ProductDetailView, { categoryId: "air-conditioner", selected: { source: "naver", product: naverItems[1] }, internalRecommendations: [], interactive: false }));
  assert.ok(unmatchedNaverAirMarkup.includes("구매 전 확인") && unmatchedNaverAirMarkup.includes("설치비 확인 필요"), "내부 매칭 없는 네이버 에어컨 상세도 공통 설치비 알림");
  const diagnosisResultSource = await readFile("src/app/components/features/chat/DiagnosisResultCard.tsx", "utf8");
  const chatScreenSource = await readFile("src/app/components/features/chat/ChatScreen.tsx", "utf8");
  const chatMessageSource = await readFile("src/app/components/features/chat/ChatMessage.tsx", "utf8");
  const chatFlowInputSource = await readFile("src/app/components/features/chat/ChatFlowInput.tsx", "utf8");
  const { default: SmartShoppingTimeline, SmartShoppingTimelineRow } = await load("/src/app/features/smart-shopping/timeline/SmartShoppingTimeline.tsx");
  const assistantRailMarkup = renderToStaticMarkup(React.createElement(SmartShoppingTimelineRow, { kind: "assistant" }, React.createElement("span", null, "assistant")));
  const userRailMarkup = renderToStaticMarkup(React.createElement(SmartShoppingTimelineRow, { kind: "user" }, React.createElement("span", null, "user")));
  const wideRailMarkup = renderToStaticMarkup(React.createElement(SmartShoppingTimelineRow, { kind: "wide" }, React.createElement("span", null, "wide")));
  const alignmentTimeline = [
    { id: "user-before", type: "user-action", text: "상품 선택", timestamp: "오전 10:00" },
    { id: "assistant-before", type: "assistant-text", text: "상세를 보여드릴게요.", timestamp: "오전 10:01" },
    { id: "wide-action", type: "action-group", group: "detail", isActive: false },
    { id: "user-after", type: "user-action", text: "예상 세일 달 제안", timestamp: "오전 10:02" },
    { id: "assistant-after", type: "assistant-text", text: "세일 달 답변", timestamp: "오전 10:03" },
    { id: "wide-action-later", type: "action-group", group: "detail", isActive: false },
    { id: "user-later", type: "user-text", text: "직접 질문", timestamp: "오전 10:04" },
  ];
  const timelineRailProps = { timeline: alignmentTimeline, questionLoading: false, questionError: "", onSelectRecommendation: () => {}, onSelectNaverProduct: () => {}, onRetryNaver: () => {}, onDetailAction: () => {}, onBackToList: () => {}, onNextStep: () => {}, onQuestionSubmit: () => {}, onQuestionRetry: () => {}, onQuestionCancel: () => {}, onNextAction: () => {}, onCancelPurchaseLink: () => {}, onSavePriceAlert: () => {}, onCancelPriceAlert: () => {}, catalogProducts: [], isFavorite: () => false, onToggleFavorite: () => {} };
  const alignedTimelineMarkup = renderToStaticMarkup(React.createElement(SmartShoppingTimeline, timelineRailProps));
  assert.ok(diagnosisResultSource.includes("result.recommendations") && diagnosisResultSource.includes("RecommendationSelectionView"), "가전 결과를 스마트쇼핑 추천 목록으로 연결");
  assert.ok(diagnosisResultSource.includes("PhoneDiagnosisReport") && diagnosisResultSource.includes("InternetDiagnosisReport") && diagnosisResultSource.includes("IptvDiagnosisReport"), "생활비 전용 결과 화면 보존");
  assert.ok(chatScreenSource.includes("buildSmartShoppingGreeting") && chatScreenSource.includes("onCreatePriceAlert") && chatScreenSource.includes("onEndSmartShoppingChat"), "스마트쇼핑 인사·알람·종료 경계 연결");
  assert.ok(chatScreenSource.includes('isSmartShoppingResult ? "w-full min-w-0 self-stretch" : "w-full self-start pl-11"'), "스마트쇼핑 결과만 기존 결과용 pl-11 중첩에서 분리하고 생활비 결과 들여쓰기는 보존");
  assert.ok(assistantRailMarkup.includes('data-timeline-row="assistant"') && assistantRailMarkup.includes("justify-start"), "모든 assistant 턴은 공용 왼쪽 레일");
  assert.ok(userRailMarkup.includes('data-timeline-row="user"') && userRailMarkup.includes("justify-end"), "모든 user 턴은 공용 오른쪽 레일");
  assert.ok(wideRailMarkup.includes('data-timeline-row="wide"') && !wideRailMarkup.includes("justify-end") && !wideRailMarkup.includes("justify-start"), "넓은 카드 행은 메시지 정렬 부모와 독립");
  assert.equal((alignedTimelineMarkup.match(/data-timeline-row="user"/g) ?? []).length, 3, "상품 선택 전후·여러 액션 뒤의 모든 사용자 턴이 같은 오른쪽 행 사용");
  assert.equal((alignedTimelineMarkup.match(/data-timeline-row="assistant"/g) ?? []).length, 2, "상세·액션 뒤의 모든 assistant 턴이 같은 왼쪽 행 사용");
  assert.equal((alignedTimelineMarkup.match(/data-chat-assistant-logo="true"/g) ?? []).length, 2, "후속 assistant 답변의 MOIT 로고가 동일한 왼쪽 레일에 유지");
  assert.equal((alignedTimelineMarkup.match(/data-timeline-row="wide"/g) ?? []).length, 2, "여러 넓은 액션 카드가 후속 메시지 행과 형제 구조로 유지");
  for (const categoryId of ["air-conditioner", "tv", "refrigerator", "vacuum"]) {
    const categoryMarkup = renderToStaticMarkup(React.createElement(SmartShoppingTimeline, { ...timelineRailProps, timeline: alignmentTimeline.map((entry) => ({ ...entry, id: `${categoryId}-${entry.id}` })) }));
    assert.equal((categoryMarkup.match(/data-timeline-row="user"/g) ?? []).length, 3, `${categoryId} 공용 사용자 레일`);
    assert.equal((categoryMarkup.match(/data-timeline-row="assistant"/g) ?? []).length, 2, `${categoryId} 공용 assistant 레일`);
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
  assert.deepEqual(NEXT_ACTION_OPTIONS.map((item) => item.label), ["⭐구매등급진단⭐", "구매 링크 연결", "최저가 알람 설정", "제품 목록으로 돌아가기", "채팅 종료하기"], "다음 단계 선택 순서");
  assert.ok(NEXT_ACTION_OPTIONS[0].description && NEXT_ACTION_OPTIONS[0].primary, "구매등급진단 강조 설명");
  const { getVisibleNextActionOptions } = await load("/src/app/features/smart-shopping/next-actions/nextActionOptions.ts");
  assert.deepEqual(getVisibleNextActionOptions(false).map((item) => item.label), ["구매 링크 연결", "최저가 알람 설정", "제품 목록으로 돌아가기", "채팅 종료하기"], "등급 완료 후 공통 후속 액션 순서");
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
  assert.ok(favoriteButtonSource.includes('aria-pressed={isFavorite}') && favoriteButtonSource.includes("즐겨찾기에 추가") && favoriteButtonSource.includes("즐겨찾기에서 삭제"), "별 버튼 접근성 상태·안내");
  assert.ok(favoriteButtonSource.includes("event.stopPropagation()") && optimizedListSource.includes("FavoriteToggleButton") && naverListSource.includes("FavoriteToggleButton") && productDetailViewSource.includes("FavoriteToggleButton"), "별 클릭과 내부·네이버 상품 선택 이벤트 분리");
  assert.ok(optimizedListSource.includes("onClick={() => onSelect(item)}") && naverListSource.includes("onClick={() => onSelect(item)}"), "남은 내부·네이버 상품 카드 상세 선택 연결 유지");
  assert.ok(optimizedListSource.includes("disabled={!isActive}") && !optimizedListSource.includes("<FavoriteToggleButton isFavorite={isFavorite(item)} disabled={!isActive}"), "AI 목록의 과거 읽기 전용 상품 선택과 전역 즐겨찾기 토글을 분리");
  assert.ok(productRecommendationCardSource.includes("recommendation.score") && productRecommendationCardSource.includes("FavoriteToggleButton") && productDetailViewSource.includes("<NaverProductDetail") && productDetailViewSource.includes("onToggleFavorite={props.onToggleFavorite}"), "상세 카드의 점수 배지를 보존하고 내부·네이버 별 버튼 연결");
  assert.ok(timelineSource.includes("isFavorite={props.isFavorite(item.snapshot.selected)}") && timelineSource.includes("onToggleFavorite={() => props.onToggleFavorite(item.snapshot.selected)}"), "누적 상품 상세 snapshot은 제품 정보는 유지하고 현재 즐겨찾기 저장소 상태를 사용");
  const { toggleFavoriteWithoutSelecting } = await load("/src/app/features/favorites/FavoriteToggleButton.tsx");
  let propagationStopped = false; let favoriteToggled = false;
  toggleFavoriteWithoutSelecting({ stopPropagation: () => { propagationStopped = true; } }, () => { favoriteToggled = true; });
  assert.equal(propagationStopped, true, "별 클릭 이벤트 전파 차단"); assert.equal(favoriteToggled, true, "별 클릭 토글 실행");
  const { endSmartShoppingChat } = await load("/src/app/features/smart-shopping/next-actions/endSmartShoppingChat.ts");
  let didEndChat = false; endSmartShoppingChat(() => { didEndChat = true; }); assert.equal(didEndChat, true, "동일 종료 함수 재사용");

  const sessionModule = await load("/src/app/features/smart-shopping/session/smartShoppingSessionReducer.ts");
  const timelineSnapshots = await load("/src/app/features/smart-shopping/timeline/createTimelineSnapshot.ts");
  let shoppingSession = sessionModule.createSmartShoppingSession({ categoryId: "tv", criteria: tvAnswers });
  const loadingTimelineSnapshot = timelineSnapshots.createRecommendationSnapshot({ query: "TV 55", recommendations: tvResult.recommendations, catalogSource: "mock", naverItems: [], naverStatus: "loading", naverErrorMessage: "" });
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, loadingTimelineSnapshot) });
  const timelineSnapshot = timelineSnapshots.createRecommendationSnapshot({ query: "TV 55", recommendations: tvResult.recommendations, catalogSource: "mock", naverItems, naverStatus: "success", naverErrorMessage: "" });
  assert.equal(loadingTimelineSnapshot.snapshotId, timelineSnapshot.snapshotId, "동일 추천 결과의 안정적 snapshotId");
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, timelineSnapshot) });
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "recommendation-list").length, 1, "loading과 완료 snapshot을 단일 목록 item으로 교체");
  assert.equal(shoppingSession.timeline.find((item) => item.type === "recommendation-list").snapshot.naverStatus, "success", "단일 목록에 최신 네이버 상태 반영");
  const naverErrorSnapshot = timelineSnapshots.createRecommendationSnapshot({ query: "TV 55", recommendations: tvResult.recommendations, catalogSource: "mock", naverItems: [], naverStatus: "error", naverErrorMessage: "인증 실패" });
  const naverErrorSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, naverErrorSnapshot) });
  assert.equal(naverErrorSession.timeline.filter((item) => item.type === "recommendation-list").length, 1, "네이버 오류 snapshot도 목록 중복 없이 교체");
  assert.equal(naverErrorSession.timeline.find((item) => item.type === "recommendation-list").snapshot.recommendations.length, tvResult.recommendations.length, "네이버 오류에도 내부 추천 목록 유지");
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
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append", item: timelineSnapshots.createTextTimelineItem(shoppingSession.sessionId, "user-action", "제품 목록으로 돌아가기") });
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, shoppingSession.recommendationSnapshot) });
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "recommendation-list").length, 1, "목록 복귀 시 기존 추천 snapshot item 재사용");
  assert.equal(shoppingSession.timeline.at(-1).type, "recommendation-list", "재사용 목록을 현재 타임라인 끝의 활성 UI로 이동");
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "product-detail").length, 1, "목록 복귀 후 이전 상세 기록 유지");
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "assistant-text" && item.text === "예상 세일 달 제안 답변").length, 1, "목록 복귀 후 이전 후속 답변 유지");
  const refrigeratorSession = sessionModule.createSmartShoppingSession({ categoryId: "refrigerator", criteria: {} });
  assert.notEqual(shoppingSession.sessionId, refrigeratorSession.sessionId, "다른 소분류 세션 격리");
  const recommendationViewSource = await readFile("src/app/features/smart-shopping/recommendation/RecommendationSelectionView.tsx", "utf8");
  assert.ok(recommendationViewSource.includes("SmartShoppingTimeline") && recommendationViewSource.includes("session.recommendationSnapshot"), "타임라인 렌더링·목록 스냅샷 재사용");
  assert.ok(!recommendationViewSource.includes("onClearSupplementalMessages"), "단계 전환 시 보조 대화 초기화 제거");

  const { productQuestionRoute } = await load("/server/productQuestionRoute.ts");
  let productQuestionHandler;
  productQuestionRoute({}).configureServer({ middlewares: { use: (handler) => { productQuestionHandler = handler; } } });
  let questionStatus = 0; let questionBody = "";
  await productQuestionHandler({ url: "/api/ai/product-question", method: "POST" }, { setHeader: () => {}, end: (body) => { questionBody = body; }, set statusCode(value) { questionStatus = value; } }, () => {});
  assert.equal(questionStatus, 503); assert.equal(JSON.parse(questionBody).code, "OPENAI_API_NOT_CONFIGURED", "OpenAI 키 미설정 안내");

  const airState = runtime.createInitialFlowState(airModule);
  const freshVacuumState = runtime.createInitialFlowState(vacuumModule);
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
  assert.deepEqual(Object.fromEntries(["air-conditioner", "tv", "refrigerator", "vacuum"].map((categoryId) => [categoryId, realProducts.filter((product) => product.categoryId === categoryId).length])), { "air-conditioner": 17, tv: 17, refrigerator: 25, vacuum: 15 }, "네 실제 상품군 파일의 집계 수");
  assert.ok(realProducts.every((product) => product.source === "real" && product.categoryId && product.dataStatus !== "mock"), "실제 상품의 출처·카테고리 상태");
  assert.ok([...mockProducts, ...realProducts].every((product) => !("weaknesses" in product)), "모든 real/mock 상품에서 weaknesses 제거");
  assert.ok([...mockProducts, ...realProducts].filter((product) => product.categoryId === "air-conditioner").every((product) => ["basicInstallationIncluded", "officialInstallation", "rebateEligible"].every((field) => !(field in product.specs))), "모든 에어컨 real/mock specs에서 설치·환급 필드 제거");
  assert.deepEqual(validateProductData(mockProducts, realProducts), [], "weaknesses 없는 전체 real/mock 상품 검증 통과");
  const catalogTypesSource = await readFile("src/app/features/product-catalog/core/types.ts", "utf8");
  const airSpecsTypeSource = catalogTypesSource.slice(catalogTypesSource.indexOf("export interface AirConditionerSpecs"), catalogTypesSource.indexOf("export interface TvSpecs"));
  assert.ok(!catalogTypesSource.includes("weaknesses:") && !airSpecsTypeSource.includes("basicInstallationIncluded") && !airSpecsTypeSource.includes("officialInstallation") && !airSpecsTypeSource.includes("rebateEligible"), "공통 상품·에어컨 타입 스키마 정리");
  assert.deepEqual(catalogSourceByCategory, { "air-conditioner": "real", tv: "real", refrigerator: "real", vacuum: "real" }, "실제 데이터가 있는 카테고리는 real 선택");
  const repository = productRepository;
  assert.equal(repository.getProducts("air-conditioner").length, 17); assert.equal(repository.getProducts("tv").length, 17);
  assert.equal(repository.getProducts("refrigerator").length, 25); assert.equal(repository.getProducts("vacuum").length, 15);
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
  const malformedHistoryProduct = { ...realAirProduct, id: "malformed-history", modelNumber: "MALFORMED-HISTORY", priceHistory: [{ date: "bad-date", lowestPrice: -1 }] };
  const malformedHistoryErrors = validateProductData([], [malformedHistoryProduct]);
  assert.ok(malformedHistoryErrors.some((error) => error.includes("malformed-history") && error.includes("priceHistory[0].date")) && malformedHistoryErrors.some((error) => error.includes("malformed-history") && error.includes("priceHistory[0].lowestPrice")), "잘못된 가격 이력은 정확한 상품 id·필드로 보고");
  assert.ok(validateProductData(mockProducts, [{ ...realAirProduct, id: "tv-google-55" }]).some((error) => error.includes("id가")), "중복 id 검출");
  assert.ok(validateProductData(mockProducts, [{ ...realAirProduct, modelNumber: "MV-G55" }]).some((error) => error.includes("modelNumber")), "중복 모델번호 검출");
  assert.ok(validateProductData(mockProducts, [{ ...realTv, specs: { ...realTv.specs, os: "invalid-os" } }]).some((error) => error.includes(`${realTv.id}: specs.os`)), "잘못된 카테고리 스키마는 정확한 상품·필드를 보고");
  const realTvResult = rankTvs(repository.getProducts("tv"), tvAnswers);
  assert.ok(realTvResult.recommendations.length > 0 && realTvResult.recommendations.every(({ product }) => product.dataStatus === "unverified"), "unverified 실제 상품도 추천 대상");
  const discontinuedTv = { ...realTv, id: `${realTv.id}-discontinued`, modelNumber: `${realTv.modelNumber}-DISCONTINUED`, dataStatus: "discontinued" };
  assert.ok(rankTvs([realTv, discontinuedTv], { ...tvAnswers, "tv.useDefaults": "custom", "tv.fourKRequired": false, "tv.minimumWarranty": "any" }).excludedProducts.some(({ productId, reasons }) => productId === discontinuedTv.id && reasons.includes("판매 중단 상품")), "discontinued 상품은 일반 추천에서 제외");
  const { rankRefrigerators } = await load("/src/app/features/chat-flow/flows/appliances/refrigerator/rankProducts.ts");
  const representativeAir = rankAirConditioners(repository.getProducts("air-conditioner"), { "airConditioner.type": "wall", "airConditioner.actualCoolingArea": 1, "airConditioner.dailyUsage": "unknown", "airConditioner.valuePriority": "balanced", "airConditioner.budget": "none" });
  const representativeRefrigerator = rankRefrigerators(repository.getProducts("refrigerator"), { "refrigerator.doorType": "four-door-value", "refrigerator.capacityMode": "600-800", "refrigerator.useDefaults": "no", "refrigerator.metalRequired": false, "refrigerator.coolingRequired": false, "refrigerator.inverterRequired": false, "refrigerator.warrantyRequired": false, "refrigerator.freestandingRequired": false, "refrigerator.budget": 10_000_000 });
  const representativeVacuum = rankVacuums(repository.getProducts("vacuum"), { "vacuum.powerType": "wireless-value", "vacuum.suctionStandard": "unknown", "vacuum.replaceableBatteryRequired": false, "vacuum.standingDockRequired": false, "vacuum.hepaRequired": false, "vacuum.softRollerRequired": false, "vacuum.weight": "any", "vacuum.budget": 10_000_000 });
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
