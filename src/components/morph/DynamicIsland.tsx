import React, { useState } from 'react';
import { NumberFlip } from './NumberFlip';
import { 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  Zap, 
  RefreshCw, 
  ChevronDown, 
  Layers, 
  Sparkles,
  Search
} from 'lucide-react';

interface DynamicIslandProps {
  totalValue: number;
  totalPnl: number;
  pnlPercent: number;
  healthFactor: number;
  criticalCount: number;
  isSimulating: boolean;
  onOpenIntent: () => void;
  onFilterRisk: () => void;
}

export const DynamicIsland: React.FC<DynamicIslandProps> = ({
  totalValue,
  totalPnl,
  pnlPercent,
  healthFactor,
  criticalCount,
  isSimulating,
  onOpenIntent,
  onFilterRisk
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none">
      <div
        onClick={() => !isSimulating && setIsExpanded(!isExpanded)}
        className={`morph-pill overflow-hidden rounded-[26px] bg-slate-950/95 border text-white shadow-2xl backdrop-blur-xl cursor-pointer transition-all duration-300 ${
          isSimulating
            ? 'border-amber-500 shadow-amber-500/25 px-5 py-2.5 min-w-[320px] animate-pulse'
            : criticalCount > 0
            ? 'border-rose-500/50 shadow-rose-500/20 hover:border-rose-400 px-4 py-2'
            : 'border-white/15 hover:border-amber-500/50 px-4 py-2'
        } ${isExpanded ? 'w-[440px] p-4 rounded-[22px]' : 'h-10 flex items-center'}`}
      >
        {isSimulating ? (
          /* Active Simulation Island State */
          <div className="flex items-center justify-between w-full text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              <div className="flex flex-col">
                <span className="font-bold text-amber-300 text-[11px] leading-tight">
                  SIMULATING CROSS-CHAIN ROUTE
                </span>
                <span className="text-[10px] text-slate-400">
                  Validating 0-slippage MEV protection...
                </span>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500 text-black">
              ACTIVE
            </span>
          </div>
        ) : isExpanded ? (
          /* Expanded Island State */
          <div className="flex flex-col gap-3 text-xs font-mono w-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-extrabold text-xs text-white">
                  AETHER SPATIAL PORTFOLIO
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 rotate-180 transition-transform" />
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Exposure</span>
                <NumberFlip 
                  value={totalValue} 
                  prefix="$" 
                  className="text-base text-white mt-0.5" 
                />
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">24h Net PnL</span>
                <div className={`flex items-center gap-1 mt-0.5 ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <NumberFlip 
                    value={Math.abs(totalPnl)} 
                    prefix={totalPnl >= 0 ? '+$' : '-$'} 
                    className="text-sm" 
                  />
                  <span className="text-[10px]">({pnlPercent.toFixed(2)}%)</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Health Factor</span>
                <span className="text-sm font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                  {healthFactor.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">[SAFE]</span>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Risk Alerts</span>
                {criticalCount > 0 ? (
                  <span className="text-xs font-bold text-rose-400 mt-0.5 flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {criticalCount} Critical Positions
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-400 mt-0.5">
                    0 Critical Risks
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenIntent();
                }}
                className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow"
              >
                <Search className="w-3 h-3 fill-black" />
                <span>Intent &amp; Search (⌘K)</span>
              </button>

              {criticalCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterRisk();
                  }}
                  className="py-1.5 px-3 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-[11px] flex items-center gap-1"
                >
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  <span>Inspect Risk</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Compact Collapsed Island State */
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <NumberFlip value={totalValue} prefix="$" className="text-xs text-white" />
            </div>

            <div className="w-[1px] h-3.5 bg-white/15" />

            <div className={`text-[11px] font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <NumberFlip value={Math.abs(totalPnl)} prefix={totalPnl >= 0 ? '+$' : '-$'} />
            </div>

            {criticalCount > 0 && (
              <>
                <div className="w-[1px] h-3.5 bg-white/15" />
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterRisk();
                  }}
                  className="flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/25 text-rose-400 border border-rose-500/40 animate-pulse hover:bg-rose-500/40"
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>{criticalCount} ALERT</span>
                </div>
              </>
            )}

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hover:text-white transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
};
