import React from 'react';
import { Activity, FileText, ShieldCheck } from 'lucide-react';
import { CanvasNode } from '../../types';
import { instrumentPanelClass } from './detailPhase';

export const PositionStrategyStrip: React.FC<{
  node: CanvasNode;
  isLight?: boolean;
}> = ({ node, isLight = false }) => {
  return (
    <div className={`p-2.5 sm:p-3 flex flex-col gap-1.5 ${instrumentPanelClass(node.riskLevel, isLight)}`}>
      <div className="flex items-start gap-1.5 text-xs font-mono min-w-0">
        <FileText className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
        <span className={`font-bold uppercase tracking-wider text-[10px] shrink-0 ${isLight ? 'text-slate-900' : 'text-slate-300'}`}>
          Strategy:
        </span>
        <span
          title={node.strategy || 'Multi-asset liquidity vault participating in automated yield generation.'}
          className={`font-normal normal-case text-[11px] line-clamp-2 min-w-0 flex-1 leading-snug ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
        >
          {node.strategy || 'Multi-asset liquidity vault participating in automated yield generation.'}
        </span>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t text-[10px] font-mono ${
        isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-slate-400'
      }`}>
        <div className="flex items-center gap-1 min-w-0 max-w-[48%] sm:max-w-none">
          <ShieldCheck className={`w-3 h-3 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
          <span className="truncate">
            Audited:{' '}
            <strong title={node.auditedBy?.join(', ') || 'Top Tier Audited'} className={`truncate ${isLight ? 'text-slate-950' : 'text-slate-300'}`}>
              {node.auditedBy?.join(', ') || 'Top Tier Audited'}
            </strong>
          </span>
        </div>
        {node.smartMoneyNetflow24h !== undefined && (
          <div className="flex items-center gap-1 shrink-0">
            <Activity className={`w-3 h-3 shrink-0 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
            <span>
              Nansen SM 24h:{' '}
              <strong className={node.smartMoneyNetflow24h >= 0
                ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                : isLight ? 'text-rose-700' : 'text-rose-400'}>
                {node.smartMoneyNetflow24h >= 0 ? '+' : ''}${Math.round(node.smartMoneyNetflow24h).toLocaleString()}
              </strong>
            </span>
          </div>
        )}
        <div className="flex items-center gap-1 min-w-0 max-w-[48%] sm:max-w-none">
          <Activity className={`w-3 h-3 shrink-0 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
          <span className="truncate">
            Oracle:{' '}
            <strong title={node.oracleProvider || 'Chainlink / Pyth Feeds'} className={`truncate ${isLight ? 'text-slate-950' : 'text-slate-300'}`}>
              {node.oracleProvider || 'Chainlink / Pyth Feeds'}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
