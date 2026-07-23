import React from "react";
import { ShieldAlert, Sparkles, ExternalLink, Wifi } from "lucide-react";
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

const renderGuidance = (text: string) => {
  const parts = text.split(/(\[.*?\])/);
  return parts.map((part, i) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      return (
        <span key={i} className="text-[#1E3ABA] font-bold">
          {part}
        </span>
      );
    }
    return part;
  });
};

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
  const getContractLabel = (val: any) => {
    if (!val) return "확인 불가";
    const str = String(val).trim();
    if (str === "만료" || str === "expired" || str.includes("만료")) return "약정 만료";
    if (str === "남음" || str === "remaining" || str.includes("남음")) return "약정 있음";
    if (str === "모름" || str === "unknown" || str.includes("모름")) return "확인 불가";
    return str;
  };

  // 1. 현재 상태 요약 (Current State Summary)
  let currentStateSummaryTitle = "";
  let currentStateComposition = "";
  let currentStateGuidance = "";

  if (startState === "all_same") {
    currentStateSummaryTitle = "전부 같아요";
    currentStateComposition = "모바일+인터넷+IPTV";
    currentStateGuidance = "지금은 스마트폰, 인터넷, IPTV를 한 번에 묶어 알차게 이용하시는 [전부 결합] 상태네요!";
  } else if (startState === "part_same") {
    currentStateSummaryTitle = "일부만 같아요";
    const partSelect = answers["bundle.partSelect"] as string;
    if (partSelect === "pta") {
      currentStateComposition = "모바일(개인)/인터넷+IPTV";
      currentStateGuidance = "지금은 내 스마트폰 요금과 집 인터넷·TV 요금이 따로 나뉘어 있는 [모바일/홈 개별 결합] 상태네요!";
    } else if (partSelect === "ptc") {
      currentStateComposition = "모바일(다인)/인터넷+IPTV";
      currentStateGuidance = "지금은 다인 모바일 결합과 집 인터넷·TV 결합이 서로 각각 따로 설정된 [그룹 분리 결합] 상태예요!";
    } else if (partSelect === "ptb") {
      currentStateComposition = "모바일 인터넷/IPTV";
      currentStateGuidance = "지금은 스마트폰과 인터넷 위주로 단단하게 묶여 있는 [모바일+인터넷 결합] 상태예요!";
    } else {
      currentStateComposition = "일부 결합";
      currentStateGuidance = "지금은 이용 중이신 상품 중 일부만 결합 혜택을 받고 계신 상태네요!";
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

    let cleanId = comboId;
    if (comboId.startsWith("skt-home-")) cleanId = comboId.replace("skt-home-", "");
    else if (comboId.startsWith("kt-home-")) cleanId = comboId.replace("kt-home-", "");
    else if (comboId.startsWith("lgu-home-")) cleanId = comboId.replace("lgu-home-", "");
    else if (comboId.includes("_")) {
      const parts = comboId.split("_");
      cleanId = parts[1] || comboId;
    }

    const combo = MOCK_PLAN_COMBINATIONS.find((c) => c.id === cleanId || c.id === comboId);
    if (combo) {
      return {
        internet: combo.internetPlan,
        tv: combo.tvPlan.replace(/\s*\(인터넷\+TV 결합:\s*[\d,]+원\)/g, "").replace(/\s*\(인터넷결합\)/g, "").replace(/\s*\([\d,]+원\)/g, "").trim()
      };
    }

    const skyHome = mockMvnoHomeBundles.find((h) => h.id === cleanId || h.id === comboId);
    if (skyHome) {
      return {
        internet: skyHome.internetName,
        tv: skyHome.tvName
      };
    }

    const sktHome = mockSktHomeBundles.find((h) => h.id === cleanId || h.id === comboId);
    if (sktHome) {
      return {
        internet: sktHome.internetName,
        tv: sktHome.tvName
      };
    }

    const lguHome = mockLguHomeBundles.find((h) => h.id === cleanId || h.id === comboId);
    if (lguHome) {
      return {
        internet: lguHome.internetName,
        tv: lguHome.tvName
      };
    }

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
    if (!discounts) return "할인 없음";
    const arr = Array.isArray(discounts) ? discounts : [String(discounts)];
    const formatted: string[] = [];
    if (arr.includes("선택약정")) formatted.push("선택약정 25%");
    if (arr.includes("가족결합")) formatted.push("가족 결합");
    if (formatted.length > 0) return formatted.join(", ");
    if (arr.includes("no-discount") || arr.includes("모름")) return "할인 없음";
    return "할인 없음";
  };

  const getCustomContractText = (val: any) => {
    if (!val) return "확인 불가";
    const str = String(val).trim();
    if (str === "만료" || str === "expired" || str.includes("만료")) return "약정 만료";
    if (str === "남음" || str === "remaining" || str.includes("남음")) return "약정 있음";
    if (str === "모름" || str === "unknown" || str.includes("모름")) return "확인 불가";
    return str;
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
  const allMobilePlanId = answers["bundle.allPlanCheck"] || answers["bundle.allPlanCheckList"];
  const allMobilePlanText = resolvePlanName(allMobilePlanId) || answers["bundle.allMobilePlan"] || "모바일 요금제";

  const allComboId = answers["bundle.allComboPlanCheck"] || answers["bundle.allComboPlanCheckList"];
  const allComboDetails = getComboDetails(allComboId);
  const allInternetPlanText = allComboDetails.internet || answers["bundle.allInternetProduct"] || "초고속 인터넷";
  const allTvPlanText = allComboDetails.tv || answers["bundle.allTvProduct"] || "IPTV 일반형";

  const allDiscountText = getDiscountText(answers["bundle.allDiscount"]);
  const allContractText = getCustomContractText(answers["bundle.allContract"] as string);

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

  // Calculate savings & Payback & Net Benefit (36개월 약정 기준 계산)
  const monthlySaving = Math.max(0, currentFee - selectedPrice);
  const yearlySaving = monthlySaving * 12;

  // Payback period (위약금 회수 기간)
  const paybackPeriod = monthlySaving > 0 && penaltyAmount > 0
    ? Math.ceil(penaltyAmount / monthlySaving)
    : 0;

  // netBenefit: 3년(36개월) 기준 총 아끼는 돈에서 위약금을 차감한 '순수 이득금액'
  const netBenefit = Math.max(0, (monthlySaving * 36) - penaltyAmount);

  // 약정 기간 남음 판별
  const currentContractStringLocal = currentContractString;
  const isRemaining = answers["bundle.allContract"] === "남음" ||
    answers["bundle.ptaContract"] === "남음" || answers["bundle.ptaComboContract"] === "남음" ||
    answers["bundle.ptbContract"] === "남음" || answers["bundle.ptbComboContract"] === "남음" ||
    answers["bundle.ptcContract"] === "남음" || answers["bundle.ptcComboContract"] === "남음" ||
    answers["bundle.diffContract"] === "남음" || answers["bundle.diffInternetContract"] === "남음" || answers["bundle.diffTvContract"] === "남음" ||
    answers["bundle.newAContract"] === "남음" || answers["bundle.newBContract"] === "남음" ||
    currentContractStringLocal.includes("남음");

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

  // 2. 추천 지향점
  const desiredCompanyType = answers["bundle.desiredCompanyType"] as string;

  // 3. 고객의 통신 성향 매칭
  let dispositionMatchingText = "";
  if (desiredCompanyType === "mvno") {
    dispositionMatchingText = "유저님은 매달 꼬박꼬박 나가는 통신비를 싹 줄이고, 내 지갑의 실속을 챙기는 걸 제일 중요하게 생각하시는 '극강의 가성비파' 성향이시군요! 💰✨\n매달 지출 부담을 획기적으로 낮춰줄 가장 알찬 절약 세트를 제안해 드려요! 👍";
  } else if (desiredCompanyType === "mno") {
    dispositionMatchingText = "유저님은 복잡하게 나뉘는 것보다 하나로 깔끔하게 묶어서 알아서 혜택이 커지는 '품질&결합 혜택 우선' 성향이시군요! ⚡📶\n통신 3사의 안정적인 품질은 그대로 유지하면서, 결합 시너지를 극대화할 수 있는 안전한 맞춤 조합을 제안해 드려요! 👍";
  } else {
    dispositionMatchingText = "유저님은 겉으로 보이는 위약금에 흔들리지 않고, 갈아탔을 때 내 지갑에 돌아오는 진짜 이득을 계산해보는 '실속파 스마트 환승' 성향이시군요! 💡🎯\n위약금을 완벽히 넘어서는 혜택으로, 지금 갈아타도 확실히 남는 장사가 되는 최적의 타이밍 솔루션을 제안해 드려요! 👍";
  }

  // Check if current contract is expired
  const allContract = answers["bundle.allContract"] as string;
  const partSelectVal = answers[`bundle.partSelect`] as string || "pta";
  const partContract = answers[`bundle.${partSelectVal}Contract`] as string;
  const diffContract = answers["bundle.diffContract"] as string;
  const isExpired =
    allContract === "만료" ||
    partContract === "만료" ||
    diffContract === "만료" ||
    allContract === "expired" ||
    partContract === "expired" ||
    diffContract === "expired";

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
    <div className="w-full max-w-2xl rounded-2xl border border-[#2A6CB6]/20 bg-white p-6 shadow-md transition-all hover:shadow-lg space-y-6 text-[#1F2937]">

      {/* 1. 상단 타이틀 Header */}
      <div className="flex flex-col border-b border-gray-100 pb-5">
        <div className="mb-[12px]">
          <span className="inline-flex items-center gap-[6px] py-[4px] px-[12px] rounded-[20px] bg-[#E1F5EE]">
            <Wifi size={14} className="text-[#0F766E]" />
            <span className="text-[12px] font-medium text-[#0F766E]">인터넷·결합 분석</span>
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-[#1E3ABA] mt-0 mb-[4px]">
          요금 비교 · 추천 솔루션
        </h1>
        <p className="text-[13px] font-normal text-[#6B7280] mb-[20px]">
          선택하신 조건 기반 맞춤 분석 리포트
        </p>
      </div>

      {/* 인사이트 박스 */}
      <div className="bg-[#2A6CB6]/5 border border-[#2A6CB6]/20 border-l-[3px] border-l-[#2A6CB6] rounded-r-[8px] rounded-l-none p-[12px_16px]">
        <p className="text-[14px] font-medium text-[#1F2937] leading-[1.5]">
          {renderGuidance(currentStateGuidance)}
        </p>
      </div>

      {/* 2. 모잇이 분석한 유저님의 소비 스타일 💡 */}
      <div className="rounded-xl border border-[#2A6CB6]/20 bg-[#2A6CB6]/5 p-4 text-xs sm:text-sm space-y-3">
        <h5 className="font-bold text-[#1E3ABA] text-sm">
          모잇이 분석한 유저님의 소비 스타일 💡
        </h5>
        <p className="leading-relaxed text-[#1F2937] font-medium">
          유저님은{" "}
          <span className="font-bold text-[#1E3ABA]">
            {desiredCompanyType === "mvno"
              ? "고정 비용 최소화 추천"
              : desiredCompanyType === "mno"
                ? "품질 및 결합 혜택 우선 추천"
                : "위약금 대비 실질 이득 추천"}
          </span>
          {desiredCompanyType === "mvno"
            ? "을 받으셨어요! 매달 들어가는 통신비를 짠테크처럼 똑똑하게 줄이는 걸 선호하시네요! 💰✨"
            : desiredCompanyType === "mno"
              ? "을 받으셨어요! 통신 3사의 빵빵한 결합 혜택과 속속들이 막힘없는 품질을 최우선으로 생각하시네요! ⚡📶"
              : "을 받으셨어요! 약정 승계나 위약금을 떼고도 최종적으로 이득이 되는 알짜 선택을 원하시네요! 🔍🎯"}
        </p>
        <p className="leading-relaxed text-[#6B7280] font-normal whitespace-pre-line border-t border-[#2A6CB6]/10 pt-2.5">
          {dispositionMatchingText}
        </p>
      </div>

      {/* 3. 요금 비교 카드 */}
      <div>
        <h5 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mb-3">요금 비교 리포트</h5>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 왼쪽 카드 - 유저의 현재 요약 (흰색 배경 + 회색 테두리) */}
          {startState === "all_same" ? (
            <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 h-full shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase">현재 사용 중인 요금 (통합)</span>
                <div className="space-y-1.5 text-xs text-[#1F2937] mt-2">
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-[#6B7280]">현재 통신사</span>
                    <span className="font-medium text-[#1F2937]">{currentCarrierLabel}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-[#6B7280]">결합 형태</span>
                    <span className="font-medium text-[#2A6CB6]">{currentStateComposition}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-[#6B7280]">결합 인원</span>
                    <span className="font-medium text-[#1F2937]">{currentMembers}명</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-[#6B7280]">모바일 요금제</span>
                    <span className="font-medium text-[#1F2937] truncate max-w-[150px]">{allMobilePlanText}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-[#6B7280] shrink-0">인터넷+IPTV 상품</span>
                    <span className="font-medium text-[#1F2937] text-right ml-2">{allInternetPlanText} + {allTvPlanText}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-[#6B7280]">할인 정보</span>
                    <span className="font-medium text-[#0F766E]">{allDiscountText}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-[#6B7280]">약정 상태</span>
                    <span className="font-medium text-[#1F2937]">{allContractText}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-[#6B7280]">위약금</span>
                    <span className="font-medium text-[#1F2937]">{penaltyAmount > 0 ? `${fmt(penaltyAmount)}원` : "0원"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t border-gray-200 pt-2 mt-3">
                <span className="text-[#6B7280] text-sm font-bold">월 납부 요금</span>
                <span className="text-sm font-bold text-[#1F2937]">{fmt(currentFee)}원</span>
              </div>
            </div>
          ) : startState === "part_same" ? (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 h-full shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase">현재 사용 중인 요금 (분리)</span>

                {/* 모바일 개별 카드 */}
                <div className="rounded-lg border border-gray-200 bg-[#F5F7FA] p-3 space-y-1 text-xs mt-2">
                  <div className="flex justify-between font-bold text-[#2A6CB6] border-b border-gray-200 pb-0.5 mb-1">
                    <span>모바일</span>
                    <span>{answers["bundle.ptaCarrier"] || answers["bundle.ptbCarrier"] || answers["bundle.ptcCarrier"] || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">요금제</span>
                    <span className="font-medium text-[#1F2937] truncate max-w-[150px]">{partMobilePlanText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">할인 정보</span>
                    <span className="font-medium text-[#0F766E]">{partDiscountText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">약정 상태</span>
                    <span className="font-medium text-[#1F2937]">{partContractText}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-bold text-[#1F2937]">
                    <span>월 요금</span>
                    <span>{fmt(Number(answers["bundle.ptaMobileFee"] || answers["bundle.ptbMobileFee"] || answers["bundle.ptcMobileFee"] || 0))}원</span>
                  </div>
                </div>

                {/* 인터넷+TV 상품 */}
                <div className="rounded-lg border border-gray-200 bg-[#F5F7FA] p-3 space-y-1 text-xs mt-2">
                  <div className="flex justify-between font-bold text-[#2A6CB6] border-b border-gray-200 pb-0.5 mb-1">
                    <span>인터넷+TV 상품</span>
                    <span>{answers["bundle.ptaComboCarrier"] || answers["bundle.ptbComboCarrier"] || answers["bundle.ptcComboCarrier"] || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280] shrink-0">인터넷+IPTV 상품</span>
                    <span className="font-medium text-[#1F2937] text-right ml-2">
                      {partInternetPlanText}
                      {partSelect !== "ptb" && ` + ${partTvPlanText}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">약정 상태</span>
                    <span className="font-medium text-[#1F2937]">{getCustomContractText(answers[`bundle.${partSelect}ComboContract`] as string)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">위약금</span>
                    <span className="font-medium text-[#1F2937]">{penaltyAmount > 0 ? `${fmt(penaltyAmount)}원` : "0원"}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-bold text-[#1F2937]">
                    <span>월 요금</span>
                    <span>{fmt(Number(answers["bundle.ptaComboFee"] || answers["bundle.ptbComboFee"] || answers["bundle.ptcComboFee"] || 0))}원</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-200 mt-3 font-bold">
                <span className="text-[#6B7280] text-sm font-bold">월 납부 요금</span>
                <span className="text-sm font-bold text-[#1F2937]">{fmt(currentFee)}원</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 h-full shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase">현재 사용 중인 요금 (개별)</span>

                <div className="rounded-lg border border-gray-200 bg-[#F5F7FA] p-3 space-y-1 text-xs mt-2">
                  <div className="flex justify-between font-bold text-[#2A6CB6] border-b border-gray-200 pb-0.5 mb-1">
                    <span>모바일</span>
                    <span>{answers["bundle.newACarrier"] || answers["bundle.newBCarrier"] || answers["bundle.diffCarrier"] || "선택됨"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">요금제</span>
                    <span className="font-medium text-[#1F2937] truncate max-w-[120px]">{answers["bundle.diffMobilePlan"] || answers["bundle.newAMobilePlan"] || answers["bundle.newBMobilePlan"] || "기본 요금제"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">데이터</span>
                    <span className="font-medium text-[#1F2937]">{desiredDataLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">할인</span>
                    <span className="font-medium text-[#0F766E]">개별 할인 적용</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">약정</span>
                    <span className="font-medium text-[#1F2937]">{getContractLabel(answers["bundle.diffContract"] || answers["bundle.newAContract"] || answers["bundle.newBContract"])}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-bold text-[#1F2937]">
                    <span>월 요금</span>
                    <span>{fmt(answers["bundle.diffMobileFee"] || answers["bundle.newAMobileFee"] || answers["bundle.newBMobileFee"] || 0)}원</span>
                  </div>
                </div>

                {startState === "all_diff" && answers["bundle.diffInternetFee"] && (
                  <div className="rounded-lg border border-gray-200 bg-[#F5F7FA] p-3 space-y-1 text-xs mt-2">
                    <div className="flex justify-between font-bold text-[#2A6CB6] border-b border-gray-200 pb-0.5 mb-1">
                      <span>인터넷</span>
                      <span>{answers["bundle.diffInternetCarrier"] || "선택됨"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">상품명</span>
                      <span className="font-medium text-[#1F2937] truncate max-w-[120px]">{answers["bundle.diffInternetProduct"] || "초고속 인터넷"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">속도</span>
                      <span className="font-medium text-[#1F2937]">{desiredSpeedLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">약정</span>
                      <span className="font-medium text-[#1F2937]">{getContractLabel(answers["bundle.diffInternetContract"])}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-bold text-[#1F2937]">
                      <span>월 요금</span>
                      <span>{fmt(answers["bundle.diffInternetFee"] || 0)}원</span>
                    </div>
                  </div>
                )}

                {startState === "all_diff" && answers["bundle.diffTvFee"] && (
                  <div className="rounded-lg border border-gray-200 bg-[#F5F7FA] p-3 space-y-1 text-xs mt-2">
                    <div className="flex justify-between font-bold text-[#2A6CB6] border-b border-gray-200 pb-0.5 mb-1">
                      <span>IPTV</span>
                      <span>{answers["bundle.diffTvCarrier"] || "선택됨"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">상품명</span>
                      <span className="font-medium text-[#1F2937] truncate max-w-[120px]">{answers["bundle.diffTvProduct"] || "IPTV 기본형"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">약정</span>
                      <span className="font-medium text-[#1F2937]">{getContractLabel(answers["bundle.diffTvContract"])}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 mt-1 font-bold text-[#1F2937]">
                      <span>월 요금</span>
                      <span>{fmt(answers["bundle.diffTvFee"] || 0)}원</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between border-t border-gray-200 pt-2 mt-3 font-bold">
                <span className="text-[#6B7280] text-sm font-bold">월 납부 요금</span>
                <span className="text-sm font-bold text-[#1F2937]">{fmt(currentFee)}원</span>
              </div>
            </div>
          )}

          {/* 오른쪽 카드 - 추천 상품 요약 (강조: bg-[#2A6CB6]/5 + border-2 border-[#1E3ABA]/30) */}
          {showUnifiedRecommendation ? (
            <div className="relative flex flex-col justify-between rounded-xl border-2 border-[#1E3ABA]/30 bg-[#2A6CB6]/5 p-4 shadow-sm h-full">
              <div>
                <div className="absolute -top-2.5 right-3 rounded-full bg-[#1E3ABA] px-2.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                  SELECTED SPEC
                </div>
                <span className="text-[10px] font-bold text-[#1E3ABA] uppercase">추천하는 요금제 (통합)</span>

                <div className="space-y-1.5 text-xs text-[#1F2937] mt-2">
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">추천 통신사</span>
                    <span className="font-bold text-[#1F2937]">{recommendedCarrierLabel}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">추천 결합 형태</span>
                    <span className="font-bold text-[#2A6CB6]">{recommendedBundleType}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">추천 모바일</span>
                    <span className="font-bold text-[#1F2937] truncate max-w-[150px]">{recommendedMobilePlan}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">추천 인터넷</span>
                    <span className="font-bold text-[#1F2937]">{recommendedInternetPlan}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">추천 IPTV</span>
                    <span className="font-bold text-[#1F2937]">{recommendedTvPlan}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">가입 혜택</span>
                    <span className="font-bold text-[#1E3ABA]">{signupBenefit}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">월 절감액</span>
                    <span className="font-black text-[#1E3ABA] text-sm">{fmt(monthlySaving)}원</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">연 절감액</span>
                    <span className="font-black text-[#1E3ABA] text-sm">{fmt(yearlySaving)}원</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/15 pb-1">
                    <span className="text-[#6B7280]">진짜 이득 시작</span>
                    <span className="font-bold text-[#2A6CB6]">{paybackPeriod > 0 ? `${paybackPeriod + 1}개월 차부터` : "교체 즉시"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t border-[#2A6CB6]/20 pt-2 mt-3">
                <span className="text-[#6B7280] text-sm font-bold">예상 월 요금</span>
                <span className="text-base font-black text-[#1E3ABA]">{fmt(selectedPrice)}원</span>
              </div>
            </div>
          ) : (
            <div className="relative rounded-xl border-2 border-[#1E3ABA]/30 bg-[#2A6CB6]/5 p-4 shadow-sm flex flex-col gap-3 h-full justify-between">
              <div>
                <div className="absolute -top-2.5 right-3 rounded-full bg-[#1E3ABA] px-2.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                  SELECTED SPEC
                </div>
                <span className="text-[10px] font-bold text-[#1E3ABA] uppercase">추천하는 요금제 (분리)</span>

                <div className="rounded-lg border border-[#2A6CB6]/20 bg-white p-3 space-y-1 text-xs mt-2">
                  <div className="flex justify-between font-bold text-[#2A6CB6] border-b border-[#2A6CB6]/10 pb-0.5 mb-1">
                    <span>추천 모바일</span>
                    <span>{recommendedCarrierLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">추천 요금제</span>
                    <span className="font-medium text-[#1F2937] truncate max-w-[120px]">{recommendedMobilePlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">데이터</span>
                    <span className="font-medium text-[#1F2937]">{desiredDataLabel}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#2A6CB6]/10 pt-1 mt-1 font-bold text-[#1F2937]">
                    <span>월 요금</span>
                    <span>{fmt(Math.round(selectedPrice * 0.4))}원</span>
                  </div>
                </div>

                <div className="rounded-lg border border-[#2A6CB6]/20 bg-white p-3 space-y-1 text-xs mt-2">
                  <div className="flex justify-between font-bold text-[#2A6CB6] border-b border-[#2A6CB6]/10 pb-0.5 mb-1">
                    <span>인터넷 + IPTV</span>
                    <span>{recommendedCarrierLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">인터넷</span>
                    <span className="font-medium text-[#1F2937]">{recommendedInternetPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">IPTV</span>
                    <span className="font-medium text-[#1F2937]">{recommendedTvPlan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">속도</span>
                    <span className="font-medium text-[#1F2937]">{desiredSpeedLabel}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#2A6CB6]/10 pt-1 mt-1 font-bold text-[#1F2937]">
                    <span>월 요금</span>
                    <span>{fmt(Math.round(selectedPrice * 0.6))}원</span>
                  </div>
                </div>

                <div className="border-t border-[#2A6CB6]/15 pt-2 mt-2 space-y-1.5 text-xs text-[#1F2937]">
                  <div className="flex justify-between border-b border-[#2A6CB6]/10 pb-1">
                    <span className="text-[#6B7280]">월 절감액</span>
                    <span className="font-black text-[#1E3ABA] text-sm">{fmt(monthlySaving)}원</span>
                  </div>
                  <div className="flex justify-between border-b border-[#2A6CB6]/10 pb-1">
                    <span className="text-[#6B7280]">진짜 이득 시작</span>
                    <span className="font-bold text-[#2A6CB6]">{paybackPeriod > 0 ? `${paybackPeriod + 1}개월 차부터` : "교체 즉시"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between border-t border-[#2A6CB6]/20 pt-2 mt-3">
                <span className="text-[#6B7280] text-sm font-bold">예상 월 요금</span>
                <span className="text-base font-black text-[#1E3ABA]">{fmt(selectedPrice)}원</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. AI 분석 & 위약금/손익 계산기 */}
      <div className="border-t border-[#2A6CB6]/20 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-[#2A6CB6]" size={16} />
          <span className="text-sm font-bold text-[#1E3ABA]">모잇 AI의 손익 진단 리포트 💡</span>
        </div>

        <div className="rounded-xl border border-[#2A6CB6]/20 bg-[#2A6CB6]/5 p-4 text-xs sm:text-sm space-y-3">

          {/* AI 분석 & 손익 진단 팁 박스 ('모잇의 팩트 체크' 박스) */}
          <div className="bg-[#A8E6CF]/30 border border-[#A8E6CF] p-3.5 rounded-xl text-xs text-[#1F2937] font-normal leading-relaxed space-y-1.5">
            <div className="font-bold text-sm text-[#1E3ABA] flex items-center gap-1">
              💬 모잇의 팩트 체크
            </div>

            {paybackPeriod > 0 ? (
              signupBenefit ? (
                <p>
                  지금 바꾸시면 이전보다 매달 <strong className="text-[#1E3ABA] font-black">{fmt(monthlySaving)}원</strong>씩 아끼실 수 있어요!
                  발생하는 위약금({fmt(penaltyAmount)}원)은 제공되는 <strong className="text-[#1E3ABA] font-black">{signupBenefit}</strong> 혜택으로 즉시 메꿀 수 있어서, 사실상 <strong className="text-[#1E3ABA] font-black">첫 달부터 바로 남는 장사</strong>예요! 💰✨
                </p>
              ) : (
                <p>
                  지금 갈아타시면 이전보다 매달 <strong className="text-[#1E3ABA] font-black">{fmt(monthlySaving)}원</strong>씩 고정비를 아끼게 돼요!
                  위약금({fmt(penaltyAmount)}원)은 <strong className="text-[#2A6CB6] font-bold">{paybackPeriod}개월</strong> 이용 시 깔끔하게 회수되고, <strong className="text-[#1E3ABA] font-black">{paybackPeriod + 1}개월 차부터는 전부 유저님의 순수익</strong>이 됩니다! 💡👍
                </p>
              )
            ) : (
              <p>
                위약금 부담이 전혀 없는 상태예요! 지금 바꾸시면 미룰 이유 없이 이전보다 매달 <strong className="text-[#1E3ABA] font-black">{fmt(monthlySaving)}원</strong> (1년에 <strong className="text-[#1E3ABA] font-black">{fmt(yearlySaving)}원</strong>)씩 바로 순수익으로 챙기실 수 있어요! 🎉
              </p>
            )}
          </div>

          {/* 와닿는 숫자로 보는 계산서 */}
          <div className="space-y-2 pt-1 font-normal text-[#1F2937]">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#6B7280]">· 현재 내는 월 통신비</span>
              <span className="font-bold text-[#1F2937]">{fmt(currentFee)}원</span>
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#6B7280]">· 앞으로 내실 월 추천 요금</span>
              <span className="font-bold text-[#1E3ABA]">{fmt(selectedPrice)}원 (매달 {fmt(monthlySaving)}원 절약)</span>
            </div>

            {penaltyAmount > 0 && (
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-[#6B7280]">· 지금 바꿀 때 발생하는 위약금</span>
                <span className="font-bold text-rose-500">-{fmt(penaltyAmount)}원 (1회성)</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs sm:text-sm border-t border-dashed border-[#2A6CB6]/20 pt-2">
              <span className="text-[#6B7280] font-bold">· 위약금 채우는 본전 기간</span>
              <span className="font-bold text-[#2A6CB6]">
                {paybackPeriod > 0 ? `${paybackPeriod}개월 이용 시 본전 완수` : "위약금 없음 (즉시 이득)"}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-[#6B7280] font-bold">· 진짜 내 주머니 이득 시작시점</span>
              <span className="font-black text-[#1E3ABA]">
                {paybackPeriod > 0 ? `👉 ${paybackPeriod + 1}개월 차부터 매달 아낀 돈 전부 순이익!` : "👉 이번 달부터 바로 순이익!"}
              </span>
            </div>
          </div>

          {/* 친근한 모잇의 팁 코멘트 */}
          <div className="bg-white border border-[#2A6CB6]/20 p-3 rounded-lg text-xs text-[#1F2937] font-normal leading-relaxed">
            💬 <strong className="text-[#2A6CB6]">모잇의 솔직 팁:</strong>{" "}
            {paybackPeriod > 0 ? (
              <>
                지금 해지하면 위약금 <strong>{fmt(penaltyAmount)}원</strong>이 나와서 당장은 아깝게 느껴지실 수 있어요. 하지만 매달 <strong>{fmt(monthlySaving)}원</strong>씩 아끼기 때문에 <strong>{paybackPeriod}개월</strong>만 지나면 위약금을 완벽히 털어내고, <strong>{paybackPeriod + 1}개월 차부터는 아낀 돈이 전부 유저님 순수 이득</strong>으로 차곡차곡 쌓여요!
              </>
            ) : (
              <>
                위약금 부담이 없거나 약정이 거의 끝난 상태예요! 지금 바꾸시면 미룰 이유 없이 매달 <strong>{fmt(monthlySaving)}원</strong>씩 고스란히 지갑을 지킬 수 있어요!
              </>
            )}
          </div>

        </div>
      </div>

      {/* 5. 부가서비스 링크 버튼 */}
      <div className="flex flex-col gap-2.5">
        <a
          href={getCarrierLinkUrl(recommendedCarrier)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#1E3ABA] hover:bg-[#2A6CB6] py-3 text-xs font-black text-white shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          {recommendedCarrierLabel} 결합상품 할인 혜택 및 상세 조건 확인 <ExternalLink size={13} />
        </a>
        <p className="text-[10px] text-center text-[#6B7280] leading-normal">
          본 리포트는 고객님이 입력하신 정보를 바탕으로 모잇(MOIT)에서 계산한 참고용 자료입니다. 실제 가입 시점의 결합 조건 및 프로모션에 따라 다를 수 있습니다.
        </p>
      </div>

    </div>
  );
}