import { composeFlow } from "../../../core/composeFlow";
import type { FlowAnswers, FlowChoiceOption, FlowDefinition, FlowStep } from "../../../core/types";
import { MOCK_CURRENT_PLANS, MOCK_RECOMMENDED_PLANS, fetchPlansFromApi, ALL_MVNO_PLAN_SPECS, MvnoPlanSpec } from "./mockData";
import { fetchSmartChoicePhonePlans } from "../shared/telecomApi";

const namespace = "phone";

export type NetworkType = "LTE" | "5G";

export interface MockPlanItem {
  value: string;
  label: string;
  price: number;
  carrier: string;
  networkType: NetworkType;
}

// ── mockData.ts의 ALL_MVNO_PLAN_SPECS 데이터를 MockPlanItem 규격으로 변환 ─────
export function formatApiDataStr(dataStr?: string): string {
  if (!dataStr) return "기본제공";
  const trimmed = dataStr.trim();
  if (/^\d+$/.test(trimmed)) {
    const mb = parseInt(trimmed, 10);
    if (mb >= 99999) return "무제한";
    if (mb >= 1024) return `${Math.round(mb / 1024)}GB`;
    return `${mb}MB`;
  }
  return trimmed;
}

export function formatApiVoiceStr(voiceStr?: string): string {
  if (!voiceStr) return "음성 무제한";
  const trimmed = voiceStr.trim();
  if (trimmed === "999999" || trimmed.includes("무제한") || trimmed.includes("집/이동전화") || trimmed.includes("기본")) {
    return "음성 무제한";
  }
  if (/^\d+$/.test(trimmed)) {
    return `음성 ${trimmed}분`;
  }
  return trimmed.startsWith("음성") ? trimmed : `음성 ${trimmed}`;
}

export function formatApiSmsStr(smsStr?: string): string {
  if (!smsStr) return "문자 기본제공";
  const trimmed = smsStr.trim();
  if (trimmed === "999999" || trimmed.includes("기본") || trimmed.includes("무제한")) {
    return "문자 기본제공";
  }
  if (/^\d+$/.test(trimmed)) {
    return `문자 ${trimmed}건`;
  }
  return trimmed.startsWith("문자") ? trimmed : `문자 ${trimmed}`;
}

const ALL_MVNO_MAPPED: MockPlanItem[] = (ALL_MVNO_PLAN_SPECS && ALL_MVNO_PLAN_SPECS.length > 0)
  ? ALL_MVNO_PLAN_SPECS.map(p => {
    const fullLabel = `[${p.mvnoCarrier}] ${p.name} · 월 ${p.price.toLocaleString("ko-KR")}원 · 데이터 ${p.data} · 음성 ${p.voice} · 문자 ${p.sms} (${p.networkType})`;
    return {
      value: `plan-api|${fullLabel}`,
      label: fullLabel,
      price: p.price,
      carrier: "mvno",
      networkType: p.networkType as NetworkType
    };
  })
  : [];

// ── 스마트초이스 실시간 요금제 백그라운드 캐싱 ────────────────
interface CachedPlan {
  value: string;
  label: string;
  price: number;
}

const planCache: Record<string, CachedPlan[]> = {};
const carrierFetches = new Map<string, Promise<void>>();
let allPlans: import("../shared/telecomApi").SmartChoicePlan[] | null = null;
let allPlansRequest: Promise<import("../shared/telecomApi").SmartChoicePlan[]> | null = null;

function parseDataGB(label: string): number {
  if (!label) return 10;

  // qosSpeed 속도 문자열(예: 소진 시 1Mbps, 5Mbps, 3Mbps, 400kbps 등) 제거하여 기본 데이터용량 추출 오류 방지
  const cleanLabel = label
    .replace(/\(소진\s*시.*?\)/gi, "")
    .replace(/\d+(?:\.\d+)?\s*Mbps/gi, "")
    .replace(/\d+(?:\.\d+)?\s*kbps/gi, "");

  if (cleanLabel.includes("일5GB") || cleanLabel.includes("일 5GB") || cleanLabel.includes("일5g") || cleanLabel.includes("일 5g")) {
    return 150;
  }

  // 1. 명시적인 GB 숫자 패턴 우선 추출 (예: 100GB, 50GB, 10GB, 6GB, 110GB, 71GB, 4GB)
  const match = cleanLabel.match(/(\d+(?:\.\d+)?)\s*GB/i);
  if (match) {
    return parseFloat(match[1]);
  }

  const mbMatch = cleanLabel.match(/(\d+(?:\.\d+)?)\s*MB/i);
  if (mbMatch) {
    return parseFloat(mbMatch[1]) / 1024;
  }

  // 3. 단위 없이 5자리 이상 숫자만 나열된 MB값 파싱 (예: · 51200 · 또는 · 30720 ·)
  const rawNumMatch = cleanLabel.match(/·\s*(\d{4,6})\s*·/);
  if (rawNumMatch) {
    const rawVal = parseFloat(rawNumMatch[1]);
    if (rawVal >= 1024) return rawVal / 1024;
  }

  // 4. 숫자가 명시되지 않고 '무제한' 단어가 들어간 경우
  if (cleanLabel.includes("무제한") || cleanLabel.includes("데이터 무한")) {
    return 100;
  }

  return 10;
}

