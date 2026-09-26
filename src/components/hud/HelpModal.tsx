import React from 'react';
import { X, Keyboard, HelpCircle } from 'lucide-react';
import { LensConfig } from '../../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: LensConfig;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, config }) => {
  if (!isOpen) return null;
  const isLight = config?.themeMode === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all">
      <div className={`w-full max-w-xl rounded-2xl border p-6 flex flex-col gap-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 transition-colors ${
        isLight ? 'bg-white/98 text-slate-900 border-slate-300 shadow-2xl' : 'glass-panel text-white border-white/15'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-2.5">
            <Keyboard className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <h3 className={`font-extrabold text-base tracking-wide ${isLight ? 'text-slate-950' : 'text-white'}`}>
              Aether Keyboard Controls &amp; Gestures
            </h3>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="flex flex-col gap-2.5">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              Canvas Navigation
            </span>
            <div className={`flex items-center justify-between p-2 rounded border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>Click + Drag</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>Pan Canvas</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>Mouse Wheel</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>Smooth Zoom In/Out</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>Click Node</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>Deep Zoom &amp; Inspect</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              Shortcuts &amp; Intent
            </span>
            <div className={`flex items-center justify-between p-2 rounded border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>⌘K / ^G / /</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>Intent Search</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>Ctrl + A</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>Smart Arrange</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>Ctrl + ,</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>CRT Live Tuner</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <span className={isLight ? 'text-slate-700 font-semibold' : 'text-slate-300'}>Esc</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>Reset / Dismiss</span>
            </div>
          </div>
        </div>

        <div className={`p-3 rounded-lg text-[11px] leading-relaxed font-sans border ${
          isLight ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium' : 'bg-amber-500/10 border-amber-500/20 text-amber-300/90'
        }`}>
          <strong>Spatial DeFi Tip:</strong> Drag and organize your nodes freely. Your layout automatically persists in your browser.
        </div>
      </div>
    </div>
  );
};
