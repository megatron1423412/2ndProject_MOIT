import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const load = (path) => server.ssrLoadModule(path);

const firstAnswer = (step, answers) => {
  if (step.type === "single-choice") {
    const option = (step.optionsResolver?.(answers) ?? step.options)[0];
    return { value: option.value, displayValue: option.label };
  }
  if (step.type === "multi-choice") {
    const options = (step.optionsResolver?.(answers) ?? step.options).slice(0, step.minSelections ?? 1);
    return { value: options.map(({ value }) => value), displayValue: options.map(({ label }) => label).join(", ") };
  }
  if (step.type === "confirmation") return { value: true, displayValue: step.confirmLabel };
  if (step.type === "number-input") return { value: Math.max(step.min ?? 1, 1), displayValue: "1" };
  return { value: "테스트", displayValue: "테스트" };
};

const completeFlow = (runtime, module) => {
  let state = runtime.createInitialFlowState(module);
  let clickedSearch = false;
  for (let guard = 0; guard < 60 && !state.completed && !state.error; guard += 1) {
    const step = module.definition.steps.find(({ id }) => id === state.currentStepId);
    assert.ok(step && ["single-choice", "multi-choice", "confirmation", "number-input", "text-input"].includes(step.type), `${module.id}: 응답 가능한 현재 step`);
    const answer = firstAnswer(step, state.answers);
    if (typeof answer.displayValue === "string" && answer.displayValue.includes("시작")) clickedSearch = true;
    state = runtime.submitFlowAnswer(module, state, answer);
  }
  return { state, clickedSearch };
};

try {
  const runtime = await load("/src/app/features/chat-flow/engine/flowRuntime.ts");
  const registry = await load("/src/app/features/chat-flow/registry/loadFlows.ts");
  const completedByCategory = new Map();
  for (const categoryId of ["air-conditioner", "tv", "refrigerator", "vacuum"]) {
    const completed = completeFlow(runtime, registry.getFlowModule(categoryId));
    assert.equal(completed.clickedSearch, true, `${categoryId}: 조건 완료 후 검색 시작 제출`);
    assert.equal(completed.state.completed, true, `${categoryId}: 추천 결과 단계 도달`);
    assert.equal(completed.state.error, null, `${categoryId}: 결과 생성 오류 없음`);
    assert.equal(completed.state.result?.metadata?.category, categoryId, `${categoryId}: 활성 카테고리 유지`);
    assert.ok(Array.isArray(completed.state.result?.recommendations), `${categoryId}: 추천 결과 shape 유지`);
    assert.ok(Object.keys(completed.state.answers).length > 0, `${categoryId}: 완료 조건 보존`);
    completedByCategory.set(categoryId, completed.state);
  }

  const phoneModule = registry.getFlowModule("phone");
  const phoneInitial = runtime.createInitialFlowState(phoneModule);
  const phoneStep = phoneModule.definition.steps.find(({ id }) => id === phoneInitial.currentStepId);
  const phoneProgressed = runtime.submitFlowAnswer(phoneModule, phoneInitial, firstAnswer(phoneStep, phoneInitial.answers));
  assert.equal(phoneProgressed.flowId, "phone", "생활비 진단 flow identity 유지");
  assert.notEqual(phoneProgressed.currentStepId, phoneInitial.currentStepId, "생활비 진단이 정상 시작·진행");
  assert.equal(completedByCategory.get("tv").flowId, "tv", "Smart Shopping 상태가 Living Cost 전환으로 오염되지 않음");
  assert.equal(phoneInitial.answers && Object.keys(phoneInitial.answers).length, 0, "Living Cost 초기 상태가 Smart Shopping 조건을 상속하지 않음");

  const { ChatScreenSmartShoppingTimeline } = await load("/src/app/components/features/chat/ChatScreen.tsx");
  const snapshots = await load("/src/app/features/smart-shopping/timeline/createTimelineSnapshot.ts");
  const { selectDummyNaverProducts } = await load("/src/app/features/smart-shopping/recommendation/selectDummyNaverProducts.ts");
  const { catalogProducts, catalogSourceByCategory } = await load("/src/app/features/product-catalog/data/productCatalog.ts");
  const tvResult = completedByCategory.get("tv").result;
  const recommendationSnapshot = snapshots.createRecommendationSnapshot({ categoryId: "tv", recommendations: tvResult.recommendations, catalogSource: catalogSourceByCategory.tv, dummyProducts: selectDummyNaverProducts(catalogProducts, "tv", tvResult.recommendations) });
  const timeline = [{ id: "regression-recommendations", type: "recommendation-list", snapshot: recommendationSnapshot, isActive: true }];
  const model = { timeline, showClosestOverBudget: false, onShowClosestOverBudget: () => {}, questionLoading: false, questionError: "", onSelectRecommendation: () => {}, onSelectDummyProduct: () => {}, onDetailAction: () => {}, onBackToList: () => {}, onNextStep: () => {}, onQuestionSubmit: () => {}, onQuestionRetry: () => {}, onQuestionCancel: () => {}, onNextAction: () => {}, onCancelPurchaseLink: () => {}, onSavePriceAlert: () => {}, onCancelPriceAlert: () => {}, isFavorite: () => false, onToggleFavorite: () => {} };
  const markup = renderToStaticMarkup(React.createElement(ChatScreenSmartShoppingTimeline, { model }));
  assert.ok(markup.includes("AI 최적화 재정렬") && markup.includes("NAVER 검색어 기반 DUMMY 상품 리스트"), "Smart Shopping timeline 계약으로 추천 양쪽 패널 렌더링");

  const [chatScreenSource, diagnosisSource] = await Promise.all([readFile("src/app/components/features/chat/ChatScreen.tsx", "utf8"), readFile("src/app/components/features/chat/DiagnosisResultCard.tsx", "utf8")]);
  assert.ok(chatScreenSource.includes("smartShoppingResult") && chatScreenSource.includes("favorites={favorites ?? []}") && chatScreenSource.includes("renderTimeline={(model) => <ChatScreenSmartShoppingTimeline"), "이전 실패 props와 timeline renderer를 ChatScreen이 완전하게 제공");
  assert.ok(!diagnosisSource.includes("RecommendationSelectionView") && ["PhoneDiagnosisReport", "InternetDiagnosisReport", "IptvDiagnosisReport", "BundleDiagnosisReport"].every((name) => diagnosisSource.includes(name)), "Living Cost 결과 라우팅은 유지하고 Smart Shopping 중복 소유만 제거");
  console.log("merged service integration regression checks: passed");
} finally {
  await server.close();
}
