export type DiagnosisGroup = "smart-spending" | "living-cost";
export type DiagnosisKind = "product" | "living";
export type HistoryStatus = "완료" | "진행 중" | "다시 확인 필요";

export interface DiagnosisItem {
  id: string;
  title: string;
  group: DiagnosisGroup;
  kind: DiagnosisKind;
  description: string;
  chatTitle: string;
  initialMessage: string;
  quickReplies: string[];
  result: ProductDiagnosisResult | LivingCostDiagnosisResult;
}

export interface ProductDiagnosisResult {
  type: "product";
  headline: string;
  valueGrade: string;
  fairPrice: string;
  marketSignal: string;
  reviewSignal: string;
  fitSignal: string;
  nextChecks: string[];
}

export interface LivingCostDiagnosisResult {
  type: "living";
  headline: string;
  monthlySavings: number;
  yearlySavings: number;
  grade: string;
  checks: string[];
  caution: string;
}

export interface CategorySectionData {
  id: DiagnosisGroup;
  title: string;
  description: string;
  items: DiagnosisItem[];
}

export interface ConversationHistoryItem {
  id: string;
  title: string;
  category: string;
  lastDate: string;
  summary: string;
  status: HistoryStatus;
}

const productResult = (
  headline: string,
  valueGrade: string,
  fairPrice: string,
  marketSignal: string,
  reviewSignal: string,
  fitSignal: string,
  nextChecks: string[],
): ProductDiagnosisResult => ({
  type: "product",
  headline,
  valueGrade,
  fairPrice,
  marketSignal,
  reviewSignal,
  fitSignal,
  nextChecks,
});

const livingResult = (
  headline: string,
  monthlySavings: number,
  grade: string,
  checks: string[],
  caution: string,
): LivingCostDiagnosisResult => ({
  type: "living",
  headline,
  monthlySavings,
  yearlySavings: monthlySavings * 12,
  grade,
  checks,
  caution,
});

