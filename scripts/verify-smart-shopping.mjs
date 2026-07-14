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
  assert.equal(airFlowState.currentStepId, "ac-type", "에어컨 전용 첫 질문");
  airFlowState = submit(airModule, airFlowState, "wall", "벽걸이");
  airFlowState = submit(airModule, airFlowState, 16, "16평");
  assert.ok(airFlowState.messages.some(({ text }) => text?.includes("권장 정격 냉방 면적은 8평")), "에어컨 계산형 안내에 flat answer 전달");
  for (const [value, label] of [["recommended", "계산값 적용"], ["yes", "기본 기준 적용"], ["any", "상관없음"], ["any", "상관없음"], ["any", "상관없음"], [1_000_000, "1,000,000원"], [true, "추천 시작"]]) {
    airFlowState = submit(airModule, airFlowState, value, label);
  }
  assert.equal(airFlowState.completed, true, "에어컨 질문 흐름 완료");
  assert.deepEqual(airFlowState.result.recommendations.map(({ product, score }) => [product.id, score]), [["ac-pure-wall-10", 93]], "에어컨 필수 필터·점수·정렬 정상 브랜치 일치");
  assert.equal(airFlowState.result.metadata.category, "air-conditioner", "에어컨 전용 결과 사용");

  const tvModule = getFlowModule("tv");
  let tvFlowState = runtime.createInitialFlowState(tvModule);
  assert.equal(tvFlowState.currentStepId, "tv-os", "TV 전용 첫 질문");
  for (const [value, label] of [["any", "상관없음"], ["55", "55인치"], ["any", "상관없음"], ["yes", "기본 기준 적용"], [false, "선호"], ["any", "상관없음"], [2_000_000, "2,000,000원"], [true, "추천 시작"]]) {
    tvFlowState = submit(tvModule, tvFlowState, value, label);
  }
  assert.ok(tvFlowState.messages.some(({ text }) => text?.includes("적용 조건: 55인치")), "TV 조건 요약에 전용 answer 전달");
  assert.deepEqual(tvFlowState.result.recommendations.map(({ product, score }) => [product.id, score]), [["tv-google-55", 94], ["tv-cinema-65", 89], ["tv-big-75", 80]], "TV 필수 필터·점수·정렬 정상 브랜치 일치");
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

  const { summarizePriceHistory } = await load("/src/app/features/product-catalog/core/priceHistory.ts");
  assert.deepEqual(summarizePriceHistory(120, [{ date: "a", lowestPrice: 100 }, { date: "b", lowestPrice: 140 }]), { allTimeLow: 100, averagePrice: 120, differenceFromLow: 20, percentAboveLow: 20 }, "가격 이력 계산");

  const { PRODUCT_DETAIL_ACTIONS } = await load("/src/app/features/smart-shopping/actions/productDetailActions.ts");
  assert.deepEqual(PRODUCT_DETAIL_ACTIONS.map((item) => item.label), ["예상 세일 달 제안", "다른 제품 추천", "싸게 구매하는 법 TIP", "기타 · 직접 질문 입력", "목록으로 돌아가기", "다음 단계로"], "상세 하단 액션 순서");
  const detailViewSource = await readFile("src/app/features/smart-shopping/recommendation/ProductDetailView.tsx", "utf8");
  assert.ok(!detailViewSource.includes("ArrowLeft") && !detailViewSource.includes("BackButton"), "상세 최상단 목록 복귀 버튼 제거");
  const diagnosisResultSource = await readFile("src/app/components/features/chat/DiagnosisResultCard.tsx", "utf8");
  const chatScreenSource = await readFile("src/app/components/features/chat/ChatScreen.tsx", "utf8");
  assert.ok(diagnosisResultSource.includes("result.recommendations") && diagnosisResultSource.includes("RecommendationSelectionView"), "가전 결과를 스마트쇼핑 추천 목록으로 연결");
  assert.ok(diagnosisResultSource.includes("PhoneDiagnosisReport") && diagnosisResultSource.includes("InternetDiagnosisReport") && diagnosisResultSource.includes("IptvDiagnosisReport"), "생활비 전용 결과 화면 보존");
  assert.ok(chatScreenSource.includes("buildSmartShoppingGreeting") && chatScreenSource.includes("onCreatePriceAlert") && chatScreenSource.includes("onEndSmartShoppingChat"), "스마트쇼핑 인사·알람·종료 경계 연결");
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
  const loadingTimelineSnapshot = timelineSnapshots.createRecommendationSnapshot({ query: "TV 55", recommendations: tvResult.recommendations, naverItems: [], naverStatus: "loading", naverErrorMessage: "" });
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, loadingTimelineSnapshot) });
  const timelineSnapshot = timelineSnapshots.createRecommendationSnapshot({ query: "TV 55", recommendations: tvResult.recommendations, naverItems, naverStatus: "success", naverErrorMessage: "" });
  assert.equal(loadingTimelineSnapshot.snapshotId, timelineSnapshot.snapshotId, "동일 추천 결과의 안정적 snapshotId");
  shoppingSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, timelineSnapshot) });
  assert.equal(shoppingSession.timeline.filter((item) => item.type === "recommendation-list").length, 1, "loading과 완료 snapshot을 단일 목록 item으로 교체");
  assert.equal(shoppingSession.timeline.find((item) => item.type === "recommendation-list").snapshot.naverStatus, "success", "단일 목록에 최신 네이버 상태 반영");
  const naverErrorSnapshot = timelineSnapshots.createRecommendationSnapshot({ query: "TV 55", recommendations: tvResult.recommendations, naverItems: [], naverStatus: "error", naverErrorMessage: "인증 실패" });
  const naverErrorSession = sessionModule.smartShoppingSessionReducer(shoppingSession, { type: "append-recommendation-list", item: timelineSnapshots.createRecommendationListTimelineItem(shoppingSession.sessionId, naverErrorSnapshot) });
  assert.equal(naverErrorSession.timeline.filter((item) => item.type === "recommendation-list").length, 1, "네이버 오류 snapshot도 목록 중복 없이 교체");
  assert.equal(naverErrorSession.timeline.find((item) => item.type === "recommendation-list").snapshot.recommendations.length, tvResult.recommendations.length, "네이버 오류에도 내부 추천 목록 유지");
  const timelineSelected = { source: "internal", recommendation: tvResult.recommendations[0] };
  const productTimelineSnapshot = timelineSnapshots.createProductDetailSnapshot({ selected: timelineSelected, internalRecommendations: tvResult.recommendations, showAlternative: false });
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
  assert.equal(realProducts.length, 0, "초기 실제 상품 카탈로그는 비어 있음");
  assert.deepEqual(catalogSourceByCategory, { "air-conditioner": "mock", tv: "mock", refrigerator: "mock", vacuum: "mock" }, "실제 데이터가 없으면 전 카테고리 mock fallback");
  const repository = productRepository;
  assert.equal(repository.getProducts("air-conditioner").length, 5); assert.equal(repository.getProducts("tv").length, 5);
  assert.equal(repository.getProducts("refrigerator").length, 5); assert.equal(repository.getProducts("vacuum").length, 5);
  assert.ok(repository.getProducts("tv").every((product) => product.categoryId === "tv"), "Repository 상품군 격리");
  assert.ok(catalogProducts.every((product) => product.dataStatus === "mock" && product.source === "mock" && product.priceHistory.length >= 6 && product.imagePath.startsWith("/assets/products/mock/")), "20개 상품의 mock·가격·로컬 이미지 데이터");
  assert.equal(repository.getProductById("tv-google-55")?.modelNumber, "MV-G55", "getProductById는 fallback 상품을 조회");
  assert.equal(repository.findProductByModelNumber(" mv-g55 ")?.id, "tv-google-55", "모델번호 조회는 공백·대소문자를 정규화");
  const realAirProduct = { ...mockProducts[0], id: "real-ac-01", modelNumber: "REAL-AC-01", source: "real", dataStatus: "unverified", priceHistory: [] };
  const mixedCatalog = buildCatalogProducts(mockProducts, [realAirProduct]);
  const mixedRepository = new StaticProductRepository(mixedCatalog);
  assert.deepEqual(mixedRepository.getProducts("air-conditioner").map((product) => product.id), ["real-ac-01"], "실제 상품이 있으면 해당 카테고리는 real만 사용");
  assert.ok(mixedRepository.getProducts("tv").every((product) => product.source === "mock"), "실제 상품이 없는 카테고리는 mock fallback");
  assert.ok(mixedRepository.getProducts("air-conditioner").every((product) => product.source === "real"), "한 카테고리 안에 real·mock 혼합 금지");
  assert.equal(mixedRepository.getProductById("real-ac-01")?.source, "real", "getProductById는 real 상품을 조회");
  assert.equal(mixedRepository.getProductById("tv-google-55")?.source, "mock", "getProductById는 fallback mock 상품도 조회");
  assert.deepEqual(validateProductData(mockProducts, [realAirProduct]), [], "빈 priceHistory 실제 상품도 유효");
  assert.ok(validateProductData(mockProducts, [{ ...realAirProduct, id: "tv-google-55" }]).some((error) => error.includes("id가")), "중복 id 검출");
  assert.ok(validateProductData(mockProducts, [{ ...realAirProduct, modelNumber: "MV-G55" }]).some((error) => error.includes("modelNumber")), "중복 모델번호 검출");

  const registry = await load("/src/app/features/chat-flow/registry/loadFlows.ts");
  assert.ok(["air-conditioner", "tv", "refrigerator", "vacuum", "phone", "internet", "iptv", "bundle"].every((id) => registry.getFlowModule(id)), "전체 flow registry 검증");

  console.log("smart-shopping focused checks: passed");
} finally {
  await server.close();
}
