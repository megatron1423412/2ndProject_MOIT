// src/app/features/chat-flow/flows/telecom/iptv/flow.ts
import { composeFlow } from "../../../core/composeFlow";
import type { FlowDefinition, FlowStep } from "../../../core/types";
import { mockIptvPlans, generateRegionDetailSteps } from "./mockData";
import type { IptvPlan } from "./mockData";

const namespace = "iptv";

// providerType 값(value) -> 실제 노출용 라벨 매핑
const providerTypeLabelMap: Record<string, string> = {
  sk_btv: "SK 브로드밴드(B tv)",
  kt_genie: "KT (지니 TV)",
  lg_uplus: "LG유플러스 (U+tv)",
  dlive: "딜라이브",
  kt_hcn: "KT HCN",
  lg_hellovision: "LG헬로비전",
  genie_skylife: "스카이라이프",
  kt_skylife: "KT 스카이라이프",
  cmb: "CMB",
  none: "셋톱박스 없음",
};

// providerType 값 -> mockData.ts의 실제 carrier 코드 매핑
const providerTypeToCarrierMap: Record<string, IptvPlan["carrier"]> = {
  sk_btv: "sk_btv",
  kt_genie: "kt_genie",
  lg_uplus: "lg_uplus",
  dlive: "dlive",
  kt_hcn: "kt_hcn",
  lg_hellovision: "hello_vision",
  genie_skylife: "genie_skylife",
  kt_skylife: "kt_skylife",
  cmb: "cmb",
};

// 통신사 그룹핑
const providerGroupMap: Record<string, IptvPlan["carrier"][]> = {
  sk_btv: ["sk_btv"],
  kt_genie: ["kt_genie", "kt_hcn", "genie_skylife", "kt_skylife"],
  kt_hcn: ["kt_genie", "kt_hcn", "genie_skylife", "kt_skylife"],
  genie_skylife: ["kt_genie", "kt_hcn", "genie_skylife", "kt_skylife"],
  kt_skylife: ["kt_genie", "kt_hcn", "genie_skylife", "kt_skylife"],
  lg_uplus: ["lg_uplus", "hello_vision"],
  lg_hellovision: ["lg_uplus", "hello_vision"],
  dlive: ["dlive"],
  cmb: ["cmb"],
};

// carrier 코드 -> 화면 표시용 라벨
const carrierDisplayMap: Record<string, string> = {
  sk_btv: "SK 브로드밴드(B tv)",
  kt_genie: "KT (지니 TV)",
  lg_uplus: "LG유플러스 (U+tv)",
  dlive: "딜라이브",
  kt_hcn: "KT HCN",
  hello_vision: "LG헬로비전",
  genie_skylife: "스카이라이프",
  kt_skylife: "KT 스카이라이프",
  cmb: "CMB",
};

// answers 객체에서 평탄형 키 또는 중첩된 객체형 키 모두 지원하는 헬퍼
const getAnswerValue = (answers: Record<string, any>, key: string): any => {
  if (key in answers) return answers[key];
  const parts = key.split(".");
  if (parts.length === 2) {
    const [ns, field] = parts;
    if (answers[ns] && typeof answers[ns] === "object") {
      return answers[ns][field];
    }
  }
  return undefined;
};

