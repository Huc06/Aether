import React from 'react';
import { CanvasNode } from '../../types';

export interface BarRankingProps {
  nodes: CanvasNode[];
  limit?: number;
  totalPortfolioValue?: number;
  isLight?: boolean;
  onSelectNode?: (node: CanvasNode) => void;
  className?: string;
}

export const BarRanking: React.FC<BarRankingProps> = ({
  nodes,
  limit = 6,
  totalPortfolioValue,
  isLight = false,
  onSelectNode,
  className = '',
}) => {
  const sorted = [...nodes].sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
  const topNodes = limit > 0 ? sorted.slice(0, limit) : sorted;

  const total = totalPortfolioValue || nodes.reduce((sum, n) => sum + (n.valueUsd || 0), 0) || 1;
  const maxValue = topNodes.length > 0 ? topNodes[0].valueUsd || 1 : 1;

  if (topNodes.length === 0) {
    return (
      <div className={`text-center py-6 font-mono text-xs ${isLight ? 'text-slate-400' : 'text-slate-600'} ${className}`}>
        NO NODES MATCH CRITERIA
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col gap-2.5 font-mono select-none ${className}`}>
      {topNodes.map((node, i) => {
        const rankStr = String(i + 1).padStart(2, '0');
        const sharePct = (node.valueUsd / total) * 100;
        const relativeBarPct = Math.min(100, Math.max(3, (node.valueUsd / maxValue) * 100));

        const isSafe = node.riskLevel === 'safe';
        const isCritical = node.riskLevel === 'critical';

        // Chain tag color
        const chainColor =
          node.chain === 'Solana'
            ? isLight ? 'text-purple-700 bg-purple-100 border-purple-300' : 'text-purple-300 bg-purple-950/40 border-purple-500/30'
            : node.chain === 'Arbitrum'
            ? isLight ? 'text-cyan-700 bg-cyan-100 border-cyan-300' : 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30'
            : node.chain === 'Hyperliquid'
            ? isLight ? 'text-emerald-700 bg-emerald-100 border-emerald-300' : 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30'
            : isLight ? 'text-blue-700 bg-blue-100 border-blue-300' : 'text-blue-300 bg-blue-950/40 border-blue-500/30';

        return (
          <div
            key={node.id}
            onClick={() => onSelectNode?.(node)}
            className={`group p-2 sm:p-2.5 border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-50/70 hover:bg-amber-50/60 border-slate-200 hover:border-amber-300'
                : 'bg-white/[0.02] hover:bg-amber-500/[0.06] border-white/10 hover:border-amber-500/30'
            }`}
          >
            {/* Top row: Rank, Title, Chain, Value */}
            <div className="flex items-center justify-between gap-2 text-xs mb-1.5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  [{rankStr}]
                </span>
                <span className={`font-bold truncate text-xs group-hover:text-amber-500 transition-colors ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {node.title}
                </span>
                <span className={`text-[9px] px-1 py-0.2 border uppercase font-bold shrink-0 ${chainColor}`}>
                  {node.chain}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ${Math.round(node.valueUsd).toLocaleString()}
                </span>
                <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  ({sharePct.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Bottom row: Bar Track with Fill & PnL tag */}
            <div className="flex items-center gap-3">
              {/* Progress Track */}
              <div className={`relative flex-1 h-2 border ${isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-black/40 border-white/10'}`}>
                <div
                  className={`h-full transition-all duration-700 ease-out ${
                    isCritical
                      ? 'bg-rose-500'
                      : isSafe
                      ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${relativeBarPct}%` }}
                />
              </div>

              {/* Quick Status / 24h PnL badge */}
              {node.pnl24hUsd !== undefined ? (
                <span
                  className={`text-[9px] font-bold shrink-0 ${
                    node.pnl24hUsd >= 0
                      ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                      : isLight ? 'text-rose-700' : 'text-rose-400'
                  }`}
                >
                  {node.pnl24hUsd >= 0 ? '+' : ''}${Math.round(node.pnl24hUsd).toLocaleString()}
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 shrink-0">
                  {node.app}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
