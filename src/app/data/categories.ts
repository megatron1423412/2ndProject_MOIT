import type { StartSection, SubCategory, SubCategoryId } from "../types/moit";

const applianceSubCategories: SubCategory[] = [
  {
    id: "air-conditioner",
    title: "에어컨",
    parentCategory: "appliances",
    kind: "product",
    description: "설치 공간, 예산, 냉방 면적을 기준으로 구매 적정성을 봐요.",
    icon: "snowflake",
    iconPath: "/assets/icons/categories/air-conditioner.svg",
    chatTitle: "에어컨 구매 진단 챗봇",
    initialMessage:
      "에어컨 구매 진단을 시작할게요. 설치 공간, 예산, 냉방 면적을 알려주시면 돈값 기준으로 골라드릴게요.",
    quickReplies: ["20평대 거실", "예산 150만원", "전기료가 걱정돼요"],
  },
  {
    id: "tv",
    title: "TV",
    parentCategory: "appliances",
    kind: "product",
    description: "화면 크기, 시청 거리, OTT/게임 사용성을 같이 판단해요.",
    icon: "tv",
    iconPath: "/assets/icons/categories/tv.svg",
    chatTitle: "TV 구매 진단 챗봇",
    initialMessage:
      "TV 구매를 도와드릴게요. 화면 크기, 시청 거리, OTT/게임 사용 여부를 기준으로 가성비를 판단해볼게요.",
    quickReplies: ["거실 시청거리 2.5m", "OTT 많이 봐요", "콘솔 게임도 해요"],
  },
  {
    id: "refrigerator",
    title: "냉장고",
    parentCategory: "appliances",
    kind: "product",
    description: "가족 수, 용량, 설치 공간, 에너지 효율을 비교해요.",
    icon: "refrigerator",
    iconPath: "/assets/icons/categories/refrigerator.svg",
    chatTitle: "냉장고 구매 진단 챗봇",
    initialMessage:
      "냉장고 구매 진단을 시작할게요. 가족 수, 용량, 설치 공간, 에너지 효율을 기준으로 비교해드릴게요.",
    quickReplies: ["3인 가족", "800L 이상", "설치 폭이 좁아요"],
  },
  {
    id: "vacuum",
    title: "청소기",
    parentCategory: "appliances",
    kind: "product",
    description: "무선/로봇/유선 선호와 집 구조를 기준으로 추천해요.",
    icon: "vacuum",
    iconPath: "/assets/icons/categories/vacuum.svg",
    chatTitle: "청소기 구매 진단 챗봇",
    initialMessage:
      "청소기 구매를 도와드릴게요. 무선/로봇/유선 선호와 집 구조를 알려주시면 돈값 기준으로 추천해드릴게요.",
    quickReplies: ["무선이 좋아요", "반려동물 털이 많아요", "30평대 아파트"],
  },
];

const telecomSubCategories: SubCategory[] = [
  {
    id: "phone",
    title: "폰",
    parentCategory: "telecom",
    kind: "living",
    description: "통신사, 월요금, 데이터 사용량으로 절감 가능성을 계산해요.",
    icon: "phone",
    iconPath: "/assets/icons/categories/phone.svg",
    chatTitle: "휴대폰 요금제 진단 챗봇",
    initialMessage:
      "휴대폰 요금제 진단을 시작할게요. 현재 통신사, 월요금, 데이터 사용량을 알려주시면 절약 가능성을 계산해볼게요.",
    quickReplies: ["월 8만원대", "데이터 20GB 이하", "알뜰폰도 괜찮아요"],
  },
  {
    id: "internet",
    title: "인터넷",
    parentCategory: "telecom",
    kind: "living",
    description: "속도, 월요금, 가족 사용 패턴으로 낮춰도 되는지 봐요.",
    icon: "internet",
    iconPath: "/assets/icons/categories/internet.svg",
    chatTitle: "인터넷 요금/속도 진단 챗봇",
    initialMessage:
      "인터넷 요금 진단을 시작할게요. 현재 속도, 월요금, 가족 사용 패턴을 기준으로 낮춰도 되는지 판단해볼게요.",
    quickReplies: ["500Mbps 사용 중", "월 3만원대", "재택근무가 있어요"],
  },
  {
    id: "iptv",
    title: "TV·IPTV",
    parentCategory: "telecom",
    kind: "living",
    description: "요금, 채널 수, 꼭 보는 채널 기준으로 축소 여부를 봐요.",
    icon: "tv",
    iconPath: "/assets/icons/categories/iptv.svg",
    chatTitle: "IPTV 요금/채널 진단 챗봇",
    initialMessage:
      "IPTV 진단을 시작할게요. 현재 요금, 채널 수, 꼭 보는 채널을 기준으로 줄여도 괜찮은지 계산해볼게요.",
    quickReplies: ["스포츠 채널 필요", "월 1.8만원", "OTT를 더 많이 봐요"],
  },
  {
    id: "bundle",
    title: "결합 상품",
    parentCategory: "telecom",
    kind: "living",
    description: "휴대폰 회선, 인터넷/IPTV, 기존 결합 할인을 비교해요.",
    icon: "bundle",
    iconPath: "/assets/icons/categories/bundle.svg",
    chatTitle: "유무선 결합상품 진단 챗봇",
    initialMessage:
      "유무선 결합상품 진단을 시작할게요. 휴대폰 회선 수, 인터넷/IPTV 사용 여부, 기존 결합 할인을 기준으로 바꿀 가치가 있는지 살펴볼게요.",
    quickReplies: ["휴대폰 3회선", "인터넷+IPTV 사용", "약정 만료 예정"],
  },
];

export const START_SECTIONS: StartSection[] = [
  {
    id: "smart-spending",
    title: "똑똑한 소비",
    description: "구매 전에 가격, 리뷰, 평점, 시세, 사용 목적을 함께 따져봐요.",
    middleCategories: [
      {
        id: "appliances",
        title: "가전제품",
        parentSection: "smart-spending",
        description: "큰돈이 들어가는 생활 가전을 돈값 기준으로 비교해요.",
        icon: "appliance",
        iconPath: "/assets/icons/categories/appliances.svg",
        subCategories: applianceSubCategories,
      },
    ],
  },
  {
    id: "living-cost",
    title: "생활비 진단",
    description: "매달 빠져나가는 고정 지출에서 줄일 수 있는 금액을 찾아봐요.",
    middleCategories: [
      {
        id: "telecom",
        title: "통신비",
        parentSection: "living-cost",
        description: "폰, 인터넷, IPTV, 결합 할인을 한 흐름에서 점검해요.",
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
