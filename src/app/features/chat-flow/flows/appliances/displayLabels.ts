import type { FlowAnswers } from "../../core/types";

export const AIR_CONDITIONER_TYPE_LABELS: Record<string, string> = {
  wall: "벽걸이형",
  standing: "스탠드형",
  "two-in-one": "2in1",
  window: "창문형",
};

export const AIR_CONDITIONER_USAGE_LABELS: Record<string, string> = {
  under4: "하루 4시간 미만",
  "4to8": "하루 4~8시간",
  over8: "하루 8시간 이상",
  unknown: "하루 사용 시간 잘 모르겠어요",
};

export const AIR_CONDITIONER_PRIORITY_LABELS: Record<string, string> = {
  "low-purchase-price": "구매가격이 낮은 제품",
  "electricity-saving": "전기요금까지 아끼는 제품",
  maintenance: "청소와 관리 편의",
  "current-price": "현재 가격이 좋은 제품",
  "good-current-price": "현재 가격이 좋은 제품",
  balanced: "가격·효율 균형 추천",
};

export const TV_RESOLUTION_LABELS: Record<string, string> = { "4k-uhd": "4K UHD", "full-hd": "Full HD" };
export const TV_DISTANCE_LABELS: Record<string, string> = { "under-1.5": "1.5m 이하", "1.5-2.5": "1.5~2.5m", "2.5-3": "2.5~3m", "over-3": "3m 이상", unknown: "시청 거리 잘 모르겠어요", direct: "원하는 크기 직접 선택" };
export const TV_PRIMARY_USE_LABELS: Record<string, string> = { "broadcast-streaming": "방송·유튜브·OTT 시청", "movies-dramas": "영화와 드라마 감상", "family-wide-viewing": "가족이 여러 방향에서 함께 시청", general: "특별한 용도 없이 일반 사용" };
export const TV_USAGE_LABELS: Record<string, string> = { under3: "하루 3시간 미만", "3to6": "하루 3~6시간", over6: "하루 6시간 이상", unknown: "하루 사용 시간 잘 모르겠어요" };
export const TV_PLATFORM_REQUIREMENT_LABELS: Record<string, string> = { "google-android-required": "Google TV 또는 Android TV 필수", "other-allowed": "삼성·LG 등 다른 스마트 OS도 가능", none: "스마트 플랫폼 상관없음" };
export const TV_PRIORITY_LABELS: Record<string, string> = { "low-purchase-price": "구매가격이 낮은 제품", "good-current-price": "현재 가격이 좋은 제품", "picture-quality": "화질이 좋은 제품", "electricity-saving": "전기요금을 아끼는 제품", balanced: "가격·화질 균형 추천" };
export const REFRIGERATOR_DOOR_LABELS: Record<string, string> = { "two-door": "2도어", "four-door-value": "실속형 4도어" };
export const REFRIGERATOR_CAPACITY_LABELS: Record<string, string> = { "300-500": "300~500L", "600-800": "600~800L", recommended: "가구원 수 기준 추천 용량" };
export const VACUUM_POWER_LABELS: Record<string, string> = { "wireless-value": "가성비 무선", "wired-major": "대기업 유선" };
export const VACUUM_SUCTION_LABELS: Record<string, string> = { aw: "200AW 이상", pa: "25,000Pa 이상", unknown: "흡입력 단위 잘 모르겠음" };
export const VACUUM_WEIGHT_LABELS: Record<string, string> = { "under-2.5": "2.5kg 이하", any: "중량 상관없음" };
export const PRODUCT_CATEGORY_LABELS: Record<string, string> = { "air-conditioner": "에어컨", tv: "TV", refrigerator: "냉장고", vacuum: "청소기" };

export const displayLabel = (labels: Record<string, string>, value: unknown, fallback = "선택 정보 없음") =>
  labels[String(value)] ?? fallback;

const yesNo = (value: unknown) => value === true ? "필수" : "선호 또는 상관없음";
const won = (value: unknown) => value === "none" ? "예산 제한 없음" : `${Number(value).toLocaleString("ko-KR")}원`;
const numberWithUnit = (value: unknown, unit: string) => `${Number(value).toLocaleString("ko-KR")}${unit}`;

