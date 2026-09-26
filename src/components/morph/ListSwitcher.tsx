import React, { useState } from 'react';
import { CanvasNode, PositionExitRoute, LensConfig } from '../../types';
import { NumberFlip } from './NumberFlip';
import { MorphTabs } from './MorphTabs';
import { 
  Orbit, 
  Search, 
  ChevronRight
} from 'lucide-react';

export type PortfolioViewMode = 'canvas' | 'list' | 'exposure-grid';

interface ListSwitcherProps {
  nodes: CanvasNode[];
  viewMode: PortfolioViewMode;
  config?: LensConfig;
  onChangeViewMode: (mode: PortfolioViewMode) => void;
  onFocusNodeOnCanvas: (node: CanvasNode) => void;
  onInspectNode: (node: CanvasNode) => void;
  onEmergencyKill: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const ListSwitcher: React.FC<ListSwitcherProps> = ({
  nodes,
  viewMode,
  config,
  onChangeViewMode,
  onFocusNodeOnCanvas,
  onInspectNode,
  onEmergencyKill
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'apy' | 'health' | 'pnl'>('value');
  const isLight = config?.themeMode === 'light';

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
    { id: 'solana', label: 'Solana', badge: nodes.filter(n => n.chain === 'Solana').length },
    { id: 'arbitrum', label: 'Arbitrum', badge: nodes.filter(n => n.chain === 'Arbitrum').length },
    { id: 'ethereum', label: 'Ethereum', badge: nodes.filter(n => n.chain === 'Ethereum').length },
    { id: 'hyperliquid', label: 'Hyperliquid', badge: nodes.filter(n => n.chain === 'Hyperliquid').length }
  ];

  const riskTabs = [
    { id: 'all', label: 'All Risks' },
    { id: 'safe', label: 'Safe Tier' },
    { id: 'medium', label: 'Moderate' },
    { id: 'critical', label: 'Critical Alert', badge: nodes.filter(n => n.riskLevel === 'critical').length || undefined }
  ];

  return (
    <div className={`absolute inset-0 z-30 pt-[78px] sm:pt-[84px] md:pt-[92px] px-3 sm:px-4 md:px-8 pb-8 overflow-y-auto backdrop-blur-2xl flex flex-col items-center animate-morph-rise select-none transition-colors duration-200 ${
      isLight ? 'bg-slate-50/95 text-slate-900' : 'bg-[#07090e]/95 text-slate-200'
    }`}>
      <div className="w-full max-w-6xl flex flex-col gap-5">
        {/* Workspace Control Bar */}
        <div className={`glass-panel p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-2xl ${
          isLight ? 'bg-white border-slate-300 shadow-md' : 'border-white/10'
        }`}>
          {/* Quick Search (Expanded Full-Width) */}
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative w-full">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets, vaults, protocols, smart money signals, perps..."
                className={`w-full border rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono outline-none transition-colors ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-500 focus:bg-white focus:border-amber-500 font-semibold' 
                    : 'bg-slate-900/90 border-white/10 text-white placeholder:text-slate-500 focus:border-amber-500/60'
                }`}
              />
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[11px] font-extrabold uppercase font-mono hidden sm:inline ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`border rounded-xl px-3 py-2.5 text-xs font-mono font-bold outline-none transition-colors cursor-pointer ${
                isLight 
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-amber-500' 
                  : 'bg-slate-900 border-white/10 text-white focus:border-amber-500'
              }`}
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
            isLight={isLight}
          />

          <MorphTabs
            tabs={riskTabs}
            activeTab={riskFilter}
            onChange={setRiskFilter}
            isLight={isLight}
          />
        </div>

        {/* Compact List / Table View */}
        <div className={`glass-panel rounded-2xl border overflow-hidden shadow-2xl ${
          isLight ? 'bg-white border-slate-300 shadow-md' : 'border-white/10'
        }`}>
          <div className={`grid grid-cols-12 gap-2 p-3.5 border-b text-[11px] font-mono font-extrabold uppercase tracking-wider ${
            isLight ? 'bg-slate-100/95 border-slate-200 text-slate-700' : 'bg-slate-950/90 border-white/10 text-slate-400'
          }`}>
            <div className="col-span-4">Asset / Position Name</div>
            <div className="col-span-2">Chain &bull; Protocol</div>
            <div className="col-span-2 text-right">Value ($)</div>
            <div className="col-span-2 text-right">APY / Health</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className={`flex flex-col font-mono text-xs ${isLight ? 'divide-y divide-slate-200' : 'divide-y divide-white/5'}`}>
            {sortedNodes.map((node) => {
              const isCritical = node.riskLevel === 'critical';
              return (
                <div
                  key={node.id}
                  onClick={() => onInspectNode(node)}
                  className={`grid grid-cols-12 gap-2 p-3.5 items-center cursor-pointer transition-colors ${
                    isCritical 
                      ? (isLight ? 'bg-rose-50 hover:bg-rose-100/70' : 'bg-rose-950/20 hover:bg-rose-900/30') 
                      : (isLight ? 'hover:bg-slate-100/80' : 'hover:bg-slate-800/60')
                  }`}
                >
                  {/* Col 1 */}
                  <div className="col-span-4 flex items-center gap-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className={`font-extrabold truncate hover:text-amber-500 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {node.title}
                      </span>
                      <span className={`text-[10px] truncate ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                        {node.strategy || node.category}
                      </span>
                    </div>
                  </div>

                  {/* Col 2 */}
                  <div className="col-span-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      isLight ? 'bg-slate-200 text-slate-800 border border-slate-300' : 'bg-white/10 text-slate-300'
                    }`}>
                      {node.chain}
                    </span>
                    <span className={`text-xs ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
                      {node.app}
                    </span>
                  </div>

                  {/* Col 3 */}
                  <div className="col-span-2 text-right">
                    <div className={`font-extrabold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      ${node.valueUsd.toLocaleString()}
                    </div>
                    {node.pnl24hUsd !== undefined && (
                      <div className={`text-[10px] font-bold ${
                        node.pnl24hUsd >= 0 
                          ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                          : (isLight ? 'text-rose-700' : 'text-rose-400')
                      }`}>
                        {node.pnl24hUsd >= 0 ? '+' : ''}${Math.abs(node.pnl24hUsd).toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Col 4 */}
                  <div className="col-span-2 text-right">
                    {node.apy !== undefined && (
                      <div className={`font-extrabold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        {node.apy}% APY
                      </div>
                    )}
                    {node.healthFactor !== undefined && (
                      <div className={`text-[10px] font-extrabold ${
                        node.healthFactor < 1.15 
                          ? (isLight ? 'text-rose-700' : 'text-rose-400') 
                          : (isLight ? 'text-amber-700' : 'text-amber-400')
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
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLight 
                          ? 'bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 border-slate-300' 
                          : 'bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10'
                      }`}
                      title="Focus on Spatial Canvas"
                    >
                      <Orbit className="w-3.5 h-3.5" />
                    </button>

                    <ChevronRight className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
