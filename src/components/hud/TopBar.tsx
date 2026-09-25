import React from 'react';
import { LensConfig, CanvasNode } from '../../types';
import { PortfolioViewMode } from '../morph/ListSwitcher';
import { NumberFlip } from '../morph/NumberFlip';
import { 
  LayoutGrid, 
  Sliders, 
  HelpCircle, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Search, 
  PlusCircle, 
  Orbit, 
  List as ListIcon 
} from 'lucide-react';

interface TopBarProps {
  config: LensConfig;
  nodes: CanvasNode[];
  isOverview: boolean;
  viewMode: PortfolioViewMode;
  onChangeViewMode: (mode: PortfolioViewMode) => void;
  onToggleOverview: () => void;
  onSmartArrange: () => void;
  onOpenSpawn: () => void;
  onOpenTuner: () => void;
  onOpenHelp: () => void;
  onFilterRisk: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  config,
  nodes,
  isOverview,
  viewMode,
  onChangeViewMode,
  onToggleOverview,
  onSmartArrange,
  onOpenSpawn,
  onOpenTuner,
  onOpenHelp,
  onFilterRisk
}) => {
  // Aggregate portfolio metrics
  const totalValue = nodes.reduce((sum, n) => sum + n.valueUsd, 0);
  const totalPnl = nodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0);
  const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
  const criticalCount = nodes.filter(n => n.riskLevel === 'critical' || n.riskLevel === 'high').length;

  return (
    <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none select-none">
      {/* Brand & Aggregate Metrics HUD */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="glass-badge rounded-lg px-4 py-2 flex items-center gap-3 shadow-lg border border-white/10">
          <div 
            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
            style={{ 
              backgroundColor: config.accent,
              boxShadow: `0 0 10px ${config.accent}` 
            }}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-wider text-white">AETHER</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                SPATIAL DEFI
              </span>
            </div>
            <span className="text-[10px] text-slate-400 tracking-wider">
              PORTFOLIO &amp; EXECUTION LAYER
            </span>
          </div>
        </div>

        {/* Global Net PnL & Exposure Card with NumberFlip */}
        <div className="glass-badge rounded-lg px-4 py-2 hidden lg:flex items-center gap-5 border border-white/10 shadow-lg text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3 text-slate-400" />
              Total Exposure
            </div>
            <div className="font-bold text-sm text-white tracking-tight">
              <NumberFlip value={totalValue} prefix="$" />
            </div>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              24h Net PnL
            </div>
            <div className={`font-bold text-sm tracking-tight ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <NumberFlip 
                value={Math.abs(totalPnl)} 
                prefix={totalPnl >= 0 ? '+$' : '-$'} 
              /> ({totalPnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
            </div>
          </div>

          <div className="w-[1px] h-6 bg-white/10" />

          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Net Health Factor
            </div>
            <div className="font-bold text-sm text-amber-400 tracking-tight flex items-center gap-1">
              2.18 <span className="text-[10px] text-slate-400 font-normal">[SAFE]</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls & Layout Switcher */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Layout View Switcher */}
        <div className="glass-badge rounded-lg p-1 hidden sm:flex items-center gap-1 border border-white/10">
          <button
            onClick={() => onChangeViewMode('canvas')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'canvas' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Spatial Canvas (Infinite Plane)"
          >
            <Orbit className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Canvas</span>
          </button>

          <button
            onClick={() => onChangeViewMode('cards')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'cards' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Morphing Cards Grid"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cards</span>
          </button>

          <button
            onClick={() => onChangeViewMode('list')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
              viewMode === 'list' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Dense List View"
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">List</span>
          </button>
        </div>

        {criticalCount > 0 && (
          <button
            onClick={onFilterRisk}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-400 text-xs font-semibold shadow-lg transition-all animate-pulse"
            title="Highlight high-risk & near liquidation positions"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{criticalCount} ALERT</span>
          </button>
        )}

        <button
          onClick={onToggleOverview}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all shadow-lg ${
            isOverview 
              ? 'bg-amber-500/25 border-amber-500 text-amber-400 shadow-amber-500/20'
              : 'glass-badge border-white/10 text-slate-200 hover:border-amber-500/60 hover:text-white'
          }`}
          title="Toggle Intent Search & Macro Overview (SUPER+CTRL+G / Cmd+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Intent &amp; Search</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-amber-400 border border-white/10 font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onOpenSpawn}
          className="glass-badge flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:text-white hover:border-amber-500/60 border border-white/10 shadow-lg transition-all"
          title="Spawn a new interactive window / DeFi position (N / +)"
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">New Window</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-amber-400 border border-white/10 font-mono">
            N
          </kbd>
        </button>

        <button
          onClick={onSmartArrange}
          className="glass-badge flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:border-white/30 border border-white/10 shadow-lg transition-all"
          title="Smart arrange nodes by chain clusters (Ctrl+A)"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Arrange</span>
          <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-white/10 font-mono">
            ^A
          </kbd>
        </button>

        <button
          onClick={onOpenTuner}
          className="glass-badge flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:border-white/30 border border-white/10 shadow-lg transition-all"
          title="Live Lens & CRT Shader Tuner (Ctrl+,)"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lens</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="glass-badge flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white border border-white/10 shadow-lg transition-all"
          title="Keyboard shortcuts & help (F1)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
