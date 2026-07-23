// src/app/features/chat-flow/flows/telecom/bundle/flow.ts

import { composeFlow } from "../../../core/composeFlow";
import type { FlowAnswers, FlowDefinition, FlowStep } from "../../../core/types";
import { buildBundleResult } from "./result";
import {
  mockBundlePlans,
  type BundlePlan,
  MOCK_PLAN_COMBINATIONS,
  getPlanCombinations,
  type Carrier
} from "./mockData";

// KT Skylife, LG 헬로비전 및 이야기 모바일 요금제 조합 조회를 위한 mock data import
import {
  mockMvnoMobilePlans,
  mockMvnoHomeBundles,
  mockLgHelloBundles,
  mockEyagiSktMobilePlans,
  mockSktHomeBundles,
  mockEyagiLguMobilePlans,
  mockLguHomeBundles
} from "./MVNOmockData";

import { fetchSmartChoicePhonePlans } from "../shared/telecomApi";

const namespace = "bundle";

// ──────────────────────────────────────────────
// API 키 확인 및 모바일/통신 API 캐싱 레이어
// ──────────────────────────────────────────────
const MOBILE_API_KEY =
  import.meta.env.VITE_MOBILE_API_KEY ||
  import.meta.env.VITE_TELECOM_API_KEY ||
  import.meta.env.VITE_SMARTCHOICE_API_KEY ||
  import.meta.env.VITE_INTERNET_API_KEY ||
  "";

export let apiPlansCache: BundlePlan[] | null = null;
let apiFetchPromise: Promise<BundlePlan[]> | null = null;

export function fetchMobilePlansWithApiKey(): Promise<BundlePlan[]> {
  if (apiPlansCache) return Promise.resolve(apiPlansCache);
  if (apiFetchPromise) return apiFetchPromise;

  apiFetchPromise = (async () => {
    try {
      // API 키를 포함한 스마트초이스 요금제 API 호출
      const [res5gL, resLteL, res5gM, resLteM, res5gH, resLteH] = await Promise.all([
        fetchSmartChoicePhonePlans({ voice: "999999", data: "5120", sms: "999999", age: "20", type: "6", dis: "24" }),
        fetchSmartChoicePhonePlans({ voice: "999999", data: "5120", sms: "999999", age: "20", type: "3", dis: "24" }),
        fetchSmartChoicePhonePlans({ voice: "999999", data: "20480", sms: "999999", age: "20", type: "6", dis: "24" }),
        fetchSmartChoicePhonePlans({ voice: "999999", data: "20480", sms: "999999", age: "20", type: "3", dis: "24" }),
        fetchSmartChoicePhonePlans({ voice: "999999", data: "999999", sms: "999999", age: "20", type: "6", dis: "24" }),
        fetchSmartChoicePhonePlans({ voice: "999999", data: "999999", sms: "999999", age: "20", type: "3", dis: "24" }),
      ]);

      const rawPlans = [
        ...(res5gL.plans || []),
        ...(resLteL.plans || []),
        ...(res5gM.plans || []),
        ...(resLteM.plans || []),
        ...(res5gH.plans || []),
        ...(resLteH.plans || []),
      ];
      if (rawPlans.length > 0) {
        const seen = new Set<string>();
        const mapped: BundlePlan[] = [];

        rawPlans.forEach((p) => {
          if (!seen.has(p.planName)) {
            seen.add(p.planName);
            let carrier = "SK";
            if (p.telecom === "KT") carrier = "KT";
            else if (p.telecom === "LGU+" || p.telecom === "LGU") carrier = "LGU";
            else if (p.telecom.includes("알뜰") || p.telecom.includes("스카이")) carrier = "SKYLIFE";

            mapped.push({
              id: `api-${p.planName}`,
              name: p.planName,
              price: p.monthlyFee,
              carrier,
            });
          }
        });

        if (mapped.length > 0) {
          apiPlansCache = mapped;
          return mapped;
        }
      }
    } catch {
      // API 호출 오류 발생 시 fallback mock
    }

    apiPlansCache = mockBundlePlans;
    return mockBundlePlans;
  })();

  return apiFetchPromise;
}

// 백그라운드 prefetch 시작
fetchMobilePlansWithApiKey().catch(() => { });

