import { useState, useRef, useEffect, useCallback } from 'react';

export interface UseDraggablePanelOptions {
  initialX?: number;
  initialY?: number;
  maxXPad?: number;
  maxYPad?: number;
  isOpen?: boolean;
}

export function useDraggablePanel(options: UseDraggablePanelOptions = {}) {
  const { initialX = 0, initialY = 0, maxXPad = 320, maxYPad = 120, isOpen = true } = options;
  const [offset, setOffset] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      dragRef.current = null;
      setIsDragging(false);
    }
  }, [isOpen]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
      dragRef.current = {
        ox: offset.x,
        oy: offset.y,
        sx: e.clientX,
        sy: e.clientY,
      };
      setIsDragging(true);
    },
    [offset]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const nextX = drag.ox + (e.clientX - drag.sx);
      const nextY = drag.oy + (e.clientY - drag.sy);
      const maxX = Math.max(0, window.innerWidth - maxXPad);
      const maxY = Math.max(0, window.innerHeight - maxYPad);
      setOffset({
        x: Math.min(maxX, Math.max(-window.innerWidth / 2, nextX)),
        y: Math.min(maxY, Math.max(-window.innerHeight / 2, nextY)),
      });
    },
    [maxXPad, maxYPad]
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  const resetOffset = useCallback(() => {
    setOffset({ x: initialX, y: initialY });
  }, [initialX, initialY]);

  return {
    offset,
    isDragging,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    resetOffset,
  };
}
