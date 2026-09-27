import React, { useId, useMemo } from 'react';

export interface SparklineProps {
  data: number[];
  width?: number; // default 90
  height?: number; // default 22
  color?: 'emerald' | 'rose' | 'amber' | 'cyan' | 'auto';
  isLight?: boolean;
  className?: string;
  showDot?: boolean;
  showFill?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 90,
  height = 22,
  color = 'auto',
  isLight = false,
  className = '',
  showDot = true,
  showFill = true,
}) => {
  const gradId = useId().replace(/:/g, '_');

  const { resolvedColor, pathD, areaD, lastPoint } = useMemo(() => {
    if (!data || data.length < 2) {
      return { resolvedColor: '#10b981', pathD: '', areaD: '', lastPoint: null };
    }

    const first = data[0];
    const last = data[data.length - 1];
    const isUp = last >= first;

    let hexColor: string;
    if (color === 'auto') {
      hexColor = isUp ? '#10b981' : '#f43f5e';
    } else if (color === 'emerald') {
      hexColor = '#10b981';
    } else if (color === 'rose') {
      hexColor = '#f43f5e';
    } else if (color === 'cyan') {
      hexColor = '#06b6d4';
    } else {
      hexColor = '#f59e0b';
    }

    let min = Math.min(...data);
    let max = Math.max(...data);
    if (min === max) {
      min = min * 0.95;
      max = max * 1.05;
    }

    const padX = 3;
    const padY = 3;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;
    const span = max - min || 1;

    const points = data.map((v, i) => {
      const x = padX + (i / (data.length - 1)) * innerW;
      const normalized = (v - min) / span;
      const y = padY + (1 - normalized) * innerH;
      return { x, y };
    });

    // Build smooth cubic bezier path
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const lastPt = points[points.length - 1];
    const firstPt = points[0];
    const bottomY = height - 1;
    const aD = `${d} L ${lastPt.x.toFixed(1)} ${bottomY} L ${firstPt.x.toFixed(1)} ${bottomY} Z`;

    return {
      resolvedColor: hexColor,
      pathD: d,
      areaD: aD,
      lastPoint: lastPt,
    };
  }, [data, width, height, color]);

  if (!pathD) {
    return (
      <div
        className={`inline-block font-mono text-[9px] text-slate-500 ${className}`}
        style={{ width, height }}
      >
        --
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={`inline-block shrink-0 overflow-visible align-middle select-none ${className}`}
    >
      <defs>
        <linearGradient id={`spark-grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity={isLight ? 0.35 : 0.28} />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {showFill && (
        <path d={areaD} fill={`url(#spark-grad-${gradId})`} />
      )}

      <path
        d={pathD}
        fill="none"
        stroke={resolvedColor}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {showDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.2"
          fill={resolvedColor}
          stroke={isLight ? '#ffffff' : '#080b11'}
          strokeWidth="1"
        />
      )}
    </svg>
  );
};
