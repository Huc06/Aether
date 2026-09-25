import React, { useState } from 'react';
import { CanvasNode, PositionExitRoute } from '../../types';
import { NumberFlip } from './NumberFlip';
import { MorphTabs } from './MorphTabs';
import { 
  LayoutGrid, 
  List as ListIcon, 
  Orbit, 
  Camera,
  Search, 
  ArrowUpRight, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Flame,
  Activity
} from 'lucide-react';

export type PortfolioViewMode = 'canvas' | 'cards' | 'list' | 'exposure-grid';

interface ListSwitcherProps {
  nodes: CanvasNode[];
  viewMode: PortfolioViewMode;
  onChangeViewMode: (mode: PortfolioViewMode) => void;
  onFocusNodeOnCanvas: (node: CanvasNode) => void;
  onInspectNode: (node: CanvasNode) => void;
  onEmergencyKill: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const ListSwitcher: React.FC<ListSwitcherProps> = ({
  nodes,
  viewMode,
  onChangeViewMode,
  onFocusNodeOnCanvas,
  onInspectNode,
  onEmergencyKill
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'apy' | 'health' | 'pnl'>('value');

  // Filter logic
  const filteredNodes = nodes.filter(node => {
    // Chain filter
    if (chainFilter !== 'all' && node.chain.toLowerCase() !== chainFilter.toLowerCase()) {
      return false;
    }
    // Risk filter
    if (riskFilter !== 'all' && node.riskLevel !== riskFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        node.title.toLowerCase().includes(q) ||
        node.app.toLowerCase().includes(q) ||
        node.chain.toLowerCase().includes(q) ||
        node.category.toLowerCase().includes(q) ||
        (node.strategy && node.strategy.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sort logic
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    if (sortBy === 'value') return b.valueUsd - a.valueUsd;
    if (sortBy === 'apy') return (b.apy || 0) - (a.apy || 0);
    if (sortBy === 'health') return (a.healthFactor || 99) - (b.healthFactor || 99);
    if (sortBy === 'pnl') return (b.pnl24hUsd || 0) - (a.pnl24hUsd || 0);
    return 0;
  });

  const chainTabs = [
    { id: 'all', label: 'All Chains', badge: nodes.length },
    { id: 'solana', label: 'Solana', icon: '👻', badge: nodes.filter(n => n.chain === 'Solana').length },
    { id: 'arbitrum', label: 'Arbitrum', icon: '🦊', badge: nodes.filter(n => n.chain === 'Arbitrum').length },
    { id: 'ethereum', label: 'Ethereum', icon: '🛡️', badge: nodes.filter(n => n.chain === 'Ethereum').length },
    { id: 'hyperliquid', label: 'Hyperliquid', icon: '⚡', badge: nodes.filter(n => n.chain === 'Hyperliquid').length }
  ];

  const riskTabs = [
    { id: 'all', label: 'All Risks' },
    { id: 'safe', label: 'Safe Tier', icon: '🟢' },
    { id: 'medium', label: 'Moderate', icon: '🟡' },
    { id: 'critical', label: 'Critical Alert', icon: '🔴', badge: nodes.filter(n => n.riskLevel === 'critical').length || undefined }
  ];

  return (
    <div className="absolute inset-0 z-30 pt-20 px-4 md:px-8 pb-8 overflow-y-auto bg-[#07090e]/95 backdrop-blur-2xl flex flex-col items-center animate-morph-rise select-none">
      <div className="w-full max-w-6xl flex flex-col gap-5">
        {/* Workspace Control Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
          {/* View Mode Switcher Pills */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-xl bg-black/60 border border-white/10">
              <button
                onClick={() => onChangeViewMode('canvas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'canvas' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Spatial Infinite Canvas View"
              >
                <Orbit className="w-3.5 h-3.5" />
                <span>Spatial Canvas</span>
              </button>

              <button
                onClick={() => onChangeViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'cards' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Morphing Cards Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards Grid</span>
              </button>

              <button
                onClick={() => onChangeViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'list' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Dense List / Table View"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Compact List</span>
              </button>

              <button
                onClick={() => onChangeViewMode('exposure-grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'exposure-grid' ? 'bg-rose-500 text-white shadow shadow-rose-500/30' : 'text-slate-400 hover:text-white'
                }`}
                title="CCTV Surveillance Exposure Grid"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>CCTV Feed</span>
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-2 flex-1 max-w-md min-w-[220px]">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter assets, vaults, protocols, perps..."
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 font-mono outline-none focus:border-amber-500/60"
              />
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono hidden sm:inline">
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-amber-500"
            >
              <option value="value">Highest Value ($)</option>
              <option value="apy">Highest APY (%)</option>
              <option value="health">Lowest Health Factor (Risk First)</option>
              <option value="pnl">24h Net PnL</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs Bar (Chain + Risk) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MorphTabs
            tabs={chainTabs}
            activeTab={chainFilter}
            onChange={setChainFilter}
          />

          <MorphTabs
            tabs={riskTabs}
            activeTab={riskFilter}
            onChange={setRiskFilter}
          />
        </div>

        {/* Morphing Cards Grid View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedNodes.map((node) => {
              const isCritical = node.riskLevel === 'critical';
              const isHigh = node.riskLevel === 'high';
              const isSafe = node.riskLevel === 'safe';

              return (
                <div
                  key={node.id}
                  onClick={() => onInspectNode(node)}
                  className={`morph-card rounded-2xl border p-4 flex flex-col justify-between gap-3 cursor-pointer shadow-xl relative overflow-hidden group ${
                    isCritical
                      ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400 shadow-rose-500/10'
                      : isHigh
                      ? 'bg-amber-950/20 border-orange-500/40 hover:border-orange-400'
                      : 'bg-slate-900/60 border-white/10 hover:border-amber-500/50'
                  }`}
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 rounded-xl bg-black/40 border border-white/10">
                        {node.icon}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                          {node.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                          <span>{node.app}</span>
                          <span>&bull;</span>
                          <span className="text-amber-400 font-semibold">{node.chain}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border font-mono ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : isHigh
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {node.riskLevel}
                    </span>
                  </div>

                  {/* Metrics Block */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Value</span>
                      <div className="font-extrabold text-sm text-white mt-0.5">
                        <NumberFlip value={node.valueUsd} prefix="$" />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">24h Net PnL</span>
                      {node.pnl24hUsd !== undefined ? (
                        <div className={`font-bold text-xs mt-0.5 ${node.pnl24hUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {node.pnl24hUsd >= 0 ? '+' : ''}${Math.abs(node.pnl24hUsd).toLocaleString()}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-0.5">N/A</div>
                      )}
                    </div>

                    {node.apy !== undefined && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Yield (APY)</span>
                        <div className="font-bold text-xs text-emerald-400 mt-0.5">
                          {node.apy}%
                        </div>
                      </div>
                    )}

                    {node.healthFactor !== undefined && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Health Factor</span>
                        <div className={`font-bold text-xs mt-0.5 ${
                          node.healthFactor < 1.15 ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          {node.healthFactor.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Strategy Summary */}
                  {node.strategy && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
                      {node.strategy}
                    </p>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5 font-mono text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFocusNodeOnCanvas(node);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/40 border border-white/10 text-slate-300 hover:text-amber-300 flex items-center gap-1.5 transition-all"
                    >
                      <Orbit className="w-3.5 h-3.5" />
                      <span>Glide on Canvas</span>
                    </button>

                    {isCritical && node.exitRoutes && node.exitRoutes.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEmergencyKill(node, node.exitRoutes![0]);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold flex items-center gap-1 shadow-lg shadow-rose-600/30 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Kill Switch</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Compact List / Table View */}
        {viewMode === 'list' && (
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-950/90 border-b border-white/10 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Asset / Position Name</div>
              <div className="col-span-2">Chain &bull; Protocol</div>
              <div className="col-span-2 text-right">Value ($)</div>
              <div className="col-span-2 text-right">APY / Health</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="flex flex-col divide-y divide-white/5 font-mono text-xs">
              {sortedNodes.map((node) => {
                const isCritical = node.riskLevel === 'critical';
                return (
                  <div
                    key={node.id}
                    onClick={() => onInspectNode(node)}
                    className={`grid grid-cols-12 gap-2 p-3.5 items-center hover:bg-slate-800/60 cursor-pointer transition-colors ${
                      isCritical ? 'bg-rose-950/15' : ''
                    }`}
                  >
                    {/* Col 1 */}
                    <div className="col-span-4 flex items-center gap-3">
                      <span className="text-xl">{node.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-white truncate hover:text-amber-300">
                          {node.title}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {node.strategy || node.category}
                        </span>
                      </div>
                    </div>

                    {/* Col 2 */}
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-slate-300 text-[10px] font-bold">
                        {node.chain}
                      </span>
                      <span className="text-slate-400 text-xs">{node.app}</span>
                    </div>

                    {/* Col 3 */}
                    <div className="col-span-2 text-right">
                      <div className="font-bold text-white">${node.valueUsd.toLocaleString()}</div>
                      {node.pnl24hUsd !== undefined && (
                        <div className={`text-[10px] font-semibold ${
                          node.pnl24hUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {node.pnl24hUsd >= 0 ? '+' : ''}${Math.abs(node.pnl24hUsd).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Col 4 */}
                    <div className="col-span-2 text-right">
                      {node.apy !== undefined && (
                        <div className="text-emerald-400 font-bold">{node.apy}% APY</div>
                      )}
                      {node.healthFactor !== undefined && (
                        <div className={`text-[10px] font-bold ${
                          node.healthFactor < 1.15 ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          HF: {node.healthFactor.toFixed(2)}
                        </div>
                      )}
                    </div>

                    {/* Col 5 */}
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onFocusNodeOnCanvas(node);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10"
                        title="Focus on Spatial Canvas"
                      >
                        <Orbit className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
