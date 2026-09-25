import React, { useState, useEffect } from 'react';
import { CanvasNode, PositionExitRoute } from '../../types';
import { ExposureGridShader, ExposureGridTreatment } from './ExposureGridShader';
import { NoSignalGlitch } from './NoSignalGlitch';
import { NumberFlip } from '../morph/NumberFlip';
import { 
  Camera, 
  Eye, 
  Maximize2, 
  Minimize2, 
  Radio, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Zap, 
  Sliders, 
  LayoutGrid, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

interface ExposureGridFeedProps {
  nodes: CanvasNode[];
  onInspectNode: (node: CanvasNode) => void;
  onFocusNodeOnCanvas: (node: CanvasNode) => void;
  onEmergencyKill: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const ExposureGridFeed: React.FC<ExposureGridFeedProps> = ({
  nodes,
  onInspectNode,
  onFocusNodeOnCanvas,
  onEmergencyKill
}) => {
  const [treatment, setTreatment] = useState<ExposureGridTreatment>('chroma');
  const [gridCols, setGridCols] = useState<number>(3);
  const [focusedCamId, setFocusedCamId] = useState<string | null>(null);
  const [timeString, setTimeString] = useState<string>('');
  const [reconnectingIds, setReconnectingIds] = useState<string[]>([]);

  // Live UTC Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReconnect = (id: string) => {
    setReconnectingIds(prev => [...prev, id]);
    setTimeout(() => {
      setReconnectingIds(prev => prev.filter(item => item !== id));
    }, 1500);
  };

  const activeNodes = nodes.filter(n => n.riskLevel !== 'critical' || reconnectingIds.includes(n.id));
  const noSignalNodes = nodes.filter(n => n.riskLevel === 'critical' && !reconnectingIds.includes(n.id));

  // If a single camera is focused full screen
  const displayNodes = focusedCamId
    ? nodes.filter(n => n.id === focusedCamId)
    : nodes;

  return (
    <div className="absolute inset-0 z-30 pt-20 px-4 md:px-8 pb-8 overflow-y-auto bg-[#05070a] text-slate-200 font-mono select-none animate-morph-rise flex flex-col items-center">
      {/* Background SolaceUI Exposure Grid Shader */}
      <ExposureGridShader
        treatment={treatment}
        columns={gridCols}
        rows={gridCols}
        className="fixed inset-0 w-full h-full opacity-35 pointer-events-none -z-10"
      />

      <div className="w-full max-w-7xl flex flex-col gap-4">
        {/* Surveillance Control Header */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-2xl bg-slate-950/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wider">
                  CCTV SURVEILLANCE // EXPOSURE GRID
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  ● LIVE FEED
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeNodes.length} CHANNELS ONLINE &bull; {noSignalNodes.length} NO SIGNAL / RISK ALERT &bull; TIME: {timeString}
              </span>
            </div>
          </div>

          {/* Camera Controls & Shader Treatments */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Treatment Selector */}
            <div className="inline-flex p-1 rounded-xl bg-black/60 border border-white/10">
              <button
                onClick={() => setTreatment('chroma')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  treatment === 'chroma' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Chroma Optical Separation"
              >
                Chroma
              </button>
              <button
                onClick={() => setTreatment('exposure')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  treatment === 'exposure' ? 'bg-amber-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Dynamic Exposure Shifts"
              >
                Exposure
              </button>
              <button
                onClick={() => setTreatment('monochrome')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  treatment === 'monochrome' ? 'bg-emerald-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Night-Vision CCTV Monochrome"
              >
                Night-Vision
              </button>
            </div>

            {/* Grid Density */}
            <div className="inline-flex p-1 rounded-xl bg-black/60 border border-white/10">
              <button
                onClick={() => setGridCols(2)}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  gridCols === 2 ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2x2
              </button>
              <button
                onClick={() => setGridCols(3)}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  gridCols === 3 ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                3x3
              </button>
            </div>

            {focusedCamId && (
              <button
                onClick={() => setFocusedCamId(null)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold flex items-center gap-1 shadow"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Show All CAMs</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Camera Feeds Grid */}
        <div 
          className={`grid gap-4 ${
            focusedCamId 
              ? 'grid-cols-1' 
              : gridCols === 2 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {displayNodes.map((node, index) => {
            const isNoSignal = node.riskLevel === 'critical' && !reconnectingIds.includes(node.id);
            const camNumber = String(index + 1).padStart(2, '0');

            return (
              <div
                key={node.id}
                className={`glass-panel rounded-2xl border flex flex-col justify-between overflow-hidden shadow-2xl relative transition-all group ${
                  isNoSignal
                    ? 'border-rose-500/60 bg-rose-950/20 shadow-rose-500/20'
                    : 'border-white/15 bg-slate-950/85 hover:border-amber-500/50'
                }`}
              >
                {/* CCTV Top Header Bar */}
                <div className="p-3 bg-black/80 border-b border-white/10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isNoSignal ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className="font-extrabold text-white text-[11px]">
                      CAM-{camNumber} [{node.chain.toUpperCase()} // {node.app.toUpperCase()}]
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="text-amber-400 font-bold">60 FPS</span>
                    <span>&bull;</span>
                    <span>{timeString.slice(11, 19)}</span>
                    <button
                      onClick={() => setFocusedCamId(focusedCamId === node.id ? null : node.id)}
                      className="p-1 rounded bg-white/5 hover:bg-white/20 text-slate-300 ml-1"
                      title={focusedCamId === node.id ? "Exit Fullscreen" : "Fullscreen CAM"}
                    >
                      {focusedCamId === node.id ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* CCTV Feed Content View */}
                <div className="p-4 flex-1 flex flex-col justify-between min-h-[190px] relative">
                  {isNoSignal ? (
                    <NoSignalGlitch
                      node={node}
                      onReconnect={() => handleReconnect(node.id)}
                      onEmergencyKill={onEmergencyKill}
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Live Asset Information */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-1.5 rounded-lg bg-black/40 border border-white/10">
                            {node.icon}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-extrabold text-xs text-white group-hover:text-amber-300 transition-colors">
                              {node.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {node.strategy || `${node.category} Position`}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-extrabold text-sm text-white">
                            <NumberFlip value={node.valueUsd} prefix="$" />
                          </div>
                          {node.apy !== undefined && (
                            <div className="text-[10px] font-bold text-emerald-400">
                              +{node.apy}% APY
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CCTV Live Metrics Radar */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/50 border border-white/5 text-[11px] font-mono">
                        <div>
                          <span className="text-[9px] text-slate-500 uppercase">Health</span>
                          <div className={`font-bold mt-0.5 ${
                            (node.healthFactor || 99) < 1.3 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {node.healthFactor ? node.healthFactor.toFixed(2) : '3.50 [SAFE]'}
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-500 uppercase">Oracle</span>
                          <div className="font-bold text-cyan-400 mt-0.5 truncate">
                            {node.oracleProvider?.split(' ')[0] || 'Pyth Feed'}
                          </div>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-500 uppercase">24h Net</span>
                          <div className={`font-bold mt-0.5 ${(node.pnl24hUsd || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {(node.pnl24hUsd || 0) >= 0 ? '+' : ''}${Math.abs(node.pnl24hUsd || 0).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CCTV Bottom Camera Footer */}
                <div className="p-2.5 bg-black/60 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FEED STATUS: <strong className="text-emerald-400">STREAMING</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onFocusNodeOnCanvas(node)}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-white/10 flex items-center gap-1 transition-all"
                    >
                      <span>Glide Cam</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onInspectNode(node)}
                      className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
