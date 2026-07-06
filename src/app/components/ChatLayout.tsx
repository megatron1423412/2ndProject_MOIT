import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import ChatMessage from "./ChatMessage";
import QuickActionChips from "./QuickActionChips";
import ProductRecommendationCard from "./ProductRecommendationCard";
import SavingsReportCard from "./SavingsReportCard";
import InsightPanel from "./InsightPanel";
import { Send, Sparkles, RefreshCw } from "lucide-react";
import { PRODUCTS, CATEGORIES, BUDGETS, FIXED_CATS, QUICK_AMOUNTS, SAVINGS_TIPS, Product } from "../data";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface Message {
  id: string;
  sender: "ai" | "user";
  text?: string;
  timestamp: string;
  type?: 
    | "text" 
    | "product-category-select" 
    | "product-budget-select" 
    | "product-purpose-select" 
    | "fixed-category-select" 
    | "fixed-amount-select" 
    | "product-recommendations" 
    | "fixed-report";
  data?: any; // Contains payload like recommended products or reports
}

interface ChecklistItem {
  id: string;
  text: string;
  savings: number;
  done: boolean;
  category: string;
}

type ChatState =
  | "idle"
  | "product_category"
  | "product_budget"
  | "product_purpose"
  | "fixed_select"
  | "fixed_amount";

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ChatLayout() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [inputValue, setInputValue] = useState("");
  
  // Dialog flow context
  const [productCategory, setProductCategory] = useState("");
  const [productBudget, setProductBudget] = useState("");
  const [fixedSelectedIds, setFixedSelectedIds] = useState<string[]>([]);
  const [fixedCurrentIndex, setFixedCurrentIndex] = useState(0);
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, number>>({});
  
  // Right panel checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: "chk-1", text: "통신사 알뜰폰 요금제 비교하기", savings: 23000, done: true, category: "통신비" },
    { id: "chk-2", text: "안 쓰는 OTT 구독 해지하기", savings: 14900, done: true, category: "구독 서비스" },
    { id: "chk-3", text: "중복 실손 보험 항목 정리하기", savings: 45000, done: false, category: "보험료" },
  ]);

  // Sidebar chat history
  const [recentDiagnostics, setRecentDiagnostics] = useState([
    { id: "hist-1", icon: "💻", title: "노트북 구매 진단", result: "87,600원 절약", date: "2일 전", type: "product" as const },
    { id: "hist-2", icon: "📱", title: "통신비 다이어트", result: "월 23,000원 절감", date: "5일 전", type: "fixed" as const },
    { id: "hist-3", icon: "📺", title: "구독 서비스 정리", result: "월 32,000원 절감", date: "1주 전", type: "fixed" as const },
  ]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    resetChat();
  }, []);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getTimeString = () => {
    const d = new Date();
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const addAiMessage = (text: string, type: Message["type"] = "text", data?: any) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        sender: "ai",
        text,
        timestamp: getTimeString(),
        type,
        data,
      },
    ]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        sender: "user",
        text,
        timestamp: getTimeString(),
        type: "text",
      },
    ]);
  };

  const resetChat = () => {
    setChatState("idle");
    setProductCategory("");
    setProductBudget("");
    setFixedSelectedIds([]);
    setFixedCurrentIndex(0);
    setFixedAmounts({});
    setActiveHistoryId(null);
    
    setMessages([
      {
        id: "msg-greeting",
        sender: "ai",
        text: "안녕하세요! 합리적인 소비 요정, 모잇이에요. 오늘 함께 점검해 볼 지출 내역이 있으신가요?",
        timestamp: getTimeString(),
        type: "text",
      },
    ]);
  };

  // ─── Chat history loading ───────────────────────────────────────────────────

  const handleSelectHistory = (id: string) => {
    setActiveHistoryId(id);
    setChatState("idle");
    
    if (id === "hist-1") {
      // Laptop Diagnosis History
      setMessages([
        { id: "h1-1", sender: "ai", text: "안녕하세요! 합리적인 소비 요정, 모잇이에요. 오늘 함께 점검해 볼 지출 내역이 있으신가요?", timestamp: "14:02", type: "text" },
        { id: "h1-2", sender: "user", text: "🛍️ 상품 살까 말까", timestamp: "14:02", type: "text" },
        { id: "h1-3", sender: "ai", text: "좋아요! 구매를 고민하고 계신 상품의 카테고리를 선택해주세요.", timestamp: "14:03", type: "text" },
        { id: "h1-4", sender: "user", text: "💻 노트북", timestamp: "14:03", type: "text" },
        { id: "h1-5", sender: "ai", text: "고민 중이신 예산 범위를 선택해주세요.", timestamp: "14:03", type: "text" },
        { id: "h1-6", sender: "user", text: "150만원", timestamp: "14:04", type: "text" },
        { id: "h1-7", sender: "ai", text: "사용 목적이나 추가적으로 고려하고 계신 점이 있으신가요?", timestamp: "14:04", type: "text" },
        { id: "h1-8", sender: "user", text: "대학원 논문 작업 및 휴대용", timestamp: "14:04", type: "text" },
        { 
          id: "h1-9", 
          sender: "ai", 
          text: "김지윤님의 예산(150만원)과 목적(대학원 논문 작업 및 휴대용)에 딱 맞는 노트북 추천 결과입니다! 가성비와 평점, 그리고 제 한 줄 평을 확인해보세요.", 
          timestamp: "14:05", 
          type: "product-recommendations",
          data: PRODUCTS.slice(0, 3) 
        },
      ]);
    } else if (id === "hist-2") {
      // Telecom Savings History
      setMessages([
        { id: "h2-1", sender: "ai", text: "안녕하세요! 합리적인 소비 요정, 모잇이에요. 오늘 함께 점검해 볼 지출 내역이 있으신가요?", timestamp: "어제 10:15", type: "text" },
        { id: "h2-2", sender: "user", text: "📱 통신비 줄이기", timestamp: "어제 10:15", type: "text" },
        { id: "h2-3", sender: "ai", text: "통신비 다이어트를 도와드릴게요! 현재 매달 지출하시는 통신비 요금을 선택하거나 입력해주세요.", timestamp: "어제 10:16", type: "text" },
        { id: "h2-4", sender: "user", text: "89,000원", timestamp: "어제 10:16", type: "text" },
        {
          id: "h2-5",
          sender: "ai",
          text: "김지윤님의 통신비 지출을 분석한 고정비 다이어트 리포트입니다. 알뜰폰 요금제나 결합 할인을 통해 큰 금액을 아끼실 수 있어요! 💰",
          timestamp: "어제 10:17",
          type: "fixed-report",
          data: {
            categoryLabel: "통신비",
            currentSpending: 89000,
            recommendedAction: "알뜰폰 요금제 최적화 및 가족 결합 혜택 체크",
            monthlySavings: 23000,
            yearlySavings: 276000,
            checklist: ["통신사 알뜰폰 요금제 비교하기", "가족 결합 할인 여부 고객센터 문의하기"]
          }
        }
      ]);
    } else if (id === "hist-3") {
      // Subscription Savings History
      setMessages([
        { id: "h3-1", sender: "ai", text: "안녕하세요! 합리적인 소비 요정, 모잇이에요. 오늘 함께 점검해 볼 지출 내역이 있으신가요?", timestamp: "3일 전", type: "text" },
        { id: "h3-2", sender: "user", text: "📺 구독료 정리", timestamp: "3일 전", type: "text" },
        { id: "h3-3", sender: "ai", text: "구독 서비스를 정리해드릴게요! 매달 지출하시는 구독료 총액을 선택하거나 입력해주세요.", timestamp: "3일 전", type: "text" },
        { id: "h3-4", sender: "user", text: "29,900원", timestamp: "3일 전", type: "text" },
        {
          id: "h3-5",
          sender: "ai",
          text: "김지윤님의 구독료를 분석한 고정비 다이어트 리포트입니다. 사용하지 않는 서비스를 찾아내어 해지하는 것을 추천합니다! 📺",
          timestamp: "3일 전",
          type: "fixed-report",
          data: {
            categoryLabel: "구독 서비스",
            currentSpending: 29900,
            recommendedAction: "안 쓰는 구독 1개 해지 및 통신사 제휴 서비스 활용",
            monthlySavings: 14900,
            yearlySavings: 178800,
            checklist: ["구독 플랫폼 결제 내역 확인하기", "안 쓰는 구독 서비스 즉시 해약하기"]
          }
        }
      ]);
    }
  };

  // ─── Quick Actions & State Transitions ──────────────────────────────────────

  const handleSelectAction = (actionId: string) => {
    addUserMessage(actionId);

    setTimeout(() => {
      if (actionId === "상품 살까 말까") {
        setChatState("product_category");
        addAiMessage("좋아요! 구매를 고민하고 계신 상품의 카테고리를 선택해주세요.", "product-category-select");
      } 
      else if (actionId === "가성비 Top 10") {
        setChatState("idle");
        addAiMessage("모잇이 실시간 리뷰와 가격 추이를 분석해 엄선한 가성비 Top 추천 상품 리스트입니다! ✨", "product-recommendations", PRODUCTS);
      } 
      else if (actionId === "통신비 줄이기") {
        setChatState("fixed_amount");
        setFixedSelectedIds(["telecom"]);
        setFixedCurrentIndex(0);
        addAiMessage("통신비 다이어트를 도와드릴게요! 현재 매달 지출하시는 통신비 요금을 선택하거나 입력해주세요.", "fixed-amount-select", "telecom");
      } 
      else if (actionId === "구독료 정리") {
        setChatState("fixed_amount");
        setFixedSelectedIds(["subscription"]);
        setFixedCurrentIndex(0);
        addAiMessage("구독 서비스를 정리해드릴게요! 매달 지출하시는 구독료 총액을 선택하거나 입력해주세요.", "fixed-amount-select", "subscription");
      } 
      else if (actionId === "전체 고정비 진단") {
        setChatState("fixed_select");
        addAiMessage("매달 지출하시는 고정비 항목 중 진단해 볼 항목을 모두 선택해주세요!", "fixed-category-select");
      }
    }, 400);
  };

  // User input submit (custom typing)
  const handleSendText = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    addUserMessage(text);
    setInputValue("");

    setTimeout(() => {
      // Process text based on current state
      if (chatState === "product_purpose") {
        handleProductPurposeSubmit(text);
      } else if (chatState === "fixed_amount") {
        // Parse number if possible
        const parsed = parseInt(text.replace(/[^0-9]/g, ""));
        if (!isNaN(parsed) && parsed > 0) {
          handleFixedAmountSubmit(parsed);
        } else {
          addAiMessage("숫자로 금액을 입력해 주세요. (예: 50000 또는 5만원)");
        }
      } else {
        // Fallback friendly AI chat
        addAiMessage("소비 요정 모잇이에요! 요술 지팡이로 지출을 줄여볼까요? 하단의 퀵 액션 칩을 눌러 상품 진단이나 고정비 다이어트를 즉시 시작해보세요! 🧚✨");
      }
    }, 600);
  };

  // ─── Interaction Handlers ──────────────────────────────────────────────────

  const handleProductCategorySelect = (catId: string, label: string) => {
    addUserMessage(`${label} 💻`);
    setProductCategory(catId);
    
    setTimeout(() => {
      setChatState("product_budget");
      addAiMessage("고민 중이신 예산 범위를 선택해주세요.", "product-budget-select");
    }, 500);
  };

  const handleProductBudgetSelect = (budget: string) => {
    addUserMessage(budget);
    setProductBudget(budget);

    setTimeout(() => {
      setChatState("product_purpose");
      addAiMessage(
        "사용 목적이나 추가적으로 고려하고 계신 점이 있으신가요? (예: 대학원 논문 작업, 영상 편집, 가벼운 인터넷 사용...)",
        "product-purpose-select"
      );
    }, 500);
  };

  const handleProductPurposeSubmit = (purpose: string) => {
    if (purpose === "SKIP") {
      addUserMessage("건너뛰기");
      purpose = "기본 다용도 사용";
    } else {
      addUserMessage(purpose);
    }

    // Show analyzer loader
    setTimeout(() => {
      addAiMessage("김지윤님의 소비 예산과 목적을 토대로 가성비 최적의 상품 정보를 실시간으로 수집하고 분석 중입니다...", "text");
    }, 400);

    setTimeout(() => {
      setChatState("idle");
      // Pick matching or top laptop products
      const recommended = PRODUCTS.filter((p) => p.price <= 1600000);
      addAiMessage(
        `김지윤님의 예산(${productBudget})과 목적(${purpose})에 딱 맞는 카테고리 추천 결과입니다! 가성비와 평점, 그리고 제 한 줄 평을 확인해보세요.`,
        "product-recommendations",
        recommended
      );

      // Add to Today's Checklist automatically!
      const newCheck = {
        id: `chk-prod-${Date.now()}`,
        text: `${productCategory === "notebook" ? "노트북" : "가전"} 구매 시 최저가 카드 청구할인 확인`,
        savings: 87600,
        done: false,
        category: "상품 진단",
      };
      setChecklist((prev) => {
        if (prev.some((x) => x.text === newCheck.text)) return prev;
        return [...prev, newCheck];
      });

      // Update sidebar history
      setRecentDiagnostics((prev) => [
        {
          id: `hist-${Date.now()}`,
          icon: "💻",
          title: "실시간 노트북 진단",
          result: "87,600원 절약",
          date: "방금 전",
          type: "product",
        },
        ...prev,
      ]);
    }, 1800);
  };

  // Fixed Cost Selection (Multi-select checkbox form inside chat)
  const handleFixedCategoryComplete = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      addAiMessage("항목을 최소 1개 이상 선택해주세요.");
      return;
    }
    
    const labels = selectedIds.map(id => FIXED_CATS.find(c => c.id === id)?.label).join(", ");
    addUserMessage(`선택 완료 (${labels})`);
    
    setFixedSelectedIds(selectedIds);
    setFixedCurrentIndex(0);
    
    setTimeout(() => {
      setChatState("fixed_amount");
      const firstCatId = selectedIds[0];
      const catLabel = FIXED_CATS.find(c => c.id === firstCatId)?.label;
      addAiMessage(`[${catLabel}] 다이어트를 시작하겠습니다. 현재 매달 평균적으로 납부하시는 금액을 선택하거나 텍스트로 입력해주세요.`, "fixed-amount-select", firstCatId);
    }, 600);
  };

  const handleFixedAmountSelect = (amount: number) => {
    addUserMessage(`${fmt(amount)}원`);
    handleFixedAmountSubmit(amount);
  };

  const handleFixedAmountSubmit = (amount: number) => {
    const currentCatId = fixedSelectedIds[fixedCurrentIndex];
    const updatedAmounts = { ...fixedAmounts, [currentCatId]: amount };
    setFixedAmounts(updatedAmounts);

    const nextIndex = fixedCurrentIndex + 1;
    if (nextIndex < fixedSelectedIds.length) {
      setFixedCurrentIndex(nextIndex);
      setTimeout(() => {
        const nextCatId = fixedSelectedIds[nextIndex];
        const catLabel = FIXED_CATS.find(c => c.id === nextCatId)?.label;
        addAiMessage(`다음으로 [${catLabel}] 금액을 선택하거나 입력해주세요.`, "fixed-amount-select", nextCatId);
      }, 500);
    } else {
      // All amounts entered, generate report!
      setTimeout(() => {
        addAiMessage("입력해주신 정보를 바탕으로 모잇 AI가 고정비 절감 요소를 정밀 계산하고 있습니다... ⚡");
      }, 400);

      setTimeout(() => {
        setChatState("idle");
        
        // Generate reports for all chosen items
        fixedSelectedIds.forEach((catId) => {
          const cat = FIXED_CATS.find((c) => c.id === catId)!;
          const userAmt = updatedAmounts[catId] || cat.savings * 4;
          
          // Generate individual report
          const monthlySavings = cat.savings;
          const yearlySavings = monthlySavings * 12;
          const tips = SAVINGS_TIPS[catId] || ["통합 실적 비교하기", "결합 조건 확인하기"];

          addAiMessage(
            `김지윤님의 ${cat.label} 지출을 분석한 고정비 다이어트 리포트입니다. 불필요하게 새는 비용을 줄여보세요!`,
            "fixed-report",
            {
              categoryLabel: cat.label,
              currentSpending: userAmt,
              recommendedAction: `${cat.tipTitle} 실행 및 ${tips[0]}`,
              monthlySavings,
              yearlySavings,
              checklist: tips,
            }
          );

          // Append items to right panel checklist
          tips.forEach((tipText, idx) => {
            const newItem = {
              id: `chk-fixed-${catId}-${idx}-${Date.now()}`,
              text: tipText,
              savings: Math.round(monthlySavings / tips.length),
              done: false,
              category: cat.label,
            };
            setChecklist((prev) => {
              if (prev.some((x) => x.text === newItem.text)) return prev;
              return [...prev, newItem];
            });
          });
        });

        // Add to sidebar history
        const firstCat = FIXED_CATS.find((c) => c.id === fixedSelectedIds[0])!;
        setRecentDiagnostics((prev) => [
          {
            id: `hist-${Date.now()}`,
            icon: firstCat.emoji,
            title: `${firstCat.label} 다이어트 외`,
            result: `월 ${fmt(fixedSelectedIds.reduce((acc, id) => acc + (FIXED_CATS.find((c) => c.id === id)?.savings || 0), 0))}원 절감`,
            date: "방금 전",
            type: "fixed",
          },
          ...prev,
        ]);

      }, 1600);
    }
  };

  // Checklist handler
  const handleToggleCheck = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* 1. Left Sidebar */}
      <Sidebar
        recentDiagnostics={recentDiagnostics}
        onNewDiagnosis={resetChat}
        onSelectHistory={handleSelectHistory}
        activeHistoryId={activeHistoryId}
      />

      {/* 2. Center Chat Workspace */}
      <main className="flex-1 flex flex-col h-full bg-slate-50 relative border-r border-border">
        {/* Chat Header */}
        <header className="h-[73px] bg-card border-b border-border px-6 flex items-center justify-between z-10 flex-shrink-0 select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
            <div>
              <h2 className="text-sm font-black text-primary">소비 요정 모잇과 대화 중</h2>
              <p className="text-[10px] text-muted-foreground">AI Coach Online · 실시간 절약 처방</p>
            </div>
          </div>
          <button
            onClick={resetChat}
            className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-muted/50 border border-border"
          >
            <RefreshCw size={13} />
            <span>대화 리셋</span>
          </button>
        </header>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
          {messages.map((msg) => {
            const isCategorySelect = msg.type === "product-category-select";
            const isBudgetSelect = msg.type === "product-budget-select";
            const isPurposeSelect = msg.type === "product-purpose-select";
            const isFixedSelect = msg.type === "fixed-category-select";
            const isFixedAmountSelect = msg.type === "fixed-amount-select";
            const isProductRec = msg.type === "product-recommendations";
            const isFixedReport = msg.type === "fixed-report";

            return (
              <React.Fragment key={msg.id}>
                {/* Standard Message Bubble */}
                {(msg.text || msg.type === "text") && (
                  <ChatMessage sender={msg.sender} text={msg.text} timestamp={msg.timestamp} />
                )}

                {/* Custom Inline Chat Interactive Elements */}
                {msg.sender === "ai" && (
                  <>
                    {/* Category Selection */}
                    {isCategorySelect && (
                      <ChatMessage sender="ai" timestamp={msg.timestamp}>
                        <div className="grid grid-cols-3 gap-2 w-72">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => handleProductCategorySelect(cat.id, cat.label)}
                              className="flex flex-col items-center py-2.5 px-1.5 rounded-xl border border-border bg-card hover:bg-emerald-50 hover:border-accent active:scale-[0.98] transition-all"
                            >
                              <span className="text-lg">{cat.emoji}</span>
                              <span className="text-[10px] font-bold text-muted-foreground mt-0.5">
                                {cat.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </ChatMessage>
                    )}

                    {/* Budget Selection */}
                    {isBudgetSelect && (
                      <ChatMessage sender="ai" timestamp={msg.timestamp}>
                        <div className="flex flex-wrap gap-2 max-w-sm">
                          {BUDGETS.map((b) => (
                            <button
                              key={b}
                              onClick={() => handleProductBudgetSelect(b)}
                              className="px-3 py-1.5 rounded-xl border border-border bg-card text-[11px] font-bold text-primary hover:bg-accent hover:text-white hover:border-accent active:scale-[0.98] transition-all"
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      </ChatMessage>
                    )}

                    {/* Purpose Selection */}
                    {isPurposeSelect && (
                      <ChatMessage sender="ai" timestamp={msg.timestamp}>
                        <div className="space-y-3 max-w-xs">
                          <div className="flex flex-wrap gap-1.5">
                            {["💻 업무/공부용", "🎬 영상/사진 편집", "🌐 가벼운 웹서핑", "🎮 게이밍"].map((purposeOption) => (
                              <button
                                key={purposeOption}
                                onClick={() => handleProductPurposeSubmit(purposeOption)}
                                className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-[10px] font-bold text-muted-foreground hover:bg-accent/10 hover:text-primary hover:border-accent active:scale-[0.98] transition-all"
                              >
                                {purposeOption}
                              </button>
                            ))}
                            <button
                              onClick={() => handleProductPurposeSubmit("SKIP")}
                              className="px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 text-[10px] font-bold text-muted-foreground hover:bg-muted/80 active:scale-[0.98] transition-all"
                            >
                              건너뛰기 ⏩
                            </button>
                          </div>
                        </div>
                      </ChatMessage>
                    )}

                    {/* Fixed Cost Multi-select Checkboxes */}
                    {isFixedSelect && (
                      <ChatMessage sender="ai" timestamp={msg.timestamp}>
                        <FixedSelectorForm onComplete={handleFixedCategoryComplete} />
                      </ChatMessage>
                    )}

                    {/* Fixed Cost Amount Selector */}
                    {isFixedAmountSelect && (
                      <ChatMessage sender="ai" timestamp={msg.timestamp}>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {(QUICK_AMOUNTS[msg.data] || []).map((amt) => (
                              <button
                                key={amt}
                                onClick={() => handleFixedAmountSelect(amt)}
                                className="px-2.5 py-1.5 rounded-xl border border-border bg-card text-[10px] font-bold text-primary hover:bg-accent hover:text-white hover:border-accent active:scale-[0.98] transition-all"
                              >
                                {amt >= 10000 ? `${(amt / 10000).toFixed(0)}만` : fmt(amt)}원
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-muted-foreground">
                            * 목록에 없거나 정확한 금액이 있다면 하단 채팅창에 직접 타이핑해서 입력 후 전송하셔도 됩니다.
                          </p>
                        </div>
                      </ChatMessage>
                    )}

                    {/* Product Recommendations */}
                    {isProductRec && msg.data && (
                      <div className="flex flex-col gap-2 pl-11 self-start w-full">
                        {msg.data.map((prod: Product) => (
                          <ProductRecommendationCard key={prod.id} product={prod} />
                        ))}
                      </div>
                    )}

                    {/* Fixed Savings Report Card */}
                    {isFixedReport && msg.data && (
                      <div className="pl-11 self-start w-full">
                        <SavingsReportCard
                          categoryLabel={msg.data.categoryLabel}
                          currentSpending={msg.data.currentSpending}
                          recommendedAction={msg.data.recommendedAction}
                          monthlySavings={msg.data.monthlySavings}
                          yearlySavings={msg.data.yearlySavings}
                          checklist={msg.data.checklist}
                        />
                      </div>
                    )}
                  </>
                )}
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Bottom Input Area */}
        <div className="p-4 bg-card border-t border-border flex flex-col gap-2 z-10 flex-shrink-0">
          {/* Quick Action Chips displayed at bottom when conversation is idle */}
          {chatState === "idle" && (
            <div className="border-b border-dashed border-border pb-1">
              <QuickActionChips onSelectAction={handleSelectAction} />
            </div>
          )}

          {/* Typing Input Box */}
          <div className="flex items-center gap-2.5 bg-muted/50 border border-border rounded-2xl px-4 py-2.5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendText()}
              placeholder={
                chatState === "product_purpose"
                  ? "목적을 입력하거나 위의 옵션 칩을 클릭하세요..."
                  : chatState === "fixed_amount"
                  ? "금액을 직접 입력하거나 위의 추천 금액을 클릭하세요..."
                  : "모잇에게 지출 진단이나 상품 추천을 물어보세요..."
              }
              className="flex-1 bg-transparent text-sm text-primary focus:outline-none placeholder:text-muted-foreground/80"
            />
            <button
              onClick={handleSendText}
              disabled={!inputValue.trim()}
              className={`p-2 rounded-xl transition-all ${
                inputValue.trim()
                  ? "bg-accent text-white active:scale-95 shadow-sm shadow-accent/20"
                  : "bg-muted-foreground/20 text-muted-foreground/60 cursor-not-allowed"
              }`}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </main>

      {/* 3. Right Insight Panel */}
      <InsightPanel checklist={checklist} onToggleCheck={handleToggleCheck} />
    </div>
  );
}

// ─── Inline Component: Fixed Category Multi-Selector ──────────────────────────

interface FixedSelectorFormProps {
  onComplete: (selected: string[]) => void;
}

function FixedSelectorForm({ onComplete }: FixedSelectorFormProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 w-72">
      <div className="grid grid-cols-2 gap-2">
        {FIXED_CATS.map((cat) => {
          const isSelected = selected.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-emerald-50 border-accent text-primary font-bold shadow-sm"
                  : "bg-card border-border text-muted-foreground hover:bg-secondary/40"
              }`}
            >
              <span className="text-base">{cat.emoji}</span>
              <span className="text-[10px] leading-tight flex-1 truncate">{cat.label}</span>
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? "bg-accent border-accent text-white" : "border-muted-foreground/50 bg-card"
                }`}
              >
                {isSelected && <Check size={8} strokeWidth={4} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={() => onComplete(selected)}
        disabled={selected.length === 0}
        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all ${
          selected.length > 0
            ? "bg-accent text-white active:scale-95 shadow-md shadow-accent/10"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {selected.length > 0 ? `${selected.length}개 항목 진단 시작 →` : "항목을 선택해주세요"}
      </button>
    </div>
  );
}