function resolveRecommendedBundlePlans(
  answers: FlowAnswers,
  answerPrefix: string,
  isMobileOnly: boolean = false
): BundlePlan[] {
  let carrierVal =
    (answers[`${namespace}.${answerPrefix}Carrier`] as string) ||
    (answers[`${namespace}.${answerPrefix}MobileCarrier`] as string) ||
    (answers[`${namespace}.allCarrier`] as string) ||
    (answers[`${namespace}.diffCarrier`] as string) ||
    (answers[`${namespace}.diffMobileCarrier`] as string) ||
    (answers[`${namespace}.ptaCarrier`] as string) ||
    (answers[`${namespace}.ptbCarrier`] as string) ||
    (answers[`${namespace}.ptcCarrier`] as string) ||
    (answers[`${namespace}.newACarrier`] as string) ||
    (answers[`${namespace}.newBCarrier`] as string) ||
    (answers[`${namespace}.mobileCarrier`] as string) ||
    (answers[`${namespace}.commonCarrier`] as string) ||
    "";

  if (!carrierVal) {
    for (const key of Object.keys(answers)) {
      if (key.endsWith("Carrier")) {
        const val = answers[key];
        if (typeof val === "string" && val.trim() !== "") {
          carrierVal = val;
          break;
        }
      }
    }
  }

  const feeVal =
    answers[`${namespace}.${answerPrefix}Fee`] ??
    answers[`${namespace}.${answerPrefix}MobileFee`] ??
    answers[`${namespace}.${answerPrefix}TvFee`] ??
    0;

  const currentFee = Number(feeVal) || 0;
  const lowerCarrier = carrierVal.toLowerCase();

  let targetCarrier = "";
  if (lowerCarrier.includes("skt") || lowerCarrier.includes("sk")) {
    targetCarrier = "SK";
  } else if (lowerCarrier.includes("kt")) {
    targetCarrier = "KT";
  } else if (lowerCarrier.includes("lg") || lowerCarrier.includes("u+")) {
    targetCarrier = "LGU";
  } else if (
    lowerCarrier.includes("알뜰") ||
    lowerCarrier.includes("스카이") ||
    lowerCarrier.includes("skylife") ||
    lowerCarrier.includes("hello") ||
    lowerCarrier.includes("헬로")
  ) {
    targetCarrier = "SKYLIFE";
  }

  // 모바일 관련 질문인 경우 기존 로직 수행
  const isMobileQuery =
    isMobileOnly ||
    answerPrefix.includes("Mobile") ||
    answerPrefix.includes("mobile") ||
    ["all", "pta", "ptb", "ptc", "diff", "newA", "newB"].includes(answerPrefix);

  if (isMobileQuery) {
    const isMvno =
      lowerCarrier.includes("알뜰") ||
      lowerCarrier.includes("스카이") ||
      lowerCarrier.includes("mvno") ||
      lowerCarrier.includes("헬로") ||
      lowerCarrier.includes("이야기") ||
      lowerCarrier.includes("케이블") ||
      (!carrierVal && isMobileQuery);

    if (isMvno) {
      // 🟢 MVNOmockData.ts에서 알뜰 모바일 데이터 추출
      const skyPlans: BundlePlan[] = mockMvnoMobilePlans.map((p) => ({
        id: p.id,
        name: `[KT 스카이라이프] ${p.mobilePlanName}`,
        price: p.price,
        carrier: "SKYLIFE",
        services: ["mobile"],
      }));

      const eyagiSktPlans: BundlePlan[] = mockEyagiSktMobilePlans.map((p) => ({
        id: p.id,
        name: `[이야기모바일(SKT)] ${p.mobilePlanName}`,
        price: p.price,
        carrier: "SKYLIFE",
        services: ["mobile"],
      }));

      const eyagiLguPlans: BundlePlan[] = mockEyagiLguMobilePlans.map((p) => ({
        id: p.id,
        name: `[이야기모바일(LGU+)] ${p.mobilePlanName}`,
        price: p.price,
        carrier: "SKYLIFE",
        services: ["mobile"],
      }));

      const helloSeen = new Set<string>();
      const helloPlans: BundlePlan[] = [];
      mockLgHelloBundles.forEach((b, idx) => {
        if (!helloSeen.has(b.mobilePlanName)) {
          helloSeen.add(b.mobilePlanName);
          helloPlans.push({
            id: `hello-mob-${idx}`,
            name: `[LG 헬로비전] ${b.mobilePlanName}`,
            price: b.mobileFee,
            carrier: "SKYLIFE",
            services: ["mobile"],
          });
        }
      });

      // 🟢 1. 4대 알뜰 통신사 브랜드별 그룹화 (MVNOmockData.ts 기반)
      const brandGroups: { [brand: string]: BundlePlan[] } = {
        hello: helloPlans,
        sky: skyPlans,
        eyagi_skt: eyagiSktPlans,
        eyagi_lgu: eyagiLguPlans,
      };

      // 🟢 2. 브랜드별 ±25,000원 필터링 및 각 그룹 내 입력 실납부액 근접 순(비슷한 우선순위) 정렬
      const brandKeys = ["hello", "sky", "eyagi_skt", "eyagi_lgu"];
      brandKeys.forEach((b) => {
        let list = brandGroups[b] || [];
        if (currentFee > 0) {
          const range = list.filter((p) => Math.abs(p.price - currentFee) <= 25000);
          if (range.length > 0) list = range;
        }
        if (currentFee > 0) {
          list.sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));
        } else {
          list.sort((a, b) => a.price - b.price);
        }
        brandGroups[b] = list;
      });

      // 🟢 3. 4개 알뜰 통신사 브랜드가 골고루 출력되도록 라운드별로 1개씩 수집 후, 각 라운드(4개 브랜드 세트) 내에서도 실납부액 근접 순(비슷한 우선순위) 정렬
      const shuffledBrandKeys = [...brandKeys].sort(() => 0.5 - Math.random());
      const interleaved: BundlePlan[] = [];
      const maxLength = Math.max(...Object.values(brandGroups).map((g) => g.length), 0);

      for (let i = 0; i < maxLength; i++) {
        const roundBatch: BundlePlan[] = [];
        shuffledBrandKeys.forEach((b) => {
          if (brandGroups[b] && brandGroups[b][i]) {
            roundBatch.push(brandGroups[b][i]);
          }
        });
        // 🟢 4. 라운드별(4대 브랜드 세트) 수집된 요금제들을 입력 실납부액 근접 순(비슷한 우선순위)으로 정렬하여 추가
        if (currentFee > 0) {
          roundBatch.sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));
        } else {
          roundBatch.sort((a, b) => a.price - b.price);
        }
        interleaved.push(...roundBatch);
      }

      return interleaved;
    }

    // 1. Try to find plans from SmartChoice API first (apiPlansCache) within currentFee ±25,000 KRW
    let smartChoicePlans: BundlePlan[] = [];
    if (apiPlansCache && apiPlansCache.length > 0) {
      smartChoicePlans = apiPlansCache.filter((p) => {
        const matchCarrier = p.carrier === targetCarrier;
        const matchPrice = currentFee > 0 ? Math.abs(p.price - currentFee) <= 25000 : true;
        return matchCarrier && matchPrice;
      });
    }

    let plansResult = [...smartChoicePlans];

    // 2. If no plans found or insufficient (less than 3), get from MOCK_PLAN_COMBINATIONS unique mobile plans
    if (plansResult.length < 3) {
      const extractedMnoPlans: BundlePlan[] = [];
      const seenExtracted = new Set<string>();
      MOCK_PLAN_COMBINATIONS.forEach((c) => {
        const key = `${c.carrier}-${c.mobilePlan}`;
        if (!seenExtracted.has(key)) {
          seenExtracted.add(key);
          let carrier = "SK";
          if (c.carrier === "KT") carrier = "KT";
          else if (c.carrier === "LGU+" || c.carrier === "LGU") carrier = "LGU";

          extractedMnoPlans.push({
            id: `mock-mob-${c.id}`,
            name: `[${c.carrier}] ${c.mobilePlan}`,
            price: c.mobilePrice,
            carrier,
            services: ["mobile"]
          });
        }
      });

      let fallbackPlans = extractedMnoPlans.filter((p) => {
        const matchCarrier = p.carrier === targetCarrier;
        const matchPrice = currentFee > 0 ? Math.abs(p.price - currentFee) <= 25000 : true;
        return matchCarrier && matchPrice;
      });

      // Avoid name duplicates
      const seenNames = new Set(plansResult.map((p) => p.name));
      fallbackPlans.forEach((p) => {
        if (!seenNames.has(p.name)) {
          seenNames.add(p.name);
          plansResult.push(p);
        }
      });
    }

    // Sort by proximity to currentFee if currentFee > 0, otherwise sort by price ascending
    if (currentFee > 0) {
      plansResult.sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));
    } else {
      plansResult.sort((a, b) => a.price - b.price);
    }

    return plansResult;
  }

  // 1. [다 달라요] - 인터넷 단독 선택 시 (diffInternet) -> 인터넷명만 불러오기
  const isInternetOnlyQuery =
    answerPrefix === "diffInternet" ||
    answerPrefix.includes("diffInternet") ||
    answerPrefix.includes("Internet");

  if (isInternetOnlyQuery) {
    let internetPlans: BundlePlan[] = [];

    if (lowerCarrier.includes("sk") || lowerCarrier.includes("b tv")) {
      // SKT / SK브로드밴드 (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
      const sktCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "SKT");
      const seen = new Set<string>();
      sktCombos.forEach((c) => {
        if (!seen.has(c.internetPlan)) {
          seen.add(c.internetPlan);
          let price = 22000;
          if (c.internetSpeed.includes("500M")) price = 33000;
          else if (c.internetSpeed.includes("1G")) price = 38500;
          internetPlans.push({
            id: `skt-i-${seen.size}`,
            carrier: "SK",
            name: `[SK브로드밴드] ${c.internetPlan}`,
            price,
            services: ["internet"],
          });
        }
      });
    } else if (lowerCarrier.includes("kt")) {
      // KT (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
      const ktCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "KT");
      const seen = new Set<string>();
      ktCombos.forEach((c) => {
        if (!seen.has(c.internetPlan)) {
          seen.add(c.internetPlan);
          let price = 22000;
          if (c.internetSpeed.includes("500M")) price = 33000;
          else if (c.internetSpeed.includes("1G")) price = 38500;
          internetPlans.push({
            id: `kt-i-${seen.size}`,
            carrier: "KT",
            name: `[KT] ${c.internetPlan}`,
            price,
            services: ["internet"],
          });
        }
      });
    } else if (lowerCarrier.includes("lg") || lowerCarrier.includes("u+")) {
      // LGU+ (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
      const lguCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "LGU+");
      const seen = new Set<string>();
      lguCombos.forEach((c) => {
        if (!seen.has(c.internetPlan)) {
          seen.add(c.internetPlan);
          let price = 22000;
          if (c.internetSpeed.includes("500M")) price = 33000;
          else if (c.internetSpeed.includes("1G")) price = 38500;
          internetPlans.push({
            id: `lgu-i-${seen.size}`,
            carrier: "LGU",
            name: `[LG유플러스] ${c.internetPlan}`,
            price,
            services: ["internet"],
          });
        }
      });
    } else {
      // 알뜰 / 케이블 (MVNOmockData.ts 기반)
      const sky = mockMvnoHomeBundles.map((h) => ({
        id: `sky-i-${h.id}`,
        carrier: "SKYLIFE",
        name: `[KT 스카이라이프] ${h.internetName}`,
        price: 22000,
        services: ["internet"],
      }));
      const hello = mockLgHelloBundles.map((h) => ({
        id: `hello-i-${h.id}`,
        carrier: "SKYLIFE",
        name: `[LG 헬로비전] ${h.internetName}`,
        price: 18000,
        services: ["internet"],
      }));
      const eyagiSkt = mockSktHomeBundles.map((h) => ({
        id: `eyagi-skt-i-${h.id}`,
        carrier: "SKYLIFE",
        name: `[이야기모바일] ${h.internetName}`,
        price: 22000,
        services: ["internet"],
      }));
      const eyagiLgu = mockLguHomeBundles.map((h) => ({
        id: `eyagi-lgu-i-${h.id}`,
        carrier: "SKYLIFE",
        name: `[이야기모바일] ${h.internetName}`,
        price: 22000,
        services: ["internet"],
      }));
      internetPlans = [...sky, ...hello, ...eyagiSkt, ...eyagiLgu];
    }

    const uniqueMap = new Map<string, BundlePlan>();
    internetPlans.forEach((p) => {
      if (!uniqueMap.has(p.name)) {
        uniqueMap.set(p.name, p);
      }
    });
    let result = Array.from(uniqueMap.values());
    if (currentFee > 0) {
      result.sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));
    }
    return result;
  }

  // 2. [다 달라요] - IPTV 단독 선택 시 (diffTv) -> IPTV명만 불러오기
  const isTvOnlyQuery =
    answerPrefix === "diffTv" ||
    answerPrefix.includes("diffTv") ||
    answerPrefix.includes("Tv");

  if (isTvOnlyQuery) {
    let tvPlans: BundlePlan[] = [];

    if (lowerCarrier.includes("sk") || lowerCarrier.includes("b tv") || lowerCarrier.includes("b-tv")) {
      // SKT / B tv (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
      const sktCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "SKT");
      const seen = new Set<string>();
      sktCombos.forEach((c) => {
        const cleanTv = c.tvPlan
          .replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "")
          .replace(/\s*\(인터넷결합\)/g, "")
          .replace(/\s*\([\d,]+원\)/g, "")
          .trim();
        if (!seen.has(cleanTv)) {
          seen.add(cleanTv);
          let price = 13200;
          if (cleanTv.includes("이코노미")) price = 9900;
          else if (cleanTv.includes("All")) price = 16500;
          tvPlans.push({
            id: `skt-t-${seen.size}`,
            carrier: "SK",
            name: `[SK브로드밴드] ${cleanTv}`,
            price,
            services: ["iptv"],
          });
        }
      });
    } else if (lowerCarrier.includes("kt") || lowerCarrier.includes("지니")) {
      // KT / 지니 TV (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
      const ktCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "KT");
      const seen = new Set<string>();
      ktCombos.forEach((c) => {
        const cleanTv = c.tvPlan
          .replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "")
          .replace(/\s*\(인터넷결합\)/g, "")
          .replace(/\s*\([\d,]+원\)/g, "")
          .trim();
        if (!seen.has(cleanTv)) {
          seen.add(cleanTv);
          let price = 12100;
          if (cleanTv.includes("에센스")) price = 16500;
          else if (cleanTv.includes("VOD")) price = 20900;
          tvPlans.push({
            id: `kt-t-${seen.size}`,
            carrier: "KT",
            name: `[KT] ${cleanTv}`,
            price,
            services: ["iptv"],
          });
        }
      });
    } else if (lowerCarrier.includes("lg") || lowerCarrier.includes("u+")) {
      // LGU+ / U+tv (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
      const lguCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "LGU+");
      const seen = new Set<string>();
      lguCombos.forEach((c) => {
        const cleanTv = c.tvPlan
          .replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "")
          .replace(/\s*\(인터넷결합\)/g, "")
          .replace(/\s*\([\d,]+원\)/g, "")
          .trim();
        if (!seen.has(cleanTv)) {
          seen.add(cleanTv);
          let price = 13200;
          if (cleanTv.includes("실속")) price = 10890;
          else if (cleanTv.includes("프리미엄")) price = 16500;
          tvPlans.push({
            id: `lgu-t-${seen.size}`,
            carrier: "LGU",
            name: `[LG유플러스] ${cleanTv}`,
            price,
            services: ["iptv"],
          });
        }
      });
    } else {
      // 알뜰 / 케이블 IPTV (MVNOmockData.ts 기반)
      const sky = mockMvnoHomeBundles.map((h) => ({
        id: `sky-t-${h.id}`,
        carrier: "SKYLIFE",
        name: `[KT 스카이라이프] ${h.tvName}`,
        price: 12100,
        services: ["iptv"],
      }));
      const hello = mockLgHelloBundles.map((h) => ({
        id: `hello-t-${h.id}`,
        carrier: "SKYLIFE",
        name: `[LG 헬로비전] ${h.tvName}`,
        price: 11000,
        services: ["iptv"],
      }));
      const eyagiSkt = mockSktHomeBundles.map((h) => ({
        id: `eyagi-skt-t-${h.id}`,
        carrier: "SKYLIFE",
        name: `[이야기모바일] ${h.tvName}`,
        price: 13200,
        services: ["iptv"],
      }));
      const eyagiLgu = mockLguHomeBundles.map((h) => ({
        id: `eyagi-lgu-t-${h.id}`,
        carrier: "SKYLIFE",
        name: `[이야기모바일] ${h.tvName}`,
        price: 13200,
        services: ["iptv"],
      }));
      tvPlans = [...sky, ...hello, ...eyagiSkt, ...eyagiLgu];
    }

    const uniqueMap = new Map<string, BundlePlan>();
    tvPlans.forEach((p) => {
      if (!uniqueMap.has(p.name)) {
        uniqueMap.set(p.name, p);
      }
    });
    let result = Array.from(uniqueMap.values());
    if (currentFee > 0) {
      result.sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));
    }
    return result;
  }

  // 3. [일부 같아요] - 인터넷 + IPTV 결합 선택 시 (ptaCombo, ptbCombo, ptcCombo 등) -> 인터넷+TV결합명 불러오기
  let homePlans: BundlePlan[] = [];

  // (1) SKT 인터넷+TV 결합 (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
  const sktCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "SKT");
  const sktHomePlans: BundlePlan[] = [];
  const sktSeen = new Set<string>();
  sktCombos.forEach((c) => {
    const cleanTv = c.tvPlan
      .replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "")
      .replace(/\s*\(인터넷결합\)/g, "")
      .replace(/\s*\([\d,]+원\)/g, "")
      .trim();
    const name = `[SKT] ${c.internetPlan} + ${cleanTv}`;
    if (!sktSeen.has(name)) {
      sktSeen.add(name);
      sktHomePlans.push({
        id: `skt-home-${c.id}`,
        carrier: "SK",
        name,
        price: c.internetTvPrice || 33000,
        services: ["internet", "iptv"],
      });
    }
  });

  // (2) KT 인터넷+TV 결합 (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
  const ktCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "KT");
  const ktHomePlans: BundlePlan[] = [];
  const ktSeen = new Set<string>();
  ktCombos.forEach((c) => {
    const cleanTv = c.tvPlan
      .replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "")
      .replace(/\s*\(인터넷결합\)/g, "")
      .replace(/\s*\([\d,]+원\)/g, "")
      .trim();
    const name = `[KT] ${c.internetPlan} + ${cleanTv}`;
    if (!ktSeen.has(name)) {
      ktSeen.add(name);
      ktHomePlans.push({
        id: `kt-home-${c.id}`,
        carrier: "KT",
        name,
        price: c.internetTvPrice || 35200,
        services: ["internet", "iptv"],
      });
    }
  });

  // (3) LGU+ 인터넷+TV 결합 (mockData.ts MOCK_PLAN_COMBINATIONS 기반)
  const lguCombos = MOCK_PLAN_COMBINATIONS.filter((c) => c.carrier === "LGU+");
  const lguHomePlans: BundlePlan[] = [];
  const lguSeen = new Set<string>();
  lguCombos.forEach((c) => {
    const cleanTv = c.tvPlan
      .replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "")
      .replace(/\s*\(인터넷결합\)/g, "")
      .replace(/\s*\([\d,]+원\)/g, "")
      .trim();
    const name = `[LGU+] ${c.internetPlan} + ${cleanTv}`;
    if (!lguSeen.has(name)) {
      lguSeen.add(name);
      lguHomePlans.push({
        id: `lgu-home-${c.id}`,
        carrier: "LGU",
        name,
        price: c.internetTvPrice || 30800,
        services: ["internet", "iptv"],
      });
    }
  });

  // (4) 알뜰/케이블 인터넷+TV 결합 (MVNOmockData.ts 기반)
  const skyHomePlans: BundlePlan[] = mockMvnoHomeBundles.map((h) => ({
    id: h.id,
    carrier: "SKYLIFE",
    name: `[KT 스카이라이프] ${h.internetName} + ${h.tvName}`,
    price: h.bundleMonthlyFee,
    services: ["internet", "iptv"],
  }));

  const helloHomePlans: BundlePlan[] = mockLgHelloBundles.map((h) => ({
    id: h.id,
    carrier: "SKYLIFE",
    name: `[LG 헬로비전] ${h.internetName} + ${h.tvName}`,
    price: h.homeBundleFee,
    services: ["internet", "iptv"],
  }));

  const eyagiSktHomePlans: BundlePlan[] = mockSktHomeBundles.map((h) => ({
    id: `eyagi-skt-${h.id}`,
    carrier: "SKYLIFE",
    name: `[이야기모바일(SKT)] ${h.internetName} + ${h.tvName}`,
    price: h.bundleMonthlyFee,
    services: ["internet", "iptv"],
  }));

  const eyagiLguHomePlans: BundlePlan[] = mockLguHomeBundles.map((h) => ({
    id: `eyagi-lgu-${h.id}`,
    carrier: "SKYLIFE",
    name: `[이야기모바일(LGU+)] ${h.internetName} + ${h.tvName}`,
    price: h.bundleMonthlyFee,
    services: ["internet", "iptv"],
  }));

  const mvnoHomePlans = [...skyHomePlans, ...helloHomePlans, ...eyagiSktHomePlans, ...eyagiLguHomePlans];

  // 🟢 알뜰폰 선택 시 이전 모바일 요금제 선택 단계에서 선택한 실제 요금제 ID (control value 제외) 감지
  let selectedMvnoBrand = "";

  const isTargetPlanId = (val: unknown): val is string => {
    if (typeof val !== "string") return false;
    const v = val.trim();
    if (!v || v === "direct-choose" || v === "none-of-them") return false;
    return true;
  };

  const candidatePlanKeys = [
    `${namespace}.allPlanCheckList`,
    `${namespace}.allPlanCheck`,
    `${namespace}.diffPlanCheckList`,
    `${namespace}.diffPlanCheck`,
    `${namespace}.ptaPlanCheckList`,
    `${namespace}.ptaPlanCheck`,
    `${namespace}.ptbPlanCheckList`,
    `${namespace}.ptbPlanCheck`,
    `${namespace}.ptcPlanCheckList`,
    `${namespace}.ptcPlanCheck`,
    `${namespace}.mobilePlanCheckList`,
    `${namespace}.mobilePlanCheck`,
    `${namespace}.manualSelectedPlan`,
    `${namespace}.selectedRecommendedPlan`,
  ];

  let selectedPlanId = "";
  for (const k of candidatePlanKeys) {
    const val = answers[k];
    if (isTargetPlanId(val)) {
      selectedPlanId = val;
      break;
    }
  }

  if (!selectedPlanId) {
    for (const key of Object.keys(answers)) {
      const val = answers[key];
      if (isTargetPlanId(val)) {
        selectedPlanId = val;
        if (
          val.startsWith("mvno-spec-") ||
          val.includes("이야기") ||
          val.includes("스카이") ||
          val.includes("헬로")
        ) {
          break;
        }
      }
    }
  }

  if (selectedPlanId) {
    const str = selectedPlanId.toLowerCase();
    if (
      str.startsWith("sky-") ||
      str.includes("스카이라이프") ||
      str.includes("skylife") ||
      str.includes("스카이")
    ) {
      selectedMvnoBrand = "sky";
    } else if (
      str.startsWith("hello-") ||
      str.includes("헬로비전") ||
      str.includes("hellovision") ||
      str.includes("헬로")
    ) {
      selectedMvnoBrand = "hello";
    } else if (
      str.startsWith("eyagi-skt-") ||
      str.includes("이야기모바일(skt)") ||
      str.includes("이야기(skt)") ||
      str.includes("이야기 skt")
    ) {
      selectedMvnoBrand = "eyagi_skt";
    } else if (
      str.startsWith("eyagi-lgu-") ||
      str.includes("이야기모바일(lgu+)") ||
      str.includes("이야기(lgu+)") ||
      str.includes("이야기 lgu+")
    ) {
      selectedMvnoBrand = "eyagi_lgu";
    } else if (str.includes("이야기") || str.startsWith("eyagi-")) {
      if (str.includes("lgu") || str.includes("lg") || str.includes("u+")) {
        selectedMvnoBrand = "eyagi_lgu";
      } else {
        selectedMvnoBrand = "eyagi_skt";
      }
    }
  }

  // 🟢 selectedPlanId로 감지되지 않은 경우, answers 전체 검색을 통해 선택된 MVNO 브랜드 감지
  if (!selectedMvnoBrand) {
    for (const key of Object.keys(answers)) {
      const val = String(answers[key] || "").toLowerCase();
      if (!val || val === "direct-choose" || val === "none-of-them") continue;
      if (val.startsWith("sky-") || val.includes("스카이라이프") || val.includes("스카이")) {
        selectedMvnoBrand = "sky";
        break;
      } else if (val.startsWith("hello-") || val.includes("헬로비전") || val.includes("헬로")) {
        selectedMvnoBrand = "hello";
        break;
      } else if (val.startsWith("eyagi-skt-") || val.includes("이야기모바일(skt)") || val.includes("이야기 skt")) {
        selectedMvnoBrand = "eyagi_skt";
        break;
      } else if (val.startsWith("eyagi-lgu-") || val.includes("이야기모바일(lgu+)") || val.includes("이야기 lgu+")) {
        selectedMvnoBrand = "eyagi_lgu";
        break;
      } else if (val.includes("이야기")) {
        if (val.includes("lgu") || val.includes("lg") || val.includes("u+")) {
          selectedMvnoBrand = "eyagi_lgu";
        } else {
          selectedMvnoBrand = "eyagi_skt";
        }
        break;
      }
    }
  }

  if (
    lowerCarrier.includes("알뜰") ||
    lowerCarrier.includes("지역") ||
    lowerCarrier.includes("케이블") ||
    lowerCarrier.includes("스카이") ||
    lowerCarrier.includes("헬로") ||
    lowerCarrier.includes("이야기")
  ) {
    if (selectedMvnoBrand === "sky") {
      homePlans = skyHomePlans;
    } else if (selectedMvnoBrand === "hello") {
      homePlans = helloHomePlans;
    } else if (selectedMvnoBrand === "eyagi_skt") {
      homePlans = eyagiSktHomePlans;
    } else if (selectedMvnoBrand === "eyagi_lgu") {
      homePlans = eyagiLguHomePlans;
    } else if (selectedMvnoBrand === "eyagi") {
      homePlans = [...eyagiSktHomePlans, ...eyagiLguHomePlans];
    } else {
      homePlans = mvnoHomePlans;
    }
  } else if (lowerCarrier.includes("sk") || lowerCarrier.includes("b tv")) {
    homePlans = sktHomePlans;
  } else if (lowerCarrier.includes("kt")) {
    homePlans = ktHomePlans;
  } else if (lowerCarrier.includes("lg") || lowerCarrier.includes("u+")) {
    homePlans = lguHomePlans;
  } else {
    homePlans = [...sktHomePlans, ...ktHomePlans, ...lguHomePlans, ...mvnoHomePlans];
  }

  // 중복 제거 (name 기준)
  const uniqueMap = new Map<string, BundlePlan>();
  homePlans.forEach((p) => {
    if (!uniqueMap.has(p.name)) {
      uniqueMap.set(p.name, p);
    }
  });
  let resultPlans = Array.from(uniqueMap.values());

  if (currentFee > 0) {
    resultPlans.sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));
  }

  return resultPlans;
}

