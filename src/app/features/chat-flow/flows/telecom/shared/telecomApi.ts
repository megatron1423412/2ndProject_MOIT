/**
 * telecom/shared/telecomApi.ts
 * 
 * telecom 카테고리 전용 클라이언트 API 서비스 레이어.
 * Vite 개발 서버 미들웨어(telecomOllamaRoute.ts)를 통해
 * SmartChoice API와 Ollama LLM을 안전하게 호출합니다.
 */

// ──────────────────────────────────────────────
// 타입 정의
// ──────────────────────────────────────────────

export interface SmartChoicePlan {
  planName: string;
  telecom: string;
  monthlyFee: number;
  data: string;
  voice: string;
  sms: string;
  link: string;
}

export interface SmartChoiceResponse {
  success: boolean;
  count: number;
  plans: SmartChoicePlan[];
  source: string;
  resultCode?: string;
  error?: string;
  message?: string;
}

export interface PhonePlanParams {
  /** 월 평균 통화량 (분, 무제한=999999) */
  voice?: string;
  /** 월 평균 데이터 사용량 (MB, 무제한=999999) */
  data: string;
  /** 월 평균 문자 발송량 (건, 무제한=999999) */
  sms?: string;
  /** 연령 (성인=20, 청소년=18, 실버=65) */
  age: string;
  /** 서비스 타입 (LTE=3, 5G=6) */
  type: string;
  /** 약정기간 (무약정=0, 12개월=12, 24개월=24) */
  dis: string;
}

const phonePlanRequestsInFlight = new Map<string, Promise<SmartChoiceResponse>>();

// ──────────────────────────────────────────────
// 사용자 답변 → SmartChoice 파라미터 변환 헬퍼
// ──────────────────────────────────────────────

/** phone.dataVolume → data (MB 문자열) */
export function mapDataVolumeToMB(dataVolume: string): string {
  switch (dataVolume) {
    case "unlimited": return "999999";
    case "high":      return "51200";   // ~50GB
    case "mid":       return "20480";   // ~20GB
    case "low":       return "5120";    // ~5GB
    default:          return "10240";   // 기본 10GB
  }
}

/** phone.desiredNetwork → type (3=LTE, 6=5G) */
export function mapNetworkToType(desiredNetwork: string): string {
  return desiredNetwork === "5g" ? "6" : "3";
}

/** phone.ageGroup → age (20=성인, 18=청소년, 65=실버) */
export function mapAgeGroupToAge(ageGroup: string): string {
  switch (ageGroup) {
    case "youth":  return "20"; // 청년(만19~34) → 성인 분류
    case "senior": return "65";
    case "teen":   return "18";
    case "child":  return "18";
    default:       return "20"; // 일반/기본
  }
}

/** phone.discountOptions 또는 contractType → dis (0=무약정, 12, 24) */
export function mapContractToDis(contractType?: string): string {
  if (!contractType) return "24"; // 기본 24개월
  if (contractType.includes("24")) return "24";
  if (contractType.includes("12")) return "12";
  return "0";
}

// ──────────────────────────────────────────────
// API 호출 함수
// ──────────────────────────────────────────────

/**
 * 스마트초이스 API에서 실시간 휴대폰 요금제를 조회합니다.
 * Vite 서버 미들웨어 (/api/telecom/phone-plans) 를 경유합니다.
 */
export async function fetchSmartChoicePhonePlans(
  params: PhonePlanParams
): Promise<SmartChoiceResponse> {
  const qs = new URLSearchParams({
    voice: params.voice ?? "999999",
    data:  params.data,
    sms:   params.sms  ?? "999999",
    age:   params.age,
    type:  params.type,
    dis:   params.dis,
  });

  const requestUrl = `/api/telecom/phone-plans?${qs}`;
  const existingRequest = phonePlanRequestsInFlight.get(requestUrl);
  if (existingRequest) return existingRequest;

  const request = (async (): Promise<SmartChoiceResponse> => {
    try {
      const res = await fetch(requestUrl, {
        signal: AbortSignal.timeout(12_000),
      });
      const json = await res.json() as SmartChoiceResponse;
      return json;
    } catch (err) {
      return {
        success: false,
        count: 0,
        plans: [],
        source: "error",
        error: err instanceof Error ? err.message : String(err),
        message: "스마트초이스 API 요청 중 오류가 발생했습니다.",
      };
    } finally {
      phonePlanRequestsInFlight.delete(requestUrl);
    }
  })();

  phonePlanRequestsInFlight.set(requestUrl, request);
  return request;
}

/**
 * Ollama 로컬 LLM으로 통신비 절약 AI 코멘트를 생성합니다.
 * Vite 서버 미들웨어 (/api/telecom/ollama-comment) 를 경유합니다.
 */
