import React from 'react';
import { Zap, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  isLight?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isLight = false }) => {
  if (!message) return null;

  const isSuccess = message.includes('✓') || message.toLowerCase().includes('success') || message.toLowerCase().includes('settled');
  const isAlert = message.includes('⚡') || message.toLowerCase().includes('kill') || message.toLowerCase().includes('alert') || message.toLowerCase().includes('critical') || message.toLowerCase().includes('error');

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-none flex items-center justify-center max-w-lg w-auto px-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className={`px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-2.5 transition-colors select-none ${
        isLight
          ? 'bg-white/98 text-slate-950 border border-slate-300 shadow-[0_12px_40px_rgba(0,0,0,0.18)]'
          : 'bg-slate-950/95 text-white border border-amber-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(245,158,11,0.2)]'
      }`}>
        {/* Pulsing Status Dot / Icon */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full animate-ping absolute ${
            isSuccess ? 'bg-emerald-400' : (isAlert ? 'bg-rose-500' : 'bg-amber-400')
          }`} />
          <div className={`w-2 h-2 rounded-full relative ${
            isSuccess ? 'bg-emerald-500' : (isAlert ? 'bg-rose-500' : 'bg-amber-500')
          }`} />
        </div>

        <span className={`font-semibold tracking-wide ${
          isLight ? 'text-slate-900' : 'text-slate-100'
        }`}>
          {message}
        </span>
      </div>
    </div>
  );
};
