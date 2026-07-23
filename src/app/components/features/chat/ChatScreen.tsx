import React, { useCallback, useEffect, useRef, useState } from "react";
import { getSubCategoryById } from "../../../data/categories";
import { useChatFlow } from "../../../features/chat-flow/engine/useChatFlow";
import type { ConversationHistoryItem, SubCategory, SubCategoryId, TopActionState } from "../../../types/moit";
import ChatFlowInput from "./ChatFlowInput";
import ChatHeader from "./ChatHeader";
import ChatConversationTurn from "./ChatConversationTurn";
import ChatTimelineRow from "./ChatTimelineRow";
import ChatSidebar from "./ChatSidebar";
import DiagnosisResultCard from "./DiagnosisResultCard";
import { buildSmartShoppingGreeting } from "../../../features/smart-shopping/greeting/buildSmartShoppingGreeting";
import type { UserProfile } from "../../../features/smart-shopping/user/userProfile";
import type { PriceAlertDraft } from "../../../features/smart-shopping/price-alerts/types";

import type { FavoriteProduct, FavoriteDraft } from "../../../features/favorites/types";
import RecommendationSelectionView from "../../../features/smart-shopping/recommendation/RecommendationSelectionView";
import { isSmartShoppingConversationItem, SmartShoppingAlternativeCards, SmartShoppingWideTimelineContent, type SmartShoppingTimelineRenderModel } from "../../../features/smart-shopping/timeline/SmartShoppingTimeline";
import type { ProductRecommendation } from "../../../features/product-catalog/core/types";
import ProductQuestionSources from "../../../features/smart-shopping/product-detail/ProductQuestionSources";
import type { ProductQuestionSource } from "../../../features/smart-shopping/product-detail/productQuestionClient";
import type { SubmittedFlowAnswer } from "../../../features/chat-flow/core/types";

interface ChatScreenProps {
  subCategoryId: SubCategoryId;
  onBack: () => void;
  onSelectSubCategory: (item: SubCategory) => void;
  actions: TopActionState;
  userProfile: UserProfile;
  onEndSmartShoppingChat: () => void;
  onCreatePriceAlert: (draft: PriceAlertDraft) => unknown;
  favorites?: FavoriteProduct[];
  onToggleFavoriteProduct?: (productId: string, draft: FavoriteDraft) => void;
  onToggleFavorite?: (draft: FavoriteDraft) => void;
}

export const PRODUCT_SELECTION_SCROLL_OFFSET = 16;
export const CHAT_BOTTOM_STICKY_THRESHOLD = 96;
export const CHAT_SCROLL_BOTTOM_EPSILON = 1;
type ChatScrollContainer = Pick<HTMLElement, "scrollTop" | "scrollHeight" | "clientHeight" | "getBoundingClientRect" | "scrollTo">;
export type ChatScrollDirection = "up" | "down" | "none";

export const getChatScrollDirection = ({ previousScrollTop, currentScrollTop }: { previousScrollTop: number; currentScrollTop: number }): ChatScrollDirection => {
  if (currentScrollTop < previousScrollTop - CHAT_SCROLL_BOTTOM_EPSILON) return "up";
  if (currentScrollTop > previousScrollTop + CHAT_SCROLL_BOTTOM_EPSILON) return "down";
  return "none";
};

export const resolveChatScrollOwnership = ({
  remainingScroll,
  manualScrollIntent,
  scrollDirection = "none",
}: {
  remainingScroll: number;
  manualScrollIntent: boolean;
  scrollDirection?: ChatScrollDirection;
}) => {
  const isNearBottom = remainingScroll < CHAT_BOTTOM_STICKY_THRESHOLD;
  const returnedNearBottom = manualScrollIntent && scrollDirection === "down" && isNearBottom;
  const keepsManualControl = manualScrollIntent && remainingScroll > CHAT_SCROLL_BOTTOM_EPSILON && !returnedNearBottom;
  return {
    manualScrollIntent: keepsManualControl,
    shouldStickToBottom: !keepsManualControl && isNearBottom,
  };
};

