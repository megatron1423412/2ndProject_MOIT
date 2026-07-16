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

export const TV_OS_LABELS: Record<string, string> = {
  "android-tv": "안드로이드 TV",
  "google-tv": "Google TV",
  either: "안드로이드 TV 또는 Google TV",
  any: "OS 상관없음",
};

export const TV_PANEL_LABELS: Record<string, string> = { ips: "IPS", va: "VA", any: "패널 상관없음" };
export const TV_RESOLUTION_LABELS: Record<string, string> = { "4k-uhd": "4K UHD", "full-hd": "Full HD" };
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

const criteriaFormatters: Record<string, { label: string; format: (value: unknown) => string }> = {
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
  "tv.os": { label: "TV OS", format: (value) => displayLabel(TV_OS_LABELS, value) },
  "tv.screenSize": { label: "화면 크기", format: (value) => numberWithUnit(value, "인치") },
  "tv.panel": { label: "패널", format: (value) => displayLabel(TV_PANEL_LABELS, value) },
  "tv.useDefaults": { label: "기본 화질·보증 기준", format: (value) => value === "yes" ? "적용" : "직접 선택" },
  "tv.fourKRequired": { label: "4K UHD", format: yesNo },
  "tv.minimumWarranty": { label: "최소 무상 보증", format: (value) => value === "any" ? "상관없음" : `${value}년 이상` },
  "tv.hdrRequired": { label: "HDR", format: yesNo },
  "tv.rebate": { label: "환급 대상", format: (value) => displayLabel({ required: "필수", preferred: "선호", any: "상관없음" }, value) },
  "tv.budget": { label: "구매 예산", format: won },
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
  return formatter ? [`${formatter.label}: ${formatter.format(value)}`] : [];
});