export interface DataRange {
  minGB: number;
  maxGB: number;
}

export function parseDataVolumeRange(dataVolume: string): DataRange {
  const valLower = (dataVolume || "").toLowerCase();

  // 1. Unlimited / 100GB+ / 100gb_over / 100gb-plus / 100gb이상 / 무제한 (50GB 이상 ~ 무제한 헤비 유저)
  if (valLower === "unlimited" || valLower.includes("100gb") || valLower.includes("over") || valLower.includes("plus") || valLower.includes("+") || valLower.includes("이상")) {
    return { minGB: 50, maxGB: 9999 };
  }

  // 2. Range pattern: e.g. "50gb_100gb", "50gb-100gb", "10gb_30gb", "10gb-30gb"
  const rangeMatch = valLower.match(/(\d+(?:\.\d+)?)\s*(?:gb)?\s*(?:~|-|_)\s*(\d+(?:\.\d+)?)\s*(?:gb)?/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    return { minGB: Math.min(min, max), maxGB: Math.max(min, max) };
  }

  // 3. Under pattern: e.g. "10gb_under", "under-10gb", "10gb미만", "low"
  if (valLower === "low" || valLower.includes("under") || valLower.includes("less") || valLower.includes("미만")) {
    const underMatch = valLower.match(/(\d+(?:\.\d+)?)\s*gb/);
    const limit = underMatch ? parseFloat(underMatch[1]) : 10;
    return { minGB: 0, maxGB: limit };
  }

  // Legacy fallbacks
  if (valLower === "high") return { minGB: 50, maxGB: 100 };
  if (valLower === "mid") return { minGB: 10, maxGB: 35 };
  if (valLower === "low") return { minGB: 0, maxGB: 10 };

  return { minGB: 0, maxGB: 9999 };
}

function matchesDataVolumeFilter(label: string, dataVolume: string): boolean {
  const gb = parseDataGB(label);
  const { minGB, maxGB } = parseDataVolumeRange(dataVolume);

  if (minGB >= 50 && maxGB >= 9999) {
    return gb >= 50 || label.includes("무제한") || label.includes("일5GB") || label.includes("일 5GB");
  }

  if (minGB === 0) {
    return gb < maxGB;
  }

  return gb >= minGB && gb <= maxGB;
}

// ── 알뜰폰 브랜드별 무작위 라운드로빈 교차 수집 ────────────
function interleaveMvnoPlans(plans: MockPlanItem[]): MockPlanItem[] {
  const brandGroups: Record<string, MockPlanItem[]> = {};
  plans.forEach(p => {
    const brandMatch = p.label.match(/\[(.*?)\]/);
    const brand = brandMatch ? brandMatch[1] : "기타알뜰폰";
    if (!brandGroups[brand]) brandGroups[brand] = [];
    brandGroups[brand].push(p);
  });

  const brands = Object.keys(brandGroups);
  for (let i = brands.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [brands[i], brands[j]] = [brands[j], brands[i]];
  }

  const result: MockPlanItem[] = [];
  let added = true;
  let idx = 0;
  while (added) {
    added = false;
    for (const b of brands) {
      if (brandGroups[b][idx]) {
        result.push(brandGroups[b][idx]);
        added = true;
      }
    }
    idx++;
  }
  return result;
}

const getAllPlans = () => {
  if (allPlans) return Promise.resolve(allPlans);
  if (allPlansRequest) return allPlansRequest;

  allPlansRequest = Promise.all([
    fetchSmartChoicePhonePlans({ voice: "999999", data: "999999", sms: "999999", age: "20", type: "6", dis: "24" }),
    fetchSmartChoicePhonePlans({ voice: "999999", data: "51200", sms: "999999", age: "20", type: "6", dis: "24" }),
    fetchSmartChoicePhonePlans({ voice: "999999", data: "20480", sms: "999999", age: "20", type: "6", dis: "24" }),
    fetchSmartChoicePhonePlans({ voice: "999999", data: "5120", sms: "999999", age: "20", type: "6", dis: "24" }),
    fetchSmartChoicePhonePlans({ voice: "999999", data: "999999", sms: "999999", age: "20", type: "3", dis: "24" }),
    fetchSmartChoicePhonePlans({ voice: "999999", data: "51200", sms: "999999", age: "20", type: "3", dis: "24" }),
    fetchSmartChoicePhonePlans({ voice: "999999", data: "20480", sms: "999999", age: "20", type: "3", dis: "24" }),
    fetchSmartChoicePhonePlans({ voice: "999999", data: "5120", sms: "999999", age: "20", type: "3", dis: "24" }),
  ]).then((responses) => {
    const plans: import("../shared/telecomApi").SmartChoicePlan[] = [];
    responses.forEach(res => {
      if (res.plans) plans.push(...res.plans);
    });
    if (plans.length > 0) allPlans = plans;
    return plans;
  }).finally(() => {
    allPlansRequest = null;
  });

  return allPlansRequest;
};

