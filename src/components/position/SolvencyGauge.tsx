import React from 'react';
import { RiskLevel } from '../../types';
import { Activity, AlertTriangle, ShieldCheck, ArrowDownRight } from 'lucide-react';

interface SolvencyGaugeProps {
  healthFactor?: number;
  liquidationDistancePct?: number;
  liquidationPrice?: number;
  debtRatioPct?: number;
  riskLevel: RiskLevel;
  isLight?: boolean;
}

export const SolvencyGauge: React.FC<SolvencyGaugeProps> = ({
  healthFactor = 2.0,
  liquidationDistancePct,
  liquidationPrice,
  debtRatioPct,
  riskLevel,
  isLight = false,
}) => {
  const isCritical = riskLevel === 'critical' || healthFactor < 1.15;
  const isWarning = riskLevel === 'high' || (healthFactor >= 1.15 && healthFactor < 1.5);
  
  // Calculate pin position percentage (scale 1.0 to 3.0 HF -> 0% to 100%)
  const clampedHf = Math.max(1.0, Math.min(3.0, healthFactor));
  const pinPercent = ((clampedHf - 1.0) / 2.0) * 100;

  return (
    <div className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-colors ${
      isLight 
        ? 'bg-slate-50 border-slate-200/90 shadow-sm' 
        : 'bg-slate-950/70 border-slate-800'
    }`}>
      {/* Metric Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className={`w-3.5 h-3.5 ${
            isCritical ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'
          }`} />
          <span className={`text-xs font-mono font-bold tracking-wider uppercase ${
            isLight ? 'text-slate-800' : 'text-slate-200'
          }`}>
            Solvency &amp; Liquidation Buffer
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
            isCritical
              ? (isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950/60 text-rose-400 border-rose-800/80')
              : isWarning
              ? (isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/60 text-amber-400 border-amber-800/80')
              : (isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80')
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isCritical ? 'bg-rose-500 animate-ping' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            HF {healthFactor.toFixed(2)} &bull; {riskLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Optical Segment Meter */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="relative w-full h-3 rounded-full overflow-hidden bg-slate-900 border border-slate-800/80 p-0.5 flex">
          {/* Liquidation Zone (1.0 - 1.25) */}
          <div className="h-full w-[20%] bg-gradient-to-r from-rose-600 to-rose-500 rounded-l-full relative group">
            <span className="sr-only">Liquidation Zone</span>
          </div>
          {/* Warning Zone (1.25 - 1.6) */}
          <div className="h-full w-[25%] bg-gradient-to-r from-amber-600 to-amber-500">
            <span className="sr-only">Warning Zone</span>
          </div>
          {/* Safe Zone (1.6 - 3.0+) */}
          <div className="h-full w-[55%] bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-r-full">
            <span className="sr-only">Safe Zone</span>
          </div>

          {/* Current Position Pin */}
          <div 
            className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)] -translate-x-1/2 transition-all duration-300"
            style={{ left: `${pinPercent}%` }}
          />
        </div>

        {/* Meter Legend & Ticks */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <span className="text-rose-400 font-semibold">1.00 Liq</span>
          <span className="text-amber-400">1.25 Warn</span>
          <span className="text-emerald-400">1.75+ Safe</span>
          <span className={isLight ? 'text-slate-700 font-bold' : 'text-slate-300 font-bold'}>
            Target: 3.00+
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/60 text-xs font-mono">
        <div className="flex flex-col">
          <span className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Liq Distance</span>
          <span className={`font-bold mt-0.5 ${
            liquidationDistancePct !== undefined && liquidationDistancePct < 15
              ? (isLight ? 'text-rose-700' : 'text-rose-400')
              : (isLight ? 'text-slate-900' : 'text-slate-200')
          }`}>
            {liquidationDistancePct !== undefined ? `-${liquidationDistancePct.toFixed(1)}%` : 'N/A'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Liquidation Price</span>
          <span className={`font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
            {liquidationPrice ? `$${liquidationPrice.toLocaleString()}` : 'N/A (Delta Neutral)'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className={`text-[10px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Est. Collateral Cushion</span>
          <span className={`font-bold mt-0.5 ${isCritical ? 'text-rose-500' : 'text-emerald-400'}`}>
            {isCritical ? 'High Risk Exposure' : 'Protected Buffer'}
          </span>
        </div>
      </div>
    </div>
  );
};