export const DIAGNOSIS_ITEMS: DiagnosisItem[] = [
  {
    id: "air-conditioner",
    title: "에어컨",
    group: "smart-spending",
    kind: "product",
    description: "설치 공간, 냉방 면적, 전기료까지 반영한 구매 진단",
    chatTitle: "에어컨 구매 진단 챗봇",
    initialMessage:
      "에어컨 구매 진단을 시작할게요. 설치 공간, 예산, 냉방 면적을 알려주시면 돈값 기준으로 골라드릴게요.",
    quickReplies: ["20평대 거실", "예산 150만원", "전기료가 걱정돼요"],
    result: productResult(
      "인버터 1등급 스탠드형이 현재 조건에서 돈값 균형이 좋아요.",
      "A",
      "적정가 135만~165만원",
      "성수기 직전이라 설치비 포함가와 기본 배관 조건 확인이 중요해요.",
      "냉방 속도와 소음 평가는 좋지만, 설치 기사 만족도 편차가 있어요.",
      "거실 20평대라면 17형 이상, 확장형 구조면 한 단계 위 용량을 권해요.",
      ["실외기 설치 위치 확인", "기본 설치비 포함 여부 확인", "에너지효율 1등급 환급 조건 확인"],
    ),
  },
  {
    id: "tv",
    title: "TV",
    group: "smart-spending",
    kind: "product",
    description: "시청 거리, OTT, 게임 사용성을 기준으로 화면 스펙 최적화",
    chatTitle: "TV 구매 진단 챗봇",
    initialMessage:
      "TV 구매를 도와드릴게요. 화면 크기, 시청 거리, OTT/게임 사용 여부를 기준으로 가성비를 판단해볼게요.",
    quickReplies: ["거실 시청거리 2.5m", "OTT 많이 봐요", "콘솔 게임도 해요"],
    result: productResult(
      "65인치 QLED급이 화면 크기와 가격 균형이 가장 좋아 보여요.",
      "A-",
      "적정가 90만~130만원",
      "대형 TV는 행사 주기가 잦아서 카드 청구할인 포함 실구매가를 봐야 해요.",
      "패널 밝기와 OS 반응성 평점은 높은 편이고, 사운드는 사운드바 보완 여지가 있어요.",
      "OTT 중심이면 고급형보다 앱 안정성과 리모컨 사용성이 체감 만족도를 좌우해요.",
      ["HDMI 2.1 필요 여부 확인", "벽걸이 설치비 확인", "주요 OTT 앱 지원 확인"],
    ),
  },
  {
    id: "refrigerator",
    title: "냉장고",
    group: "smart-spending",
    kind: "product",
    description: "가족 수, 용량, 설치 폭, 전기료를 같이 비교",
    chatTitle: "냉장고 구매 진단 챗봇",
    initialMessage:
      "냉장고 구매 진단을 시작할게요. 가족 수, 용량, 설치 공간, 에너지 효율을 기준으로 비교해드릴게요.",
    quickReplies: ["3인 가족", "800L 이상", "설치 폭이 좁아요"],
    result: productResult(
      "800L대 4도어 중 에너지 효율 좋은 모델을 우선 비교해볼 만해요.",
      "B+",
      "적정가 160만~210만원",
      "상위 라인은 기능 프리미엄이 커서 실제 사용 패턴과 가격 차이를 나눠 봐야 해요.",
      "수납 만족도는 높지만 문 열림 공간과 소음 후기가 갈리는 모델이 있어요.",
      "가족 수 대비 넉넉한 용량이지만, 설치 폭과 문 개폐 반경 확인이 먼저예요.",
      ["설치 공간 실측", "연간 전기요금 비교", "정수/제빙 기능 실제 필요성 확인"],
    ),
  },
  {
    id: "vacuum",
    title: "청소기",
    group: "smart-spending",
    kind: "product",
    description: "무선, 로봇, 유선 선호와 집 구조를 바탕으로 추천",
    chatTitle: "청소기 구매 진단 챗봇",
    initialMessage:
      "청소기 구매를 도와드릴게요. 무선/로봇/유선 선호와 집 구조를 알려주시면 돈값 기준으로 추천해드릴게요.",
    quickReplies: ["무선이 좋아요", "반려동물 털이 많아요", "30평대 아파트"],
    result: productResult(
      "흡입력보다 브러시 관리와 배터리 교체 비용까지 보는 편이 유리해요.",
      "A-",
      "적정가 45만~75만원",
      "프리미엄 모델은 할인 폭이 커서 출시가보다 실판매가 기준 비교가 필요해요.",
      "흡입력 평점은 높고 먼지통 비움, 무게 피로도에서 체감 차이가 커요.",
      "반려동물 털이 많다면 물걸레보다 엉킴 방지 브러시가 우선이에요.",
      ["배터리 교체 가격 확인", "브러시 세척 난이도 확인", "AS 센터 접근성 확인"],
    ),
  },
  {
    id: "phone",
    title: "폰",
    group: "living-cost",
    kind: "living",
    description: "현재 통신사, 월요금, 데이터 사용량으로 요금제 진단",
    chatTitle: "휴대폰 요금제 진단 챗봇",
    initialMessage:
      "휴대폰 요금제 진단을 시작할게요. 현재 통신사, 월요금, 데이터 사용량을 알려주시면 절약 가능성을 계산해볼게요.",
    quickReplies: ["월 8만원대", "데이터 20GB 이하", "알뜰폰도 괜찮아요"],
    result: livingResult(
      "데이터 사용량이 20GB 이하라면 중간 요금제나 알뜰폰 전환 여지가 커요.",
      26000,
      "절감 가능성 높음",
      ["최근 3개월 데이터 사용량", "선택약정 남은 기간", "가족 결합 할인 유지 여부"],
      "단말기 할부와 약정 위약금은 실제 전환 전에 꼭 확인해야 해요.",
    ),
  },
  {
    id: "internet",
    title: "인터넷",
    group: "living-cost",
    kind: "living",
    description: "속도, 월요금, 가족 사용 패턴으로 낮춰도 되는지 판단",
    chatTitle: "인터넷 요금/속도 진단 챗봇",
    initialMessage:
      "인터넷 요금 진단을 시작할게요. 현재 속도, 월요금, 가족 사용 패턴을 기준으로 낮춰도 되는지 판단해볼게요.",
    quickReplies: ["500Mbps 사용 중", "월 3만원대", "재택근무가 있어요"],
    result: livingResult(
      "동시 접속이 많지 않다면 1Gbps에서 500Mbps로 낮춰도 체감 손실이 작을 수 있어요.",
      9000,
      "부분 절감 가능",
      ["현재 속도 측정 결과", "공유기 성능", "약정 만료일"],
      "재택근무나 대용량 업로드가 잦다면 속도 하향은 신중히 봐야 해요.",
    ),
  },
  {
    id: "iptv",
    title: "TV·IPTV",
    group: "living-cost",
    kind: "living",
    description: "요금, 채널 수, 꼭 보는 채널 기준으로 상품 축소 검토",
    chatTitle: "IPTV 요금/채널 진단 챗봇",
    initialMessage:
      "IPTV 진단을 시작할게요. 현재 요금, 채널 수, 꼭 보는 채널을 기준으로 줄여도 괜찮은지 계산해볼게요.",
    quickReplies: ["스포츠 채널 필요", "월 1.8만원", "OTT를 더 많이 봐요"],
    result: livingResult(
      "OTT 사용이 더 많다면 IPTV 채널팩을 낮추거나 유지 필요 채널만 확인해도 좋아요.",
      7000,
      "소폭 절감 가능",
      ["꼭 보는 유료 채널", "셋톱박스 임대료", "OTT 중복 이용 여부"],
      "스포츠, 키즈, 해외 채널은 하위 상품에서 빠질 수 있어 채널표 확인이 필요해요.",
    ),
  },
  {
    id: "bundle",
    title: "결합 상품",
    group: "living-cost",
    kind: "living",
    description: "휴대폰 회선, 인터넷/IPTV, 기존 결합 할인을 한 번에 비교",
    chatTitle: "유무선 결합상품 진단 챗봇",
    initialMessage:
      "유무선 결합상품 진단을 시작할게요. 휴대폰 회선 수, 인터넷/IPTV 사용 여부, 기존 결합 할인을 기준으로 바꿀 가치가 있는지 살펴볼게요.",
    quickReplies: ["휴대폰 3회선", "인터넷+IPTV 사용", "약정 만료 예정"],
    result: livingResult(
      "회선 수가 3개 이상이면 결합 재설계만으로 월 절감액이 꽤 커질 수 있어요.",
      33000,
      "절감 가능성 매우 높음",
      ["가족 회선 통신사", "인터넷 약정 만료일", "현재 결합 할인액"],
      "번호이동과 재약정 혜택은 시점별 차이가 커서 조건 비교가 필요해요.",
    ),
  },
];

