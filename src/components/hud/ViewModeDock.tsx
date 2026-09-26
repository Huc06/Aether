import React from 'react';
import { PortfolioViewMode } from '../morph/ListSwitcher';
import { LensConfig } from '../../types';
import { Orbit, List as ListIcon, Camera } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface ViewModeDockProps {
  viewMode: PortfolioViewMode;
  onChangeViewMode: (mode: PortfolioViewMode) => void;
  config?: LensConfig;
  isDimmed?: boolean;
}

export const ViewModeDock: React.FC<ViewModeDockProps> = ({
  viewMode,
  onChangeViewMode,
  config,
  isDimmed = false
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
        <Tabs
          value={viewMode}
          onValueChange={(v) => onChangeViewMode(v as PortfolioViewMode)}
          variant="pill"
        >
          <TabsList
            className="gap-1 p-0"
            indicatorClassName="bg-amber-500 shadow-lg shadow-amber-500/30"
          >
            {items.map((item) => (
              <TabsTrigger
                key={item.mode}
                value={item.mode}
                className={`px-4 py-2 text-xs font-sans font-bold ${
                  isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                activeClassName="text-black font-extrabold"
              >
                {item.icon}
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
};
