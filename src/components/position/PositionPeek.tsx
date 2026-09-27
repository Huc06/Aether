import React, { useEffect } from 'react';
import { CanvasNode, LensConfig } from '../../types';
import { PositionRiskBadge } from './PositionRiskBadge';

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
      className="fixed z-[45] top-24 left-1/2 -translate-x-1/2 w-[min(360px,calc(100vw-1.5rem))] animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label={`Peek ${node.title}`}
    >
      <div
        className={`rounded-xl border shadow-2xl p-3 flex flex-col gap-2.5 ${
          isLight
            ? 'bg-white/95 border-slate-300 text-slate-900'
            : 'bg-slate-950/95 border-white/15 text-slate-200 backdrop-blur-md'
        }`}
      >
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="flex flex-col min-w-0 gap-1">
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
            className={`shrink-0 h-7 px-2 rounded-md border text-[10px] font-mono font-bold uppercase ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
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
            className={`flex-1 h-9 rounded-lg border text-[11px] font-mono font-bold uppercase tracking-wider ${
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
              className="flex-1 h-9 rounded-lg border text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-950/60 text-rose-200 border-rose-500/60 hover:bg-rose-900/70"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
