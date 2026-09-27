import React from 'react';
import { RiskLevel } from '../../types';

export const PositionRiskBadge: React.FC<{ risk: RiskLevel; isLight?: boolean }> = ({
  risk,
  isLight = false,
}) => {
  const isCritical = risk === 'critical';
  const isHigh = risk === 'high';

  return (
    <span
      className={`shrink-0 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase border flex items-center gap-1 ${
        isCritical
          ? isLight
            ? 'bg-rose-100 text-rose-900 border-rose-300'
            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
          : isHigh
            ? isLight
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
            : isLight
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isCritical ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
      />
      {risk}
    </span>
  );
};
