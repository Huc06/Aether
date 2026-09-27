import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { CanvasNode, LensConfig, PositionExitRoute } from '../../types';
import { PositionRiskBadge } from './PositionRiskBadge';
import { PositionMetricsSummary } from './PositionMetricsSummary';
import { PositionStrategyStrip } from './PositionStrategyStrip';
import { SolvencyGauge } from './SolvencyGauge';
import { instrumentPanelClass } from './detailPhase';

interface PositionInspectorProps {
  node: CanvasNode;
  config?: LensConfig;
  onClose: () => void;
  onRequestUnwind: (routeIndex: number) => void;
}

export const PositionInspector: React.FC<PositionInspectorProps> = ({
  node,
  config,
  onClose,
  onRequestUnwind,
}) => {
  const isLight = config?.themeMode === 'light';
  const isCritical = node.riskLevel === 'critical';
  const isHigh = node.riskLevel === 'high';
  const routes = node.exitRoutes || [];
  const [selectedExitIndex, setSelectedExitIndex] = useState(0);

  useEffect(() => {
    setSelectedExitIndex(0);
  }, [node.id]);

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
      className={`fixed z-[47] top-[72px] sm:top-[78px] bottom-0 right-0 w-full sm:w-[min(420px,100vw)] flex flex-col border-l rounded-tl-xl shadow-2xl animate-in slide-in-from-right-4 duration-200 ${
        isLight
          ? 'bg-white/98 border-slate-300 text-slate-900'
          : 'bg-[#0a0d14]/96 border-white/10 text-slate-200 backdrop-blur-xl'
      }`}
      role="dialog"
      aria-label={`Inspector ${node.title}`}
    >
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
        isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-black/20'
      }`}>
        <div className="flex flex-col min-w-0 gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className={`font-black text-sm tracking-wide truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
              {node.title}
            </h2>
            <PositionRiskBadge risk={node.riskLevel} isLight={isLight} />
          </div>
          <span className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {node.app} • {node.chain} • {node.category}
          </span>
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

      <div className="modal-scroll overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-2.5 flex-1 min-h-0">
        <PositionMetricsSummary node={node} isLight={isLight} />

        {node.type === 'position' && (
          <SolvencyGauge
            healthFactor={node.healthFactor}
            liquidationDistancePct={node.liquidationDistancePct}
            liquidationPrice={node.liquidationPrice}
            debtRatioPct={node.debtRatioPct}
            riskLevel={node.riskLevel}
            isLight={isLight}
          />
        )}

        <PositionStrategyStrip node={node} isLight={isLight} />

        {routes.length > 0 && (
          <div className={`overflow-hidden ${instrumentPanelClass(node.riskLevel, isLight)}`}>
            <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 ${
              isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/5'
            }`}>
              <span className={`text-[11px] font-mono font-bold tracking-wider uppercase truncate ${
                isLight ? 'text-slate-900' : 'text-slate-200'
              }`}>
                {isCritical || isHigh ? 'Exit Routes' : 'Pre-computed Exits'}
              </span>
              <span className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Select then confirm
              </span>
            </div>

            <div className="p-2.5 flex flex-col gap-2">
              {routes.map((route: PositionExitRoute, idx: number) => {
                const selected = selectedExitIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedExitIndex(idx)}
                    className={`p-2.5 rounded-md border text-left font-mono transition-[border-color,background-color] duration-150 ${
                      selected
                        ? isCritical
                          ? 'border-rose-500/80 bg-rose-950/20 border-l-2 border-l-rose-500'
                          : isLight
                            ? 'border-slate-900 bg-slate-50 border-l-2 border-l-slate-900'
                            : 'border-cyan-500/50 bg-cyan-950/10 border-l-2 border-l-cyan-400'
                        : isLight
                          ? 'border-slate-200 bg-transparent hover:border-slate-400'
                          : 'border-white/10 bg-transparent hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[11px] font-bold truncate ${
                        selected && isCritical ? 'text-rose-400' : isLight ? 'text-slate-900' : 'text-slate-200'
                      }`}>
                        Exit to {route.targetAsset}
                      </span>
                      <span className={`text-[9px] shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                        {route.timeSeconds}s
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className={`text-xs font-bold tabular-nums ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {route.estReturn}
                      </span>
                      <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Fee: {route.fee}
                      </span>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => onRequestUnwind(selectedExitIndex)}
                className={`mt-1 w-full h-11 rounded-md border-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${
                  isCritical
                    ? 'bg-rose-950/50 border-rose-500 text-rose-100 hover:bg-rose-900/60'
                    : isLight
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-emerald-950/40 border-emerald-500/70 text-emerald-100 hover:bg-emerald-900/50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Confirm Exit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
