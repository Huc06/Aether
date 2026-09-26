import React, { useState, useEffect, useRef } from 'react';
import { CanvasNode, PositionExitRoute, LensConfig } from '../../types';
import { 
  ExposureGridRenderer, 
  ExposureGridTreatment 
} from './ExposureGridShader';
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
  Layers, 
  ChevronRight, 
  ExternalLink,
  X
} from 'lucide-react';

interface ExposureGridFeedProps {
  nodes: CanvasNode[];
  config?: LensConfig;
  onInspectNode: (node: CanvasNode) => void;
  onFocusNodeOnCanvas: (node: CanvasNode) => void;
  onEmergencyKill: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const ExposureGridFeed: React.FC<ExposureGridFeedProps> = ({
  nodes,
  config,
  onInspectNode,
  onFocusNodeOnCanvas,
  onEmergencyKill
}) => {
  const [treatment, setTreatment] = useState<ExposureGridTreatment>('chroma');
  const [gridCols, setGridCols] = useState<number>(3);
  const [gridRows, setGridRows] = useState<number>(3);
  const [selectedCellNode, setSelectedCellNode] = useState<CanvasNode | null>(null);
  const [timeString, setTimeString] = useState<string>('');
  const [reconnectingIds, setReconnectingIds] = useState<string[]>([]);
  const isLight = config?.themeMode === 'light';

  // Offscreen composite canvas that feeds SolaceUI shader
  const compositeCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const animFrameRef = useRef<number>(0);
  const torusAngleRef = useRef<number>(0);
  const noiseTimeRef = useRef<number>(0);

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
    }, 1800);
  };

  const activeCount = nodes.filter(n => n.riskLevel !== 'critical' || reconnectingIds.includes(n.id)).length;
  const noSignalCount = nodes.filter(n => n.riskLevel === 'critical' && !reconnectingIds.includes(n.id)).length;

  // Render multi-camera feeds onto the offscreen composite canvas
  useEffect(() => {
    const compositeCanvas = compositeCanvasRef.current;
    compositeCanvas.width = 1920;
    compositeCanvas.height = 1080;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const renderComposite = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      torusAngleRef.current += dt * 1.5;
      noiseTimeRef.current += dt * 8;

      const w = compositeCanvas.width;
      const h = compositeCanvas.height;

      // Clear composite background
      ctx.fillStyle = '#060910';
      ctx.fillRect(0, 0, w, h);

      const cols = gridCols;
      const rows = gridRows;
      const cellW = w / cols;
      const cellH = h / rows;

      // Render each camera node into its grid cell
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          const node = nodes[index % nodes.length];
          const cellX = c * cellW;
          const cellY = r * cellH;

          ctx.save();
          ctx.beginPath();
          ctx.rect(cellX, cellY, cellW, cellH);
          ctx.clip();

          const isNoSignal = node.riskLevel === 'critical' && !reconnectingIds.includes(node.id);
          const camTag = String(index + 1).padStart(2, '0');

          if (isNoSignal) {
            // ── NO SIGNAL GLITCH CAMERA CELL ──
            ctx.fillStyle = '#0a0305';
            ctx.fillRect(cellX, cellY, cellW, cellH);

            // SMPTE Color Bars at top
            const barH = 22;
            const barColors = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
            const barW = cellW / barColors.length;
            barColors.forEach((color, bi) => {
              ctx.fillStyle = color;
              ctx.fillRect(cellX + bi * barW, cellY, barW, barH);
            });

            // TV Static Noise generator
            const noiseW = Math.floor(cellW / 4);
            const noiseH = Math.floor(cellH / 4);
            const imgData = ctx.createImageData(noiseW, noiseH);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
              const gray = Math.floor(Math.random() * 255);
              data[i] = gray;
              data[i + 1] = gray;
              data[i + 2] = gray;
              data[i + 3] = 90;
            }
            ctx.putImageData(imgData, cellX / 4, (cellY + barH) / 4);
            // Re-scale noise
            ctx.drawImage(compositeCanvas, cellX / 4, (cellY + barH) / 4, noiseW, noiseH, cellX, cellY + barH, cellW, cellH - barH);

            // Flashing Red Alert Badge
            ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
            ctx.fillRect(cellX + 20, cellY + cellH / 2 - 30, cellW - 40, 48);
            ctx.font = "800 18px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('NO SIGNAL // ORACLE DESYNC', cellX + cellW / 2, cellY + cellH / 2 - 6);

            ctx.font = "700 14px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#fecaca';
            ctx.fillText(`CAM-${camTag}: ${node.title.toUpperCase()}`, cellX + cellW / 2, cellY + cellH / 2 + 35);
            ctx.fillText(`LIQ DISTANCE: -${node.liquidationDistancePct?.toFixed(1) || '8.3'}%`, cellX + cellW / 2, cellY + cellH / 2 + 55);

          } else {
            // ── ACTIVE SURVEILLANCE FEED CELL ──
            // Dark gradient card background
            const grad = ctx.createLinearGradient(cellX, cellY, cellX, cellY + cellH);
            grad.addColorStop(0, '#0a101d');
            grad.addColorStop(1, '#050810');
            ctx.fillStyle = grad;
            ctx.fillRect(cellX, cellY, cellW, cellH);

            // CRT Scanlines
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            for (let sy = cellY; sy < cellY + cellH; sy += 4) {
              ctx.fillRect(cellX, sy, cellW, 1.5);
            }

            // Top CCTV Metadata Header
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(cellX, cellY, cellW, 36);

            // Blinking REC Red Dot
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cellX + 24, cellY + 18, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = "800 12px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#f87171';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('REC', cellX + 36, cellY + 18);

            ctx.font = "700 12px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`CAM-${camTag} [${node.chain.toUpperCase()} // ${node.app.toUpperCase()}]`, cellX + 75, cellY + 18);

            ctx.font = "600 11px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'right';
            ctx.fillText('60 FPS  1/120s', cellX + cellW - 20, cellY + 18);

            // Middle Asset Metrics & Visuals
            const pad = 24;
            const contentY = cellY + 55;

            ctx.textAlign = 'left';
            ctx.font = "800 24px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`$${node.valueUsd.toLocaleString()}`, cellX + pad, contentY + 20);

            if (node.pnl24hUsd !== undefined) {
              const pnlPos = node.pnl24hUsd >= 0;
              ctx.font = "700 13px 'JetBrains Mono', monospace";
              ctx.fillStyle = pnlPos ? '#4ade80' : '#f87171';
              ctx.textAlign = 'right';
              ctx.fillText(
                `${pnlPos ? '+' : ''}$${Math.abs(node.pnl24hUsd).toLocaleString()} (${pnlPos ? '+' : ''}${node.pnlPercent}%)`,
                cellX + cellW - pad,
                contentY + 20
              );
            }

            // Asset Title & Category
            ctx.textAlign = 'left';
            ctx.font = "700 14px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#e2e8f0';
            ctx.fillText(node.title, cellX + pad, contentY + 55);

            // Telemetry Box
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.roundRect(cellX + pad, contentY + 80, cellW - pad * 2, 70, 8);
            ctx.fill();

            // Telemetry Keys
            ctx.font = "600 11px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('NET YIELD (APY):', cellX + pad + 14, contentY + 105);
            ctx.fillStyle = '#4ade80';
            ctx.fillText(`${node.apy !== undefined ? node.apy + '%' : '18.4%'}`, cellX + pad + 140, contentY + 105);

            ctx.fillStyle = '#94a3b8';
            ctx.fillText('HEALTH FACTOR:', cellX + pad + 14, contentY + 130);
            ctx.fillStyle = node.healthFactor && node.healthFactor < 1.3 ? '#f59e0b' : '#38bdf8';
            ctx.fillText(`${node.healthFactor ? node.healthFactor.toFixed(2) : '2.85 [SAFE]'}`, cellX + pad + 140, contentY + 130);

            // Sub-second Live Waveform Animation
            const waveY = contentY + 175;
            ctx.strokeStyle = '#06b6d4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let wx = cellX + pad; wx < cellX + cellW - pad; wx += 6) {
              const relX = (wx - cellX) * 0.08;
              const wy = waveY + Math.sin(relX + torusAngleRef.current * 3 + index) * 12;
              if (wx === cellX + pad) ctx.moveTo(wx, wy);
              else ctx.lineTo(wx, wy);
            }
            ctx.stroke();

            // Bottom Status Bar
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(cellX, cellY + cellH - 30, cellW, 30);
            ctx.font = "700 10px 'JetBrains Mono', monospace";
            ctx.fillStyle = '#4ade80';
            ctx.textAlign = 'left';
            ctx.fillText('● ORACLE STREAM: LOCKED', cellX + pad, cellY + cellH - 10);
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'right';
            ctx.fillText(`${node.chain.toUpperCase()} NETWORK &bull; LATENCY 14ms`, cellX + cellW - pad, cellY + cellH - 10);
          }

          ctx.restore();
        }
      }

      animFrameRef.current = requestAnimationFrame(renderComposite);
    };

    animFrameRef.current = requestAnimationFrame(renderComposite);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [nodes, gridCols, gridRows, reconnectingIds]);

  const handleCellClick = (col: number, row: number) => {
    const index = row * gridCols + col;
    if (index < nodes.length) {
      const node = nodes[index];
      setSelectedCellNode(node);
    }
  };

  return (
    <div className={`absolute inset-0 z-30 pt-[78px] sm:pt-[84px] md:pt-[92px] px-3 sm:px-4 md:px-8 pb-4 overflow-hidden font-mono select-none animate-morph-rise flex flex-col items-center transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#04070c] text-slate-200'
    }`}>
      <div className="w-full max-w-7xl h-full flex flex-col gap-2.5">
        {/* Surveillance Control Sub-Header */}
        <div className={`glass-panel px-4 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-xl shrink-0 ${
          isLight ? 'bg-white/95 border-slate-300 shadow-md text-slate-900' : 'bg-slate-950/90 border-white/10'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <div className="flex items-center gap-2">
              <span className={`font-extrabold text-xs tracking-wider ${isLight ? 'text-slate-950' : 'text-white'}`}>
                CCTV MATRIX STREAM
              </span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${
                isLight ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                ● {gridCols * gridRows}-CAM
              </span>
            </div>
            <span className={`text-[10px] font-mono font-semibold hidden sm:inline ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              &bull; {activeCount} Online &bull; {noSignalCount} No Signal &bull; {timeString}
            </span>
          </div>

          {/* SolaceUI Shader Controls */}
          <div className="flex items-center gap-2 text-xs">
            {/* Treatment Selector */}
            <div className={`inline-flex p-0.5 rounded-lg border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/60 border-white/10'
            }`}>
              <button
                onClick={() => setTreatment('chroma')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  treatment === 'chroma' 
                    ? 'bg-amber-500 text-black shadow font-extrabold' 
                    : (isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white')
                }`}
                title="Photographic Ink Separation (Chroma)"
              >
                Chroma Ink
              </button>
              <button
                onClick={() => setTreatment('exposure')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  treatment === 'exposure' 
                    ? 'bg-amber-500 text-black shadow font-extrabold' 
                    : (isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white')
                }`}
                title="Dynamic Exposure Shifts"
              >
                Exposure
              </button>
              <button
                onClick={() => setTreatment('monochrome')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  treatment === 'monochrome' 
                    ? 'bg-emerald-500 text-black shadow font-extrabold' 
                    : (isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-400 hover:text-white')
                }`}
                title="Night-Vision CCTV Monochrome"
              >
                Night-Vision
              </button>
            </div>

            {/* Grid Density */}
            <div className={`inline-flex p-0.5 rounded-lg border ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-black/60 border-white/10'
            }`}>
              <button
                onClick={() => {
                  setGridCols(2);
                  setGridRows(2);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                  gridCols === 2 
                    ? (isLight ? 'bg-white text-slate-950 shadow-sm font-extrabold' : 'bg-white/20 text-white') 
                    : (isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white')
                }`}
              >
                2x2
              </button>
              <button
                onClick={() => {
                  setGridCols(3);
                  setGridRows(3);
                }}
                className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                  gridCols === 3 
                    ? (isLight ? 'bg-white text-slate-950 shadow-sm font-extrabold' : 'bg-white/20 text-white') 
                    : (isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white')
                }`}
              >
                3x3
              </button>
            </div>
          </div>
        </div>

        {/* The Exact SolaceUI WebGL Exposure Grid Viewport */}
        <div className="flex-1 min-h-0 w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl relative bg-black">
          <ExposureGridRenderer
            sourceCanvas={compositeCanvasRef.current}
            treatment={treatment}
            columns={gridCols}
            rows={gridRows}
            onCellClick={handleCellClick}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Prompt Tip */}
          <div className="absolute bottom-3 left-4 pointer-events-none text-[10px] text-cyan-300/80 font-mono bg-black/70 px-3 py-1 rounded-md border border-cyan-500/30">
            <strong>SolaceUI Interaction:</strong> Hover pointer to zoom &amp; trigger photographic ink separation &bull; Click any cell to inspect position
          </div>
        </div>

        {/* Selected Cell Node Action Drawer */}
        {selectedCellNode && (
          <div className={`glass-panel p-4 rounded-xl border flex items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-150 ${
            isLight ? 'bg-white border-amber-500 shadow-2xl text-slate-900' : 'bg-slate-950/95 border-amber-500/50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {selectedCellNode.title}
                  </span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-extrabold border ${
                    isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {selectedCellNode.chain}
                  </span>
                </div>
                <span className={`text-xs font-mono font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Value: ${selectedCellNode.valueUsd.toLocaleString()} &bull; {selectedCellNode.strategy}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onFocusNodeOnCanvas(selectedCellNode)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-800 border-slate-300' 
                    : 'bg-white/10 hover:bg-amber-500/20 hover:text-amber-300 text-slate-200 border-white/10'
                }`}
              >
                <span>Glide on Canvas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onInspectNode(selectedCellNode)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs cursor-pointer shadow"
              >
                Inspect Detail
              </button>

              {selectedCellNode.riskLevel === 'critical' && selectedCellNode.exitRoutes && (
                <button
                  onClick={() => onEmergencyKill(selectedCellNode, selectedCellNode.exitRoutes![0])}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1 shadow-lg shadow-rose-600/40 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Kill Switch</span>
                </button>
              )}

              <button
                onClick={() => setSelectedCellNode(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900' : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