// ──────────────────────────────────────────────
// 공통 컴포넌트 빌더 함수 (Common Component Builders)
// ──────────────────────────────────────────────

interface CarrierOption {
  value: string;
  label: string;
  next?: string;
}

function CarrierSelect(args: {
  id: string;
  message: string;
  answerKey: string;
  options: CarrierOption[];
  next?: string;
}): FlowStep {
  return {
    id: args.id,
    type: "single-choice",
    message: args.message,
    answerKey: args.answerKey,
    options: args.options,
    ...(args.next ? { next: args.next } : {}),
  };
}

function MonthlyFeeInput(args: {
  id: string;
  message: string;
  answerKey: string;
  placeholder?: string;
  next: string;
}): FlowStep {
  return {
    id: args.id,
    type: "number-input",
    message: args.message,
    answerKey: args.answerKey,
    placeholder: args.placeholder || "실제 납부액을 입력해주세요.",
    min: 0,
    unit: "원",
    next: args.next,
  };
}

function PlanCheckMethod(args: {
  id: string;
  message: string;
  answerKey: string;
  answerPrefix: string;
  isMobile?: boolean;
  next: string;
}): FlowStep[] {
  const listStepId = `${args.id}_list`;

  const cardStep: FlowStep = {
    id: args.id,
    type: "single-choice",
    message: args.message,
    answerKey: args.answerKey,
    options: [
      {
        value: "direct-choose",
        label: "🔍 제가 직접 골라볼게요!",
        next: listStepId,
      },
    ],
    optionsResolver: (answers) => {
      const isMobile = !!args.isMobile;
      const plans = resolveRecommendedBundlePlans(answers, args.answerPrefix, isMobile);

      const feeVal =
        answers[`${namespace}.${args.answerPrefix}Fee`] ??
        answers[`${namespace}.${args.answerPrefix}MobileFee`] ??
        answers[`${namespace}.${args.answerPrefix}TvFee`] ??
        0;
      const currentFee = Number(feeVal) || 0;

      let rangePlans = plans;
      if (currentFee > 0) {
        rangePlans = plans.filter((p) => Math.abs(p.price - currentFee) <= 25000);
        if (rangePlans.length === 0) {
          rangePlans = plans;
        }
      }

      // 유선/결합 상품의 경우 실 납부액 우선순위(근접 순)로 정렬하여 카드 노출
      const sortedByFeeProximity = [...rangePlans].sort((a, b) => {
        if (currentFee > 0) {
          return Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee);
        }
        return a.price - b.price;
      });

      const topPlans = sortedByFeeProximity.slice(0, 1);

      const cards = topPlans.map((plan) => {
        let specStr = "";
        if (isMobile) {
          specStr = `\n${plan.data || "기본제공"}, ${plan.networkType || "5G"}, ${plan.voice || "음성 무제한"}, ${plan.sms || "문자 기본제공"}`;
        } else if (plan.speed || plan.tvPlan) {
          specStr = `\n${plan.speed || ""}${plan.speed && plan.tvPlan ? ", " : ""}${plan.tvPlan || ""}`;
        }
        return {
          value: plan.id,
          label: `${plan.name} 월 ${plan.price.toLocaleString("ko-KR")}원${specStr}`,
          next: args.next,
        };
      });

      return [
        ...cards,
        {
          value: "direct-choose",
          label: "🔍 제가 직접 골라볼게요!",
          next: listStepId,
        },
      ];
    },
    next: args.next,
  };

  const listStep: FlowStep = {
    id: listStepId,
    type: "single-choice",
    message: "입력하신 요금대와 비슷한 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요.",
    answerKey: `${args.answerKey}List`,
    options: [],
    optionsResolver: (answers) => {
      const isMobile = !!args.isMobile;
      const feeVal =
        answers[`${namespace}.${args.answerPrefix}Fee`] ??
        answers[`${namespace}.${args.answerPrefix}MobileFee`] ??
        answers[`${namespace}.${args.answerPrefix}TvFee`] ??
        0;
      const currentFee = Number(feeVal) || 0;

      let carrierVal =
        (answers[`${namespace}.${args.answerPrefix}Carrier`] as string) ||
        (answers[`${namespace}.${args.answerPrefix}MobileCarrier`] as string) ||
        (answers[`${namespace}.allCarrier`] as string) ||
        (answers[`${namespace}.diffCarrier`] as string) ||
        (answers[`${namespace}.diffMobileCarrier`] as string) ||
        (answers[`${namespace}.ptaCarrier`] as string) ||
        (answers[`${namespace}.ptbCarrier`] as string) ||
        (answers[`${namespace}.ptcCarrier`] as string) ||
        (answers[`${namespace}.newACarrier`] as string) ||
        (answers[`${namespace}.newBCarrier`] as string) ||
        (answers[`${namespace}.mobileCarrier`] as string) ||
        (answers[`${namespace}.commonCarrier`] as string) ||
        "";

      if (!carrierVal) {
        for (const key of Object.keys(answers)) {
          if (key.endsWith("Carrier")) {
            const val = answers[key];
            if (typeof val === "string" && val.trim() !== "") {
              carrierVal = val;
              break;
            }
          }
        }
      }

      const lowerCarrier = carrierVal.toLowerCase();
      const isMvno =
        lowerCarrier.includes("알뜰") ||
        lowerCarrier.includes("스카이") ||
        lowerCarrier.includes("mvno") ||
        lowerCarrier.includes("헬로") ||
        lowerCarrier.includes("이야기") ||
        lowerCarrier.includes("케이블") ||
        (!carrierVal && isMobile);

      let displayPlans: BundlePlan[] = [];

      if (isMobile && isMvno) {
        // 알뜰폰 모바일: 4개 브랜드 각각 ±15,000원 범위 최저가 순 정렬 후 브랜드 골고루 라운드로빈 수집
        const skyPlans: BundlePlan[] = mockMvnoMobilePlans.map((p) => ({
          id: p.id,
          name: `[KT 스카이라이프] ${p.mobilePlanName}`,
          price: p.price,
          carrier: "SKYLIFE",
          services: ["mobile"],
        }));

        const eyagiSktPlans: BundlePlan[] = mockEyagiSktMobilePlans.map((p) => ({
          id: p.id,
          name: `[이야기모바일(SKT)] ${p.mobilePlanName}`,
          price: p.price,
          carrier: "SKYLIFE",
          services: ["mobile"],
        }));

        const eyagiLguPlans: BundlePlan[] = mockEyagiLguMobilePlans.map((p) => ({
          id: p.id,
          name: `[이야기모바일(LGU+)] ${p.mobilePlanName}`,
          price: p.price,
          carrier: "SKYLIFE",
          services: ["mobile"],
        }));

        const helloSeen = new Set<string>();
        const helloPlans: BundlePlan[] = [];
        mockLgHelloBundles.forEach((b, idx) => {
          if (!helloSeen.has(b.mobilePlanName)) {
            helloSeen.add(b.mobilePlanName);
            helloPlans.push({
              id: `hello-mob-${idx}`,
              name: `[LG 헬로비전] ${b.mobilePlanName}`,
              price: b.mobileFee,
              carrier: "SKYLIFE",
              services: ["mobile"],
            });
          }
        });

        const brandGroups: { [brand: string]: BundlePlan[] } = {
          hello: helloPlans,
          sky: skyPlans,
          eyagi_skt: eyagiSktPlans,
          eyagi_lgu: eyagiLguPlans,
        };

        const brandKeys = ["hello", "sky", "eyagi_skt", "eyagi_lgu"];
        brandKeys.forEach((b) => {
          let list = brandGroups[b] || [];
          if (currentFee > 0) {
            // 실납부액과 가까운 금액부터 가져오기 위한 근접 순 정렬
            list.sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));
          } else {
            list.sort((a, b) => a.price - b.price);
          }
          brandGroups[b] = list;
        });

        const shuffledBrandKeys = [...brandKeys].sort(() => 0.5 - Math.random());
        const interleaved: BundlePlan[] = [];
        const maxLength = Math.max(...Object.values(brandGroups).map((g) => g.length), 0);

        for (let i = 0; i < maxLength; i++) {
          shuffledBrandKeys.forEach((b) => {
            if (brandGroups[b] && brandGroups[b][i]) {
              interleaved.push(brandGroups[b][i]);
            }
          });
        }

        // 실납부액에 가까운 요금제들을 추출한 뒤, 리스트에는 최저가 순(오름차순)으로 정렬하여 반영
        const nearbyTopPlans = interleaved.slice(0, 10);
        displayPlans = nearbyTopPlans.sort((a, b) => a.price - b.price);
      } else {
        const plans = resolveRecommendedBundlePlans(answers, args.answerPrefix, !!args.isMobile);
        let rangePlans = plans;
        if (currentFee > 0) {
          const filtered = plans.filter((p) => Math.abs(p.price - currentFee) <= 25000);
          if (filtered.length > 0) {
            rangePlans = filtered;
          }
        }
        // 유선/결합 상품 등: 실 납부액 근접 순 정렬
        let sortedPlans = [...rangePlans].sort((a, b) => {
          if (currentFee > 0) {
            return Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee);
          }
          return a.price - b.price;
        });
        displayPlans = isMobile ? sortedPlans.slice(0, 10) : (sortedPlans.length > 10 ? sortedPlans.slice(0, 10) : sortedPlans);
      }

      if (displayPlans.length === 0) {
        return [
          {
            value: "none-of-them",
            label: "목록에 없음 (금액 기준으로만 진단)",
            next: args.next,
          },
        ];
      }

      return [
        ...displayPlans.map((plan) => {
          let diffStr = "";
          if (currentFee > 0) {
            const diff = plan.price - currentFee;
            if (diff > 0) {
              diffStr = ` (+${diff.toLocaleString("ko-KR")}원)`;
            } else if (diff < 0) {
              diffStr = ` (${diff.toLocaleString("ko-KR")}원)`;
            } else {
              diffStr = " (동일)";
            }
          }
          return {
            value: plan.id,
            label: `${plan.name} (월 ${plan.price.toLocaleString("ko-KR")}원${diffStr})`,
            next: args.next,
          };
        }),
        {
          value: "none-of-them",
          label: "목록에 없음 (금액 기준으로만 진단)",
          next: args.next,
        },
      ];
    },
    next: args.next,
  };

  return [cardStep, listStep];
}