export function prefetchPlans(carrier: string) {
  if (planCache[carrier]) return Promise.resolve();
  const inFlight = carrierFetches.get(carrier);
  if (inFlight) return inFlight;

  const carrierUpper = carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : "알뜰폰";

  const request = getAllPlans().then((plans) => {
    const filtered = plans.filter(p => {
      if (carrier === "mvno") {
        return p.telecom !== "SKT" && p.telecom !== "KT" && p.telecom !== "LGU+";
      }
      return p.telecom === carrierUpper;
    });

    const seenNames = new Set<string>();
    const mapped: CachedPlan[] = [];
    filtered.forEach(p => {
      if (!seenNames.has(p.planName)) {
        seenNames.add(p.planName);
        const netType = p.planName.includes("5G") || p.planName.includes("5g") ? "5G" : "LTE";
        const dataStr = formatApiDataStr(p.data);
        const voiceStr = formatApiVoiceStr(p.voice);
        const smsStr = formatApiSmsStr(p.sms);

        const fullLabel = `[${p.telecom}] ${p.planName} · 월 ${p.monthlyFee.toLocaleString("ko-KR")}원 · 데이터 ${dataStr} · ${voiceStr} · ${smsStr} (${netType})`;
        mapped.push({
          value: `plan-api|${fullLabel}`,
          label: fullLabel,
          price: p.monthlyFee
        });
      }
    });

    planCache[carrier] = mapped;
  }).catch(() => {
    // Fallback path
  }).finally(() => {
    carrierFetches.delete(carrier);
  });

  carrierFetches.set(carrier, request);
  return request;
}

export const getPhonePlanLookupFee = (answers: FlowAnswers): number => {
  const currentFee = Number(answers[`${namespace}.currentFee`] || 0);
  const discountOption = answers[`${namespace}.discountOption`];
  const discountOptions = Array.isArray(discountOption) ? discountOption : [discountOption];

  return discountOptions.includes("select-discount")
    ? Math.round(currentFee / 0.75)
    : currentFee;
};

export const resolvePhoneCurrentPlanOptions = (answers: FlowAnswers): FlowChoiceOption[] => {
  const carrier = answers[`${namespace}.carrier`] as string;
  const currentFee = getPhonePlanLookupFee(answers);
  const existingConfirmed = answers[`${namespace}.confirmedPlan`] as string;

  // 이미 선택한 상태라면 다음 스텝 진입 시 다른 요금제로 변하지 않도록 선택 요금제 고정
  if (existingConfirmed && existingConfirmed.startsWith("plan-api|")) {
    const rawLabel = existingConfirmed.split("|")[1] || existingConfirmed;
    return [
      { value: existingConfirmed, label: rawLabel, next: "phone-contract-period" },
      { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "phone-current-plans-list" },
      { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "phone-custom-plan-input" },
    ];
  }

  let matchedOptions: { value: string; label: string }[] = [];

  // 알뜰폰(MVNO) 선택 시: mockData.ts의 ALL_MVNO_MAPPED에서 입력 금액(currentFee)과 가장 근접한 요금제 매칭
  if (carrier === "mvno") {
    const mockMatched = [...ALL_MVNO_MAPPED]
      .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));

    if (mockMatched.length > 0) {
      matchedOptions = [{
        value: mockMatched[0].value,
        label: mockMatched[0].label,
      }];
    }
  } else {
    // SKT/KT/LGU+ 메이저 통신사의 경우: API 또는 fallback 요금제에서 금액 근접 순 정렬 매칭
    let apiPlans = planCache[carrier] || [];
    if (apiPlans.length === 0 && allPlans) {
      const carrierUpper = carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : "알뜰폰";
      const filtered = allPlans.filter(p => p.telecom === carrierUpper);
      apiPlans = filtered.map(p => {
        const netType = p.planName.includes("5G") || p.planName.includes("5g") ? "5G" : "LTE";
        const dataStr = formatApiDataStr(p.data);
        const voiceStr = formatApiVoiceStr(p.voice);
        const smsStr = formatApiSmsStr(p.sms);
        const fullLabel = `[${p.telecom}] ${p.planName} · 월 ${p.monthlyFee.toLocaleString("ko-KR")}원 · 데이터 ${dataStr} · ${voiceStr} · ${smsStr} (${netType})`;
        return {
          value: `plan-api|${fullLabel}`,
          label: fullLabel,
          price: p.monthlyFee
        };
      });
    }

    let apiMatched = [...apiPlans]
      .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));

    if (apiMatched.length > 0) {
      matchedOptions = [{
        value: apiMatched[0].value,
        label: apiMatched[0].label,
      }];
    } else {
      const apiPlansFallback = fetchPlansFromApi(carrier, currentFee);
      const sortedFallback = [...apiPlansFallback].sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));
      const topFallback = sortedFallback[0] || apiPlansFallback[0];
      if (topFallback) {
        matchedOptions = [{
          value: topFallback.value.startsWith("plan-api|") ? topFallback.value : `plan-api|${topFallback.label}`,
          label: topFallback.label,
        }];
      }
    }
  }

  return [
    ...matchedOptions.map(m => ({ value: m.value, label: m.label, next: "phone-contract-period" })),
    { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "phone-current-plans-list" },
    { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "phone-custom-plan-input" },
  ];
};

