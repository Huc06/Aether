import React, { useState, useEffect } from 'react';
import { CanvasNode, PositionExitRoute } from '../../types';
import { ExposureGridTreatment } from './ExposureGridShader';
import { CameraMonitor } from './CameraMonitor';
import { MorphTabs } from '../morph/MorphTabs';
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
  ChevronRight,
  Filter
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
  const [feedFilter, setFeedFilter] = useState<'all' | 'active' | 'nosignal'>('all');
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

  // Keyboard Shortcuts: 1..9 to Focus CAMs, Esc to un-focus
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= nodes.length) {
        setFocusedCamId(nodes[num - 1].id);
      } else if (e.key === 'Escape') {
        setFocusedCamId(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nodes]);

  const handleReconnect = (id: string) => {
    setReconnectingIds(prev => [...prev, id]);
    setTimeout(() => {
      setReconnectingIds(prev => prev.filter(item => item !== id));
    }, 1600);
  };

  const activeCount = nodes.filter(n => n.riskLevel !== 'critical' || reconnectingIds.includes(n.id)).length;
  const noSignalCount = nodes.filter(n => n.riskLevel === 'critical' && !reconnectingIds.includes(n.id)).length;

  const filteredNodes = nodes.filter(node => {
    const isNoSignal = node.riskLevel === 'critical' && !reconnectingIds.includes(node.id);
    if (feedFilter === 'active') return !isNoSignal;
    if (feedFilter === 'nosignal') return isNoSignal;
    return true;
  });

  const displayNodes = focusedCamId
    ? nodes.filter(n => n.id === focusedCamId)
    : filteredNodes;

  const feedTabs = [
    { id: 'all' as const, label: 'All Feeds', badge: nodes.length },
    { id: 'active' as const, label: 'Streaming (60 FPS)', badge: activeCount },
    { id: 'nosignal' as const, label: 'No Signal / Alerts', badge: noSignalCount > 0 ? noSignalCount : undefined }
  ];

  return (
    <div className="absolute inset-0 z-30 pt-20 px-4 md:px-8 pb-8 overflow-y-auto bg-[#04070c] text-slate-200 font-mono select-none animate-morph-rise flex flex-col items-center">
      <div className="w-full max-w-7xl flex flex-col gap-4">
        {/* Surveillance Control Header */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-2xl bg-slate-950/95 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wider">
                  CCTV SURVEILLANCE ROOM // EXPOSURE GRID
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  ● LIVE REC
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeCount} FEEDS STREAMING &bull; {noSignalCount} NO SIGNAL WARNINGS &bull; {timeString}
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
            <div className="inline-flex p-1 rounded-xl bg-black/60 border border-white/10 hidden sm:flex">
              <button
                onClick={() => {
                  setFocusedCamId(null);
                  setGridCols(2);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  gridCols === 2 && !focusedCamId ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2x2
              </button>
              <button
                onClick={() => {
                  setFocusedCamId(null);
                  setGridCols(3);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  gridCols === 3 && !focusedCamId ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'
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
                <span>Show All CAMs (Esc)</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs Bar */}
        <div className="flex items-center justify-between">
          <MorphTabs
            tabs={feedTabs}
            activeTab={feedFilter}
            onChange={setFeedFilter}
          />
          
          <span className="text-[10px] text-slate-500 font-mono hidden md:inline">
            Press keys 1..{nodes.length} to focus specific CAM &bull; Esc to reset
          </span>
        </div>

        {/* Multi-Camera Feeds Matrix */}
        <div 
          className={`grid gap-4 transition-all ${
            focusedCamId 
              ? 'grid-cols-1' 
              : gridCols === 2 
              ? 'grid-cols-1 md:grid-cols-2' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {displayNodes.map((node, index) => (
            <CameraMonitor
              key={node.id}
              node={node}
              camIndex={nodes.findIndex(n => n.id === node.id)}
              treatment={treatment}
              timeString={timeString}
              isFocused={focusedCamId === node.id}
              onToggleFocus={() => setFocusedCamId(focusedCamId === node.id ? null : node.id)}
              onInspect={() => onInspectNode(node)}
              onGlideOnCanvas={() => onFocusNodeOnCanvas(node)}
              onEmergencyKill={onEmergencyKill}
              onReconnect={() => handleReconnect(node.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
