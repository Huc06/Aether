import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CanvasNode, LensConfig, PositionExitRoute } from '../../types';
import { EmergencyExitDeck } from './EmergencyExitDeck';
import { PositionRiskBadge } from './PositionRiskBadge';

interface UnwindConfirmModalProps {
  node: CanvasNode;
  config?: LensConfig;
  initialRouteIndex?: number;
  onClose: () => void;
  onKillSwitch: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const UnwindConfirmModal: React.FC<UnwindConfirmModalProps> = ({
  node,
  config,
  initialRouteIndex = 0,
  onClose,
  onKillSwitch,
}) => {
  const isLight = config?.themeMode === 'light';
  const isCritical = node.riskLevel === 'critical' || node.riskLevel === 'high';
  const routes = node.exitRoutes || [];
  const [selectedExitIndex, setSelectedExitIndex] = useState(
    Math.min(initialRouteIndex, Math.max(routes.length - 1, 0))
  );
  const [isExecutingKill, setIsExecutingKill] = useState(false);
  const [killStep, setKillStep] = useState(0);

  useEffect(() => {
    setSelectedExitIndex(Math.min(initialRouteIndex, Math.max(routes.length - 1, 0)));
  }, [node.id, initialRouteIndex, routes.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      e.preventDefault();
      if (!isExecutingKill) onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose, isExecutingKill]);

  if (routes.length === 0) return null;

  const handleTriggerKillSwitch = (targetRoute?: PositionExitRoute) => {
    const route = targetRoute || routes[selectedExitIndex];
    if (!route) return;

    setIsExecutingKill(true);
    setKillStep(1);
    setTimeout(() => setKillStep(2), 800);
    setTimeout(() => setKillStep(3), 1600);
    setTimeout(() => {
      setIsExecutingKill(false);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      onKillSwitch(node, route);
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white text-slate-900 border-slate-300'
            : 'bg-slate-950 text-slate-200 border-rose-500/40'
        }`}
        style={{
          boxShadow: isCritical
            ? '0 0 50px rgba(239, 68, 68, 0.35), 0 25px 60px rgba(0, 0, 0, 0.85)'
            : undefined,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm emergency exit"
      >
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/30'
        }`}>
          <div className="flex flex-col min-w-0 gap-1">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className={`font-black text-sm truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Confirm Exit
              </h2>
              <PositionRiskBadge risk={node.riskLevel} isLight={isLight} />
            </div>
            <span className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {node.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExecutingKill}
            className={`shrink-0 h-8 px-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase disabled:opacity-40 ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            Esc
          </button>
        </div>

        <div className="modal-scroll overflow-y-auto p-3">
          <EmergencyExitDeck
            routes={routes}
            selectedRouteIndex={selectedExitIndex}
            onSelectRoute={setSelectedExitIndex}
            onTriggerUnwind={handleTriggerKillSwitch}
            riskLevel={node.riskLevel}
            isLight={isLight}
            isExecuting={isExecutingKill}
            killStep={killStep}
          />
        </div>
      </div>
    </div>
  );
};
