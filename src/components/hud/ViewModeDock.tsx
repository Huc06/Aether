import React from 'react';
import { PortfolioViewMode } from '../morph/ListSwitcher';
import { LensConfig } from '../../types';
import { Orbit, List as ListIcon, Camera } from 'lucide-react';

interface ViewModeDockProps {
  viewMode: PortfolioViewMode;
  onChangeViewMode: (mode: PortfolioViewMode) => void;
  config?: LensConfig;
}

export const ViewModeDock: React.FC<ViewModeDockProps> = ({
  viewMode,
  onChangeViewMode,
  config
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
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className={`p-1.5 rounded-2xl border flex items-center gap-1.5 shadow-2xl backdrop-blur-2xl transition-all ${
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
              className={`relative px-4 py-2 rounded-xl text-xs font-sans font-bold flex items-center gap-2 transition-all cursor-pointer group ${
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
              <span>{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-black absolute bottom-0.5 left-1/2 -translate-x-1/2 opacity-70" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
