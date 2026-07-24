// src/app/features/chat-flow/shared/useChatAutoScroll.ts
//
// 통합 자동 스크롤 훅 — 모든 카테고리 공통
//
// ⚡ 원칙 기반 Clean Implementation:
//   1. 유저가 위로 스크롤(wheel deltaY < 0, touchmove 위쪽)하는 순간 userScrolledUpRef = true
//   2. userScrolledUpRef = true 상태에서는 ResizeObserver/MutationObserver/이미지 로드가 절대 스크롤을 이동시키지 않음
//   3. AI 답변 스트리밍 및 메시지 추가 시 behavior: 'smooth'로 하단 부드럽게 이동
//   4. 유저가 손으로 맨 최하단 바닥(remaining < 20px)까지 내렸을 때만 락 해제
//   5. 어떠한 setTimeout 지연 타이머나 복잡한 애니메이션 루프도 사용하지 않는 단일 구조

import { useCallback, useEffect, useRef } from "react";

interface UseChatAutoScrollOptions {
  messagesLength: number;
  contentRevision?: number;
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

interface UseChatAutoScrollReturn {
  handleScroll: () => void;
  handleUserScrollIntent: () => void;
}

export const useChatAutoScroll = ({
  messagesLength,
  contentRevision = 0,
  scrollContainerRef,
}: UseChatAutoScrollOptions): UseChatAutoScrollReturn => {
  // 유저가 위로 스크롤을 올렸는지 여부 플래그
  const userScrolledUpRef = useRef(false);
  const prevMessagesLengthRef = useRef(messagesLength);
  const prevContentRevisionRef = useRef(contentRevision);

  /** 바닥으로 부드럽게 스크롤 이동 함수 */
  const scrollToBottom = useCallback(() => {
    // 유저가 위로 스크롤한 상태라면 절대 하단으로 스크롤하지 않음
    if (userScrolledUpRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [scrollContainerRef]);

  // ── 1. 네이티브 입력 이벤트 (wheel, touchstart, touchmove, scroll) ──
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastTouchY = 0;

    const onWheel = (e: WheelEvent) => {
      // 휠을 위로 올릴 때 (deltaY < 0) 즉시 유저 스크롤 락
      if (e.deltaY < 0) {
        userScrolledUpRef.current = true;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        lastTouchY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touchY = e.touches[0].clientY;
        // 터치 드래그로 화면을 내림 (콘텐츠 위로 올림)
        if (touchY > lastTouchY + 2) {
          userScrolledUpRef.current = true;
        }
        lastTouchY = touchY;
      }
    };

    const onScroll = () => {
      const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
      // 유저가 손으로 바닥 끝(20px 이내)까지 끌어내린 경우에만 락 해제
      if (remaining < 20) {
        userScrolledUpRef.current = false;
      }
    };

    // 캡처 페이즈로 최우선 감지
    container.addEventListener("wheel", onWheel, { capture: true, passive: true });
    container.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    container.addEventListener("touchmove", onTouchMove, { capture: true, passive: true });
    container.addEventListener("scroll", onScroll, { capture: true, passive: true });

    return () => {
      container.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions);
      container.removeEventListener("touchstart", onTouchStart, { capture: true } as EventListenerOptions);
      container.removeEventListener("touchmove", onTouchMove, { capture: true } as EventListenerOptions);
      container.removeEventListener("scroll", onScroll, { capture: true } as EventListenerOptions);
    };
  }, [scrollContainerRef]);

  // ── 2. 메시지 수 / 콘텐츠 리비전 추가 감지 시 스크롤 이동 ──────────
  useEffect(() => {
    const prevMessages = prevMessagesLengthRef.current;
    const prevRevision = prevContentRevisionRef.current;
    prevMessagesLengthRef.current = messagesLength;
    prevContentRevisionRef.current = contentRevision;

    const messagesAdded = messagesLength > prevMessages;
    const revisionIncreased = contentRevision > prevRevision;
    if (!messagesAdded && !revisionIncreased) return;

    // 새로운 메시지나 카드가 생성될 때 유저가 최하단 부근에 있다면 부드럽게 스크롤
    scrollToBottom();
  }, [messagesLength, contentRevision, scrollToBottom]);

  // ── 3. DOM 크기 변형 / 스트리밍 감지 (ResizeObserver & MutationObserver) ──
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleSizeChange = () => {
      // 유저가 위로 스크롤한 상태면 무조건 무시
      if (userScrolledUpRef.current) return;
      scrollToBottom();
    };

    const resizeObserver = new ResizeObserver(handleSizeChange);
    resizeObserver.observe(container);
    if (container.firstElementChild) {
      resizeObserver.observe(container.firstElementChild);
    }

    const mutationObserver = new MutationObserver(handleSizeChange);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [scrollContainerRef, scrollToBottom]);

  // React 합성 이벤트 인터페이스 호환용 핸들러 (사용자가 올린 경우 락)
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining < 20) {
      userScrolledUpRef.current = false;
    }
  }, [scrollContainerRef]);

  const handleUserScrollIntent = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining > 20) {
      userScrolledUpRef.current = true;
    }
  }, [scrollContainerRef]);

  return { handleScroll, handleUserScrollIntent };
};
