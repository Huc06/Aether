import React, { useState } from 'react';
import { CanvasNode, PositionExitRoute } from '../../types';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  Coins, 
  Activity, 
  Lock, 
  RefreshCw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PositionDetailModalProps {
  node: CanvasNode | null;
  onClose: () => void;
  onKillSwitch: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const PositionDetailModal: React.FC<PositionDetailModalProps> = ({
  node,
  onClose,
  onKillSwitch
}) => {
  const [selectedExitIndex, setSelectedExitIndex] = useState(0);
  const [isExecutingKill, setIsExecutingKill] = useState(false);
  const [killStep, setKillStep] = useState(0);

  if (!node) return null;

  const isCritical = node.riskLevel === 'critical';
  const isHigh = node.riskLevel === 'high';

  const handleTriggerKillSwitch = () => {
    if (!node.exitRoutes || node.exitRoutes.length === 0) return;
    const targetRoute = node.exitRoutes[selectedExitIndex];

    setIsExecutingKill(true);
    setKillStep(1);

    setTimeout(() => setKillStep(2), 800);
    setTimeout(() => setKillStep(3), 1600);
    setTimeout(() => {
      setIsExecutingKill(false);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
      onKillSwitch(node, targetRoute);
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md transition-all">
      <div 
        className="glass-panel w-full max-w-2xl rounded-2xl border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        style={{
          boxShadow: isCritical 
            ? '0 0 60px rgba(239, 68, 68, 0.35), 0 25px 60px rgba(0, 0, 0, 0.9)'
            : '0 0 50px rgba(245, 158, 11, 0.2), 0 25px 60px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Header Bar */}
        <div className="p-5 border-b border-white/10 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{node.icon}</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-white tracking-wide">
                  {node.title}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                  isCritical 
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : isHigh
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}>
                  {node.riskLevel} Risk
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {node.app} &bull; {node.chain} &bull; {node.category}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center border border-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="overflow-y-auto p-5 flex flex-col gap-5">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-slate-950/70 border border-white/10 p-3 flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total Position Value</span>
              <span className="text-lg font-extrabold text-white font-mono mt-1">
                ${node.valueUsd.toLocaleString()}
              </span>
              {node.pnl24hUsd !== undefined && (
                <span className={`text-[11px] font-semibold font-mono mt-0.5 ${
                  node.pnl24hUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {node.pnl24hUsd >= 0 ? '+' : ''}${node.pnl24hUsd.toLocaleString()} ({node.pnlPercent}%)
                </span>
              )}
            </div>

            {node.apy !== undefined && (
              <div className="rounded-xl bg-slate-950/70 border border-white/10 p-3 flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Current Net APY</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono mt-1">
                  {node.apy}%
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Est. 24h: +${node.fees24hUsd || 45.2}
                </span>
              </div>
            )}

            {node.healthFactor !== undefined && (
              <div className="rounded-xl bg-slate-950/70 border border-white/10 p-3 flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Health Factor</span>
                <span className={`text-lg font-extrabold font-mono mt-1 ${
                  node.healthFactor < 1.15 ? 'text-rose-400' : (node.healthFactor < 1.5 ? 'text-amber-400' : 'text-emerald-400')
                }`}>
                  {node.healthFactor.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Liq threshold: 1.00
                </span>
              </div>
            )}

            {node.liquidationDistancePct !== undefined && (
              <div className="rounded-xl bg-slate-950/70 border border-white/10 p-3 flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Liq Distance</span>
                <span className={`text-lg font-extrabold font-mono mt-1 ${
                  node.liquidationDistancePct < 15 ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  -{node.liquidationDistancePct.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Liq Price: ${node.liquidationPrice?.toLocaleString() || 'N/A'}
                </span>
              </div>
            )}
          </div>

          {/* Strategy & Risk Breakdown */}
          <div className="rounded-xl bg-slate-950/60 border border-white/10 p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-amber-400" />
              Strategy &amp; Systemic Risk Profile
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {node.strategy || 'Multi-asset liquidity vault participating in automated yield generation.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="flex flex-col gap-1 p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Collateral Backing</span>
                <span className="text-white font-bold">{node.collateralAsset || 'Locked LP Liquidity'}</span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded bg-black/40 border border-white/5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Debt / Borrow Obligation</span>
                <span className="text-rose-400 font-bold">{node.borrowAsset || 'No active debt (Delta Neutral)'}</span>
              </div>
            </div>

            {/* Smart contract & Oracle verification */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audited by: <strong className="text-slate-300">{node.auditedBy?.join(', ') || 'Top Tier Auditors'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Oracle: <strong className="text-slate-300">{node.oracleProvider || 'Chainlink / Pyth Feeds'}</strong></span>
              </div>
            </div>
          </div>

          {/* Pre-defined Exit Routes & Emergency Kill Switch */}
          {node.exitRoutes && node.exitRoutes.length > 0 && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="font-extrabold text-sm text-white tracking-wide">
                    Pre-computed Exit Routes &amp; Kill Switch
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  MEV PROTECTED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {node.exitRoutes.map((route, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedExitIndex(idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                      selectedExitIndex === idx
                        ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg'
                        : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-rose-400 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        Exit to {route.targetAsset}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {route.timeSeconds}s
                      </span>
                    </div>
                    <div className="font-extrabold text-sm font-mono text-white mt-1">
                      {route.estReturn}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Fee: {route.fee} &bull; {route.routeSummary}
                    </div>
                  </div>
                ))}
              </div>

              {/* Execution Progress Bar if active */}
              {isExecutingKill && (
                <div className="p-3 rounded-lg bg-black/60 border border-rose-500/50 flex flex-col gap-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs text-rose-300 font-bold">
                    <span>⚡ EXECUTING KILL SWITCH PROTOCOL...</span>
                    <span>STEP {killStep}/3</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${(killStep / 3) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {killStep === 1 && '1. Unwinding LP tokens and withdrawing collateral...'}
                    {killStep === 2 && '2. Routing through private RPC with 0 slippage MEV protection...'}
                    {killStep === 3 && '3. Settling net output to safe wallet...'}
                  </span>
                </div>
              )}

              {/* 1-Click Kill Switch Button */}
              <button
                disabled={isExecutingKill}
                onClick={handleTriggerKillSwitch}
                className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>
                  {isExecutingKill
                    ? 'Executing Emergency Unwind...'
                    : `⚡ 1-Click Emergency Kill Switch (Exit to ${node.exitRoutes[selectedExitIndex].targetAsset})`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
