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
      const [res5g, resLte] = await Promise.all([
        fetchSmartChoicePhonePlans({ voice: "999999", data: "20480", sms: "999999", age: "20", type: "6", dis: "24" }),
        fetchSmartChoicePhonePlans({ voice: "999999", data: "20480", sms: "999999", age: "20", type: "3", dis: "24" }),
      ]);

      const rawPlans = [...(res5g.plans || []), ...(resLte.plans || [])];
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
  const carrierVal =
    (answers[`${namespace}.${answerPrefix}Carrier`] as string) ||
    (answers[`${namespace}.commonCarrier`] as string) ||
    "";

  const feeVal =
    answers[`${namespace}.${answerPrefix}Fee`] ??
    answers[`${namespace}.${answerPrefix}MobileFee`] ??
    answers[`${namespace}.${answerPrefix}TvFee`] ??
    0;

  const currentFee = Number(feeVal) || 0;
  const lowerCarrier = carrierVal.toLowerCase();

  // 모바일 관련 질문인 경우 기존 로직 수행
  const isMobileQuery =
    isMobileOnly ||
    answerPrefix.includes("Mobile") ||
    answerPrefix.includes("mobile") ||
    ["all", "pta", "ptb", "ptc", "diff", "newA", "newB"].includes(answerPrefix);

  if (isMobileQuery) {
    let targetCarrier = "";
    if (carrierVal.includes("SK")) {
      targetCarrier = "SK";
    } else if (carrierVal.includes("KT")) {
      targetCarrier = "KT";
    } else if (carrierVal.includes("LG") || carrierVal.includes("U+")) {
      targetCarrier = "LGU";
    } else if (carrierVal.includes("알뜰") || carrierVal.includes("스카이")) {
      targetCarrier = "SKYLIFE";
    }

    let basePlans = apiPlansCache && apiPlansCache.length > 0 ? apiPlansCache : mockBundlePlans;
    let plans = basePlans;
    if (targetCarrier) {
      const filtered = basePlans.filter((p) => p.carrier === targetCarrier);
      if (filtered.length > 0) {
        plans = filtered;
      }
    }

    if (currentFee > 0) {
      plans = [...plans].sort(
        (a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee)
      );
    }
    return plans;
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
    name: `[이야기모바일] ${h.internetName} + ${h.tvName}`,
    price: h.bundleMonthlyFee,
    services: ["internet", "iptv"],
  }));

  const eyagiLguHomePlans: BundlePlan[] = mockLguHomeBundles.map((h) => ({
    id: `eyagi-lgu-${h.id}`,
    carrier: "SKYLIFE",
    name: `[이야기모바일] ${h.internetName} + ${h.tvName}`,
    price: h.bundleMonthlyFee,
    services: ["internet", "iptv"],
  }));

  const mvnoHomePlans = [...skyHomePlans, ...helloHomePlans, ...eyagiSktHomePlans, ...eyagiLguHomePlans];

  if (
    lowerCarrier.includes("알뜰") ||
    lowerCarrier.includes("지역") ||
    lowerCarrier.includes("케이블") ||
    lowerCarrier.includes("스카이") ||
    lowerCarrier.includes("헬로") ||
    lowerCarrier.includes("이야기")
  ) {
    homePlans = mvnoHomePlans;
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
    placeholder: args.placeholder || "예: 55000",
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
    options: [],
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
        rangePlans = plans.filter((p) => Math.abs(p.price - currentFee) <= 10000);
        if (rangePlans.length === 0) {
          rangePlans = plans;
        }
      }

      const topPlans = isMobile
        ? rangePlans.slice(0, 4)
        : [...rangePlans].sort(() => 0.5 - Math.random()).slice(0, 2);

      const cards = topPlans.map((plan, idx) => ({
        value: plan.id,
        label: `[추천 ${idx + 1}순위] ${plan.name} (월 ${plan.price.toLocaleString("ko-KR")}원)`,
        next: args.next,
      }));

      return [
        ...cards,
        {
          value: "direct-choose",
          label: "직접 고를래요(리스트 보기)",
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
      const plans = resolveRecommendedBundlePlans(answers, args.answerPrefix, !!args.isMobile);
      const feeVal =
        answers[`${namespace}.${args.answerPrefix}Fee`] ??
        answers[`${namespace}.${args.answerPrefix}MobileFee`] ??
        answers[`${namespace}.${args.answerPrefix}TvFee`] ??
        0;
      const currentFee = Number(feeVal) || 0;

      // 입력 금액 기준 ±10,000원 범위 이내 필터링
      let rangePlans = plans;
      if (currentFee > 0) {
        rangePlans = plans.filter((p) => Math.abs(p.price - currentFee) <= 10000);
      }

      if (rangePlans.length === 0) {
        rangePlans = plans;
      }

      // 통신사/상품별 랜덤 10개 정도 추출
      const displayPlans =
        rangePlans.length > 10
          ? [...rangePlans].sort(() => 0.5 - Math.random()).slice(0, 10)
          : rangePlans;

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
        ...displayPlans.map((plan) => ({
          value: plan.id,
          label: `${plan.name} (월 ${plan.price.toLocaleString("ko-KR")}원)`,
          next: args.next,
        })),
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
      { value: "yes", label: "알고 있습니다", next: args.yesNext },
      {
        value: "no",
        label: args.isMobile ? "잘 모르겠습니다 (건너뛰기)" : "잘 모르겠습니다",
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
    placeholder: "예: 100000",
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
      message: "현재 사용 중인 모바일 통신사를 선택해 주세요.",
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
      message: "현재 모바일 요금으로 매달 내고 계신 실납부액을 입력해 주세요.",
      answerKey: `${namespace}.${answerPrefix}MobileFee`,
      placeholder: "예: 55000",
      next: `${prefix}3`,
    }),
    ...PlanCheckMethod({
      id: `${prefix}3`,
      message: "현재 이용 중인 요금제 확인 방식을 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}PlanCheck`,
      answerPrefix,
      isMobile: true,
      next: `${prefix}4`,
    }),
    {
      id: `${prefix}4`,
      type: "multi-choice",
      message: "현재 받고 계신 할인 옵션을 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Discount`,
      options: [
        { value: "선택약정", label: "선택약정 25% 할인 받는 중" },
        { value: "가족결합", label: "가족 결합 할인 중" },
        { value: "모름", label: "잘 모르겠음" },
      ],
      next: `${prefix}5`,
    },
    ContractStatus({
      id: `${prefix}5`,
      message: "현재 핸드폰 가입 약정 기간 상태가 어떻게 되시나요?",
      answerKey: `${namespace}.${answerPrefix}Contract`,
      isMobile: true,
      next: `${prefix}6`,
      expiryNext: nextForNoPenalty,
    }),
    PenaltyQuestion({
      id: `${prefix}6`,
      message: "현재 해지 시 발생하는 예상 위약금을 알고 계시나요?",
      answerKey: `${namespace}.${answerPrefix}KnowPenalty`,
      yesNext: `${prefix}7`,
      noNext: nextForNoPenalty,
      isMobile: true,
    }),
    PenaltyInput({
      id: `${prefix}7`,
      message: "알고 계신 예상 위약금 금액을 입력해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Penalty`,
      next: nextForPenalty,
    })
  );

  return steps;
}