export const getProductSelectionScrollPosition = ({ container, anchor }: {
  container: Pick<ChatScrollContainer, "scrollTop" | "scrollHeight" | "clientHeight" | "getBoundingClientRect">;
  anchor: Pick<HTMLElement, "getBoundingClientRect">;
}) => {
  const desiredScrollTop = container.scrollTop + anchor.getBoundingClientRect().top - container.getBoundingClientRect().top - PRODUCT_SELECTION_SCROLL_OFFSET;
  const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
  const targetScrollTop = Math.min(Math.max(0, desiredScrollTop), maxScrollTop);
  return {
    currentScrollTop: container.scrollTop,
    desiredScrollTop,
    targetScrollTop,
    scrollHeight: container.scrollHeight,
    clientHeight: container.clientHeight,
    maxScrollTop,
    wasClamped: desiredScrollTop > maxScrollTop,
  };
};

export const scrollContainerToProductSelectionAnchor = ({ container, anchor, behavior }: {
  container: ChatScrollContainer;
  anchor: Pick<HTMLElement, "getBoundingClientRect">;
  behavior: ScrollBehavior;
}) => {
  const position = getProductSelectionScrollPosition({ container, anchor });
  container.scrollTo({ top: position.targetScrollTop, behavior });
  return position;
};

const isRecommendationStartAnchor = (anchorId: string) => anchorId.includes("-recommendation-start-");

export const shouldCorrectRecommendationStartScroll = ({
  initialMaxScrollTop,
  nextMaxScrollTop,
  isCurrentAnchor,
  userScrolled,
  corrected,
}: {
  initialMaxScrollTop: number;
  nextMaxScrollTop: number;
  isCurrentAnchor: boolean;
  userScrolled: boolean;
  corrected: boolean;
}) => isCurrentAnchor && !userScrolled && !corrected && nextMaxScrollTop > initialMaxScrollTop;

