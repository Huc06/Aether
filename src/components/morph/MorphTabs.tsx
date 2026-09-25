import React from 'react';

interface MorphTabsProps<T extends string> {
  tabs: { id: T; label: string; icon?: string; badge?: number | string }[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function MorphTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = ''
}: MorphTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono relative ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative px-3 py-1.5 rounded-lg font-bold transition-colors z-10 flex items-center gap-1.5 ${
              isActive
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isActive ? 'bg-amber-500 text-black font-extrabold' : 'bg-white/10 text-slate-400'
              }`}>
                {tab.badge}
              </span>
            )}
            {isActive && (
              <div
                className="absolute inset-0 bg-white/15 rounded-lg -z-10 shadow-sm border border-white/20 transition-all duration-300"
                style={{
                  boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)'
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
