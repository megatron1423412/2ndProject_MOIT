// src/app/features/chat-flow/shared/useChatAutoScroll.ts
//
// 통합 자동 스크롤 훅 — 모든 카테고리 공통
//
// ⚡ rAF Lerp 기반 부드러운 스크롤 + 유저 스크롤 즉시 캔슬 구조:
//   1. AI 답변 스트리밍 및 메시지 추가 시 단일 rAF Lerp 루프로 부드럽게 스르륵 이동
//   2. 유저가 위로 휠/터치(wheel deltaY < 0, touchmove 위쪽)하는 0.0ms 순간:
//      - userScrolledUpRef = true 락 설정
//      - cancelAnimationFrame + container.scrollTop 고정으로 진행 중인 rAF 루프 즉시 파괴!
//   3. ResizeObserver/MutationObserver 높이 변화 시:
//      - userScrolledUpRef가 true면 1ms도 지연 없이 즉시 return (절대 바닥으로 끌어당기지 않음)
//      - userScrolledUpRef가 false면 기존 rAF 루프의 목표값만 갱신하여 큐 쌓임 없이 매끄럽게 이어짐
//   4. 유저가 손으로 맨 바닥(remaining < 20px)까지 끌어내렸을 때만 락 해제

import { useCallback, useEffect, useRef } from "react";

/** Lerp 감속 비율 (매 프레임 18% 접근 → ~200ms 부드러운 스르륵 이동) */
const LERP_FACTOR = 0.18;

/** lerp 수렴 판정 (px) */
const SNAP_THRESHOLD = 1;

/** 유저가 최하단 바닥으로 복귀했는지 판정하는 거리 (px) */
const BOTTOM_UNLOCK_THRESHOLD = 20;

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

  // rAF 기반 부드러운 스크롤 애니메이션 루프 상태
  const isAnimatingRef = useRef(false);
  const animationRafRef = useRef<number | null>(null);
  const targetScrollTopRef = useRef(0);

  /** 진행 중인 rAF 부드러운 스크롤 애니메이션 즉시 강제 파괴 */
  const cancelOngoingSmoothScroll = useCallback(() => {
    isAnimatingRef.current = false;
    if (animationRafRef.current !== null) {
      cancelAnimationFrame(animationRafRef.current);
      animationRafRef.current = null;
    }
    const container = scrollContainerRef.current;
    if (container) {
      // 현재 scrollTop 위치로 고정하여 모든 이동 틱을 0.0ms에 파괴
      const current = container.scrollTop;
      container.scrollTop = current;
    }
  }, [scrollContainerRef]);

  /** rAF Lerp 기반 부드러운 자동 스크롤 시작 / 목표 위치 실시간 갱신 */
  const startSmoothScroll = useCallback(() => {
    if (userScrolledUpRef.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    // 목표 위치 설정
    targetScrollTopRef.current = Math.max(0, container.scrollHeight - container.clientHeight);

    // 이미 애니메이션 루프가 실행 중이면 목표값만 업데이트하고 리턴 (중복 큐 발생 차단)
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const loop = () => {
      const el = scrollContainerRef.current;
      // 유저가 위로 올려 락이 걸렸거나 컨테이너가 없으면 루프 즉시 정지
      if (!el || userScrolledUpRef.current) {
        isAnimatingRef.current = false;
        animationRafRef.current = null;
        return;
      }

      // 스트리밍이나 렌더링으로 높이가 계속 변하므로 매 프레임 목표 위치 갱신
      const target = Math.max(0, el.scrollHeight - el.clientHeight);
      const current = el.scrollTop;
      const diff = target - current;

      if (Math.abs(diff) <= SNAP_THRESHOLD) {
        el.scrollTop = target;
        isAnimatingRef.current = false;
        animationRafRef.current = null;
        return;
      }

      // Lerp: 매 프레임 18%씩 접근하여 부드러운 스르륵 애니메이션 생성
      el.scrollTop = current + diff * LERP_FACTOR;
      animationRafRef.current = requestAnimationFrame(loop);
    };

    animationRafRef.current = requestAnimationFrame(loop);
  }, [scrollContainerRef]);

  // ── 1. 네이티브 입력 이벤트 (wheel, touchstart, touchmove, scroll) ──
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let lastTouchY = 0;

    const onWheel = (e: WheelEvent) => {
      // 휠을 위로 올릴 때 (deltaY < 0) 즉시 락 설정 & 진행 중인 애니메이션 0.0ms 캔슬
      if (e.deltaY < 0) {
        userScrolledUpRef.current = true;
        cancelOngoingSmoothScroll();
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
          cancelOngoingSmoothScroll();
        }
        lastTouchY = touchY;
      }
    };

    const onScroll = () => {
      const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
      // 유저가 손으로 바닥 끝(20px 이내)까지 끌어내린 경우에만 락 해제
      if (remaining < BOTTOM_UNLOCK_THRESHOLD) {
        userScrolledUpRef.current = false;
      }
    };

    // 캡처 페이즈로 최우선 감지 (React 이벤트보다 먼저 실행)
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
  }, [scrollContainerRef, cancelOngoingSmoothScroll]);

  // ── 2. 메시지 수 / 콘텐츠 리비전 추가 감지 시 부드러운 스크롤 시작 ────
  useEffect(() => {
    const prevMessages = prevMessagesLengthRef.current;
    const prevRevision = prevContentRevisionRef.current;
    prevMessagesLengthRef.current = messagesLength;
    prevContentRevisionRef.current = contentRevision;

    const messagesAdded = messagesLength > prevMessages;
    const revisionIncreased = contentRevision > prevRevision;
    if (!messagesAdded && !revisionIncreased) return;

    startSmoothScroll();
  }, [messagesLength, contentRevision, startSmoothScroll]);

  // ── 3. DOM 크기 변형 / 스트리밍 감지 (ResizeObserver & MutationObserver) ──
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleSizeChange = () => {
      // 유저가 위로 스크롤한 상태면 무조건 무시
      if (userScrolledUpRef.current) return;
      // 기존 rAF 루프가 돌고 있다면 목표값만 업데이트하여 60fps/120fps로 스르륵 추적
      startSmoothScroll();
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
      cancelOngoingSmoothScroll();
    };
  }, [scrollContainerRef, startSmoothScroll, cancelOngoingSmoothScroll]);

  // React 합성 이벤트 인터페이스 호환용 핸들러 (사용자가 올린 경우 락)
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining < BOTTOM_UNLOCK_THRESHOLD) {
      userScrolledUpRef.current = false;
    }
  }, [scrollContainerRef]);

  const handleUserScrollIntent = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining > BOTTOM_UNLOCK_THRESHOLD) {
      userScrolledUpRef.current = true;
      cancelOngoingSmoothScroll();
    }
  }, [scrollContainerRef, cancelOngoingSmoothScroll]);

  return { handleScroll, handleUserScrollIntent };
};
