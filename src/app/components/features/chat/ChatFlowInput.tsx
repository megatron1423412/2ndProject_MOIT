import React, { useEffect, useRef, useState } from "react";
import { Send, Star } from "lucide-react";
import type { AnswerInputStep, FlowChoiceOption, SubmittedFlowAnswer } from "../../../features/chat-flow/core/types";
import QuickReplyChips from "./QuickReplyChips";
import type { FavoriteProduct, FavoriteDraft } from "../../../features/favorites/types";
import { prefetchPlans, resolvePhoneCurrentPlanOptions } from "../../../features/chat-flow/flows/telecom/phone/flow";
import { mockLgHelloBundles, mockMvnoMobilePlans, mockEyagiSktMobilePlans, mockEyagiLguMobilePlans } from "../../../features/chat-flow/flows/telecom/bundle/MVNOmockData";
import { MOCK_PLAN_COMBINATIONS, mockBundlePlans } from "../../../features/chat-flow/flows/telecom/bundle/mockData";

/**
 * 결합 요금제 ID를 받아 해당 요금제의 데이터 스펙(예: "100GB", "무제한")을 추출하는 헬퍼 함수
 */
function getBundlePlanData(id: string): string | null {
  if (!id) return null;
  // 1. LG 헬로비전 결합 상품에서 찾기
  const hello = mockLgHelloBundles.find((b) => b.id === id);
  if (hello?.data) return hello.data;

  // 2. 알뜰폰 + 유선 결합 (구분자 '_'가 포함된 경우)
  if (id.includes("_")) {
    const [mobId] = id.split("_");
    const skyMob = mockMvnoMobilePlans.find((m) => m.id === mobId);
    if (skyMob?.data) return skyMob.data;

    const eyagiSkt = mockEyagiSktMobilePlans.find((m) => m.id === mobId);
    if (eyagiSkt?.data) return eyagiSkt.data;

    const eyagiLgu = mockEyagiLguMobilePlans.find((m) => m.id === mobId);
    if (eyagiLgu?.data) return eyagiLgu.data;
  }

  // 3. 통신 3사(MNO) 결합 상품에서 데이터 속도/제공량 찾기
  const mno = MOCK_PLAN_COMBINATIONS.find((c) => c.id === id);
  if (mno?.mobileSpeed) return mno.mobileSpeed;

  return null;
}

/**
 * 결합 요금제 ID 및 라벨을 분석하여 상품 구성(예: "모바일+인터넷+TV") 단어를 반환하는 함수
 */
function getBundleComposition(id: string, label: string = ""): string {
  if (!id) return "모바일+인터넷+TV";

  // LG 헬로비전 상품 구성 확인
  const hello = mockLgHelloBundles.find((b) => b.id === id);
  if (hello) {
    const hasMobile = Boolean(hello.mobilePlanName);
    const hasInternet = Boolean(hello.internetName);
    const hasTv = Boolean(hello.tvName);
    if (hasMobile && hasInternet && hasTv) return "모바일+인터넷+TV";
    if (hasMobile && hasInternet) return "모바일+인터넷";
    if (hasInternet && hasTv) return "인터넷+TV";
  }

  // 알뜰폰 교차 결합 상품 구성 확인
  if (id.includes("_")) {
    const [mobId, homeId] = id.split("_");
    const hasMobile = Boolean(
      mockMvnoMobilePlans.some((m) => m.id === mobId) ||
      mockEyagiSktMobilePlans.some((m) => m.id === mobId) ||
      mockEyagiLguMobilePlans.some((m) => m.id === mobId)
    );
    const hasHome = Boolean(homeId);
    if (hasMobile && hasHome) return "모바일+인터넷+TV";
    if (hasMobile) return "모바일";
    if (hasHome) return "인터넷+TV";
  }

  // MNO 통신사 결합 상품 구성 확인
  const mno = MOCK_PLAN_COMBINATIONS.find((c) => c.id === id);
  if (mno) {
    const hasMobile = Boolean(mno.mobilePlan);
    const hasInternet = Boolean(mno.internetPlan);
    const hasTv = Boolean(mno.tvPlan);
    if (hasMobile && hasInternet && hasTv) return "모바일+인터넷+TV";
    if (hasMobile && hasInternet) return "모바일+인터넷";
    if (hasInternet && hasTv) return "인터넷+TV";
  }

  // 일반 MOCK 결합 데이터 구성 확인
  const bundlePlan = mockBundlePlans.find((b) => b.id === id);
  if (bundlePlan) {
    const hasNet = bundlePlan.services.includes("internet");
    const hasTv = bundlePlan.services.includes("iptv");
    const hasMob = bundlePlan.services.includes("mobile");
    if (hasMob && hasNet && hasTv) return "모바일+인터넷+TV";
    if (hasNet && hasTv) return "인터넷+TV";
    if (hasMob && hasNet) return "모바일+인터넷";
  }

  // 정규식을 통한 텍스트 기반 Fallback 파싱
  const hasMob = /모바일|폰|유심|전화|5G|LTE/i.test(label);
  const hasNet = /인터넷|100M|500M|1G/i.test(label);
  const hasTv = /TV|IPTV|tv|보상|채널/i.test(label);

  if (hasMob && hasNet && hasTv) return "모바일+인터넷+TV";
  if (hasNet && hasTv && !hasMob) return "인터넷+TV";
  if (hasMob && hasNet && !hasTv) return "모바일+인터넷";

  return "모바일+인터넷+TV";
}

/**
 * 찜하기(즐겨찾기) 저장을 위해 요금제 라벨에서 상품명, 가격, 브랜드명을 분리해내는 함수
 */