export default function ChatScreen({
  subCategoryId,
  onBack,
  onSelectSubCategory,
  actions,
  userProfile,
  onEndSmartShoppingChat,
  onCreatePriceAlert,
  favorites,
  onToggleFavoriteProduct,
  onToggleFavorite,
}: ChatScreenProps) {
  const item = getSubCategoryById(subCategoryId);
  const flow = useChatFlow(subCategoryId);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [areActionsCollapsed, setAreActionsCollapsed] = useState(false);
  const [notice, setNotice] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const manualScrollIntentRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const programmaticScrollTargetRef = useRef<number | null>(null);
  const productSelectionScrollFrameRef = useRef<number | null>(null);
  const scrolledProductSelectionAnchorsRef = useRef(new Set<string>());
  const currentRecommendationStartAnchorRef = useRef<string | null>(null);
  const recommendationStartCorrectionRef = useRef<{
    anchorId: string;
    anchor: HTMLDivElement;
    initialMaxScrollTop: number;
    userScrolled: boolean;
    corrected: boolean;
  } | null>(null);
  const [timelineRevision, setTimelineRevision] = useState(0);

  useEffect(() => () => {
    if (productSelectionScrollFrameRef.current !== null) window.cancelAnimationFrame(productSelectionScrollFrameRef.current);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
    const container = scrollContainerRef.current;
    if (container) {
      const targetScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      programmaticScrollTargetRef.current = targetScrollTop;
      container.scrollTo({ top: targetScrollTop, behavior });
    }
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");

    const rafId = requestAnimationFrame(() => {
      scrollToBottom("smooth");
    });
    const timerId = setTimeout(() => {
      scrollToBottom("smooth");
    }, 100);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [flow.messages, flow.supplementalMessages, flow.currentStep, flow.isTransitioning, timelineRevision, scrollToBottom]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const currentScrollTop = container.scrollTop;
    const programmaticTarget = programmaticScrollTargetRef.current;
    if (programmaticTarget !== null) {
      if (Math.abs(currentScrollTop - programmaticTarget) <= CHAT_SCROLL_BOTTOM_EPSILON) {
        programmaticScrollTargetRef.current = null;
      }
      lastScrollTopRef.current = currentScrollTop;
      return;
    }
    const ownership = resolveChatScrollOwnership({
      remainingScroll: container.scrollHeight - currentScrollTop - container.clientHeight,
      manualScrollIntent: manualScrollIntentRef.current,
      scrollDirection: getChatScrollDirection({ previousScrollTop: lastScrollTopRef.current, currentScrollTop }),
    });
    manualScrollIntentRef.current = ownership.manualScrollIntent;
    shouldStickToBottomRef.current = ownership.shouldStickToBottom;
    lastScrollTopRef.current = currentScrollTop;
  };

  const takeChatScrollControl = () => {
    manualScrollIntentRef.current = true;
    shouldStickToBottomRef.current = false;
    programmaticScrollTargetRef.current = null;
    const correction = recommendationStartCorrectionRef.current;
    if (correction) correction.userScrolled = true;
    if (productSelectionScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(productSelectionScrollFrameRef.current);
      productSelectionScrollFrameRef.current = null;
    }
    const container = scrollContainerRef.current;
    if (container) {
      lastScrollTopRef.current = container.scrollTop;
      container.scrollTo({ top: container.scrollTop, behavior: "auto" });
    }
  };

  const cancelRecommendationStartCorrectionOnScrollKey = (event: React.KeyboardEvent<HTMLElement>) => {
    if ([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) {
      takeChatScrollControl();
    }
  };

  const scrollToProductSelectionAnchor = useCallback((anchorId: string, anchor: HTMLDivElement | null) => {
    if (!anchor || scrolledProductSelectionAnchorsRef.current.has(anchorId)) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const isRecommendationStart = isRecommendationStartAnchor(anchorId);
    if (isRecommendationStart) currentRecommendationStartAnchorRef.current = anchorId;
    else recommendationStartCorrectionRef.current = null;
    manualScrollIntentRef.current = false;
    shouldStickToBottomRef.current = false;
    if (productSelectionScrollFrameRef.current !== null) window.cancelAnimationFrame(productSelectionScrollFrameRef.current);
    productSelectionScrollFrameRef.current = window.requestAnimationFrame(() => {
      productSelectionScrollFrameRef.current = null;
      if (!anchor.isConnected || !container.isConnected) return;
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      programmaticScrollTargetRef.current = getProductSelectionScrollPosition({ container, anchor }).targetScrollTop;
      const position = scrollContainerToProductSelectionAnchor({ container, anchor, behavior: reducedMotion ? "auto" : "smooth" });
      scrolledProductSelectionAnchorsRef.current.add(anchorId);
      if (isRecommendationStart && position.wasClamped) {
        recommendationStartCorrectionRef.current = {
          anchorId,
          anchor,
          initialMaxScrollTop: position.maxScrollTop,
          userScrolled: false,
          corrected: false,
        };
      }
    });
  }, []);

  const correctRecommendationStartScroll = useCallback(() => {
    const correction = recommendationStartCorrectionRef.current;
    const container = scrollContainerRef.current;
    if (!correction || correction.corrected || correction.userScrolled || correction.anchorId !== currentRecommendationStartAnchorRef.current || !container || !correction.anchor.isConnected || !container.isConnected) return;

    const position = getProductSelectionScrollPosition({ container, anchor: correction.anchor });
    if (!shouldCorrectRecommendationStartScroll({
      initialMaxScrollTop: correction.initialMaxScrollTop,
      nextMaxScrollTop: position.maxScrollTop,
      isCurrentAnchor: correction.anchorId === currentRecommendationStartAnchorRef.current,
      userScrolled: correction.userScrolled,
      corrected: correction.corrected,
    })) return;

    correction.corrected = true;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    programmaticScrollTargetRef.current = position.targetScrollTop;
    scrollContainerToProductSelectionAnchor({ container, anchor: correction.anchor, behavior: reducedMotion ? "auto" : "smooth" });
  }, []);

  const submitAnswerWithSmartShoppingFollow = (answer: SubmittedFlowAnswer) => {
    if (item?.parentCategory === "appliances") {
      manualScrollIntentRef.current = false;
      shouldStickToBottomRef.current = true;
      programmaticScrollTargetRef.current = null;
    }
    flow.submitAnswer(answer);
  };

  /* 🎨 [프론트엔드 수정 가능 Zone 1: 예외/에러 화면 UI]
     - flex h-screen w-screen: 전체 중앙 정렬 방식
     - bg-background / text-primary: 배경색 및 문구 색상
     - 텍스트/경고 아이콘 추가 가능
  */
  if (!item) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-primary">
        선택한 진단 항목을 찾을 수 없습니다.
      </div>
    );
  }

  const handleHistorySelect = (historyItem: ConversationHistoryItem) => {
    setNotice(`${historyItem.title} 상세 화면은 다음 단계에서 연결할게요.`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    /* 🎨 [프론트엔드 수정 가능 Zone 2: 전체 애플리케이션 프레임/레이아웃]
       - bg-background / text-foreground: 챗봇 전체 테마 색상 설정
       - flex h-screen w-screen: 화면 꽉 채움 레이아웃
    */
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <ChatSidebar
        activeSubCategoryId={subCategoryId}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
        onBackToMain={onBack}
        onSelectSubCategory={onSelectSubCategory}
        onSelectHistory={handleHistorySelect}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          actions={actions}
          areActionsCollapsed={areActionsCollapsed}
          onToggleActionsCollapsed={() => setAreActionsCollapsed((value) => !value)}
        />

        {/* 🎨 [프론트엔드 수정 가능 Zone 3: 대화 메인 영역 패딩 & 스크롤 영역]
           - p-5: 대화창 내부 패딩 여백 (p-4, p-6 등으로 변경)
           - overflow-y-auto: 스크롤 동작 속성
        */}
        <main ref={scrollContainerRef} onScroll={handleScroll} onWheel={takeChatScrollControl} onPointerDown={takeChatScrollControl} onTouchStart={takeChatScrollControl} onKeyDown={cancelRecommendationStartCorrectionOnScrollKey} className="flex-1 overflow-y-auto p-5">
          
          {/* 🎨 [프론트엔드 수정 가능 Zone 4: 메시지 타임라인 컨테이너 (너비 및 간격)]
             - max-w-4xl: 메시지 영역의 최대 너비 (max-w-3xl, max-w-5xl 등)
             - gap-4: 메시지 카드/말풍선 간의 상하 간격 (gap-3, gap-5 등)
          */}
          <div className="mx-auto grid w-full max-w-4xl grid-cols-[minmax(0,1fr)] gap-4" aria-live="polite" data-chat-timeline-root>
            {item.parentCategory === "appliances" && (
              <ChatConversationTurn sender="ai" text={buildSmartShoppingGreeting(userProfile.displayName, item.title)} />
            )}
            {flow.messages.map((message, index) => {
              const isLast = index === flow.messages.length - 1;
              const isAi = message.sender === "ai";
              const renderedResult = message.result ?? flow.result;
              const isSmartShoppingResult = Boolean(renderedResult?.recommendations);
              const flowSelectionAnchorId = message.sender === "user" && typeof message.metadata?.productSelectionAnchorId === "string"
                ? message.metadata.productSelectionAnchorId
                : undefined;
              
              // 선택형 단계이거나 완료 상태인 경우에만 인라인 선택지를 표시합니다.
              const isSelectionStep = flow.currentStep && ["single-choice", "multi-choice", "confirmation"].includes(flow.currentStep.type);
              const showInlineInput = isLast && isAi && (isSelectionStep || flow.completed);
              const currentStepForMessage = showInlineInput ? flow.currentStep : (isAi ? message.step : undefined);

              return (
                <React.Fragment key={message.id}>
                  {message.text && (
                    <ChatConversationTurn
                      sender={message.sender}
                      text={message.text}
                      timestamp={message.timestamp}
                      step={currentStepForMessage}
                      completed={isLast ? flow.completed : false}
                      onSubmit={submitAnswerWithSmartShoppingFollow}
                      onReset={flow.reset}
                      canUndo={isLast && isAi && Boolean(flow.currentStep) && flow.canUndo}
                      undoDisabled={flow.isTransitioning}
                      onUndo={flow.undoLatestAnswer}
                      onGoBack={flow.goBack}
                      favorites={favorites}
                      onToggleFavoriteProduct={onToggleFavoriteProduct}
                      subCategoryId={subCategoryId}
                      userId={userProfile.id}
                      isHistorical={!isLast}
                      answers={flow.answers}
                      onEndSmartShoppingChat={onEndSmartShoppingChat}
                      selectionAnchorId={flowSelectionAnchorId}
                      onSelectionAnchorMount={scrollToProductSelectionAnchor}
                    />
                  )}
                  {message.type === "result" && renderedResult && !isSmartShoppingResult && renderedResult.metadata?.category !== "completed-exit" && (
                    /* 🎨 [프론트엔드 수정 가능 Zone 5: 일반 진단 결과 카드 들여쓰기/너비]
                       - pl-11: AI 메시지 로고 옆 결과 카드 들여쓰기 여백
                       - w-full: 결과 카드 너비
                    */
                    <div className="w-full self-start pl-11">
                      <DiagnosisResultCard result={renderedResult} onEndSmartShoppingChat={onEndSmartShoppingChat} onCreatePriceAlert={onCreatePriceAlert} onTimelineChange={() => setTimelineRevision((value) => value + 1)} userId={userProfile.id} />
                    </div>
                  )}
                  {message.type === "result" && renderedResult && isSmartShoppingResult && (
                    <RecommendationSelectionView
                      key={message.id}
                      result={renderedResult}
                      onEndSmartShoppingChat={onEndSmartShoppingChat}
                      onCreatePriceAlert={onCreatePriceAlert}
                      onTimelineChange={() => setTimelineRevision((value) => value + 1)}
                      userId={userProfile.id}
                      favorites={favorites ?? []}
                      onToggleFavorite={onToggleFavorite ?? (() => {})}
                      onProductSelectionAnchorMount={scrollToProductSelectionAnchor}
                      onRecommendationResultContainerMount={correctRecommendationStartScroll}
                      onRestartConditionSearch={flow.restartConditionSearch}
                      renderTimeline={(model) => <ChatScreenSmartShoppingTimeline model={model} />}
                    />
                  )}
                </React.Fragment>
              );
            })}
            
            {/* 🎨 [프론트엔드 수정 가능 Zone 6: 에러 메시지 바 경고창 UI]
               - rounded-lg / border-destructive/30 / bg-destructive/10 / text-destructive
               - 에러 발생 시 노출되는 빨간색 경고 상자 스타일링
            */}
            {flow.error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm font-bold text-destructive">
                {flow.error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* 🎨 [프론트엔드 수정 가능 Zone 7: 하단 입력창(Footer) 레이아웃 & 테두리]
           - border-t border-border bg-card p-4: 하단 고정 입력 영역 스타일
           - max-w-4xl: 입력 영역 최대 너비
        */}
        {/* 입력형 단계(number-input, text-input)인 경우에만 화면 하단에 입력창을 노출 */}
        {flow.currentStep && ["number-input", "text-input"].includes(flow.currentStep.type) && (
          <footer className="flex-shrink-0 border-t border-border bg-card p-4">
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
               <ChatFlowInput
                step={flow.currentStep}
                completed={flow.completed}
                onSubmit={submitAnswerWithSmartShoppingFollow}
                onReset={flow.reset}
                favorites={favorites}
                onToggleFavoriteProduct={onToggleFavoriteProduct}
                subCategoryId={subCategoryId}
                userId={userProfile.id}
              />
            </div>
          </footer>
        )}

        {/* 기존 하단 입력창 백업용 주석 처리
        <footer className="flex-shrink-0 border-t border-border bg-card p-4">
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
            <ChatFlowInput
              step={flow.currentStep}
              completed={flow.completed}
              onSubmit={submitAnswerWithSmartShoppingFollow}
              onReset={flow.reset}
            />
          </div>
        </footer>
        */}

      </div>

      {/* 🎨 [프론트엔드 수정 가능 Zone 8: 플로팅 알림(Toast Notice) 팝업 UI]
         - fixed bottom-5 left-1/2 -translate-x-1/2: 화면 하단 중앙 정렬 위치
         - rounded-lg / border / bg-card / shadow-lg: 토스트 팝업 그림자 및 카드 모양
         - text-sm / font-bold / text-primary: 토스트 글자 스타일
      */}
      {notice && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-bold text-primary shadow-lg">
          {notice}
        </div>
      )}
    </div>
  );
}

/** Smart Shopping owns its wide cards while conversational turns use the shared chat renderer. */
export function ChatScreenSmartShoppingTimeline({ model }: { model: SmartShoppingTimelineRenderModel }) {
  const { timeline, showClosestOverBudget, onShowClosestOverBudget, ...bindings } = model;
  return (
    <>
      {/* 🎨 [프론트엔드 수정 가능 Zone 9: 스마트 쇼핑 '예산 초과 상품 보기' 버튼 UI]
         - rounded-lg / border-accent / bg-card / text-accent / shadow-sm
         - hover:bg-secondary / focus:ring-2: 버튼 반응 효과 및 색상
      */}
      {showClosestOverBudget && (
        <ChatTimelineRow kind="wide">
          <button type="button" onClick={onShowClosestOverBudget} className="rounded-lg border border-accent bg-card px-4 py-2.5 text-sm font-black text-accent shadow-sm transition hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-accent/40">
            예산 초과가 가장 적은 상품 보기
          </button>
        </ChatTimelineRow>
      )}
      {timeline.map((timelineItem) => {
        if (isSmartShoppingConversationItem(timelineItem)) {
          const isAssistant = timelineItem.type === "assistant-text";
          const selectionAnchorId = timelineItem.type === "user-action" && typeof timelineItem.metadata?.productSelectionAnchorId === "string" ? timelineItem.metadata.productSelectionAnchorId : undefined;
          const alternatives = timelineItem.metadata?.alternatives as ProductRecommendation[] | undefined;
          const sources = isAssistant && Array.isArray(timelineItem.metadata?.usedSources) ? timelineItem.metadata.usedSources as ProductQuestionSource[] : [];
          return (
            <React.Fragment key={timelineItem.id}>
              <ChatConversationTurn sender={isAssistant ? "ai" : "user"} text={timelineItem.text} timestamp={timelineItem.timestamp} selectionAnchorId={selectionAnchorId} onSelectionAnchorMount={bindings.onProductSelectionAnchorMount}>{sources.length ? <ProductQuestionSources sources={sources} /> : null}</ChatConversationTurn>
              {alternatives?.length ? <ChatTimelineRow kind="wide"><SmartShoppingAlternativeCards items={alternatives} onSelect={bindings.onSelectRecommendation} isFavorite={(recommendation) => bindings.isFavorite({ source: "internal", recommendation })} onToggleFavorite={(recommendation) => bindings.onToggleFavorite({ source: "internal", recommendation })} /></ChatTimelineRow> : null}
            </React.Fragment>
          );
        }
        return <ChatTimelineRow key={timelineItem.id} kind="wide"><SmartShoppingWideTimelineContent item={timelineItem} {...bindings} /></ChatTimelineRow>;
      })}
    </>
  );
}
