import React, { useState } from 'react';
import { CanvasNode, PositionExitRoute, LensConfig } from '../../types';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  FileText 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EmergencyExitDeck } from './EmergencyExitDeck';
import { SolvencyGauge } from './SolvencyGauge';

interface PositionDetailModalProps {
  node: CanvasNode | null;
  config?: LensConfig;
  onClose: () => void;
  onKillSwitch: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const PositionDetailModal: React.FC<PositionDetailModalProps> = ({
  node,
  config,
  onClose,
  onKillSwitch
}) => {
  const [selectedExitIndex, setSelectedExitIndex] = useState(0);
  const [isExecutingKill, setIsExecutingKill] = useState(false);
  const [killStep, setKillStep] = useState(0);

  if (!node) return null;

  const isCritical = node.riskLevel === 'critical';
  const isHigh = node.riskLevel === 'high';
  const isLight = config?.themeMode === 'light';

  const handleTriggerKillSwitch = (targetRoute?: PositionExitRoute) => {
    if (!node.exitRoutes || node.exitRoutes.length === 0) return;
    const route = targetRoute || node.exitRoutes[selectedExitIndex];

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
      onKillSwitch(node, route);
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all">
      <div 
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-top-3 duration-200 transition-colors ${
          isLight 
            ? 'bg-white/98 text-slate-900 border-slate-300 shadow-2xl' 
            : 'glass-panel text-slate-200 border-slate-800'
        }`}
        style={{
          boxShadow: isCritical 
            ? '0 0 60px rgba(239, 68, 68, 0.35), 0 25px 60px rgba(0, 0, 0, 0.9)' 
            : (isLight ? '0 20px 60px rgba(0, 0, 0, 0.15)' : '0 0 50px rgba(16, 185, 129, 0.15), 0 25px 60px rgba(0, 0, 0, 0.9)')
        }}
      >
        {/* Header Bar */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50/95 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className={`font-black text-base sm:text-lg tracking-wide ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {node.title}
                </h2>
                <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase border flex items-center gap-1 ${
                  isCritical 
                    ? (isLight ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-500/20 text-rose-400 border-rose-500/40')
                    : isHigh
                    ? (isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/40')
                    : (isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40')
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isCritical ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  {node.riskLevel} Risk
                </span>
              </div>
              <span className={`text-xs font-mono font-medium mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {node.app} &bull; {node.chain} &bull; {node.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded border ${
              isLight ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
            }`}>
              ESC
            </span>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 border-slate-300' : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {/* Top Primary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3.5 flex flex-col justify-between transition-colors ${
              isLight ? 'bg-slate-50 border-slate-200/90 shadow-sm' : 'bg-slate-950/70 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-extrabold uppercase font-mono tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Total Position Value
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  isLight ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {node.chain}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className={`text-2xl font-black font-mono tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  ${node.valueUsd.toLocaleString()}
                </span>
                {node.pnl24hUsd !== undefined && (
                  <span className={`text-xs font-bold font-mono ${
                    node.pnl24hUsd >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')
                  }`}>
                    {node.pnl24hUsd >= 0 ? '+' : ''}${node.pnl24hUsd.toLocaleString()} ({node.pnlPercent}%)
                  </span>
                )}
              </div>
            </div>

            {node.apy !== undefined && (
              <div className={`rounded-xl border p-3.5 flex flex-col justify-between transition-colors ${
                isLight ? 'bg-slate-50 border-slate-200/90 shadow-sm' : 'bg-slate-950/70 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-extrabold uppercase font-mono tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Current Net APY
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
                  }`}>
                    Auto-Compound
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={`text-2xl font-black font-mono tracking-tight ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {node.apy}%
                  </span>
                  <span className={`text-xs font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Est. 24h: +${node.fees24hUsd || 45.2}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Solvency & Liquidation Optical Meter */}
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

          {/* Strategy & Risk Breakdown */}
          <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-colors ${
            isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider ${isLight ? 'text-slate-950' : 'text-slate-300'}`}>
              <FileText className={`w-3.5 h-3.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              Strategy &amp; Systemic Risk Profile
            </div>
            <p className={`text-xs leading-relaxed font-sans font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {node.strategy || 'Multi-asset liquidity vault participating in automated yield generation.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
              <div className={`flex flex-col gap-1 p-2.5 rounded-lg border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'
              }`}>
                <span className={`text-[10px] font-extrabold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Collateral Backing</span>
                <span className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>{node.collateralAsset || 'Locked LP Liquidity'}</span>
              </div>
              <div className={`flex flex-col gap-1 p-2.5 rounded-lg border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-slate-800/80'
              }`}>
                <span className={`text-[10px] font-extrabold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Debt / Borrow Obligation</span>
                <span className={`font-bold ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>{node.borrowAsset || 'No active debt (Delta Neutral)'}</span>
              </div>
            </div>

            {/* Smart contract, Nansen Intelligence & Oracle verification */}
            <div className={`flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px] font-mono ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800/80 text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                <span>Audited: <strong className={isLight ? 'text-slate-950' : 'text-slate-300'}>{node.auditedBy?.join(', ') || 'Top Tier Audited'}</strong></span>
              </div>
              {node.smartMoneyNetflow24h !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                  <span>Nansen SM 24h: <strong className={node.smartMoneyNetflow24h >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}>
                    {node.smartMoneyNetflow24h >= 0 ? '+' : ''}${Math.round(node.smartMoneyNetflow24h).toLocaleString()}
                  </strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                <span>Oracle: <strong className={isLight ? 'text-slate-950' : 'text-slate-300'}>{node.oracleProvider || 'Chainlink / Pyth Feeds'}</strong></span>
              </div>
            </div>
          </div>

          {/* Pre-defined Exit Routes & Emergency Exit Deck */}
          {node.exitRoutes && node.exitRoutes.length > 0 && (
            <EmergencyExitDeck
              routes={node.exitRoutes}
              selectedRouteIndex={selectedExitIndex}
              onSelectRoute={setSelectedExitIndex}
              onTriggerUnwind={(route) => handleTriggerKillSwitch(route)}
              riskLevel={node.riskLevel}
              isLight={isLight}
              isExecuting={isExecutingKill}
              killStep={killStep}
            />
          )}
        </div>
      </div>
    </div>
  );
};