export const CATEGORY_SECTIONS: CategorySectionData[] = [
  {
    id: "smart-spending",
    title: "똑똑한 소비",
    description: "가전제품 구매 전에 가격, 리뷰, 평점, 시세, 사용 목적을 함께 따져봐요.",
    items: DIAGNOSIS_ITEMS.filter((item) => item.group === "smart-spending"),
  },
  {
    id: "living-cost",
    title: "생활비 진단",
    description: "통신비 중심의 고정 지출을 점검하고 줄일 수 있는 금액을 찾아봐요.",
    items: DIAGNOSIS_ITEMS.filter((item) => item.group === "living-cost"),
  },
];

export const CONVERSATION_HISTORY: ConversationHistoryItem[] = [
  {
    id: "history-aircon",
    title: "거실 에어컨 구매 진단",
    category: "똑똑한 소비 · 에어컨",
    lastDate: "2026.07.08",
    summary: "설치비 포함 150만원대 인버터 1등급 모델 우선 검토",
    status: "완료",
  },
  {
    id: "history-phone",
    title: "휴대폰 요금제 절감",
    category: "생활비 진단 · 폰",
    lastDate: "2026.07.05",
    summary: "월 26,000원 절감 가능, 선택약정 잔여 기간 확인 필요",
    status: "다시 확인 필요",
  },
  {
    id: "history-tv",
    title: "65인치 TV 구매 비교",
    category: "똑똑한 소비 · TV",
    lastDate: "2026.07.02",
    summary: "OTT 중심 사용 기준 QLED급 가성비 모델 추천",
    status: "진행 중",
  },
  {
    id: "history-bundle",
    title: "가족 결합상품 재설계",
    category: "생활비 진단 · 결합 상품",
    lastDate: "2026.06.29",
    summary: "휴대폰 3회선 기준 월 33,000원 절감 후보 발견",
    status: "완료",
  },
];