const getPlanDetails = (value: string, label: string, subCategoryId: string) => {
  let name = label;
  let price = 0;
  let brand = "통신사";

  // 1. 추천 순위 수식어 제거 ([추천 1순위] 등)
  name = name.replace(/^\[추천 \d순위\]\s*/, "");

  // 2. 가격 정규식 추출
  const priceMatch = label.match(/월\s*([\d,]+)원/);
  if (priceMatch) {
    price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
  }

  // 3. 상품명에서 가격 수식어 지우기
  name = name.replace(/\s*\(월\s*[\d,]+원\)/, "").trim();
  name = name.replace(/\s*-\s*월\s*[\d,]+원/, "").trim();

  // 4. 서브 카테고리 종류에 따른 통신사/브랜드 결정
  const valLower = value.toLowerCase();
  const catLower = subCategoryId.toLowerCase();

  if (catLower === "phone") {
    if (value === "rec-mock-1") {
      brand = "알뜰폰";
    } else if (value === "rec-mock-2") {
      brand = "KT";
    } else if (valLower.includes("skt") || valLower.includes("sk-")) {
      brand = "SKT";
    } else if (valLower.includes("kt")) {
      brand = "KT";
    } else if (valLower.includes("lgu") || valLower.includes("lg-")) {
      brand = "LGU+";
    }
  } else if (catLower === "internet") {
    if (valLower.includes("sk")) {
      brand = "SK브로드밴드";
    } else if (valLower.includes("kt")) {
      brand = "KT올레";
    } else if (valLower.includes("lg")) {
      brand = "LG유플러스";
    } else {
      brand = "인터넷";
    }
  } else if (catLower === "iptv") {
    if (valLower.includes("sk")) {
      brand = "SKT";
    } else if (valLower.includes("kt")) {
      brand = "KT";
    } else if (valLower.includes("lg")) {
      brand = "LGU+";
    } else {
      brand = "IPTV";
    }
  } else if (catLower === "bundle") {
    if (valLower.includes("sk")) {
      brand = "SK";
    } else if (valLower.includes("kt")) {
      brand = "KT";
    } else if (valLower.includes("lg")) {
      brand = "LGU";
    } else if (valLower.includes("skylife")) {
      brand = "SKYLIFE";
    } else {
      brand = "결합상품";
    }
  }

  return { name, price, brand };
};

/**
 * 화면 UI 출력을 위해 단일 요금제 텍스트 라벨을 알뜰폰 브랜드, 요금제명, 가격, 데이터, 망 종류 등으로 세분화 파싱
 */
export function parsePlanLabel(label: string) {
  if (!label) return { cleanLabel: "", mvnoCarrier: "", name: "", priceStr: "", data: "", networkType: "", voice: "", sms: "" };

  const cleanLabel = label.replace(/^\[추천\s*\d+순위\]\s*/, "");

  let mvnoCarrier = "";
  let name = "";
  let priceStr = "";
  let data = "";
  let networkType = "";
  let voice = "";
  let sms = "";

  // [통신사] 대괄호 대역 추출
  const brandMatch = cleanLabel.match(/^\[(.*?)\]/);
  if (brandMatch) {
    mvnoCarrier = brandMatch[1];
  }
  const restLabel = brandMatch ? cleanLabel.replace(/^\[.*?\]\s*/, "") : cleanLabel;

  // 월 가격 대역 추출
  const priceMatch = label.match(/월\s*([\d,]+원)/) || label.match(/([\d,]+원)/);
  if (priceMatch) {
    priceStr = priceMatch[1];
  }

  // 케이스 1: 줄바꿈(\n) 형태로 구분된 라벨 파싱
  if (restLabel.includes("\n")) {
    const [line1, line2] = restLabel.split("\n").map(s => s.trim());
    name = line1.replace(/월\s*[\d,]+원/, "").replace(/[\d,]+원/, "").replace(/\(\s*\)/, "").trim();

    const parts = line2 ? line2.split(",").map(s => s.trim()) : [];
    data = parts[0] || "";
    networkType = parts[1] || "";
    voice = parts[2] || "";
    sms = parts[3] || "";
  }
  // 케이스 2: 가운데점(·) 구분 기호 형태 라벨 파싱
  else if (restLabel.includes(" · ")) {
    const parts = restLabel.split(" · ").map(s => s.trim());
    name = parts[0];

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (/월\s*[\d,]+원/.test(part)) continue;

      if (part === "LTE" || part === "5G" || part === "4G" || part === "(5G)" || part === "(LTE)") {
        networkType = part.replace(/[()]/g, "");
      } else if (part.includes("데이터") || part.includes("GB") || part.includes("MB") || part.includes("일5GB") || part.includes("일 5GB") || part.includes("무제한")) {
        if (!data) data = part.replace(/^데이터\s*/, "");
      } else if (part.includes("음성") || part.includes("통화") || part.includes("집/이동전화")) {
        voice = part;
      } else if (part.includes("문자")) {
        sms = part;
      }
    }
  }
  // 케이스 3: 기타 일반 텍스트 라벨 Fallback 파싱
  else {
    name = restLabel.replace(/\s*\(월\s*[\d,]+원\)/, "").trim();
    name = name.replace(/\s*-\s*월\s*[\d,]+원/, "").trim();

    const dataMatch = name.match(/(\d+(?:\.\d+)?(?:GB|MB)(?:\+[^\s,|()]*)*(?:\([^)]*\))?|무제한)/i);
    if (dataMatch) {
      data = dataMatch[1];
    }

    if (/5G/i.test(name)) networkType = "5G";
    else if (/LTE/i.test(name) || /4G/i.test(name)) networkType = "LTE";
  }

  // 파싱 오류 보정 (데이터 항목에 음성/문자 텍스트가 오버랩된 경우)
  if (data.includes("음성") || data.includes("문자")) {
    if (data.includes("음성") && !voice) {
      voice = data;
      data = "";
    } else if (data.includes("문자") && !sms) {
      sms = data;
      data = "";
    }
  }

  return {
    cleanLabel,
    mvnoCarrier,
    name,
    priceStr,
    data,
    networkType,
    voice,
    sms
  };
}