// 🔧 [수정] CMB 데이터 유실 방지를 위한 지역별 요금제 제공 여부 판별 헬퍼
const isPlanAvailableInRegion = (plan: IptvPlan, answers: Record<string, any>): boolean => {
  if (!plan.regions) {
    return true; // 전국구 요금제
  }

  const regionLv1 = getAnswerValue(answers, "iptv.regionLv1") as string;
  if (!regionLv1 || regionLv1 === "none") {
    return false;
  }

  let regionKey = regionLv1;
  let detailKey = "";

  // 1단계 선택에 따른 분기 처리 및 소분류 detailKey 결정
  if (regionLv1 === "seoul") {
    detailKey = "regionDetailSeoul";
  } else if (regionLv1 === "gyeonggi") {
    detailKey = "regionDetailGyeonggi";
  } else if (regionLv1 === "incheon") {
    detailKey = "regionDetailIncheon";
  } else if (regionLv1 === "gangwon") {
    detailKey = "regionDetailGangwon";
  } else if (regionLv1 === "jeju") {
    detailKey = "regionDetailJeju";
  } else if (regionLv1 === "gyeongsang") {
    const lv2 = (getAnswerValue(answers, "iptv.regionLv2Gyeongsang") as string) || "";
    regionKey = lv2; // 대구, 부산, 울산, gyeongbuk, gyeongnam 등으로 맵 키 전환
    if (lv2 === "daegu") detailKey = "regionDetailDaegu";
    else if (lv2 === "busan") detailKey = "regionDetailBusan";
    else if (lv2 === "ulsan") detailKey = "regionDetailUlsan";
    else if (lv2 === "gyeongbuk") detailKey = "regionDetailGyeongbuk";
    else if (lv2 === "gyeongnam") detailKey = "regionDetailGyeongnam";
  } else if (regionLv1 === "chungcheong") {
    const lv2 = (getAnswerValue(answers, "iptv.regionLv2Chungcheong") as string) || "";
    regionKey = lv2; // daejeon, sejong, chungbuk, chungnam 등으로 맵 키 전환
    if (lv2 === "daejeon") detailKey = "regionDetailDaejeon";
    else if (lv2 === "sejong") detailKey = "regionDetailSejong";
    else if (lv2 === "chungbuk") detailKey = "regionDetailChungbuk";
    else if (lv2 === "chungnam") detailKey = "regionDetailChungnam";
  } else if (regionLv1 === "jeolla") {
    const lv2 = (getAnswerValue(answers, "iptv.regionLv2Jeolla") as string) || "";
    regionKey = lv2; // jeonbuk, jeonnam
    if (lv2 === "jeonbuk") detailKey = "regionDetailJeonbuk";
    else if (lv2 === "jeonnam") detailKey = "regionDetailJeonnam";
  }

  if (!regionKey || !detailKey) {
    return false;
  }

  const detail = getAnswerValue(answers, `iptv.${detailKey}`) as string;
  if (!detail) {
    return false;
  }

  const districts = plan.regions[regionKey];
  if (!districts) {
    return false;
  }

  return districts.includes(detail);
};

// 약정 조건에 해당하는 가격을 안전하게 가져오는 헬퍼
const getContractPrice = (plan: IptvPlan, contract: string): number => {
  const priceMap = plan.prices.single as Record<string, number | undefined>;
  return priceMap[contract] ?? 0;
};

export let lastDesiredContract = "3years";

// price getter 동적 정의
mockIptvPlans.forEach((plan) => {
  if (!("price" in plan)) {
    Object.defineProperty(plan, "price", {
      get() {
        return getContractPrice(plan, lastDesiredContract);
      },
      configurable: true,
    });
  }
});

// 우선순위 높은 약정 기준 대표 가격 가져오기
const getRepresentativePrice = (plan: IptvPlan): number => {
  const order = ["3years", "2years", "1year", "none"];
  const priceMap = plan.prices.single as Record<string, number | undefined>;
  for (const key of order) {
    const price = priceMap[key];
    if (price) return price;
  }
  return 0;
};

// =================================================================
// [Part 1] 현재 사용자 정보 입력 파트
// =================================================================
const opening: FlowStep[] = [
  {
    id: "iptv-intro",
    type: "assistant-message",
    message: "TV·IPTV 요금 진단을 시작할게요! 지금 이용 조건부터 차근차근 확인해 볼게요 🔍",
    next: "iptv-provider-type",
  },
  {
    id: "iptv-provider-type",
    type: "single-choice",
    message: "지금 이용 중이신 TV·IPTV 통신사를 골라주세요 📺",
    answerKey: `${namespace}.providerCategory`,
    options: [
      { value: "sk_btv", label: providerTypeLabelMap.sk_btv, next: "iptv-current-price-input" },
      { value: "kt_genie", label: providerTypeLabelMap.kt_genie, next: "iptv-current-price-input" },
      { value: "lg_uplus", label: providerTypeLabelMap.lg_uplus, next: "iptv-current-price-input" },
      { value: "cable", label: "케이블/지역방송", next: "iptv-provider-cable" },
      { value: "none", label: providerTypeLabelMap.none, next: "iptv-desired-contract" },
    ],
  },
  {
    id: "iptv-provider-cable",
    type: "single-choice",
    message: "이용 중이신 케이블/지역방송 통신사를 골라주세요 📡",
    answerKey: `${namespace}.providerType`,
    options: [
      { value: "dlive", label: providerTypeLabelMap.dlive, next: "iptv-current-price-input" },
      { value: "kt_hcn", label: providerTypeLabelMap.kt_hcn, next: "iptv-current-price-input" },
      { value: "lg_hellovision", label: providerTypeLabelMap.lg_hellovision, next: "iptv-current-price-input" },
      { value: "genie_skylife", label: providerTypeLabelMap.genie_skylife, next: "iptv-current-price-input" },
      { value: "cmb", label: providerTypeLabelMap.cmb, next: "iptv-current-price-input" },
    ],
  },
];

