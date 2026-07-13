export const IPTV_MOCK_RESULT = {
  title: "TV·IPTV 요금/채널 mock 진단",
  summary: "실제 시청 빈도와 필수 장르를 기준으로 채널팩 축소 가능성을 확인했어요.",
  highlights: ["꼭 보는 장르 중심으로 채널팩 비교", "OTT와 중복되는 콘텐츠 비용 확인"],
  warnings: ["스포츠·키즈·해외 채널은 하위 상품에서 제외될 수 있어요."],
  recommendedActions: ["현재 채널팩 명칭 확인", "셋톱박스 임대료와 OTT 중복 비용 계산"],
};

export interface IptvPlan {
  id: string;
  carrier: string;
  name: string;
  price: number;
  channels: number;
}

export const mockIptvPlans: IptvPlan[] = [
  { id: "iptv-sk-std", carrier: "SKT", name: "Btv 스탠다드", price: 15400, channels: 220 },
  { id: "iptv-sk-all", carrier: "SKT", name: "Btv All", price: 19800, channels: 252 },
  { id: "iptv-kt-lite", carrier: "KT", name: "지니TV 슬림", price: 12100, channels: 180 },
  { id: "iptv-kt-std", carrier: "KT", name: "지니TV 베이직", price: 16500, channels: 236 },
  { id: "iptv-lg-std", carrier: "LGU+", name: "U+tv 프리미엄 Lite", price: 14300, channels: 211 },
  { id: "iptv-lg-all", carrier: "LGU+", name: "U+tv 프리미엄", price: 18700, channels: 254 },
];

export const calculateIptvGrade = (
  currentPrice: number,
  selectedPrice: number,
  hasRequiredGenres: boolean
) => {
  const netBenefit = currentPrice - selectedPrice;
  let grade = "C";
  let message = "";

  if (netBenefit > 5000) {
    grade = "A";
    message = "필수 장르를 모두 챙기면서도 매달 큰 요금 절감 혜택을 누리시는 최적의 합리적인 선택입니다!";
  } else if (netBenefit >= 0) {
    grade = "B";
    message = "기존 요금을 초과하지 않는 범위 내에서 보고 싶은 채널 구성을 잘 유지하셨습니다. 준수한 소비 패턴입니다.";
  } else {
    grade = "D";
    message = "원하시는 채널팩 업그레이드로 인해 요금이 다소 인상되었습니다. OTT와의 중복 구독료가 없는지 확인해 보세요.";
  }

  return {
    grade,
    netBenefit,
    message,
  };
};