export interface PhonePlanCandidate {
  value: string;
  label: string;
  price: number;
  carrier: string;
  telecomTag: string;
  dataGB: number;
  networkType: "5G" | "LTE";
}

function getAllCandidatePhonePlans(userCarrier: string, currentFee: number): PhonePlanCandidate[] {
  const candidates: PhonePlanCandidate[] = [];
  const seenLabels = new Set<string>();

  const addCandidate = (label: string, price: number, telecomTag: string, carrierKey: string) => {
    if (seenLabels.has(label)) return;
    seenLabels.add(label);

    const netType: "5G" | "LTE" = label.includes("5G") || label.includes("5g") ? "5G" : "LTE";
    const dataGB = parseDataGB(label);

    let formattedLabel = label;
    if (!label.startsWith("[")) {
      formattedLabel = `[${telecomTag}] ${label}`;
    }

    candidates.push({
      value: `plan-api|${formattedLabel}`,
      label: formattedLabel,
      price,
      carrier: carrierKey,
      telecomTag,
      dataGB,
      networkType: netType,
    });
  };

  // 1. Smart Choice API plans (allPlans)
  if (allPlans && allPlans.length > 0) {
    allPlans.forEach(p => {
      const carrierKey = p.telecom === "SKT" ? "skt" : p.telecom === "KT" ? "kt" : p.telecom === "LGU+" ? "lgu" : "mvno";
      const netType = p.planName.includes("5G") || p.planName.includes("5g") ? "5G" : "LTE";
      const dataStr = formatApiDataStr(p.data);
      const voiceStr = formatApiVoiceStr(p.voice);
      const smsStr = formatApiSmsStr(p.sms);

      const label = `[${p.telecom}] ${p.planName} · 월 ${p.monthlyFee.toLocaleString("ko-KR")}원 · 데이터 ${dataStr} · ${voiceStr} · ${smsStr} (${netType})`;
      addCandidate(label, p.monthlyFee, p.telecom, carrierKey);
    });
  }

  // 2. Major carrier fallback plans
  ["skt", "kt", "lgu"].forEach(c => {
    const tag = c === "skt" ? "SKT" : c === "kt" ? "KT" : "LGU+";
    const list = fetchPlansFromApi(c, currentFee);
    list.forEach(p => {
      addCandidate(p.label, p.price, tag, c);
    });
  });

  // 3. MVNO mock plans
  ALL_MVNO_MAPPED.forEach(p => {
    const brandMatch = p.label.match(/\[(.*?)\]/);
    const tag = brandMatch ? brandMatch[1] : "알뜰폰";
    addCandidate(p.label, p.price, tag, "mvno");
  });

  return candidates;
}

function isStrictUserCarrierMatch(planCarrier: string, planTelecomTag: string, userCarrier: string): boolean {
  const normUser = (userCarrier || "").toLowerCase().trim();
  const normTag = (planTelecomTag || "").toUpperCase().trim();
  const normCarrier = (planCarrier || "").toLowerCase().trim();

  const isMvnoBrand = normTag.includes("이야기") ||
                     normTag.includes("티플러스") ||
                     normTag.includes("스노우") ||
                     normTag.includes("헬로") ||
                     normTag.includes("스카이") ||
                     normTag.includes("알뜰") ||
                     normCarrier === "mvno";

  if (normUser === "skt") {
    if (isMvnoBrand) return false;
    return normCarrier === "skt" || normTag === "SKT";
  }

  if (normUser === "kt") {
    if (isMvnoBrand) return false;
    return normCarrier === "kt" || normTag === "KT";
  }

  if (normUser === "lgu" || normUser === "lgu+") {
    if (isMvnoBrand) return false;
    return normCarrier === "lgu" || normTag === "LGU+" || normTag.includes("유플러스");
  }

  if (normUser === "mvno") {
    return isMvnoBrand || (normTag !== "SKT" && normTag !== "KT" && normTag !== "LGU+");
  }

  return false;
}

