import React from 'react';
import { LensConfig, CanvasNode } from '../../types';
import { PortfolioViewMode } from '../morph/ListSwitcher';
import { NumberFlip } from '../morph/NumberFlip';
import { getApiCallCount } from '../../services/nansenApi';
import { 
  LayoutGrid, 
  Sliders, 
  HelpCircle, 
  ShieldAlert, 
  TrendingUp, 
  Activity, 
  Search, 
  Orbit, 
  List as ListIcon, 
  Camera, 
  Database 
} from 'lucide-react';

interface TopBarProps {
  config: LensConfig;
  nodes: CanvasNode[];
  isOverview: boolean;
  viewMode: PortfolioViewMode;
  onChangeViewMode: (mode: PortfolioViewMode) => void;
  onToggleOverview: () => void;
  onSmartArrange: () => void;
  onOpenTuner: () => void;
  onOpenHelp: () => void;
  onFilterRisk: () => void;
  onOpenNansen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  config,
  nodes,
  isOverview,
  viewMode,
  onChangeViewMode,
  onToggleOverview,
  onSmartArrange,
  onOpenTuner,
  onOpenHelp,
  onFilterRisk,
  onOpenNansen
}) => {
  // Aggregate portfolio metrics
  const totalValue = nodes.reduce((sum, n) => sum + n.valueUsd, 0);
  const totalPnl = nodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0);
  const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
  const criticalCount = nodes.filter(n => n.riskLevel === 'critical' || n.riskLevel === 'high').length;
  const callCount = getApiCallCount();

  return (
    <header className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between gap-3 pointer-events-none select-none">
      {/* Brand & Aggregate Metrics HUD */}
      <div className="flex items-center gap-2.5 pointer-events-auto shrink-0">
        <div className="glass-badge rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 shadow-lg border border-white/10">
          <div 
            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm shrink-0"
            style={{ 
              backgroundColor: config.accent,
              boxShadow: `0 0 10px ${config.accent}` 
            }}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs tracking-wider text-white">AETHER</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                SPATIAL DEFI
              </span>
            </div>
          </div>
        </div>

        {/* Nansen Intelligence & API Call Qualification Tracker */}
        <button
          onClick={onOpenNansen}
          className="glass-badge rounded-lg px-3 py-1.5 hidden xl:flex items-center gap-2 border border-cyan-500/40 hover:border-cyan-400 text-xs shadow-lg transition-all group cursor-pointer"
          title="Nansen Meridian Buildathon API Intelligence & Entity Switcher"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">NANSEN API</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {callCount >= 1000 ? 'QUALIFIED' : `${callCount}/1k`}
              </span>
            </div>
          </div>
        </button>

        {/* Global Net PnL & Exposure Card with NumberFlip */}
        <div className="glass-badge rounded-lg px-3 py-1.5 hidden lg:flex items-center gap-3.5 border border-white/10 shadow-lg text-xs">
          <div>
            <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3 text-slate-400" />
              Exposure
            </div>
            <div className="font-bold text-xs text-white tracking-tight font-mono">
              <NumberFlip value={totalValue} prefix="$" />
            </div>
          </div>

          <div className="w-[1px] h-5 bg-white/10" />

          <div>
            <div className="text-[9px] text-slate-400 uppercase font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              24h PnL
            </div>
            <div className={`font-bold text-xs tracking-tight font-mono ${totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <NumberFlip 
                value={Math.abs(totalPnl)} 
                prefix={totalPnl >= 0 ? '+$' : '-$'} 
              /> ({totalPnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
            </div>
          </div>

          <div className="w-[1px] h-5 bg-white/10" />

          <div>
            <div className="text-[9px] text-slate-400 uppercase font-semibold">
              Health
            </div>
            <div className="font-bold text-xs text-amber-400 tracking-tight font-mono">
              2.18
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls & Layout Switcher */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        {/* Layout View Switcher */}
        <div className="glass-badge rounded-lg p-1 flex items-center gap-1 border border-white/10 shadow-lg">
          <button
            onClick={() => onChangeViewMode('canvas')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'canvas' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Spatial Canvas (Infinite Plane)"
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>Canvas</span>
          </button>

          <button
            onClick={() => onChangeViewMode('list')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Dense Table List View"
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>Table List</span>
          </button>

          <button
            onClick={() => onChangeViewMode('exposure-grid')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'exposure-grid' ? 'bg-rose-500 text-white shadow shadow-rose-500/40' : 'text-slate-400 hover:text-white'
            }`}
            title="CCTV Surveillance Exposure Grid"
          >
            <Camera className="w-3.5 h-3.5 text-rose-300" />
            <span>CCTV Feed</span>
          </button>
        </div>

        {criticalCount > 0 && (
          <button
            onClick={onFilterRisk}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-400 text-xs font-semibold shadow-lg transition-all animate-pulse cursor-pointer"
            title="Highlight high-risk & near liquidation positions"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>{criticalCount} ALERT</span>
          </button>
        )}

        <button
          onClick={onToggleOverview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-lg cursor-pointer ${
            isOverview 
              ? 'bg-amber-500/25 border-amber-500 text-amber-400 shadow-amber-500/20'
              : 'glass-badge border-white/10 text-slate-200 hover:border-amber-500/60 hover:text-white'
          }`}
          title="Toggle Intent Search & Macro Overview (Cmd+K / /)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Intent</span>
          <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-amber-400 border border-white/10 font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onSmartArrange}
          className="glass-badge flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:border-white/30 border border-white/10 shadow-lg transition-all cursor-pointer"
          title="Smart arrange nodes by chain clusters (Ctrl+A)"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Arrange</span>
          <kbd className="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-400 border border-white/10 font-mono">
            ^A
          </kbd>
        </button>

        <button
          onClick={onOpenTuner}
          className="glass-badge flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:border-white/30 border border-white/10 shadow-lg transition-all cursor-pointer"
          title="Live Lens & CRT Shader Tuner (Ctrl+,)"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Lens</span>
        </button>

        <button
          onClick={onOpenHelp}
          className="glass-badge flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-white border border-white/10 shadow-lg transition-all cursor-pointer"
          title="Keyboard shortcuts & help (F1)"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
