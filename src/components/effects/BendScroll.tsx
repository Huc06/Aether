import React, { useEffect, useRef, useState } from 'react';
import { createBend, type BendInstance, type BendOptions } from '../../engine/bendEngine';

export interface BendScrollProps extends BendOptions {
  children: React.ReactNode;
  className?: string;
}

const PAGE_KEYS: Record<string, number | false> = {
  ArrowDown: 64,
  ArrowUp: -64,
  PageDown: false,
  PageUp: false,
  ' ': false,
};

export const BendScroll: React.FC<BendScrollProps> = ({
  children,
  className = '',
  ...options
}) => {
  const sourceRef = useRef<HTMLCanvasElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<BendInstance | null>(null);
  const [initialOptions] = useState(options);

  useEffect(() => {
    const source = sourceRef.current;
    const content = contentRef.current;
    const output = outputRef.current;
    if (!source || !content || !output) return;
    instanceRef.current = createBend({ source, content, output }, initialOptions);
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [initialOptions]);

  useEffect(() => {
    instanceRef.current?.setOptions(options);
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const content = contentRef.current;
      if (!content || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active !== document.body &&
        (active.isContentEditable ||
          active.matches("input, textarea, select, button, [role='listbox']") ||
          (content.contains(active) && active.scrollHeight > active.clientHeight))
      ) {
        return;
      }

      if (event.key === 'Home' || event.key === 'End') {
        content.scrollTo({
          top: event.key === 'Home' ? 0 : content.scrollHeight,
          behavior: 'smooth',
        });
        event.preventDefault();
        return;
      }

      const step = PAGE_KEYS[event.key];
      if (step === undefined) return;
      const viewport = content.clientHeight * 0.9;
      content.scrollBy({
        top: step === false ? (event.key === 'PageUp' ? -viewport : viewport) : step,
        behavior: 'smooth',
      });
      event.preventDefault();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={`bend-page ${className}`}>
      <canvas ref={sourceRef} aria-hidden className="hidden" />
      <div ref={contentRef} className="bend-scroll scroll-quiet">
        {children}
      </div>
      <canvas
        ref={outputRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />
    </div>
  );
};

export type { BendInstance, BendOptions };