function rankPhonePlanCandidates(
  candidates: PhonePlanCandidate[],
  answers: FlowAnswers,
  restrictToUserCarrierOnly: boolean = false
): PhonePlanCandidate[] {
  const userCarrier = (answers[`${namespace}.carrier`] as string) || "skt";
  const desiredNetwork = (answers[`${namespace}.desiredNetwork`] as string) || "5g";
  const dataVolume = (answers[`${namespace}.dataVolume`] as string) || "100GB_over";
  const currentFee = getPhonePlanLookupFee(answers) || 66750;

  const targetNetwork = desiredNetwork === "5g" ? "5G" : desiredNetwork === "lte" ? "LTE" : null;
  const { minGB, maxGB } = parseDataVolumeRange(dataVolume);

  let filteredPool = candidates;
  if (restrictToUserCarrierOnly) {
    filteredPool = candidates.filter(p => isStrictUserCarrierMatch(p.carrier, p.telecomTag, userCarrier));

    if (filteredPool.length === 0) {
      const fallbackList = fetchPlansFromApi(userCarrier, currentFee);
      const tag = userCarrier === "skt" ? "SKT" : userCarrier === "kt" ? "KT" : userCarrier === "lgu" ? "LGU+" : "알뜰폰";
      filteredPool = fallbackList.map(p => ({
        value: `plan-api|${p.label}`,
        label: p.label,
        price: p.price,
        carrier: userCarrier,
        telecomTag: tag,
        dataGB: parseDataGB(p.label),
        networkType: p.label.includes("5G") || p.label.includes("5g") ? "5G" : "LTE",
      }));
    }
  }

  const scored = filteredPool.map(plan => {
    let score = 0;

    // 1. Carrier match (Same carrier = +1,000,000 pts)
    const isSameCarrier = isStrictUserCarrierMatch(plan.carrier, plan.telecomTag, userCarrier);

    if (isSameCarrier) {
      score += 1000000;
    }

    // 2. Data Volume match (Crucial: 10GB~30GB range gets +500,000 pts, plans > maxGB get -500,000 pts penalty)
    const bufferedMin = Math.max(0, minGB - 10);
    const bufferedMax = maxGB >= 9999 ? 9999 : maxGB + 10;

    if (minGB >= 50 && maxGB >= 9999) {
      if (plan.dataGB >= 50 || plan.label.includes("무제한") || plan.label.includes("일5GB") || plan.label.includes("일 5GB")) {
        score += 500000;
      } else if (plan.dataGB >= 40) {
        score += 200000;
      } else {
        score -= 500000;
      }
    } else {
      if (plan.dataGB >= minGB && plan.dataGB <= maxGB) {
        score += 500000; // Perfect match within selected range (e.g. 10GB~30GB)
      } else if (plan.dataGB >= bufferedMin && plan.dataGB <= bufferedMax) {
        score += 200000; // Buffered match
      } else {
        score -= 500000; // Heavy penalty for data volume out of range (e.g., 50GB/100GB when 10GB~30GB requested)
      }
    }

    // 3. Plan Fee match (±25,000원 allowance)
    const feeDiff = Math.abs(plan.price - currentFee);
    if (feeDiff <= 25000) {
      score += 10000;
    }

    // 4. Network match (5G vs LTE)
    if (targetNetwork && plan.networkType === targetNetwork) {
      score += 1000;
    }

    return { plan, score, feeDiff };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // 조건(통신사, 데이터 범위) 만족 시 더 저렴한 요금제(월 절감액이 큰 요금제)를 1순위 추천!
    return a.plan.price - b.plan.price;
  });

  return scored.map(s => s.plan);
}

export const resolvePhoneRecommendations = (answers: FlowAnswers): FlowChoiceOption[] => {
  const contractPeriod = (answers[`${namespace}.contractPeriod`] as string) || "expired";
  const userFee = getPhonePlanLookupFee(answers) || 55000;
  const userCarrier = (answers[`${namespace}.carrier`] as string) || "skt";

  const isContractRemaining = contractPeriod === "remaining";

  const allCandidates = getAllCandidatePhonePlans(userCarrier, userFee);
  const ranked = rankPhonePlanCandidates(allCandidates, answers, isContractRemaining);

  const top4 = ranked.slice(0, 4);

  const finalOptions: FlowChoiceOption[] = top4.map((p, idx) => ({
    value: p.value,
    label: `[추천 ${idx + 1}순위] ${p.label}`,
    next: "phone-result"
  }));

  return [
    ...finalOptions,
    { value: "direct-choose", label: "직접 고를래요 (리스트 보기)", next: "phone-all-plans-select" }
  ];
};

export const resolvePhoneAllPlans = (answers: FlowAnswers): FlowChoiceOption[] => {
  const userFee = getPhonePlanLookupFee(answers) || 55000;
  const userCarrier = (answers[`${namespace}.carrier`] as string) || "skt";

  const allCandidates = getAllCandidatePhonePlans(userCarrier, userFee);
  const ranked = rankPhonePlanCandidates(allCandidates, answers, false);

  const top12 = ranked.slice(0, 12);

  return top12.map(p => ({
    value: p.value,
    label: p.label,
    next: "phone-result"
  }));
};

