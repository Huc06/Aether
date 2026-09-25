import React from 'react';
import { CanvasNode } from '../../types';

interface RecentWindowsOverlayProps {
  isOpen: boolean;
  nodes: CanvasNode[];
  selectedIndex: number;
}

export const RecentWindowsOverlay: React.FC<RecentWindowsOverlayProps> = ({
  isOpen,
  nodes,
  selectedIndex
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-none select-none">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-amber-500/50 p-4 flex flex-col gap-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs font-mono">
          <span className="font-extrabold text-amber-400">
            RECENT WINDOWS // ALT+TAB SWITCHER
          </span>
          <span className="text-slate-400 text-[10px]">
            Tab to cycle &bull; Release to focus
          </span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {nodes.map((node, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={node.id}
                className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg'
                    : 'bg-black/30 border-white/5 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{node.icon}</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">{node.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {node.app} &bull; {node.category} &bull; {node.chain}
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-white">${node.valueUsd.toLocaleString()}</div>
                  {isSelected && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-black font-extrabold">
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