export async function generateTelecomComment(
  prompt: string,
  category: "phone" | "internet" | "iptv" | "bundle"
): Promise<string | null> {
  try {
    const res = await fetch("/api/telecom/ollama-comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, category }),
      signal: AbortSignal.timeout(35_000),
    });
    if (!res.ok) return null;
    const json = await res.json() as { success?: boolean; comment?: string };
    return json.comment ?? null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// 프롬프트 빌더 (카테고리별)
// ──────────────────────────────────────────────

export function buildPhoneCommentPrompt(args: {
  carrier: string;
  currentFee: number;
  selectedPlanName: string;
  selectedFee: number;
  dataVolume: string;
  ageGroup: string;
}): string {
  const diff = args.currentFee - args.selectedFee;
  const direction = diff > 0 ? `월 ${diff.toLocaleString("ko-KR")}원 절감` : `월 ${Math.abs(diff).toLocaleString("ko-KR")}원 추가 지출`;
  return `당신은 한국의 통신비 절약 전문가입니다. 아래 고객 상황을 바탕으로 친근하고 실용적인 한국어 소비 가이드를 2~3문장으로 작성해 주세요. 이모지를 적절히 사용하고, 구체적인 절약 이유나 업그레이드 혜택을 강조해 주세요.

고객 상황:
- 현재 통신사: ${args.carrier}
- 현재 요금: 월 ${args.currentFee.toLocaleString("ko-KR")}원
- 선택한 요금제: ${args.selectedPlanName} (월 ${args.selectedFee.toLocaleString("ko-KR")}원)
- 요금 변동: ${direction}
- 데이터 사용량: ${args.dataVolume}
- 연령대: ${args.ageGroup}

출처 표기 없이 순수 가이드 문구만 작성해 주세요.`;
}

export function buildInternetCommentPrompt(args: {
  carrier: string;
  currentFee: number;
  selectedPlanName: string;
  selectedFee: number;
  desiredSpeed: string;
  contractPeriod: string;
}): string {
  const diff = args.currentFee - args.selectedFee;
  const direction = diff > 0 ? `월 ${diff.toLocaleString("ko-KR")}원 절감` : `월 ${Math.abs(diff).toLocaleString("ko-KR")}원 추가 지출`;
  return `당신은 한국의 인터넷 요금 절약 전문가입니다. 아래 고객 상황을 바탕으로 친근하고 실용적인 한국어 소비 가이드를 2~3문장으로 작성해 주세요. 이모지를 적절히 사용해 주세요.

고객 상황:
- 현재 인터넷 통신사: ${args.carrier}
- 현재 요금: 월 ${args.currentFee.toLocaleString("ko-KR")}원
- 선택한 인터넷 요금제: ${args.selectedPlanName} (월 ${args.selectedFee.toLocaleString("ko-KR")}원)
- 요금 변동: ${direction}
- 희망 속도: ${args.desiredSpeed}Mbps
- 약정 상태: ${args.contractPeriod}

출처 표기 없이 순수 가이드 문구만 작성해 주세요.`;
}

export function buildIptvCommentPrompt(args: {
  provider: string;
  currentFee: number;
  selectedPlanName: string;
  selectedFee: number;
  selectedChannels: number;
}): string {
  const diff = args.currentFee - args.selectedFee;
  const direction = diff > 0 ? `월 ${diff.toLocaleString("ko-KR")}원 절감` : `월 ${Math.abs(diff).toLocaleString("ko-KR")}원 추가 지출`;
  return `당신은 한국의 IPTV 요금 절약 전문가입니다. 아래 고객 상황을 바탕으로 친근하고 실용적인 한국어 소비 가이드를 2~3문장으로 작성해 주세요. 이모지를 적절히 사용해 주세요.

고객 상황:
- 현재 IPTV 서비스: ${args.provider}
- 현재 요금: 월 ${args.currentFee.toLocaleString("ko-KR")}원
- 선택한 IPTV 요금제: ${args.selectedPlanName} (월 ${args.selectedFee.toLocaleString("ko-KR")}원)
- 요금 변동: ${direction}
- 선택 채널 수: 약 ${args.selectedChannels}개 채널

출처 표기 없이 순수 가이드 문구만 작성해 주세요.`;
}

export function buildBundleCommentPrompt(args: {
  currentCarrier: string;
  currentFee: number;
  selectedPlanName: string;
  selectedFee: number;
  knowPenalty: boolean;
  penaltyAmount: number;
}): string {
  const diff = args.currentFee - args.selectedFee;
  const direction = diff > 0 ? `월 ${diff.toLocaleString("ko-KR")}원 절감` : `월 ${Math.abs(diff).toLocaleString("ko-KR")}원 추가 지출`;
  const penaltyInfo = args.knowPenalty
    ? `위약금 ${args.penaltyAmount.toLocaleString("ko-KR")}원 발생 예정`
    : "위약금 미확인 상태";
  return `당신은 한국의 결합상품 요금 절약 전문가입니다. 아래 고객 상황을 바탕으로 친근하고 실용적인 한국어 소비 가이드를 2~3문장으로 작성해 주세요. 이모지를 적절히 사용해 주세요.

고객 상황:
- 현재 통신사: ${args.currentCarrier}
- 현재 결합 요금: 월 ${args.currentFee.toLocaleString("ko-KR")}원
- 선택한 결합 요금제: ${args.selectedPlanName} (월 ${args.selectedFee.toLocaleString("ko-KR")}원)
- 요금 변동: ${direction}
- 위약금 상황: ${penaltyInfo}

출처 표기 없이 순수 가이드 문구만 작성해 주세요.`;
}
