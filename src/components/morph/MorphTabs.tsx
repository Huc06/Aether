import React from 'react';

interface MorphTabsProps<T extends string> {
  tabs: { id: T; label: string; badge?: number | string }[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
  isLight?: boolean;
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
      className={`inline-flex items-center p-1 rounded-xl text-xs font-mono relative ${
        isLight ? 'bg-slate-200/90 border border-slate-300 shadow-sm' : 'bg-slate-950/80 border border-white/10'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative px-3 py-1.5 rounded-lg font-bold transition-colors z-10 flex items-center gap-1.5 cursor-pointer ${
              isActive
                ? (isLight ? 'text-slate-950 font-extrabold' : 'text-white')
                : (isLight ? 'text-slate-600 hover:text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-200')
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isActive 
                  ? 'bg-amber-500 text-black font-extrabold' 
                  : (isLight ? 'bg-slate-300 text-slate-800 font-bold' : 'bg-white/10 text-slate-400')
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
