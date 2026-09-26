import React from 'react';

export type MorphTabTone =
  | 'default'
  | 'safe'
  | 'warn'
  | 'critical'
  | 'solana'
  | 'arbitrum'
  | 'ethereum'
  | 'hyperliquid';

interface MorphTabsProps<T extends string> {
  tabs: { id: T; label: string; badge?: number | string; tone?: MorphTabTone }[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
  isLight?: boolean;
}

const INK: Record<MorphTabTone, { light: [string, string]; dark: [string, string] }> = {
  default: { light: ['#020617', '#1e293b'], dark: ['#ffffff', '#e2e8f0'] },
  safe: { light: ['#065f46', '#047857'], dark: ['#6ee7b7', '#34d399'] },
  warn: { light: ['#92400e', '#b45309'], dark: ['#fcd34d', '#fbbf24'] },
  critical: { light: ['#9f1239', '#be123c'], dark: ['#fda4af', '#fb7185'] },
  solana: { light: ['#6b21a8', '#7e22ce'], dark: ['#e9d5ff', '#d8b4fe'] },
  arbitrum: { light: ['#155e75', '#0e7490'], dark: ['#a5f3fc', '#67e8f9'] },
  ethereum: { light: ['#1e3a8a', '#1d4ed8'], dark: ['#bfdbfe', '#93c5fd'] },
  hyperliquid: { light: ['#115e59', '#0f766e'], dark: ['#99f6e4', '#5eead4'] },
};

function tabInk(isLight: boolean, isActive: boolean, tone: MorphTabTone = 'default') {
  const pair = INK[tone][isLight ? 'light' : 'dark'];
  return isActive ? pair[0] : pair[1];
}

export function MorphTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  isLight = false,
}: MorphTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 rounded-xl text-xs font-mono ${
        isLight ? 'bg-slate-200/90 border border-slate-300 shadow-sm' : 'bg-slate-950/80 border border-white/10'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const ink = tabInk(isLight, isActive, tab.tone);
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={{ color: ink }}
            className={`relative px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border ${
              isActive
                ? (isLight
                  ? 'font-extrabold bg-white border-slate-300 shadow-sm'
                  : 'font-extrabold bg-white/15 border-white/20')
                : (isLight
                  ? 'font-semibold bg-transparent border-transparent hover:bg-white/70'
                  : 'font-semibold bg-transparent border-transparent hover:bg-white/10')
            }`}
          >
            <span style={{ color: ink }} className="relative">
              {tab.label}
            </span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive
                    ? 'bg-amber-500 text-black font-extrabold'
                    : (isLight ? 'bg-slate-300 text-slate-800 font-bold' : 'bg-white/10 text-slate-100 font-bold')
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
