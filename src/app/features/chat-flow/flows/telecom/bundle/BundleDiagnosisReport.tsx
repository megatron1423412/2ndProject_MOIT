import React from "react";
import { CheckCircle2, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";
import type { FlowResult } from "../../../core/types";

interface BundleDiagnosisReportProps {
  result: FlowResult;
}

import { mockBundlePlans, MOCK_PLAN_COMBINATIONS } from "./mockData";
import {
  mockMvnoMobilePlans,
  mockMvnoHomeBundles,
  mockLgHelloBundles,
  mockEyagiSktMobilePlans,
  mockSktHomeBundles,
  mockEyagiLguMobilePlans,
  mockLguHomeBundles
} from "./MVNOmockData";

const fmt = (n: number) => n.toLocaleString("ko-KR");

const companyTypeMap: Record<string, string> = {
  mno: "품질 및 결합 혜택 우선 추천",
  mvno: "고정 비용 최소화 추천",
  any: "위약금 대비 실질 이득 추천",
};

const speedMap: Record<string, string> = {
  "~100Mbps": "100Mbps (웹서핑·유튜브)",
  "~500Mbps": "500Mbps (고화질 영상·게임)",
  "~1Gbps": "1Gbps (대용량 다운로드·방송)",
};

const dataMap: Record<string, string> = {
  "unlimited": "무제한 필요 (헤비 유저)",
  "50G-100G": "50GB ~ 100GB (일반 동영상 시청)",
  "10G-30G": "10GB ~ 30GB (출퇴근 웹서핑)",
  "under-10G": "10GB 미만 (주로 와이파이 사용)",
};

export default function BundleDiagnosisReport({ result }: BundleDiagnosisReportProps) {
  const metadata = result.metadata || {};
  const answers = metadata.answers || {};

  const startState = answers["bundle.startState"] as string;
  const isNewStart = startState === "new_start";

  // Parse contract info helper
  const getContractLabel = (val: string) => {
    if (!val) return "-";
    if (val === "만료") return "3년 이상 (만료)";
    if (val === "남음") return "약정 기간 남음";
    if (val === "모름") return "잘 모르겠음";
    return val;
  };

  // 1. 현재 상태 요약 (Current State Summary)
  let currentStateSummaryTitle = "";
  let currentStateComposition = "";
  let currentStateGuidance = "";

  if (startState === "all_same") {
    currentStateSummaryTitle = "전부 같아요";
    currentStateComposition = "모바일+인터넷+IPTV";
    currentStateGuidance = "현재 스마트폰, 인터넷, IPTV를 하나로 묶은 [전부 결합] 실태로 통신 서비스를 이용하고 계십니다";
  } else if (startState === "part_same") {
    currentStateSummaryTitle = "일부만 같아요";
    const partSelect = answers["bundle.partSelect"] as string;
    if (partSelect === "pta") {
      currentStateComposition = "모바일(개인)/인터넷+IPTV";
      currentStateGuidance = "현재 개인 스마트폰 요금과 인터넷+TV 요금이 찢어진 [모바일/홈 개별 결합] 상태입니다.";
    } else if (partSelect === "ptc") {
      currentStateComposition = "모바일(다인)/인터넷+IPTV";
      currentStateGuidance = "현재 여러 명이 묶인 모바일 결합과 집 인터넷+TV 결합이 따로 노는 [그룹 분리 결합] 상태입니다.";
    } else if (partSelect === "ptb") {
      currentStateComposition = "모바일 인터넷/IPTV";
      currentStateGuidance = "현재 스마트폰과 인터넷 위주로만 연계된 [모바일+인터넷 결합] 상태입니다.";
    } else {
      currentStateComposition = "일부 결합";
      currentStateGuidance = "현재 일부 상품만 결합된 상태로 이용하고 계십니다.";
    }
  } else if (startState === "all_diff") {
    currentStateSummaryTitle = "다 달라요";
    currentStateComposition = "모바일(개인)/인터넷/IPTV";
    currentStateGuidance = "현재 스마트폰, 인터넷, IPTV 모두 결합 할인을 전혀 받지 않는 [각자도생 무결합] 상태입니다.";
  } else if (isNewStart) {
    currentStateSummaryTitle = "새로 할래요";
    const newSelect = answers["bundle.newSelect"] as string;
    if (newSelect === "new_mobile") {
      currentStateComposition = "모바일(신규/번이)+인터넷+IPTV";
      currentStateGuidance = "스마트폰 요금제부터 인터넷, TV까지 싹 다 새로 맞추는 [완전 신규 결합 설계] 상태입니다.";
    } else {
      currentStateComposition = "모바일(유지)+인터넷+IPTV";
      currentStateGuidance = "기존 스마트폰은 그대로 유지하고, 인터넷 & TV만 새로 얹는 [부분 신규 결합 설계] 상태입니다.";
    }
  }

  // Parse current state info variables
  let currentCarrierLabel = "기존 통신사";
  let currentServicesString = "선택 안 됨";
  let currentPlanString = "결합상품";

  if (startState === "all_same") {
    const carrier = answers["bundle.allCarrier"] || "기존 통신사";
    currentCarrierLabel = carrier;
    currentServicesString = "모바일 + 인터넷 + IPTV";
    currentPlanString = `[${carrier}] 결합상품`;
  } else if (startState === "part_same") {
    const partSelect = answers["bundle.partSelect"] as string;
    if (partSelect === "pta") {
      const mobCarrier = answers["bundle.ptaCarrier"] || "기존";
      const combCarrier = answers["bundle.ptaComboCarrier"] || "기존";
      currentCarrierLabel = `${mobCarrier} / ${combCarrier}`;
      currentServicesString = "모바일(개인) / 인터넷 + IPTV";
      currentPlanString = `[모바일: ${mobCarrier}, 유선: ${combCarrier}]`;
    } else if (partSelect === "ptb") {
      const mobCarrier = answers["bundle.ptbCarrier"] || "기존";
      const combCarrier = answers["bundle.ptbComboCarrier"] || "기존";
      currentCarrierLabel = `${mobCarrier} / ${combCarrier}`;
      currentServicesString = "모바일 + 인터넷";
      currentPlanString = `[결합: ${mobCarrier}, 유선: ${combCarrier}]`;
    } else if (partSelect === "ptc") {
      const mobCarrier = answers["bundle.ptcCarrier"] || "기존";
      const combCarrier = answers["bundle.ptcComboCarrier"] || "기존";
      currentCarrierLabel = `${mobCarrier} / ${combCarrier}`;
      currentServicesString = "모바일(다인) / 인터넷 + IPTV";
      currentPlanString = `[모바일: ${mobCarrier}, 유선: ${combCarrier}]`;
    }
  } else if (startState === "all_diff") {
    const selectedServices = (answers["bundle.diffServices"] as string[]) || [];
    const parts: string[] = [];
    const labels: string[] = [];
    const planParts: string[] = [];

    if (selectedServices.includes("phone")) {
      const mobCarrier = answers["bundle.diffCarrier"] || "모바일";
      parts.push(mobCarrier);
      labels.push("모바일");
      planParts.push(`모바일: ${mobCarrier}`);
    }
    if (selectedServices.includes("internet")) {
      const netCarrier = answers["bundle.diffInternetCarrier"] || "인터넷";
      parts.push(netCarrier);
      labels.push("인터넷");
      planParts.push(`인터넷: ${netCarrier}`);
    }
    if (selectedServices.includes("iptv")) {
      const tvCarrier = answers["bundle.diffTvCarrier"] || "TV";
      parts.push(tvCarrier);
      labels.push("IPTV");
      planParts.push(`TV: ${tvCarrier}`);
    }

    currentCarrierLabel = parts.join(" / ") || "선택 안 됨";
    currentServicesString = labels.length > 0 ? labels.join(", ") + " 개별" : "선택 안 됨";
    currentPlanString = planParts.length > 0 ? `[${planParts.join(", ")}]` : "선택 안 됨";
  } else if (isNewStart) {
    const newSelect = answers["bundle.newSelect"] as string;
    const mobCarrier = newSelect === "new_mobile"
      ? (answers["bundle.newACarrier"] || "기존")
      : (answers["bundle.newBCarrier"] || "기존");
    currentCarrierLabel = `${mobCarrier} (모바일)`;
    currentServicesString = newSelect === "new_mobile"
      ? "모바일 신규가입 / 인터넷+TV 신규"
      : "모바일 유지 / 인터넷+TV 신규";
    currentPlanString = `[모바일: ${mobCarrier}]`;
  }

  let currentContractString = "-";
  if (startState === "all_same") {
    currentContractString = getContractLabel(answers["bundle.allContract"] as string);
  } else if (startState === "part_same") {
    const partSelect = answers["bundle.partSelect"] as string;
    if (partSelect === "pta") {
      currentContractString = `모바일: ${getContractLabel(answers["bundle.ptaContract"] as string)} / 유선: ${getContractLabel(answers["bundle.ptaComboContract"] as string)}`;
    } else if (partSelect === "ptb") {
      currentContractString = `모바일: ${getContractLabel(answers["bundle.ptbContract"] as string)} / 유선: ${getContractLabel(answers["bundle.ptbComboContract"] as string)}`;
    } else if (partSelect === "ptc") {
      currentContractString = `모바일: ${getContractLabel(answers["bundle.ptcContract"] as string)} / 유선: ${getContractLabel(answers["bundle.ptcComboContract"] as string)}`;
    }
  } else if (startState === "all_diff") {
    const selectedServices = (answers["bundle.diffServices"] as string[]) || [];
    const contractParts: string[] = [];
    if (selectedServices.includes("phone")) {
      contractParts.push(`모바일: ${getContractLabel(answers["bundle.diffContract"] as string)}`);
    }
    if (selectedServices.includes("internet")) {
      contractParts.push(`인터넷: ${getContractLabel(answers["bundle.diffInternetContract"] as string)}`);
    }
    if (selectedServices.includes("iptv")) {
      contractParts.push(`TV: ${getContractLabel(answers["bundle.diffTvContract"] as string)}`);
    }
    currentContractString = contractParts.join(" / ") || "-";
  } else if (isNewStart) {
    const newSelect = answers["bundle.newSelect"] as string;
    const contract = newSelect === "new_mobile"
      ? answers["bundle.newAContract"]
      : answers["bundle.newBContract"];
    currentContractString = `모바일: ${getContractLabel(contract as string)}`;
  }

  // Parse members count
  const currentMembers = answers["bundle.allMembers"] || answers["bundle.ptaMembers"] || answers["bundle.ptbMembers"] || answers["bundle.ptcMembers"] || answers["bundle.diffMembers"] || answers["bundle.desiredMembers"] || "-";

  // Helper to resolve plan name from ID or manual input
  const resolvePlanName = (id: string) => {
    if (!id) return "";
    if (id === "direct-choose") return "";
    
    if (id.startsWith("api-")) {
      return id.substring(4);
    }
    
    // Clean up literal plan selections from recommendation list options
    if (id.includes("(월 ") || id.includes("순위")) {
      let clean = id;
      clean = clean.replace(/\[\d+순위\s*추천\]/g, "").replace(/\[추천\s*\d+순위\]/g, "").trim();
      clean = clean.replace(/\[(KT|SKT|LGU\+|LG|SK|LGU)\]/gi, "").trim();
      clean = clean.replace(/\(월\s*[\d,]+원\)/g, "").replace(/\([\d,]+원\)/g, "").trim();
      return clean;
    }
    
    const mb = mockBundlePlans.find((p) => p.id === id);
    if (mb) return mb.name;
    
    const mvnoMob = mockMvnoMobilePlans.find((p) => p.id === id);
    if (mvnoMob) return mvnoMob.mobilePlanName;
    
    const mvnoHome = mockMvnoHomeBundles.find((p) => p.id === id);
    if (mvnoHome) return mvnoHome.internetName;
    
    const hello = mockLgHelloBundles.find((p) => p.id === id);
    if (hello) return hello.mobilePlanName;
    
    const eyagiSkt = mockEyagiSktMobilePlans.find((p) => p.id === id);
    if (eyagiSkt) return eyagiSkt.mobilePlanName;
    
    const eyagiLgu = mockEyagiLguMobilePlans.find((p) => p.id === id);
    if (eyagiLgu) return eyagiLgu.mobilePlanName;
    
    const sktHome = mockSktHomeBundles.find((p) => p.id === id || p.id === `skt-home-${id}` || `skt-home-${p.id}` === id);
    if (sktHome) return sktHome.internetName;
    
    const lguHome = mockLguHomeBundles.find((p) => p.id === id || p.id === `lgu-home-${id}` || `lgu-home-${p.id}` === id);
    if (lguHome) return lguHome.internetName;
    
    const combo = MOCK_PLAN_COMBINATIONS.find((p) => p.id === id);
    if (combo) return combo.mobilePlan;
    
    return id;
  };

  const getComboDetails = (comboId: string) => {
    if (!comboId) return { internet: "", tv: "" };
    
    // 1. First parse if it contains "+"
    if (comboId.includes("+")) {
      const parts = comboId.split("+");
      let internetPart = parts[0].trim();
      let tvPart = parts[1].trim();
      
      internetPart = internetPart.replace(/\[\d+순위\s*추천\]/g, "").replace(/\[추천\s*\d+순위\]/g, "").trim();
      internetPart = internetPart.replace(/\[(KT|SKT|LGU\+|LG|SK|LGU)\]/gi, "").trim();
      tvPart = tvPart.replace(/\(월\s*[\d,]+원\)/g, "").replace(/\([\d,]+원\)/g, "").trim();
      
      return {
        internet: internetPart,
        tv: tvPart
      };
    }
    
    // 2. Clean prefix from comboId
    let cleanId = comboId;
    if (comboId.startsWith("skt-home-")) cleanId = comboId.replace("skt-home-", "");
    else if (comboId.startsWith("kt-home-")) cleanId = comboId.replace("kt-home-", "");
    else if (comboId.startsWith("lgu-home-")) cleanId = comboId.replace("lgu-home-", "");
    else if (comboId.includes("_")) {
      const parts = comboId.split("_");
      cleanId = parts[1] || comboId;
    }
    
    // 3. Search in MOCK_PLAN_COMBINATIONS using cleanId or original comboId
    const combo = MOCK_PLAN_COMBINATIONS.find((c) => c.id === cleanId || c.id === comboId);
    if (combo) {
      return {
        internet: combo.internetPlan,
        tv: combo.tvPlan.replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "").replace(/\s*\(인터넷결합\)/g, "").replace(/\s*\([\d,]+원\)/g, "").trim()
      };
    }
    
    // 4. Search in mockMvnoHomeBundles
    const skyHome = mockMvnoHomeBundles.find((h) => h.id === cleanId || h.id === comboId);
    if (skyHome) {
      return {
        internet: skyHome.internetName,
        tv: skyHome.tvName
      };
    }
    
    // 5. Search in mockSktHomeBundles
    const sktHome = mockSktHomeBundles.find((h) => h.id === cleanId || h.id === comboId);
    if (sktHome) {
      return {
        internet: sktHome.internetName,
        tv: sktHome.tvName
      };
    }
    
    // 6. Search in mockLguHomeBundles
    const lguHome = mockLguHomeBundles.find((h) => h.id === cleanId || h.id === comboId);
    if (lguHome) {
      return {
        internet: lguHome.internetName,
        tv: lguHome.tvName
      };
    }
    
    // 7. Search in mockLgHelloBundles
    const hello = mockLgHelloBundles.find((h) => h.id === cleanId || h.id === comboId);
    if (hello) {
      return {
        internet: hello.internetName,
        tv: hello.tvName
      };
    }
    
    return { internet: "", tv: "" };
  };

  const getDiscountText = (discounts: any) => {
    if (!discounts) return "-";
    const arr = Array.isArray(discounts) ? discounts : [discounts];
    if (arr.includes("선택약정") || arr.includes("가족결합")) {
      return "결합 할인 적용 중";
    }
    if (arr.includes("모름")) {
      return "-";
    }
    return "-";
  };

  const getCustomContractText = (val: string) => {
    if (!val) return "-";
    if (val === "만료") return "약정이 만료됨";
    if (val === "남음") return "약정 기간 남음";
    if (val === "모름") return "-";
    return val;
  };

  // Parse penalty info & Sum of current fee based on startState
  let currentFee = Number(metadata.currentFee || 0);
  let penaltyAmount = Number(metadata.penaltyAmount || 0);
  let knowPenalty = !!metadata.knowPenalty;

  if (startState === "all_same") {
    currentFee = (Number(answers["bundle.allMobileFee"]) || 0) + (Number(answers["bundle.allComboFee"]) || 0);
    penaltyAmount = (Number(answers["bundle.allPenalty"]) || 0) + (Number(answers["bundle.allComboPenalty"]) || 0);
    knowPenalty = answers["bundle.allKnowPenalty"] === "yes" || answers["bundle.allComboKnowPenalty"] === "yes";
  } else if (startState === "part_same") {
    const partSelectVal = answers["bundle.partSelect"] as string || "pta";
    currentFee = (Number(answers[`bundle.${partSelectVal}MobileFee`]) || 0) + (Number(answers[`bundle.${partSelectVal}ComboFee`]) || 0);
    penaltyAmount = (Number(answers[`bundle.${partSelectVal}Penalty`]) || 0) + (Number(answers[`bundle.${partSelectVal}ComboPenalty`]) || 0);
    knowPenalty = answers[`bundle.${partSelectVal}KnowPenalty`] === "yes" || answers[`bundle.${partSelectVal}ComboKnowPenalty`] === "yes";
  } else if (startState === "all_diff") {
    currentFee = (Number(answers["bundle.diffMobileFee"]) || 0) + (Number(answers["bundle.diffInternetFee"]) || 0) + (Number(answers["bundle.diffTvFee"]) || 0);
    penaltyAmount = (Number(answers["bundle.diffPenalty"]) || 0) + (Number(answers["bundle.diffInternetPenalty"]) || 0) + (Number(answers["bundle.diffTvPenalty"]) || 0);
    knowPenalty = answers["bundle.diffKnowPenalty"] === "yes" || answers["bundle.diffInternetKnowPenalty"] === "yes" || answers["bundle.diffTvKnowPenalty"] === "yes";
  }

  // Resolving specific values for CURRENT STATE cards
  // 1) all_same
  const allMobilePlanId = answers["bundle.allPlanCheck"] || answers["bundle.allPlanCheckList"];
  const allMobilePlanText = resolvePlanName(allMobilePlanId) || answers["bundle.allMobilePlan"] || "모바일 요금제";

  const allComboId = answers["bundle.allComboPlanCheck"] || answers["bundle.allComboPlanCheckList"];
  const allComboDetails = getComboDetails(allComboId);
  const allInternetPlanText = allComboDetails.internet || answers["bundle.allInternetProduct"] || "초고속 인터넷";
  const allTvPlanText = allComboDetails.tv || answers["bundle.allTvProduct"] || "IPTV 일반형";

  const allDiscountText = getDiscountText(answers["bundle.allDiscount"]);
  const allContractText = getCustomContractText(answers["bundle.allContract"] as string);

  // 2) part_same
  const partSelect = answers["bundle.partSelect"] as string || "pta";
  const partMobilePlanId = answers[`bundle.${partSelect}PlanCheck`] || answers[`bundle.${partSelect}PlanCheckList`];
  const partMobilePlanText = resolvePlanName(partMobilePlanId) || answers[`bundle.${partSelect}MobilePlan`] || "모바일 요금제";

  const partComboId = answers[`bundle.${partSelect}ComboPlanCheck`] || answers[`bundle.${partSelect}ComboPlanCheckList`];
  const partComboDetails = getComboDetails(partComboId);
  const partInternetPlanText = partComboDetails.internet || answers[`bundle.${partSelect}ComboProduct`] || "초고속 인터넷";
  const partTvPlanText = partComboDetails.tv || answers[`bundle.${partSelect}TvProduct`] || "IPTV 일반형";

  const partDiscountText = getDiscountText(answers[`bundle.${partSelect}Discount`]);
  const partContractText = getCustomContractText(answers[`bundle.${partSelect}Contract`] as string);

  // Recommended plan specs
  const selectedPlan = metadata.selectedPlan || {};
  const selectedPlanName = selectedPlan.name || "맞춤 추천 결합 요금제";
  const selectedPrice = selectedPlan.price || 55000;
  const recommendedCarrier = metadata.recommendedCarrier || "SK";
  const getCarrierLabel = (carrier: string) => {
    const c = (carrier || "").trim().toLowerCase();
    if (c.includes("헬로비전") || c.includes("hello")) return "LG 헬로비전";
    if (c.includes("스카이라이프") || c.includes("skylife")) return "KT 스카이라이프";
    if (c.includes("이야기")) return carrier;
    if (c.includes("skt") || c.includes("sk")) return "SKT";
    if (c.includes("lgu") || c.includes("lg u") || c.includes("lg")) return "LGU+";
    if (c.includes("kt")) return "KT";
    return carrier;
  };
  const recommendedCarrierLabel = getCarrierLabel(recommendedCarrier);

  const getCarrierLinkUrl = (carrierName: string) => {
    const c = (carrierName || "").trim().toLowerCase();
    if (c.includes("헬로비전") || c.includes("hello")) {
      return "https://www.lghellovision.net/product/internetTvCombine/internetTvPriceList.do";
    }
    if (c.includes("스카이라이프") || c.includes("skylife")) {
      return "https://www.skylife.co.kr/product/combi/Main";
    }
    if (c.includes("이야기")) {
      return "https://www.eyagi.co.kr/shop/service/internet-tv-combine.php";
    }
    if (c.includes("lgu") || c.includes("lg u") || c.includes("lg")) {
      return "https://www.lguplus.com/internet-iptv/internet-iptv-package/plan";
    }
    if (c.includes("kt")) {
      return "https://www.kt.com/";
    }
    if (c.includes("skt") || c.includes("sk")) {
      return "https://www.tworld.co.kr/web/product/wire/submain";
    }
    return "https://www.kt.com/";
  };

  const desiredCompanyTypeLabel = companyTypeMap[answers["bundle.desiredCompanyType"] as string] || "상관없음";
  const desiredSpeedLabel = speedMap[answers["bundle.desiredSpeed"] as string] || "일반 가정용(500M)";
  const desiredDataLabel = dataMap[answers["bundle.desiredData"] as string] || "무제한 필요";

  // Calculate savings
  const monthlySaving = Math.max(0, currentFee - selectedPrice);
  const yearlySaving = monthlySaving * 12;

  const carrierLower = (recommendedCarrier || "").toLowerCase();
  const isSeparatedCarrier = carrierLower.includes("이야기") || carrierLower.includes("eyagi");
  const showUnifiedRecommendation = !isSeparatedCarrier;

  const recommendedMobilePlan = selectedPlan.mobilePlan || selectedPlanName || "알뜰폰 맞춤형 실속 요금제";
  const recommendedInternetPlan = selectedPlan.internetPlan || "기가 인터넷 (500M)";
  const recommendedTvPlan = selectedPlan.tvPlan || "UHD TV 요금제";

  const recommendedBundleType = (carrierLower.includes("헬로비전") || carrierLower.includes("스카이라이프") || carrierLower.includes("hello") || carrierLower.includes("skylife"))
    ? "알뜰 전체 결합 패키지"
    : "대기업 전체 결합 패키지";

  const signupBenefit = (carrierLower.includes("헬로비전") || carrierLower.includes("스카이라이프") || carrierLower.includes("hello") || carrierLower.includes("skylife"))
    ? "최대 47만원 상품권 + 추가 요금할인"
    : "최대 47만원 상당 현금/상품권 지원";

  // 2. 추천 지향점 (Recommendation Goal)
  const desiredCompanyType = answers["bundle.desiredCompanyType"] as string;
  let recommendationGoalText = "";
  if (desiredCompanyType === "mvno") {
    recommendationGoalText = "알뜰폰·케이블 최저가 위주로 추천해드려요";
  } else if (desiredCompanyType === "mno") {
    recommendationGoalText = "메이저 3사 결합 위주로 추천해드려요";
  } else {
    recommendationGoalText = "위약금을 내고 갈아타도 진짜 이득인지 비교해드려요";
  }

  // 3. 고객의 통신 성향 매칭 (Customer Telecom Disposition Matching)
  let dispositionMatchingText = "";
  if (desiredCompanyType === "mvno") {
    dispositionMatchingText = "유저님은 통신사에 매달 꼬박꼬박 나가는 고정 지출을 싹 걷어내고 내 지갑의 실속을 챙기는 고정 비용 최소화를 가장 중요하게 생각하시는 극강의 가성비파 성향이시군요! 매달 지출 부담을 가장 획기적으로 낮춰줄 최적의 절약 세트를 제안합니다.";
  } else if (desiredCompanyType === "mno") {
    dispositionMatchingText = "유저님은 여기저기 찢어져서 머리 아픈 것보다 하나로 깔끔하게 묶어 알아서 혜택이 커지는 [품질 및 결합 혜택 우선] 지향점을 선택하셨군요! 기존 통신망의 안정적인 품질은 유지하면서 결합 시너지를 극대화할 수 있는 안전한 맞춤 조합을 제안합니다.";
  } else {
    dispositionMatchingText = "유저님은 겉으로 보이는 위약금의 압박에 흔들리지 않고, 갈아탔을 때 내 지갑에 들어오는 순수 보너스가 더 큰지 따져보는 [위약금 대비 실질 이득 우선] 성향이시군요! 환승 리워드로 패널티를 완벽하게 상쇄하고도 넘는 가장 똑똑한 전환 타이밍 솔루션을 제안합니다.";
  }

  // Check if current contract is expired
  const allContract = answers["bundle.allContract"] as string;
  const partSelectVal = answers["bundle.partSelect"] as string || "pta";
  const partContract = answers[`bundle.${partSelectVal}Contract`] as string;
  const diffContract = answers["bundle.diffContract"] as string;
  const isExpired =
    allContract === "만료" ||
    partContract === "만료" ||
    diffContract === "만료" ||
    allContract === "expired" ||
    partContract === "expired" ||
    diffContract === "expired";

  // Payback period
  const paybackPeriod = monthlySaving > 0 && penaltyAmount > 0
    ? Math.ceil(penaltyAmount / monthlySaving)
    : 0;

  // One line diagnosis
  let oneLineDiagnosis = "";
  if (isNewStart) {
    oneLineDiagnosis = "결합을 변경하면 절감 효과가 큽니다.";
  } else if (currentFee <= selectedPrice) {
    if (isExpired) {
      oneLineDiagnosis = "요금은 저렴하나 타사 환승이 더 유리합니다.";
    } else {
      oneLineDiagnosis = "현재 요금제를 그대로 유지하는 것이 유리합니다.";
    }
  } else {
    // Recommended is cheaper
    if (!knowPenalty) {
      oneLineDiagnosis = "위약금 확인 후 즉시 변경을 추천합니다.";
    } else if (penaltyAmount === 0 || isExpired) {
      oneLineDiagnosis = "지금 갈아타는 것이 가장 유리합니다.";
    } else {
      if (paybackPeriod <= 6) {
        oneLineDiagnosis = "지금 갈아타는 것이 가장 유리합니다.";
      } else {
        oneLineDiagnosis = "위약금 부담으로 당분간 유지가 유리합니다.";
      }
    }
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-gradient-to-b from-card to-background p-6 shadow-md transition-all hover:shadow-lg space-y-6">

      {/* 1. 상단 타이틀 */}
      <div className="flex flex-col gap-2 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
            결합상품 분석 솔루션
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
            <Sparkles size={12} /> 요금 비교·추천 솔루션
          </span>
        </div>
      </div>

      {/* 현재 결합 요금제 안내 및 추천 지향점 */}
      <div className="rounded-xl bg-muted/20 p-4 border border-border/40 text-xs sm:text-sm space-y-3">
        <div>
          <span className="font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">현재 상태 요약 ({currentStateSummaryTitle})</span>
          <p className="font-black text-primary leading-relaxed">
            {currentStateGuidance}
          </p>
        </div>
        <div className="border-t border-border/30 pt-2">
          <span className="font-extrabold text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">추천 지향점</span>
          <p className="font-black text-indigo-600 dark:text-indigo-400 leading-relaxed">
            {desiredCompanyTypeLabel} - <span className="text-primary font-medium">{recommendationGoalText}</span>
          </p>
        </div>
      </div>

      {/* 2. 고객의 통신 성향 매칭 */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs sm:text-sm">
        <h5 className="font-extrabold text-indigo-700 dark:text-indigo-300">고객의 통신 성향 매칭</h5>
        <p className="mt-2 leading-relaxed text-primary font-semibold">{dispositionMatchingText}</p>
      </div>

      {/* 3. 요금 비교 카드 */}
      <div>
        <h5 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-3">요금 비교 리포트</h5>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 왼쪽 카드 - 유저의 현재 요약 */}
          {startState === "all_same" ? (
            /* 통합 카드 */
            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/10 p-4">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE (통합)</span>
              <div className="space-y-1.5 text-xs text-primary mt-2">
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">현재 통신사</span>
                  <span className="font-extrabold">{currentCarrierLabel}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">결합 형태</span>
                  <span className="font-bold text-accent">{currentStateComposition}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">결합 인원</span>
                  <span className="font-bold">{currentMembers}명</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">모바일 요금제</span>
                  <span className="font-bold truncate max-w-[150px]">{allMobilePlanText}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground shrink-0">인터넷+IPTV 상품</span>
                  <span className="font-bold text-right ml-2">{allInternetPlanText} + {allTvPlanText}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">할인 정보</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{allDiscountText}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">약정 상태</span>
                  <span className="font-bold">{allContractText}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-1">
                  <span className="text-muted-foreground">위약금</span>
                  <span className="font-extrabold text-amber-600">{penaltyAmount > 0 ? `${fmt(penaltyAmount)}원` : "0원"}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground text-sm font-bold">월 납부 요금</span>
                  <span className="text-sm font-black text-primary">{fmt(currentFee)}원</span>
                </div>
              </div>
            </div>
          ) : startState === "part_same" ? (
            /* 분리 카드 */
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE (분리)</span>
              
              {/* 모바일 개별 카드 */}
              <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-accent border-b border-border/30 pb-0.5 mb-1">
                  <span>모바일</span>
                  <span>{answers["bundle.ptaCarrier"] || answers["bundle.ptbCarrier"] || answers["bundle.ptcCarrier"] || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">요금제</span>
                  <span className="font-bold truncate max-w-[150px]">{partMobilePlanText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">할인 정보</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{partDiscountText}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">약정 상태</span>
                  <span className="font-bold">{partContractText}</span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-extrabold">
                  <span>월 요금</span>
                  <span>{fmt(Number(answers["bundle.ptaMobileFee"] || answers["bundle.ptbMobileFee"] || answers["bundle.ptcMobileFee"] || 0))}원</span>
                </div>
              </div>

              {/* 인터넷+TV 상품 */}
              <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-accent border-b border-border/30 pb-0.5 mb-1">
                  <span>인터넷+TV 상품</span>
                  <span>{answers["bundle.ptaComboCarrier"] || answers["bundle.ptbComboCarrier"] || answers["bundle.ptcComboCarrier"] || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground shrink-0">인터넷+IPTV 상품</span>
                  <span className="font-bold text-right ml-2">
                    {partInternetPlanText}
                    {partSelect !== "ptb" && ` + ${partTvPlanText}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">약정 상태</span>
                  <span className="font-bold">{getCustomContractText(answers[`bundle.${partSelect}ComboContract`] as string)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">위약금</span>
                  <span className="font-extrabold text-amber-600">{penaltyAmount > 0 ? `${fmt(penaltyAmount)}원` : "0원"}</span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-extrabold">
                  <span>월 요금</span>
                  <span>{fmt(Number(answers["bundle.ptaComboFee"] || answers["bundle.ptbComboFee"] || answers["bundle.ptcComboFee"] || 0))}원</span>
                </div>
              </div>

              <div className="flex justify-between pt-1 border-t border-border/30 mt-1 font-extrabold">
                <span className="text-muted-foreground text-sm font-bold">월 납부 요금</span>
                <span className="text-sm font-black text-primary">{fmt(currentFee)}원</span>
              </div>
            </div>
          ) : (
            /* 개별 카드 */
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/10 p-4">
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase">CURRENT STATE (개별)</span>

              {/* 모바일 개별 카드 */}
              <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-accent border-b border-border/30 pb-0.5 mb-1">
                  <span>모바일</span>
                  <span>{answers["bundle.newACarrier"] || answers["bundle.newBCarrier"] || answers["bundle.diffCarrier"] || "선택됨"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">요금제</span>
                  <span className="font-bold truncate max-w-[120px]">{answers["bundle.diffMobilePlan"] || answers["bundle.newAMobilePlan"] || answers["bundle.newBMobilePlan"] || "기본 요금제"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">데이터</span>
                  <span className="font-bold">{desiredDataLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">할인</span>
                  <span className="font-bold text-emerald-600">개별 할인 적용</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">약정</span>
                  <span className="font-bold">{getContractLabel(answers["bundle.diffContract"] || answers["bundle.newAContract"] || answers["bundle.newBContract"])}</span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-extrabold">
                  <span>월 요금</span>
                  <span>{fmt(answers["bundle.diffMobileFee"] || answers["bundle.newAMobileFee"] || answers["bundle.newBMobileFee"] || 0)}원</span>
                </div>
              </div>

              {/* 인터넷 개별 카드 */}
              {startState === "all_diff" && answers["bundle.diffInternetFee"] && (
                <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-accent border-b border-border/30 pb-0.5 mb-1">
                    <span>인터넷</span>
                    <span>{answers["bundle.diffInternetCarrier"] || "선택됨"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품명</span>
                    <span className="font-bold truncate max-w-[120px]">{answers["bundle.diffInternetProduct"] || "초고속 인터넷"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">속도</span>
                    <span className="font-bold">{desiredSpeedLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">약정</span>
                    <span className="font-bold">{getContractLabel(answers["bundle.diffInternetContract"])}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-extrabold">
                    <span>월 요금</span>
                    <span>{fmt(answers["bundle.diffInternetFee"] || 0)}원</span>
                  </div>
                </div>
              )}

              {/* IPTV 개별 카드 */}
              {startState === "all_diff" && answers["bundle.diffTvFee"] && (
                <div className="rounded-lg border border-border/40 bg-card p-3 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-accent border-b border-border/30 pb-0.5 mb-1">
                    <span>IPTV</span>
                    <span>{answers["bundle.diffTvCarrier"] || "선택됨"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상품명</span>
                    <span className="font-bold truncate max-w-[120px]">{answers["bundle.diffTvProduct"] || "IPTV 기본형"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">약정</span>
                    <span className="font-bold">{getContractLabel(answers["bundle.diffTvContract"])}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1 mt-1 font-extrabold">
                    <span>월 요금</span>
                    <span>{fmt(answers["bundle.diffTvFee"] || 0)}원</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between border-t border-border/30 pt-2 mt-1 font-extrabold">
                <span className="text-muted-foreground text-sm font-bold">월 납부 요금</span>
                <span className="text-sm font-black text-primary">{fmt(currentFee)}원</span>
              </div>
            </div>
          )}

          {/* 오른쪽 카드 - AI가 유저의 성향에 맞게 추천하는 상품의 요약 */}
          {showUnifiedRecommendation ? (
            /* 통합 추천 카드 */
            <div className="relative rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 shadow-sm">
              <div className="absolute -top-2.5 right-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
                SELECTED SPEC
              </div>
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase">AI RECOMMENDED (통합)</span>

              <div className="space-y-1.5 text-xs text-indigo-900 dark:text-indigo-200 mt-2">
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 통신사</span>
                  <span className="font-extrabold">{recommendedCarrierLabel}</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 결합 형태</span>
                  <span className="font-bold text-accent">{recommendedBundleType}</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 모바일</span>
                  <span className="font-bold truncate max-w-[150px]">{recommendedMobilePlan}</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 인터넷</span>
                  <span className="font-bold">{recommendedInternetPlan}</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">추천 IPTV</span>
                  <span className="font-bold">{recommendedTvPlan}</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">가입 혜택</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{signupBenefit}</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">월 절감액</span>
                  <span className="font-extrabold text-emerald-600">{fmt(monthlySaving)}원</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">연 절감액</span>
                  <span className="font-extrabold text-emerald-600">{fmt(yearlySaving)}원</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">손익분기점</span>
                  <span className="font-bold text-primary">{paybackPeriod > 0 ? `${paybackPeriod}개월` : "즉시 이득"}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground text-sm font-bold">예상 월 요금</span>
                  <span className="text-sm font-black text-indigo-600">{fmt(selectedPrice)}원</span>
                </div>
              </div>
            </div>
          ) : (
            /* 분리 추천 카드 */
            <div className="relative rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 shadow-sm flex flex-col gap-3">
              <div className="absolute -top-2.5 right-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-black text-white shadow-sm">
                SELECTED SPEC
              </div>
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase">AI RECOMMENDED (분리)</span>

              {/* 모바일 추천 */}
              <div className="rounded-lg border border-indigo-500/20 bg-card p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-indigo-600 border-b border-indigo-500/10 pb-0.5 mb-1">
                  <span>추천 모바일</span>
                  <span>{recommendedCarrierLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">추천 요금제</span>
                  <span className="font-bold truncate max-w-[120px]">{recommendedMobilePlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">데이터</span>
                  <span className="font-bold">{desiredDataLabel}</span>
                </div>
                <div className="flex justify-between border-t border-indigo-500/10 pt-1 mt-1 font-extrabold">
                  <span>월 요금</span>
                  <span>{fmt(Math.round(selectedPrice * 0.4))}원</span>
                </div>
              </div>

              {/* 인터넷 + IPTV 추천 */}
              <div className="rounded-lg border border-indigo-500/20 bg-card p-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-indigo-600 border-b border-indigo-500/10 pb-0.5 mb-1">
                  <span>인터넷 + IPTV</span>
                  <span>{recommendedCarrierLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">인터넷</span>
                  <span className="font-bold">{recommendedInternetPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IPTV</span>
                  <span className="font-bold">{recommendedTvPlan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">속도</span>
                  <span className="font-bold">{desiredSpeedLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wi-Fi</span>
                  <span className="font-bold">기가 와이파이 기본 제공</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">셋톱박스</span>
                  <span className="font-bold">최신 스마트 셋톱박스 무료</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">가입 혜택</span>
                  <span className="font-bold text-emerald-600">최대 47만원 상당 현금/상품권 지원</span>
                </div>
                <div className="flex justify-between border-t border-indigo-500/10 pt-1 mt-1 font-extrabold">
                  <span>월 요금</span>
                  <span>{fmt(Math.round(selectedPrice * 0.6))}원</span>
                </div>
              </div>

              {/* 분리 추천 요약 */}
              <div className="border-t border-indigo-500/15 pt-2 mt-1 space-y-1.5 text-xs text-indigo-900 dark:text-indigo-200">
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">월 절감액</span>
                  <span className="font-extrabold text-emerald-600">{fmt(monthlySaving)}원</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">연 절감액</span>
                  <span className="font-extrabold text-emerald-600">{fmt(yearlySaving)}원</span>
                </div>
                <div className="flex justify-between border-b border-indigo-500/10 pb-1">
                  <span className="text-muted-foreground">손익분기점</span>
                  <span className="font-bold text-primary">{paybackPeriod > 0 ? `${paybackPeriod}개월` : "즉시 이득"}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground text-sm font-bold">예상 월 요금</span>
                  <span className="text-sm font-black text-indigo-600">{fmt(selectedPrice)}원</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. AI 분석 */}
      <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-500" size={16} />
          <span className="text-sm font-black text-primary">AI 진단 및 분석</span>
        </div>
        <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4 text-xs sm:text-sm space-y-2">
          <div className="flex justify-between border-b border-indigo-500/15 pb-1.5">
            <span className="text-muted-foreground font-bold">한줄 진단</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">{oneLineDiagnosis}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-indigo-500/15 pb-1.5">
            <span className="text-muted-foreground font-bold">추천 이유</span>
            <ul className="list-disc pl-4 space-y-0.5 font-medium text-primary">
              {monthlySaving > 0 ? (
                <li>현재보다 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span> 절약됩니다.</li>
              ) : (
                <li>현재 요금이 최적화된 최저가 수준으로 매우 저렴합니다.</li>
              )}
              {paybackPeriod > 0 && (
                <li>위약금은 <span className="font-black text-amber-600">{paybackPeriod}개월</span>이면 회수 가능합니다.</li>
              )}
              <li>품질은 현재와 비슷한 수준입니다.</li>
            </ul>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted-foreground font-bold">주요 지표</span>
            <div className="text-right space-y-0.5 font-medium">
              <div>절감액: <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span> (Base)</div>
              <div>연 절감액: <span className="font-black text-emerald-600">{fmt(yearlySaving)}원</span></div>
              <div>손익분기점: <span className="font-black text-indigo-600">{paybackPeriod > 0 ? `${paybackPeriod}개월` : "즉시 이득 (0개월)"}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 손익계산 */}
      <div className="border-t border-border/40 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" size={16} />
          <span className="text-sm font-black text-primary">손익계산 및 종합 솔루션</span>
        </div>
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-xs sm:text-sm">
          {currentFee <= selectedPrice ? (
            /* Case 1: Current plan is cheaper */
            isExpired ? (
              /* Case 1A: Cheaper but no contract (expired) */
              <p className="leading-relaxed text-primary/90 font-medium">
                현재 이용 중이신 요금제(월 <span className="font-black text-indigo-600">{fmt(currentFee)}원</span>)가 추천드리는 AI 상품(월 <span className="font-black text-indigo-600">{fmt(selectedPrice)}원</span>)보다 월 요금 기준으로는 더 저렴합니다. 따라서 매달 나가는 고정비 관점에서는 현재 요금제를 잘 유지하고 계신 상태입니다.
                <br /><br />
                다만, 현재 <strong>약정이 만료된 무약정 상태</strong>이므로, 지금 다른 통신사 상품으로 변경하시면 요금이 약간 차이 나더라도 <strong>최대 47만원 상당의 가입 사은품 혜택 및 현금 리워드</strong>를 챙기실 수 있습니다! 장기적인 총 지출 관점에서는 신규 가입 혜택을 챙겨 갈아타시는 것이 최종적으로 유저님께 <strong>더 큰 경제적 이득</strong>이 될 수 있으니 신중히 고려해 보시기를 적극 추천합니다.
              </p>
            ) : (
              /* Case 1B: Cheaper and has contract */
              <p className="leading-relaxed text-primary/90 font-medium">
                유저님이 현재 납부 중이신 요금제(월 <span className="font-black text-emerald-600">{fmt(currentFee)}원</span>)는 추천드리는 AI 최저가 요금제 조합(월 <span className="font-black text-indigo-600">{fmt(selectedPrice)}원</span>)보다도 저렴하여, <strong>기존 결합 할인을 극대화하여 가장 알뜰하게 이용하고 계십니다!</strong>
                <br /><br />
                약정이 아직 남아있고 중도 해지 위약금도 발생하므로, 무리해서 요금제를 변경하시기보다는 <strong>현재의 결합 및 약정 상태를 그대로 쭉 유지하시는 것이 가장 현명하고 유리한 선택</strong>입니다.
              </p>
            )
          ) : (
            /* Case 2: Recommended plan is cheaper */
            !knowPenalty ? (
              /* Case 2A: Recommended cheaper but doesn't know penalty */
              <p className="leading-relaxed text-primary/90 font-medium">
                추천해 드리는 AI 상품(월 <span className="font-black text-indigo-600">{fmt(selectedPrice)}원</span>)으로 변경 시, 현재 요금제(월 <span className="font-black text-emerald-600">{fmt(currentFee)}원</span>) 대비 매달 무려 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span>을 절약할 수 있어 <strong>연간 {fmt(yearlySaving)}원</strong>의 큰 고정비 절감 효과를 기대할 수 있습니다.
                <br /><br />
                다만, <strong>현재 기존 통신사의 해지 위약금 정보를 입력하지 않으셨거나 모르는 상태</strong>로 확인됩니다. 추천 요금제가 더 저렴하므로, <strong>기존 사용 중이신 통신사 고객센터를 통해 약정 기간 상태와 정확한 해지 위약금(할인반환금)을 꼭 확인</strong>해 보시길 강력히 권장합니다. 위약금이 매월 절약액보다 작거나 가입 사은품 범위 내라면 즉시 갈아타시는 것이 절대적으로 이득입니다.
              </p>
            ) : penaltyAmount === 0 || isExpired ? (
              /* Case 2B: Recommended cheaper and no penalty/expired */
              <p className="leading-relaxed text-primary/90 font-medium">
                현재 남은 약정이 없거나 위약금이 발생하지 않아 통신사를 변경하는 즉시 지출을 획기적으로 줄일 수 있어요! 
                지금 환승하시면 매달 절약액 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span> / 연간 <span className="font-black text-emerald-600">{fmt(yearlySaving)}원</span>의 고정비를 조건 없이 고스란히 아낄 수 있습니다. 
                <br /><br />
                해지 패널티가 전혀 없는 상태이므로 미룰 이유 없이 <strong>지금 추천해 드린 상품으로 변경하시는 것이 가장 유리</strong>합니다.
              </p>
            ) : paybackPeriod <= 6 ? (
              /* Case 2C: Recommended cheaper and has penalty, but quick payback (<= 6 months) */
              <p className="leading-relaxed text-primary/90 font-medium">
                지금 통신사를 바꾸면 해지 위약금 <span className="font-black text-amber-600">{fmt(penaltyAmount)}원</span>이 발생하지만, 매달 줄어드는 요금이 무려 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span>에 달해 딱 <span className="font-black text-indigo-600">{paybackPeriod}개월</span>만 유지하면 위약금 지출을 전액 회수할 수 있습니다!
                <br /><br />
                손익분기점이 지난 이후부터는 매달 아끼는 고정비가 전부 유저님의 순수 이득으로 쌓이게 됩니다. 특히 신규 가입 시 제공되는 <strong>{signupBenefit}</strong> 혜택을 활용하시면 초기 위약금 부담을 즉시 상쇄하고도 남으므로, <strong>지금 즉시 갈아타시는 것이 가장 현명한 선택</strong>입니다.
              </p>
            ) : (
              /* Case 2D: Recommended cheaper and has penalty, but slow payback (> 6 months) */
              <p className="leading-relaxed text-primary/90 font-medium">
                추천해 드리는 AI 상품이 현재 요금제보다 저렴하여 매달 <span className="font-black text-emerald-600">{fmt(monthlySaving)}원</span>을 아낄 수 있지만, 중도 해지 시 발생하는 위약금(<span className="font-black text-amber-600">{fmt(penaltyAmount)}원</span>)이 너무 커서 이를 모두 회수하고 손익분기점에 도달하기까지 무려 <span className="font-black text-indigo-600">{paybackPeriod}개월</span>이나 걸립니다.
                <br /><br />
                지금 당장 해지하여 환승하는 것은 오히려 단기적인 금전 손실을 유발하므로, <strong>현재 결합상품을 일단 그대로 유지</strong>하시길 권장합니다. 약정 만료일이 6개월 이하로 남아서 위약금이 대폭 줄어드는 시점에 다시 환승 진단을 받아보시는 것이 훨씬 더 현명합니다.
              </p>
            )
          )}
        </div>
      </div>

      {/* 4. 부가서비스 링크 버튼 */}
      <div className="flex flex-col gap-2.5">
        <a
          href={getCarrierLinkUrl(recommendedCarrier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-surface py-3 text-xs font-black text-brand-surface-foreground shadow-sm transition-all hover:bg-brand-surface/90 hover:scale-[1.01] active:scale-[0.99]"
        >
          {recommendedCarrierLabel} 결합상품 할인 혜택 및 상세 조건 확인 <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-center text-muted-foreground/60 leading-normal">
          본 리포트는 고객님이 입력하신 정보를 바탕으로 모잇(MOIT)에서 계산한 참고용 자료입니다. 실제 가입 시점의 결합 조건 및 프로모션에 따라 다를 수 있습니다.
        </p>
      </div>

    </div>
  );
}
