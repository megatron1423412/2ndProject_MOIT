import type { StartSection, SubCategory, SubCategoryId } from "../types/moit";

const applianceSubCategories: SubCategory[] = [
  {
    id: "air-conditioner",
    title: "에어컨",
    parentCategory: "appliances",
    kind: "product",
    description: "공간과 냉방 면적 기준 구매 진단",
    icon: "snowflake",
    iconPath: "/assets/icons/categories/ac_exact_transparent.png",
    chatTitle: "에어컨 구매 진단 챗봇",
  },
  {
    id: "tv",
    title: "TV",
    parentCategory: "appliances",
    kind: "product",
    description: "시청 거리와 화질 맞춤 진단",
    icon: "tv",
    iconPath: "/assets/icons/categories/tv_appliance_exact_transparent.png",
    chatTitle: "TV 구매 진단 챗봇",
  },
  {
    id: "refrigerator",
    title: "냉장고",
    parentCategory: "appliances",
    kind: "product",
    description: "가족 수와 용량별 가성비 비교",
    icon: "refrigerator",
    iconPath: "/assets/icons/categories/fridge_exact_transparent.png",
    chatTitle: "냉장고 구매 진단 챗봇",
  },
  {
    id: "vacuum",
    title: "청소기",
    parentCategory: "appliances",
    kind: "product",
    description: "무선·로봇·유선 타입별 추천",
    icon: "vacuum",
    iconPath: "/assets/icons/categories/vacuum_wired_updated.png",
    chatTitle: "청소기 구매 진단 챗봇",
  },
];

const telecomSubCategories: SubCategory[] = [
  {
    id: "phone",
    title: "폰",
    parentCategory: "telecom",
    kind: "living",
    description: "월요금과 데이터 절감 가능성 계산",
    icon: "phone",
    iconPath: "/assets/icons/categories/phone_50percent_final.png",
    chatTitle: "휴대폰 요금제 진단 챗봇",
  },
  {
    id: "internet",
    title: "인터넷",
    parentCategory: "telecom",
    kind: "living",
    description: "속도 대비 요금 최적화 점검",
    icon: "internet",
    iconPath: "/assets/icons/categories/internet_exact_transparent.png",
    chatTitle: "인터넷 요금/속도 진단 챗봇",
  },
  {
    id: "iptv",
    title: "TV·IPTV",
    parentCategory: "telecom",
    kind: "living",
    description: "시청 채널 기준 요금 다이어트",
    icon: "tv",
    iconPath: "/assets/icons/categories/tv_telecom_exact_transparent.png",
    chatTitle: "IPTV 요금/채널 진단 챗봇",
  },
  {
    id: "bundle",
    title: "결합 상품",
    parentCategory: "telecom",
    kind: "living",
    description: "유무선 결합 할인 최대화 진단",
    icon: "bundle",
    iconPath: "/assets/icons/categories/bundle_exact_transparent.png",
    chatTitle: "유무선 결합상품 진단 챗봇",
  },
];

export const START_SECTIONS: StartSection[] = [
  {
    id: "smart-spending",
    title: "똑똑한 소비",
    description: "가격, 리뷰, 시세를 따져보고 현명하게 구매하세요.",
    middleCategories: [
      {
        id: "appliances",
        title: "가전제품",
        parentSection: "smart-spending",
        description: "큰돈 드는 생활 가전을 돈값 기준으로 비교해요.",
        icon: "appliance",
        iconPath: "/assets/icons/categories/appliances.svg",
        subCategories: applianceSubCategories,
      },
    ],
  },
  {
    id: "living-cost",
    title: "생활비 진단",
    description: "매달 나가는 고정 지출에서 줄일 수 있는 금액을 찾아요.",
    middleCategories: [
      {
        id: "telecom",
        title: "통신비",
        parentSection: "living-cost",
        description: "폰, 인터넷, IPTV 결합 할인을 함께 점검해요.",
        icon: "telecom",
        iconPath: "/assets/icons/categories/telecom.svg",
        subCategories: telecomSubCategories,
      },
    ],
  },
];

export const SUB_CATEGORIES = START_SECTIONS.flatMap((section) =>
  section.middleCategories.flatMap((category) => category.subCategories),
);

export const getSubCategoryById = (id: SubCategoryId) =>
  SUB_CATEGORIES.find((item) => item.id === id);