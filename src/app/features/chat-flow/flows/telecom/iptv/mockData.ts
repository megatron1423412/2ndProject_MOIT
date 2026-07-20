// src/app/features/chat-flow/flows/telecom/iptv/mockData.ts
import type { FlowStep } from "../../../core/types";

export const IPTV_MOCK_RESULT = {
  title: "TV·IPTV 요금/채널 진단",
  summary: "실제 시청 빈도와 필수 장르를 기준으로 채널팩 축소 가능성을 확인했어요.",
  highlights: ["꼭 보는 장르 중심으로 채널팩 비교", "OTT와 중복되는 콘텐츠 비용 확인"],
  warnings: ["스포츠·키즈·해외 채널은 하위 상품에서 제외될 수 있어요."],
  recommendedActions: ["현재 채널팩 명칭 확인", "셋톱박스 임대료와 OTT 중복 비용 계산"],
};

export const carrierUrlMap: Record<string, string> = {
  dlive: "https://www.dlive.kr/front/product/digital/prdDigitalAction.do?method=prdDigHdpView#null",
  kt_genie: "https://product.kt.com/wDic/index.do?CateCode=6008",
  genie_skylife: "https://product.kt.com/wDic/index.do?CateCode=6008",
  kt_skylife: "https://www.skylife.co.kr/product/tv/all",
  kt_hcn: "https://www.hcn.co.kr/www/prod/ipcatv/ipcatv.jsp",
  sk_btv: "https://www.bworld.co.kr/product/btv/charge.do?menu_id=P03010000",
  hello_vision: "https://www.lghellovision.net/product/tv/tvPriceList.do?utm_source=Mobile_HP&utm_medium=GNB&utm_campaign=TV&utm_content=TV_page",
  lg_uplus: "https://www.lguplus.com/iptv/plan",
  cmb: "https://cable-tv.kr/?NaPm=ct%3Dmrjzx01k%7Cci%3DER986c5fdc%2D7f26%2D11f1%2D8110%2Dd6d09e6640e4%7Ctr%3Dsa%7Chk%3Dac903ce18cd9c71a0809eeb24de5655f3644d1ae%7Cnacn%3DKGIMBIhiH8Fw",
};

// 1. 통합 가격 인터페이스
export interface IptvPlanPrice {
  single: {
    "3years": number;
    "1year"?: number;
    "2years"?: number;
    "4years"?: number;
    none?: number;
  };
  onlineDiscount?: {
    "3years": number;
    "1year"?: number;
    "2years"?: number;
    "4years"?: number;
    none?: number;
  };
}

// 2. 통합 플랜 인터페이스
export interface IptvPlan {
  id: string;
  carrier:
  | "sk_btv"
  | "kt_genie"
  | "lg_uplus"
  | "dlive"
  | "kt_hcn"
  | "genie_skylife"
  | "kt_skylife"
  | "hello_vision"
  | "cmb";
  name: string;
  channels: number;
  prices: IptvPlanPrice;
  benefits?: string[];
  regions?: {
    [regionKey: string]: string[];
  };
}

