import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "vite";

const phonePlan = (telecom, planName, monthlyFee) => ({
  telecom,
  planName,
  monthlyFee,
  data: "20GB",
  voice: "무제한",
  sms: "기본제공",
  link: "https://example.com/plan",
});

const calls = [];
const pendingResponses = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = (input) => new Promise((resolve) => {
  const url = String(input);
  const type = new URL(url, "http://localhost").searchParams.get("type");
  calls.push(url);
  pendingResponses.push(() => resolve({
    json: async () => ({
      success: true,
      count: 1,
      plans: type === "6"
        ? [phonePlan("SKT", "SKT 5G 베이직", 55_000)]
        : [phonePlan("KT", "KT LTE 베이직", 49_000)],
      source: "smartchoice",
    }),
  }));
});

const countByType = () => calls.reduce((counts, url) => {
  const type = new URL(url, "http://localhost").searchParams.get("type");
  counts[type] = (counts[type] ?? 0) + 1;
  return counts;
}, {});

const flushPendingResponses = () => {
  while (pendingResponses.length) pendingResponses.shift()();
};

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
const load = (path) => server.ssrLoadModule(path);

try {
  await load("/src/app/features/chat-flow/registry/loadFlows.ts");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(calls.length, 0, "초기 flow registry 로드는 SmartChoice 요청을 시작하지 않음");

  const phoneFlowModule = await load("/src/app/features/chat-flow/flows/telecom/phone/flow.ts");
  const telecomApi = await load("/src/app/features/chat-flow/flows/telecom/shared/telecomApi.ts");
  const firstLookup = phoneFlowModule.prefetchPlans("skt");
  const sameCarrierLookup = phoneFlowModule.prefetchPlans("skt");
  const simultaneousCarrierLookup = phoneFlowModule.prefetchPlans("kt");
  assert.equal(firstLookup, sameCarrierLookup, "동일 carrier lookup은 같은 in-flight 작업을 재사용");
  assert.deepEqual(countByType(), { 3: 1, 6: 1 }, "하나의 logical lookup은 LTE/5G 요청을 각각 한 번만 실행");

  flushPendingResponses();
  await Promise.all([firstLookup, sameCarrierLookup, simultaneousCarrierLookup]);

  const currentPlanStep = phoneFlowModule.phoneFlow.steps.find(({ id }) => id === "phone-current-plan-api");
  const sktOptions = currentPlanStep.optionsResolver({ "phone.carrier": "skt", "phone.currentFee": 55_000 });
  const ktOptions = currentPlanStep.optionsResolver({ "phone.carrier": "kt", "phone.currentFee": 49_000 });
  assert.ok(sktOptions.some(({ value }) => value === "plan-api|SKT 5G 베이직"), "5G response group reaches the existing phone-plan renderer");
  assert.ok(ktOptions.some(({ value }) => value === "plan-api|KT LTE 베이직"), "LTE response group reaches the existing phone-plan renderer");

  await phoneFlowModule.prefetchPlans("skt");
  currentPlanStep.optionsResolver({ "phone.carrier": "skt", "phone.currentFee": 55_000 });
  assert.deepEqual(countByType(), { 3: 1, 6: 1 }, "성공 state와 동일 입력 rerender는 SmartChoice를 재호출하지 않음");

  const changedLookup = Promise.all([
    telecomApi.fetchSmartChoicePhonePlans({ voice: "999999", data: "51200", sms: "999999", age: "20", type: "6", dis: "24" }),
    telecomApi.fetchSmartChoicePhonePlans({ voice: "999999", data: "51200", sms: "999999", age: "20", type: "3", dis: "24" }),
  ]);
  const duplicateChangedLookup = telecomApi.fetchSmartChoicePhonePlans({ voice: "999999", data: "51200", sms: "999999", age: "20", type: "6", dis: "24" });
  assert.deepEqual(countByType(), { 3: 2, 6: 2 }, "변경된 lookup 조건은 새 LTE/5G request pair를 한 번만 실행");
  flushPendingResponses();
  await Promise.all([changedLookup, duplicateChangedLookup]);

  const [reportSource, inputSource] = await Promise.all([
    readFile("src/app/features/chat-flow/flows/telecom/phone/PhoneDiagnosisReport.tsx", "utf8"),
    readFile("src/app/components/features/chat/ChatFlowInput.tsx", "utf8"),
  ]);
  assert.ok(reportSource.includes("if (cancelled) return;") && reportSource.includes("return () => { cancelled = true; };"), "결과 화면 unmount 후 완료된 요청은 state를 갱신하지 않음");
  assert.ok(reportSource.includes("[dataVolume, ageGroup, desiredNetwork, discountOptionValue]"), "결과 lookup effect는 불안정한 answers 객체가 아닌 실제 lookup 조건만 추적");
  assert.ok(inputSource.includes("if (!isCurrentPhonePlanLookup || isHistorical || !phoneCarrier) return;") && inputSource.includes("prefetchPlans(phoneCarrier)") && inputSource.includes("return () => { active = false; };"), "활성 phone plan 입력만 lookup을 시작하고 unmount 뒤에는 카드 state를 갱신하지 않음");

  console.log("smartchoice request regression checks: passed");
} finally {
  globalThis.fetch = originalFetch;
  await server.close();
}
