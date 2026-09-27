import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Port of the beui motion tabs (pill / segment / underline with a spring
 * indicator). The upstream component depends on `motion/react` for the
 * `layoutId` projection; Aether ships no animation runtime, so the indicator is
 * measured from the DOM and integrated with the same spring constants
 * (stiffness 245, damping 36, mass 1.2) on a rAF loop.
 */

export type TabsVariant = 'pill' | 'segment' | 'underline';

interface TabsCtx {
  value: string;
  setValue: (v: string) => void;
  variant: TabsVariant;
}

const Ctx = createContext<TabsCtx | null>(null);

function useTabs(): TabsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Tabs.* must be used inside <Tabs>');
  return ctx;
}

const SPRING = { stiffness: 245, damping: 36, mass: 1.2 };

export const Tabs: React.FC<{
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  variant?: TabsVariant;
  className?: string;
  children: React.ReactNode;
}> = ({ defaultValue, value, onValueChange, variant = 'pill', className, children }) => {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const setValue = useCallback(
    (v: string) => {
      if (!controlled) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange]
  );

  const ctx = useMemo<TabsCtx>(
    () => ({ value: current, setValue, variant }),
    [current, setValue, variant]
  );

  return (
    <Ctx.Provider value={ctx}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
};

const listClasses: Record<TabsVariant, string> = {
  pill: 'inline-flex items-center gap-1 rounded-full p-1 w-max',
  segment: 'inline-flex items-center gap-0 rounded-lg p-0.5 w-max',
  underline: 'inline-flex items-center gap-1 border-b border-white/10 w-max'
};

export const TabsList: React.FC<{
  className?: string;
  wrapperClassName?: string;
  indicatorClassName?: string;
  children: React.ReactNode;
}> = ({ className, wrapperClassName, indicatorClassName, children }) => {
  const { variant, value } = useTabs();
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);
  const stateRef = useRef({ x: 0, w: 0, vx: 0, vw: 0, primed: false });
  const viewportId = useId();
  const [edges, setEdges] = useState({ overflow: false, left: false, right: false });

  const measureEdges = useCallback(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    if (!root || !viewport) return;
    const overflow = viewport.scrollWidth > root.clientWidth + 1;
    const max = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const fromLeft = Math.max(0, Math.min(max, viewport.scrollLeft));
    const next = { overflow, left: fromLeft > 1, right: fromLeft < max - 1 };
    setEdges(prev =>
      prev.overflow === next.overflow && prev.left === next.left && prev.right === next.right ? prev : next
    );
  }, []);

  // Spring the indicator onto the selected trigger.
  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const target = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      if (!target) {
        indicator.style.opacity = '0';
        frameRef.current = requestAnimationFrame(step);
        return;
      }
      indicator.style.opacity = '1';

      const listBox = list.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      const tx = box.left - listBox.left;
      const tw = box.width;
      const s = stateRef.current;

      if (!s.primed) {
        s.x = tx;
        s.w = tw;
        s.primed = true;
      } else {
        // Semi-implicit Euler with the upstream spring constants.
        const ax = (SPRING.stiffness * (tx - s.x) - SPRING.damping * s.vx) / SPRING.mass;
        const aw = (SPRING.stiffness * (tw - s.w) - SPRING.damping * s.vw) / SPRING.mass;
        s.vx += ax * dt;
        s.vw += aw * dt;
        s.x += s.vx * dt;
        s.w += s.vw * dt;
        if (Math.abs(tx - s.x) < 0.1 && Math.abs(s.vx) < 0.5) {
          s.x = tx;
          s.vx = 0;
        }
        if (Math.abs(tw - s.w) < 0.1 && Math.abs(s.vw) < 0.5) {
          s.w = tw;
          s.vw = 0;
        }
      }

      // The class-based -translate-y-1/2 would be clobbered by this transform.
      indicator.style.transform = `translateX(${s.x}px)${variant === 'underline' ? '' : ' translateY(-50%)'}`;
      indicator.style.width = `${s.w}px`;
      indicator.style.height = variant === 'underline' ? '2px' : `${box.height}px`;

      // Reveal the active-colour copy of each label only where the pill covers it.
      const pillLeft = listBox.left + s.x;
      const pillRight = pillLeft + s.w;
      const labels = list.querySelectorAll<HTMLElement>('[data-tabs-label]');
      const clips: string[] = [];
      labels.forEach(label => {
        const b = label.getBoundingClientRect();
        const l = Math.max(0, Math.min(b.width, pillLeft - b.left));
        const r = Math.max(0, Math.min(b.width, b.right - pillRight));
        clips.push(l + r >= b.width ? 'inset(0 100% 0 0)' : `inset(0 ${r}px 0 ${l}px)`);
      });
      labels.forEach((label, i) => {
        if (label.style.clipPath !== clips[i]) label.style.clipPath = clips[i];
      });

      frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [variant]);

  // Overflow arrows / fades and keeping the selected tab in view.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const list = listRef.current;
    if (!root || !viewport || !list) return;
    const observer = new ResizeObserver(measureEdges);
    observer.observe(root);
    observer.observe(viewport);
    observer.observe(list);
    viewport.addEventListener('scroll', measureEdges, { passive: true });
    measureEdges();
    return () => {
      observer.disconnect();
      viewport.removeEventListener('scroll', measureEdges);
    };
  }, [measureEdges]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const target = listRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!viewport || !target) return;
    const frame = viewport.getBoundingClientRect();
    const item = target.getBoundingClientRect();
    const delta = item.left < frame.left + 36 ? item.left - frame.left - 36 : item.right > frame.right - 36 ? item.right - frame.right + 36 : 0;
    if (delta) viewport.scrollBy({ left: delta, behavior: 'smooth' });
  }, [value]);

  const scroll = (direction: number) => {
    viewportRef.current?.scrollBy({ left: direction * viewportRef.current.clientWidth * 0.8, behavior: 'smooth' });
  };

  const controlClass =
    'absolute inset-y-0 z-20 inline-flex w-8 items-center justify-center text-slate-300 transition-opacity hover:opacity-70 disabled:pointer-events-none disabled:opacity-0 cursor-pointer';

  return (
    <div
      ref={rootRef}
      className={`relative isolate flex w-full max-w-full min-w-0 items-center ${wrapperClassName ?? ''}`}
    >
      {edges.overflow && (
        <button
          type="button"
          aria-label="Scroll tabs left"
          aria-controls={viewportId}
          disabled={!edges.left}
          onClick={() => scroll(-1)}
          className={`${controlClass} left-0`}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      <div
        ref={viewportRef}
        id={viewportId}
        className="w-full min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={
          edges.overflow
            ? {
                maskImage: `linear-gradient(to right, ${edges.left ? 'transparent, black 32px' : 'black, black 0px'}, ${
                  edges.right ? 'black calc(100% - 32px), transparent' : 'black 100%'
                })`
              }
            : undefined
        }
      >
        <div ref={listRef} role="tablist" className={`relative ${listClasses[variant]} ${className ?? ''}`}>
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className={`pointer-events-none absolute left-0 ${
              variant === 'underline' ? 'bottom-0 rounded-none' : 'top-1/2 -translate-y-1/2'
            } ${variant === 'pill' ? 'rounded-full' : variant === 'segment' ? 'rounded-md' : ''} ${
              indicatorClassName ?? 'bg-amber-500'
            }`}
            style={{ opacity: 0 }}
          />
          {children}
        </div>
      </div>

      {edges.overflow && (
        <button
          type="button"
          aria-label="Scroll tabs right"
          aria-controls={viewportId}
          disabled={!edges.right}
          onClick={() => scroll(1)}
          className={`${controlClass} right-0`}
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export const TabsTrigger: React.FC<{
  value: string;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}> = ({ value, className, activeClassName, children }) => {
  const { value: current, setValue, variant } = useTabs();
  const active = current === value;

  const radius = variant === 'pill' ? 'rounded-full' : variant === 'segment' ? 'rounded-md' : '';

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-tabs-value={value}
      onClick={() => setValue(value)}
      className={`relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap bg-transparent outline-none shrink-0 cursor-pointer transition-colors ${radius} ${
        variant === 'underline' ? 'px-3 pb-2 pt-1' : 'px-3 py-1.5'
      } ${className ?? 'text-[11px] font-bold text-slate-400 hover:text-white'}`}
    >
      {children}
      {variant !== 'underline' && (
        <span
          data-tabs-label=""
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 inline-flex items-center justify-center gap-1.5 [padding:inherit] ${
            activeClassName ?? 'text-black font-extrabold'
          }`}
          style={{ clipPath: active ? 'inset(0)' : 'inset(0 100% 0 0)' }}
        >
          {children}
        </span>
      )}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; className?: string; children: React.ReactNode }> = ({
  value,
  className,
  children
}) => {
  const { value: current } = useTabs();
  if (current !== value) {
    return (
      <div hidden className={className}>
        {children}
      </div>
    );
  }
  return <div className={`animate-in fade-in slide-in-from-bottom-1 duration-200 ${className ?? ''}`}>{children}</div>;
};
