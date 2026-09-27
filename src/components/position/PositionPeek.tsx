import React, { useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';
import { CanvasNode, LensConfig } from '../../types';
import { PositionRiskBadge } from './PositionRiskBadge';
import { useDraggablePanel } from './useDraggablePanel';

interface PositionPeekProps {
  node: CanvasNode;
  config?: LensConfig;
  onInspect: () => void;
  onUnwind: () => void;
  onClose: () => void;
}

export const PositionPeek: React.FC<PositionPeekProps> = ({
  node,
  config,
  onInspect,
  onUnwind,
  onClose,
}) => {
  const isLight = config?.themeMode === 'light';
  const hasRoutes = Boolean(node.exitRoutes && node.exitRoutes.length > 0);
  const pnl = node.pnl24hUsd;
  const { offset, isDragging, dragHandleProps } = useDraggablePanel({
    maxXPad: 360,
    maxYPad: 120,
    isOpen: true,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="fixed z-[45] top-16 sm:top-20 right-3 sm:right-6 w-[min(380px,calc(100vw-1.5rem))] pointer-events-none"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      role="dialog"
      aria-label={`Peek ${node.title}`}
    >
      <div
        className={`pointer-events-auto rounded-xl border shadow-2xl p-3 flex flex-col gap-2.5 ${
          isLight
            ? 'bg-white/95 border-slate-300 text-slate-900'
            : 'bg-slate-950/95 border-white/15 text-slate-200 backdrop-blur-xl'
        } ${isDragging ? 'select-none opacity-95' : 'animate-in fade-in slide-in-from-right-4 duration-150'}`}
      >
        {/* Top Drag Grip Bar */}
        <div
          {...dragHandleProps}
          className={`flex items-center justify-between px-2 py-0.5 rounded border text-[9px] font-mono select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            isLight
              ? 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200'
              : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
          title="Drag card to move"
        >
          <div className="flex items-center gap-1">
            <GripHorizontal className="w-3 h-3 opacity-60" />
            <span className="font-extrabold uppercase tracking-wider text-[8px] text-amber-500">
              Position Peek // Drag
            </span>
          </div>
          <span className="text-[8px] font-bold text-slate-400">Esc close</span>
        </div>

        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex flex-col min-w-0 gap-1 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className={`font-black text-sm tracking-wide truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                {node.title}
              </h3>
              <PositionRiskBadge risk={node.riskLevel} isLight={isLight} />
            </div>
            <span className={`text-[10px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {node.app} • {node.chain}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 h-7 px-2 rounded-md border text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            Esc
          </button>
        </div>

        <div className="flex items-baseline justify-between gap-2 font-mono">
          <span className={`text-xl font-black tabular-nums ${isLight ? 'text-slate-950' : 'text-white'}`}>
            ${node.valueUsd.toLocaleString()}
          </span>
          <div className="flex flex-col items-end gap-0.5">
            {node.healthFactor !== undefined && (
              <span className={`text-[10px] font-bold ${
                node.healthFactor < 1.15
                  ? 'text-rose-400'
                  : node.healthFactor < 1.5
                    ? 'text-amber-400'
                    : 'text-emerald-400'
              }`}>
                HF {node.healthFactor.toFixed(2)}
              </span>
            )}
            {pnl !== undefined && (
              <span className={`text-[11px] font-bold tabular-nums ${
                pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onInspect}
            className={`flex-1 h-9 rounded-lg border text-[11px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
            }`}
          >
            Inspect
          </button>
          {hasRoutes && (
            <button
              type="button"
              onClick={onUnwind}
              className="flex-1 h-9 rounded-lg border text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-950/60 text-rose-200 border-rose-500/60 hover:bg-rose-900/70 transition-colors cursor-pointer"
            >
              Exit Deck
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