/**
 * ChatFlowInput 컴포넌트 Props 인터페이스 정의
 */
interface ChatFlowInputProps {
  step: AnswerInputStep | null;
  completed: boolean;
  onSubmit: (answer: SubmittedFlowAnswer) => void;
  onReset: () => void;
  userId?: string;
  favorites?: FavoriteProduct[];
  onToggleFavoriteProduct?: (productId: string, draft: FavoriteDraft) => void;
  subCategoryId?: string;
  isHistorical?: boolean;
  answers?: Record<string, any>;
  onEndSmartShoppingChat?: () => void;
}

/**
 * 챗봇 대화 상동 흐름의 사용자 입력 컴포넌트 메인
 */
export default function ChatFlowInput({
  step,
  completed,
  onSubmit,
  onReset,
  userId,
  favorites,
  onToggleFavoriteProduct,
  subCategoryId,
  isHistorical = false,
  answers,
  onEndSmartShoppingChat,
}: ChatFlowInputProps) {
  // 사용자의 로컬 입력 상태 변수
  const [inputValue, setInputValue] = useState("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [phonePlanOptions, setPhonePlanOptions] = useState<FlowChoiceOption[] | null>(null);

  // 과거 이력 보기 시 데이터 스냅샷을 고정하여 불필요한 데이터 변형 방지
  const frozenPlanOptionsRef = useRef<FlowChoiceOption[] | null>(null);
  const stepIdRef = useRef<string | undefined>(step?.id);

  // 답변 데이터 추출
  const phoneCarrier = String(answers?.["phone.carrier"] || "");
  const phoneCurrentFee = Number(answers?.["phone.currentFee"] || 0);
  const phoneDiscountOption = answers?.["phone.discountOption"];
  const isCurrentPhonePlanLookup = step?.id === "phone-current-plan-api";

  // 스텝이 바뀔 때마다 입력 값 초기화
  useEffect(() => {
    setInputValue("");
    setSelectedValues([]);
  }, [step?.id]);

  // 핸드폰 현재 요금제 API 조회 및 데이터 스냅샷 동결(Freeze) 처리
  useEffect(() => {
    if (stepIdRef.current !== step?.id) {
      stepIdRef.current = step?.id;
      frozenPlanOptionsRef.current = null;
    }

    setPhonePlanOptions(null);
    if (!isCurrentPhonePlanLookup || isHistorical || !phoneCarrier) return;

    if (frozenPlanOptionsRef.current) {
      setPhonePlanOptions(frozenPlanOptionsRef.current);
      return;
    }

    let active = true;
    void prefetchPlans(phoneCarrier).then(() => {
      if (!active) return;
      const resolved = resolvePhoneCurrentPlanOptions({
        "phone.carrier": phoneCarrier,
        "phone.currentFee": phoneCurrentFee,
        "phone.discountOption": phoneDiscountOption,
      });
      // 객체 깊은 복사를 통해 참조를 차단하고 스냅샷을 박음
      frozenPlanOptionsRef.current = JSON.parse(JSON.stringify(resolved));
      setPhonePlanOptions(frozenPlanOptionsRef.current);
    });

    return () => { active = false; };
  }, [isCurrentPhonePlanLookup, isHistorical, phoneCarrier, phoneCurrentFee, phoneDiscountOption]);

  // 1. 모든 문답이 완료되었을 때 '다시 진단하기' 버튼 출력
  if (completed) {
    return <QuickReplyChips replies={["처음부터 다시 진단하기"]} onSelect={onReset} />;
  }
  if (!step) return null;

  // 2. 단일 선택형 스텝(`single-choice`) UI 빌드
  if (step.type === "single-choice") {
    // 2-1. [결합 상품 조건 선택 카테고리] UI (알뜰, MNO 대기업, 위약금 고려 선택 카드)
    if (step.id === "Q_P2_2" || step.id === "Q_P2_1") {
      const hasPenalty = answers && (
        answers["bundle.allPenalty"] ||
        answers["bundle.ptaPenalty"] ||
        answers["bundle.ptbPenalty"] ||
        answers["bundle.diffPenalty"] ||
        answers["bundle.ptaComboPenalty"] ||
        answers["bundle.ptbComboPenalty"] ||
        answers["bundle.diffInternetPenalty"] ||
        answers["bundle.diffTvPenalty"] ||
        answers["bundle.newAPenalty"] ||
        answers["bundle.newBPenalty"]
      );

      const cardOptions = [
        {
          value: "mvno",
          label: "고정 비용 최소화 추천",
          description: "알뜰폰·케이블 최저가 위주로 추천해드려요"
        },
        {
          value: "mno",
          label: "품질 및 결합 혜택 우선 추천",
          description: "대기업 3사 결합 위주로 추천해드려요"
        },
        {
          value: "any",
          label: "위약금 대비 실질 이득 추천",
          description: "위약금을 내고 갈아타도 진짜 이득인지 비교해드려요",
          subDescription: hasPenalty
            ? undefined
            : "- 위약금을 입력하지 않았을 경우, 정확한 진단이 어렵습니다. 제일 저렴한 상품 중심으로 추천됩니다."
        }
      ];

      const optionStyleMap: Record<string, {
        normal: string;
        selectedHistorical: string;
        checkColor: string;
        titleColor: string;
      }> = {
        mvno: {
          normal: "border-[#A8E6CF] bg-[#A8E6CF]/15 hover:bg-[#A8E6CF]/30 hover:border-[#A8E6CF]",
          selectedHistorical: "border-[#A8E6CF] bg-[#A8E6CF]/25 opacity-95",
          checkColor: "text-[#059669]",
          titleColor: "text-[#047857]"
        },
        mno: {
          normal: "border-[#2A6CB6]/40 bg-[#2A6CB6]/10 hover:bg-[#2A6CB6]/20 hover:border-[#2A6CB6]",
          selectedHistorical: "border-[#2A6CB6] bg-[#2A6CB6]/20 opacity-95",
          checkColor: "text-[#1E3ABA]",
          titleColor: "text-[#1E3ABA]"
        },
        any: {
          normal: "border-[#A78BFA]/40 bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 hover:border-[#A78BFA]",
          selectedHistorical: "border-[#A78BFA] bg-[#A78BFA]/20 opacity-95",
          checkColor: "text-[#7C3AED]",
          titleColor: "text-[#6D28D9]"
        }
      };

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {cardOptions.map((opt) => {
            const userSelectedThis = answers && answers[step.answerKey] === opt.value;
            const style = optionStyleMap[opt.value] || {
              normal: "border-border bg-card hover:border-[#2A6CB6]/50 hover:bg-[#2A6CB6]/5",
              selectedHistorical: "border-[#2A6CB6] bg-[#2A6CB6]/10 opacity-90",
              checkColor: "text-[#1E3ABA]",
              titleColor: "text-slate-800"
            };

            let borderClass = "";
            if (isHistorical) {
              if (userSelectedThis) {
                borderClass = `${style.selectedHistorical} cursor-not-allowed`;
              } else {
                borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
              }
            } else {
              borderClass = `${style.normal} active:scale-[0.99] cursor-pointer`;
            }

            return (
              <div
                key={opt.value}
                onClick={isHistorical ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                className={`flex flex-col gap-1 rounded-xl border p-4 text-left shadow-2xs transition-all duration-200 ${borderClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${style.titleColor}`}>
                    {opt.label}
                  </span>
                  {isHistorical && userSelectedThis && (
                    <span className={`text-xs font-bold ${style.checkColor}`}>
                      선택됨 ✓
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {opt.description}
                </p>
                {opt.subDescription && (
                  <p className="mt-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-500 leading-normal">
                    {opt.subDescription}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // 2-2. [신규 가입 유연 경로 선택] UI
    if (step.id === "Q_NEW_SELECT") {
      const cardOptions = [
        {
          value: "new_mobile",
          label: "모바일 요금제도 새로 가입할래요",
          description: "신규가입/번호이동"
        },
        {
          value: "keep_mobile",
          label: "모바일 요금제 유지",
          description: "결합 필요"
        }
      ];

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {cardOptions.map((opt) => {
            const userSelectedThis = answers && answers[step.answerKey] === opt.value;
            let borderClass = "";
            if (isHistorical) {
              if (userSelectedThis) {
                borderClass = "border-[#2A6CB6] bg-[#2A6CB6]/10 opacity-90 cursor-not-allowed";
              } else {
                borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
              }
            } else {
              borderClass = "border-border bg-card hover:border-[#2A6CB6]/50 hover:bg-[#2A6CB6]/5 active:scale-[0.99] cursor-pointer";
            }

            return (
              <div
                key={opt.value}
                onClick={isHistorical ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                className={`flex flex-col gap-1 rounded-xl border p-4 text-left shadow-sm transition-all duration-200 ${borderClass}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-primary">
                    {opt.label}
                  </span>
                  {isHistorical && userSelectedThis && (
                    <span className="text-xs font-bold text-[#1E3ABA]">
                      선택됨 ✓
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {opt.description}
                </p>
              </div>
            );
          })}
        </div>
      );
    }

    // 2-3. [구매 등급 진단 신청 카드] UI (새 디자인: 화면 캡처 2026-07-25 021102.png + holographic_medal.png 적용)
    if (
      step.id === "phone-ask-grade" ||
      step.id === "internet-ask-grade" ||
      step.id === "iptv-ask-grade-diagnosis" ||
      step.id === "bundle-ask-grade"
    ) {
      const userSelectedYes = answers && answers[step.answerKey] === "yes";

      let cardContainerClass = "";
      if (isHistorical) {
        if (userSelectedYes) {
          cardContainerClass = "border-slate-200 bg-white opacity-90 cursor-not-allowed";
        } else {
          cardContainerClass = "border-slate-200 bg-white opacity-40 cursor-not-allowed";
        }
      } else {
        cardContainerClass = "border-slate-100 bg-white hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.995]";
      }

      return (
        <div className="w-full max-w-sm sm:max-w-md space-y-4 my-2">
          {/* 🏅 구매 등급 진단 메인 카드 (holographic_medal.png 3D 메달 적용 - 검은 테두리 완벽 제거) */}
          <div
            onClick={isHistorical ? undefined : () => onSubmit({ value: "yes", displayValue: "YES" })}
            className={`relative flex flex-col items-center text-center rounded-3xl border border-slate-100 border-t-4 border-t-[#1E3ABA] bg-white p-6 sm:p-7 shadow-md overflow-hidden ${cardContainerClass}`}
          >
            {/* 🎨 [프론트엔드 수정 가능 Zone: 메달 이미지 파일 및 크기 조절]
               - 파일 위치: public/assets/brand/holographic_medal.png
               - 이미지 크기 변경: w-14 h-14 (w-12 h-12, w-16 h-16, w-20 h-20 등 조절)
            */}
            <div className="w-14 h-14 rounded-full overflow-hidden shadow-md mb-4 shrink-0 flex items-center justify-center bg-[#F5F7FA]">
              <img
                src="/assets/brand/holographic_medal.png"
                alt="구매등급진단 메달"
                className="w-full h-full object-cover scale-[1.18]"
              />
            </div>

            {/* 타이틀 */}
            <h4 className="text-lg sm:text-xl font-extrabold text-[#1F2937] mb-1.5 tracking-tight">
              구매등급진단
            </h4>

            {/* 설명 서브 타이틀 */}
            <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed mb-6 max-w-[280px]">
              전체 조건 맞춤 요금제 중에서 현재 요금제의 알뜰함 수준을 상위 %로 진단해 드려요.
            </p>

            {/* 내 등급 확인하기 메인 블루 버튼 */}
            <button
              type="button"
              disabled={isHistorical}
              className="w-full rounded-2xl bg-[#1E3ABA] hover:bg-[#152B88] py-3.5 px-6 text-sm sm:text-base font-extrabold text-white shadow-xs transition-all active:scale-[0.99] disabled:opacity-80"
            >
              {isHistorical && userSelectedYes ? "선택됨 ✓" : "내 등급 확인하기"}
            </button>
          </div>

          {/* 하단 채팅 종료하기 버튼 (색상 포인트 적용) */}
          {!isHistorical && (
            <div className="flex justify-start pt-1">
              <button
                type="button"
                onClick={onEndSmartShoppingChat}
                className="rounded-xl border border-[#1E3ABA]/30 bg-[#1E3ABA]/10 text-[#1E3ABA] hover:bg-[#1E3ABA]/20 hover:border-[#1E3ABA]/50 px-4 py-2 text-xs font-bold focus:outline-none transition-all shadow-xs active:scale-[0.98]"
              >
                채팅 종료하기
              </button>
            </div>
          )}
        </div>
      );
    }

    // 2-4. [지역 선택 목록형 컴포넌트] UI
    if (step.id.includes("-region-")) {
      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 border border-border/80 rounded-2xl bg-card p-2 shadow-inner">
            {step.options.map((opt) => {
              const userSelectedThis = answers && answers[step.answerKey] === opt.value;
              let itemClass = "";
              if (isHistorical) {
                if (userSelectedThis) {
                  itemClass = "bg-accent/15 text-accent font-bold cursor-not-allowed";
                } else {
                  itemClass = "text-muted-foreground opacity-40 cursor-not-allowed";
                }
              } else {
                itemClass = userSelectedThis
                  ? "bg-accent/15 text-accent font-bold"
                  : "hover:bg-muted text-primary cursor-pointer active:scale-[0.99]";
              }

              return (
                <div
                  key={opt.value}
                  onClick={isHistorical ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-xs transition-all duration-150 border border-transparent hover:border-border/40 ${itemClass}`}
                >
                  <span className="font-bold text-xs">{opt.label}</span>
                  {userSelectedThis && (
                    <span className="text-[10px] font-black text-accent">
                      선택됨 ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // 2-5. [전체 요금제 리스트 스크롤 컴포넌트] UI
    if (
      step.id === "phone-current-plans-list" ||
      step.id === "internet-current-plans-list" ||
      step.id === "iptv-current-plans-list" ||
      step.id === "bundle-current-plans-list" ||
      step.id === "iptv-choose-current-list" ||
      step.id === "internet-all-plans-select" ||
      step.id === "iptv-all-plans-select" ||
      step.id === "bundle-all-plans-select" ||
      step.id.endsWith("-all-plans-select") ||
      step.id.endsWith("_list") ||
      step.id.endsWith("-plans-list") ||
      step.answerKey?.endsWith("PlanCheckList")
    ) {
      const isRecommendationList =
        step.id.includes("all-plans-select") ||
        step.id.includes("recommendation") ||
        step.id.includes("all-plans");

      const planOptions = step.options.filter(
        (o) => o.value !== "none-of-them" && o.value !== "manual_fallback" && o.value !== "direct-choose"
      );
      const fallbackOption = step.options.find(
        (o) => o.value === "none-of-them" || o.value === "manual_fallback" || o.value === "direct-choose"
      );

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {planOptions.map((opt) => {
              const userSelectedThis = answers && answers[step.answerKey] === opt.value;
              const isUnselectable = opt.value === "no_more_plans" || opt.value === "disabled";

              let borderClass = "";
              if (isUnselectable) {
                borderClass = "border-border/60 bg-muted/40 text-muted-foreground opacity-60 cursor-not-allowed select-none pointer-events-none";
              } else if (isHistorical) {
                if (userSelectedThis) {
                  borderClass = isRecommendationList
                    ? "border-[#1E3ABA] bg-[#1E3ABA]/10 opacity-90 cursor-not-allowed"
                    : "border-[#14B8A6] bg-[#14B8A6]/10 opacity-90 cursor-not-allowed";
                } else {
                  borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
                }
              } else {
                borderClass = isRecommendationList
                  ? "border-border bg-card hover:border-[#1E3ABA]/50 hover:bg-[#1E3ABA]/5 active:scale-[0.99] cursor-pointer"
                  : "border-border bg-card hover:border-[#14B8A6]/50 hover:bg-[#14B8A6]/5 active:scale-[0.99] cursor-pointer";
              }

              const parsed = parsePlanLabel(opt.label);

              const badgeColorClass = isRecommendationList
                ? "text-[#1E3ABA] dark:text-[#60A5FA] bg-[#1E3ABA]/10 border border-[#1E3ABA]/20"
                : "text-[#14B8A6] dark:text-[#14B8A6] bg-[#14B8A6]/10 border border-[#14B8A6]/20";

              const priceColorClass = isRecommendationList
                ? "text-[#1E3ABA] dark:text-[#60A5FA]"
                : "text-[#0F766E] dark:text-[#168D84]";

              return (
                <div
                  key={opt.value}
                  onClick={isHistorical || isUnselectable ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                  className={`flex flex-col gap-1.5 rounded-xl border p-3.5 text-left shadow-sm transition-all duration-200 ${borderClass}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {parsed.mvnoCarrier && (
                        <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 shrink-0 ${badgeColorClass}`}>
                          {parsed.mvnoCarrier}
                        </span>
                      )}
                      <span className="text-xs font-black text-primary truncate">
                        {parsed.name}
                      </span>
                    </div>
                    {parsed.priceStr && (
                      <span className={`text-xs font-bold shrink-0 ${priceColorClass}`}>
                        월 {parsed.priceStr}
                      </span>
                    )}
                  </div>

                  {(parsed.data || parsed.networkType || parsed.voice || parsed.sms) && (
                    <div className="flex flex-col gap-0.5 text-[11px] text-muted-foreground pt-0.5">
                      {(parsed.data || parsed.networkType) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {parsed.data && <span>데이터: <strong className="text-foreground font-semibold">{parsed.data}</strong></span>}
                          {parsed.data && parsed.networkType && <span className="opacity-40">·</span>}
                          {parsed.networkType && (
                            <span className="rounded bg-secondary px-1.5 py-0.2 text-[9px] font-bold text-foreground/80 uppercase border border-border/50">
                              {parsed.networkType}
                            </span>
                          )}
                        </div>
                      )}
                      {(parsed.voice || parsed.sms) && (
                        <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground flex-wrap">
                          {parsed.voice && <span>{parsed.voice}</span>}
                          {parsed.voice && parsed.sms && <span className="opacity-40">·</span>}
                          {parsed.sms && <span>{parsed.sms}</span>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!isHistorical && fallbackOption && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => onSubmit({ value: fallbackOption.value, displayValue: fallbackOption.label })}
                className="rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
              >
                {fallbackOption.label}
              </button>
            </div>
          )}
        </div>
      );
    }

    // 2-6. [API 기반 조회된 기존 가입 요금제 추정 카드] UI
    if (
      step.id === "phone-current-plan-api" ||
      step.id === "internet-current-plan-api" ||
      step.id === "iptv-current-plan-api" ||
      step.id === "bundle-current-plan-api" ||
      step.id.endsWith("-current-plan-api") ||
      step.answerKey?.endsWith("PlanCheck") ||
      step.id.includes("PlanCheck")
    ) {
      const options = step.id === "phone-current-plan-api" && (phonePlanOptions ?? frozenPlanOptionsRef.current)
        ? (phonePlanOptions ?? frozenPlanOptionsRef.current)!
        : step.options;
      const planOption = options.find(
        (o) => o.value !== "direct-select" && o.value !== "direct-choose" && o.value !== "direct-input"
      );

      const directSelectOption = options.find((o) => o.value === "direct-select" || o.value === "direct-choose");
      const directInputOption = options.find((o) => o.value === "direct-input");

      const userSelectedThis = planOption && answers && answers[step.answerKey] === planOption.value;

      let borderClass = "";
      if (isHistorical) {
        if (userSelectedThis) {
          borderClass = "border-[#14B8A6] bg-[#14B8A6]/10 opacity-90 cursor-not-allowed";
        } else {
          borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
        }
      } else {
        borderClass = "border-[#14B8A6]/20 bg-[#14B8A6]/5 hover:border-[#14B8A6]/50 hover:bg-[#14B8A6]/10";
      }

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {planOption && (
            <div
              onClick={isHistorical ? undefined : () => onSubmit({ value: planOption.value, displayValue: planOption.label })}
              className={`group relative rounded-2xl border p-5 shadow-sm transition-all duration-200 flex flex-col gap-2 ${!isHistorical ? "cursor-pointer active:scale-[0.99] hover:shadow-md" : ""} ${borderClass}`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#14B8A6]/15 px-2 py-0.5 text-[10px] font-bold text-[#14B8A6] dark:text-[#14B8A6]">
                  조회된 기존 요금제 (추정)
                </span>
                <span className="text-[10px] font-black text-[#14B8A6] dark:text-[#14B8A6] group-hover:underline">
                  {isHistorical ? (userSelectedThis ? "선택됨 ✓" : "") : "이 요금제 선택하기 →"}
                </span>
              </div>

              {(() => {
                const fullText = planOption.label.split("\n")[0];
                const specText = planOption.label.split("\n")[1];

                const priceMatch = fullText.match(/(월\s*[\d,]+원|[\d,]+원)/);
                const priceText = priceMatch ? (priceMatch[1].startsWith("월") ? priceMatch[1] : `월 ${priceMatch[1]}`) : "";
                const titleText = priceMatch ? fullText.replace(priceMatch[0], "").trim() : fullText;

                return (
                  <div className="flex flex-col gap-2 my-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h4 className="text-sm font-black text-[#0F766E] tracking-tight leading-snug flex-1 min-w-0 break-keep">
                        {titleText}
                      </h4>
                      {priceText && (
                        <span className="text-base font-black text-[#0F766E] dark:text-[#168D84] shrink-0 tabular-nums">
                          {priceText}
                        </span>
                      )}
                    </div>
                    {specText && (
                      <div className="text-xs font-bold text-[#6E7581] dark:text-[#6E7581] bg-[#9CA3AF]/10 border border-[#9CA3AF]/20 rounded-lg px-2.5 py-1.5 leading-relaxed">
                        {specText}
                      </div>
                    )}
                  </div>
                );
              })()}

              <p className="text-[10px] text-muted-foreground leading-normal">
                입력하신 금액 기준, API로 추정한 요금제 정보입니다.
              </p>
            </div>
          )}

          {!isHistorical && (
            <div className="flex flex-wrap gap-2 justify-center">
              {directSelectOption && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directSelectOption.value, displayValue: directSelectOption.label })}
                  className="rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directSelectOption.label}
                </button>
              )}
              {directInputOption && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directInputOption.value, displayValue: directInputOption.label })}
                  className="rounded-full border border-border bg-card px-4 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directInputOption.label}
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    // 2-7. [추천 요금제 4종 그리드 카드] UI (찜하기 기능 포함)
    if (
      step.id === "phone-recommendation-api" ||
      step.id === "internet-recommendation-api" ||
      step.id === "iptv-select-new-plan" ||
      step.id === "bundle-recommendation-api"
    ) {
      const cardOptions = step.options
        .filter((o) => !["direct-choose", "direct-select", "direct-input"].includes(o.value))
        .slice(0, 4);
      const directChoose = step.options.find((o) => o.value === "direct-choose");
      const directSelect = step.options.find((o) => o.value === "direct-select");
      const directInput = step.options.find((o) => o.value === "direct-input");

      return (
        <div className="flex flex-col gap-3 w-full max-w-md">
          <div className="grid grid-cols-2 gap-3">
            {cardOptions.map((opt, idx) => {
              const isFav = favorites?.some((f) => f.productId === opt.value);
              const cleanLabel = opt.label.replace(/\[추천 \d+순위\]\s*/g, "");

              const isRec1 = opt.label.includes("1순위") || idx === 0;
              const isRec2 = opt.label.includes("2순위") || idx === 1;

              const userSelectedThis = answers && answers[step.answerKey] === opt.value;

              let borderClass = "";
              if (isHistorical) {
                if (userSelectedThis) {
                  borderClass = isRec1
                    ? "border-[#3B82F6] bg-[#3B82F6]/10 opacity-90 cursor-not-allowed"
                    : isRec2
                      ? "border-teal-500 bg-teal-500/10 opacity-90 cursor-not-allowed"
                      : "border-accent bg-accent/10 opacity-90 cursor-not-allowed";
                } else {
                  borderClass = "border-border bg-card opacity-30 cursor-not-allowed";
                }
              } else {
                borderClass = isRec1
                  ? "border-[#2A6CB6]/20 bg-[#2A6CB6]/5 hover:border-[#2A6CB6]/50 hover:bg-[#2A6CB6]/10"
                  : isRec2
                    ? "border-[#3B82F6]/20 bg-[#3B82F6]/5 hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/10"
                    : "border-border bg-card hover:border-accent/50 hover:bg-secondary";
              }

              const textClass = isRec1
                ? "text-[#1E3ABA] dark:text-[#60A5FA]"
                : isRec2
                  ? "text-[#3B82F6] dark:text-[#3B82F6]"
                  : "text-accent";

              const badgeBg = isRec1 ? "bg-[#1E3ABA]" : isRec2 ? "bg-[#3B82F6]" : "bg-accent";
              const badgeMatch = opt.label.match(/추천 (\d+)순위/);
              const badgeLabel = badgeMatch
                ? `${badgeMatch[1]}순위 추천`
                : `선택안 ${idx + 1}`;

              const parsed = parsePlanLabel(opt.label);
              const displayData = getBundlePlanData(opt.value) || parsed.data;
              const bundleComposition = getBundleComposition(opt.value, opt.label);

              return (
                <div
                  key={opt.value}
                  onClick={isHistorical ? undefined : () => onSubmit({ value: opt.value, displayValue: opt.label })}
                  className={`group relative rounded-2xl border p-4 shadow-sm transition-all duration-200 flex flex-col gap-2 h-full justify-between ${!isHistorical ? "cursor-pointer active:scale-[0.99] hover:shadow-md" : ""} ${borderClass}`}
                >
                  <div className="flex flex-col gap-1.5 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-black text-white uppercase ${badgeBg}`}>
                        {badgeLabel}
                      </span>
                      {parsed.mvnoCarrier && (
                        <span className="text-[9px] font-bold text-[#1E3ABA] dark:text-[#1E3ABA] bg-[#1E3ABA]/10 border border-emerald-500/20 rounded px-1 py-0.2">
                          {parsed.mvnoCarrier}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-black text-primary transition-colors mt-0.5 line-clamp-2 leading-snug">
                      {parsed.name}
                    </h4>

                    {parsed.priceStr && (
                      <div className="text-xs font-bold text-[#1E3ABA] dark:text-[#60A5FA]0">
                        월 {parsed.priceStr}
                      </div>
                    )}

                    <div className="flex flex-col gap-1 pt-1 border-t border-border/30 mt-1">
                      {step.id === "bundle-recommendation-api" && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9.5px] font-black text-[#1E3ABA] bg-[#1E3ABA]/10 border border-[#1E3ABA]/20 px-1.5 py-0.5 rounded">
                            {bundleComposition}
                          </span>
                        </div>
                      )}

                      {displayData && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10.5px] font-extrabold text-[#60A5FA] dark:text-[#60A5FA] bg-[#60A5FA]/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {displayData}
                          </span>
                          {parsed.networkType && (
                            <span className="rounded bg-secondary px-1 py-0.2 text-[8px] font-bold uppercase text-foreground/80 border border-border/50">
                              {parsed.networkType}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[9.5px] font-medium text-muted-foreground flex-wrap pt-0.5">
                        <span>{parsed.voice || "음성 무제한"}</span>
                        <span className="opacity-40">·</span>
                        <span>{parsed.sms || "문자 기본제공"}</span>
                        {parsed.networkType && <span className="opacity-60">({parsed.networkType})</span>}
                      </div>
                    </div>
                  </div>

                  {/* 별표 찜하기 토글 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // 카드 선택 이벤트 중첩 발생 방지
                      if (onToggleFavoriteProduct) {
                        const details = getPlanDetails(opt.value, opt.label, subCategoryId || "");
                        onToggleFavoriteProduct(opt.value, {
                          userId: userId || "mock-user",
                          productId: opt.value,
                          source: "internal",
                          categoryId: subCategoryId as any,
                          name: details.name,
                          brand: details.brand,
                          currentPrice: details.price,
                          dataStatus: "mock",
                          imagePath: "",
                        });
                      }
                    }}
                    className="absolute right-2 top-2 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
                  >
                    {isFav ? (
                      <Star size={15} className="fill-yellow-400 text-yellow-400" />
                    ) : (
                      <Star size={15} className="text-muted-foreground" />
                    )}
                  </button>

                  <span className={`text-[9px] font-bold group-hover:underline text-right mt-2 ${textClass}`}>
                    {isHistorical ? (userSelectedThis ? "선택됨 ✓" : "") : "선택하기 →"}
                  </span>
                </div>
              );
            })}
          </div>

          {!isHistorical && (
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {directChoose && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directChoose.value, displayValue: directChoose.label })}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directChoose.label}
                </button>
              )}
              {directSelect && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directSelect.value, displayValue: directSelect.label })}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directSelect.label}
                </button>
              )}
              {directInput && (
                <button
                  type="button"
                  onClick={() => onSubmit({ value: directInput.value, displayValue: directInput.label })}
                  className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-bold text-primary shadow-sm hover:border-accent/50 hover:bg-secondary active:scale-[0.98] transition-all"
                >
                  {directInput.label}
                </button>
              )}
            </div>
          )}
        </div>
      );
    }

    // 2-8. 일반 단일 선택용 칩스(QuickReplyChips) 컴포넌트 출력
    const selectedOpt = step.options.find(o => answers && answers[step.answerKey] === o.value);
    const selectedLabel = selectedOpt?.label;

    return (
      <QuickReplyChips
        replies={step.options.map((option) => option.label)}
        onSelect={(label) => {
          const option = step.options.find((item) => item.label === label);
          if (option) onSubmit({ value: option.value, displayValue: option.label });
        }}
        disabled={isHistorical}
        selectedValue={selectedLabel}
      />
    );
  }

  // 3. 확인형 선택(`confirmation`) 스텝 처리 (확인/취소 칩스)
  if (step.type === "confirmation") {
    const confirmLabel = step.confirmLabel ?? "확인";
    const cancelLabel = step.cancelLabel ?? "취소";
    const selectedVal = answers && answers[step.answerKey];
    const selectedLabel = selectedVal === true ? confirmLabel : (selectedVal === false ? cancelLabel : undefined);

    return (
      <QuickReplyChips
        replies={[confirmLabel, cancelLabel]}
        onSelect={(label) => onSubmit({ value: label === confirmLabel, displayValue: label })}
        disabled={isHistorical}
        selectedValue={selectedLabel}
      />
    );
  }

  // 4. 다중 선택(`multi-choice`) 스텝 처리
  if (step.type === "multi-choice") {
    const minimum = step.minSelections ?? 1;
    const currentSelections = answers ? (answers[step.answerKey] as string[] || []) : [];

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {step.options.map((option) => {
            const selected = isHistorical
              ? currentSelections.includes(option.value)
              : selectedValues.includes(option.value);

            const btnClass = isHistorical
              ? selected
                ? "border-accent bg-accent text-accent-foreground opacity-90 cursor-not-allowed"
                : "border-border bg-card text-primary opacity-40 cursor-not-allowed"
              : selected
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-card text-primary hover:border-accent/50 hover:bg-secondary";

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                disabled={isHistorical}
                onClick={() =>
                  !isHistorical &&
                  setSelectedValues((current) => {
                    // 예외 처리: '할인 없음', '모름' 등 배타적 단일 선택 옵션인 경우
                    const isExclusive =
                      option.value === "no-discount" ||
                      option.value === "no_discount" ||
                      option.value === "no-discount-option" ||
                      option.value === "모름" ||
                      option.value === "none" ||
                      option.value === "no-discount";

                    if (isExclusive) {
                      return selected ? [] : [option.value];
                    }

                    // 일반 다중 선택 시 배타적 옵션들을 제거하고 항목 토글
                    const filtered = current.filter(
                      (v) => v !== "no-discount" && v !== "no_discount" && v !== "no-discount-option" && v !== "모름" && v !== "none"
                    );
                    return selected ? filtered.filter((v) => v !== option.value) : [...filtered, option.value];
                  })
                }
                className={`rounded-full border px-3.5 py-2 text-xs font-bold shadow-sm transition-all active:scale-[0.98] ${btnClass}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {!isHistorical && (
          <button
            type="button"
            disabled={selectedValues.length < minimum}
            onClick={() => {
              const labels = step.options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label);
              onSubmit({ value: selectedValues, displayValue: labels.join(", ") });
            }}
            className="self-start rounded-lg bg-brand-surface px-4 py-2 text-xs font-black text-brand-surface-foreground transition-all enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            선택 완료
          </button>
        )}
      </div>
    );
  }

  // 5. 일반 텍스트 입력 및 숫자 입력(`number-input`, `text-input`) 스텝 처리
  const numeric = step.type === "number-input";
  const trimmed = inputValue.trim();
  const numericValue = numeric ? Number(trimmed) : null;
  const isValidNumber = !numeric || (
    trimmed !== "" && Number.isFinite(numericValue) &&
    (step.min === undefined || numericValue! >= step.min) &&
    (step.max === undefined || numericValue! <= step.max)
  );
  const canSubmit = trimmed !== "" && isValidNumber;

  // 답변 제출 함수
  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      value: numeric ? numericValue! : trimmed,
      displayValue: numeric && step.unit ? `${numericValue!.toLocaleString("ko-KR")}${step.unit}` : trimmed,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-input-background px-3 py-2">
        <input
          type={numeric ? "number" : "text"}
          inputMode={numeric ? "numeric" : "text"}
          min={numeric ? step.min : undefined}
          max={numeric ? step.max : undefined}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
          placeholder={step.placeholder ?? "답변을 입력해주세요"}
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${canSubmit ? "bg-accent text-accent-foreground shadow-sm active:scale-[0.96]" : "bg-muted text-muted-foreground/60"}`}
          title="전송"
          aria-label="답변 전송"
        >
          <Send size={16} />
        </button>
      </div>
      {/* 대체 옵션 버튼이 존재하는 경우 (예: "잘 모르겠음" 등) */}
      {numeric && step.alternateOption && (
        <button
          type="button"
          className="self-start rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-primary shadow-sm transition-all hover:border-accent/50 hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-accent/40 active:scale-[0.98]"
          onClick={() => onSubmit({ value: step.alternateOption!.value, displayValue: step.alternateOption!.label })}
        >
          {step.alternateOption.label}
        </button>
      )}
    </div>
  );
}