import React, { useEffect } from 'react';
import { ShieldAlert, GripHorizontal } from 'lucide-react';
import { CanvasNode, LensConfig } from '../../types';
import { PositionRiskBadge } from './PositionRiskBadge';
import { useDraggablePanel } from './useDraggablePanel';

interface PositionCommandSheetProps {
  node: CanvasNode;
  config?: LensConfig;
  onInspect: () => void;
  onUnwind: () => void;
  onClose: () => void;
}

export const PositionCommandSheet: React.FC<PositionCommandSheetProps> = ({
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
    maxYPad: 140,
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
      className="fixed z-[46] bottom-0 sm:bottom-6 inset-x-0 sm:inset-x-auto sm:right-4 lg:right-6 w-full sm:w-[min(540px,calc(100vw-2rem))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0 px-3 sm:px-0 pointer-events-none"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      role="dialog"
      aria-label={`Command sheet ${node.title}`}
    >
      <div
        className={`pointer-events-auto w-full rounded-2xl border-2 shadow-2xl p-3.5 sm:p-4 flex flex-col gap-3 ${
          isLight
            ? 'bg-white/98 border-rose-500 text-slate-900 shadow-xl'
            : 'bg-slate-950/96 border-rose-500/80 text-slate-200 backdrop-blur-2xl'
        } ${isDragging ? 'select-none opacity-95' : 'animate-in slide-in-from-bottom-4 sm:slide-in-from-right-4 duration-150'}`}
        style={{
          boxShadow: isLight
            ? '0 -12px 40px rgba(0,0,0,0.12)'
            : '0 -20px 60px rgba(0,0,0,0.85), 0 0 50px rgba(244,63,94,0.25)',
        }}
      >
        {/* Top Drag Bar */}
        <div
          {...dragHandleProps}
          className={`flex items-center justify-between px-2 py-1 rounded-lg border text-[10px] font-mono select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            isLight
              ? 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border-slate-200'
              : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
          title="Drag to reposition card across screen"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <GripHorizontal className="w-3.5 h-3.5 opacity-70 shrink-0" />
            <span className="font-extrabold uppercase tracking-wider text-[9px] text-rose-400 truncate">
              Tactical Risk Sheet // Drag
            </span>
          </div>
          <span className="text-[9px] font-bold text-slate-400 shrink-0">
            Esc close
          </span>
        </div>

        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="mt-0.5 w-8 h-8 rounded-lg border border-rose-500/50 bg-rose-950/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex flex-col min-w-0 gap-1 flex-1">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h3 className={`font-black text-sm sm:text-base tracking-wide truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {node.title}
                </h3>
                <PositionRiskBadge risk={node.riskLevel} isLight={isLight} />
              </div>
              <span className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {node.app} • {node.chain} • canvas stays active
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className={`shrink-0 h-8 px-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Esc
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 font-mono">
          <div className={`rounded-lg border p-2.5 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'}`}>
            <div className={`text-[9px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Value</div>
            <div className={`text-sm font-black tabular-nums ${isLight ? 'text-slate-950' : 'text-white'}`}>
              ${node.valueUsd.toLocaleString()}
            </div>
          </div>
          <div className={`rounded-lg border p-2.5 ${isLight ? 'border-rose-200 bg-rose-50' : 'border-rose-500/30 bg-rose-950/30'}`}>
            <div className={`text-[9px] uppercase ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>Health</div>
            <div className="text-sm font-black tabular-nums text-rose-400">
              HF {node.healthFactor?.toFixed(2) ?? '—'}
            </div>
          </div>
          <div className={`rounded-lg border p-2.5 ${isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-white/5'}`}>
            <div className={`text-[9px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>24h PnL</div>
            <div className={`text-sm font-black tabular-nums ${
              pnl === undefined ? (isLight ? 'text-slate-500' : 'text-slate-400')
                : pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {pnl === undefined ? '—' : `${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString()}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onInspect}
            className={`flex-1 h-11 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 hover:border-slate-500 hover:bg-slate-50'
                : 'bg-slate-900 border-white/15 text-slate-100 hover:border-white/30 hover:bg-slate-800'
            }`}
          >
            Inspect Details
          </button>
          {hasRoutes && (
            <button
              type="button"
              onClick={onUnwind}
              className="flex-[1.4] h-11 rounded-lg border-2 text-xs font-mono font-bold uppercase tracking-wider bg-rose-600 text-white border-rose-400 hover:bg-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.35)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Emergency Exit Deck
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
