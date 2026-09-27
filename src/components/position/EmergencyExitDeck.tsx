import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PositionExitRoute, RiskLevel } from '../../types';
import { 
  ShieldAlert, 
  Lock, 
  Clock, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import { RoutePipelineFlow } from './RoutePipelineFlow';
import { instrumentPanelClass } from './detailPhase';

interface EmergencyExitDeckProps {
  routes: PositionExitRoute[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  onTriggerUnwind: (route: PositionExitRoute) => void;
  riskLevel?: RiskLevel;
  isLight?: boolean;
  isExecuting?: boolean;
  killStep?: number;
}

const HOLD_DURATION_MS = 1200;

export const EmergencyExitDeck: React.FC<EmergencyExitDeckProps> = ({
  routes,
  selectedRouteIndex,
  onSelectRoute,
  onTriggerUnwind,
  riskLevel = 'safe',
  isLight = false,
  isExecuting = false,
  killStep = 0
}) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdStartTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isCritical = riskLevel === 'critical' || riskLevel === 'high';
  const selectedRoute = routes[selectedRouteIndex] || routes[0];

  const cancelHold = useCallback(() => {
    setIsHolding(false);
    holdStartTimeRef.current = null;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setHoldProgress(0);
  }, []);

  const handleHoldComplete = useCallback(() => {
    cancelHold();
    if (selectedRoute && !isExecuting) {
      onTriggerUnwind(selectedRoute);
    }
  }, [cancelHold, selectedRoute, isExecuting, onTriggerUnwind]);

  const startHold = useCallback(() => {
    if (isExecuting || !selectedRoute) return;
    setIsHolding(true);
    const start = performance.now();
    holdStartTimeRef.current = start;

    const tick = (now: number) => {
      if (!holdStartTimeRef.current) return;
      const elapsed = now - holdStartTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        handleHoldComplete();
      } else {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [isExecuting, selectedRoute, handleHoldComplete]);

  // Pointer event handlers with pointer capture so moving mouse/finger never prematurely cancels hold
  const onButtonPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || isExecuting) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    startHold();
  };

  const onButtonPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    cancelHold();
  };

  const onButtonPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    cancelHold();
  };

  // Spacebar hold interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isHolding && !isExecuting) {
        const target = e.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
        e.preventDefault();
        startHold();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isHolding) {
        e.preventDefault();
        cancelHold();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [startHold, cancelHold, isHolding, isExecuting]);

  if (!routes || routes.length === 0) return null;

  return (
    <div className={`transition-colors overflow-hidden ${instrumentPanelClass(riskLevel, isLight)}`}>
      {/* Deck Header: Telemetry & State */}
      <div className={`px-3.5 py-2 border-b flex items-center justify-between gap-2 ${
        isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            isExecuting 
              ? 'bg-rose-500 animate-ping' 
              : isCritical 
              ? 'bg-rose-500 animate-pulse' 
              : 'bg-emerald-500'
          }`} />
          <span className={`text-[11px] font-mono font-bold tracking-wider uppercase truncate ${
            isLight ? 'text-slate-900' : 'text-slate-200'
          }`}>
            {isCritical ? 'Emergency Exit Protocol' : 'Pre-computed Exit Routes'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${
            isLight 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
          }`}>
            <Lock className="w-2.5 h-2.5" />
            MEV Protected
          </span>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            isLight
              ? 'bg-slate-200/70 text-slate-700 border-slate-300'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            Private RPC
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2.5">
        {/* Dynamic Route Grid: 1 route = full width, 2 routes = split */}
        <div className={`grid gap-2 ${routes.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {routes.map((route, idx) => {
            const isSelected = selectedRouteIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => !isExecuting && onSelectRoute(idx)}
                disabled={isExecuting}
                className={`p-2.5 rounded-lg border text-left transition-[border-color,background-color,box-shadow,color] duration-150 flex flex-col gap-1 relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400 min-w-0 ${
                  isSelected
                    ? (isLight
                        ? isCritical
                          ? 'bg-white/80 border-rose-500 shadow-sm ring-1 ring-rose-400/40 text-slate-900 backdrop-blur-sm'
                          : 'bg-white/80 border-slate-900 shadow-sm ring-1 ring-slate-900/30 text-slate-900 backdrop-blur-sm'
                        : isCritical
                          ? 'bg-slate-900/55 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.12)] text-white backdrop-blur-sm'
                          : 'bg-slate-900/55 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.12)] text-white backdrop-blur-sm')
                    : (isLight
                        ? 'bg-white/40 border-slate-200 text-slate-700 hover:bg-white/65 hover:border-slate-300'
                        : 'bg-slate-900/25 border-white/8 text-slate-300 hover:border-white/15 hover:bg-slate-900/40')
                } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
                      isSelected 
                        ? (isCritical 
                            ? 'border-rose-500 bg-rose-500 text-white' 
                            : isLight ? 'border-slate-900 bg-slate-900 text-white' : 'border-cyan-500 bg-cyan-500 text-black')
                        : (isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-700 bg-slate-800')
                    }`}>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                    <span 
                      title={`Exit to ${route.targetAsset}`}
                      className={`text-[11px] font-bold font-mono truncate ${
                        isSelected 
                          ? (isCritical ? (isLight ? 'text-rose-700' : 'text-rose-400') : (isLight ? 'text-slate-950' : 'text-cyan-400'))
                          : (isLight ? 'text-slate-800' : 'text-slate-300')
                      }`}
                    >
                      Exit to {route.targetAsset}
                    </span>
                  </div>

                  <div className="text-[9px] font-mono flex items-center gap-0.5 shrink-0 text-slate-500">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{route.timeSeconds}s</span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-0.5">
                  <span className={`text-xs font-mono font-bold tracking-tight ${
                    isLight ? 'text-slate-950' : 'text-white'
                  }`}>
                    {route.estReturn}
                  </span>
                  <span className={`text-[9px] font-mono ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Fee: {route.fee}
                  </span>
                </div>

                {/* Micro Flow Pipeline */}
                <RoutePipelineFlow 
                  summary={route.routeSummary} 
                  isLight={isLight} 
                  isSelected={isSelected} 
                />
              </button>
            );
          })}
        </div>

        {/* Execution Active Telemetry Pipeline */}
        {isExecuting && (
          <div className={`p-2.5 rounded-lg border font-mono text-[10px] flex flex-col gap-1.5 animate-in fade-in duration-150 ${
            isLight ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}>
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                Executing Exit Pipeline
              </span>
              <span className="text-[9px] uppercase tracking-wider">Step {killStep}/3</span>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-[9px] font-mono">
              <div className={`p-1 rounded border transition-colors ${
                killStep >= 1 
                  ? (isLight ? 'bg-white border-rose-300 text-rose-700 font-bold' : 'bg-slate-900 border-rose-500/50 text-rose-400 font-bold') 
                  : (isLight ? 'border-transparent text-slate-400' : 'border-transparent text-slate-600')
              }`}>
                1. Jito MEV Shield
              </div>
              <div className={`p-1 rounded border transition-colors ${
                killStep >= 2
                  ? (isLight ? 'bg-white border-rose-300 text-rose-700 font-bold' : 'bg-slate-900 border-rose-500/50 text-rose-400 font-bold')
                  : (isLight ? 'border-transparent text-slate-400' : 'border-transparent text-slate-600')
              }`}>
                2. Private RPC Route
              </div>
              <div className={`p-1 rounded border transition-colors ${
                killStep >= 3
                  ? (isLight ? 'bg-white border-rose-300 text-rose-700 font-bold' : 'bg-slate-900 border-rose-500/50 text-rose-400 font-bold')
                  : (isLight ? 'border-transparent text-slate-400' : 'border-transparent text-slate-600')
              }`}>
                3. Treasury Settle
              </div>
            </div>
          </div>
        )}

        {/* Hold-to-Execute Action Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <button
              type="button"
              disabled={isExecuting}
              onPointerDown={onButtonPointerDown}
              onPointerUp={onButtonPointerUp}
              onPointerCancel={onButtonPointerCancel}
              className={`w-full relative overflow-hidden py-3 px-3 rounded-lg font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 border select-none transition-all duration-150 cursor-pointer touch-none ${
                isExecuting
                  ? 'opacity-60 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-400'
                  : isHolding
                  ? isCritical
                    ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.6)] scale-[0.99]'
                    : 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.6)] scale-[0.99]'
                  : isCritical
                  ? (isLight
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-sm hover:shadow'
                      : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-100 border-rose-500/80 hover:border-rose-400 hover:text-white shadow-lg')
                  : (isLight
                      ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950 shadow-sm hover:shadow'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-slate-600 shadow-md')
              }`}
            >
              {/* Dynamic Progress Fill for Hold Gesture */}
              {isHolding && (
                <div 
                  className={`absolute inset-0 transition-none z-0 ${
                    isCritical ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${holdProgress}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-center gap-2">
                {isCritical ? (
                  <ShieldAlert className={`w-4 h-4 ${isHolding ? 'text-white animate-pulse' : (isLight ? 'text-white' : 'text-rose-400')}`} />
                ) : (
                  <CheckCircle2 className={`w-4 h-4 ${isHolding ? 'text-white animate-pulse' : (isLight ? 'text-white' : 'text-emerald-400')}`} />
                )}
                <span className="truncate">
                  {isExecuting
                    ? 'Executing Exit Protocol...'
                    : isHolding
                    ? `Hold to Confirm (${Math.round((1 - holdProgress / 100) * 1.2 * 10) / 10}s)...`
                    : isCritical
                    ? `Hold 1.2s to Emergency Exit (to ${selectedRoute?.targetAsset || 'Safe Asset'})`
                    : `Hold 1.2s to Exit Position (to ${selectedRoute?.targetAsset || 'Safe Asset'})`}
                </span>
                <ArrowRight className="w-4 h-4 opacity-70 shrink-0" />
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono px-1">
            <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>
              Hold <kbd className="px-1 py-0.2 rounded border text-[9px] bg-slate-800/40 border-slate-700">Space</kbd> or click &amp; hold button
            </span>
            <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>
              Zero-sandwich guarantee &bull; Flashbots / Jito Private RPC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
