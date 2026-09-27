import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Zap, 
  Lock, 
  GripHorizontal,
  TrendingUp,
  Workflow
} from 'lucide-react';
import { LensConfig, RouteSettlementReceipt } from '../../types';
import { useDraggablePanel } from '../position/useDraggablePanel';

interface RouteSettlementReceiptModalProps {
  receipt: RouteSettlementReceipt;
  config?: LensConfig;
  onClose: () => void;
  onFocusCanvas?: () => void;
  onShowToast?: (msg: string) => void;
}

export const RouteSettlementReceiptModal: React.FC<RouteSettlementReceiptModalProps> = ({
  receipt,
  config,
  onClose,
  onFocusCanvas,
  onShowToast,
}) => {
  const isLight = config?.themeMode === 'light';
  const [copied, setCopied] = useState(false);
  const { offset, isDragging, dragHandleProps } = useDraggablePanel({
    maxXPad: 440,
    maxYPad: 140,
    isOpen: true,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const handleCopyReceipt = () => {
    const stepsText = receipt.steps
      .map(s => `  Step ${s.stepNumber}: [${s.type.toUpperCase()}] ${s.protocol} - ${s.amount} (${s.fromAsset} -> ${s.toAsset || s.fromAsset})`)
      .join('\n');

    const text = `
=== AETHER INTENT ROUTE SETTLEMENT RECEIPT ===
Route: ${receipt.routeTitle}
Tag: ${receipt.tag}
Tx Signature: ${receipt.txHash}
Timestamp: ${receipt.timestamp}
----------------------------------------
Total Volume: ${receipt.totalVolume}
Alpha / APY Impact: ${receipt.netApyImpact}
Execution Time: ${receipt.executionTime}
Total Gas Cost: ${receipt.gasCost}
MEV Protection: ${receipt.mevProtection}
Status: ${receipt.status} (FINALIZED IN BLOCK)
----------------------------------------
Multi-Hop Execution Pipeline:
${stepsText}
========================================`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast?.('Intent route receipt copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed z-[65] top-16 sm:top-20 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-12 w-full max-w-[min(580px,calc(100vw-2rem))] pointer-events-none"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      role="dialog"
      aria-label="Intent Route Settlement Receipt"
    >
      <div
        className={`pointer-events-auto w-full rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col ${
          isLight
            ? 'bg-white/98 text-slate-900 border-cyan-500 shadow-2xl'
            : 'bg-slate-950/98 text-slate-200 border-cyan-500/80 backdrop-blur-2xl'
        } ${isDragging ? 'select-none opacity-95' : 'animate-in fade-in zoom-in-95 duration-200'}`}
        style={{
          boxShadow: isLight
            ? '0 20px 60px rgba(6, 182, 212, 0.25), 0 10px 30px rgba(0, 0, 0, 0.1)'
            : '0 0 60px rgba(6, 182, 212, 0.35), 0 25px 60px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Drag Bar */}
        <div
          {...dragHandleProps}
          className={`flex items-center justify-between px-3 py-1.5 border-b text-[10px] font-mono select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            isLight
              ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-200'
              : 'bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border-white/10'
          }`}
          title="Drag receipt across canvas"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="w-3.5 h-3.5 opacity-70" />
            <span className="font-extrabold uppercase tracking-wider text-[9px]">
              Intent Execution Receipt // {receipt.txHash.slice(0, 10)}...
            </span>
          </div>
          <span className="text-[9px] font-bold opacity-75">Esc close</span>
        </div>

        {/* Receipt Header Banner */}
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
          isLight ? 'bg-cyan-50/70 border-slate-200' : 'bg-cyan-950/30 border-white/10'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className={`font-black text-sm sm:text-base tracking-wide truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {receipt.routeTitle}
                </h3>
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase border bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shrink-0">
                  {receipt.tag}
                </span>
              </div>
              <span className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Settled in {receipt.executionTime} &bull; {receipt.timestamp}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`shrink-0 h-8 px-2.5 rounded-lg border text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-slate-950'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            Esc
          </button>
        </div>

        {/* 4 Quantitative Key Metrics Grid */}
        <div className="p-3 sm:p-4 flex flex-col gap-3 font-mono">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Metric 1: Total Volume */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-cyan-50/60 border-cyan-200' : 'bg-cyan-950/30 border-cyan-500/30'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                Volume Deployed
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight tabular-nums mt-1 ${
                isLight ? 'text-cyan-900' : 'text-cyan-300'
              }`}>
                {receipt.totalVolume}
              </div>
              <span className="text-[8px] text-slate-400 mt-0.5">Automated Rebalance</span>
            </div>

            {/* Metric 2: Alpha / APY Impact */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/30'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                Alpha Capture
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight tabular-nums mt-1 ${
                isLight ? 'text-emerald-900' : 'text-emerald-300'
              }`}>
                {receipt.netApyImpact.split(' ')[0] || '+24.5%'}
              </div>
              <span className="text-[8px] text-emerald-400 mt-0.5">Nansen Signal Sync</span>
            </div>

            {/* Metric 3: Total Gas Paid */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Network Gas Fee
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight tabular-nums mt-1 ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                {receipt.gasCost}
              </div>
              <span className="text-[8px] text-slate-400 mt-0.5">Batch Compressed</span>
            </div>

            {/* Metric 4: Execution Speed */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Settle Latency
              </span>
              <div className="text-base sm:text-lg font-black tracking-tight tabular-nums mt-1 text-cyan-400">
                {receipt.executionTime}
              </div>
              <span className="text-[8px] text-cyan-400 mt-0.5">Atomic Pipeline</span>
            </div>
          </div>

          {/* Multi-Hop Pipeline Steps Execution Status */}
          <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-white/10'
          }`}>
            <div className="flex items-center justify-between border-b pb-1.5 border-inherit text-[10px]">
              <span className="font-extrabold uppercase text-slate-400 flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                Atomic Multi-Hop Pipeline Execution
              </span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> {receipt.mevProtection}
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {receipt.steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[9px] shrink-0">
                      {step.stepNumber}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold uppercase text-[9px] text-cyan-400">
                          [{step.type}]
                        </span>
                        <span className="font-bold text-white truncate" title={step.protocol}>
                          {step.protocol}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          ({step.fromChain})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate">
                        {step.amount} &bull; {step.fromAsset} {step.toAsset ? `-> ${step.toAsset}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 font-bold text-emerald-400 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SETTLED</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between py-0.5 pt-1.5 border-t border-inherit text-[10px]">
              <span className="text-slate-400">On-Chain Transaction Proof:</span>
              <span className="font-bold font-mono text-cyan-400 truncate max-w-[260px]">
                {receipt.txHash}
              </span>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyReceipt}
              className={`flex-1 h-10 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : isLight
                    ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-white/15'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Receipt Copied!' : 'Copy Route Receipt'}
            </button>

            {onFocusCanvas && (
              <button
                type="button"
                onClick={() => {
                  onFocusCanvas();
                  onClose();
                }}
                className="flex-1 h-10 rounded-lg border-2 text-xs font-mono font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                Inspect on Canvas
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
