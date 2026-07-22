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
      const fullLabel = `[${p.mvnoCarrier}] ${p.name} (월 ${p.price.toLocaleString("ko-KR")}원)`;
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
  if (label.includes("일5GB") || label.includes("일 5GB") || label.includes("일5g") || label.includes("일 5g")) return 150;
  
  // 1. 명시적인 GB 숫자 패턴 우선 추출 (예: 50GB, 10GB, 6GB, 100GB, 110GB, 71GB, 4GB)
  const match = label.match(/(\d+(?:\.\d+)?)\s*GB/i);
  if (match) {
    return parseFloat(match[1]);
  }

  // 2. 숫자가 명시되지 않고 '무제한' 단어가 들어간 경우
  if (label.includes("무제한") || label.includes("데이터 무한")) {
    return 100;
  }

  return 10;
}

function matchesDataVolumeFilter(label: string, dataVolume: string): boolean {
  const gb = parseDataGB(label);
  if (dataVolume === "unlimited") {
    return gb >= 100 || label.includes("무제한") || label.includes("일5GB") || label.includes("일 5GB");
  }
  if (dataVolume === "high") {
    return gb >= 50 && gb <= 100;
  }
  if (dataVolume === "mid") {
    return gb >= 10 && gb <= 35;
  }
  if (dataVolume === "low") {
    return gb < 10;
  }
  return true;
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

export const resolvePhoneCurrentPlanOptions = (answers: FlowAnswers): FlowChoiceOption[] => {
  const carrier = answers[`${namespace}.carrier`] as string;
  const currentFee = (answers[`${namespace}.currentFee`] as number) || 0;

  // 1순위: 스마트 초이스 API 키 데이터 (planCache 또는 allPlans에서 가져옴)
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
        const fullLabel = `[${p.telecom}] ${p.planName} (월 ${p.monthlyFee.toLocaleString("ko-KR")}원)`;
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
  const selectedMajor3 = majorApiCandidates.sort((a, b) => a.price - b.price).slice(0, 3);

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

  const selectedMvno1 = mvnoCandidates.slice(0, 1).map(p => ({
    value: `plan-api|${p.label}`,
    label: p.label,
    price: p.price
  }));

  // 3. 메이저 3사 API (3) : 알뜰폰 Mock (1) 비율로 4개 결합 후 전체 가격 낮은 순 정렬
  const pool = [...selectedMajor3, ...selectedMvno1];
  pool.sort((a, b) => a.price - b.price);

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
        const fullLabel = `[${p.telecom}] ${p.planName} (월 ${p.monthlyFee.toLocaleString("ko-KR")}원)`;
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
    next: "phone-plan-fee"
  },

  // [Part 1 - 2번] 현재 사용하는 요금제 금액 입력
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
      const currentFee = (answers[`phone.currentFee`] as number) || 0;

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

      // API 1순위 (입력 금액 기준 근접 순 정렬)
      let apiMatched = apiPlans
        .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee))
        .slice(0, 5);

      let matchedList = apiMatched.map(p => ({
        value: p.value,
        label: p.label,
        next: "phone-contract-period"
      }));

      // 알뜰폰(MVNO) 선택 시에만 수량 부족 시 ALL_MVNO_PLAN_SPECS 데이터 추가
      if (carrier === "mvno" && matchedList.length < 4) {
        let mockMatched = ALL_MVNO_MAPPED
          .filter(p => Math.abs(p.price - currentFee) <= 25000)
          .sort((a, b) => Math.abs(a.price - currentFee) - Math.abs(b.price - currentFee));

        if (mockMatched.length === 0) mockMatched = ALL_MVNO_MAPPED;
        mockMatched = interleaveMvnoPlans(mockMatched);

        const needed = 6 - matchedList.length;
        const additional = mockMatched.slice(0, needed).map(p => ({
          value: `plan-api|${p.label}`,
          label: p.label,
          next: "phone-contract-period"
        }));

        matchedList = [...matchedList, ...additional];
      }

      // SKT/KT/LGU+ 매칭 API 데이터가 아직 없는 경우 메이저 통신사 전용 요금제 1개 추가
      if (carrier !== "mvno" && matchedList.length === 0) {
        const fallback = fetchPlansFromApi(carrier, currentFee);
        matchedList = fallback.map(p => ({
          value: `plan-api|${p.label}`,
          label: p.label,
          next: "phone-contract-period"
        }));
      }

      if (matchedList.length > 0) {
        return [
          ...matchedList,
          { value: "none-of-them", label: "목록에 없음 (금액 기준으로만 진단)", next: "phone-contract-period" }
        ];
      }

      return [
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
    message: " 약정 기간 진단 여부 확인",
    answerKey: `${namespace}.contractPeriod`,
    options: [
      { value: "expired", label: "가입한 지 3년 넘음 (또는 만료됨)" },
      { value: "remaining", label: "아직 약정 기간 남음" },
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
      { value: "unlimited", label: "무제한 (헤비 유저)" },
      { value: "high", label: "50GB~100GB (일반 동영상 시청)" },
      { value: "mid", label: "10GB~30GB (출퇴근 웹서핑)" },
      { value: "low", label: "10GB 미만 (주로 와이파이 사용)" },
    ],
    next: "phone-discount-options"
  },

  // [Part 2 - 7번] 옵션 선택
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

