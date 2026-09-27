import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { GripHorizontal } from 'lucide-react';
import { CanvasNode, LensConfig, PositionExitRoute } from '../../types';
import { EmergencyExitDeck } from './EmergencyExitDeck';
import { PositionRiskBadge } from './PositionRiskBadge';
import { useDraggablePanel } from './useDraggablePanel';

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

  const { offset, isDragging, dragHandleProps } = useDraggablePanel({
    maxXPad: 420,
    maxYPad: 160,
    isOpen: true,
  });

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
    /* Floating Draggable Window (No full-screen dark backdrop blur) */
    <div
      className="fixed z-[60] top-20 sm:top-24 right-4 sm:right-12 w-full max-w-[min(540px,calc(100vw-2rem))] pointer-events-none"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      role="dialog"
      aria-label="Confirm emergency exit"
    >
      <div
        className={`pointer-events-auto w-full rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isLight
            ? 'bg-white/98 text-slate-900 border-rose-500 shadow-2xl'
            : 'bg-slate-950/98 text-slate-200 border-rose-500/80 backdrop-blur-2xl'
        } ${isDragging ? 'select-none opacity-95' : 'animate-in fade-in zoom-in-95 duration-150'}`}
        style={{
          boxShadow: isCritical
            ? '0 0 50px rgba(239, 68, 68, 0.4), 0 25px 60px rgba(0, 0, 0, 0.85)'
            : '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Drag Grip Handle */}
        <div
          {...dragHandleProps}
          className={`flex items-center justify-between px-3 py-1.5 border-b text-[10px] font-mono select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            isLight
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200'
              : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border-white/10'
          }`}
          title="Drag card to move anywhere on canvas"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="w-3.5 h-3.5 opacity-70" />
            <span className="font-extrabold uppercase tracking-wider text-[9px]">
              Tactical Exit Deck // Drag
            </span>
          </div>
          <span className="text-[9px] font-bold opacity-75">Esc close</span>
        </div>

        {/* Card Header */}
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
          isLight ? 'border-slate-200 bg-slate-50/80' : 'border-white/10 bg-black/40'
        }`}>
          <div className="flex flex-col min-w-0 gap-1 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className={`font-black text-sm truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                Confirm Emergency Exit
              </h2>
              <PositionRiskBadge risk={node.riskLevel} isLight={isLight} />
            </div>
            <span className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {node.title} &bull; {node.app}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExecutingKill}
            className={`shrink-0 h-8 px-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer disabled:opacity-40 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Esc
          </button>
        </div>

        {/* Scrollable Deck Content */}
        <div 
          className="modal-scroll overflow-y-auto p-3 flex flex-col gap-2.5 overscroll-contain"
          style={{ touchAction: 'pan-y' }}
        >
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
