import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CanvasNode, LensConfig, PositionExitRoute } from '../../types';
import { PositionRiskBadge } from './PositionRiskBadge';
import { PositionMetricsSummary } from './PositionMetricsSummary';
import { PositionStrategyStrip } from './PositionStrategyStrip';
import { SolvencyGauge } from './SolvencyGauge';
import { EmergencyExitDeck } from './EmergencyExitDeck';

interface PositionInspectorProps {
  node: CanvasNode;
  config?: LensConfig;
  onClose: () => void;
  onRequestUnwind: (routeIndex: number) => void;
  onDirectKillSwitch?: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const PositionInspector: React.FC<PositionInspectorProps> = ({
  node,
  config,
  onClose,
  onRequestUnwind,
  onDirectKillSwitch,
}) => {
  const isLight = config?.themeMode === 'light';
  const routes = node.exitRoutes || [];
  const [selectedExitIndex, setSelectedExitIndex] = useState(0);
  const [isExecutingKill, setIsExecutingKill] = useState(false);
  const [killStep, setKillStep] = useState(0);

  useEffect(() => {
    setSelectedExitIndex(0);
    setIsExecutingKill(false);
    setKillStep(0);
  }, [node.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecutingKill) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, isExecutingKill]);

  const handleTriggerDirectExit = (route: PositionExitRoute) => {
    if (isExecutingKill) return;

    if (onDirectKillSwitch) {
      setIsExecutingKill(true);
      setKillStep(1);
      setTimeout(() => setKillStep(2), 800);
      setTimeout(() => setKillStep(3), 1600);
      setTimeout(() => {
        setIsExecutingKill(false);
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        onDirectKillSwitch(node, route);
      }, 2400);
    } else {
      onRequestUnwind(selectedExitIndex);
    }
  };

  return (
    <div
      className={`fixed z-[47] top-[64px] sm:top-[72px] bottom-0 right-0 w-full sm:w-[min(480px,100vw)] lg:w-[460px] flex flex-col border-l rounded-tl-2xl shadow-2xl animate-in slide-in-from-right-4 duration-200 ${
        isLight
          ? 'bg-white/98 border-slate-300 text-slate-900'
          : 'bg-[#0a0d14]/96 border-white/10 text-slate-200 backdrop-blur-2xl'
      }`}
      role="dialog"
      aria-label={`Inspector ${node.title}`}
    >
      {/* Fixed Sticky Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 shrink-0 select-none ${
        isLight ? 'border-slate-200 bg-slate-50/90' : 'border-white/10 bg-black/40'
      }`}>
        <div className="flex flex-col min-w-0 gap-1 flex-1">
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
          disabled={isExecutingKill}
          title="Close (Esc)"
          className={`shrink-0 h-8 px-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer disabled:opacity-40 ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-950'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          Esc
        </button>
      </div>

      {/* Fully Scrollable Inspector Body with overscroll containment and generous bottom clearance */}
      <div 
        className="modal-scroll overflow-y-auto overflow-x-hidden p-3 sm:p-4 flex flex-col gap-3 flex-1 min-h-0 overscroll-contain pb-32"
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
      >
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
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-400 px-1">
              Live Execution Deck
            </div>
            <EmergencyExitDeck
              routes={routes}
              selectedRouteIndex={selectedExitIndex}
              onSelectRoute={setSelectedExitIndex}
              onTriggerUnwind={handleTriggerDirectExit}
              riskLevel={node.riskLevel}
              isLight={isLight}
              isExecuting={isExecutingKill}
              killStep={killStep}
            />
          </div>
        )}
      </div>
    </div>
  );
};
