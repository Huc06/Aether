import React, { useState, useEffect, useMemo, useRef } from 'react';

export const DEFAULT_ROW_WINDOW = 30;

/**
 * Virtualized chunk windowing hook for high-performance table row rendering
 */
export function useRowWindow<T>(rows: readonly T[], windowSize: number = DEFAULT_ROW_WINDOW) {
  const [count, setCount] = useState(windowSize);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loaded = rows.length;
  const shown = Math.min(count, loaded);
  const hasMore = shown < loaded;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setCount((prior) => prior + windowSize);
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, windowSize]);

  const visible = useMemo(() => rows.slice(0, shown), [rows, shown]);

  return { visible, hasMore, shown, loaded, sentinelRef };
}

export interface RowWindowFooterProps {
  shown: number;
  loaded: number;
  hasMore: boolean;
  sentinelRef: React.Ref<HTMLDivElement>;
  noun?: string;
  isLight?: boolean;
}

export const RowWindowFooter: React.FC<RowWindowFooterProps> = ({
  shown,
  loaded,
  hasMore,
  sentinelRef,
  noun = 'item',
  isLight = false,
}) => {
  if (loaded <= DEFAULT_ROW_WINDOW) return <div ref={sentinelRef} className="h-2" />;

  return (
    <div
      ref={sentinelRef}
      className={`w-full pt-3 pb-1 flex items-center justify-between gap-2 text-[10px] font-mono select-none ${
        isLight ? 'text-slate-500' : 'text-slate-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="tabular-nums font-bold">
          {shown} of {loaded} {noun}{loaded === 1 ? '' : 's'} shown
        </span>
        {hasMore && (
          <span className={isLight ? 'text-amber-700' : 'text-amber-400'}>
            &bull; scroll down for more
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="uppercase tracking-widest text-[9px]">live telemetry</span>
      </div>
    </div>
  );
};
