import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PositionExitRoute, RiskLevel } from '../../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Clock, 
  CheckCircle2, 
  Radio, 
  Activity, 
  ArrowRight,
  Terminal
} from 'lucide-react';
import { RoutePipelineFlow } from './RoutePipelineFlow';

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
    holdStartTimeRef.current = performance.now();

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

  // Spacebar hold interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isHolding && !isExecuting) {
        // Prevent page scroll
        const target = e.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)) return;
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
    <div className={`rounded-xl border transition-colors overflow-hidden ${
      isLight 
        ? 'bg-slate-50/90 border-slate-200/90 shadow-sm' 
        : 'bg-slate-950/70 border-slate-800'
    }`}>
      {/* Deck Header: Telemetry & State */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isExecuting 
              ? 'bg-rose-500 animate-ping' 
              : isCritical 
              ? 'bg-rose-500 animate-pulse' 
              : 'bg-emerald-500'
          }`} />
          <span className={`text-xs font-mono font-bold tracking-wider uppercase ${
            isLight ? 'text-slate-900' : 'text-slate-200'
          }`}>
            {isCritical ? 'Emergency Unwind Protocol' : 'Pre-computed Exit Routes'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 border ${
            isLight 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
          }`}>
            <Lock className="w-2.5 h-2.5" />
            MEV Protected
          </span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isLight
              ? 'bg-slate-200/70 text-slate-700 border-slate-300'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            Private RPC
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Route Selector: Segmented Grid */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className={isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}>
              Available Liquidation &amp; Unwind Paths:
            </span>
            <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>
              {routes.length} paths pre-computed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {routes.map((route, idx) => {
              const isSelected = selectedRouteIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isExecuting && onSelectRoute(idx)}
                  disabled={isExecuting}
                  className={`p-3 rounded-lg border text-left transition-all duration-150 flex flex-col gap-1.5 relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                    isSelected
                      ? (isLight
                          ? isCritical
                            ? 'bg-white border-rose-500 shadow-sm ring-1 ring-rose-400/40 text-slate-900'
                            : 'bg-white border-slate-900 shadow-sm ring-1 ring-slate-900/30 text-slate-900'
                          : isCritical
                            ? 'bg-slate-900/90 border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.12)] text-white'
                            : 'bg-slate-900/90 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.12)] text-white')
                      : (isLight
                          ? 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                          : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60')
                  } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected 
                          ? (isCritical 
                              ? 'border-rose-500 bg-rose-500 text-white' 
                              : isLight ? 'border-slate-900 bg-slate-900 text-white' : 'border-cyan-500 bg-cyan-500 text-black')
                          : (isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-700 bg-slate-800')
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-xs font-bold font-mono ${
                        isSelected 
                          ? (isCritical ? (isLight ? 'text-rose-700' : 'text-rose-400') : (isLight ? 'text-slate-950' : 'text-cyan-400'))
                          : (isLight ? 'text-slate-800' : 'text-slate-300')
                      }`}>
                        Exit to {route.targetAsset}
                      </span>
                    </div>

                    <div className={`text-[10px] font-mono flex items-center gap-1 ${
                      isLight ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>{route.timeSeconds}s</span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <span className={`text-sm font-mono font-bold tracking-tight ${
                      isLight ? 'text-slate-950' : 'text-white'
                    }`}>
                      {route.estReturn}
                    </span>
                    <span className={`text-[10px] font-mono ${
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
        </div>

        {/* Execution Stepper Terminal (Active State) */}
        {isExecuting && (
          <div className={`p-3.5 rounded-lg border flex flex-col gap-2.5 animate-in fade-in duration-200 ${
            isLight 
              ? 'bg-rose-50/60 border-rose-200 text-slate-900' 
              : 'bg-rose-950/20 border-rose-900/40 text-slate-100'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="flex items-center gap-2 text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Executing Unwind Pipeline
              </span>
              <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Step {killStep} of 3
              </span>
            </div>

            <div className={`w-full h-1.5 rounded-full overflow-hidden ${
              isLight ? 'bg-slate-200' : 'bg-slate-800'
            }`}>
              <div 
                className="bg-rose-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${(killStep / 3) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
              <div className={`p-1.5 rounded border transition-colors ${
                killStep >= 1
                  ? (isLight ? 'bg-white border-rose-300 text-rose-700 font-bold' : 'bg-slate-900 border-rose-500/50 text-rose-400 font-bold')
                  : (isLight ? 'border-transparent text-slate-400' : 'border-transparent text-slate-600')
              }`}>
                1. Revoke &amp; Collateral
              </div>
              <div className={`p-1.5 rounded border transition-colors ${
                killStep >= 2
                  ? (isLight ? 'bg-white border-rose-300 text-rose-700 font-bold' : 'bg-slate-900 border-rose-500/50 text-rose-400 font-bold')
                  : (isLight ? 'border-transparent text-slate-400' : 'border-transparent text-slate-600')
              }`}>
                2. Private RPC Routing
              </div>
              <div className={`p-1.5 rounded border transition-colors ${
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
        <div className="flex flex-col gap-2">
          <div className="relative">
            <button
              type="button"
              disabled={isExecuting}
              onMouseDown={startHold}
              onMouseUp={cancelHold}
              onMouseLeave={cancelHold}
              onTouchStart={startHold}
              onTouchEnd={cancelHold}
              onTouchCancel={cancelHold}
              className={`w-full relative overflow-hidden py-3 px-4 rounded-lg font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 border select-none transition-all duration-150 cursor-pointer ${
                isExecuting
                  ? 'opacity-60 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-400'
                  : isHolding
                  ? isCritical
                    ? 'bg-rose-600 text-white border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.4)] scale-[0.99]'
                    : 'bg-emerald-600 text-white border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-[0.99]'
                  : isCritical
                  ? (isLight
                      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-sm hover:shadow'
                      : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border-rose-800/80 hover:border-rose-700 hover:text-white shadow-md')
                  : (isLight
                      ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950 shadow-sm hover:shadow'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border-slate-700 hover:border-slate-600 shadow-md')
              }`}
            >
              {/* Dynamic Progress Fill for Hold Gesture */}
              {isHolding && (
                <div 
                  className={`absolute inset-0 transition-none z-0 ${
                    isCritical ? 'bg-rose-600' : 'bg-emerald-600'
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
                <span>
                  {isExecuting
                    ? 'Executing Unwind Protocol...'
                    : isHolding
                    ? `Hold to Confirm (${Math.round((1 - holdProgress / 100) * 1.2 * 10) / 10}s)...`
                    : isCritical
                    ? `Hold 1.2s to Emergency Unwind (Exit to ${selectedRoute?.targetAsset || 'Safe Asset'})`
                    : `Hold 1.2s to Exit Position (Exit to ${selectedRoute?.targetAsset || 'Safe Asset'})`}
                </span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70" />
              </div>
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono px-1">
            <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>
              Hold <kbd className="px-1 py-0.2 rounded border text-[9px] bg-slate-800/40 border-slate-700">Space</kbd> or press &amp; hold button
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
