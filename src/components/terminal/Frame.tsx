import React from 'react';

export interface FrameProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isLight?: boolean;
  surface?: 'body' | 'card';
  badge?: React.ReactNode;
}

/**
 * Terminal Wireframe Container with dashed hairline border,
 * corner '+' marks, and punchable surface headers.
 */
export const Frame: React.FC<FrameProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  isLight = false,
  surface = 'body',
  badge,
}) => {
  const surfaceBg = isLight 
    ? (surface === 'card' ? 'bg-white' : 'bg-slate-50')
    : (surface === 'card' ? 'bg-slate-900/90' : 'bg-[#07090e]');

  const borderColor = isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(255, 255, 255, 0.16)';
  const cornerColor = isLight ? 'text-slate-400 font-bold' : 'text-slate-500';

  return (
    <div
      className={`relative w-full p-4 sm:p-5 rounded-none font-mono transition-colors ${className}`}
      style={{
        backgroundImage: `
          repeating-linear-gradient(to right, ${borderColor} 0 2px, transparent 2px 7px),
          repeating-linear-gradient(to bottom, ${borderColor} 0 2px, transparent 2px 7px),
          repeating-linear-gradient(to right, ${borderColor} 0 2px, transparent 2px 7px),
          repeating-linear-gradient(to bottom, ${borderColor} 0 2px, transparent 2px 7px)
        `,
        backgroundRepeat: 'repeat-x, repeat-y, repeat-x, repeat-y',
        backgroundPosition: '0 0, 100% 0, 0 100%, 0 0',
        backgroundSize: '100% 1px, 1px 100%, 100% 1px, 1px 100%',
      }}
    >
      {/* 4 Corner Crosshairs */}
      <span className={`absolute -top-2.5 -left-1.5 select-none text-xs leading-none ${surfaceBg} px-0.5 ${cornerColor}`}>
        +
      </span>
      <span className={`absolute -top-2.5 -right-1.5 select-none text-xs leading-none ${surfaceBg} px-0.5 ${cornerColor}`}>
        +
      </span>
      <span className={`absolute -bottom-2.5 -left-1.5 select-none text-xs leading-none ${surfaceBg} px-0.5 ${cornerColor}`}>
        +
      </span>
      <span className={`absolute -bottom-2.5 -right-1.5 select-none text-xs leading-none ${surfaceBg} px-0.5 ${cornerColor}`}>
        +
      </span>

      {/* Header with Title Punch & Actions */}
      {(title || actions || badge) && (
        <div className="flex items-center justify-between gap-3 -mt-6 sm:-mt-7 mb-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {title && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2 py-0.5 select-none truncate ${surfaceBg} ${
                isLight ? 'text-slate-900 border border-slate-300' : 'text-amber-400 border border-amber-500/30'
              }`}>
                <span>[</span>
                <span className="truncate">{title}</span>
                <span>]</span>
              </span>
            )}
            {badge && (
              <div className={`${surfaceBg} px-1.5`}>
                {badge}
              </div>
            )}
          </div>

          {actions && (
            <div className={`flex items-center gap-2 ${surfaceBg} px-1.5`}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Subtitle */}
      {subtitle && (
        <p className={`text-[11px] mb-3 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {subtitle}
        </p>
      )}

      {/* Content */}
      <div className="min-w-0 w-full">
        {children}
      </div>
    </div>
  );
};