function ContractStatus(args: {
  id: string;
  message: string;
  answerKey: string;
  isMobile?: boolean;
  next: string;
  expiryNext?: string;
}): FlowStep {
  return {
    id: args.id,
    type: "single-choice",
    message: args.message,
    answerKey: args.answerKey,
    options: [
      {
        value: "만료",
        label: args.isMobile ? "약정이 만료됨" : "약정이 만료됨",
        next: args.expiryNext,
      },
      { value: "남음", label: "아직 약정 기간 남음" },
      { value: "모름", label: "잘 모르겠음" },
    ],
    next: args.next,
  };
}

function PenaltyQuestion(args: {
  id: string;
  message: string;
  answerKey: string;
  yesNext: string;
  noNext: string;
  isMobile?: boolean;
}): FlowStep {
  return {
    id: args.id,
    type: "single-choice",
    message: args.message,
    answerKey: args.answerKey,
    options: [
      { value: "yes", label: "알고있음", next: args.yesNext },
      {
        value: "no",
        label: args.isMobile ? "모르겠음(건너뛰기)" : "모르겠음(건너뛰기)",
        next: args.noNext,
      },
    ],
  };
}

function PenaltyInput(args: {
  id: string;
  message: string;
  answerKey: string;
  next: string;
}): FlowStep {
  return {
    id: args.id,
    type: "number-input",
    message: args.message,
    answerKey: args.answerKey,
    placeholder: "실제 납부액을 입력해주세요.",
    min: 0,
    unit: "원",
    next: args.next,
  };
}

// ──────────────────────────────────────────────
// 대분류 Flow 빌더 함수 (Major Flow Builders)
// ──────────────────────────────────────────────

function buildMobileFlow(args: {
  prefix: string;
  answerPrefix: string;
  nextForNoPenalty: string;
  nextForPenalty: string;
  skipMembers?: boolean;
}): FlowStep[] {
  const { prefix, answerPrefix, nextForNoPenalty, nextForPenalty, skipMembers } = args;

  const steps: FlowStep[] = [
    CarrierSelect({
      id: `${prefix}1`,
      message: "지금 쓰고 계신 모바일 통신사를 알려주시겠어요? 📱",
      answerKey: `${namespace}.${answerPrefix}Carrier`,
      options: [
        { value: "SKT", label: "SKT" },
        { value: "KT", label: "KT" },
        { value: "LG U+", label: "LG U+" },
        { value: "알뜰폰", label: "알뜰폰" },
      ],
      next: skipMembers ? `${prefix}2` : `${prefix}1_2`,
    }),
  ];

  if (!skipMembers) {
    steps.push({
      id: `${prefix}1_2`,
      type: "single-choice",
      message: "이동전화 결합 인원을 알려주세요",
      answerKey: `${namespace}.${answerPrefix}Members`,
      options: [
        { value: "1인", label: "1인" },
        { value: "2인", label: "2인" },
        { value: "3인", label: "3인" },
        { value: "4인", label: "4인" },
        { value: "5인 이상", label: "5인 이상" },
      ],
      next: `${prefix}2`,
    });
  }

  steps.push(
    MonthlyFeeInput({
      id: `${prefix}2`,
      message: "매달 실제로 내고 계신 모바일 요금을 입력해 주세요. 절약은 정확한 숫자에서 시작돼요! 💰",
      answerKey: `${namespace}.${answerPrefix}MobileFee`,
      placeholder: "실제 납부액을 입력해주세요.",
      next: `${prefix}3`,
    }),
    ...PlanCheckMethod({
      id: `${prefix}3`,
      message: "지금 사용 중이신 요금제가 혹시 요 제품이 맞는지 한번 확인해 주시겠어요? 📱👍",
      answerKey: `${namespace}.${answerPrefix}PlanCheck`,
      answerPrefix,
      isMobile: true,
      next: `${prefix}4`,
    }),
    {
      id: `${prefix}4`,
      type: "multi-choice",
      message: "받고 계신 할인 옵션이 있다면 골라주세요! 작은 할인 하나까지 빠짐없이 챙겨드릴게요 ✅",
      answerKey: `${namespace}.${answerPrefix}Discount`,
      options: [
        { value: "선택약정", label: "선택약정 25% 할인 받는 중" },
        { value: "가족결합", label: "가족 결합 할인 중" },
        { value: "no-discount", label: "할인 안 받음" },
        { value: "모름", label: "잘 모르겠음" },
      ],
      next: `${prefix}5`,
    },
    ContractStatus({
      id: `${prefix}5`,
      message: "핸드폰 약정은 지금 어떤 상태인가요?",
      answerKey: `${namespace}.${answerPrefix}Contract`,
      isMobile: true,
      next: `${prefix}6`,
      expiryNext: nextForNoPenalty,
    }),
    PenaltyQuestion({
      id: `${prefix}6`,
      message: "혹시 지금 해지하면 위약금이 얼마나 나오는지 알고 계세요? 모르셔도 괜찮아요, 그에 맞춰 진단해 드릴게요!",
      answerKey: `${namespace}.${answerPrefix}KnowPenalty`,
      yesNext: `${prefix}7`,
      noNext: nextForNoPenalty,
      isMobile: true,
    }),
    PenaltyInput({
      id: `${prefix}7`,
      message: "알고 계신 예상 위약금 금액을 입력해 주세요. 꼼꼼하게 반영해 드릴게요 ✍️",
      answerKey: `${namespace}.${answerPrefix}Penalty`,
      next: nextForPenalty,
    }),
  );

  return steps;
}

