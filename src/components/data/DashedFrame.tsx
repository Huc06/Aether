import React from 'react';

export interface DashedFrameProps {
  title?: React.ReactNode;
  tag?: string; // e.g. "01", "EXP", "PNL", "TBL"
  caption?: string; // e.g. "// trailing 30d mark-to-market valuation"
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isLight?: boolean;
  cornerStyle?: 'bracket' | 'cross'; // '┌ ┐ └ ┘' vs '+ + + +'
}

/**
 * mdx-graphs-style dashed border container with monospace headers,
 * corner tick marks, and technical metadata punches.
 */
export const DashedFrame: React.FC<DashedFrameProps> = ({
  title,
  tag,
  caption,
  badge,
  actions,
  children,
  className = '',
  isLight = false,
  cornerStyle = 'bracket',
}) => {
  const bgClass = isLight
    ? 'bg-white/95 text-slate-900'
    : 'bg-[#080b11]/90 text-slate-100';

  const borderClass = isLight
    ? 'border-slate-300'
    : 'border-white/15';

  const cornerColor = isLight
    ? 'text-amber-600/90'
    : 'text-amber-400/80';

  const captionColor = isLight
    ? 'text-slate-600'
    : 'text-slate-400';

  const tagBg = isLight
    ? 'bg-slate-100 text-slate-700 border-slate-300'
    : 'bg-white/10 text-amber-300 border-white/15';

  const tl = cornerStyle === 'bracket' ? '┌' : '+';
  const tr = cornerStyle === 'bracket' ? '┐' : '+';
  const bl = cornerStyle === 'bracket' ? '└' : '+';
  const br = cornerStyle === 'bracket' ? '┘' : '+';

  return (
    <div
      className={`relative w-full border border-dashed ${borderClass} ${bgClass} font-mono p-4 sm:p-5 transition-colors duration-150 backdrop-blur-md ${className}`}
    >
      {/* 4 Corner Ticks */}
      <span
        aria-hidden="true"
        className={`absolute -top-2 -left-1 select-none text-[11px] font-mono leading-none ${cornerColor} font-bold`}
      >
        {tl}
      </span>
      <span
        aria-hidden="true"
        className={`absolute -top-2 -right-1 select-none text-[11px] font-mono leading-none ${cornerColor} font-bold`}
      >
        {tr}
      </span>
      <span
        aria-hidden="true"
        className={`absolute -bottom-2 -left-1 select-none text-[11px] font-mono leading-none ${cornerColor} font-bold`}
      >
        {bl}
      </span>
      <span
        aria-hidden="true"
        className={`absolute -bottom-2 -right-1 select-none text-[11px] font-mono leading-none ${cornerColor} font-bold`}
      >
        {br}
      </span>

      {/* Frame Header */}
      {(title || tag || badge || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-3 border-b border-dashed border-inherit">
          <div className="flex items-center gap-2 min-w-0">
            {tag && (
              <span className={`px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider border ${tagBg}`}>
                {tag}
              </span>
            )}
            {title && (
              <div className="flex items-center gap-2 truncate">
                <span className="text-amber-500 font-bold select-none text-xs">##</span>
                <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase truncate">
                  {title}
                </span>
              </div>
            )}
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {actions && (
            <div className="flex items-center gap-2 shrink-0 text-xs">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Optional Caption */}
      {caption && (
        <div className={`text-[11px] font-mono mb-3.5 -mt-1 leading-relaxed ${captionColor}`}>
          {caption}
        </div>
      )}

      {/* Frame Body */}
      <div className="w-full min-w-0">{children}</div>
    </div>
  );
};
