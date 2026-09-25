import React from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="glass-panel px-4 py-2.5 rounded-lg border border-amber-500/40 text-xs font-mono text-white shadow-2xl flex items-center gap-2.5 bg-slate-950/90">
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>{message}</span>
      </div>
    </div>
  );
};