// 3. 전체 IPTV & 케이블 통합 요금제 데이터
export const mockIptvPlans: IptvPlan[] = [
  // ==========================================
  // 3-1 [딜라이브] 공통 요금제
  // ==========================================
  {
    id: "dlive-hd-premium-plus",
    carrier: "dlive",
    name: "HD 프리미엄 플러스",
    channels: 240,
    prices: { single: { "3years": 33000, "2years": 35200, "1year": 37400, none: 44000 } },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "dlive-hd-premium",
    carrier: "dlive",
    name: "HD 프리미엄",
    channels: 230,
    prices: { single: { "3years": 26400, "2years": 28600, "1year": 30800, none: 36300 } },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "dlive-hd-family",
    carrier: "dlive",
    name: "HD 패밀리",
    channels: 210,
    prices: { single: { "3years": 18700, "2years": 20900, "1year": 22000, none: 26400 } },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "dlive-hd-economy",
    carrier: "dlive",
    name: "HD 이코노미",
    channels: 180,
    prices: { single: { "3years": 15400, "2years": 17600, "1year": 18700, none: 23100 } },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "dlive-digital-altteul-mandatory",
    carrier: "dlive",
    name: "디지털 알뜰 의무형",
    channels: 60,
    prices: { single: { "3years": 4400, "2years": 4400, "1year": 4400, none: 4400 } },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"],
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },

  // ==========================================
  // [딜라이브] 서울 전용 요금제
  // ==========================================
  {
    id: "dlive-seoul-digital-altteul-basic",
    carrier: "dlive",
    name: "디지털 알뜰 보급형(서울)",
    channels: 80,
    prices: { single: { "3years": 7480, "2years": 7920, "1year": 8360, none: 8800 } },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"]
    }
  },
  {
    id: "dlive-seoul-digital-altteul-basic-plus",
    carrier: "dlive",
    name: "디지털 알뜰 보급형플러스(서울)",
    channels: 100,
    prices: { single: { "3years": 7370, "2years": 7810, "1year": 8250, none: 8690 } },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"]
    }
  },
  {
    id: "dlive-seoul-digital-altteul-silsok",
    carrier: "dlive",
    name: "디지털 알뜰 실속형(서울)",
    channels: 120,
    prices: { single: { "3years": 9350, "2years": 9900, "1year": 10450, none: 11000 } },
    regions: {
      seoul: ["강남구", "강동구", "광진구", "구로구", "금천구", "노원구", "마포구", "서대문구", "성동구", "성북구", "송파구", "용산구", "종로구", "중구", "중랑구"]
    }
  },

  // ==========================================
  // [딜라이브] 경기 전용 요금제
  // ==========================================
  {
    id: "dlive-gyeonggi-digital-altteul-basic",
    carrier: "dlive",
    name: "디지털 알뜰 보급형(경기)",
    channels: 80,
    prices: { single: { "3years": 5610, "2years": 5940, "1year": 6270, none: 6600 } },
    regions: {
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "dlive-gyeonggi-digital-altteul-basic-plus",
    carrier: "dlive",
    name: "디지털 알뜰 보급형플러스(경기)",
    channels: 100,
    prices: { single: { "3years": 7480, "2years": 7920, "1year": 8360, none: 8800 } },
    regions: {
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },
  {
    id: "dlive-gyeonggi-digital-altteul-silsok",
    carrier: "dlive",
    name: "디지털 알뜰 실속형(경기)",
    channels: 120,
    prices: { single: { "3years": 11220, "2years": 11880, "1year": 12540, none: 13200 } },
    regions: {
      gyeonggi: ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "광주시", "구리시", "남양주시", "동두천시", "양주시", "양평군", "여주군", "여주시", "연천군", "의정부시", "파주시", "포천시", "하남시"]
    }
  },

  // ==========================================
  // 3-2 [KT 지니 TV] 요금제
  // ==========================================
  {
    id: "kt-genie-all-g",
    carrier: "kt_genie",
    name: "지니 TV 모든G",
    channels: 250,
    prices: { single: { "3years": 23540, "2years": 26180, "1year": 27500, none: 28930 } }
  },
  {
    id: "kt-genie-disney-all-g",
    carrier: "kt_genie",
    name: "지니 TV 디즈니+ 모든G",
    channels: 250,
    prices: { single: { "3years": 28100, "2years": 32340, "1year": 34430, none: 36630 } }
  },
  {
    id: "kt-genie-netflix-choice-uhd",
    carrier: "kt_genie",
    name: "지니 TV 넷플릭스 초이스 UHD",
    channels: 250,
    prices: { single: { "3years": 35480, "2years": 38890, "1year": 40540, none: 42300 } }
  },
  {
    id: "kt-genie-tving-choice-premium",
    carrier: "kt_genie",
    name: "지니 TV 티빙 초이스 프리미엄",
    channels: 250,
    prices: { single: { "3years": 35480, "2years": 38890, "1year": 40540, none: 42300 } }
  },
  {
    id: "kt-genie-youtube-premium-choice",
    carrier: "kt_genie",
    name: "지니 TV 유튜브 프리미엄 초이스",
    channels: 250,
    prices: { single: { "3years": 33180, "2years": 36690, "1year": 38390, none: 40200 } }
  },
  {
    id: "kt-genie-disney-choice-premium",
    carrier: "kt_genie",
    name: "지니 TV 디즈니+ 초이스 프리미엄",
    channels: 250,
    prices: { single: { "3years": 32480, "2years": 35900, "1year": 37550, none: 39200 } }
  },
  {
    id: "kt-genie-netflix-choice-hd",
    carrier: "kt_genie",
    name: "지니 TV 넷플릭스 초이스 HD",
    channels: 250,
    prices: { single: { "3years": 31980, "2years": 35390, "1year": 37040, none: 38800 } }
  },
  {
    id: "kt-genie-tving-choice-standard",
    carrier: "kt_genie",
    name: "지니 TV 티빙 초이스 스탠다드",
    channels: 250,
    prices: { single: { "3years": 31980, "2years": 35390, "1year": 37040, none: 38800 } }
  },
  {
    id: "kt-genie-disney-choice-standard",
    carrier: "kt_genie",
    name: "지니 TV 디즈니+ 초이스 스탠다드",
    channels: 250,
    prices: { single: { "3years": 29480, "2years": 32340, "1year": 33770, none: 35200 } }
  },
  {
    id: "kt-genie-superpack-choice",
    carrier: "kt_genie",
    name: "지니 TV 슈퍼팩 초이스",
    channels: 250,
    prices: { single: { "3years": 29480, "2years": 32890, "1year": 34540, none: 36300 } }
  },
  {
    id: "kt-genie-kidsland-choice",
    carrier: "kt_genie",
    name: "지니 TV 키즈랜드팩 초이스",
    channels: 250,
    prices: { single: { "3years": 24816, "2years": 27918, "1year": 29469, none: 31020 } }
  },
  {
    id: "kt-genie-vod-choice",
    carrier: "kt_genie",
    name: "지니 TV VOD초이스",
    channels: 250,
    prices: { single: { "3years": 24816, "2years": 27918, "1year": 29469, none: 31020 } }
  },
  {
    id: "kt-genie-muse-choice",
    carrier: "kt_genie",
    name: "지니 TV 뮤즈 초이스",
    channels: 250,
    prices: { single: { "3years": 25080, "2years": 29810, "1year": 32175, none: 34540 } }
  },
  {
    id: "kt-genie-essence-plus",
    carrier: "kt_genie",
    name: "지니 TV 에센스플러스",
    channels: 260,
    prices: { single: { "3years": 22484, "2years": 25300, "1year": 26730, none: 28160 } }
  },
  {
    id: "kt-genie-vod-plus",
    carrier: "kt_genie",
    name: "지니 TV VOD플러스",
    channels: 230,
    prices: { single: { "3years": 23980, "2years": 26510, "1year": 27775, none: 29150 } }
  },
  {
    id: "kt-genie-essence",
    carrier: "kt_genie",
    name: "지니 TV 에센스",
    channels: 260,
    prices: { single: { "3years": 20240, "2years": 22770, "1year": 24035, none: 25300 } }
  },
  {
    id: "kt-genie-lite",
    carrier: "kt_genie",
    name: "지니 TV 라이트",
    channels: 240,
    prices: { single: { "3years": 15840, "2years": 17820, "1year": 18810, none: 19800 } }
  },
  {
    id: "kt-genie-basic",
    carrier: "kt_genie",
    name: "지니 TV 베이직",
    channels: 230,
    prices: { single: { "3years": 14740, "2years": 16390, "1year": 17270, none: 18150 } }
  },
  {
    id: "kt-genie-choice-type",
    carrier: "kt_genie",
    name: "지니 TV 선택형",
    channels: 120,
    prices: { single: { "3years": 8800, "2years": 9900, "1year": 10450, none: 11000 } }
  },
  {
    id: "kt-genie-education",
    carrier: "kt_genie",
    name: "지니 TV 교육형",
    channels: 80,
    prices: { single: { "3years": 8800, "2years": 9900, "1year": 10450, none: 11000 } }
  },

  // ==========================================
  // 3-3 [지니 TV 스카이라이프] 요금제
  // ==========================================
  {
    id: "skylife-enter",
    carrier: "genie_skylife",
    name: "지니 TV 스카이라이프 엔터",
    channels: 220,
    prices: { single: { "3years": 24816, "2years": 27918, "1year": 29469, none: 31020 } }
  },
  {
    id: "skylife-kids",
    carrier: "genie_skylife",
    name: "지니 TV 스카이라이프 키즈",
    channels: 220,
    prices: { single: { "3years": 24816, "2years": 27918, "1year": 29469, none: 31020 } }
  },
  {
    id: "skylife-essence",
    carrier: "genie_skylife",
    name: "지니 TV 스카이라이프 에센스",
    channels: 220,
    prices: { single: { "3years": 20240, "2years": 22770, "1year": 24035, none: 25300 } }
  },
  {
    id: "skylife-lite",
    carrier: "genie_skylife",
    name: "지니 TV 스카이라이프 라이트",
    channels: 220,
    prices: { single: { "3years": 15840, "2years": 17820, "1year": 18810, none: 19800 } }
  },
  {
    id: "skylife-basic",
    carrier: "genie_skylife",
    name: "지니 TV 스카이라이프 베이직",
    channels: 210,
    prices: { single: { "3years": 14740, "2years": 16390, "1year": 17270, none: 18150 } }
  },

  // ==========================================
  // 3-4 [KT 스카이라이프] 요금제
  // ==========================================
  {
    id: "kt-skylife-basic",
    carrier: "kt_skylife",
    name: "베이직",
    channels: 194,
    prices: { single: { "3years": 6050, "2years": 0, "1year": 0 } },
    benefits: ["넷플릭스, 디즈니 등 OTT 7종 제휴", "※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "kt-skylife-plus",
    carrier: "kt_skylife",
    name: "플러스",
    channels: 209,
    prices: { single: { "3years": 6600, "2years": 0, "1year": 0 } },
    benefits: ["넷플릭스, 디즈니 등 OTT 7종 제휴", "※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "kt-skylife-all",
    carrier: "kt_skylife",
    name: "ALL",
    channels: 241,
    prices: { single: { "3years": 12100, "2years": 0, "1year": 0 } },
    benefits: ["※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "kt-skylife-auto-basic",
    carrier: "kt_skylife",
    name: "Auto 기본형",
    channels: 47,
    prices: { single: { "3years": 16500, "2years": 0, "1year": 0 } },
    benefits: ["※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "kt-skylife-auto-advanced",
    carrier: "kt_skylife",
    name: "Auto 고급형",
    channels: 47,
    prices: { single: { "3years": 26500, "2years": 0, "1year": 0 } },
    benefits: ["※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "kt-skylife-auto-premium",
    carrier: "kt_skylife",
    name: "Auto 프리미엄",
    channels: 47,
    prices: { single: { "3years": 44400, "2years": 0, "1year": 0 } },
    benefits: ["※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "kt-skylife-m",
    carrier: "kt_skylife",
    name: "M",
    channels: 244,
    prices: { single: { "3years": 8800, "2years": 0, "1year": 0 } },
    benefits: ["※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },

  // ==========================================
  // 3-5 [KT HCN IPTV] 요금제
  // ==========================================
  {
    id: "hcn-premium",
    carrier: "kt_hcn",
    name: "KT HCN IPTV 프리미엄",
    channels: 224,
    prices: { single: { "3years": 14300, "2years": 16500, "1year": 19250, none: 24310 } }
  },
  {
    id: "hcn-lite",
    carrier: "kt_hcn",
    name: "KT HCN IPTV 라이트",
    channels: 209,
    prices: { single: { "3years": 13200, "2years": 15400, "1year": 18150, none: 23210 } }
  },

  // ==========================================
  // 3-6 [B tv] 요금제
  // ==========================================
  {
    id: "sk-btv-plus-max",
    carrier: "sk_btv",
    name: "B tv+ max",
    channels: 257,
    prices: { single: { "3years": 25300, "2years": 33550, "1year": 40700, none: 45540 } }
  },
  {
    id: "sk-btv-all-plus",
    carrier: "sk_btv",
    name: "B tv All+",
    channels: 257,
    prices: { single: { "3years": 24200, "2years": 29700, "1year": 35200, none: 39490 } }
  },
  {
    id: "sk-btv-standard-plus",
    carrier: "sk_btv",
    name: "B tv 스탠다드+",
    channels: 223,
    prices: { single: { "3years": 23100, "2years": 28600, "1year": 33000, none: 36190 } }
  },
  {
    id: "sk-btv-all-netflix-premium",
    carrier: "sk_btv",
    name: "B tv All 넷플릭스 프리미엄",
    channels: 257,
    prices: { single: { "3years": 33200, "2years": 37100, "1year": 40550, none: 42300 } }
  },
  {
    id: "sk-btv-all-netflix-standard",
    carrier: "sk_btv",
    name: "B tv All 넷플릭스",
    channels: 257,
    prices: { single: { "3years": 30200, "2years": 34100, "1year": 37050, none: 38800 } }
  },
  {
    id: "sk-btv-all",
    carrier: "sk_btv",
    name: "B tv All",
    channels: 257,
    prices: { single: { "3years": 18700, "2years": 22000, "1year": 24200, none: 25300 } }
  },
  {
    id: "sk-btv-standard",
    carrier: "sk_btv",
    name: "B tv 스탠다드",
    channels: 223,
    prices: { single: { "3years": 15400, "2years": 18700, "1year": 20900, none: 22000 } }
  },
  {
    id: "sk-btv-economy",
    carrier: "sk_btv",
    name: "B tv 이코노미",
    channels: 184,
    prices: { single: { "3years": 12100, "2years": 15400, "1year": 17600, none: 18700 } }
  },

  // ==========================================
  // 3-7 [LG헬로비전] 요금제
  // ==========================================
  {
    id: "hellovision-hello-tv-all-channels",
    carrier: "hello_vision",
    name: "헬로tv (골프/스포츠까지 더 한 모든 채널TV)",
    channels: 247,
    prices: { single: { "3years": 15400, "2years": 0, "1year": 0 } },
    benefits: ["※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "hellovision-hello-tv-all",
    carrier: "hello_vision",
    name: "헬로tv (골프/스포츠까지 더 한 모든 채널)",
    channels: 247,
    prices: { single: { "3years": 13200, "2years": 0, "1year": 0 } },
    benefits: ["※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "hellovision-hello-tv-basic",
    carrier: "hello_vision",
    name: "헬로tv (지상파/종편 등 실속 기본 채널)",
    channels: 108,
    prices: { single: { "3years": 8800, "2years": 0, "1year": 0 } },
    benefits: ["※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "hellovision-hello-tv-pro-249",
    carrier: "hello_vision",
    name: "헬로tv Pro (249채널)",
    channels: 249,
    prices: { single: { "3years": 13200, "2years": 0, "1year": 0 } },
    benefits: ["헬로tv Pro 상품은 인터넷과 신규 결합시 또는 기존 인터넷 가입자에 한해 가입 가능합니다.", "※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },
  {
    id: "hellovision-hello-tv-pro-222",
    carrier: "hello_vision",
    name: "헬로tv Pro (222채널)",
    channels: 222,
    prices: { single: { "3years": 11000, "2years": 0, "1year": 0 } },
    benefits: ["헬로tv Pro 상품은 인터넷과 신규 결합시 또는 기존 인터넷 가입자에 한해 가입 가능합니다.", "※ 부가세 포함, 3년 약정, 임대료 별도 기준"]
  },

  // ==========================================
  // 3-8 LG U+ IPTV 요금제
  // ==========================================
  {
    id: "lg-uplus-sil-sok",
    carrier: "lg_uplus",
    name: "실속형",
    channels: 217,
    prices: {
      single: { "3years": 15400, "2years": 18700, "1year": 20900 },
      onlineDiscount: { "3years": 14630, "2years": 18315, "1year": 20707 }
    },
    benefits: ["아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-basic",
    carrier: "lg_uplus",
    name: "기본형",
    channels: 223,
    prices: {
      single: { "3years": 16500, "2years": 19800, "1year": 22000 },
      onlineDiscount: { "3years": 15730, "2years": 19415, "1year": 21807 }
    },
    benefits: ["아이들나라 모바일앱 무료", "프리미엄 클럽 +Pack"]
  },
  {
    id: "lg-uplus-premium",
    carrier: "lg_uplus",
    name: "프리미엄",
    channels: 252,
    prices: {
      single: { "3years": 18700, "2years": 19800, "1year": 20900 },
      onlineDiscount: { "3years": 17600, "2years": 19250, "1year": 20625 }
    },
    benefits: ["아이들나라 모바일앱 무료", "프리미엄 클럽 +Pack"]
  },
  {
    id: "lg-uplus-basic-pass",
    carrier: "lg_uplus",
    name: "기본형 방송패스",
    channels: 222,
    prices: {
      single: { "3years": 22000, "2years": 25300, "1year": 27500 },
      onlineDiscount: { "3years": 21230, "2years": 24915, "1year": 27307 }
    },
    benefits: ["지상파/JTBC 월정액 무료", "아이들나라 모바일앱 무료", "프리미엄 클럽 +Pack"]
  },
  {
    id: "lg-uplus-premium-pass",
    carrier: "lg_uplus",
    name: "프리미엄 방송패스",
    channels: 257,
    prices: {
      single: { "3years": 24200, "2years": 25300, "1year": 26400 },
      onlineDiscount: { "3years": 23100, "2years": 24750, "1year": 26125 }
    },
    benefits: ["지상파/JTBC 월정액 무료", "UHD팩 무료 제공", "프리미엄 클럽 +Pack"]
  },
  {
    id: "lg-uplus-premium-plus",
    carrier: "lg_uplus",
    name: "프리미엄 플러스",
    channels: 257,
    prices: {
      single: { "3years": 22000, "2years": 23100, "1year": 24200 },
      onlineDiscount: { "3years": 20900, "2years": 22550, "1year": 23925 }
    },
    benefits: ["유플레이 프리미엄 서비스 제공", "UHD팩 무료 제공", "프리미엄 클럽 +Pack", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-uplay",
    carrier: "lg_uplus",
    name: "프리미엄 유플레이",
    channels: 257,
    prices: {
      single: { "3years": 26400, "2years": 31900, "1year": 34650 },
      onlineDiscount: { "3years": 24750, "2years": 31075, "1year": 34237 }
    },
    benefits: ["매월 5,500원 유료 VOD 쿠폰", "UHD팩 무료 제공", "프리미엄 클럽 +Pack", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-vod",
    carrier: "lg_uplus",
    name: "프리미엄 VOD",
    channels: 257,
    prices: {
      single: { "3years": 24200, "2years": 25300, "1year": 26400 },
      onlineDiscount: { "3years": 23100, "2years": 24750, "1year": 26125 }
    },
    benefits: ["아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-netflix-hd",
    carrier: "lg_uplus",
    name: "프리미엄 넷플릭스 HD",
    channels: 257,
    prices: {
      single: { "3years": 32200, "2years": 33300, "1year": 34400 },
      onlineDiscount: { "3years": 30550, "2years": 32475, "1year": 33987 }
    },
    benefits: ["최대 2대 기기 넷플릭스 콘텐츠 고화질 시청", "UHD팩 무료 제공", "프리미엄 클럽 +Pack", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-netflix-uhd",
    carrier: "lg_uplus",
    name: "프리미엄 넷플릭스 UHD",
    channels: 257,
    prices: {
      single: { "3years": 35700, "2years": 36800, "1year": 37900 },
      onlineDiscount: { "3years": 34050, "2years": 35975, "1year": 37487 }
    },
    benefits: ["최대 4대 기기 넷플릭스 콘텐츠 초고화질 시청", "UHD팩 무료 제공", "프리미엄 클럽 +Pack", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-disney-standard",
    carrier: "lg_uplus",
    name: "프리미엄 디즈니+ 스탠다드",
    channels: 257,
    prices: {
      single: { "3years": 28600, "2years": 29700, "1year": 30800 },
      onlineDiscount: { "3years": 26950, "2years": 28875, "1year": 30387 }
    },
    benefits: ["최대 2대 기기 디즈니+ 콘텐츠 고화질 시청", "UHD팩 무료 제공", "프리미엄 클럽 +Pack", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-disney-premium",
    carrier: "lg_uplus",
    name: "프리미엄 디즈니+",
    channels: 257,
    prices: {
      single: { "3years": 32600, "2years": 33700, "1year": 34800 },
      onlineDiscount: { "3years": 30950, "2years": 32875, "1year": 34387 }
    },
    benefits: ["최대 4대 기기 디즈니+ 콘텐츠 초고화질 시청", "UHD팩 무료 제공", "프리미엄 클럽 +Pack", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-tving-plus",
    carrier: "lg_uplus",
    name: "프리미엄 티빙 플러스",
    channels: 257,
    prices: {
      single: { "3years": 35700, "2years": 36800, "1year": 37900 },
      onlineDiscount: { "3years": 34050, "2years": 35975, "1year": 37487 }
    },
    benefits: ["최대 4대 기기로 티빙 콘텐츠 초고화질 시청", "UHD팩 무료 제공", "프리미엄 클럽 +Pack", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-mychoice",
    carrier: "lg_uplus",
    name: "프리미엄 내맘대로",
    channels: 257,
    prices: {
      single: { "3years": 29700, "2years": 31900, "1year": 34100 },
      onlineDiscount: { "3years": 28050, "2years": 31075, "1year": 33687 }
    },
    benefits: ["매월 원하는 부가서비스 3종 중 하나를 선택/무료 이용", "UHD팩 무료 제공", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-premium-tving",
    carrier: "lg_uplus",
    name: "프리미엄 티빙",
    channels: 257,
    prices: {
      single: { "3years": 32200, "2years": 33300, "1year": 34400 },
      onlineDiscount: { "3years": 30550, "2years": 32475, "1year": 33987 }
    },
    benefits: ["최대 2대 기기로 티빙 콘텐츠 고화질 시청", "UHD팩 무료 제공", "아이들나라 모바일앱 무료"]
  },
  {
    id: "lg-uplus-senior",
    carrier: "lg_uplus",
    name: "고급형",
    channels: 232,
    prices: {
      single: { "3years": 17600, "2years": 0, "1year": 0 },
      onlineDiscount: { "3years": 16500, "2years": 0, "1year": 0 }
    },
    benefits: ["프리미엄 클럽 +Pack", "아이들나라 모바일앱 무료"]
  },

  // ==========================================
  // 3-9 [CMB] 요금제 데이터
  // ==========================================
  {
    id: "cmb-hd-family",
    carrier: "cmb",
    name: "HD패밀리",
    channels: 180,
    prices: { single: { "3years": 13200 } },
    benefits: ["상품권 4만원"],
    regions: {
      seoul: ["강남구", "강동구", "구로구", "금천구", "마포구", "성북구", "송파구", "용산구", "중랑구"],
      gyeonggi: ["고양시", "파주시", "광주시", "구리시", "남양주시", "하남시", "가평군", "양평군", "여주군", "의정부시", "양주시", "동두천시", "포천시", "연천군"]
    }
  },
  {
    id: "cmb-hd-premium-plus",
    carrier: "cmb",
    name: "HD프리미엄플러스",
    channels: 240,
    prices: { single: { "3years": 15400 } },
    benefits: ["상품권 8만원"],
    regions: {
      seoul: ["강남구", "강동구", "구로구", "금천구", "마포구", "성북구", "송파구", "용산구", "중랑구"],
      gyeonggi: ["고양시", "파주시", "광주시", "구리시", "남양주시", "하남시", "가평군", "양평군", "여주군", "의정부시", "양주시", "동두천시", "포천시", "연천군"]
    }
  },
  {
    id: "cmb-uhd-premium-plus",
    carrier: "cmb",
    name: "UHD프리미엄플러스",
    channels: 240,
    prices: { single: { "3years": 18700 } },
    benefits: ["상품권 10만원", "넷플릭스 가능", "유튜브 가능"],
    regions: {
      seoul: ["강남구", "강동구", "구로구", "금천구", "마포구", "성북구", "송파구", "용산구", "중랑구"],
      gyeonggi: ["고양시", "파주시", "광주시", "구리시", "남양주시", "하남시", "가평군", "양평군", "여주군", "의정부시", "양주시", "동두천시", "포천시", "연천군"]
    }
  },
  {
    id: "cmb-uhd-gold",
    carrier: "cmb",
    name: "UHD골드 (KT HCN)",
    channels: 200,
    prices: { single: { "3years": 12100, "2years": 28380, "1year": 31240 } },
    benefits: [],
    regions: {
      seoul: ["관악구", "구로구", "금천구", "동작구", "서초구"],
      daegu: ["북구"],
      gyeongbuk: ["구미시", "김천시", "상주시", "칠곡시", "성주군", "고령군", "군위군", "포항시", "울진군", "영덕군"],
      busan: ["동래구", "연제구"],
      chungbuk: ["청주시", "청원군"]
    }
  },
  {
    id: "cmb-uhd-gold-wifi",
    carrier: "cmb",
    name: "UHD골드+WiFi (KT HCN)",
    channels: 200,
    prices: { single: { "3years": 13200 } },
    benefits: ["WiFi 기본 제공"],
    regions: {
      seoul: ["관악구", "구로구", "금천구", "동작구", "서초구"],
      daegu: ["북구"],
      gyeongbuk: ["구미시", "김천시", "상주시", "칠곡시", "성주군", "고령군", "군위군", "포항시", "울진군", "영덕군"],
      busan: ["동래구", "연제구"],
      chungbuk: ["청주시", "청원군"]
    }
  },
  {
    id: "cmb-pop100",
    carrier: "cmb",
    name: "POP100 (SK 브로드밴드)",
    channels: 109,
    prices: { single: { "3years": 12100 } },
    benefits: [],
    regions: {
      seoul: ["강서구", "노원구", "도봉구", "강북구", "동대문구", "서대문구", "성동구", "광진구", "종로구", "중구"],
      incheon: ["남동구", "서구", "중구", "동구", "옹진군", "강화군"],
      gyeonggi: ["과천시", "의왕시", "군포시", "안양시", "광명시", "안산시", "시흥시", "수원시", "오산시", "화성시", "용인시", "평택시", "이천시", "안성시"],
      daegu: ["달서구", "달성군", "서구", "중구", "남구"],
      busan: ["강서구", "북구", "사상구", "남구", "수영구", "서구", "사하구"],
      chungnam: ["천안시", "아산시", "연기군"],
      sejong: ["세종시"],
      jeonbuk: ["전주시", "완주군", "무주군", "진안군", "장수군"]
    }
  },
  {
    id: "cmb-pop180",
    carrier: "cmb",
    name: "POP180 (SK 브로드밴드)",
    channels: 184,
    prices: { single: { "3years": 15400 } },
    benefits: [],
    regions: {
      seoul: ["강서구", "노원구", "도봉구", "강북구", "동대문구", "서대문구", "성동구", "광진구", "종로구", "중구"],
      incheon: ["남동구", "서구", "중구", "동구", "옹진군", "강화군"],
      gyeonggi: ["과천시", "의왕시", "군포시", "안양시", "광명시", "안산시", "시흥시", "수원시", "오산시", "화성시", "용인시", "평택시", "이천시", "안성시"],
      daegu: ["달서구", "달성군", "서구", "중구", "남구"],
      busan: ["강서구", "북구", "사상구", "남구", "수영구", "서구", "사하구"],
      chungnam: ["천안시", "아산시", "연기군"],
      sejong: ["세종시"],
      jeonbuk: ["전주시", "완주군", "무주군", "진안군", "장수군"]
    }
  },
  {
    id: "cmb-pop230",
    carrier: "cmb",
    name: "POP230 (SK 브로드밴드)",
    channels: 231,
    prices: { single: { "3years": 17600 } },
    benefits: [],
    regions: {
      seoul: ["강서구", "노원구", "도봉구", "강북구", "동대문구", "서대문구", "성동구", "광진구", "종로구", "중구"],
      incheon: ["남동구", "서구", "중구", "동구", "옹진군", "강화군"],
      gyeonggi: ["과천시", "의왕시", "군포시", "안양시", "광명시", "안산시", "시흥시", "수원시", "오산시", "화성시", "용인시", "평택시", "이천시", "안성시"],
      daegu: ["달서구", "달성군", "서구", "중구", "남구"],
      busan: ["강서구", "북구", "사상구", "남구", "수영구", "서구", "사하구"],
      chungnam: ["천안시", "아산시", "연기군"],
      sejong: ["세종시"],
      jeonbuk: ["전주시", "완주군", "무주군", "진안군", "장수군"]
    }
  },
  {
    id: "cmb-economy-uhd",
    carrier: "cmb",
    name: "이코노미UHD(100채널) (LG헬로비전)",
    channels: 100,
    prices: { single: { "3years": 17600 } },
    benefits: ["유튜브 가능", "넷플릭스 가능"],
    regions: {
      seoul: ["양천구", "은평구"],
      incheon: ["부평구", "계양구"],
      gyeonggi: ["부천시", "김포시", "의정부시", "양주시", "동두천시", "포천시", "연천군"],
      daegu: ["동구", "수성구"],
      gyeongbuk: ["경주시", "영천시", "경산시", "청도군", "안동시", "영주시", "예천군", "의성군", "봉화군", "문경시", "청송군", "영양군"],
      busan: ["금정구", "부산진구", "중구", "동구", "영도구", "해운대구", "기장군"],
      gyeongnam: ["창원시 진해구", "의령군", "함안군", "창원시 마산회원구", "거제시", "통영시", "고성군"],
      chungnam: ["당진시", "서산시", "태안군", "홍성군", "예산군", "청양군"],
      jeonbuk: ["김제시", "정읍시", "남원시", "고창군", "부안군", "임실군", "순창군"],
      jeonnam: ["여수시", "순천시", "고흥군", "광양시", "목포시", "신안군", "무안군", "강진군", "완도군", "해남군", "영암군", "진도군", "장흥군"],
      gangwon: ["강릉시", "동해시", "속초시", "삼척시", "양양군", "고성군", "원주시", "횡성군", "영월군", "평창군", "정선군", "춘천시", "홍천군", "철원군", "화천군", "양구군", "인제군"]
    }
  },
  {
    id: "cmb-basic-uhd",
    carrier: "cmb",
    name: "베이직UHD(210채널) (LG헬로비전)",
    channels: 210,
    prices: { single: { "3years": 19800 } },
    benefits: ["유튜브 가능", "넷플릭스 가능"],
    regions: {
      seoul: ["양천구", "은평구"],
      incheon: ["부평구", "계양구"],
      gyeonggi: ["부천시", "김포시", "의정부시", "양주시", "동두천시", "포천시", "연천군"],
      daegu: ["동구", "수성구"],
      gyeongbuk: ["경주시", "영천시", "경산시", "청도군", "안동시", "영주시", "예천군", "의성군", "봉화군", "문경시", "청송군", "영양군"],
      busan: ["금정구", "부산진구", "중구", "동구", "영도구", "해운대구", "기장군"],
      gyeongnam: ["창원시 진해구", "의령군", "함안군", "창원시 마산회원구", "거제시", "통영시", "고성군"],
      chungnam: ["당진시", "서산시", "태안군", "홍성군", "예산군", "청양군"],
      jeonbuk: ["김제시", "정읍시", "남원시", "고창군", "부안군", "임실군", "순창군"],
      jeonnam: ["여수시", "순천시", "고흥군", "광양시", "목포시", "신안군", "무안군", "강진군", "완도군", "해남군", "영암군", "진도군", "장흥군"],
      gangwon: ["강릉시", "동해시", "속초시", "삼척시", "양양군", "고성군", "원주시", "횡성군", "영월군", "평창군", "정선군", "춘천시", "홍천군", "철원군", "화천군", "양구군", "인제군"]
    }
  },
  {
    id: "cmb-fhd-premium",
    carrier: "cmb",
    name: "고급형(176ch)",
    channels: 176,
    prices: { single: { "3years": 8800 } },
    benefits: [],
    regions: { seoul: ["영등포구"] }
  },
  {
    id: "cmb-delight",
    carrier: "cmb",
    name: "디라이트(180ch)",
    channels: 180,
    prices: { single: { "1year": 21175, "2years": 20350, "3years": 12100, "4years": 11000 } },
    benefits: ["1대 추가시 월 6,600원"],
    regions: { incheon: ["미추홀구", "연수구"] }
  },
  {
    id: "cmb-deluxe",
    carrier: "cmb",
    name: "디럭스(207ch)",
    channels: 207,
    prices: { single: { "1year": 28490, "2years": 27820, "3years": 15400, "4years": 13200 } },
    benefits: ["현금 5만원", "1대 추가시 월 7,700원"],
    regions: { incheon: ["미추홀구", "연수구"] }
  },
  {
    id: "cmb-uhd-premium-choice",
    carrier: "cmb",
    name: "UHD고급형(유튜브,넷플릭스가능)",
    channels: 200,
    prices: { single: { "1year": 15400, "2years": 14300, "3years": 12100 } },
    benefits: ["유튜브 가능", "넷플릭스 가능"],
    regions: { ulsan: ["울주군"] }
  },
  {
    id: "cmb-fhd-high-grade",
    carrier: "cmb",
    name: "FHD고급형(170ch)",
    channels: 170,
    prices: { single: { "none": 11000, "1year": 10450, "2years": 9900, "3years": 8800 } },
    benefits: [],
    regions: {
      daejeon: ["대전광역시"],
      chungnam: ["계룡시", "공주시", "금산군", "보령군", "부여군", "논산군"]
    }
  },
  {
    id: "cmb-jeju-hd120",
    carrier: "cmb",
    name: "디지털HD120(102채널)",
    channels: 102,
    prices: { single: { "3years": 12650 } },
    benefits: [],
    regions: { jeju: ["제주시"] }
  },
  {
    id: "cmb-jeju-hd150",
    carrier: "cmb",
    name: "디지털HD150(132채널)",
    channels: 132,
    prices: { single: { "3years": 14790 } },
    benefits: [],
    regions: { jeju: ["제주시"] }
  },
  {
    id: "cmb-jeju-hd180",
    carrier: "cmb",
    name: "디지털HD180(159채널)",
    channels: 159,
    prices: { single: { "3years": 19800 } },
    benefits: [],
    regions: { jeju: ["제주시"] }
  },
  {
    id: "cmb-jeonbuk-basic",
    carrier: "cmb",
    name: "베이직(76ch)",
    channels: 76,
    prices: { single: { "1year": 13200, "2years": 12100, "3years": 11000 } },
    benefits: [],
    regions: { jeonbuk: ["익산시", "군산시"] }
  },
  {
    id: "cmb-jeonbuk-standard",
    carrier: "cmb",
    name: "스탠다드(113ch)",
    channels: 113,
    prices: { single: { "1year": 15400, "2years": 14300, "3years": 13200 } },
    benefits: [],
    regions: { jeonbuk: ["익산시", "군산시"] }
  },
  {
    id: "cmb-jeonbuk-family",
    carrier: "cmb",
    name: "패밀리(149ch)",
    channels: 149,
    prices: { single: { "1year": 18700, "2years": 17600, "3years": 16500 } },
    benefits: [],
    regions: { jeonbuk: ["익산시", "군산시"] }
  }
];

/**
 * 🗺️ 지역별 상세 행정구역 옵션 데이터 정의 (ㄱ ~ ㅎ 가나다순 정렬)
 */
export const regionDetailsMap: Record<string, { value: string; label: string }[]> = {
  seoul: [
    { value: "강남구", label: "강남구" }, { value: "강동구", label: "강동구" },
    { value: "강북구", label: "강북구" }, { value: "강서구", label: "강서구" },
    { value: "관악구", label: "관악구" }, { value: "광진구", label: "광진구" },
    { value: "구로구", label: "구로구" }, { value: "금천구", label: "금천구" },
    { value: "노원구", label: "노원구" }, { value: "도봉구", label: "도봉구" },
    { value: "동대문구", label: "동대문구" }, { value: "동작구", label: "동작구" },
    { value: "마포구", label: "마포구" }, { value: "서대문구", label: "서대문구" },
    { value: "서초구", label: "서초구" }, { value: "성동구", label: "성동구" },
    { value: "성북구", label: "성북구" }, { value: "송파구", label: "송파구" },
    { value: "양천구", label: "양천구" }, { value: "영등포구", label: "영등포구" },
    { value: "용산구", label: "용산구" }, { value: "은평구", label: "은평구" },
    { value: "종로구", label: "종로구" }, { value: "중구", label: "중구" }, { value: "중랑구", label: "중랑구" }
  ],
  gyeonggi: [
    { value: "가평군", label: "가평군" }, { value: "고양시", label: "고양시" },
    { value: "고양시 덕양구", label: "고양시 덕양구" }, { value: "고양시 일산동구", label: "고양시 일산동구" },
    { value: "고양시 일산서구", label: "고양시 일산서구" }, { value: "과천시", label: "과천시" },
    { value: "광명시", label: "광명시" }, { value: "광주시", label: "광주시" },
    { value: "구리시", label: "구리시" }, { value: "군포시", label: "군포시" },
    { value: "김포시", label: "김포시" }, { value: "남양주시", label: "남양주시" },
    { value: "동두천시", label: "동두천시" }, { value: "부천시", label: "부천시" },
    { value: "수원시", label: "수원시" }, { value: "시흥시", label: "시흥시" },
    { value: "안산시", label: "안산시" }, { value: "안성시", label: "안성시" },
    { value: "안양시", label: "안양시" }, { value: "양주시", label: "양주시" },
    { value: "양평군", label: "양평군" }, { value: "여주시", label: "여주시" },
    { value: "연천군", label: "연천군" }, { value: "오산시", label: "오산시" },
    { value: "용인시", label: "용인시" }, { value: "의왕시", label: "의왕시" },
    { value: "의정부시", label: "의정부시" }, { value: "이천시", label: "이천시" },
    { value: "파주시", label: "파주시" }, { value: "평택시", label: "평택시" },
    { value: "포천시", label: "포천시" }, { value: "하남시", label: "하남시" }, { value: "화성시", label: "화성시" }
  ],
  incheon: [
    { value: "강화군", label: "강화군" }, { value: "계양구", label: "계양구" },
    { value: "남동구", label: "남동구" }, { value: "동구", label: "동구" },
    { value: "미추홀구", label: "미추홀구" }, { value: "부평구", label: "부평구" },
    { value: "서구", label: "서구" }, { value: "연수구", label: "연수구" },
    { value: "옹진군", label: "옹진군" }, { value: "중구", label: "중구" }
  ],
  daegu: [
    { value: "남구", label: "남구" }, { value: "달서구", label: "달서구" },
    { value: "달성군", label: "달성군" }, { value: "동구", label: "동구" },
    { value: "북구", label: "북구" }, { value: "서구", label: "서구" },
    { value: "수성구", label: "수성구" }, { value: "중구", label: "중구" }
  ],
  busan: [
    { value: "강서구", label: "강서구" }, { value: "금정구", label: "금정구" },
    { value: "기장군", label: "기장군" }, { value: "남구", label: "남구" },
    { value: "동구", label: "동구" }, { value: "동래구", label: "동래구" },
    { value: "부산진구", label: "부산진구" }, { value: "북구", label: "북구" },
    { value: "사상구", label: "사상구" }, { value: "사하구", label: "사하구" },
    { value: "서구", label: "서구" }, { value: "수영구", label: "수영구" },
    { value: "연제구", label: "연제구" }, { value: "영도구", label: "영도구" },
    { value: "중구", label: "중구" }, { value: "해운대구", label: "해운대구" }
  ],
  ulsan: [
    { value: "울주군", label: "울주군" }
  ],
  gyeongbuk: [
    { value: "경산시", label: "경산시" }, { value: "경주시", label: "경주시" },
    { value: "고령군", label: "고령군" }, { value: "구미시", label: "구미시" },
    { value: "군위군", label: "군위군" }, { value: "김천시", label: "김천시" },
    { value: "문경시", label: "문경시" }, { value: "봉화군", label: "봉화군" },
    { value: "상주시", label: "상주시" }, { value: "성주군", label: "성주군" },
    { value: "안동시", label: "안동시" }, { value: "영덕군", label: "영덕군" },
    { value: "영양군", label: "영양군" }, { value: "영주시", label: "영주시" },
    { value: "영천시", label: "영천시" }, { value: "예천군", label: "예천군" },
    { value: "울진군", label: "울진군" }, { value: "의성군", label: "의성군" },
    { value: "청도군", label: "청도군" }, { value: "청송군", label: "청송군" },
    { value: "칠곡시", label: "칠곡시" }, { value: "포항시", label: "포항시" }
  ],
  gyeongnam: [
    { value: "거제시", label: "거제시" }, { value: "고성군", label: "고성군" },
    { value: "의령군", label: "의령군" }, { value: "창원시 마산회원구", label: "창원시 마산회원구" },
    { value: "창원시 진해구", label: "창원시 진해구" }, { value: "통영시", label: "통영시" },
    { value: "함안군", label: "함안군" }
  ],
  daejeon: [
    { value: "대전광역시", label: "대전광역시" }
  ],
  sejong: [
    { value: "세종시", label: "세종시" }
  ],
  chungbuk: [
    { value: "청원군", label: "청원군" }, { value: "청주시", label: "청주시" }
  ],
  chungnam: [
    { value: "계룡시", label: "계룡시" }, { value: "공주시", label: "공주시" },
    { value: "금산군", label: "금산군" }, { value: "논산군", label: "논산군" },
    { value: "당진시", label: "당진시" }, { value: "보령군", label: "보령군" },
    { value: "부여군", label: "부여군" }, { value: "서산시", label: "서산시" },
    { value: "아산시", label: "아산시" }, { value: "연기군", label: "연기군" },
    { value: "예산군", label: "예산군" }, { value: "천안시", label: "천안시" },
    { value: "청양군", label: "청양군" }, { value: "태안군", label: "태안군" },
    { value: "홍성군", label: "홍성군" }
  ],
  jeonbuk: [
    { value: "고창군", label: "고창군" }, { value: "군산시", label: "군산시" },
    { value: "김제시", label: "김제시" }, { value: "남원시", label: "남원시" },
    { value: "무주군", label: "무주군" }, { value: "부안군", label: "부안군" },
    { value: "순창군", label: "순창군" }, { value: "완주군", label: "완주군" },
    { value: "익산시", label: "익산시" }, { value: "임실군", label: "임실군" },
    { value: "장수군", label: "장수군" }, { value: "전주시", label: "전주시" },
    { value: "정읍시", label: "정읍시" }, { value: "진안군", label: "진안군" }
  ],
  jeonnam: [
    { value: "강진군", label: "강진군" }, { value: "고흥군", label: "고흥군" },
    { value: "광양시", label: "광양시" }, { value: "목포시", label: "목포시" },
    { value: "무안군", label: "무안군" }, { value: "순천시", label: "순천시" },
    { value: "신안군", label: "신안군" }, { value: "여수시", label: "여수시" },
    { value: "영암군", label: "영암군" }, { value: "완도군", label: "완도군" },
    { value: "장흥군", label: "장흥군" }, { value: "진도군", label: "진도군" },
    { value: "해남군", label: "해남군" }
  ],
  gangwon: [
    { value: "강릉시", label: "강릉시" }, { value: "고성군", label: "고성군" },
    { value: "동해시", label: "동해시" }, { value: "삼척시", label: "삼척시" },
    { value: "속초시", label: "속초시" }, { value: "양구군", label: "양구군" },
    { value: "양양군", label: "양양군" }, { value: "영월군", label: "영월군" },
    { value: "원주시", label: "원주시" }, { value: "인제군", label: "인제군" },
    { value: "정선군", label: "정선군" }, { value: "철원군", label: "철원군" },
    { value: "춘천시", label: "춘천시" }, { value: "평창군", label: "평창군" },
    { value: "홍천군", label: "홍천군" }, { value: "화천군", label: "화천군" },
    { value: "횡성군", label: "횡성군" }
  ],
  jeju: [
    { value: "제주시", label: "제주시" }
  ]
};

/**
 * 🛠️ flow.ts의 상세 지역 노드들을 루프 돌려 찍어내는 팩토리 함수 (가나다순 정렬 적용)
 */
export const generateRegionDetailSteps = (namespace: string, nextStepId: string): any[] => {
  const korRegionNames: Record<string, string> = {
    seoul: "서울", gyeonggi: "경기", incheon: "인천", daegu: "대구", busan: "부산",
    ulsan: "울산", gyeongbuk: "경북", gyeongnam: "경남", daejeon: "대전", sejong: "세종",
    chungbuk: "충북", chungnam: "충남", jeonbuk: "전북", jeonnam: "전남", gangwon: "강원", jeju: "제주"
  };

  return Object.entries(regionDetailsMap).map(([regionKey, districts]) => {
    const suffix = regionKey.charAt(0).toUpperCase() + regionKey.slice(1);
    const answerKey = `${namespace}.regionDetail${suffix}`;
    const korName = korRegionNames[regionKey] ?? regionKey;

    const sortedDistricts = [...districts].sort((a, b) => a.label.localeCompare(b.label, "ko-KR"));

    return {
      id: `iptv-region-${regionKey}`,
      type: "single-choice",
      message: `${korName}의 상세 지역을 선택해주세요.`,
      answerKey,
      options: sortedDistricts.map(d => ({
        value: d.value,
        label: d.label,
        next: nextStepId,
      })),
    };
  });
};

