// src/app/features/chat-flow/shared/useChatAutoScroll.ts
//
// 통합 자동 스크롤 훅 — 모든 카테고리 공통
//
// ⚡ 설계 원칙:
//   1. CSS scroll-smooth, scrollIntoView 사용 안 함 (충돌/jitter 방지)
//   2. requestAnimationFrame + lerp 기반 수동 부드러운 스크롤 애니메이션
//   3. Observer 콜백은 '목표 갱신'만 하고, 실제 이동은 단일 rAF 루프가 담당
//   4. 하나의 애니메이션 루프만 존재하므로 충돌이 불가능

import { useCallback, useEffect, useRef } from "react";

/** 사용자가 하단 근처로 판정하는 여유 거리 (px) */
const NEAR_BOTTOM_THRESHOLD = 150;

/** 메시지 추가 후 자동 스크롤 윈도우 유지 시간 (ms) */
const AUTO_SCROLL_WINDOW_MS = 700;

/** 마무리 앵커링 지연 시간 (ms) — DOM 렌더링 확정 대기 */
const FINAL_ANCHOR_DELAY_MS = 100;

/**
 * Lerp 비율 (0~1): 매 프레임 현재 위치에서 목표까지 이 비율만큼 이동.
 * 0.18 = 매 프레임 18% 접근 → 약 ~200ms에 걸쳐 부드럽게 도달.
 * 값이 클수록 빠르게, 작을수록 느리게 (0.12~0.25 권장).
 */
const LERP_FACTOR = 0.18;

