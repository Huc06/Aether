import React from 'react';
import { PortfolioViewMode } from '../morph/ListSwitcher';
import { LensConfig } from '../../types';
import { Orbit, List as ListIcon, Camera, Search } from 'lucide-react';

interface ViewModeDockProps {
  viewMode: PortfolioViewMode;
  onChangeViewMode: (mode: PortfolioViewMode) => void;
  config?: LensConfig;
  isDimmed?: boolean;
  isIntentOpen?: boolean;
  onToggleIntent?: () => void;
}

export const ViewModeDock: React.FC<ViewModeDockProps> = ({
  viewMode,
  onChangeViewMode,
  config,
  isDimmed = false,
  isIntentOpen = false,
  onToggleIntent,
}) => {
  const isLight = config?.themeMode === 'light';

  const items: { mode: PortfolioViewMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { mode: 'canvas', label: 'Canvas', icon: <Orbit className="w-4 h-4" />, shortcut: '1' },
    { mode: 'list', label: 'Table List', icon: <ListIcon className="w-4 h-4" />, shortcut: '2' },
    { mode: 'exposure-grid', label: 'CCTV Feed', icon: <Camera className="w-4 h-4" />, shortcut: '3' }
  ];

  return (
    <nav 
      aria-label="Workspace Views macOS Dock"
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-3 duration-200 transition-all ${
        isDimmed 
          ? 'opacity-25 hover:opacity-100 scale-95 hover:scale-100 blur-[0.5px] hover:blur-none duration-300' 
          : 'opacity-100 scale-100'
      }`}
    >
      <div className={`p-1 rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all ${
        isLight
          ? 'bg-white/95 border-slate-300 shadow-[0_12px_40px_rgba(0,0,0,0.14)]'
          : 'glass-badge bg-slate-950/90 border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.85)]'
      }`}>
        {items.map((item) => {
          const isActive = viewMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => onChangeViewMode(item.mode)}
              className={`relative px-3 sm:px-3.5 py-2 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer group ${
                isActive
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-extrabold scale-105'
                  : (isLight 
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/90' 
                      : 'text-slate-400 hover:text-white hover:bg-white/10')
              }`}
              title={`${item.label} (Press ${item.shortcut})`}
            >
              <span className={`transition-transform group-hover:scale-110 ${isActive ? 'text-black' : (isLight ? 'text-slate-700' : 'text-slate-400')}`}>
                {item.icon}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
              <kbd className={`hidden md:inline text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                isActive
                  ? 'bg-black/20 text-black border-black/25'
                  : (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-slate-300 border-white/15')
              }`}>
                {item.shortcut}
              </kbd>
            </button>
          );
        })}

        {onToggleIntent && (
          <>
            <div className={`h-5 w-px mx-0.5 ${isLight ? 'bg-slate-300' : 'bg-white/15'}`} />

            <button
              onClick={onToggleIntent}
              className={`relative px-3 sm:px-3.5 py-2 rounded-xl text-xs font-sans font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer group ${
                isIntentOpen
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-extrabold scale-105'
                  : (isLight 
                      ? 'text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40' 
                      : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30')
              }`}
              title="Toggle Nansen AI Intent Spotlight (Press 4 or ⌘K)"
            >
              <Search className={`w-3.5 h-3.5 ${isIntentOpen ? 'text-black' : (isLight ? 'text-amber-800' : 'text-amber-400')}`} />
              <span>Intent</span>
              <kbd className={`hidden md:inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                isIntentOpen 
                  ? 'bg-black/20 text-black border-black/25' 
                  : (isLight ? 'bg-white text-amber-900 border-amber-300' : 'bg-black/40 text-amber-300 border-amber-500/30')
              }`}>
                <span>4</span>
                <span className="opacity-40 font-normal">·</span>
                <span>⌘K</span>
              </kbd>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