const opening: FlowStep[] = [
  {
    id: "phone-intro",
    type: "assistant-message",
    message: "휴대폰 요금제 진단을 시작할게요. 현재 요금 조건부터 확인해볼게요.",
    next: "phone-carrier"
  },

  // [Part 1 - 1번] 통신사 선택
  {
    id: "phone-carrier",
    type: "single-choice",
    message: "현재 사용하는 통신사를 선택해주세요.",
    answerKey: `${namespace}.carrier`,
    options: [
      { value: "skt", label: "SKT" },
      { value: "kt", label: "KT" },
      { value: "lgu", label: "LGU+" },
      { value: "mvno", label: "알뜰폰(MVNO)" },
    ],
    next: "phone-discount-options"
  },

  // [Part 1 - 2번] 할인 옵션 선택
  {
    id: "phone-discount-options",
    type: "multi-choice",
    message: "그 외에 현재 적용받고 있거나 해당되는 옵션을 알려주세요.",
    answerKey: `${namespace}.discountOption`,
    options: [
      { value: "select-discount", label: "선택약정 25% 할인 받는 중" },
      { value: "family-discount", label: "가족 결합 할인 중" },
      { value: "no-discount", label: "할인 안 받음" },
      { value: "unknown", label: "잘 모르겠음" },
    ],
    minSelections: 1,
    next: "phone-plan-fee"
  },

  // [Part 1 - 3번] 현재 사용하는 요금제 금액 입력
  {
    id: "phone-plan-fee",
    type: "number-input",
    message: "현재 납부하는 요금액을 입력해주세요.",
    answerKey: `${namespace}.currentFee`,
    placeholder: "금액만 적어주세요.",
    min: 0,
    unit: "원",
    next: "phone-current-plan-api"
  },

  // [Part 1 - 3번] 🔄 요금조회 API 결과를 매칭하는 동적 스텝
  {
    id: "phone-current-plan-api",
    type: "single-choice",
    message: "현재 사용하시는 요금제가 맞을까요?",
    answerKey: `${namespace}.confirmedPlan`,
    options: [
      { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "phone-current-plans-list" },
      { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "phone-custom-plan-input" },
    ],
    optionsResolver: resolvePhoneCurrentPlanOptions,
    next: "phone-contract-period"
  },

  // [Part 1 - 3-1번] 🔄 입력 요금 기준 ±25,000원 범위 요금제 리스트 선택 스텝
  {
    id: "phone-current-plans-list",
    type: "single-choice",
    message: "입력하신 요금대와 비슷한 요금제 목록입니다. 현재 요금제를 선택해주세요.",
    answerKey: `${namespace}.confirmedPlanList`,
    options: [
      { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "phone-contract-period" }
    ],
    optionsResolver: (answers) => {
      const carrier = answers[`phone.carrier`] as string;
      const currentFee = getPhonePlanLookupFee(answers);
      const dataVolume = answers[`phone.dataVolume`] as string;
      const desiredNetwork = answers[`phone.desiredNetwork`] as string;
      const targetNetwork = desiredNetwork === "5g" ? "5G" : desiredNetwork === "lte" ? "LTE" : null;
      const { minGB, maxGB } = parseDataVolumeRange(dataVolume);
      const targetDataGb = minGB >= 100 ? 100 : (minGB + (maxGB > 100 ? 100 : maxGB)) / 2;

      const getMockDataGb = (data: string) => {
        if (!data) return 10;
        if (data.includes("무제한") || data.includes("데이터 무한")) return 100;
        if (data.includes("일5GB") || data.includes("일 5GB")) return 150;
        const matches = [...data.matchAll(/(\d+(?:\.\d+)?)\s*GB/gi)].map(match => Number(match[1]));
        return matches.length > 0 ? Math.max(...matches) : 10;
      };

      const isCarrierMatch = (mvnoCarrier: string, targetCarrier: string) => {
        if (!targetCarrier || targetCarrier === "mvno") return true;
        if (targetCarrier === "skt") return mvnoCarrier.includes("SKT");
        if (targetCarrier === "kt") return mvnoCarrier.includes("KT");
        if (targetCarrier === "lgu") return mvnoCarrier.includes("LGU+") || mvnoCarrier.includes("U+") || mvnoCarrier.includes("LGU");
        return true;
      };

      const mockMatchedList = ALL_MVNO_PLAN_SPECS
        .map(plan => {
          const planDataGb = getMockDataGb(plan.data);
          const dataDiff = Math.abs(planDataGb - targetDataGb);
          const priceDiff = Math.abs(plan.price - currentFee);
          const matchesCarrier = isCarrierMatch(plan.mvnoCarrier, carrier);
          const matchesData = dataDiff <= 10;
          const matchesPrice = priceDiff <= 25000;
          const matchesNetwork = !targetNetwork || plan.networkType === targetNetwork;

          return {
            plan,
            matchesCarrier,
            matchesData,
            dataDiff,
            matchesPrice,
            priceDiff,
            matchesNetwork,
          };
        })
        .sort((a, b) => {
          // 1. 통신사 우선순위 (id: "phone-carrier")
          if (a.matchesCarrier !== b.matchesCarrier) {
            return Number(b.matchesCarrier) - Number(a.matchesCarrier);
          }

          // 2. 입력 금액(id: "phone-plan-fee") 근접 순 정렬 (최우선)
          if (a.priceDiff !== b.priceDiff) {
            return a.priceDiff - b.priceDiff;
          }

          // 3. 데이터 사용량 우선순위 (id: "phone-data-volume" ±10GB 범위 & 근접 순 정렬)
          if (a.matchesData !== b.matchesData) {
            return Number(b.matchesData) - Number(a.matchesData);
          }
          if (a.dataDiff !== b.dataDiff) {
            return a.dataDiff - b.dataDiff;
          }

          // 4. 네트워크 타입 우선순위 (id: "phone-desired-network")
          if (a.matchesNetwork !== b.matchesNetwork) {
            return Number(b.matchesNetwork) - Number(a.matchesNetwork);
          }

          return 0;
        })
        .slice(0, 6)
        .map(({ plan }) => {
          const planInfo = `[${plan.mvnoCarrier}] ${plan.name} · 월 ${plan.price.toLocaleString("ko-KR")}원 · 데이터 ${plan.data} · 음성 ${plan.voice} · 문자 ${plan.sms} (${plan.networkType})`;

          return {
            value: `plan-api|${planInfo}`,
            label: planInfo,
            next: "phone-contract-period",
          };
        });

      if (mockMatchedList.length > 0) {
        return [
          ...mockMatchedList,
          { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "phone-contract-period" }
        ];
      }

      // API 데이터 Fallback 처리 (동일한 1.통신사 -> 2.데이터 -> 3.가격 -> 4.네트워크 타입 우선순위 적용)
      let apiPlans = planCache[carrier] || [];
      if (apiPlans.length === 0 && allPlans) {
        const carrierUpper = carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : "알뜰폰";
        const filtered = allPlans.filter(p =>
          carrier === "mvno"
            ? (p.telecom !== "SKT" && p.telecom !== "KT" && p.telecom !== "LGU+")
            : p.telecom === carrierUpper
        );
        apiPlans = filtered.map(p => ({
          value: `plan-api|[${p.telecom}] ${p.planName} (월 ${p.monthlyFee.toLocaleString("ko-KR")}원)`,
          label: `[${p.telecom}] ${p.planName} (월 ${p.monthlyFee.toLocaleString("ko-KR")}원)`,
          price: p.monthlyFee
        }));
      }

      let apiMatched = apiPlans
        .map(p => {
          const planDataGb = getMockDataGb(p.label);
          const dataDiff = Math.abs(planDataGb - targetDataGb);
          const priceDiff = Math.abs(p.price - currentFee);
          return { p, dataDiff, priceDiff };
        })
        .sort((a, b) => {
          if (a.dataDiff !== b.dataDiff) return a.dataDiff - b.dataDiff;
          return a.priceDiff - b.priceDiff;
        })
        .slice(0, 5)
        .map(item => item.p);

      let matchedList = apiMatched.map(p => ({
        value: p.value,
        label: p.label,
        next: "phone-contract-period"
      }));

      if (carrier === "mvno" && matchedList.length < 4) {
        let mockMatched = ALL_MVNO_MAPPED;
        mockMatched = interleaveMvnoPlans(mockMatched);

        const needed = 6 - matchedList.length;
        const additional = mockMatched.slice(0, needed).map(p => ({
          value: `plan-api|${p.label}`,
          label: p.label,
          next: "phone-contract-period"
        }));

        matchedList = [...matchedList, ...additional];
      }

      if (carrier !== "mvno" && matchedList.length === 0) {
        const fallback = fetchPlansFromApi(carrier, currentFee);
        matchedList = fallback.map(p => ({
          value: `plan-api|${p.label}`,
          label: p.label,
          next: "phone-contract-period"
        }));
      }

      return [
        ...matchedList,
        { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "phone-contract-period" }
      ];
    },
    next: "phone-contract-period"
  },

  // 직접 요금제명을 입력하는 분기 스텝
  {
    id: "phone-custom-plan-input",
    type: "text-input",
    message: "사용 중이신 요금제 이름을 입력해주세요.",
    answerKey: `${namespace}.customPlan`,
    placeholder: "예: 슬림 요금제",
    next: "phone-contract-period"
  },

  // 약정기간 질문 스텝
  {
    id: "phone-contract-period",
    type: "single-choice",
    message: "현재 휴대폰 가입 약정기간 상태가 어떻게 되시나요?",
    answerKey: `${namespace}.contractPeriod`,
    options: [
      { value: "expired", label: "약정이 만료됨" },
      { value: "remaining", label: "약정 기간 남음" },
      { value: "unknown", label: "잘 모르겠음" },
    ],
    next: "phone-desired-network"
  }
];

