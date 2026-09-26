import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { CanvasNode, PositionExitRoute, LensConfig } from '../../types';
import { GraphRenderer } from '../../engine/graphRenderer';
import { DEFAULT_LENS_CONFIG } from '../../data/mockData';
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

export interface CctvSettings {
  columns: number;
  rows: number;
  treatment: ExposureGridTreatment;
}

interface ExposureGridFeedProps {
  nodes: CanvasNode[];
  config?: LensConfig;
  /** Controlled so MCP agents can drive the matrix remotely. */
  settings: CctvSettings;
  onChangeSettings: (patch: Partial<CctvSettings>) => void;
  onInspectNode: (node: CanvasNode) => void;
  onFocusNodeOnCanvas: (node: CanvasNode) => void;
  onEmergencyKill: (node: CanvasNode, route: PositionExitRoute) => void;
}

export const ExposureGridFeed: React.FC<ExposureGridFeedProps> = ({
  nodes,
  config,
  settings,
  onChangeSettings,
  onInspectNode,
  onFocusNodeOnCanvas,
  onEmergencyKill
}) => {
  const treatment = settings.treatment;
  const gridCols = settings.columns;
  const gridRows = settings.rows;
  const setTreatment = (t: ExposureGridTreatment) => onChangeSettings({ treatment: t });
  const [selectedCellNode, setSelectedCellNode] = useState<CanvasNode | null>(null);
  const [timeString, setTimeString] = useState<string>('');
  const [reconnectingIds, setReconnectingIds] = useState<string[]>([]);
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);
  const isLight = config?.themeMode === 'light';

  // Offscreen composite canvas that feeds SolaceUI shader. Its backing store is
  // kept identical to the shader surface so every painted cell lands exactly
  // inside one shader grid cell (no cover-crop drift).
  const compositeCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const noiseCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const animFrameRef = useRef<number>(0);
  const torusAngleRef = useRef<number>(0);
  // Reuse the spatial canvas renderer so each camera frame is a real canvas shot.
  const cardRendererRef = useRef<GraphRenderer>(new GraphRenderer());
  const [surface, setSurface] = useState<{ w: number; h: number }>({ w: 1920, h: 1080 });
  // CCTV monitors are always dark-room optics regardless of app theme.
  const cardConfig = useMemo(() => ({ ...(config ?? DEFAULT_LENS_CONFIG), themeMode: 'dark' as const }), [config]);

  const handleSurfaceResize = useCallback((w: number, h: number) => {
    setSurface(prev => (prev.w === w && prev.h === h ? prev : { w, h }));
  }, []);

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

  const slotCount = gridCols * gridRows;
  // One grid cell == one canvas node. Unassigned cells are dead cameras.
  const slotNodes = useMemo<(CanvasNode | null)[]>(() => {
    const live = gridCols * gridRows;
    return Array.from({ length: live }, (_, i) => nodes[i] ?? null);
  }, [nodes, gridCols, gridRows]);

  const liveSlots = useMemo(
    () => slotNodes.map(n => !!n && (n.riskLevel !== 'critical' || reconnectingIds.includes(n.id))),
    [slotNodes, reconnectingIds]
  );
  const activeCount = liveSlots.filter(Boolean).length;
  const noSignalCount = slotCount - activeCount;

  // Render multi-camera feeds onto the offscreen composite canvas
  useEffect(() => {
    const compositeCanvas = compositeCanvasRef.current;
    compositeCanvas.width = Math.max(1, surface.w);
    compositeCanvas.height = Math.max(1, surface.h);
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    const noiseCanvas = noiseCanvasRef.current;
    noiseCanvas.width = 128;
    noiseCanvas.height = 72;
    const noiseCtx = noiseCanvas.getContext('2d');
    const noiseFrame = noiseCtx?.createImageData(noiseCanvas.width, noiseCanvas.height);

    let lastTime = performance.now();
    // Cards are static; only the dead-camera static needs motion. Repaint at
    // 12fps so the shader samples a stable texture instead of a jittering one.
    const hasDeadCamera = liveSlots.some(v => !v) || slotNodes.some(n => !n);
    const minFrameMs = hasDeadCamera ? 1000 / 12 : 1000 / 4;
    let lastPaint = 0;

    const renderComposite = (time: number) => {
      animFrameRef.current = requestAnimationFrame(renderComposite);
      if (time - lastPaint < minFrameMs) return;
      lastPaint = time;
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      torusAngleRef.current += dt * 1.5;

      // Regenerate TV static once per frame, shared by every dead camera.
      if (noiseCtx && noiseFrame) {
        const data = noiseFrame.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = (Math.random() * 255) | 0;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
          data[i + 3] = 255;
        }
        noiseCtx.putImageData(noiseFrame, 0, 0);
      }

      const w = compositeCanvas.width;
      const h = compositeCanvas.height;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#060910';
      ctx.fillRect(0, 0, w, h);

      const cols = gridCols;
      const rows = gridRows;
      const cellW = w / cols;
      const cellH = h / rows;
      // Type scale relative to a 640x360 reference camera frame.
      const s = Math.max(0.5, Math.min(cellW / 640, cellH / 360));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          const node = slotNodes[index] ?? null;
          const camTag = String(index + 1).padStart(2, '0');

          ctx.save();
          ctx.beginPath();
          ctx.rect(c * cellW, r * cellH, cellW, cellH);
          ctx.clip();
          ctx.translate(c * cellW, r * cellH);

          if (!liveSlots[index] || !node) {
            // ── NO SIGNAL CELL: empty channel or oracle desync ──
            ctx.fillStyle = '#0a0305';
            ctx.fillRect(0, 0, cellW, cellH);

            const barH = 20 * s;
            const barColors = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
            const barW = cellW / barColors.length;
            barColors.forEach((color, bi) => {
              ctx.fillStyle = color;
              ctx.fillRect(bi * barW, 0, barW, barH);
            });

            ctx.globalAlpha = 0.4;
            ctx.drawImage(noiseCanvas, 0, barH, cellW, cellH - barH);
            ctx.globalAlpha = 1;

            const bannerH = 46 * s;
            ctx.fillStyle = node ? 'rgba(239, 68, 68, 0.85)' : 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(18 * s, cellH / 2 - bannerH * 0.78, cellW - 36 * s, bannerH);
            ctx.font = `800 ${17 * s}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              node ? 'NO SIGNAL // ORACLE DESYNC' : 'NO SIGNAL // NO CANVAS NODE',
              cellW / 2,
              cellH / 2 - bannerH * 0.28
            );

            ctx.font = `700 ${12 * s}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = node ? '#fecaca' : '#94a3b8';
            if (node) {
              ctx.fillText(`CAM-${camTag}: ${node.title.toUpperCase()}`, cellW / 2, cellH / 2 + 32 * s);
              ctx.fillText(
                `LIQ DISTANCE: -${node.liquidationDistancePct?.toFixed(1) || '8.3'}%`,
                cellW / 2,
                cellH / 2 + 52 * s
              );
            } else {
              ctx.fillText(`CAM-${camTag}: CHANNEL UNASSIGNED`, cellW / 2, cellH / 2 + 32 * s);
              ctx.fillText('ADD A CANVAS POSITION TO BIND FEED', cellW / 2, cellH / 2 + 52 * s);
            }
          } else {
            // ── ACTIVE SURVEILLANCE FEED CELL ──
            const grad = ctx.createLinearGradient(0, 0, 0, cellH);
            grad.addColorStop(0, '#0a101d');
            grad.addColorStop(1, '#050810');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, cellW, cellH);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            for (let sy = 0; sy < cellH; sy += 4) {
              ctx.fillRect(0, sy, cellW, 1.5);
            }

            const headerH = 32 * s;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            ctx.fillRect(0, 0, cellW, headerH);

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(20 * s, headerH / 2, 4.5 * s, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = `800 ${11 * s}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = '#f87171';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('REC', 31 * s, headerH / 2);

            ctx.font = `700 ${11 * s}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(
              `CAM-${camTag} [${node.chain.toUpperCase()} // ${node.app.toUpperCase()}]`,
              64 * s,
              headerH / 2
            );

            ctx.font = `600 ${10 * s}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'right';
            ctx.fillText('60 FPS  1/120s', cellW - 16 * s, headerH / 2);
            // ── CAMERA SHOT OF THE SPATIAL CANVAS CARD ──
            // Same renderer the canvas view uses. Drawn at fixed pixel offsets:
            // any sub-pixel pan makes the text shimmer through the shader.
            const frameX = Math.round(10 * s);
            const frameTop = Math.round(headerH + 8 * s);
            const footerH = 24 * s;
            const frameW = Math.round(cellW - frameX * 2);
            const frameH = Math.round(cellH - frameTop - footerH - 8 * s);

            ctx.save();
            ctx.beginPath();
            ctx.rect(frameX, frameTop, frameW, frameH);
            ctx.clip();
            cardRendererRef.current.renderNodeCard(
              ctx,
              node,
              frameX,
              frameTop,
              frameW,
              frameH,
              cardConfig,
              false
            );
            ctx.restore();

            // Camera reticle corners over the shot
            const tick = 12 * s;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
            ctx.lineWidth = Math.max(1, 1.5 * s);
            ctx.beginPath();
            ctx.moveTo(frameX, frameTop + tick); ctx.lineTo(frameX, frameTop); ctx.lineTo(frameX + tick, frameTop);
            ctx.moveTo(frameX + frameW - tick, frameTop); ctx.lineTo(frameX + frameW, frameTop); ctx.lineTo(frameX + frameW, frameTop + tick);
            ctx.moveTo(frameX, frameTop + frameH - tick); ctx.lineTo(frameX, frameTop + frameH); ctx.lineTo(frameX + tick, frameTop + frameH);
            ctx.moveTo(frameX + frameW - tick, frameTop + frameH); ctx.lineTo(frameX + frameW, frameTop + frameH); ctx.lineTo(frameX + frameW, frameTop + frameH - tick);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, cellH - footerH, cellW, footerH);
            ctx.font = `700 ${9 * s}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = node.riskLevel === 'critical' ? '#f87171' : '#4ade80';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              `● ORACLE STREAM: LOCKED • RISK ${node.riskLevel.toUpperCase()}`,
              12 * s,
              cellH - footerH / 2
            );
            ctx.fillStyle = '#94a3b8';
            ctx.textAlign = 'right';
            ctx.fillText(`${node.chain.toUpperCase()} NETWORK • LATENCY 14ms`, cellW - 12 * s, cellH - footerH / 2);
          }

          ctx.restore();
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(renderComposite);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [slotNodes, liveSlots, gridCols, gridRows, surface, cardConfig]);

  const handleCellClick = (col: number, row: number) => {
    const index = row * gridCols + col;
    const node = slotNodes[index];
    if (!node) return;
    if (!liveSlots[index]) {
      handleReconnect(node.id);
      return;
    }
    setSelectedCellNode(node);
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
                onClick={() => onChangeSettings({ columns: 2, rows: 2 })}
                className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                  gridCols === 2 
                    ? (isLight ? 'bg-white text-slate-950 shadow-sm font-extrabold' : 'bg-white/20 text-white') 
                    : (isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white')
                }`}
              >
                2x2
              </button>
              <button
                onClick={() => onChangeSettings({ columns: 3, rows: 3 })}
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
            onCellHover={setHoverCell}
            fit="fill"
            onSurfaceResize={handleSurfaceResize}
            className="w-full h-full block cursor-crosshair"
          />

          {/* Hovered camera: highlight + in-frame actions */}
          {hoverCell && (() => {
            const idx = hoverCell.row * gridCols + hoverCell.col;
            const node = slotNodes[idx] ?? null;
            const live = liveSlots[idx];
            return (
              <div
                className="absolute pointer-events-none z-20"
                style={{
                  left: `${(hoverCell.col / gridCols) * 100}%`,
                  top: `${(hoverCell.row / gridRows) * 100}%`,
                  width: `${100 / gridCols}%`,
                  height: `${100 / gridRows}%`
                }}
                onMouseLeave={() => setHoverCell(null)}
              >
                <div className={`absolute inset-1 rounded-lg border-2 transition-colors ${
                  node ? (live ? 'border-cyan-400/70' : 'border-rose-500/70') : 'border-slate-500/50'
                }`} />

                {/* Bottom-row cells flip the toolbar to the top so the tip bar
                    never swallows the buttons. */}
                <div className={`absolute left-2 right-2 flex flex-wrap items-center gap-1.5 pointer-events-auto ${
                  hoverCell.row === gridRows - 1 ? 'top-9' : 'bottom-2'
                }`}>
                  {!node && (
                    <span className="px-2 py-1 rounded-md bg-black/80 border border-slate-600 text-[10px] font-bold text-slate-300">
                      CHANNEL UNASSIGNED
                    </span>
                  )}
                  {node && !live && (
                    <button
                      onClick={() => handleReconnect(node.id)}
                      className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow"
                    >
                      <RefreshCw className="w-3 h-3" /> RECONNECT
                    </button>
                  )}
                  {node && live && (
                    <>
                      <button
                        onClick={() => onInspectNode(node)}
                        className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow"
                      >
                        <Eye className="w-3 h-3" /> INSPECT
                      </button>
                      <button
                        onClick={() => onFocusNodeOnCanvas(node)}
                        className="px-2.5 py-1 rounded-md bg-black/85 hover:bg-white/15 border border-white/20 text-slate-100 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" /> CANVAS
                      </button>
                      <button
                        onClick={() => setSelectedCellNode(node)}
                        className="px-2.5 py-1 rounded-md bg-black/85 hover:bg-white/15 border border-white/20 text-slate-100 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        <Layers className="w-3 h-3" /> DETAILS
                      </button>
                      {node.riskLevel === 'critical' && node.exitRoutes?.[0] && (
                        <button
                          onClick={() => onEmergencyKill(node, node.exitRoutes![0])}
                          className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow"
                        >
                          <Zap className="w-3 h-3 fill-white" /> KILL
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Prompt Tip */}
          <div className={`absolute bottom-3 left-4 z-10 pointer-events-none text-[10px] text-cyan-300/80 font-mono bg-black/70 px-3 py-1 rounded-md border border-cyan-500/30 transition-opacity duration-150 ${hoverCell ? 'opacity-0' : 'opacity-100'}`}>
            <strong>SolaceUI Interaction:</strong> Hover a cell for inline actions &bull; Click a live cell to inspect &bull; Click a dead cell to reconnect &bull; MCP agents can drive this view
          </div>
        </div>

        {/* Selected Cell Node Action Drawer */}
        {selectedCellNode && (
          <div className={`glass-panel p-4 rounded-xl border flex items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-150 mb-16 shrink-0 ${
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