function buildInternetFlow(args: {
  prefix: string;
  answerPrefix: string;
  isCombo: boolean;
  nextForNoPenalty: string;
  nextForPenalty: string;
  skipCarrierSelect?: boolean;
}): FlowStep[] {
  const { prefix, answerPrefix, isCombo, nextForNoPenalty, nextForPenalty, skipCarrierSelect } = args;

  const carrierOptions = isCombo
    ? [
      { value: "SK브로드밴드(B tv)", label: "SK 브로드밴드(B tv)" },
      { value: "KT(지니 TV)", label: "KT(지니 TV)" },
      { value: "LG 유플러스(U+tv)", label: "LG 유플러스(U+tv)" },
      { value: "알뜰/지역케이블", label: "알뜰/지역케이블" },
    ]
    : [
      { value: "SK 브로드밴드", label: "SK 브로드밴드" },
      { value: "KT", label: "KT" },
      { value: "LG 유플러스", label: "LG 유플러스" },
      { value: "알뜰 인터넷", label: "알뜰 인터넷" },
    ];

  const carrierMessage = isCombo
    ? "지금 쓰고 계신 인터넷·TV 결합 통신사를 골라주세요 🏠"
    : "지금 쓰고 계신 인터넷 통신사를 골라주세요 🌐";

  const feeMessage = isCombo
    ? "인터넷과 TV를 합쳐서 매달 내고 계신 금액을 입력해 주세요 💰"
    : "인터넷 요금으로 매달 내고 계신 금액을 입력해 주세요 💰";

  const planCheckMessage = isCombo
    ? "결합 상품 요금제는 어떤 방법으로 확인해 볼까요? 🔍"
    : "인터넷 요금제는 어떤 방법으로 확인해 볼까요? 🔍";

  const contractMessage = isCombo
    ? "인터넷/TV 결합 상품의 약정은 어떤 상태인가요?"
    : "인터넷 상품의 약정은 어떤 상태인가요?";

  const penaltyMessage = isCombo
    ? "유선 상품은 해지 시 위약금이 나올 수 있어요. 혹시 금액을 알고 계세요?"
    : "인터넷은 해지 시 위약금이 나올 수 있어요. 혹시 금액을 알고 계세요?";

  const penaltyInputMessage = isCombo
    ? "유선 상품의 예상 위약금 금액을 입력해 주세요 ✍️"
    : "인터넷의 예상 위약금 금액을 입력해 주세요 ✍️";

  const intro1Id = `${prefix}_intro_1`;
  const intro2Id = `${prefix}_intro_2`;
  const firstStepId = skipCarrierSelect ? `${prefix}2` : `${prefix}1`;

  const steps: FlowStep[] = [
    {
      id: intro1Id,
      type: "assistant-message",
      message: "모바일 정보는 완벽하게 입력 완료했어요! 📱👍",
      next: intro2Id,
    },
    {
      id: intro2Id,
      type: "assistant-message",
      message: "다음 단계로 TV+인터넷 결합 정보를 살짝 확인해 볼게요! 📺🌐✨",
      next: firstStepId,
    },
  ];

  if (!skipCarrierSelect) {
    steps.push(
      CarrierSelect({
        id: `${prefix}1`,
        message: carrierMessage,
        answerKey: `${namespace}.${answerPrefix}Carrier`,
        options: carrierOptions,
        next: `${prefix}2`,
      })
    );
  }

  steps.push(
    MonthlyFeeInput({
      id: `${prefix}2`,
      message: feeMessage,
      answerKey: `${namespace}.${answerPrefix}Fee`,
      placeholder: isCombo ? "실제 납부액을 입력해주세요." : "실제 납부액을 입력해주세요.",
      next: `${prefix}3`,
    }),
    ...PlanCheckMethod({
      id: `${prefix}3`,
      message: planCheckMessage,
      answerKey: `${namespace}.${answerPrefix}PlanCheck`,
      answerPrefix,
      next: `${prefix}4`,
    }),
    ContractStatus({
      id: `${prefix}4`,
      message: contractMessage,
      answerKey: `${namespace}.${answerPrefix}Contract`,
      isMobile: false,
      next: `${prefix}5`,
      expiryNext: nextForNoPenalty,
    }),
    PenaltyQuestion({
      id: `${prefix}5`,
      message: penaltyMessage,
      answerKey: `${namespace}.${answerPrefix}KnowPenalty`,
      yesNext: `${prefix}6`,
      noNext: nextForNoPenalty,
      isMobile: false,
    }),
    PenaltyInput({
      id: `${prefix}6`,
      message: penaltyInputMessage,
      answerKey: `${namespace}.${answerPrefix}Penalty`,
      next: nextForPenalty,
    })
  );

  return steps;
}

function buildTvFlow(args: {
  prefix: string;
  answerPrefix: string;
  nextForNoPenalty: string;
  nextForPenalty: string;
}): FlowStep[] {
  const { prefix, answerPrefix, nextForNoPenalty, nextForPenalty } = args;

  return [
    CarrierSelect({
      id: `${prefix}1`,
      message: "지금 이용 중인 IPTV 통신사를 골라주세요 📺",
      answerKey: `${namespace}.${answerPrefix}Carrier`,
      options: [
        { value: "B tv", label: "B tv" },
        { value: "지니 TV", label: "지니 TV" },
        { value: "U+tv", label: "U+tv" },
        { value: "알뜰(지역케이블)", label: "알뜰(지역케이블)" },
      ],
      next: `${prefix}2`,
    }),
    MonthlyFeeInput({
      id: `${prefix}2`,
      message: "TV 상품으로 매달 내고 계신 금액을 입력해 주세요 💰",
      answerKey: `${namespace}.${answerPrefix}Fee`,
      placeholder: "실제 납부액을 입력해주세요.",
      next: `${prefix}3`,
    }),
    ...PlanCheckMethod({
      id: `${prefix}3`,
      message: "TV 요금제는 어떤 방법으로 확인해 볼까요? 🔍",
      answerKey: `${namespace}.${answerPrefix}PlanCheck`,
      answerPrefix,
      next: `${prefix}4`,
    }),
    ContractStatus({
      id: `${prefix}4`,
      message: "TV 상품의 약정은 어떤 상태인가요?",
      answerKey: `${namespace}.${answerPrefix}Contract`,
      isMobile: false,
      next: `${prefix}5`,
      expiryNext: nextForNoPenalty,
    }),
    PenaltyQuestion({
      id: `${prefix}5`,
      message: "TV는 해지 시 위약금이 나올 수 있어요. 혹시 금액을 알고 계세요?",
      answerKey: `${namespace}.${answerPrefix}KnowPenalty`,
      yesNext: `${prefix}6`,
      noNext: nextForNoPenalty,
      isMobile: false,
    }),
    PenaltyInput({
      id: `${prefix}6`,
      message: "TV 상품의 예상 위약금 금액을 입력해 주세요 ✍️",
      answerKey: `${namespace}.${answerPrefix}Penalty`,
      next: nextForPenalty,
    }),
  ];
}

// ──────────────────────────────────────────────
// MOCK 데이터 필터링 헬퍼 함수
// ──────────────────────────────────────────────

// 헬퍼: FlowAnswers에서 키 가져오기 (네임스페이스 포함/미포함 모든 경우 호환)
function getAnswerValue(answers: FlowAnswers, keyBase: string, defaultVal: string = ""): string {
  const keysToTry = [
    `telecom.${namespace}.${keyBase}`,
    `${namespace}.${keyBase}`,
    keyBase,
  ];

  for (const k of keysToTry) {
    const v = answers[k];
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string") return v;
      if (typeof v === "object") return (v as any).value || (v as any).label || defaultVal;
    }
  }

  const matchKey = Object.keys(answers).find(
    (k) => k.toLowerCase() === keyBase.toLowerCase() || k.toLowerCase().endsWith(`.${keyBase.toLowerCase()}`)
  );
  if (matchKey) {
    const v = answers[matchKey];
    if (v !== undefined && v !== null && v !== "") {
      if (typeof v === "string") return v;
      if (typeof v === "object") return (v as any).value || (v as any).label || defaultVal;
    }
  }

  return defaultVal;
}

// 🟢 모바일 데이터 조건 매칭 헬퍼 함수 (값 및 라벨 문자열 완벽 호환, 무제한은 무제한 및 100GB 초과량만 해당)
function matchesDataFilter(dataStr: string, desiredData: string): boolean {
  if (!desiredData) return true;

  const raw = desiredData.trim();
  let targetRange: "unlimited" | "50G-100G" | "10G-30G" | "under-10G" | "" = "";

  if (raw === "unlimited" || raw.includes("무제한") || raw.includes("헤비")) {
    targetRange = "unlimited";
  } else if (raw === "50G-100G" || raw.includes("50GB") || raw.includes("50G") || raw.includes("100GB")) {
    targetRange = "50G-100G";
  } else if (raw === "10G-30G" || raw.includes("10GB ~ 30GB") || raw.includes("10G ~ 30G") || raw.includes("30GB") || raw.includes("출퇴근")) {
    targetRange = "10G-30G";
  } else if (raw === "under-10G" || raw.includes("10GB 미만") || raw.includes("10G 미만") || raw.includes("와이파이")) {
    targetRange = "under-10G";
  }

  if (!targetRange) return true;

  const str = dataStr || "";
  let gbVal = 0;
  const match = str.match(/(\d+(\.\d+)?)\s*GB/i);
  if (match) {
    gbVal = parseFloat(match[1]);
  }

  // 1) 무제한 필요 (무제한 및 100GB 초과량만 해당)
  if (targetRange === "unlimited") {
    if (str.includes("무제한")) return true;
    if (str.includes("매일 5GB") || str.includes("매일5GB") || str.includes("일5GB")) return true;
    if (gbVal > 100) return true;
    return false;
  }

  // 2) 50GB ~ 100GB
  if (targetRange === "50G-100G") {
    if (str.includes("무제한")) return false;
    if (gbVal > 0) {
      return gbVal >= 50 && gbVal <= 100;
    }
    return str.includes("50GB") || str.includes("70GB") || str.includes("80GB") || str.includes("90GB") || str.includes("74GB");
  }

  // 3) 10GB ~ 30GB
  if (targetRange === "10G-30G") {
    if (str.includes("무제한")) return false;
    if (gbVal > 0) {
      return gbVal >= 10 && gbVal < 50;
    }
    return str.includes("10GB") || str.includes("15GB") || str.includes("20GB") || str.includes("30GB");
  }

  // 4) 10GB 미만
  if (targetRange === "under-10G") {
    if (str.includes("무제한")) return false;
    if (gbVal > 0) {
      return gbVal < 10;
    }
    return str.includes("1GB") || str.includes("2GB") || str.includes("3GB") || str.includes("4GB") || str.includes("5GB") || str.includes("6GB") || str.includes("7GB") || str.includes("8GB") || str.includes("9GB");
  }

  return true;
}

// 🟢 인터넷 속도 조건 매칭 헬퍼 함수
function matchesSpeedFilter(speedStr: string, desiredSpeed: string): boolean {
  if (!desiredSpeed) return true;
  const str = speedStr || "";

  if (desiredSpeed.includes("1Gbps") || desiredSpeed.includes("1G")) {
    return str.includes("1G") || str.includes("1Gbps");
  }
  if (desiredSpeed.includes("500Mbps") || desiredSpeed.includes("500M")) {
    return str.includes("500M") || str.includes("500Mbps") || str.includes("500MG");
  }
  if (desiredSpeed.includes("100Mbps") || desiredSpeed.includes("100M") || desiredSpeed.includes("200Mbps")) {
    return str.includes("100M") || str.includes("100Mbps") || str.includes("160M") || str.includes("160MG") || str.includes("200M") || str.includes("200Mbps");
  }
  return true;
}

