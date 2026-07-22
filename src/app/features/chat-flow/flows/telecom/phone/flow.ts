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
const ALL_MVNO_MAPPED: MockPlanItem[] = (ALL_MVNO_PLAN_SPECS && ALL_MVNO_PLAN_SPECS.length > 0)
  ? ALL_MVNO_PLAN_SPECS.map(p => {
    const fullLabel = `[${p.mvnoCarrier}] ${p.name} · 월 ${p.price.toLocaleString("ko-KR")}원 · ${p.data} · ${p.networkType}`;
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

  const mbMatch = cleanLabel.match(/(\d+)\s*MB/i);
  if (mbMatch) {
    return parseFloat(mbMatch[1]) / 1024;
  }

  // 2. 숫자가 명시되지 않고 '무제한' 단어가 들어간 경우
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
        mapped.push({
          value: `plan-api|${p.planName}`,
          label: `${p.planName} (월 ${p.monthlyFee.toLocaleString("ko-KR")}원)`,
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

  // 1순위: 스마트 초이스 API 키 데이터 (planCache 또는 allPlans에서 가져옴)
  let apiPlans = planCache[carrier] || [];
  if (apiPlans.length === 0 && allPlans) {
    const carrierUpper = carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : "알뜰폰";
    const filtered = allPlans.filter(p =>
      carrier === "mvno"
        ? (p.telecom !== "SKT" && p.telecom !== "KT" && p.telecom !== "LGU+")
        : p.telecom === carrierUpper
    );
    apiPlans = filtered.map(p => {
      const netType = p.planName.includes("5G") || p.planName.includes("5g") ? "5G" : "LTE";
      const fullLabel = `[${p.telecom}] ${p.planName} · 월 ${p.monthlyFee.toLocaleString("ko-KR")}원 · ${p.data || "기본제공"} · ${netType}`;
      return {
        value: `plan-api|${fullLabel}`,
        label: fullLabel,
        price: p.monthlyFee
      };
    });
  }

  // 납부 금액 근접 순 정렬
  let apiMatched = [...apiPlans]
    .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));

  let matchedOptions: { value: string; label: string }[] = apiMatched.slice(0, 1).map(p => ({
    value: p.value,
    label: p.label,
  }));

  // 알뜰폰(MVNO)을 선택한 경우에만 API 데이터가 없을 때 MOCK_MVNO_PLANS에서 보충
  if (carrier === "mvno" && matchedOptions.length === 0) {
    let mockMatched = ALL_MVNO_MAPPED
      .filter(p => Math.abs(p.price - currentFee) <= 20000)
      .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));

    if (mockMatched.length === 0) mockMatched = ALL_MVNO_MAPPED;
    mockMatched = interleaveMvnoPlans(mockMatched);

    matchedOptions = mockMatched.slice(0, 1).map(p => ({
      value: `plan-api|${p.label}`,
      label: p.label,
    }));
  }

  // SKT/KT/LGU+의 경우 API 데이터가 아직 없거나 매칭이 안 된 경우, 해당 메이저 통신사 전용 요금제만 생성 (알뜰폰 섞임 방지)
  if (matchedOptions.length === 0) {
    const apiPlansFallback = fetchPlansFromApi(carrier, currentFee);
    matchedOptions = apiPlansFallback.map(p => ({
      value: `plan-api|${p.label}`,
      label: p.label,
    }));
  }

  return [
    ...matchedOptions.map(m => ({ value: m.value, label: m.label, next: "phone-contract-period" })),
    { value: "direct-select", label: "해당되는 요금제가 없음 (리스트 보기)", next: "phone-current-plans-list" },
    { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "phone-custom-plan-input" },
  ];
};

