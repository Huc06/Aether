import React, { useId, useMemo, useRef, useState, useEffect } from 'react';
import { ChartPoint } from './series';

export interface AreaChartProps {
  data: ChartPoint[];
  height?: number; // viewBox height, default 180
  color?: 'amber' | 'emerald' | 'cyan' | 'rose';
  valueFormatter?: (val: number) => string;
  isLight?: boolean;
  baseline?: number; // optional reference baseline
  showGrid?: boolean;
  className?: string;
  emptyMessage?: string;
}

const COLOR_MAP = {
  amber: {
    stroke: '#f59e0b',
    gradient: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-500',
  },
  emerald: {
    stroke: '#10b981',
    gradient: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-500',
  },
  cyan: {
    stroke: '#06b6d4',
    gradient: '#06b6d4',
    glow: 'rgba(6, 182, 212, 0.4)',
    text: 'text-cyan-500',
  },
  rose: {
    stroke: '#f43f5e',
    gradient: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    text: 'text-rose-500',
  },
};

function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  height = 180,
  color = 'amber',
  valueFormatter = (v) => `$${Math.round(v).toLocaleString()}`,
  isLight = false,
  baseline,
  showGrid = true,
  className = '',
  emptyMessage = 'NO DATA AVAILABLE',
}) => {
  const gradientId = useId().replace(/:/g, '_');
  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [pathLength, setPathLength] = useState(1000);

  const themeColors = COLOR_MAP[color];

  // Dimensions
  const viewWidth = 720;
  const padTop = 18;
  const padBottom = 28;
  const padLeft = 14;
  const padRight = 14;
  const plotWidth = viewWidth - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const { minVal, maxVal, coordinates } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minVal: 0, maxVal: 1, coordinates: [] };
    }

    const values = data.map((d) => d.value);
    if (baseline !== undefined) values.push(baseline);
    
    let rawMin = Math.min(...values);
    let rawMax = Math.max(...values);

    if (rawMin === rawMax) {
      rawMin = rawMin > 0 ? rawMin * 0.9 : -10;
      rawMax = rawMax > 0 ? rawMax * 1.1 : 10;
    }

    // Add 8% vertical breathing room
    const span = rawMax - rawMin;
    const yMin = rawMin - span * 0.08;
    const yMax = rawMax + span * 0.08;
    const ySpan = yMax - yMin || 1;

    const coords = data.map((pt, i) => {
      const x = padLeft + (i / Math.max(1, data.length - 1)) * plotWidth;
      const normalizedY = (pt.value - yMin) / ySpan;
      const y = padTop + (1 - normalizedY) * plotHeight;
      return { x, y, pt };
    });

    return { minVal: rawMin, maxVal: rawMax, coordinates: coords };
  }, [data, baseline, plotWidth, plotHeight, padLeft, padTop]);

  // Compute smooth line path and closed area path
  const { linePath, areaPath, baselineY } = useMemo(() => {
    if (coordinates.length === 0) return { linePath: '', areaPath: '', baselineY: null };

    const pts = coordinates.map((c) => ({ x: c.x, y: c.y }));
    const lPath = buildSmoothPath(pts);

    // Compute baseline or bottom for area closure
    const bottomY = padTop + plotHeight;
    const firstX = coordinates[0].x;
    const lastX = coordinates[coordinates.length - 1].x;
    const aPath = `${lPath} L ${lastX.toFixed(2)} ${bottomY.toFixed(2)} L ${firstX.toFixed(2)} ${bottomY.toFixed(2)} Z`;

    let bY: number | null = null;
    if (baseline !== undefined) {
      const span = maxVal - minVal || 1;
      const normB = (baseline - minVal) / span;
      bY = padTop + (1 - normB) * plotHeight;
    }

    return { linePath: lPath, areaPath: aPath, baselineY: bY };
  }, [coordinates, padTop, plotHeight, baseline, maxVal, minVal]);

  // Trigger draw-in animation on mount or data reset
  useEffect(() => {
    if (pathRef.current) {
      try {
        const len = pathRef.current.getTotalLength();
        if (len > 0) setPathLength(len);
      } catch {
        // fallback
      }
    }
    const timer = setTimeout(() => setIsAnimated(true), 40);
    return () => clearTimeout(timer);
  }, [data]);

  // Mouse move handler for crosshair & tooltip
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!containerRef.current || coordinates.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const clampedRelX = Math.max(0, Math.min(1, relX));
    const targetIdx = Math.round(clampedRelX * (coordinates.length - 1));
    setHoverIndex(targetIdx);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  if (!data || data.length === 0) {
    return (
      <div className={`w-full flex items-center justify-center p-8 font-mono text-xs ${isLight ? 'text-slate-400' : 'text-slate-600'} ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  const activePoint = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < coordinates.length
    ? coordinates[hoverIndex]
    : coordinates[coordinates.length - 1];

  const gridLineColor = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)';
  const crosshairColor = isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.45)';
  const labelColor = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div ref={containerRef} className={`relative w-full flex flex-col font-mono select-none ${className}`}>
      {/* Top HUD Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 mb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] uppercase font-bold tracking-wider ${labelColor}`}>
            {hoverIndex !== null ? `PT [${activePoint.pt.label}]` : `LATEST [${activePoint.pt.label}]`}
          </span>
          <span className={`text-sm sm:text-base font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {valueFormatter(activePoint.pt.value)}
          </span>
          {activePoint.pt.changePct !== undefined && (
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 border rounded-none ${
                activePoint.pt.changePct >= 0
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30'
                  : isLight
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-rose-950/50 text-rose-400 border-rose-500/30'
              }`}
            >
              {activePoint.pt.changePct >= 0 ? '+' : ''}
              {activePoint.pt.changePct.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Max / Min Legend */}
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
          <span>HIGH: {valueFormatter(maxVal)}</span>
          <span className="opacity-40">|</span>
          <span>LOW: {valueFormatter(minVal)}</span>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${viewWidth} ${height}`}
          className="w-full h-auto block cursor-crosshair overflow-visible touch-none"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <defs>
            <linearGradient id={`area-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={themeColors.gradient} stopOpacity={isLight ? 0.35 : 0.28} />
              <stop offset="65%" stopColor={themeColors.gradient} stopOpacity={isLight ? 0.12 : 0.08} />
              <stop offset="100%" stopColor={themeColors.gradient} stopOpacity="0.0" />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={themeColors.glow} />
            </filter>
          </defs>

          {/* Background Grid Lines */}
          {showGrid && (
            <g className="grid-lines" stroke={gridLineColor} strokeDasharray="3 3" strokeWidth="1">
              {/* 25%, 50%, 75% horizontal gridlines */}
              <line x1={padLeft} x2={viewWidth - padRight} y1={padTop + plotHeight * 0.25} y2={padTop + plotHeight * 0.25} />
              <line x1={padLeft} x2={viewWidth - padRight} y1={padTop + plotHeight * 0.5} y2={padTop + plotHeight * 0.5} />
              <line x1={padLeft} x2={viewWidth - padRight} y1={padTop + plotHeight * 0.75} y2={padTop + plotHeight * 0.75} />
              {/* Baseline bottom */}
              <line x1={padLeft} x2={viewWidth - padRight} y1={padTop + plotHeight} y2={padTop + plotHeight} strokeDasharray="none" />
            </g>
          )}

          {/* Reference Baseline */}
          {baselineY !== null && (
            <line
              x1={padLeft}
              x2={viewWidth - padRight}
              y1={baselineY}
              y2={baselineY}
              stroke={isLight ? 'rgba(239, 68, 68, 0.4)' : 'rgba(244, 63, 94, 0.4)'}
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
          )}

          {/* Area Fill with Fade In */}
          <path
            d={areaPath}
            fill={`url(#area-grad-${gradientId})`}
            className="transition-opacity duration-1000 ease-out"
            style={{ opacity: isAnimated ? 1 : 0 }}
          />

          {/* Main Stroke Path with Animated Dash Offset */}
          <path
            ref={pathRef}
            d={linePath}
            fill="none"
            stroke={themeColors.stroke}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: isAnimated ? 0 : pathLength,
              transition: 'stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* Hover Crosshair & Indicator Point */}
          {hoverIndex !== null && activePoint && (
            <g className="hover-crosshair pointer-events-none">
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={padTop}
                y2={padTop + plotHeight}
                stroke={crosshairColor}
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              {/* Outer pulsing ring */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="6"
                fill="none"
                stroke={themeColors.stroke}
                strokeWidth="1.5"
                opacity="0.8"
              />
              {/* Center solid dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="3.5"
                fill={themeColors.stroke}
                stroke={isLight ? '#ffffff' : '#080b11'}
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Latest Point Indicator when not hovering */}
          {hoverIndex === null && coordinates.length > 0 && (
            <g className="latest-dot pointer-events-none">
              <circle
                cx={coordinates[coordinates.length - 1].x}
                cy={coordinates[coordinates.length - 1].y}
                r="3.5"
                fill={themeColors.stroke}
                stroke={isLight ? '#ffffff' : '#080b11'}
                strokeWidth="1.5"
                filter={`url(#glow-${gradientId})`}
              />
            </g>
          )}

          {/* X-Axis Tick Labels */}
          {coordinates.length > 0 && (
            <g
              className="text-[9px] font-mono select-none"
              fill={isLight ? '#64748b' : '#64748b'}
              textAnchor="middle"
            >
              {/* First point */}
              <text x={coordinates[0].x} y={height - 8} textAnchor="start">
                {coordinates[0].pt.label}
              </text>
              {/* 25% */}
              <text x={coordinates[Math.floor((coordinates.length - 1) * 0.25)].x} y={height - 8}>
                {coordinates[Math.floor((coordinates.length - 1) * 0.25)].pt.label}
              </text>
              {/* Mid point */}
              <text x={coordinates[Math.floor((coordinates.length - 1) * 0.5)].x} y={height - 8}>
                {coordinates[Math.floor((coordinates.length - 1) * 0.5)].pt.label}
              </text>
              {/* 75% */}
              <text x={coordinates[Math.floor((coordinates.length - 1) * 0.75)].x} y={height - 8}>
                {coordinates[Math.floor((coordinates.length - 1) * 0.75)].pt.label}
              </text>
              {/* Last point */}
              <text x={coordinates[coordinates.length - 1].x} y={height - 8} textAnchor="end">
                {coordinates[coordinates.length - 1].pt.label}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