const criteriaFormatters: Record<string, { label: string; format: (value: unknown) => string | null }> = {
  "airConditioner.installationSpace": { label: "설치 공간", format: (value) => displayLabel({ room: "방 또는 원룸", living: "거실", multiple: "거실과 방", window: "창문형이 필요한 공간", direct: "타입 직접 선택" }, value) },
  "airConditioner.type": { label: "에어컨 타입", format: (value) => displayLabel(AIR_CONDITIONER_TYPE_LABELS, value) },
  "airConditioner.directType": { label: "에어컨 타입", format: (value) => displayLabel(AIR_CONDITIONER_TYPE_LABELS, value) },
  "airConditioner.actualCoolingArea": { label: "최소 냉방면적", format: (value) => numberWithUnit(value, "평") },
  "airConditioner.homePyeong": { label: "집 전체 크기", format: (value) => numberWithUnit(value, "평") },
  "airConditioner.coolingAreaMode": { label: "냉방면적 입력 방식", format: (value) => displayLabel({ recommended: "계산값 적용", custom: "직접 입력" }, value) },
  "airConditioner.customCoolingArea": { label: "직접 입력한 최소 냉방면적", format: (value) => numberWithUnit(value, "평") },
  "airConditioner.dailyUsage": { label: "예상 사용 시간", format: (value) => displayLabel(AIR_CONDITIONER_USAGE_LABELS, value) },
  "airConditioner.valuePriority": { label: "가성비 기준", format: (value) => displayLabel(AIR_CONDITIONER_PRIORITY_LABELS, value) },
  "airConditioner.budget": { label: "제품 가격 예산", format: won },
  "tv.viewingDistance": { label: "시청 거리", format: (value) => displayLabel(TV_DISTANCE_LABELS, value) },
  "tv.recommendedScreenSize": { label: "화면 크기", format: (value) => value === "other" ? null : numberWithUnit(value, "인치") },
  "tv.screenSize": { label: "화면 크기", format: (value) => numberWithUnit(value, "인치") },
  "tv.primaryUse": { label: "주 사용", format: (value) => displayLabel(TV_PRIMARY_USE_LABELS, value) },
  "tv.dailyUsage": { label: "예상 사용 시간", format: (value) => displayLabel(TV_USAGE_LABELS, value) },
  "tv.platformRequirement": { label: "스마트 플랫폼", format: (value) => displayLabel(TV_PLATFORM_REQUIREMENT_LABELS, value) },
  "tv.valuePriority": { label: "가성비 기준", format: (value) => displayLabel(TV_PRIORITY_LABELS, value) },
  "tv.budget": { label: "제품 가격 예산", format: won },
  "refrigerator.doorType": { label: "도어 구조", format: (value) => displayLabel(REFRIGERATOR_DOOR_LABELS, value) },
  "refrigerator.householdSize": { label: "가구원", format: (value) => numberWithUnit(value, "명") },
  "refrigerator.capacityMode": { label: "용량", format: (value) => displayLabel(REFRIGERATOR_CAPACITY_LABELS, value) },
  "refrigerator.metalRequired": { label: "메탈 도어", format: yesNo },
  "refrigerator.useDefaults": { label: "기본 성능 기준", format: (value) => value === "yes" ? "적용" : "직접 선택" },
  "refrigerator.coolingRequired": { label: "간접·간랭식 냉각", format: yesNo },
  "refrigerator.inverterRequired": { label: "인버터", format: yesNo },
  "refrigerator.warrantyRequired": { label: "핵심 부품 10년 보증", format: yesNo },
  "refrigerator.freestandingRequired": { label: "프리스탠딩", format: yesNo },
  "refrigerator.budget": { label: "구매 예산", format: won },
  "vacuum.powerType": { label: "동력 방식", format: (value) => displayLabel(VACUUM_POWER_LABELS, value) },
  "vacuum.suctionStandard": { label: "흡입력 기준", format: (value) => displayLabel(VACUUM_SUCTION_LABELS, value) },
  "vacuum.replaceableBatteryRequired": { label: "교체형 배터리", format: yesNo },
  "vacuum.standingDockRequired": { label: "스탠드 충전 거치대", format: yesNo },
  "vacuum.hepaRequired": { label: "H13 이상 HEPA", format: yesNo },
  "vacuum.softRollerRequired": { label: "소프트 롤러", format: yesNo },
  "vacuum.weight": { label: "본체 중량", format: (value) => displayLabel(VACUUM_WEIGHT_LABELS, value) },
  "vacuum.budget": { label: "구매 예산", format: won },
};

export const formatSmartShoppingCriteria = (answers: FlowAnswers) => Object.entries(answers).flatMap(([key, value]) => {
  const formatter = criteriaFormatters[key];
  const formattedValue = formatter?.format(value);
  return formatter && formattedValue ? [`${formatter.label}: ${formattedValue}`] : [];
});
