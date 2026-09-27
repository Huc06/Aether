import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CanvasNode } from '../../types';
import { instrumentPanelClass } from './detailPhase';

export const PositionMetricsSummary: React.FC<{
  node: CanvasNode;
  isLight?: boolean;
}> = ({ node, isLight = false }) => {
  const receipt = node.settlementReceipt;

  return (
    <div className={`p-3 flex flex-col justify-between min-w-0 ${instrumentPanelClass(node.riskLevel, isLight)}`}>
      {receipt && (
        <div className={`mb-2.5 p-2 rounded-lg border font-mono text-[10px] flex items-center justify-between gap-2 ${
          isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
        }`}>
          <span className="flex items-center gap-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Position Settled &bull; Recovered: {receipt.recoveredAmount}
          </span>
          <span className="text-[9px] text-slate-400 shrink-0">
            {receipt.txHash.slice(0, 8)}...
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-1">
        <span className={`text-[10px] font-extrabold uppercase font-mono tracking-wider truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Total Position Value
        </span>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
          isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60'
        }`}>
          APY: {node.apy ? `${node.apy}%` : 'N/A'}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-1 gap-2">
        <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight truncate tabular-nums ${isLight ? 'text-slate-950' : 'text-white'}`}>
          ${node.valueUsd.toLocaleString()}
        </span>
        {node.pnl24hUsd !== undefined && (
          <span className={`text-[11px] font-bold font-mono shrink-0 tabular-nums ${
            node.pnl24hUsd >= 0
              ? isLight ? 'text-emerald-700' : 'text-emerald-400'
              : isLight ? 'text-rose-700' : 'text-rose-400'
          }`}>
            {node.pnl24hUsd >= 0 ? '+' : ''}${node.pnl24hUsd.toLocaleString()} ({node.pnlPercent}%)
          </span>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-2 pt-2 mt-1 border-t text-[11px] font-mono ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className="flex flex-col min-w-0">
          <span className={`text-[9px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Collateral</span>
          <span title={node.collateralAsset || 'Locked LP Liquidity'} className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {node.collateralAsset || 'Locked LP'}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-[9px] uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Debt Obligation</span>
          <span title={node.borrowAsset || 'No active debt (Delta-0)'} className={`font-bold truncate ${node.riskLevel === 'safe' ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}`}>
            {node.borrowAsset || 'No Debt (Delta-0)'}
          </span>
        </div>
      </div>
    </div>
  );
};
