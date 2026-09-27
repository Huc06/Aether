import React, { useMemo } from 'react';
import { Liveline, type LivelinePoint } from 'liveline';
import { CanvasNode } from '../../types';

interface LedgerRowSparklineProps {
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

function buildStaticPoints(node: CanvasNode): LivelinePoint[] {
  const now = Date.now();
  const rand = mulberry32(hashSeed(node.id));
  const current = node.valueUsd;
  const start = Math.max(0, current - (node.pnl24hUsd ?? 0));
  const points = 24;
  const data: LivelinePoint[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const drift = start + (current - start) * t;
    const noise = (rand() - 0.5) * current * 0.012;
    data.push({
      time: now - (points - 1 - i) * 60_000,
      value: Math.max(1, drift + noise),
    });
  }
  data[data.length - 1].value = current;
  return data;
}

export const LedgerRowSparkline: React.FC<LedgerRowSparklineProps> = ({
  node,
  isLight = false,
}) => {
  const data = useMemo(() => buildStaticPoints(node), [node.id, node.valueUsd, node.pnl24hUsd]);
  const isDown = (node.pnl24hUsd ?? 0) < 0;
  const color = isDown ? '#f43f5e' : '#10b981';

  return (
    <div className="w-20 h-6 inline-block overflow-hidden pointer-events-none select-none align-middle">
      <Liveline
        data={data}
        value={node.valueUsd}
        theme={isLight ? 'light' : 'dark'}
        color={color}
        fill
        grid={false}
        badge={false}
        scrub={false}
        momentum
        lineWidth={1.5}
        padding={{ top: 2, bottom: 2, left: 2, right: 2 }}
      />
    </div>
  );
};
