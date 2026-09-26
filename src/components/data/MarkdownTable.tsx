import React, { useMemo, useState } from 'react';
import { CanvasNode, PositionExitRoute, RiskLevel } from '../../types';
import { Sparkline } from './Sparkline';
import { deriveNodeSparkline } from './series';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Orbit, Eye, AlertOctagon } from 'lucide-react';

export interface MarkdownTableProps {
  nodes: CanvasNode[];
  isLight?: boolean;
  onInspectNode: (node: CanvasNode) => void;
  onFocusNodeOnCanvas: (node: CanvasNode) => void;
  onEmergencyKill: (node: CanvasNode, route: PositionExitRoute) => void;
  className?: string;
}

type SortField = 'index' | 'title' | 'chain' | 'value' | 'pnl' | 'apy' | 'risk';
type SortDirection = 'asc' | 'desc';

const RISK_WEIGHT: Record<RiskLevel, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  safe: 1,
};

export const MarkdownTable: React.FC<MarkdownTableProps> = ({
  nodes,
  isLight = false,
  onInspectNode,
  onFocusNodeOnCanvas,
  onEmergencyKill,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (chainFilter !== 'all' && node.chain.toLowerCase() !== chainFilter.toLowerCase()) {
        return false;
      }
      if (riskFilter !== 'all' && node.riskLevel !== riskFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = node.title.toLowerCase().includes(q);
        const matchesApp = node.app.toLowerCase().includes(q);
        const matchesChain = node.chain.toLowerCase().includes(q);
        const matchesCategory = node.category.toLowerCase().includes(q);
        const matchesStrategy = Boolean(node.strategy?.toLowerCase().includes(q));
        const matchesNansen = Boolean(node.nansenLabel?.toLowerCase().includes(q));
        if (!matchesTitle && !matchesApp && !matchesChain && !matchesCategory && !matchesStrategy && !matchesNansen) {
          return false;
        }
      }
      return true;
    });
  }, [nodes, chainFilter, riskFilter, searchQuery]);

  // Sort nodes
  const sortedNodes = useMemo(() => {
    return [...filteredNodes].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'chain':
          comparison = a.chain.localeCompare(b.chain);
          break;
        case 'value':
          comparison = (a.valueUsd || 0) - (b.valueUsd || 0);
          break;
        case 'pnl':
          comparison = (a.pnl24hUsd || 0) - (b.pnl24hUsd || 0);
          break;
        case 'apy':
          comparison = (a.apy || 0) - (b.apy || 0);
          break;
        case 'risk':
          comparison = RISK_WEIGHT[a.riskLevel] - RISK_WEIGHT[b.riskLevel];
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredNodes, sortField, sortDirection]);

  // Precompute sparklines deterministically into a Record
  const sparklineMap = useMemo(() => {
    const record: Record<string, number[]> = {};
    for (const n of nodes) {
      record[n.id] = deriveNodeSparkline(n, 16);
    }
    return record;
  }, [nodes]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'title' || field === 'chain' ? 'asc' : 'desc');
    }
  };

  // Calculations for summary footer
  const totalValue = sortedNodes.reduce((sum, n) => sum + (n.valueUsd || 0), 0);
  const totalPnl = sortedNodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0);
  const criticalCount = sortedNodes.filter((n) => n.riskLevel === 'critical').length;

  // Visual styling classes
  const borderDash = isLight ? 'border-slate-300' : 'border-white/10';
  const pipeColor = isLight ? 'text-slate-400' : 'text-slate-600';
  const mdSyntaxColor = isLight ? 'text-slate-500' : 'text-slate-500';

  return (
    <div className={`w-full flex flex-col font-mono text-xs select-none ${className}`}>
      {/* Top Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-dashed border-inherit">
        {/* Monospace Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="filter positions: 'kamino', 'arbitrum', 'safe', 'perp'..."
            className={`w-full pl-8 pr-3 py-1.5 text-xs font-mono border rounded-none outline-none transition-colors ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-amber-500 focus:bg-white'
                : 'bg-black/40 border-white/15 text-slate-100 placeholder:text-slate-500 focus:border-amber-500/70 focus:bg-black/60'
            }`}
          />
        </div>

        {/* Chain Filters */}
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto py-0.5">
          <span className={`text-[10px] uppercase font-bold mr-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            CHAIN:
          </span>
          {['all', 'Solana', 'Ethereum', 'Arbitrum', 'Hyperliquid', 'Berachain'].map((chain) => (
            <button
              key={chain}
              onClick={() => setChainFilter(chain)}
              className={`px-2 py-0.5 border text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                chainFilter === chain
                  ? isLight
                    ? 'bg-amber-500 text-black border-amber-600 font-extrabold'
                    : 'bg-amber-500 text-black border-amber-400 font-extrabold'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>

        {/* Risk Filters */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className={`text-[10px] uppercase font-bold mr-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            RISK:
          </span>
          {['all', 'safe', 'medium', 'high', 'critical'].map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskFilter(risk)}
              className={`px-2 py-0.5 border text-[10px] uppercase font-bold transition-colors cursor-pointer ${
                riskFilter === risk
                  ? risk === 'critical'
                    ? 'bg-rose-500 text-white border-rose-600 font-extrabold'
                    : isLight
                      ? 'bg-amber-500 text-black border-amber-600 font-extrabold'
                      : 'bg-amber-500 text-black border-amber-400 font-extrabold'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Markdown Monospace Table */}
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse font-mono text-xs min-w-[900px]">
          {/* Table Header with Markdown Pipes */}
          <thead>
            <tr className={`border-b ${borderDash} text-[11px] uppercase tracking-wider ${isLight ? 'bg-slate-100/90 text-slate-800' : 'bg-white/[0.04] text-slate-300'}`}>
              <th className="py-2.5 px-2 text-center w-12 font-bold cursor-pointer" onClick={() => handleSort('index')}>
                <span className={pipeColor}>|</span> #
              </th>
              <th className="py-2.5 px-3 font-bold cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('title')}>
                <span className={pipeColor}>|</span> POSITION / ASSET{' '}
                {sortField === 'title' ? (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500 inline-block ml-0.5" /> : <ArrowDown className="w-3 h-3 text-amber-500 inline-block ml-0.5" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-30 inline-block ml-0.5" />
                )}
              </th>
              <th className="py-2.5 px-3 font-bold cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('chain')}>
                <span className={pipeColor}>|</span> CHAIN / PROTOCOL{' '}
                {sortField === 'chain' ? (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500 inline-block ml-0.5" /> : <ArrowDown className="w-3 h-3 text-amber-500 inline-block ml-0.5" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-30 inline-block ml-0.5" />
                )}
              </th>
              <th className="py-2.5 px-3 text-right font-bold cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('value')}>
                <span className={pipeColor}>|</span> VALUE ($){' '}
                {sortField === 'value' ? (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500 inline-block ml-0.5" /> : <ArrowDown className="w-3 h-3 text-amber-500 inline-block ml-0.5" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-30 inline-block ml-0.5" />
                )}
              </th>
              <th className="py-2.5 px-2 text-center font-bold">
                <span className={pipeColor}>|</span> 24H TREND
              </th>
              <th className="py-2.5 px-3 text-right font-bold cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('pnl')}>
                <span className={pipeColor}>|</span> 24H PNL{' '}
                {sortField === 'pnl' ? (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500 inline-block ml-0.5" /> : <ArrowDown className="w-3 h-3 text-amber-500 inline-block ml-0.5" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-30 inline-block ml-0.5" />
                )}
              </th>
              <th className="py-2.5 px-3 text-right font-bold cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('apy')}>
                <span className={pipeColor}>|</span> APY / HF{' '}
                {sortField === 'apy' ? (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500 inline-block ml-0.5" /> : <ArrowDown className="w-3 h-3 text-amber-500 inline-block ml-0.5" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-30 inline-block ml-0.5" />
                )}
              </th>
              <th className="py-2.5 px-3 text-center font-bold cursor-pointer hover:text-amber-500 transition-colors" onClick={() => handleSort('risk')}>
                <span className={pipeColor}>|</span> RISK{' '}
                {sortField === 'risk' ? (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500 inline-block ml-0.5" /> : <ArrowDown className="w-3 h-3 text-amber-500 inline-block ml-0.5" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-30 inline-block ml-0.5" />
                )}
              </th>
              <th className="py-2.5 px-3 text-right font-bold">
                <span className={pipeColor}>|</span> ACTIONS <span className={pipeColor}>|</span>
              </th>
            </tr>

            {/* Markdown Divider Row `|:---|:---|---:|...|` */}
            <tr className={`border-b ${borderDash} text-[9px] select-none ${mdSyntaxColor}`}>
              <td className="py-1 px-2 text-center">|:--|</td>
              <td className="py-1 px-3">|:--------------------------------|</td>
              <td className="py-1 px-3">|:-------------------|</td>
              <td className="py-1 px-3 text-right">|-------------------:|</td>
              <td className="py-1 px-2 text-center">|:----------------:|</td>
              <td className="py-1 px-3 text-right">|-------------------:|</td>
              <td className="py-1 px-3 text-right">|-------------------:|</td>
              <td className="py-1 px-3 text-center">|:--------:|</td>
              <td className="py-1 px-3 text-right">|:-----------------:|</td>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-white/5'}`}>
            {sortedNodes.length === 0 ? (
              <tr>
                <td colSpan={9} className={`py-12 text-center font-mono text-xs ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                  | NO MATCHING ONCHAIN POSITIONS LOCATED |
                </td>
              </tr>
            ) : (
              sortedNodes.map((node, i) => {
                const isCritical = node.riskLevel === 'critical';
                const isHigh = node.riskLevel === 'high';
                const isMedium = node.riskLevel === 'medium';
                const sparkData = sparklineMap[node.id] || [node.valueUsd];

                const emergencyRoute: PositionExitRoute = node.exitRoutes?.[0] || {
                  targetAsset: 'USDC',
                  estReturn: `$${Math.round(node.valueUsd * 0.985).toLocaleString()}`,
                  fee: '0.15%',
                  timeSeconds: 4,
                  routeSummary: `Emergency flash kill for ${node.title} into USDC`,
                };

                return (
                  <tr
                    key={node.id}
                    onClick={() => onInspectNode(node)}
                    className={`transition-colors cursor-pointer group ${
                      isCritical
                        ? isLight
                          ? 'bg-rose-50/80 hover:bg-rose-100/90'
                          : 'bg-rose-950/20 hover:bg-rose-900/30'
                        : isHigh
                          ? isLight
                            ? 'bg-amber-50/40 hover:bg-amber-100/60'
                            : 'bg-amber-950/10 hover:bg-amber-900/20'
                          : isLight
                            ? 'hover:bg-slate-100/80'
                            : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Index */}
                    <td className={`py-3 px-2 text-center text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span className={pipeColor}>|</span> {String(i + 1).padStart(2, '0')}
                    </td>

                    {/* Position Name / Strategy */}
                    <td className="py-3 px-3 min-w-[200px]">
                      <div className="flex items-center gap-1.5">
                        <span className={pipeColor}>|</span>
                        <div className="flex flex-col min-w-0">
                          <span className={`font-extrabold truncate group-hover:text-amber-500 transition-colors ${
                            isLight ? 'text-slate-900' : 'text-white'
                          }`}>
                            {node.title}
                          </span>
                          <span className={`text-[10px] truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                            {node.strategy || node.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Chain & Protocol */}
                    <td className="py-3 px-3 min-w-[140px]">
                      <div className="flex items-center gap-1.5">
                        <span className={pipeColor}>|</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 border text-[9px] uppercase font-extrabold ${
                              node.chain === 'Solana'
                                ? isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-950/50 text-purple-300 border-purple-500/30'
                                : node.chain === 'Arbitrum'
                                ? isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30'
                                : node.chain === 'Hyperliquid'
                                ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                                : isLight ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-blue-950/50 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {node.chain}
                          </span>
                          <span className={`text-[11px] font-semibold truncate ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            {node.app}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={pipeColor}>|</span>
                        <span className={`font-extrabold text-xs sm:text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          ${Math.round(node.valueUsd).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Sparkline */}
                    <td className="py-3 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={pipeColor}>|</span>
                        <Sparkline
                          data={sparkData}
                          width={85}
                          height={20}
                          color={node.pnl24hUsd && node.pnl24hUsd < 0 ? 'rose' : 'emerald'}
                          isLight={isLight}
                        />
                      </div>
                    </td>

                    {/* 24h PnL */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={pipeColor}>|</span>
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-bold ${
                              (node.pnl24hUsd || 0) >= 0
                                ? isLight ? 'text-emerald-700 font-extrabold' : 'text-emerald-400 font-extrabold'
                                : isLight ? 'text-rose-700 font-extrabold' : 'text-rose-400 font-extrabold'
                            }`}
                          >
                            {(node.pnl24hUsd || 0) >= 0 ? '+' : ''}${Math.round(Math.abs(node.pnl24hUsd || 0)).toLocaleString()}
                          </span>
                          {node.pnlPercent !== undefined && (
                            <span
                              className={`text-[10px] ${
                                node.pnlPercent >= 0
                                  ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                                  : isLight ? 'text-rose-700' : 'text-rose-400'
                              }`}
                            >
                              {node.pnlPercent >= 0 ? '+' : ''}{node.pnlPercent.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* APY / Health Factor */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={pipeColor}>|</span>
                        <div className="flex flex-col items-end">
                          {node.apy !== undefined ? (
                            <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                              {node.apy}% APY
                            </span>
                          ) : (
                            <span className="text-slate-500">--</span>
                          )}
                          {node.healthFactor !== undefined && (
                            <span
                              className={`text-[10px] font-bold ${
                                node.healthFactor < 1.15
                                  ? isLight ? 'text-rose-700' : 'text-rose-400'
                                  : node.healthFactor < 1.4
                                    ? isLight ? 'text-amber-700' : 'text-amber-400'
                                    : isLight ? 'text-slate-600' : 'text-slate-400'
                              }`}
                            >
                              HF: {node.healthFactor.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={pipeColor}>|</span>
                        <span
                          className={`px-2 py-0.5 border text-[10px] uppercase font-bold tracking-wider ${
                            isCritical
                              ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                              : isHigh
                                ? isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                : isMedium
                                  ? isLight ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-yellow-950/50 text-yellow-300 border-yellow-500/30'
                                  : isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          [{node.riskLevel}]
                        </span>
                      </div>
                    </td>

                    {/* Row Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={pipeColor}>|</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onInspectNode(node);
                            }}
                            title="Inspect Node Details"
                            className={`px-1.5 py-1 border text-[10px] uppercase font-bold flex items-center gap-1 transition-colors ${
                              isLight
                                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                            }`}
                          >
                            <Eye className="w-3 h-3" />
                            <span className="hidden sm:inline">INSPECT</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFocusNodeOnCanvas(node);
                            }}
                            title="Glide to Position on Spatial Canvas"
                            className={`px-1.5 py-1 border text-[10px] uppercase font-bold flex items-center gap-1 transition-colors ${
                              isLight
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            <Orbit className="w-3 h-3" />
                            <span className="hidden sm:inline">CANVAS</span>
                          </button>

                          {isCritical && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEmergencyKill(node, emergencyRoute);
                              }}
                              title="Trigger Instant Emergency Kill Switch"
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-extrabold border border-rose-400 text-[10px] uppercase flex items-center gap-1 shadow-sm transition-all"
                            >
                              <AlertOctagon className="w-3 h-3" />
                              <span>KILL</span>
                            </button>
                          )}
                        </div>
                        <span className={pipeColor}>|</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          <tfoot>
            <tr className={`border-t-2 ${borderDash} text-[11px] font-bold ${isLight ? 'bg-slate-100/90 text-slate-800' : 'bg-white/[0.04] text-slate-300'}`}>
              <td className="py-2.5 px-2 text-center">
                <span className={pipeColor}>|</span> Σ
              </td>
              <td className="py-2.5 px-3">
                <span className={pipeColor}>|</span> {sortedNodes.length} POSITIONS
              </td>
              <td className="py-2.5 px-3">
                <span className={pipeColor}>|</span> --
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className={pipeColor}>|</span> ${Math.round(totalValue).toLocaleString()}
              </td>
              <td className="py-2.5 px-2 text-center">
                <span className={pipeColor}>|</span> --
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className={pipeColor}>|</span>
                <span className={totalPnl >= 0 ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-rose-700' : 'text-rose-400')}>
                  {totalPnl >= 0 ? '+' : ''}${Math.round(totalPnl).toLocaleString()}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className={pipeColor}>|</span> --
              </td>
              <td className="py-2.5 px-3 text-center">
                <span className={pipeColor}>|</span>
                {criticalCount > 0 ? (
                  <span className="text-rose-500 font-extrabold">[{criticalCount} CRIT]</span>
                ) : (
                  <span className="text-emerald-500">[ALL CLEAR]</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right">
                <span className={pipeColor}>|</span> -- <span className={pipeColor}>|</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