// =================================================================
// [Part 2] 원하는 요금제 및 서비스 조건 선택 파트
// =================================================================
const specific: FlowStep[] = [
  {
    id: "iptv-current-price-input",
    type: "number-input",
    message: "매달 내고 계신 TV·IPTV 요금을 입력해 주세요 💰",
    answerKey: `${namespace}.currentPlanPriceInput`,
    placeholder: "예: 15400",
    min: 0,
    unit: "원",
    next: "iptv-current-plan-api",
  },
  {
    id: "iptv-current-plan-api",
    type: "single-choice",
    message: "지금 쓰시는 TV·IPTV 요금제가 이게 맞을까요? 확인 한 번만 부탁드려요 ✅",
    answerKey: `${namespace}.confirmedPlan`,
    options: [
      { value: "direct-choose", label: "직접 고를래요(리스트 보기)", next: "iptv-choose-current-list" },
      { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "iptv-manual-name-input" },
    ],
    optionsResolver: (answers) => {
      const providerType = (answers[`${namespace}.providerType`] || answers[`${namespace}.providerCategory`]) as string;
      const currentPrice = Number(answers[`${namespace}.currentPlanPriceInput`]) || 0;
      const carrierCode = providerTypeToCarrierMap[providerType];

      const candidatePlans = mockIptvPlans.filter((p) => p.carrier === carrierCode);

      let bestPlan: IptvPlan | null = null;
      let bestPrice = 0;
      let minDiff = Infinity;

      candidatePlans.forEach((plan) => {
        const priceMap = plan.prices.single as Record<string, number | undefined>;
        Object.values(priceMap).forEach((price) => {
          if (!price) return;
          const diff = Math.abs(price - currentPrice);
          if (diff < minDiff) {
            minDiff = diff;
            bestPlan = plan;
            bestPrice = price;
          }
        });
      });

      const carrierLabel = providerTypeLabelMap[providerType] ?? carrierCode;
      const apiOptions = bestPlan
        ? [
          {
            value: bestPlan.id,
            label: `[${carrierLabel}] ${bestPlan.name} 월 ${bestPrice.toLocaleString("ko-KR")}원\n${bestPlan.channels}개 채널, IPTV 일반형, 음성 지원, 셋톱박스 포함`,
          },
        ]
        : [];

      return [
        ...apiOptions,
        { value: "direct-choose", label: "직접 고를래요(리스트 보기)", next: "iptv-choose-current-list" },
        { value: "direct-input", label: "직접 입력 (요금제명 직접 작성)", next: "iptv-manual-name-input" },
      ];
    },
    next: "iptv-contract-diagnosis",
  },
  {
    id: "iptv-choose-current-list",
    type: "single-choice",
    message: "지금 이용 중이신 TV·IPTV 요금제를 골라주세요 🔍",
    answerKey: `${namespace}.currentPlanId`,
    options: [
      { value: "manual_fallback", label: "⚠️ 리스트에 내 요금제가 없음 (직접 입력)", next: "iptv-manual-name-input" },
    ],
    optionsResolver: (answers) => {
      const providerType = (answers[`${namespace}.providerType`] || answers[`${namespace}.providerCategory`]) as string;
      const carrierCode = providerTypeToCarrierMap[providerType];
      const plans = mockIptvPlans.filter((p) => p.carrier === carrierCode);

      return [
        ...plans.map((plan) => {
          const price = getContractPrice(plan, "3years") || getRepresentativePrice(plan);
          const feeStr = price > 0 ? ` (월 ${price.toLocaleString("ko-KR")}원)` : "";
          return {
            value: plan.id,
            label: `${plan.name}${feeStr}`,
            next: "iptv-contract-diagnosis",
          };
        }),
        { value: "manual_fallback", label: "⚠️ 리스트에 내 요금제가 없음 (직접 입력)", next: "iptv-manual-name-input" },
      ];
    },
    next: "iptv-contract-diagnosis",
  },
  {
    id: "iptv-manual-name-input",
    type: "text-input",
    message: "쓰고 계신 TV·IPTV 요금제 이름을 입력해 주세요 ✍️",
    answerKey: `${namespace}.currentPlanNameManual`,
    placeholder: "통신사 요금제이름 (예 : Btv 스탠다드)",
    next: "iptv-contract-diagnosis",
  },
  {
    id: "iptv-contract-diagnosis",
    type: "single-choice",
    message: "지금 약정 상태는 어떠세요? 📅",  
    answerKey: `${namespace}.userContractStatus`,
    options: [
      { value: "expired", label: "약정이 만료됨", next: "iptv-desired-contract" },
      { value: "remaining", label: "약정 기간 남음", next: "iptv-desired-contract" },
      { value: "unknown", label: "잘 모르겠음", next: "iptv-desired-contract" },
    ],
    optionsResolver: (answers) => {
      const confirmed = answers[`${namespace}.confirmedPlan`] as string;
      const currentPlanId = answers[`${namespace}.currentPlanId`] as string;
      const manualName = answers[`${namespace}.currentPlanNameManual`] as string;

      if (confirmed && confirmed !== "direct-select" && confirmed !== "direct-input") {
        answers[`${namespace}.currentPlanId`] = confirmed;
        answers[`${namespace}.currentInputMethod`] = "list";
      } else if (currentPlanId && currentPlanId !== "manual_fallback") {
        answers[`${namespace}.currentInputMethod`] = "list";
      } else if (manualName) {
        answers[`${namespace}.currentInputMethod`] = "manual";
      }

      return [
        { value: "expired", label: "약정이 만료됨", next: "iptv-desired-contract" },
        { value: "remaining", label: "약정 기간 남음", next: "iptv-desired-contract" },
        { value: "unknown", label: "잘 모르겠음", next: "iptv-desired-contract" },
      ];
    },
  },
  {
    id: "iptv-desired-contract",
    type: "single-choice",
    message: "이제 원하시는 TV·IPTV 요금제를 찾아볼까요?\n비교하고 싶은 약정 기간을 골라주시면, 그에 맞는 요금제를 모잇이 챙겨드릴게요 ✅",
    answerKey: `${namespace}.desiredContract`,
    options: [
      { value: "3years", label: "3년 약정 (추천)", next: "iptv-region-lv1" },
      { value: "2years", label: "2년 약정", next: "iptv-region-lv1" },
      { value: "1year", label: "1년 약정", next: "iptv-region-lv1" },
      { value: "none", label: "무약정", next: "iptv-region-lv1" },
    ],
    next: "iptv-region-lv1",
  },
  {
    id: "iptv-region-lv1",
    type: "single-choice",
    message: "사시는 지역을 골라주세요 📍",
    answerKey: `${namespace}.regionLv1`,
    options: [
      { value: "gangwon", label: "강원", next: "iptv-region-gangwon" },
      { value: "gyeonggi", label: "경기", next: "iptv-region-gyeonggi" },
      { value: "gyeongsang", label: "경상도", next: "iptv-region-gyeongsang-lv2" },
      { value: "seoul", label: "서울", next: "iptv-region-seoul" },
      { value: "incheon", label: "인천", next: "iptv-region-incheon" },
      { value: "jeolla", label: "전라도", next: "iptv-region-jeolla-lv2" },
      { value: "jeju", label: "제주", next: "iptv-region-jeju" },
      { value: "chungcheong", label: "충청도", next: "iptv-region-chungcheong-lv2" },
      { value: "none", label: "선택안함", next: "iptv-select-new-plan" },
    ],
  },

  // 🔧 mockData 팩토리 함수를 이용한 동적 지역 디테일 Step 전개
  ...generateRegionDetailSteps(namespace, "iptv-select-new-plan"),

  // 경상도 중분류
  {
    id: "iptv-region-gyeongsang-lv2",
    type: "single-choice",
    message: "경상도의 세부 지역을 골라주세요 📍",
    answerKey: `${namespace}.regionLv2Gyeongsang`,
    options: [
      { value: "gyeongnam", label: "경상남도", next: "iptv-region-gyeongnam" },
      { value: "gyeongbuk", label: "경상북도", next: "iptv-region-gyeongbuk" },
      { value: "daegu", label: "대구광역시", next: "iptv-region-daegu" },
      { value: "busan", label: "부산광역시", next: "iptv-region-busan" },
      { value: "ulsan", label: "울산광역시", next: "iptv-region-ulsan" },
    ],
  },
  // 충청도 중분류
  {
    id: "iptv-region-chungcheong-lv2",
    type: "single-choice",
    message: "충청도의 세부 지역을 골라주세요 📍",
    answerKey: `${namespace}.regionLv2Chungcheong`,
    options: [
      { value: "daejeon", label: "대전광역시", next: "iptv-region-daejeon" },
      { value: "sejong", label: "세종특별자치시", next: "iptv-region-sejong" },
      { value: "chungnam", label: "충청남도", next: "iptv-region-chungnam" },
      { value: "chungbuk", label: "충청북도", next: "iptv-region-chungbuk" },
    ],
  },
  // 전라도 중분류
  {
    id: "iptv-region-jeolla-lv2",
    type: "single-choice",
    message: "전라도의 세부 지역을 골라주세요 📍",
    answerKey: `${namespace}.regionLv2Jeolla`,
    options: [
      { value: "jeonnam", label: "전라남도", next: "iptv-region-jeonnam" },
      { value: "jeonbuk", label: "전라북도", next: "iptv-region-jeonbuk" },
    ],
  },
  // [Part 2 - 7번] 요금제 리스트 선택 (추천 요금제 카드 형태)
  {
    id: "iptv-select-new-plan",
    type: "single-choice",
<<<<<<< Updated upstream
    message: "고객님의 조건을 분석하여 선정한 최적의 추천 요금제 리스트입니다.\n※셋톱박스 대여, 출동비 별도※",
=======
    message: "선택하신 약정 조건에 딱 맞는 TV·IPTV 요금제를 모아왔어요! 갈아탈 생각이 있거나 관심 가는 요금제를 골라주세요 ✨\n※ 셋톱박스 대여, 출동비는 별도예요",
>>>>>>> Stashed changes
    answerKey: `${namespace}.selectedNewPlan`,
    options: [
      { value: "direct-choose", label: "직접 고를래요 (다른추천 리스트 보기)", next: "iptv-all-plans-select" },
    ],
    optionsResolver: (answers) => {
      const desiredContract = (answers[`${namespace}.desiredContract`] as string) || "3years";
      lastDesiredContract = desiredContract;

      const carriers: IptvPlan["carrier"][] = [
        "sk_btv",
        "kt_genie",
        "lg_uplus",
        "dlive",
        "kt_hcn",
        "hello_vision",
        "genie_skylife",
        "kt_skylife",
        "cmb"
      ];

      const cheapestByCarrier: { plan: IptvPlan; price: number }[] = [];

      carriers.forEach((carrierCode) => {
        // 지역 필터 적용
        const plansInCarrier = mockIptvPlans.filter((p) =>
          p.carrier === carrierCode && isPlanAvailableInRegion(p, answers)
        );
        let cheapest: IptvPlan | null = null;
        let cheapestPrice = Infinity;

        plansInCarrier.forEach((plan) => {
          const price = getContractPrice(plan, desiredContract);
          if (price > 0 && price < cheapestPrice) {
            cheapestPrice = price;
            cheapest = plan;
          }
        });

        if (cheapest) {
          cheapestByCarrier.push({ plan: cheapest, price: cheapestPrice });
        }
      });

      // 최저 가격 순 (오름차순) 정렬
      cheapestByCarrier.sort((a, b) => a.price - b.price);

      const recommendedOptions = cheapestByCarrier.map((item, idx) => {
        const carrierName = carrierDisplayMap[item.plan.carrier] ?? item.plan.carrier;
        return {
          value: item.plan.id,
          label: `[추천 ${idx + 1}순위] [${carrierName}] ${item.plan.name} (${item.plan.channels}개 채널) (월 ${item.price.toLocaleString("ko-KR")}원)`,
          next: "iptv-result",
        };
      }).slice(0, 4);

      return [
        ...recommendedOptions,
        { value: "direct-choose", label: "직접 고를래요 (다른추천 리스트 보기)", next: "iptv-all-plans-select" },
      ];
    },
    next: "iptv-result",
  },
  {
    id: "iptv-all-plans-select",
    type: "single-choice",
    message: ((answers: any) => {
      const desiredContract = answers.iptv?.desiredContract || "3years";
      lastDesiredContract = desiredContract;
      const labels: Record<string, string> = {
        "3years": "3년 약정", "2years": "2년 약정", "1year": "1년 약정", "none": "무약정",
      };
      const contractLabel = labels[desiredContract] || desiredContract;

      let table = `추천 요금제 외에 선택 가능한 전체 요금제 리스트입니다. 원하시는 요금제를 선택해 주세요. (${contractLabel})]\n`;
      return table;
    }) as unknown as string,
    answerKey: `${namespace}.selectedNewPlanDirect`,
    options: [],
    optionsResolver: (answers) => {
      const desiredContract = (answers[`${namespace}.desiredContract`] as string) || "3years";
      lastDesiredContract = desiredContract;

      const cacheKey = `${namespace}._cachedDirectOptions_${desiredContract}`;
      if (answers[cacheKey]) {
        return answers[cacheKey];
      }

      const availablePlans = mockIptvPlans
        .filter((plan) => isPlanAvailableInRegion(plan, answers))
        .map((plan) => {
          const priceMap = plan.prices?.single as Record<string, number | undefined>;
          const price = priceMap ? (priceMap[desiredContract] || priceMap["3years"] || priceMap["none"] || 0) : 0;
          return { plan, price };
        })
        .filter((item) => item.price > 0);

      // 최저 가격 순 (오름차순) 정렬
      availablePlans.sort((a, b) => a.price - b.price);

      const resolvedOptions = [
        ...availablePlans.map(({ plan, price }) => ({
          value: plan.id,
          label: `[${carrierDisplayMap[plan.carrier] ?? plan.carrier}] ${plan.name} (${plan.channels}개 채널) (월 ${price.toLocaleString("ko-KR")}원)`,
          next: "iptv-result",
        })),
        {
          value: "none-of-them",
          label: "목록에 없음 (금액 기준으로만 진단)",
          next: "iptv-result",
        },
      ];

      answers[cacheKey] = resolvedOptions;
      return resolvedOptions;
    },
    next: "iptv-result",
  },
  {
    id: "iptv-result",
    type: "result",
    message: "선택하신 요금제로 TV·IPTV 요금 비교 분석을 마쳤어요! 아래 카드에서 비교 분석 리포트를 확인해 보세요.📋",
    next: "iptv-ask-grade-diagnosis"
  },
  {
    id: "iptv-ask-grade-diagnosis",
    type: "single-choice",
    message: "절약 습관이 궁금하지 않으세요? 소비 패턴 등급 진단도 받아보시겠어요? 💡",
    answerKey: `${namespace}.askGrade`,
    options: [
      { value: "yes", label: "YES", next: "iptv-grade-result" },
      { value: "no", label: "NO", next: "iptv-completed-exit" },
    ],
  },
  {
    id: "iptv-grade-result",
    type: "result",
    message: "TV·IPTV  소비 패턴 등급 진단 완료! 결과 등급 카드가 나왔어요. 지금 확인해 보세요✨",
  },
  {
    id: "iptv-completed-exit",
    type: "result",
  },
];

// 최종 흐름 생성
export const iptvFlow: FlowDefinition = {
  id: "iptv-flow",
  subCategoryId: "iptv",
  categoryId: "telecom",
  startStepId: "iptv-intro",
  steps: composeFlow(opening, specific),
};