import React from 'react';

export type DitherStatus =
  | 'safe'
  | 'warn'
  | 'medium'
  | 'high'
  | 'critical'
  | 'pending'
  | 'success'
  | 'failed'
  | 'denied';

export interface DitherDefsProps {
  idPrefix?: string;
  isLight?: boolean;
}

/**
 * 1-bit Monochromatic Dithering SVG Pattern Definitions
 * Distinguishes status by visual texture density rather than color alone.
 */
export const DitherDefs: React.FC<DitherDefsProps> = ({
  idPrefix = 'dither',
  isLight = false,
}) => {
  const successColor = isLight ? '#059669' : '#10b981';
  const warnColor = isLight ? '#d97706' : '#f59e0b';
  const errorColor = isLight ? '#e11d48' : '#f43f5e';
  const mutedColor = isLight ? '#64748b' : '#94a3b8';

  return (
    <svg width={0} height={0} className="absolute pointer-events-none" aria-hidden focusable="false">
      <defs>
        {/* Safe / Success: 50% checkerboard (dense ink) */}
        <pattern
          id={`${idPrefix}-safe`}
          width={4}
          height={4}
          patternUnits="userSpaceOnUse"
        >
          <rect x={0} y={0} width={2} height={2} fill={successColor} />
          <rect x={2} y={2} width={2} height={2} fill={successColor} />
        </pattern>
        <pattern
          id={`${idPrefix}-success`}
          width={4}
          height={4}
          patternUnits="userSpaceOnUse"
        >
          <rect x={0} y={0} width={2} height={2} fill={successColor} />
          <rect x={2} y={2} width={2} height={2} fill={successColor} />
        </pattern>

        {/* Warn / Moderate: 45 degree diagonal hatch */}
        <pattern
          id={`${idPrefix}-warn`}
          width={6}
          height={6}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={6} stroke={warnColor} strokeWidth={2} />
        </pattern>
        <pattern
          id={`${idPrefix}-denied`}
          width={6}
          height={6}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1={0} y1={0} x2={0} y2={6} stroke={warnColor} strokeWidth={2} />
        </pattern>

        {/* Critical / Failed: stipple dots */}
        <pattern
          id={`${idPrefix}-critical`}
          width={5}
          height={5}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={1.5} cy={1.5} r={1.2} fill={errorColor} />
          <circle cx={4} cy={4} r={0.8} fill={errorColor} />
        </pattern>
        <pattern
          id={`${idPrefix}-failed`}
          width={5}
          height={5}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={1.5} cy={1.5} r={1.2} fill={errorColor} />
          <circle cx={4} cy={4} r={0.8} fill={errorColor} />
        </pattern>

        {/* Pending: horizontal dashed lines */}
        <pattern
          id={`${idPrefix}-pending`}
          width={6}
          height={6}
          patternUnits="userSpaceOnUse"
        >
          <line
            x1={0}
            y1={3}
            x2={6}
            y2={3}
            stroke={mutedColor}
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />
        </pattern>
      </defs>
    </svg>
  );
};

export function ditherFill(idPrefix: string, status: DitherStatus) {
  const norm =
    status === 'medium' || status === 'high'
      ? 'warn'
      : status;
  return `url(#${idPrefix}-${norm})`;
}

export const DitherSwatch: React.FC<{
  status: DitherStatus;
  idPrefix?: string;
  size?: number;
  className?: string;
}> = ({ status, idPrefix = 'dither', size = 12, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className={`shrink-0 inline-block align-middle ${className}`}
    >
      <rect
        width={size}
        height={size}
        rx={2}
        fill={ditherFill(idPrefix, status)}
        stroke="currentColor"
        strokeWidth={1}
        className="text-white/20"
      />
    </svg>
  );
};

export const DitherBadge: React.FC<{
  status: DitherStatus;
  children: React.ReactNode;
  idPrefix?: string;
  isLight?: boolean;
  className?: string;
}> = ({ status, children, idPrefix = 'dither', isLight = false, className = '' }) => {
  const borderTone =
    status === 'safe' || status === 'success'
      ? (isLight ? 'border-emerald-600 text-emerald-900 bg-emerald-50' : 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40')
      : status === 'warn' || status === 'denied' || status === 'medium' || status === 'high'
      ? (isLight ? 'border-amber-600 text-amber-900 bg-amber-50' : 'border-amber-500/50 text-amber-300 bg-amber-950/40')
      : status === 'critical' || status === 'failed'
      ? (isLight ? 'border-rose-600 text-rose-900 bg-rose-50' : 'border-rose-500/50 text-rose-300 bg-rose-950/40')
      : (isLight ? 'border-slate-400 text-slate-700 bg-slate-100' : 'border-slate-600 text-slate-300 bg-slate-900/60');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${borderTone} ${className}`}
    >
      <DitherSwatch status={status} idPrefix={idPrefix} size={10} />
      <span>{children}</span>
    </span>
  );
};