function buildInternetFlow(args: {
  prefix: string;
  answerPrefix: string;
  isCombo: boolean;
  nextForNoPenalty: string;
  nextForPenalty: string;
}): FlowStep[] {
  const { prefix, answerPrefix, isCombo, nextForNoPenalty, nextForPenalty } = args;

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
    ? "현재 사용 중인 인터넷/TV 결합 통신사를 선택해 주세요."
    : "현재 사용 중인 인터넷 통신사를 선택해 주세요.";

  const feeMessage = isCombo
    ? "인터넷과 TV를 합쳐 매달 납부하시는 결합 실납부액을 입력해 주세요."
    : "인터넷 요금으로 매달 납부하시는 실납부액을 입력해 주세요.";

  const planCheckMessage = isCombo
    ? "결합 상품 요금제 확인 방식을 선택해 주세요."
    : "인터넷 요금제 확인 방식을 선택해 주세요.";

  const contractMessage = isCombo
    ? "인터넷/TV 결합 상품의 약정 기간 상태를 선택해 주세요."
    : "인터넷 상품의 약정 기간 상태를 선택해 주세요.";

  const penaltyMessage = isCombo
    ? "유선 상품 해지 시 발생하는 위약금 정보를 알고 계시나요?"
    : "인터넷 해지 시 발생하는 위약금 정보를 알고 계시나요?";

  const penaltyInputMessage = isCombo
    ? "유선 상품의 예상 위약금 금액을 입력해 주세요."
    : "인터넷의 예상 위약금 금액을 입력해 주세요.";

  return [
    CarrierSelect({
      id: `${prefix}1`,
      message: carrierMessage,
      answerKey: `${namespace}.${answerPrefix}Carrier`,
      options: carrierOptions,
      next: `${prefix}2`,
    }),
    MonthlyFeeInput({
      id: `${prefix}2`,
      message: feeMessage,
      answerKey: `${namespace}.${answerPrefix}Fee`,
      placeholder: isCombo ? "예: 35000" : "예: 25000",
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
    }),
  ];
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
      message: "현재 이용 중인 IPTV 통신사를 선택해 주세요.",
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
      message: "TV 상품 이용 요금으로 매달 납부하시는 금액을 입력해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Fee`,
      placeholder: "예: 15000",
      next: `${prefix}3`,
    }),
    ...PlanCheckMethod({
      id: `${prefix}3`,
      message: "TV 상품 요금제 확인 방식을 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}PlanCheck`,
      answerPrefix,
      next: `${prefix}4`,
    }),
    ContractStatus({
      id: `${prefix}4`,
      message: "TV 상품의 약정 기간 상태를 선택해 주세요.",
      answerKey: `${namespace}.${answerPrefix}Contract`,
      isMobile: false,
      next: `${prefix}5`,
      expiryNext: nextForNoPenalty,
    }),
    PenaltyQuestion({
      id: `${prefix}5`,
      message: "TV 상품 해지 시 발생하는 위약금 정보를 알고 계시나요?",
      answerKey: `${namespace}.${answerPrefix}KnowPenalty`,
      yesNext: `${prefix}6`,
      noNext: nextForNoPenalty,
      isMobile: false,
    }),
    PenaltyInput({
      id: `${prefix}6`,
      message: "TV 상품의 예상 위약금 금액을 입력해 주세요.",
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

  // 1번 질문 ID: Q_START
  {
    id: "Q_START",
    type: "single-choice",
    message: "결합상품의 통신사가 같나요?",
    answerKey: `${namespace}.startState`,
    options: [
      { value: "all_same", label: "전부 같아요", next: "Q_ALL_M1" },
      { value: "part_same", label: "일부만 같아요", next: "Q_PART_SELECT" },
      { value: "all_diff", label: "다 달라요", next: "Q_DIFF_START" },
      { value: "new_start", label: "새로 시작해요", next: "Q_NEW_SELECT" },
    ],
  },

  // 🟢 [전부 같아요 패스]
  ...buildMobileFlow({
    prefix: "Q_ALL_M",
    answerPrefix: "all",
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // 🟡 [일부만 같아요 패스]
  {
    id: "Q_PART_SELECT",
    type: "single-choice",
    message: "일부 결합 상품의 구체적인 형태를 선택해 주세요.",
    answerKey: `${namespace}.partSelect`,
    options: [
      { value: "pta", label: "모바일(개인) / 인터넷 + IPTV", next: "Q_PTA_M1" },
      { value: "ptc", label: "모바일(다인) / 인터넷 + IPTV", next: "Q_PTC_M1" },
      { value: "ptb", label: "모바일 + 인터넷", next: "Q_PTB_M1" },
    ],
  },

  // PTA 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTA_M",
    answerPrefix: "pta",
    nextForNoPenalty: "Q_PTA_I1",
    nextForPenalty: "Q_PTA_I1",
    skipMembers: true,
  }),

  // PTA 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTA_I",
    answerPrefix: "ptaCombo",
    isCombo: true,
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // PTB 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTB_M",
    answerPrefix: "ptb",
    nextForNoPenalty: "Q_PTB_I1",
    nextForPenalty: "Q_PTB_I1",
    skipMembers: true,
  }),

  // PTB 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTB_I",
    answerPrefix: "ptbCombo",
    isCombo: true,
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // PTC 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_PTC_M",
    answerPrefix: "ptc",
    nextForNoPenalty: "Q_PTC_I1",
    nextForPenalty: "Q_PTC_I1",
  }),

  // PTC 유선 입력 6단계
  ...buildInternetFlow({
    prefix: "Q_PTC_I",
    answerPrefix: "ptcCombo",
    isCombo: true,
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
  }),

  // 🔵 [다 달라요 패스]
  {
    id: "Q_DIFF_START",
    type: "multi-choice",
    message: "현재 개별적으로 사용 중인 서비스를 선택해주세요.",
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
    defaultNext: "Q_P2_1",
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
    defaultNext: "Q_P2_1",
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
    defaultNext: "Q_P2_1",
  },

  // 1-3. TV 약정/위약금 수집 6단계
  ...buildTvFlow({
    prefix: "Q_DIFF_T",
    answerPrefix: "diffTv",
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
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
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
    skipMembers: true,
  }),

  // 4-B 모바일 입력 7단계
  ...buildMobileFlow({
    prefix: "Q_4B_M",
    answerPrefix: "newB",
    nextForNoPenalty: "Q_P2_1",
    nextForPenalty: "Q_P2_1",
    skipMembers: true,
  }),

  // -------------------------------------------------------------
  // [Part 2] 원하는 요금제 및 서비스 조건 선택 파트
  // -------------------------------------------------------------

  {
    id: "Q_P2_1",
    type: "multi-choice",
    message: "결합 상품 조합 형태 선택 (다중선택)",
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
    message: "가장 중요하게 생각하는 것은?\n[안내] 위약금 미입력 시 정확한 진단 어려움\n제일 저렴한 상품 중심으로 추천",
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
    message: "원하시는 모바일 데이터 사용량 조사",
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
    message: "이동전화 결합 인원을 알려주세요",
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
    message: "선호하시거나 원하시는 인터넷 속도 사양을 선택해 주세요.",
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
    message: "원하는 정보 입력 완료",
    next: "bundle-recommendation-api",
  },

  {
    id: "bundle-recommendation-api",
    type: "single-choice",
    message: "고객님의 조건을 분석하여 선정한 최적의 추천 요금제 리스트입니다.",
    answerKey: `${namespace}.selectedRecommendedPlan`,
    options: [],
    optionsResolver: (answers) => {
      const companyType = getAnswerValue(answers, "desiredCompanyType", "any");

      // 🟢 1. [고정 비용 최소화 추천 (mvno)] 선택 시 (스카이라이프 & 헬로비전 1회선)
      if (companyType === "mvno") {
        const skylifeCombos = filterSkylifeCombinations(answers);
        const helloCombos = filterHelloCombinations(answers);

        // 두 알뜰/케이블 통신사 교차 배치 후 최저가순 상위 4개 추출
        const topMvno = interleaveAndSortByPrice([skylifeCombos, helloCombos], 4);

        return [
          ...topMvno.map((combo, idx) => ({
            value: combo.id,
            label: `[추천 ${idx + 1}순위] ${combo.label}`,
            next: "bundle-result",
          })),
          {
            value: "direct-choose",
            label: "직접 고를래요 (전체 리스트 보기)",
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
            label: "직접 고를래요 (전체 리스트 보기)",
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
            label: "직접 고를래요 (전체 리스트 보기)",
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
          label: "직접 고를래요 (전체 리스트 보기)",
          next: "bundle-all-plans-select",
        },
      ];
    },
    next: "bundle-result",
  },

  {
    id: "bundle-all-plans-select",
    type: "single-choice",
    message: "추천 요금제 외에 선택 가능한 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요.",
    answerKey: `${namespace}.manualSelectedPlan`,
    options: [],
    optionsResolver: (answers) => {
      const companyType = getAnswerValue(answers, "desiredCompanyType", "any");

      // 🟢 고정비 최소화 추천 (mvno)
      if (companyType === "mvno") {
        const skylifeCombos = filterSkylifeCombinations(answers);
        const helloCombos = filterHelloCombinations(answers);

        const allMvnoCombos = interleaveAndSortByPrice([skylifeCombos, helloCombos]).slice(0, 12);

        return [
          ...allMvnoCombos.map((combo) => ({
            value: combo.id,
            label: combo.label,
            next: "bundle-result",
          })),
          {
            value: "none-of-them",
            label: "목록에 없음 (금액 기준으로만 진단)",
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
            label: "목록에 없음 (금액 기준으로만 진단)",
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
            label: "목록에 없음 (금액 기준으로만 진단)",
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
          label: "목록에 없음 (금액 기준으로만 진단)",
          next: "bundle-result",
        },
      ];
    },
    next: "bundle-result",
  },

  {
    id: "bundle-result",
    type: "result",
    message: "입력하신 정보를 바탕으로 산출된 최적의 결합 상품 추천 리포트입니다.",
    next: "bundle-ask-grade",
  },

  // -------------------------------------------------------------
  // [Part 3] 소비 패턴 등급 진단
  // -------------------------------------------------------------
  {
    id: "bundle-ask-grade",
    type: "single-choice",
    message: "고객님의 요금 절감액을 분석하여 소비 패턴 등급을 진단받으시겠습니까?",
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
    message: "소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다.",
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
  startStepId: "Q_START",
  steps: composeFlow(steps),
};