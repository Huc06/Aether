import React, { useEffect, useRef } from 'react';
import { ShieldAlert, RefreshCw, Zap, AlertTriangle, Radio } from 'lucide-react';
import { CanvasNode, PositionExitRoute } from '../../types';

interface NoSignalGlitchProps {
  node: CanvasNode;
  onReconnect?: () => void;
  onEmergencyKill?: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const NoSignalGlitch: React.FC<NoSignalGlitchProps> = ({
  node,
  onReconnect,
  onEmergencyKill
}) => {
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = noiseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const w = (canvas.width = 240);
    const h = (canvas.height = 160);

    const renderNoise = () => {
      const imgData = ctx.createImageData(w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.floor(Math.random() * 255);
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        data[i + 3] = 45; // Subtle analog static
      }
      ctx.putImageData(imgData, 0, 0);
      animId = requestAnimationFrame(renderNoise);
    };

    animId = requestAnimationFrame(renderNoise);
    return () => cancelAnimationFrame(animId);
  }, []);

  const isCritical = node.riskLevel === 'critical';

  return (
    <div className="relative w-full h-full min-h-[220px] bg-slate-950 flex flex-col items-center justify-between p-4 overflow-hidden rounded-xl border border-rose-500/40 select-none">
      {/* Background Static Noise Canvas */}
      <canvas
        ref={noiseCanvasRef}
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none mix-blend-screen"
      />

      {/* SMPTE Color Bars Header */}
      <div className="w-full flex h-3 rounded overflow-hidden opacity-75 shadow-inner">
        <div className="flex-1 bg-[#c0c0c0]" />
        <div className="flex-1 bg-[#c0c000]" />
        <div className="flex-1 bg-[#00c0c0]" />
        <div className="flex-1 bg-[#00c000]" />
        <div className="flex-1 bg-[#c000c0]" />
        <div className="flex-1 bg-[#c00000]" />
        <div className="flex-1 bg-[#0000c0]" />
      </div>

      {/* Center Glitch Readout */}
      <div className="relative z-10 flex flex-col items-center text-center gap-2 py-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-rose-500/20 border border-rose-500/60 text-rose-400 font-mono text-xs font-extrabold animate-pulse">
          {isCritical ? <ShieldAlert className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
          <span>{isCritical ? 'LIQUIDATION THREAT // ORACLE DESYNC' : 'NO SIGNAL // FEED DISCONNECTED'}</span>
        </div>

        <div className="font-mono text-[11px] text-slate-300 flex flex-col gap-0.5">
          <span className="text-white font-bold">{node.title}</span>
          <span className="text-rose-400">
            {isCritical
              ? `Distance to Liq: -${node.liquidationDistancePct?.toFixed(1)}% | HF: ${node.healthFactor?.toFixed(2)}`
              : 'Protocol RPC stream timed out.'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {node.chain.toUpperCase()} &bull; FEED_ID: 0x{node.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Bottom CCTV Action Buttons */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2 pt-2 border-t border-rose-500/20 font-mono text-xs">
        <button
          onClick={onReconnect}
          className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 flex items-center gap-1.5 transition-all text-[11px]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Feed</span>
        </button>

        {node.exitRoutes && node.exitRoutes.length > 0 && (
          <button
            onClick={() => onEmergencyKill && onEmergencyKill(node, node.exitRoutes![0])}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-600/40 transition-all text-[11px]"
          >
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>1-Click Kill</span>
          </button>
        )}
      </div>
    </div>
  );
};
