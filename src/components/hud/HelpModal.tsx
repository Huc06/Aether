import React from 'react';
import { X, Keyboard, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/15 p-6 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-base text-white tracking-wide">
              Aether Keyboard Controls &amp; Gestures
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Canvas Navigation
            </span>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-300">Click + Drag</span>
              <span className="text-amber-300 font-bold">Pan Canvas</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-300">Mouse Wheel</span>
              <span className="text-amber-300 font-bold">Smooth Zoom In/Out</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-300">Click Node</span>
              <span className="text-amber-300 font-bold">Deep Zoom &amp; Inspect</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Shortcuts &amp; Intent
            </span>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-300">⌘K / ^G / /</span>
              <span className="text-amber-300 font-bold">Intent Search</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-300">Ctrl + A</span>
              <span className="text-amber-300 font-bold">Smart Arrange</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-300">Ctrl + ,</span>
              <span className="text-amber-300 font-bold">CRT Live Tuner</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
              <span className="text-slate-300">Esc</span>
              <span className="text-amber-300 font-bold">Reset / Dismiss</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 leading-relaxed font-sans">
          💡 <strong>Spatial DeFi Tip:</strong> Drag and organize your nodes freely. Your layout automatically persists in your browser. Use the <strong>Radar Minimap</strong> in the bottom right corner to quickly jump anywhere.
        </div>
      </div>
    </div>
  );
};
