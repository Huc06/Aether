import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowRight, 
  TrendingUp, 
  Lock, 
  GripHorizontal, 
  ExternalLink 
} from 'lucide-react';
import { CanvasNode, LensConfig, PositionSettlementReceipt } from '../../types';
import { useDraggablePanel } from './useDraggablePanel';

interface SettlementReceiptModalProps {
  node: CanvasNode;
  receipt: PositionSettlementReceipt;
  config?: LensConfig;
  onClose: () => void;
  onFocusNode?: (node: CanvasNode) => void;
  onShowToast?: (msg: string) => void;
}

export const SettlementReceiptModal: React.FC<SettlementReceiptModalProps> = ({
  node,
  receipt,
  config,
  onClose,
  onFocusNode,
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
    const text = `
=== AETHER SETTLEMENT RECEIPT ===
Position: ${node.title} (${node.app} • ${node.chain})
Tx Hash: ${receipt.txHash}
Timestamp: ${receipt.timestamp}
----------------------------------------
Recovered Capital: ${receipt.recoveredAmount}
Debt Extinguished: ${receipt.debtExtinguished} -> $0 (Delta-0)
Liquidation Saved: ${receipt.liquidationPenaltySaved}
Health Factor: ${receipt.priorHealthFactor.toFixed(2)} -> ${receipt.newHealthFactor.toFixed(1)} (Safe)
Route Taken: ${receipt.routeSummary}
MEV Protection: ${receipt.mevProtection}
Fee Paid: ${receipt.feePaid}
Status: CONFIRMED ON-CHAIN (FINALIZED)
========================================`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast?.('Settlement receipt copied to clipboard');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="fixed z-[65] top-16 sm:top-20 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:right-12 w-full max-w-[min(560px,calc(100vw-2rem))] pointer-events-none"
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
      }}
      role="dialog"
      aria-label="Settlement Receipt"
    >
      <div
        className={`pointer-events-auto w-full rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col ${
          isLight
            ? 'bg-white/98 text-slate-900 border-emerald-500 shadow-2xl'
            : 'bg-slate-950/98 text-slate-200 border-emerald-500/80 backdrop-blur-2xl'
        } ${isDragging ? 'select-none opacity-95' : 'animate-in fade-in zoom-in-95 duration-200'}`}
        style={{
          boxShadow: isLight
            ? '0 20px 60px rgba(16, 185, 129, 0.25), 0 10px 30px rgba(0, 0, 0, 0.1)'
            : '0 0 60px rgba(16, 185, 129, 0.35), 0 25px 60px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Drag Bar */}
        <div
          {...dragHandleProps}
          className={`flex items-center justify-between px-3 py-1.5 border-b text-[10px] font-mono select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${
            isLight
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
              : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-white/10'
          }`}
          title="Drag receipt across canvas"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="w-3.5 h-3.5 opacity-70" />
            <span className="font-extrabold uppercase tracking-wider text-[9px]">
              Settlement Receipt // {receipt.txHash.slice(0, 10)}...
            </span>
          </div>
          <span className="text-[9px] font-bold opacity-75">Esc close</span>
        </div>

        {/* Receipt Header Banner */}
        <div className={`px-4 py-3 border-b flex items-center justify-between gap-3 ${
          isLight ? 'bg-emerald-50/70 border-slate-200' : 'bg-emerald-950/30 border-white/10'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className={`font-black text-sm sm:text-base tracking-wide truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Execution Settled &bull; Collateral Secured
                </h3>
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase border bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shrink-0">
                  FINALIZED
                </span>
              </div>
              <span className={`text-[11px] font-mono truncate ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {node.title} &bull; {receipt.timestamp}
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
            {/* Metric 1: Capital Recovered */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/30'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                Recovered Capital
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight tabular-nums mt-1 ${
                isLight ? 'text-emerald-900' : 'text-emerald-300'
              }`}>
                {receipt.recoveredAmount}
              </div>
              <span className="text-[8px] text-slate-400 mt-0.5">Credited to Margin</span>
            </div>

            {/* Metric 2: Debt Extinguished */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Debt Cleared
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight tabular-nums mt-1 ${
                isLight ? 'text-slate-950' : 'text-white'
              }`}>
                $0
              </div>
              <span className="text-[8px] text-emerald-400 mt-0.5">Delta-0 Neutral</span>
            </div>

            {/* Metric 3: Liquidation Loss Saved */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-500/30'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                Penalty Avoided
              </span>
              <div className={`text-base sm:text-lg font-black tracking-tight tabular-nums mt-1 ${
                isLight ? 'text-amber-900' : 'text-amber-300'
              }`}>
                {receipt.liquidationPenaltySaved}
              </div>
              <span className="text-[8px] text-slate-400 mt-0.5">Zero Slippage Spill</span>
            </div>

            {/* Metric 4: Health Restored */}
            <div className={`p-2.5 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <span className={`text-[9px] font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Health Factor
              </span>
              <div className="text-base sm:text-lg font-black tracking-tight tabular-nums mt-1 text-emerald-400">
                {receipt.priorHealthFactor.toFixed(2)} &rarr; {receipt.newHealthFactor.toFixed(1)}
              </div>
              <span className="text-[8px] text-emerald-400 mt-0.5">100% Solvent Tier</span>
            </div>
          </div>

          {/* On-Chain Pipeline Breakdown Table */}
          <div className={`p-3 rounded-xl border flex flex-col gap-2 text-[11px] ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-white/10 text-slate-300'
          }`}>
            <div className="flex items-center justify-between border-b pb-1.5 border-inherit text-[10px]">
              <span className="font-extrabold uppercase text-slate-400">Execution Route</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> {receipt.mevProtection}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400">Protocol Pipeline:</span>
              <span className="font-bold truncate max-w-[280px]" title={receipt.routeSummary}>
                {receipt.routeSummary}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400">Debt Obligation Extinguished:</span>
              <span className="font-bold text-rose-400 line-through">
                {receipt.debtExtinguished}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400">Total Settlement &amp; Gas Fee:</span>
              <span className="font-bold">{receipt.feePaid}</span>
            </div>

            <div className="flex items-center justify-between py-0.5 pt-1.5 border-t border-inherit">
              <span className="text-slate-400">Transaction Signature:</span>
              <span className="font-bold font-mono text-[10px] text-cyan-400 truncate max-w-[240px]">
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
              {copied ? 'Receipt Copied!' : 'Copy Tx Receipt'}
            </button>

            {onFocusNode && (
              <button
                type="button"
                onClick={() => {
                  onFocusNode(node);
                  onClose();
                }}
                className="flex-1 h-10 rounded-lg border-2 text-xs font-mono font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
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