/** lerp 수렴 판정: 목표와의 차이가 이 값 이하이면 즉시 snap (px) */
const SNAP_THRESHOLD = 1;

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
  messagesEndRef,
}: UseChatAutoScrollOptions): UseChatAutoScrollReturn => {
  // ── 내부 상태 refs ──────────────────────────────────────────
  const isAutoScrollWindowRef = useRef(false);
  const userScrolledUpRef = useRef(false);
  const windowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalAnchorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessagesLengthRef = useRef(messagesLength);
  const prevContentRevisionRef = useRef(contentRevision);
  const lastScrollTopRef = useRef(0);

  // ── 부드러운 스크롤 애니메이션 상태 ────────────────────────────
  /** 현재 애니메이션 루프가 진행 중인지 */
  const isAnimatingRef = useRef(false);
  /** rAF ID (취소용) */
  const animationRafRef = useRef<number | null>(null);
  /** 목표 scrollTop 값 (Observer가 갱신, 루프가 추적) */
  const targetScrollTopRef = useRef(0);

  // ── 부드러운 스크롤 애니메이션 루프 ────────────────────────────
  const startSmoothScroll = useCallback(() => {
    if (isAnimatingRef.current) return; // 이미 실행 중이면 중복 방지
    isAnimatingRef.current = true;

    const loop = () => {
      const container = scrollContainerRef.current;
      if (!container || userScrolledUpRef.current || !isAutoScrollWindowRef.current) {
        // 조건 불충족 시 애니메이션 정지
        isAnimatingRef.current = false;
        animationRafRef.current = null;
        return;
      }

      // 목표는 항상 최신 scrollHeight (콘텐츠가 계속 커지므로)
      targetScrollTopRef.current = container.scrollHeight - container.clientHeight;
      const current = container.scrollTop;
      const target = targetScrollTopRef.current;
      const diff = target - current;

      if (Math.abs(diff) < SNAP_THRESHOLD) {
        // 수렴 완료: 정확히 바닥에 snap
        container.scrollTop = target;
        // 콘텐츠가 계속 변할 수 있으므로 윈도우가 열려있으면 루프 유지
        if (isAutoScrollWindowRef.current && !userScrolledUpRef.current) {
          animationRafRef.current = requestAnimationFrame(loop);
        } else {
          isAnimatingRef.current = false;
          animationRafRef.current = null;
        }
        return;
      }

      // Lerp: 매 프레임 diff의 LERP_FACTOR만큼 이동 → 부드러운 감속
      container.scrollTop = current + diff * LERP_FACTOR;

      animationRafRef.current = requestAnimationFrame(loop);
    };

    animationRafRef.current = requestAnimationFrame(loop);
  }, [scrollContainerRef]);

  /** 애니메이션 즉시 중단 */
  const stopSmoothScroll = useCallback(() => {
    isAnimatingRef.current = false;
    if (animationRafRef.current !== null) {
      cancelAnimationFrame(animationRafRef.current);
      animationRafRef.current = null;
    }
  }, []);

  // ── 메시지 수 / 콘텐츠 리비전 변화 감지 → 자동 스크롤 윈도우 열기 ──
  useEffect(() => {
    const prevMessages = prevMessagesLengthRef.current;
    const prevRevision = prevContentRevisionRef.current;
    prevMessagesLengthRef.current = messagesLength;
    prevContentRevisionRef.current = contentRevision;

    const messagesAdded = messagesLength > prevMessages;
    const revisionIncreased = contentRevision > prevRevision;
    if (!messagesAdded && !revisionIncreased) return;

    // 자동 스크롤 윈도우 열기
    userScrolledUpRef.current = false;
    isAutoScrollWindowRef.current = true;

    // 부드러운 스크롤 애니메이션 시작 (이미 실행 중이면 자동 무시)
    startSmoothScroll();

    // 기존 타이머 정리
    if (windowTimerRef.current) clearTimeout(windowTimerRef.current);
    if (finalAnchorTimerRef.current) clearTimeout(finalAnchorTimerRef.current);

    // 윈도우 유지 후 자연 해제 + 마무리 앵커링
    windowTimerRef.current = setTimeout(() => {
      isAutoScrollWindowRef.current = false;

      // 마무리: DOM 확정 후 최종 위치 보정 1회
      finalAnchorTimerRef.current = setTimeout(() => {
        if (!userScrolledUpRef.current) {
          const container = scrollContainerRef.current;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }
      }, FINAL_ANCHOR_DELAY_MS);
    }, AUTO_SCROLL_WINDOW_MS);

    return () => {
      if (windowTimerRef.current) clearTimeout(windowTimerRef.current);
      if (finalAnchorTimerRef.current) clearTimeout(finalAnchorTimerRef.current);
    };
  }, [messagesLength, contentRevision, startSmoothScroll, scrollContainerRef]);

  // ── MutationObserver + ResizeObserver: 높이 변화 시 애니메이션 (재)시작 ──
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const onHeightChange = () => {
      if (isAutoScrollWindowRef.current && !userScrolledUpRef.current) {
        // 목표만 갱신 — 루프가 없으면 시작, 있으면 자동으로 추적
        startSmoothScroll();
      }
    };

    const resizeObserver = new ResizeObserver(onHeightChange);
    resizeObserver.observe(container);
    if (container.firstElementChild) {
      resizeObserver.observe(container.firstElementChild);
    }

    const mutationObserver = new MutationObserver(onHeightChange);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      stopSmoothScroll();
    };
  }, [scrollContainerRef, startSmoothScroll, stopSmoothScroll]);

  // ── onScroll 핸들러 ──────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const scrolledUp = currentScrollTop < lastScrollTopRef.current - 2;
    lastScrollTopRef.current = currentScrollTop;

    if (isAutoScrollWindowRef.current && scrolledUp) {
      const remaining = container.scrollHeight - currentScrollTop - container.clientHeight;
      if (remaining > NEAR_BOTTOM_THRESHOLD) {
        userScrolledUpRef.current = true;
      }
    }

    if (userScrolledUpRef.current) {
      const remaining = container.scrollHeight - currentScrollTop - container.clientHeight;
      if (remaining < NEAR_BOTTOM_THRESHOLD) {
        userScrolledUpRef.current = false;
        // 하단 복귀 시 애니메이션 재시작
        if (isAutoScrollWindowRef.current) {
          startSmoothScroll();
        }
      }
    }
  }, [scrollContainerRef, startSmoothScroll]);

  // ── 사용자 의도 스크롤 감지 (wheel/pointer/touch) ──────────────
  const handleUserScrollIntent = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining > NEAR_BOTTOM_THRESHOLD) {
      userScrolledUpRef.current = true;
    }
  }, [scrollContainerRef]);

  return { handleScroll, handleUserScrollIntent };
};