export const resolvePhoneRecommendations = (answers: FlowAnswers): FlowChoiceOption[] => {
  const carrier = answers[`${namespace}.carrier`] as string;
  const desiredNetwork = answers[`${namespace}.desiredNetwork`] as string;
  const dataVolume = answers[`${namespace}.dataVolume`] as string;
  const targetNetwork = desiredNetwork === "5g" ? "5G" : desiredNetwork === "lte" ? "LTE" : null;

  // 1. 메이저 3사 (SKT, KT, LGU+) API 키 데이터에서 조건에 맞는 요금제 3개 수집
  let majorApiCandidates: { value: string; label: string; price: number }[] = [];

  if (allPlans && allPlans.length > 0) {
    // SKT, KT, LGU+ 3사 데이터 추출
    const majorPlans = allPlans.filter(p => p.telecom === "SKT" || p.telecom === "KT" || p.telecom === "LGU+");

    // 네트워크(5G/LTE) 및 선택한 데이터 사용량(dataVolume) 필터 적용
    let filteredMajor = majorPlans.filter(p => {
      if (targetNetwork) {
        const is5g = p.planName.includes("5G") || p.planName.includes("5g");
        if (targetNetwork === "5G" && !is5g) return false;
        if (targetNetwork === "LTE" && is5g) return false;
      }
      const dataLabel = `${p.planName} ${p.data || ""}`;
      return matchesDataVolumeFilter(dataLabel, dataVolume);
    });

    if (filteredMajor.length < 3) {
      filteredMajor = majorPlans.filter(p => {
        if (targetNetwork) {
          const is5g = p.planName.includes("5G") || p.planName.includes("5g");
          if (targetNetwork === "5G" && !is5g) return false;
          if (targetNetwork === "LTE" && is5g) return false;
        }
        return true;
      });
    }

    // 최저가 순 정렬 및 중복 제거
    filteredMajor.sort((a, b) => a.monthlyFee - b.monthlyFee);
    const seenNames = new Set<string>();
    filteredMajor.forEach(p => {
      if (!seenNames.has(p.planName)) {
        seenNames.add(p.planName);
        const netType = p.planName.includes("5G") || p.planName.includes("5g") ? "5G" : "LTE";
        const fullLabel = `[${p.telecom}] ${p.planName} · 월 ${p.monthlyFee.toLocaleString("ko-KR")}원 · ${p.data || "기본제공"} · ${netType}`;
        majorApiCandidates.push({
          value: `plan-api|${fullLabel}`,
          label: fullLabel,
          price: p.monthlyFee
        });
      }
    });
  }

  // API 수량이 부족한 경우 통신사별 Fallback 생성 (SKT, KT, LGU+ 메이저 3사만)
  if (majorApiCandidates.length < 3) {
    const majorCarriers = ["skt", "kt", "lgu"];
    majorCarriers.forEach(c => {
      const fallback = fetchPlansFromApi(c, 55000);
      fallback.forEach(fb => {
        if (!majorApiCandidates.some(m => m.label === fb.label)) {
          majorApiCandidates.push({
            value: `plan-api|${fb.label}`,
            label: fb.label,
            price: 55000
          });
        }
      });
    });
  }

  // 메이저 3사 API 요금제 최저가 순 상위 3개 확정 (비율: 3)
  // 2. mockData.ts (ALL_MVNO_PLAN_SPECS)에서 알뜰폰 요금제 1개 수집 (네트워크 & 데이터 범위 일치, 비율: 1)
  let mvnoCandidates = ALL_MVNO_MAPPED.filter(plan => {
    if (targetNetwork && plan.networkType !== targetNetwork) return false;
    return matchesDataVolumeFilter(plan.label, dataVolume);
  });

  if (mvnoCandidates.length === 0) {
    mvnoCandidates = ALL_MVNO_MAPPED.filter(plan =>
      targetNetwork ? plan.networkType === targetNetwork : true
    );
  }
  if (mvnoCandidates.length === 0) {
    mvnoCandidates = ALL_MVNO_MAPPED;
  }

  mvnoCandidates = interleaveMvnoPlans(mvnoCandidates);
  mvnoCandidates.sort((a, b) => a.price - b.price);

  const mvnoRecommendationCandidates = mvnoCandidates.map(p => ({
    value: `plan-api|${p.label}`,
    label: p.label,
    price: p.price
  }));

  // 3. 메이저 3사 API (3) : 알뜰폰 Mock (1) 비율로 4개 결합 후 전체 가격 낮은 순 정렬
  const preferredCarrier = carrier === "skt" ? "SKT" : carrier === "kt" ? "KT" : carrier === "lgu" ? "LGU+" : "";
  const preferredCandidates = carrier === "mvno"
    ? mvnoRecommendationCandidates
    : majorApiCandidates.filter(plan => plan.label.includes(preferredCarrier));
  const otherCandidates = carrier === "mvno"
    ? majorApiCandidates
    : [
        ...majorApiCandidates.filter(plan => !plan.label.includes(preferredCarrier)),
        ...mvnoRecommendationCandidates,
      ];

  const pool = [
    ...[...preferredCandidates].sort((a, b) => a.price - b.price),
    ...[...otherCandidates].sort((a, b) => a.price - b.price),
  ]
    .filter((plan, index, plans) => plans.findIndex(candidate => candidate.value === plan.value) === index)
    .slice(0, 4);

  // 4. 가격 순으로 [추천 1순위] ~ [추천 4순위] 라벨링하여 반환
  const finalOptions: FlowChoiceOption[] = pool.map((p, idx) => ({
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
  const desiredNetwork = answers[`${namespace}.desiredNetwork`] as string;
  const dataVolume = answers[`${namespace}.dataVolume`] as string;
  const targetNetwork = desiredNetwork === "5g" ? "5G" : desiredNetwork === "lte" ? "LTE" : null;

  // 메이저 3사 API 키 데이터 수집 (최대 9개)
  let majorApiCandidates: { value: string; label: string; price: number }[] = [];
  if (allPlans && allPlans.length > 0) {
    const majorPlans = allPlans.filter(p => p.telecom === "SKT" || p.telecom === "KT" || p.telecom === "LGU+");
    let filteredMajor = majorPlans.filter(p => {
      if (targetNetwork) {
        const is5g = p.planName.includes("5G") || p.planName.includes("5g");
        if (targetNetwork === "5G" && !is5g) return false;
        if (targetNetwork === "LTE" && is5g) return false;
      }
      const dataLabel = `${p.planName} ${p.data || ""}`;
      return matchesDataVolumeFilter(dataLabel, dataVolume);
    });
    if (filteredMajor.length < 3) {
      filteredMajor = majorPlans.filter(p => {
        if (targetNetwork) {
          const is5g = p.planName.includes("5G") || p.planName.includes("5g");
          if (targetNetwork === "5G" && !is5g) return false;
          if (targetNetwork === "LTE" && is5g) return false;
        }
        return true;
      });
    }
    filteredMajor.sort((a, b) => a.monthlyFee - b.monthlyFee);
    const seenNames = new Set<string>();
    filteredMajor.forEach(p => {
      if (!seenNames.has(p.planName)) {
        seenNames.add(p.planName);
        const netType = p.planName.includes("5G") || p.planName.includes("5g") ? "5G" : "LTE";
        const fullLabel = `[${p.telecom}] ${p.planName} · 월 ${p.monthlyFee.toLocaleString("ko-KR")}원 · ${p.data || "기본제공"} · ${netType}`;
        majorApiCandidates.push({
          value: `plan-api|${fullLabel}`,
          label: fullLabel,
          price: p.monthlyFee
        });
      }
    });
  }
  const selectedMajor9 = majorApiCandidates.sort((a, b) => a.price - b.price).slice(0, 9);

  // 알뜰폰 mockData (ALL_MVNO_PLAN_SPECS) 수집 (최대 3개)
  let mvnoCandidates = ALL_MVNO_MAPPED.filter(plan => {
    if (targetNetwork && plan.networkType !== targetNetwork) return false;
    return matchesDataVolumeFilter(plan.label, dataVolume);
  });
  if (mvnoCandidates.length === 0) {
    mvnoCandidates = ALL_MVNO_MAPPED;
  }
  mvnoCandidates = interleaveMvnoPlans(mvnoCandidates);
  mvnoCandidates.sort((a, b) => a.price - b.price);
  const selectedMvno3 = mvnoCandidates.slice(0, 3).map(p => ({
    value: `plan-api|${p.label}`,
    label: p.label,
    price: p.price
  }));

  const combined = [...selectedMajor9, ...selectedMvno3].sort((a, b) => a.price - b.price);

  if (combined.length === 0) {
    return [
      { value: "plan-api|[추천 1순위] 알뜰폰 5G 데이터 무제한 가성비 팩 (월 33,000원)", label: "알뜰폰 5G 데이터 무제한 가성비 팩 (월 33,000원)", next: "phone-result" },
      { value: "plan-api|[추천 2순위] KT 맞춤 청년 요금제 (월 45,000원)", label: "KT 맞춤 청년 요금제 (월 45,000원)", next: "phone-result" },
      { value: "plan-api|SKT 요금제 A (월 69,000원)", label: "SKT 요금제 A (월 69,000원)", next: "phone-result" },
      { value: "plan-api|SKT 인기 요금제 B (월 59,000원)", label: "SKT 인기 요금제 B (월 59,000원)", next: "phone-result" },
      { value: "plan-api|일반 LTE/5G 요금제 (월 55,000원)", label: "일반 LTE/5G 요금제 (월 55,000원)", next: "phone-result" }
    ];
  }

  return combined.map(p => ({
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

          // 2. 데이터 사용량 우선순위 (id: "phone-data-volume" ±10GB 범위 & 근접 순 정렬)
          if (a.matchesData !== b.matchesData) {
            return Number(b.matchesData) - Number(a.matchesData);
          }
          if (a.dataDiff !== b.dataDiff) {
            return a.dataDiff - b.dataDiff;
          }

          // 3. 요금 금액 우선순위 (id: "phone-plan-fee" ±25000원 범위 & 근접 순 정렬)
          if (a.matchesPrice !== b.matchesPrice) {
            return Number(b.matchesPrice) - Number(a.matchesPrice);
          }
          if (a.priceDiff !== b.priceDiff) {
            return a.priceDiff - b.priceDiff;
          }

          // 4. 네트워크 타입 우선순위 (id: "phone-desired-network")
          if (a.matchesNetwork !== b.matchesNetwork) {
            return Number(b.matchesNetwork) - Number(a.matchesNetwork);
          }

          return 0;
        })
        .slice(0, 6)
        .map(({ plan }) => {
          const planInfo = `[${plan.mvnoCarrier}] ${plan.name} · 월 ${plan.price.toLocaleString("ko-KR")}원 · ${plan.data} · ${plan.networkType}`;

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
