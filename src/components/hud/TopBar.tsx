import React from 'react';
import { LensConfig, CanvasNode } from '../../types';
import { PortfolioViewMode } from '../morph/ListSwitcher';
import { NumberFlip } from '../morph/NumberFlip';
import { getApiCallCount } from '../../services/nansenApi';
import { 
  LayoutGrid, 
  Sliders, 
  HelpCircle, 
  TrendingUp, 
  Activity, 
  Search, 
  Orbit, 
  List as ListIcon, 
  Camera, 
  Database,
  Sun,
  Moon
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
  onOpenNansen: () => void;
  onToggleThemeMode: () => void;
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
  onOpenNansen,
  onToggleThemeMode
}) => {
  // Aggregate portfolio metrics
  const totalValue = nodes.reduce((sum, n) => sum + n.valueUsd, 0);
  const totalPnl = nodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0);
  const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
  const callCount = getApiCallCount();
  const isLight = config.themeMode === 'light';

  return (
    <header className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between gap-3 pointer-events-none select-none">
      {/* Brand & Aggregate Metrics HUD */}
      <div className="flex items-center gap-2.5 pointer-events-auto shrink-0">
        <div className={`glass-badge rounded-lg px-3.5 py-1.5 flex items-center gap-2.5 shadow-lg border ${
          isLight ? 'bg-white/95 border-slate-300 text-slate-900 shadow-sm' : 'border-white/10 text-white'
        }`}>
          <div 
            className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm shrink-0"
            style={{ 
              backgroundColor: config.accent,
              boxShadow: `0 0 10px ${config.accent}` 
            }}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold text-xs tracking-wider ${isLight ? 'text-slate-950 font-black' : 'text-white'}`}>
                AETHER
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold border ${
                isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                SPATIAL DEFI
              </span>
            </div>
          </div>
        </div>

        {/* Nansen Intelligence & API Call Qualification Tracker */}
        <button
          onClick={onOpenNansen}
          className={`glass-badge rounded-lg px-3 py-1.5 hidden xl:flex items-center gap-2 border text-xs shadow-lg transition-all group cursor-pointer ${
            isLight 
              ? 'bg-cyan-50/90 border-cyan-300 hover:border-cyan-500 text-slate-900' 
              : 'border-cyan-500/40 hover:border-cyan-400 text-white'
          }`}
          title="Nansen Meridian Buildathon API Intelligence & Entity Switcher"
        >
          <Database className="w-3.5 h-3.5 text-cyan-500 group-hover:scale-110 transition-transform" />
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-cyan-900' : 'text-cyan-300'}`}>
                NANSEN API
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold border ${
                isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {callCount >= 1000 ? 'QUALIFIED' : `${callCount}/1k`}
              </span>
            </div>
          </div>
        </button>

        {/* Global Net PnL & Exposure Card with NumberFlip */}
        <div className={`glass-badge rounded-lg px-3 py-1.5 hidden lg:flex items-center gap-3.5 border shadow-lg text-xs ${
          isLight ? 'bg-white/95 border-slate-300 shadow-sm' : 'border-white/10'
        }`}>
          <div>
            <div className={`text-[9px] uppercase font-bold flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <Activity className="w-3 h-3 text-slate-500" />
              Exposure
            </div>
            <div className={`font-extrabold text-xs tracking-tight font-mono ${isLight ? 'text-slate-950' : 'text-white'}`}>
              <NumberFlip value={totalValue} prefix="$" />
            </div>
          </div>

          <div className={`w-[1px] h-5 ${isLight ? 'bg-slate-300' : 'bg-white/10'}`} />

          <div>
            <div className={`text-[9px] uppercase font-bold flex items-center gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <TrendingUp className={`w-3 h-3 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
              24h PnL
            </div>
            <div className={`font-extrabold text-xs tracking-tight font-mono ${
              totalPnl >= 0 
                ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                : (isLight ? 'text-rose-700' : 'text-rose-400')
            }`}>
              <NumberFlip 
                value={Math.abs(totalPnl)} 
                prefix={totalPnl >= 0 ? '+$' : '-$'} 
              /> ({totalPnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
            </div>
          </div>

          <div className={`w-[1px] h-5 ${isLight ? 'bg-slate-300' : 'bg-white/10'}`} />

          <div>
            <div className={`text-[9px] uppercase font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Health
            </div>
            <div className={`font-extrabold text-xs tracking-tight font-mono ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              2.18
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls & Layout Switcher */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        {/* Layout View Switcher */}
        <div className={`glass-badge rounded-lg p-1 flex items-center gap-1 border shadow-lg ${
          isLight ? 'bg-white/95 border-slate-300' : 'border-white/10'
        }`}>
          <button
            onClick={() => onChangeViewMode('canvas')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'canvas' 
                ? 'bg-amber-500 text-black shadow font-extrabold' 
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-white')
            }`}
            title="Spatial Canvas (Infinite Plane)"
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>Canvas</span>
          </button>

          <button
            onClick={() => onChangeViewMode('list')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-amber-500 text-black shadow font-extrabold' 
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-white')
            }`}
            title="Dense Table List View"
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>Table List</span>
          </button>

          <button
            onClick={() => onChangeViewMode('exposure-grid')}
            className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'exposure-grid' 
                ? 'bg-rose-500 text-white shadow shadow-rose-500/40 font-extrabold' 
                : (isLight ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100' : 'text-slate-400 hover:text-white')
            }`}
            title="CCTV Surveillance Exposure Grid"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CCTV Feed</span>
          </button>
        </div>

        <button
          onClick={onToggleOverview}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-lg cursor-pointer ${
            isOverview 
              ? 'bg-amber-500/25 border-amber-500 text-amber-500 shadow-amber-500/20 font-extrabold' 
              : (isLight 
                  ? 'bg-white border-slate-300 text-slate-800 hover:border-amber-500 hover:text-amber-800' 
                  : 'glass-badge border-white/10 text-slate-200 hover:border-amber-500/60 hover:text-white')
          }`}
          title="Toggle Intent Search & Macro Overview (Cmd+K / /)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Intent</span>
          <kbd className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold border ${
            isLight ? 'bg-slate-100 text-amber-700 border-slate-300' : 'bg-black/40 text-amber-400 border-white/10'
          }`}>
            ⌘K
          </kbd>
        </button>

        <button
          onClick={onSmartArrange}
          className={`glass-badge flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border shadow-lg transition-all cursor-pointer ${
            isLight 
              ? 'bg-white border-slate-300 text-slate-800 hover:text-slate-950 hover:border-slate-400' 
              : 'border-white/10 text-slate-300 hover:text-white hover:border-white/30'
          }`}
          title="Smart arrange nodes by chain clusters (Ctrl+A)"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Arrange</span>
          <kbd className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold border ${
            isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-black/40 text-slate-400 border-white/10'
          }`}>
            ^A
          </kbd>
        </button>

        <button
          onClick={onOpenTuner}
          className={`glass-badge flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border shadow-lg transition-all cursor-pointer ${
            isLight 
              ? 'bg-white border-slate-300 text-slate-800 hover:text-slate-950 hover:border-slate-400' 
              : 'border-white/10 text-slate-300 hover:text-white hover:border-white/30'
          }`}
          title="Live Lens & CRT Shader Tuner (Ctrl+,)"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Lens</span>
        </button>

        <button
          onClick={onToggleThemeMode}
          className={`glass-badge flex items-center justify-center w-7 h-7 rounded-lg border shadow-lg transition-all cursor-pointer ${
            isLight 
              ? 'bg-white border-slate-300 text-amber-600 hover:bg-amber-50' 
              : 'border-white/10 text-slate-300 hover:text-amber-400'
          }`}
          title={isLight ? "Switch to Dark Mode (Cyberpunk)" : "Switch to Light Mode (Clean Slate)"}
        >
          {isLight ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-cyan-400" />}
        </button>

        <button
          onClick={onOpenHelp}
          className={`glass-badge flex items-center justify-center w-7 h-7 rounded-lg border shadow-lg transition-all cursor-pointer ${
            isLight 
              ? 'bg-white border-slate-300 text-slate-700 hover:text-slate-950' 
              : 'border-white/10 text-slate-400 hover:text-white'
          }`}
          title="Keyboard shortcuts & help (F1)"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