// 🟢 고정 비용 최소화 추천 시 두 통신사의 비율이 4:6 또는 6:4로 골고루 나오게 하고 최저가 순 정렬
function getRatioBalancedMvnoCombos(
  skylife: any[],
  hello: any[],
  targetCount: number = 3
) {
  const sortedSky = [...skylife].sort((a, b) => a.totalPrice - b.totalPrice);
  const sortedHello = [...hello].sort((a, b) => a.totalPrice - b.totalPrice);

  const countA_Sky = Math.round(targetCount * 0.4);
  const countA_Hello = targetCount - countA_Sky;

  const countB_Sky = Math.round(targetCount * 0.6);
  const countB_Hello = targetCount - countB_Sky;

  // Ensure lists have enough elements
  if (sortedSky.length < Math.max(countA_Sky, countB_Sky) || sortedHello.length < Math.max(countA_Hello, countB_Hello)) {
    const combined = [...sortedSky, ...sortedHello].sort((a, b) => a.totalPrice - b.totalPrice);
    return combined.slice(0, targetCount);
  }

  // Try Scenario A: countA_Sky Skylife, countA_Hello Hello
  let scenarioA: any[] = [];
  let priceSumA = Infinity;
  if (sortedSky.length >= countA_Sky && sortedHello.length >= countA_Hello) {
    scenarioA = [...sortedSky.slice(0, countA_Sky), ...sortedHello.slice(0, countA_Hello)];
    priceSumA = scenarioA.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  // Try Scenario B: countB_Sky Skylife, countB_Hello Hello
  let scenarioB: any[] = [];
  let priceSumB = Infinity;
  if (sortedSky.length >= countB_Sky && sortedHello.length >= countB_Hello) {
    scenarioB = [...sortedSky.slice(0, countB_Sky), ...sortedHello.slice(0, countB_Hello)];
    priceSumB = scenarioB.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  // Choose the scenario with the lower total cost (or scenario A by default)
  let selected = scenarioA;
  if (priceSumB < priceSumA) {
    selected = scenarioB;
  }

  if (selected.length === 0) {
    const combined = [...sortedSky, ...sortedHello].sort((a, b) => a.totalPrice - b.totalPrice);
    return combined.slice(0, targetCount);
  }

  // Return the selected combinations sorted by price ascending
  return selected.sort((a, b) => a.totalPrice - b.totalPrice);
}

// 🟢 여러 통신사 데이터 교차 균등(라운드로빈) 배치 및 최저가순 정렬 헬퍼 함수
function interleaveAndSortByPrice<T extends { totalPrice: number }>(lists: T[][], limit?: number): T[] {
  const validLists = lists.filter((l) => l && l.length > 0);
  if (validLists.length === 0) return [];

  // 통신사별 리스트 개별 최저가 정렬 (동일 최저가 구간 내 랜던 요소 부여로 다양한 요금제 조합 교차 노출)
  const sortedLists = validLists.map((l) => {
    const arr = [...l].sort((a, b) => a.totalPrice - b.totalPrice);
    for (let i = 0; i < arr.length - 1; i++) {
      if (Math.abs(arr[i].totalPrice - arr[i + 1].totalPrice) <= 1000 && Math.random() > 0.5) {
        const temp = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = temp;
      }
    }
    return arr;
  });

  // 통신사 교차 순서를 무작위 셔플하여 통신사별 골고루 교차 배치
  const shuffledLists = [...sortedLists].sort(() => Math.random() - 0.5);

  const result: T[] = [];
  const maxLen = Math.max(...shuffledLists.map((l) => l.length));

  // 통신사별 골고루 라운드로빈 교차 수집
  for (let i = 0; i < maxLen; i++) {
    for (const list of shuffledLists) {
      if (list[i]) {
        result.push(list[i]);
      }
    }
  }

  // 상위 추천 N개 선택 후 최소금액 순으로 정렬
  if (limit && limit > 0) {
    const topN = result.slice(0, limit);
    return topN.sort((a, b) => a.totalPrice - b.totalPrice);
  }

  return result.sort((a, b) => a.totalPrice - b.totalPrice);
}

function filterMnoCombinations(answers: FlowAnswers) {
  const rawCarrier = getAnswerValue(answers, "desiredCarrier", "SKT");
  let carrier: Carrier = "SKT";
  if (rawCarrier.includes("KT")) carrier = "KT";
  else if (rawCarrier.includes("LG") || rawCarrier.includes("U+")) carrier = "LGU+";

  const rawMembers = getAnswerValue(answers, "desiredMembers", "1인");
  const lines = parseInt(rawMembers.replace(/[^0-9]/g, ""), 10) || 1;

  let combos = getPlanCombinations(carrier, lines);

  const rawData = getAnswerValue(answers, "desiredData", "");
  const rawSpeed = getAnswerValue(answers, "desiredSpeed", "");

  let dataFiltered = combos.filter((c) => matchesDataFilter(c.mobileSpeed, rawData));
  if (dataFiltered.length === 0) {
    if (!rawData) {
      dataFiltered = combos;
    } else {
      return [];
    }
  }

  let filtered = dataFiltered.filter((c) => matchesSpeedFilter(c.internetSpeed, rawSpeed));
  if (filtered.length === 0) filtered = dataFiltered;

  return filtered;
}

// 🟢 [Part 2 선택 기반 KT Skylife 요금제 교차 조합 필터링 함수]
function filterSkylifeCombinations(answers: FlowAnswers) {
  const rawData = getAnswerValue(answers, "desiredData", "");
  const rawSpeed = getAnswerValue(answers, "desiredSpeed", "");

  let filteredMobiles = mockMvnoMobilePlans.filter((m) => matchesDataFilter(m.data, rawData));
  if (filteredMobiles.length === 0) {
    if (!rawData) {
      filteredMobiles = mockMvnoMobilePlans;
    } else {
      return [];
    }
  }

  let filteredHomes = mockMvnoHomeBundles.filter((h) => matchesSpeedFilter(h.internetSpeed, rawSpeed));
  if (filteredHomes.length === 0) filteredHomes = mockMvnoHomeBundles;

  const combinations: { id: string; label: string; totalPrice: number; carrier: string }[] = [];
  filteredMobiles.forEach((mobile) => {
    filteredHomes.forEach((home) => {
      const totalPrice = mobile.price + home.bundleMonthlyFee;
      combinations.push({
        id: `${mobile.id}_${home.id}`,
        label: `[${mobile.carrier}] 1회선 | 모바일: ${mobile.mobilePlanName} | 인터넷+TV: ${home.internetName} + ${home.tvName} (월 ${totalPrice.toLocaleString("ko-KR")}원)`,
        totalPrice,
        carrier: "KT Skylife",
      });
    });
  });

  return combinations.sort((a, b) => a.totalPrice - b.totalPrice);
}

// 🟢 [Part 2 선택 기반 LG 헬로비전 요금제 조합 필터링 함수]
function filterHelloCombinations(answers: FlowAnswers) {
  const rawData = getAnswerValue(answers, "desiredData", "");
  const rawSpeed = getAnswerValue(answers, "desiredSpeed", "");

  let dataFiltered = mockLgHelloBundles.filter((b) => matchesDataFilter(b.data, rawData));
  if (dataFiltered.length === 0) {
    if (!rawData) {
      dataFiltered = mockLgHelloBundles;
    } else {
      return [];
    }
  }

  let filtered = dataFiltered.filter((b) => matchesSpeedFilter(b.internetSpeed, rawSpeed));
  if (filtered.length === 0) filtered = dataFiltered;

  return filtered
    .map((item) => ({
      id: item.id,
      label: `[${item.carrier}] 1회선 | 모바일: ${item.mobilePlanName} | 인터넷+TV: ${item.internetName} + ${item.tvName} (월 ${item.totalMonthlyFee.toLocaleString("ko-KR")}원)`,
      totalPrice: item.totalMonthlyFee,
      carrier: "LG 헬로비전",
    }))
    .sort((a, b) => a.totalPrice - b.totalPrice);
}

// 🟢 [Part 2 선택 기반 특정 3사 MNO 요금제 조합 필터링 함수]
function filterMnoForCarrier(answers: FlowAnswers, targetCarrier: Carrier) {
  const rawMembers = getAnswerValue(answers, "desiredMembers", "1인");
  const lines = parseInt(rawMembers.replace(/[^0-9]/g, ""), 10) || 1;
  const rawData = getAnswerValue(answers, "desiredData", "");
  const rawSpeed = getAnswerValue(answers, "desiredSpeed", "");

  let combos = getPlanCombinations(targetCarrier, lines);

  // 1. 모바일 데이터 조건 우선 필터링
  let dataFiltered = combos.filter((c) => matchesDataFilter(c.mobileSpeed, rawData));
  if (dataFiltered.length === 0) {
    const carrierAll = MOCK_PLAN_COMBINATIONS.filter((item) => item.carrier === targetCarrier && item.lines === lines);
    dataFiltered = carrierAll.filter((c) => matchesDataFilter(c.mobileSpeed, rawData));
  }

  if (dataFiltered.length === 0) {
    if (!rawData) {
      dataFiltered = combos;
    } else {
      return [];
    }
  }

  // 2. 모바일 데이터 조건 필터 결과를 바탕으로 인터넷 속도 필터링
  let speedFiltered = dataFiltered.filter((c) => matchesSpeedFilter(c.internetSpeed, rawSpeed));
  if (speedFiltered.length === 0) {
    speedFiltered = dataFiltered;
  }

  return speedFiltered
    .map((combo) => {
      const mobilePlan = combo.mobilePlan.replace(/\s*\([\d,]+원\)/g, "").trim();
      const tvPlan = combo.tvPlan
        .replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "")
        .replace(/\s*\(인터넷결합\)/g, "")
        .replace(/\s*\([\d,]+원\)/g, "")
        .trim();
      return {
        id: combo.id,
        label: `[${combo.carrier}] ${combo.lines}회선 | 모바일: ${mobilePlan} | 인터넷+TV: ${combo.internetPlan} + ${tvPlan} (월 ${combo.totalPrice.toLocaleString("ko-KR")}원)`,
        totalPrice: combo.totalPrice,
        carrier: combo.carrier,
      };
    })
    .sort((a, b) => a.totalPrice - b.totalPrice);
}

// 🟢 [Part 2 선택 기반 이야기 모바일 요금제 조합 필터링 함수 (1인 전용)]
function filterEyagiCombinations(answers: FlowAnswers) {
  const rawData = getAnswerValue(answers, "desiredData", "");
  const rawSpeed = getAnswerValue(answers, "desiredSpeed", "");

  // 1. 이야기 SKT + SKT 홈결합 조합
  let sktMobiles = mockEyagiSktMobilePlans.filter((m) => matchesDataFilter(m.data, rawData));
  if (sktMobiles.length === 0 && !rawData) sktMobiles = mockEyagiSktMobilePlans;

  let sktHomes = mockSktHomeBundles.filter((h) => matchesSpeedFilter(h.internetSpeed, rawSpeed));
  if (sktHomes.length === 0) sktHomes = mockSktHomeBundles;

  // 2. 이야기 LGU+ + LGU+ 홈결합 조합
  let lguMobiles = mockEyagiLguMobilePlans.filter((m) => matchesDataFilter(m.data, rawData));
  if (lguMobiles.length === 0 && !rawData) lguMobiles = mockEyagiLguMobilePlans;

  let lguHomes = mockLguHomeBundles.filter((h) => matchesSpeedFilter(h.internetSpeed, rawSpeed));
  if (lguHomes.length === 0) lguHomes = mockLguHomeBundles;

  const combinations: { id: string; label: string; totalPrice: number; carrier: string }[] = [];

  if (sktMobiles.length > 0 && (mockEyagiSktMobilePlans.length === 0 || matchesDataFilter(sktMobiles[0].data, rawData))) {
    sktMobiles.forEach((mobile) => {
      if (!matchesDataFilter(mobile.data, rawData)) return;
      sktHomes.forEach((home) => {
        const discount = 4400; // 이야기 SKT 결합 추가 할인
        const totalPrice = mobile.price + home.bundleMonthlyFee - discount;
        combinations.push({
          id: `${mobile.id}_${home.id}`,
          label: `[${mobile.mvnoCarrier}] 1회선 | 모바일: ${mobile.mobilePlanName} | 인터넷+TV: ${home.internetName} + ${home.tvName} (월 ${totalPrice.toLocaleString("ko-KR")}원)`,
          totalPrice,
          carrier: mobile.mvnoCarrier,
        });
      });
    });
  }

  if (lguMobiles.length > 0) {
    lguMobiles.forEach((mobile) => {
      if (!matchesDataFilter(mobile.data, rawData)) return;
      lguHomes.forEach((home) => {
        const totalPrice = mobile.price + home.bundleMonthlyFee;
        combinations.push({
          id: `${mobile.id}_${home.id}`,
          label: `[${mobile.mvnoCarrier}] 1회선 | 모바일: ${mobile.mobilePlanName} | 인터넷+TV: ${home.internetName} + ${home.tvName} (월 ${totalPrice.toLocaleString("ko-KR")}원)`,
          totalPrice,
          carrier: mobile.mvnoCarrier,
        });
      });
    });
  }

  return combinations.sort((a, b) => a.totalPrice - b.totalPrice);
}

// 🟢 [Part 2 선택 기반 위약금 대비 실질 이득 추천 (any) 통신사별 균등 추천 교차 생성 함수]
function filterAnyCombinations(answers: FlowAnswers) {
  const rawMembers = (answers[`${namespace}.desiredMembers`] as string) || "1인";
  const lines = parseInt(rawMembers.replace(/[^0-9]/g, ""), 10) || 1;

  const sktCombos = filterMnoForCarrier(answers, "SKT");
  const ktCombos = filterMnoForCarrier(answers, "KT");
  const lguCombos = filterMnoForCarrier(answers, "LGU+");

  const carrierLists = [sktCombos, ktCombos, lguCombos];

  // 🟢 결합 인원이 1인인 경우에만 결합인원이 없는 알뜰폰(스카이라이프, 헬로비전, 이야기 모바일) 요금제 포함
  if (lines === 1) {
    const skylifeCombos = filterSkylifeCombinations(answers);
    const helloCombos = filterHelloCombinations(answers);
    const eyagiCombos = filterEyagiCombinations(answers);

    carrierLists.push(skylifeCombos, helloCombos, eyagiCombos);
  }

  return interleaveAndSortByPrice(carrierLists);
}

// ──────────────────────────────────────────────
// 전체 Flow 구성 (Steps Definition)
// ──────────────────────────────────────────────

const steps: FlowStep[] = [
  // -------------------------------------------------------------
  // [Part 1] 현재 사용자 정보 입력 파트
  // -------------------------------------------------------------

  // [Part 1 - 0번] 시작 안내 챗봇 대사
  {
    id: "bundle-intro-1",
    type: "assistant-message",
    message: "안녕하세요! 유저님의 똑똑한 지갑 파수꾼, 모잇이에요! ✨",
    next: "bundle-intro-2",
  },
  {
    id: "bundle-intro-2",
    type: "assistant-message",
    message: "지금 갖고 계신 결합상품 혜택을 꼼꼼하게 진단해 드릴까요? 💡 딱 맞는 최적의 솔루션을 찾아드릴 테니, 먼저 간단한 정보부터 차근차근 확인해 볼게요! 👍",
    next: "bundle-intro-3",
  },
  {
    id: "bundle-intro-3",
    type: "assistant-message",
    message: "첫 번째 단계로, 현재 모바일을 어떻게 이용하고 계시는지 살짝 확인해 볼게요! 📱💡",
    next: "Q_START",
  },

  // 1번 질문 ID: Q_START
  {
    id: "Q_START",
    type: "single-choice",
    message: "지금 쓰고 계신 모바일 통신사를 알려주시겠어요? 📱",
    answerKey: `${namespace}.startState`,
    options: [
      { value: "all_same", label: "전부 같아요 🎯", next: "Q_ALL_M1" },
      { value: "part_same", label: "일부만 같아요 🧩", next: "Q_PART_SELECT" },
      { value: "all_diff", label: "모두 달라요 🔀", next: "Q_DIFF_START" },
      { value: "new_start", label: "새로 가입해요 ✨", next: "Q_NEW_SELECT" },
    ],
  },

  // 🟢 [전부 같아요 패스]
  ...buildMobileFlow({
    prefix: "Q_ALL_M",
    answerPrefix: "all",
    nextForNoPenalty: "Q_ALL_I_intro_1",
    nextForPenalty: "Q_ALL_I_intro_1",
  }),

  // 전부 같아요 유선(인터넷+TV) 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_ALL_I",
    answerPrefix: "allCombo",
    isCombo: true,
    nextForNoPenalty: "bundle-p2-intro-1",
    nextForPenalty: "bundle-p2-intro-1",
    skipCarrierSelect: true,
  }),

  // 🟡 [일부만 같아요 패스]
  {
    id: "Q_PART_SELECT",
    type: "single-choice",
    message: "쓰고 계신 결합 상품이 구체적으로 어떤 형태인지 골라주세요 🔗",
    answerKey: `${namespace}.partSelect`,
    options: [
      { value: "pta", label: "📱 1인 결합 (모바일 1회선 / 인터넷+TV)", next: "Q_PTA_M1" },
      { value: "ptc", label: "👨‍👩‍👧‍👦 다인/가족 결합 (모바일 여러 회선 / 인터넷+TV)", next: "Q_PTA_M1" },
      { value: "ptb", label: "🌐 인터넷 전용 결합 (모바일 + 인터넷 / TV 제외)", next: "Q_PTB_M1" },
    ],
  },

  // PTA 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTA_M",
    answerPrefix: "pta",
    nextForNoPenalty: "Q_PTA_I_intro_1",
    nextForPenalty: "Q_PTA_I_intro_1",
    skipMembers: true,
  }),

  // PTA 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTA_I",
    answerPrefix: "ptaCombo",
    isCombo: true,
    nextForNoPenalty: "bundle-p2-intro-1",
    nextForPenalty: "bundle-p2-intro-1",
  }),

  // PTB 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTB_M",
    answerPrefix: "ptb",
    nextForNoPenalty: "Q_PTB_I_intro_1",
    nextForPenalty: "Q_PTB_I_intro_1",
    skipMembers: true,
  }),

  // PTB 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTB_I",
    answerPrefix: "ptbCombo",
    isCombo: true,
    nextForNoPenalty: "bundle-p2-intro-1",
    nextForPenalty: "bundle-p2-intro-1",
  }),

  // PTC 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTC_M",
    answerPrefix: "ptc",
    nextForNoPenalty: "Q_PTC_I_intro_1",
    nextForPenalty: "Q_PTC_I_intro_1",
  }),

  // PTC 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTC_I",
    answerPrefix: "ptcCombo",
    isCombo: true,
    nextForNoPenalty: "bundle-p2-intro-1",
    nextForPenalty: "bundle-p2-intro-1",
  }),

  // 🔵 [다 달라요 패스]
  {
    id: "Q_DIFF_START",
    type: "multi-choice",
    message: "결합 없이 따로 쓰고 계신 서비스가 있다면 골라주세요 ✅",
    answerKey: `${namespace}.diffServices`,
    options: [
      { value: "phone", label: "모바일" },
      { value: "internet", label: "인터넷" },
      { value: "iptv", label: "IPTV" },
    ],
    next: "Q_DIFF_ROUTE_1",
  },
  {
    id: "Q_DIFF_ROUTE_1",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "phone", next: "Q_DIFF_M1" },
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "internet", next: "Q_DIFF_I1" },
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "iptv", next: "Q_DIFF_T1" },
    ],
    defaultNext: "bundle-p2-intro-1",
  },

  // 1-1. 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_DIFF_M",
    answerPrefix: "diff",
    nextForNoPenalty: "Q_DIFF_M_NEXT",
    nextForPenalty: "Q_DIFF_M_NEXT",
  }),
  {
    id: "Q_DIFF_M_NEXT",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "internet", next: "Q_DIFF_I1" },
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "iptv", next: "Q_DIFF_T1" },
    ],
    defaultNext: "bundle-p2-intro-1",
  },

  // 1-2. 인터넷 약정/위약금 수집 6단계
  ...buildInternetFlow({
    prefix: "Q_DIFF_I",
    answerPrefix: "diffInternet",
    isCombo: false,
    nextForNoPenalty: "Q_DIFF_I_NEXT",
    nextForPenalty: "Q_DIFF_I_NEXT",
  }),
  {
    id: "Q_DIFF_I_NEXT",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.diffServices`, operator: "includes", value: "iptv", next: "Q_DIFF_T1" },
    ],
    defaultNext: "bundle-p2-intro-1",
  },

  // 1-3. TV 약정/위약금 수집 6단계
  ...buildTvFlow({
    prefix: "Q_DIFF_T",
    answerPrefix: "diffTv",
    nextForNoPenalty: "bundle-p2-intro-1",
    nextForPenalty: "bundle-p2-intro-1",
  }),

  // ⚫ [새로 시작해요 패스]
  {
    id: "Q_NEW_SELECT",
    type: "single-choice",
    message: "세부 경로 선택",
    answerKey: `${namespace}.newSelect`,
    options: [
      { value: "new_mobile", label: "모바일 요금제도 새로 가입할래요 (신규가입/번호이동)", next: "Q_4A_M1" },
      { value: "keep_mobile", label: "모바일 요금제 유지 (결합 필요)", next: "Q_4B_M1" },
    ],
  },

  // 4-A 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_4A_M",
    answerPrefix: "newA",
    nextForNoPenalty: "bundle-p2-intro-1",
    nextForPenalty: "bundle-p2-intro-1",
    skipMembers: true,
  }),

  // 4-B 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_4B_M",
    answerPrefix: "newB",
    nextForNoPenalty: "bundle-p2-intro-1",
    nextForPenalty: "bundle-p2-intro-1",
    skipMembers: true,
  }),

  // [Part 2 - 0번] Part 2 전환 챗봇 안내 대사
  {
    id: "bundle-p2-intro-1",
    type: "assistant-message",
    message: "여기까지 유저님이 지금 사용 중이신 정보를 알차게 잘 모았어요! 📝✨",
    next: "bundle-p2-intro-2",
  },
  {
    id: "bundle-p2-intro-2",
    type: "assistant-message",
    message: "이제 유저님의 찰떡 생활 습관과 딱 맞는 최적의 요금제를 찾아볼 차례예요! 차근차근 함께 골라볼까요? 💡👍",
    next: "Q_P2_1",
  },

  {
    id: "Q_P2_1",
    type: "multi-choice",
    message: "어떤 조합으로 묶어볼까요? 원하시는 만큼 골라주세요! (다중선택 가능) 🔗",
    answerKey: `${namespace}.desiredProducts`,
    options: [
      { value: "phone", label: "이동전화" },
      { value: "internet", label: "인터넷" },
      { value: "iptv", label: "IPTV" },
    ],
    next: "Q_P2_2",
  },

  {
    id: "Q_P2_2",
    type: "single-choice",
    message: "[모잇의 안내] 위약금을 입력하지 않으시면 정확한 진단이 어려울 수 있어요.\n그런 경우엔 가장 저렴한 상품 중심으로 추천해 드릴게요 💰",
    answerKey: `${namespace}.desiredCompanyType`,
    options: [
      { value: "mvno", label: "고정 비용 최소화 추천 (알뜰폰/케이블 최저가 위주로 추천)", next: "Q_P2_3_ROUTE" },
      { value: "mno", label: "품질 및 결합 혜택 우선 추천 (메이저 3사 결합 위주로 추천)", next: "Q_P2_CARRIER" },
      { value: "any", label: "위약금 대비 실질 이득 추천 (위약금 내고 갈아타도 이득인지 비교)", next: "Q_P2_3_ROUTE" },
    ],
    next: "Q_P2_3_ROUTE",
  },

  {
    id: "Q_P2_CARRIER",
    type: "single-choice",
    message: "원하시는 통신사를 선택해 주세요.",
    answerKey: `${namespace}.desiredCarrier`,
    options: [
      { value: "SKT", label: "SKT" },
      { value: "KT", label: "KT" },
      { value: "LGU+", label: "LG U+" },
    ],
    next: "Q_P2_3_ROUTE",
  },

  {
    id: "Q_P2_3_ROUTE",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.desiredProducts`, operator: "includes", value: "phone", next: "Q_P2_DATA" },
      { answerKey: `${namespace}.desiredProducts`, operator: "includes", value: "internet", next: "Q_P2_SPEED" },
    ],
    defaultNext: "Q_P2_4",
  },

  {
    id: "Q_P2_DATA",
    type: "single-choice",
    message: "평소에 자주 쓰시는 데이터 양이나, 딱 원하시는 데이터 스타일이 있으신가요? 📱✨",
    answerKey: `${namespace}.desiredData`,
    options: [
      { value: "unlimited", label: "무제한 필요 (헤비 유저)" },
      { value: "50G-100G", label: "50GB ~ 100GB (일반 동영상 시청)" },
      { value: "10G-30G", label: "10GB ~ 30GB (출퇴근 웹서핑)" },
      { value: "under-10G", label: "10GB 미만 (주로 와이파이 사용)" },
    ],
    next: "Q_P2_DATA_NEXT",
  },

  {
    id: "Q_P2_DATA_NEXT",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.desiredCompanyType`, operator: "equals", value: "mvno", next: "Q_P2_MEMBERS_NEXT" },
    ],
    defaultNext: "Q_P2_MEMBERS",
  },

  {
    id: "Q_P2_MEMBERS",
    type: "single-choice",
    message: "이번에 같이 묶어서 할인받으실 모바일 회선(인원)은 총 몇 명인가요? 👨‍👩‍👧‍👦💡",
    answerKey: `${namespace}.desiredMembers`,
    options: [
      { value: "1인", label: "1인" },
      { value: "2인", label: "2인" },
      { value: "3인", label: "3인" },
      { value: "4인", label: "4인" },
      { value: "5인 이상", label: "5인 이상" },
    ],
    next: "Q_P2_MEMBERS_NEXT",
  },

  {
    id: "Q_P2_MEMBERS_NEXT",
    type: "branch",
    conditions: [
      { answerKey: `${namespace}.desiredProducts`, operator: "includes", value: "internet", next: "Q_P2_SPEED" },
    ],
    defaultNext: "Q_P2_4",
  },

  {
    id: "Q_P2_SPEED",
    type: "single-choice",
    message: "자주 쓰시던 인터넷 속도나, 딱 원하시는 인터넷 사양이 있다면 알려주세요! 🌐⚡",
    answerKey: `${namespace}.desiredSpeed`,
    options: [
      { value: "100Mbps", label: "100Mbps (웹서핑·유튜브)" },
      { value: "500Mbps", label: "500Mbps (고화질 영상·게임)" },
      { value: "1Gbps", label: "1Gbps (대용량 다운로드·방송)" },
    ],
    next: "Q_P2_4",
  },

  {
    id: "Q_P2_4",
    type: "assistant-message",
    message: "필요한 정보를 모두 받았어요! 이제 모잇이 열심히 계산해 볼게요 🔍",
    next: "bundle-recommendation-api",
  },

  {
    id: "bundle-recommendation-api",
    type: "single-choice",
    message: "짜잔! 알려주신 조건을 꼼꼼히 분석해서 딱 맞는 요금제만 챙겨왔어요 ✨",
    answerKey: `${namespace}.selectedRecommendedPlan`,
    options: [
      {
        value: "direct-choose",
        label: "🔍 제가 직접 골라볼게요!",
        next: "bundle-all-plans-select",
      },
    ],
    optionsResolver: (answers) => {
      const companyType = getAnswerValue(answers, "desiredCompanyType", "any");

      // 🟢 1. [고정 비용 최소화 추천 (mvno)] 선택 시 (스카이라이프 & 헬로비전 1회선)
      if (companyType === "mvno") {
        const skylifeCombos = filterSkylifeCombinations(answers);
        const helloCombos = filterHelloCombinations(answers);

        const topMvno = getRatioBalancedMvnoCombos(skylifeCombos, helloCombos, 4);

        return [
          ...topMvno.map((combo, idx) => ({
            value: combo.id,
            label: `[추천 ${idx + 1}순위] ${combo.label}`,
            next: "bundle-result",
          })),
          {
            value: "direct-choose",
            label: "🔍 제가 직접 골라볼게요!",
            next: "bundle-all-plans-select",
          },
        ];
      }

      // 🟡 2. [품질 및 결합 혜택 우선 추천 (mno)] 선택 시 (선택 통신사 버튼 반영)
      if (companyType === "mno") {
        const rawCarrier = getAnswerValue(answers, "desiredCarrier", "");
        let combos: { id: string; label: string; totalPrice: number; carrier: string }[] = [];

        if (rawCarrier.includes("SKT")) {
          combos = filterMnoForCarrier(answers, "SKT");
        } else if (rawCarrier.includes("KT")) {
          combos = filterMnoForCarrier(answers, "KT");
        } else if (rawCarrier.includes("LG") || rawCarrier.includes("U+")) {
          combos = filterMnoForCarrier(answers, "LGU+");
        } else {
          const sktCombos = filterMnoForCarrier(answers, "SKT");
          const ktCombos = filterMnoForCarrier(answers, "KT");
          const lguCombos = filterMnoForCarrier(answers, "LGU+");
          combos = interleaveAndSortByPrice([sktCombos, ktCombos, lguCombos]);
        }

        const topMno = combos.slice(0, 4);

        return [
          ...topMno.map((combo, idx) => ({
            value: combo.id,
            label: `[추천 ${idx + 1}순위] ${combo.label}`,
            next: "bundle-result",
          })),
          {
            value: "direct-choose",
            label: "🔍 제가 직접 골라볼게요!",
            next: "bundle-all-plans-select",
          },
        ];
      }

      // 🔵 3. [위약금 대비 실질 이득 추천 (any)] 선택 시 (3사 + 1인시 알뜰 포함)
      if (companyType === "any") {
        const rawMembers = getAnswerValue(answers, "desiredMembers", "1인");
        const lines = parseInt(rawMembers.replace(/[^0-9]/g, ""), 10) || 1;

        const sktCombos = filterMnoForCarrier(answers, "SKT");
        const ktCombos = filterMnoForCarrier(answers, "KT");
        const lguCombos = filterMnoForCarrier(answers, "LGU+");

        const carrierLists = [sktCombos, ktCombos, lguCombos];

        // 🟢 결합 인원이 1인인 경우에만 알뜰폰/케이블 (스카이라이프, 헬로비전, 이야기 모바일) 요금제 포함
        if (lines === 1) {
          const skylifeCombos = filterSkylifeCombinations(answers);
          const helloCombos = filterHelloCombinations(answers);
          const eyagiCombos = filterEyagiCombinations(answers);

          carrierLists.push(skylifeCombos, helloCombos, eyagiCombos);
        }

        // 전체 통신사 골고루 교차 배치 후 최저가순 상위 4개 추출
        const topAny = interleaveAndSortByPrice(carrierLists, 4);

        return [
          ...topAny.map((combo, idx) => ({
            value: combo.id,
            label: `[추천 ${idx + 1}순위] ${combo.label}`,
            next: "bundle-result",
          })),
          {
            value: "direct-choose",
            label: "🔍 제가 직접 골라볼게요!",
            next: "bundle-all-plans-select",
          },
        ];
      }

      // 일반 백업 추천
      const basePlans = mockBundlePlans;
      const topPlans = basePlans.slice(0, 4);

      return [
        ...topPlans.map((plan, idx) => ({
          value: plan.id,
          label: `[추천 ${idx + 1}순위] ${plan.name} (월 ${plan.price.toLocaleString("ko-KR")}원)`,
          next: "bundle-result",
        })),
        {
          value: "direct-choose",
          label: "🔍 제가 직접 골라볼게요!",
          next: "bundle-all-plans-select",
        },
      ];
    },
    next: "bundle-result",
  },

  {
    id: "bundle-all-plans-select",
    type: "single-choice",
    message: "추천 요금제 외에 선택할 수 있는 전체 요금제도 준비했어요. 원하시는 요금제를 골라주세요 ✅",
    answerKey: `${namespace}.manualSelectedPlan`,
    options: [],
    optionsResolver: (answers) => {
      const companyType = getAnswerValue(answers, "desiredCompanyType", "any");

      // 🟢 고정비 최소화 추천 (mvno)
      if (companyType === "mvno") {
        const skylifeCombos = filterSkylifeCombinations(answers);
        const helloCombos = filterHelloCombinations(answers);

        const allMvnoCombos = getRatioBalancedMvnoCombos(skylifeCombos, helloCombos, 10);

        return [
          ...allMvnoCombos.map((combo) => ({
            value: combo.id,
            label: combo.label,
            next: "bundle-result",
          })),
          {
            value: "none-of-them",
            label: "목록에 없음 🔍 (금액으로 간단 진단! 💡)",
            next: "bundle-result",
          },
        ];
      }

      // 1) 품질 및 결합 혜택 우선 추천 (mno)
      if (companyType === "mno") {
        const rawCarrier = getAnswerValue(answers, "desiredCarrier", "");
        let combos: { id: string; label: string; totalPrice: number; carrier: string }[] = [];

        if (rawCarrier.includes("SKT")) {
          combos = filterMnoForCarrier(answers, "SKT");
        } else if (rawCarrier.includes("KT")) {
          combos = filterMnoForCarrier(answers, "KT");
        } else if (rawCarrier.includes("LG") || rawCarrier.includes("U+")) {
          combos = filterMnoForCarrier(answers, "LGU+");
        } else {
          const sktCombos = filterMnoForCarrier(answers, "SKT");
          const ktCombos = filterMnoForCarrier(answers, "KT");
          const lguCombos = filterMnoForCarrier(answers, "LGU+");
          combos = interleaveAndSortByPrice([sktCombos, ktCombos, lguCombos]);
        }

        const allMnoCombos = combos.slice(0, 12);

        return [
          ...allMnoCombos.map((combo) => ({
            value: combo.id,
            label: combo.label,
            next: "bundle-result",
          })),
          {
            value: "none-of-them",
            label: "목록에 없음 🔍 (금액으로 간단 진단! 💡)",
            next: "bundle-result",
          },
        ];
      }

      // 2) 위약금 대비 실질 이득 추천 (any)
      if (companyType === "any") {
        const rawMembers = getAnswerValue(answers, "desiredMembers", "1인");
        const lines = parseInt(rawMembers.replace(/[^0-9]/g, ""), 10) || 1;

        const sktCombos = filterMnoForCarrier(answers, "SKT");
        const ktCombos = filterMnoForCarrier(answers, "KT");
        const lguCombos = filterMnoForCarrier(answers, "LGU+");

        const carrierLists = [sktCombos, ktCombos, lguCombos];

        if (lines === 1) {
          const skylifeCombos = filterSkylifeCombinations(answers);
          const helloCombos = filterHelloCombinations(answers);
          const eyagiCombos = filterEyagiCombinations(answers);

          carrierLists.push(skylifeCombos, helloCombos, eyagiCombos);
        }

        const allAnyCombos = interleaveAndSortByPrice(carrierLists).slice(0, 12);

        return [
          ...allAnyCombos.map((combo) => ({
            value: combo.id,
            label: combo.label,
            next: "bundle-result",
          })),
          {
            value: "none-of-them",
            label: "목록에 없음 🔍 (금액으로 간단 진단! 💡)",
            next: "bundle-result",
          },
        ];
      }

      // 2) 일반 전체 요금제 리스트 (any 등)
      const basePlans = mockBundlePlans;
      let filtered = basePlans;

      if (filtered.length === 0) {
        filtered = basePlans;
      }

      return [
        ...filtered.map((plan) => ({
          value: plan.id,
          label: `${plan.name} (월 ${plan.price.toLocaleString("ko-KR")}원)`,
          next: "bundle-result",
        })),
        {
          value: "none-of-them",
          label: "목록에 없음 🔍 (금액으로 간단 진단! 💡)",
          next: "bundle-result",
        },
      ];
    },
    next: "bundle-result",
  },

  {
    id: "bundle-result",
    type: "result",
    message: "입력해 주신 정보로 최적의 결합 상품 추천 리포트를 완성했어요! 얼마나 아낄 수 있는지 확인해 보세요 💰",
    next: "bundle-ask-grade",
  },

  // -------------------------------------------------------------
  // [Part 3] 소비 패턴 등급 진단
  // -------------------------------------------------------------
  {
    id: "bundle-ask-grade",
    type: "single-choice",
    message: "여기서 끝이 아니에요! 절감액을 바탕으로 소비 패턴 등급도 진단받아 보시겠어요? 💡",
    answerKey: `${namespace}.askGrade`,
    options: [
      { value: "yes", label: "YES", next: "bundle-grade-result" },
      { value: "no", label: "NO", next: "bundle-completed-exit" },
    ],
    next: "bundle-completed-exit",
  },

  {
    id: "bundle-grade-result",
    type: "result",
    message: "소비 패턴 등급 진단 완료! 결과 등급 카드가 나왔어요. 지금 확인해 보세요 ✨",
  },

  {
    id: "bundle-completed-exit",
    type: "result",
  },
];

export const bundleFlow: FlowDefinition = {
  id: "bundle-flow",
  subCategoryId: "bundle",
  categoryId: "telecom",
  startStepId: "bundle-intro-1",
  steps: composeFlow(steps),
};