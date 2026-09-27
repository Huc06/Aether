import React, { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { CanvasNode, LensConfig } from '../../types';
import { PositionRiskBadge } from './PositionRiskBadge';

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
      className="fixed z-[46] inset-x-0 bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-3 sm:px-4 animate-in slide-in-from-bottom-4 duration-200"
      role="dialog"
      aria-label={`Command sheet ${node.title}`}
    >
      <div
        className={`mx-auto w-full max-w-3xl rounded-t-2xl border-2 shadow-2xl p-3 sm:p-4 flex flex-col gap-3 ${
          isLight
            ? 'bg-white border-rose-500 text-slate-900'
            : 'bg-slate-950/95 border-rose-500/70 text-slate-200 backdrop-blur-md'
        }`}
        style={{
          boxShadow: isLight
            ? '0 -12px 40px rgba(0,0,0,0.12)'
            : '0 -20px 60px rgba(0,0,0,0.75), 0 0 40px rgba(244,63,94,0.2)',
        }}
      >
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 w-8 h-8 rounded-lg border border-rose-500/50 bg-rose-950/40 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex flex-col min-w-0 gap-1">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h3 className={`font-black text-sm sm:text-base tracking-wide truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {node.title}
                </h3>
                <PositionRiskBadge risk={node.riskLevel} isLight={isLight} />
              </div>
              <span className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {node.app} • {node.chain} • canvas stays interactive above
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className={`shrink-0 h-8 px-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
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
            className={`flex-1 h-11 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 hover:border-slate-500'
                : 'bg-slate-900 border-white/15 text-slate-100 hover:border-white/30'
            }`}
          >
            Inspect
          </button>
          {hasRoutes && (
            <button
              type="button"
              onClick={onUnwind}
              className="flex-[1.4] h-11 rounded-lg border-2 text-xs font-mono font-bold uppercase tracking-wider bg-rose-600 text-white border-rose-400 hover:bg-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.35)]"
            >
              Hold to Exit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