const specific: FlowStep[] = [
  // [Part 2 - 4번] 원하는 데이터 종류
  {
    id: "phone-desired-network",
    type: "single-choice",
    message: "앞으로 이용하고 싶으신 희망 데이터 종류를 선택해주세요.",
    answerKey: `${namespace}.desiredNetwork`,
    options: [
      { value: "lte", label: "4G/LTE" },
      { value: "5g", label: "5G" },
      { value: "etc", label: "기타" },
    ],
    next: "phone-age-group"
  },

  // [Part 2 - 5번] 사용자의 연령대
  {
    id: "phone-age-group",
    type: "single-choice",
    message: "사용자의 연령대를 알려주세요.",
    answerKey: `${namespace}.ageGroup`,
    options: [
      { value: "normal", label: "일반(만 35~65세 이하)" },
      { value: "youth", label: "청년 (만 19~34세)" },
      { value: "senior", label: "시니어 (만 65세 이상)" },
      { value: "child", label: "어린이 (만 12세 이하)" },
      { value: "teen", label: "청소년 (만 13~18세)" },
    ],
    next: "phone-data-volume"
  },

  // [Part 2 - 6번] 데이터 사용량 조사
  {
    id: "phone-data-volume",
    type: "single-choice",
    message: "한 달 데이터 사용량을 알려주세요.",
    answerKey: `${namespace}.dataVolume`,
    options: [
      { value: "100GB_over", label: "무제한 (헤비 유저)" },
      { value: "50GB_100GB", label: "50GB~100GB (일반 동영상 시청)" },
      { value: "10GB_30GB", label: "10GB~30GB (출퇴근 웹서핑)" },
      { value: "10GB_under", label: "10GB 미만 (주로 와이파이 사용)" },
    ],
    next: "phone-recommendation-api"
  },

  // [Part 2 - 8번] 🚀 추천 리스트 (API 우선 + 부족 시 MOCK 데이터 보충)
  {
    id: "phone-recommendation-api",
    type: "single-choice",
    message: "고객님의 조건을 분석하여 선정한 최적의 추천 요금제 리스트입니다.",
    answerKey: `${namespace}.selectedRecommendedPlan`,
    options: MOCK_RECOMMENDED_PLANS,
    optionsResolver: resolvePhoneRecommendations,
    next: "phone-result"
  },

  {
    id: "phone-all-plans-select",
    type: "single-choice",
    message: "추천 요금제 외에 선택 가능한 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요.",
    answerKey: `${namespace}.manualSelectedPlan`,
    options: [
      { value: "plan-api|알뜰폰 5G 데이터 무제한 가성비 팩 (월 33,000원)", label: "알뜰폰 5G 데이터 무제한 가성비 팩 (월 33,000원)", next: "phone-result" },
      { value: "plan-api|KT 맞춤 청년 요금제 (월 45,000원)", label: "KT 맞춤 청년 요금제 (월 45,000원)", next: "phone-result" },
      { value: "plan-api|SKT 요금제 A (월 69,000원)", label: "SKT 요금제 A (월 69,000원)", next: "phone-result" },
      { value: "plan-api|SKT 인기 요금제 B (월 59,000원)", label: "SKT 인기 요금제 B (월 59,000원)", next: "phone-result" },
      { value: "plan-api|일반 LTE/5G 요금제 (월 55,000원)", label: "일반 LTE/5G 요금제 (월 55,000원)", next: "phone-result" }
    ],
    optionsResolver: resolvePhoneAllPlans,
    next: "phone-result"
  },

  {
    id: "phone-result",
    type: "result",
    message: "모든 진단과 요금제 선택이 완료되었습니다! 상세 비교서 작성을 완료했어요.",
    next: "phone-ask-grade"
  },

  {
    id: "phone-ask-grade",
    type: "single-choice",
    message: "고객님의 요금 절감액을 분석하여 소비 패턴 등급을 진단받으시겠습니까?",
    answerKey: `${namespace}.askGrade`,
    options: [
      { value: "yes", label: "YES", next: "phone-grade-result" },
      { value: "no", label: "NO", next: "phone-completed-exit" }
    ]
  },

  {
    id: "phone-grade-result",
    type: "result",
    message: "소비 패턴 등급 진단이 완료되었습니다. 결과 등급 카드가 생성되었습니다."
  },

  {
    id: "phone-completed-exit",
    type: "result"
  }
];

export const phoneFlow: FlowDefinition = {
  id: "phone-flow",
  subCategoryId: "phone",
  categoryId: "telecom",
  startStepId: "phone-intro",
  steps: composeFlow(opening, specific),
};
