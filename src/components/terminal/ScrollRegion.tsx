import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to detect horizontal and vertical scroll overflow
 */
export function useScrollOverflow() {
  const [overflowEnd, setOverflowEnd] = useState(false);
  const [overflowBottom, setOverflowBottom] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  const check = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    const canScrollX = el.scrollWidth > el.clientWidth + 2;
    const isAtEndX = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setOverflowEnd(canScrollX && !isAtEndX);

    const canScrollY = el.scrollHeight > el.clientHeight + 2;
    const isAtBottomY = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    setOverflowBottom(canScrollY && !isAtBottomY);
  }, []);

  const scrollRef = useCallback((node: HTMLElement | null) => {
    targetRef.current = node;
    if (!node) return;
    check();
  }, [check]);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;

    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);

    const observer = new ResizeObserver(check);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      observer.disconnect();
    };
  }, [check]);

  return { scrollRef, overflowEnd, overflowBottom };
}

export interface ScrollRegionProps {
  children: React.ReactNode;
  className?: string;
  scrollSelector?: string;
  isLight?: boolean;
}

/**
 * Conceals scrollbars cleanly and renders edge fade masks when content overflows
 */
export const ScrollRegion: React.FC<ScrollRegionProps> = ({
  children,
  className = '',
  scrollSelector,
  isLight = false,
}) => {
  const { scrollRef, overflowEnd, overflowBottom } = useScrollOverflow();

  const shellRef = useCallback((node: HTMLElement | null) => {
    if (!node) {
      scrollRef(null);
      return;
    }
    scrollRef(
      (scrollSelector && node.querySelector<HTMLElement>(scrollSelector)) || node
    );
  }, [scrollRef, scrollSelector]);

  const fadeColor = isLight ? 'rgba(248, 250, 252, 0.95)' : 'rgba(7, 9, 14, 0.95)';

  const attachRef = useCallback((node: HTMLElement | null) => {
    if (scrollSelector) {
      shellRef(node);
      return;
    }
    scrollRef(node);
  }, [scrollSelector, shellRef, scrollRef]);

  return (
    <div
      ref={scrollSelector ? shellRef : undefined}
      className={`relative w-full overflow-hidden ${className}`}
    >
      <div
        ref={scrollSelector ? undefined : attachRef}
        className="w-full overflow-x-auto overflow-y-auto scroll-quiet"
      >
        {children}
      </div>

      {/* Horizontal Right Edge Overflow Fade */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-12 transition-opacity duration-200 z-10 ${
          overflowEnd ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `linear-gradient(to left, ${fadeColor}, transparent)`
        }}
      />

      {/* Vertical Bottom Edge Overflow Fade */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 transition-opacity duration-200 z-10 ${
          overflowBottom ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: `linear-gradient(to top, ${fadeColor}, transparent)`
        }}
      />
    </div>
  );
};
