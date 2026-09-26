import React, { useState, useEffect, useRef } from 'react';
import { CanvasNode, PositionExitRoute } from '../../types';
import { ExposureGridTreatment } from './ExposureGridShader';
import { NoSignalGlitch } from './NoSignalGlitch';
import { NumberFlip } from '../morph/NumberFlip';
import { 
  Maximize2, 
  Minimize2, 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Zap, 
  ChevronRight, 
  Orbit, 
  Radio,
  Clock
} from 'lucide-react';

interface CameraMonitorProps {
  node: CanvasNode;
  camIndex: number;
  treatment: ExposureGridTreatment;
  timeString: string;
  isFocused: boolean;
  onToggleFocus: () => void;
  onInspect: () => void;
  onGlideOnCanvas: () => void;
  onEmergencyKill: (node: CanvasNode, route: PositionExitRoute) => void;
  onReconnect: () => void;
}

export const CameraMonitor: React.FC<CameraMonitorProps> = ({
  node,
  camIndex,
  treatment,
  timeString,
  isFocused,
  onToggleFocus,
  onInspect,
  onGlideOnCanvas,
  onEmergencyKill,
  onReconnect
}) => {
  const [pulseVal, setPulseVal] = useState(14);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Dynamic live pulse for camera feeds
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseVal(Math.floor(Math.random() * 12) + 10);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const isCritical = node.riskLevel === 'critical';
  const isHigh = node.riskLevel === 'high';
  const camTag = String(camIndex + 1).padStart(2, '0');

  return (
    <div
      className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-2xl relative transition-all duration-300 select-none group ${
        isFocused ? 'col-span-full row-span-2' : ''
      } ${
        isCritical
          ? 'bg-[#0a0507] border-rose-500/50 shadow-rose-950/40'
          : 'bg-[#070b12] border-white/15 hover:border-amber-500/50 shadow-black/80'
      }`}
      style={{
        boxShadow: isCritical
          ? '0 10px 40px rgba(239, 68, 68, 0.18), inset 0 0 30px rgba(0, 0, 0, 0.9)'
          : '0 10px 30px rgba(0, 0, 0, 0.8), inset 0 0 25px rgba(0, 0, 0, 0.9)'
      }}
    >
      {/* Physical CCTV Monitor Top Metal Bezel */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2.5">
          {/* Blinking REC indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-white/10">
            <div className={`w-2 h-2 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : 'bg-rose-500 animate-pulse'}`} />
            <span className="text-[10px] font-extrabold text-rose-400">REC</span>
          </div>

          <span className="font-extrabold text-white text-[11px] tracking-wide">
            CAM-{camTag} [{node.chain.toUpperCase()} // {node.app.toUpperCase()}]
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="text-amber-400 font-bold hidden sm:inline">60 FPS</span>
          <span className="text-slate-500 hidden sm:inline">&bull;</span>
          <span className="text-cyan-400 font-semibold">{pulseVal}ms</span>
          <span className="text-slate-500">&bull;</span>
          <span className="text-slate-300 font-mono">{timeString.slice(11, 19)}</span>

          <button
            onClick={onToggleFocus}
            className="p-1 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 transition-colors ml-1"
            title={isFocused ? 'Restore Grid View' : 'Focus CAM Fullscreen'}
          >
            {isFocused ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Screen Display Area (Inner CRT Lens with Scanlines & Exposure Effects) */}
      <div className="relative p-4 flex-1 flex flex-col justify-between min-h-[220px] bg-[#03060a] overflow-hidden">
        {/* Subtle Scanline Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] z-10"
        />

        {/* Night-vision or Chroma Glow Tint */}
        {treatment === 'monochrome' && (
          <div className="absolute inset-0 pointer-events-none bg-emerald-950/20 mix-blend-color z-10" />
        )}
        {treatment === 'exposure' && (
          <div className="absolute inset-0 pointer-events-none bg-amber-950/15 mix-blend-color z-10" />
        )}

        {isCritical ? (
          /* NO SIGNAL / GLITCH VIEW */
          <NoSignalGlitch
            node={node}
            onReconnect={onReconnect}
            onEmergencyKill={onEmergencyKill}
          />
        ) : (
          /* ACTIVE LIVE CCTV FEED VIEW */
          <div className="relative z-20 flex flex-col justify-between h-full gap-4">
            {/* Asset Header Information */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                    {node.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                    <span>{node.strategy || `${node.category} Asset`}</span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="font-extrabold text-base text-white">
                  <NumberFlip value={node.valueUsd} prefix="$" />
                </div>
                {node.pnl24hUsd !== undefined && (
                  <div className={`text-[10px] font-bold ${node.pnl24hUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {node.pnl24hUsd >= 0 ? '+' : ''}${Math.abs(node.pnl24hUsd).toLocaleString()} ({node.pnlPercent}%)
                  </div>
                )}
              </div>
            </div>

            {/* CCTV Telemetry Grid */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/80 border border-white/10 font-mono text-xs shadow-inner">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-semibold uppercase">Net Yield</span>
                <span className="font-bold text-emerald-400 mt-0.5">
                  {node.apy !== undefined ? `+${node.apy}% APY` : '0.00%'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-semibold uppercase">Health Factor</span>
                <span className={`font-bold mt-0.5 ${
                  (node.healthFactor || 99) < 1.3 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {node.healthFactor ? node.healthFactor.toFixed(2) : '3.50 [SAFE]'}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-semibold uppercase">Oracle Feed</span>
                <span className="font-bold text-cyan-400 mt-0.5 truncate">
                  {node.oracleProvider?.split(' ')[0] || 'Pyth Feed'}
                </span>
              </div>
            </div>

            {/* Live Visual Waveform / Activity Stream */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-black/50 border border-white/5 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>ORACLE HEARTBEAT: <strong className="text-cyan-300">SUB-SECOND (SYNCED)</strong></span>
              </div>
              <span className="text-emerald-400 font-bold">INTEGRITY: 99.8%</span>
            </div>
          </div>
        )}
      </div>

      {/* Monitor Bottom Control Bar */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-white/10 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SECURITY: <strong className="text-slate-300">MEV SHIELDED</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGlideOnCanvas}
            className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-white/10 flex items-center gap-1 transition-all text-[11px]"
            title="Locate & Glide Camera on 2D Infinite Canvas"
          >
            <Orbit className="w-3 h-3" />
            <span className="hidden sm:inline">Glide Cam</span>
          </button>

          <button
            onClick={onInspect}
            className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] shadow transition-all"
          >
            Inspect
          </button>
        </div>
      </div>
    </div>
  );
};
