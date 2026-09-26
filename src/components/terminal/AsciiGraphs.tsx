import React from 'react';
import { Frame } from './Frame';

/* ── GraphFlow ──────────────────────────────────────────────────────────── */

export type FlowTone = 'default' | 'accent' | 'muted' | 'danger' | 'good';

export interface FlowNode {
  label: string;
  tone?: FlowTone;
  stretch?: boolean;
}

export interface FlowRow {
  nodes: FlowNode[];
}

export const GraphFlow: React.FC<{
  title?: string;
  rows: FlowRow[];
  isLight?: boolean;
  className?: string;
}> = ({ title = 'Execution Pipeline', rows, isLight = false, className = '' }) => {
  const getToneClass = (tone: FlowTone = 'default') => {
    switch (tone) {
      case 'accent':
        return isLight ? 'text-amber-700 font-bold' : 'text-amber-400 font-bold';
      case 'good':
        return isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold';
      case 'danger':
        return isLight ? 'text-rose-700 font-bold' : 'text-rose-400 font-bold';
      case 'muted':
        return isLight ? 'text-slate-500' : 'text-slate-500';
      default:
        return isLight ? 'text-slate-900' : 'text-slate-200';
    }
  };

  return (
    <Frame title={title} isLight={isLight} className={className}>
      <div className="flex flex-col gap-3 w-full font-mono text-xs">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-2 flex-wrap w-full">
            {row.nodes.map((node, nodeIndex) => (
              <div key={nodeIndex} className={`flex items-center gap-2 ${node.stretch ? 'flex-1 min-w-0' : ''}`}>
                {nodeIndex > 0 && (
                  <span className={`select-none text-[11px] whitespace-nowrap ${
                    node.tone === 'accent' ? (isLight ? 'text-amber-700' : 'text-amber-400') : (isLight ? 'text-slate-400' : 'text-slate-500')
                  }`}>
                    - - - &gt;
                  </span>
                )}
                <span className={`px-2 py-1 rounded border text-xs whitespace-nowrap ${
                  isLight ? 'bg-slate-100/90 border-slate-300' : 'bg-slate-900/90 border-white/10'
                } ${getToneClass(node.tone)}`}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  );
};

/* ── GraphMeter ─────────────────────────────────────────────────────────── */

export const GraphMeter: React.FC<{
  title?: string;
  value: number; // 0 to 1
  ticks?: number;
  caption?: string;
  label?: string;
  isLight?: boolean;
  className?: string;
}> = ({
  title,
  value,
  ticks = 16,
  caption,
  label,
  isLight = false,
  className = '',
}) => {
  const clamped = Math.min(1, Math.max(0, value));
  const filled = Math.round(clamped * ticks);
  const percentage = Math.round(clamped * 100);

  const meterContent = (
    <div className="flex flex-col gap-1.5 w-full font-mono text-xs select-none">
      {label && (
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
          <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{label}</span>
          <span className={isLight ? 'text-amber-700' : 'text-amber-400'}>{percentage}%</span>
        </div>
      )}
      <div className="flex items-center gap-2 w-full">
        <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>[</span>
        <div className="flex-1 flex items-center justify-between tracking-tighter">
          {Array.from({ length: ticks }, (_, index) => (
            <span
              key={index}
              className={`font-bold transition-colors ${
                index < filled
                  ? (isLight ? 'text-amber-700' : 'text-amber-400')
                  : (isLight ? 'text-slate-300' : 'text-slate-700')
              }`}
            >
              {index < filled ? '=' : '-'}
            </span>
          ))}
        </div>
        <span className={isLight ? 'text-slate-400' : 'text-slate-600'}>]</span>
        <span className={`w-10 text-right font-bold tabular-nums ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
          {percentage}%
        </span>
      </div>
      {caption && (
        <p className={`text-[10px] leading-tight mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
          {caption}
        </p>
      )}
    </div>
  );

  if (!title) return meterContent;

  return (
    <Frame title={title} isLight={isLight} className={className}>
      {meterContent}
    </Frame>
  );
};

/* ── GraphTree ──────────────────────────────────────────────────────────── */

export interface TreeNode {
  label: string;
  meta?: string;
  accent?: boolean;
  children?: TreeNode[];
}

interface TreeRow {
  key: string;
  branch: string;
  label: string;
  meta?: string;
  accent?: boolean;
}

function flattenTree(
  nodes: TreeNode[],
  prefix = '',
  trail = 'root',
  isRoot = true,
): TreeRow[] {
  const singleRoot = isRoot && nodes.length === 1;

  return nodes.flatMap((node, index) => {
    const last = index === nodes.length - 1;
    const key = `${trail}/${node.label}-${index}`;
    const childPrefix = singleRoot ? '' : prefix + (last ? '   ' : '│  ');

    return [
      {
        key,
        branch: singleRoot ? '' : prefix + (last ? '└─ ' : '├─ '),
        label: node.label,
        meta: node.meta,
        accent: node.accent,
      },
      ...(node.children ? flattenTree(node.children, childPrefix, key, false) : []),
    ];
  });
}

export const GraphTree: React.FC<{
  title?: string;
  nodes: TreeNode[];
  isLight?: boolean;
  className?: string;
}> = ({ title = 'Asset Topology', nodes, isLight = false, className = '' }) => {
  const rows = flattenTree(nodes);

  return (
    <Frame title={title} isLight={isLight} className={className}>
      <div className="flex flex-col gap-1 w-full font-mono text-xs">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 w-full">
            <span className="truncate">
              <span className={`select-none ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>
                {row.branch}
              </span>
              <span className={`font-semibold ${
                row.accent ? (isLight ? 'text-amber-700' : 'text-amber-400') : (isLight ? 'text-slate-800' : 'text-slate-200')
              }`}>
                {row.label}
              </span>
            </span>
            {row.meta && (
              <span className={`text-[11px] tabular-nums font-mono shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {row.meta}
              </span>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
};

/* ── GraphCheck ─────────────────────────────────────────────────────────── */

export interface CheckItem {
  label: string;
  done?: boolean;
  note?: string;
}

export const GraphCheck: React.FC<{
  title?: string;
  items: CheckItem[];
  isLight?: boolean;
  className?: string;
}> = ({ title = 'Protocol Integrity Checks', items, isLight = false, className = '' }) => {
  const doneCount = items.filter((i) => i.done).length;

  return (
    <Frame title={title} isLight={isLight} className={className}>
      <div className="flex flex-col gap-2 w-full font-mono text-xs">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span
              className={`select-none font-bold text-xs shrink-0 ${
                item.done
                  ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                  : (isLight ? 'text-slate-400' : 'text-slate-600')
              }`}
            >
              {item.done ? '[x]' : '[ ]'}
            </span>
            <div className="flex flex-col min-w-0">
              <span className={`font-semibold ${
                item.done
                  ? (isLight ? 'text-slate-900' : 'text-slate-200')
                  : (isLight ? 'text-slate-500 line-through' : 'text-slate-500')
              }`}>
                {item.label}
              </span>
              {item.note && (
                <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {item.note}
                </span>
              )}
            </div>
          </div>
        ))}

        <div className={`mt-2 pt-2 border-t text-[10px] flex items-center justify-between font-mono ${
          isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'
        }`}>
          <span>Verified: {doneCount} of {items.length} checks passing</span>
          <span className={doneCount === items.length ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
            {doneCount === items.length ? 'ALL SYSTEMS NORMAL' : 'WARNING NOTED'}
          </span>
        </div>
      </div>
    </Frame>
  );
};
