import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";

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
  const runtime = await load("/src/app/features/chat-flow/engine/flowRuntime.ts");
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

  const { summarizePriceHistory } = await load("/src/app/features/product-catalog/core/priceHistory.ts");
  assert.deepEqual(summarizePriceHistory(120, [{ date: "a", lowestPrice: 100 }, { date: "b", lowestPrice: 140 }]), { allTimeLow: 100, averagePrice: 120, differenceFromLow: 20, percentAboveLow: 20 }, "가격 이력 계산");

  const { PRODUCT_DETAIL_ACTIONS } = await load("/src/app/features/smart-shopping/actions/productDetailActions.ts");
  assert.deepEqual(PRODUCT_DETAIL_ACTIONS.map((item) => item.label), ["예상 세일 달 제안", "다른 제품 추천", "싸게 구매하는 법 TIP", "기타 · 직접 질문 입력", "목록으로 돌아가기", "다음 단계로"], "상세 하단 액션 순서");
  const detailViewSource = await readFile("src/app/features/smart-shopping/recommendation/ProductDetailView.tsx", "utf8");
  assert.ok(!detailViewSource.includes("ArrowLeft") && !detailViewSource.includes("BackButton"), "상세 최상단 목록 복귀 버튼 제거");
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
  const { endSmartShoppingChat } = await load("/src/app/features/smart-shopping/next-actions/endSmartShoppingChat.ts");
  let didEndChat = false; endSmartShoppingChat(() => { didEndChat = true; }); assert.equal(didEndChat, true, "동일 종료 함수 재사용");

  const { productQuestionRoute } = await load("/server/productQuestionRoute.ts");
  let productQuestionHandler;
  productQuestionRoute({}).configureServer({ middlewares: { use: (handler) => { productQuestionHandler = handler; } } });
  let questionStatus = 0; let questionBody = "";
  await productQuestionHandler({ url: "/api/ai/product-question", method: "POST" }, { setHeader: () => {}, end: (body) => { questionBody = body; }, set statusCode(value) { questionStatus = value; } }, () => {});
  assert.equal(questionStatus, 503); assert.equal(JSON.parse(questionBody).code, "OPENAI_API_NOT_CONFIGURED", "OpenAI 키 미설정 안내");

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

  console.log("smart-shopping focused checks: passed");
} finally {
  await server.close();
}
