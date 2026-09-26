import React from 'react';

export type MorphTabTone = 'default' | 'safe' | 'warn' | 'critical';

interface MorphTabsProps<T extends string> {
  tabs: { id: T; label: string; badge?: number | string; tone?: MorphTabTone }[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
  isLight?: boolean;
}

function tabLabelClass(isActive: boolean, isLight: boolean, tone: MorphTabTone = 'default') {
  if (tone === 'safe') {
    return isLight
      ? (isActive ? 'text-emerald-800' : 'text-emerald-700 hover:text-emerald-900')
      : (isActive ? 'text-emerald-300' : 'text-emerald-400/80 hover:text-emerald-300');
  }
  if (tone === 'warn') {
    return isLight
      ? (isActive ? 'text-amber-800' : 'text-amber-700 hover:text-amber-900')
      : (isActive ? 'text-amber-300' : 'text-amber-400/80 hover:text-amber-300');
  }
  if (tone === 'critical') {
    return isLight
      ? (isActive ? 'text-rose-800' : 'text-rose-700 hover:text-rose-900')
      : (isActive ? 'text-rose-300' : 'text-rose-400/80 hover:text-rose-300');
  }
  return isActive
    ? (isLight ? 'text-slate-950' : 'text-white')
    : (isLight ? 'text-slate-800 hover:text-slate-950' : 'text-slate-200 hover:text-white');
}

export function MorphTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  isLight = false
}: MorphTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 rounded-xl text-xs font-mono relative isolate ${
        isLight ? 'bg-slate-200/90 border border-slate-300 shadow-sm' : 'bg-slate-950/80 border border-white/10'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative px-3 py-1.5 rounded-lg font-bold transition-colors z-10 flex items-center gap-1.5 cursor-pointer ${
              isActive ? 'font-extrabold' : 'font-semibold'
            } ${tabLabelClass(isActive, isLight, tab.tone)}`}
          >
            <span className={tabLabelClass(isActive, isLight, tab.tone)}>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isActive 
                  ? 'bg-amber-500 text-black font-extrabold' 
                  : (isLight ? 'bg-slate-300 text-slate-800 font-bold' : 'bg-white/10 text-slate-200')
              }`}>
                {tab.badge}
              </span>
            )}
            {isActive && (
              <div
                className={`absolute inset-0 rounded-lg -z-10 transition-all duration-300 ${
                  isLight 
                    ? 'bg-white shadow-sm border border-slate-300/80' 
                    : 'bg-white/15 shadow-sm border border-white/20'
                }`}
                style={{
                  boxShadow: isLight ? '0 2px 8px rgba(0, 0, 0, 0.08)' : '0 0 15px rgba(245, 158, 11, 0.15)'
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
