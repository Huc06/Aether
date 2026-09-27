import React, { useEffect, useMemo, useState } from 'react';
import { Liveline, type LivelinePoint } from 'liveline';
import { CanvasNode } from '../../types';

interface PositionMomentumChartProps {
  node: CanvasNode;
  isLight?: boolean;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSeries(node: CanvasNode): LivelinePoint[] {
  const now = Date.now();
  const rand = mulberry32(hashSeed(node.id));
  const current = node.valueUsd;
  const start = Math.max(0, current - (node.pnl24hUsd ?? 0));
  const points = 48;
  const data: LivelinePoint[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const drift = start + (current - start) * t;
    const noise = (rand() - 0.5) * current * 0.01;
    data.push({
      time: now - (points - 1 - i) * 30_000,
      value: Math.max(1, drift + noise),
    });
  }
  data[data.length - 1].value = current;
  return data;
}

export const PositionMomentumChart: React.FC<PositionMomentumChartProps> = ({
  node,
  isLight = false,
}) => {
  const seed = useMemo(() => buildSeries(node), [node.id, node.valueUsd, node.pnl24hUsd]);
  const [data, setData] = useState<LivelinePoint[]>(seed);
  const [value, setValue] = useState(node.valueUsd);
  const isCritical = node.riskLevel === 'critical' || node.riskLevel === 'high';
  const isDown = (node.pnl24hUsd ?? 0) < 0;

  useEffect(() => {
    setData(seed);
    setValue(node.valueUsd);
  }, [seed, node.valueUsd]);

  useEffect(() => {
    const rand = mulberry32(hashSeed(node.id + ':tick'));
    const id = window.setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1]?.value ?? node.valueUsd;
        const next = Math.max(1, last + (rand() - 0.48) * node.valueUsd * 0.002);
        setValue(next);
        return [...prev.slice(-47), { time: Date.now(), value: next }];
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, [node.id, node.valueUsd]);

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-slate-950/70 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between px-3 pt-2">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          Mark Value Momentum
        </span>
        <span
          className={`text-[9px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-500'}`}
        >
          Pyth / mark feed
        </span>
      </div>
      <div className="h-[88px] w-full">
        <Liveline
          data={data}
          value={value}
          theme={isLight ? 'light' : 'dark'}
          color={isDown ? '#f43f5e' : '#10b981'}
          momentum
          fill
          grid={false}
          badge={false}
          scrub
          exaggerate
          degen={isCritical ? { scale: 0.6, downMomentum: true } : false}
          formatValue={(v) =>
            v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`
          }
        />
      </div>
    </div>
  );
};
