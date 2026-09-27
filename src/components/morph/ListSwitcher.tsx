import React, { useEffect, useMemo, useState } from 'react';
import { CanvasNode, PositionExitRoute, LensConfig, RiskLevel } from '../../types';
import { NumberFlip } from './NumberFlip';
import { MorphTabs } from './MorphTabs';
import { Orbit, ChevronRight } from 'lucide-react';
import { BendScroll } from '../effects/BendScroll';
import { WordTiles } from '../effects/WordTiles';
import { Frame } from '../terminal/Frame';
import { ScrollRegion } from '../terminal/ScrollRegion';
import { RowWindowFooter, useRowWindow } from '../terminal/RowWindow';
import { DitherBadge, DitherDefs, type DitherStatus } from '../terminal/DitherPatterns';
import { GraphMeter } from '../terminal/AsciiGraphs';
import { DrawablyCircle, DrawablyHighlight } from 'drawably/react';
import { LedgerRowSparkline } from './LedgerRowSparkline';

const TABLE_MIN_W = '68rem';
const TABLE_COLS =
  'minmax(12rem,2.2fr) minmax(7.5rem,1fr) minmax(11rem,1.2fr) minmax(6rem,0.8fr) 11rem';

export type PortfolioViewMode = 'canvas' | 'list' | 'exposure-grid';

interface ListSwitcherProps {
  nodes: CanvasNode[];
  viewMode: PortfolioViewMode;
  config?: LensConfig;
  onChangeViewMode: (mode: PortfolioViewMode) => void;
  onFocusNodeOnCanvas: (node: CanvasNode) => void;
  onInspectNode: (node: CanvasNode) => void;
  onEmergencyKill: (node: CanvasNode, route: PositionExitRoute) => void;
}

const RISK_LABEL: Record<RiskLevel, string> = {
  safe: 'safe',
  medium: 'moderate',
  high: 'high',
  critical: 'critical',
};

/** Shorter labels so the Risk column never clips under bend raster */
const RISK_LABEL_COMPACT: Record<RiskLevel, string> = {
  safe: 'safe',
  medium: 'mod',
  high: 'high',
  critical: 'crit',
};

function riskDither(level: RiskLevel): DitherStatus {
  if (level === 'safe') return 'safe';
  if (level === 'critical') return 'critical';
  return 'warn';
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 997;
}

export const ListSwitcher: React.FC<ListSwitcherProps> = ({
  nodes,
  viewMode: _viewMode,
  config,
  onChangeViewMode: _onChangeViewMode,
  onFocusNodeOnCanvas,
  onInspectNode,
  onEmergencyKill: _onEmergencyKill,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'apy' | 'health' | 'pnl'>('value');
  const isLight = config?.themeMode === 'light';

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(searchQuery), 140);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  const muted = isLight ? 'text-slate-700' : 'text-slate-300';
  const soft = isLight ? 'text-slate-600' : 'text-slate-400';
  const ink = isLight ? 'text-slate-950' : 'text-white';
  const good = isLight ? 'text-emerald-700' : 'text-emerald-400';
  const bad = isLight ? 'text-rose-700' : 'text-rose-400';
  const warn = isLight ? 'text-amber-700' : 'text-amber-400';

  const filteredNodes = nodes.filter((node) => {
    if (chainFilter !== 'all' && node.chain.toLowerCase() !== chainFilter.toLowerCase()) {
      return false;
    }
    if (riskFilter !== 'all' && node.riskLevel !== riskFilter) {
      return false;
    }
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      return (
        node.title.toLowerCase().includes(q) ||
        node.app.toLowerCase().includes(q) ||
        node.chain.toLowerCase().includes(q) ||
        node.category.toLowerCase().includes(q) ||
        (node.strategy && node.strategy.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const sortedNodes = [...filteredNodes].sort((a, b) => {
    if (sortBy === 'value') return b.valueUsd - a.valueUsd;
    if (sortBy === 'apy') return (b.apy || 0) - (a.apy || 0);
    if (sortBy === 'health') return (a.healthFactor || 99) - (b.healthFactor || 99);
    if (sortBy === 'pnl') return (b.pnl24hUsd || 0) - (a.pnl24hUsd || 0);
    return 0;
  });

  const windowed = useRowWindow(sortedNodes);
  const totalValue = useMemo(
    () => nodes.reduce((sum, node) => sum + node.valueUsd, 0),
    [nodes],
  );
  const shownValue = useMemo(
    () => sortedNodes.reduce((sum, node) => sum + node.valueUsd, 0),
    [sortedNodes],
  );

  const chainTabs = [
    { id: 'all', label: 'All Chains', tone: 'default' as const, badge: nodes.length },
    { id: 'solana', label: 'Solana', tone: 'solana' as const, badge: nodes.filter((n) => n.chain === 'Solana').length },
    { id: 'arbitrum', label: 'Arbitrum', tone: 'arbitrum' as const, badge: nodes.filter((n) => n.chain === 'Arbitrum').length },
    { id: 'ethereum', label: 'Ethereum', tone: 'ethereum' as const, badge: nodes.filter((n) => n.chain === 'Ethereum').length },
    { id: 'hyperliquid', label: 'Hyperliquid', tone: 'hyperliquid' as const, badge: nodes.filter((n) => n.chain === 'Hyperliquid').length },
  ];

  const riskTabs = [
    { id: 'all', label: 'All Risks', tone: 'default' as const },
    { id: 'safe', label: 'Safe Tier', tone: 'safe' as const },
    { id: 'medium', label: 'Moderate', tone: 'warn' as const },
    {
      id: 'critical',
      label: 'Critical Alert',
      tone: 'critical' as const,
      badge: nodes.filter((n) => n.riskLevel === 'critical').length || undefined,
    },
  ];

  const sortOptions = [
    { value: 'value' as const, label: 'Highest Value ($)' },
    { value: 'apy' as const, label: 'Highest APY (%)' },
    { value: 'health' as const, label: 'Lowest Health Factor' },
    { value: 'pnl' as const, label: '24h Net PnL' },
  ];

  return (
    <div
      className={`absolute inset-0 z-30 pt-[78px] sm:pt-[84px] md:pt-[92px] pb-24 overflow-hidden ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#07090e] text-slate-200'
      }`}
    >
      <DitherDefs idPrefix="ledger" isLight={isLight} />
      <BendScroll className="h-full">
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5 px-3 sm:px-4 md:px-8 pb-8 pt-2">
          <header className="flex flex-col gap-3 select-none">
            <p className={`font-mono text-xs uppercase tracking-[0.18em] sm:tracking-[0.22em] ${muted}`}>
              aether · spatial ledger
            </p>
            <WordTiles sentence="onchain exposure ledger" />
          </header>

          <Frame
            title="Query"
            isLight={isLight}
            surface="card"
            actions={
              <span className={`text-xs font-mono uppercase tracking-wider ${muted}`}>
                {sortedNodes.length} match{sortedNodes.length === 1 ? '' : 'es'}
              </span>
            }
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="relative w-full min-w-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets, vaults, protocols..."
                  autoComplete="off"
                  spellCheck={false}
                  className={`w-full border rounded-none px-4 py-3 text-sm font-mono outline-none select-text ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-500 focus:bg-white focus:border-amber-500 font-semibold'
                      : 'bg-slate-900 border-white/15 text-white placeholder:text-slate-400 focus:border-amber-500/60'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <span className={`text-xs font-extrabold uppercase font-mono ${muted}`}>
                  Sort
                </span>
                <div className="relative flex-1 sm:flex-none min-w-0 sm:min-w-[14rem]">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Sort positions"
                    style={{ colorScheme: isLight ? 'light' : 'dark' }}
                    className={`w-full appearance-none border rounded-none pl-3 pr-9 py-3 text-sm font-mono font-bold outline-none cursor-pointer min-h-[44px] ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-950 focus:border-amber-500'
                        : 'bg-slate-950 border-white/20 text-white focus:border-amber-400'
                    }`}
                  >
                    {sortOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        style={{
                          backgroundColor: isLight ? '#ffffff' : '#020617',
                          color: isLight ? '#020617' : '#f8fafc',
                        }}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] ${muted}`}
                    aria-hidden
                  >
                    ▾
                  </span>
                </div>
              </div>
            </div>
          </Frame>

          <div className="flex flex-col gap-2.5 min-w-0 select-none">
            <MorphTabs
              tabs={chainTabs}
              activeTab={chainFilter}
              onChange={setChainFilter}
              isLight={isLight}
              className="w-full max-w-full"
            />
            <MorphTabs
              tabs={riskTabs}
              activeTab={riskFilter}
              onChange={setRiskFilter}
              isLight={isLight}
              className="w-full max-w-full"
            />
          </div>

          <div className="select-none">
            <GraphMeter
              label="Filtered NAV"
              value={totalValue > 0 ? shownValue / totalValue : 0}
              caption={`$${shownValue.toLocaleString()} of $${totalValue.toLocaleString()} in view`}
              isLight={isLight}
            />
          </div>

          <Frame
            title="Positions"
            isLight={isLight}
            surface="card"
            badge={
              <DitherBadge status="pending" idPrefix="ledger" isLight={isLight}>
                live
              </DitherBadge>
            }
          >
            <ScrollRegion isLight={isLight}>
              {/* Desktop table shell — fixed min width so columns never crush */}
              <div className="hidden xl:block" style={{ minWidth: TABLE_MIN_W }}>
              <div
                className={`grid gap-x-3 px-4 pr-8 py-3 border-b text-xs font-mono font-extrabold uppercase tracking-wider sticky top-0 z-[1] ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-slate-950 border-white/10 text-slate-200'
                }`}
                style={{ gridTemplateColumns: TABLE_COLS }}
              >
                <div className="min-w-0">Asset</div>
                <div className="min-w-0">Chain · Protocol</div>
                <div className="min-w-0 text-right">Value ($)</div>
                <div className="min-w-0 text-right">APY / Health</div>
                <div className="text-right">Risk / Actions</div>
              </div>
              </div>

              <div
                className={`flex flex-col font-mono text-sm ${
                  isLight ? 'divide-y divide-slate-200' : 'divide-y divide-white/10'
                }`}
              >
                {windowed.visible.length === 0 && (
                  <div className={`px-4 py-10 text-center text-sm ${muted}`}>
                    No positions match this query.
                  </div>
                )}

                {windowed.visible.map((node) => {
                  const isCritical = node.riskLevel === 'critical';
                  const rowTone = isCritical
                    ? isLight
                      ? 'bg-rose-50 hover:bg-rose-100/80'
                      : 'bg-rose-950/25 hover:bg-rose-900/35'
                    : isLight
                      ? 'hover:bg-slate-100/90'
                      : 'hover:bg-slate-800/70';
                  const chip = isLight
                    ? 'bg-slate-200 text-slate-900 border border-slate-300'
                    : 'bg-white/10 text-white border border-white/15';

                  return (
                    <div
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onInspectNode(node)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onInspectNode(node);
                        }
                      }}
                      className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset ${rowTone}`}
                    >
                      {/* Card layout: phone + tablet + laptop < xl */}
                      <div className="xl:hidden flex flex-col gap-3 p-4">
                        <div className="flex items-start justify-between gap-3 min-w-0">
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className={`font-extrabold text-base leading-snug break-words ${ink}`}>
                                {node.title}
                              </span>
                              {node.smartMoneyNetflow24h !== undefined && node.smartMoneyNetflow24h > 20000 && (
                                <DrawablyHighlight
                                  seed={hashId(node.id + ':sm')}
                                  roughness={0.9}
                                  boil={0.2}
                                  fill={isLight ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)'}
                                  className="inline-flex shrink-0"
                                >
                                  <span className={`text-[9px] font-bold font-mono ${isLight ? 'text-amber-950' : 'text-cyan-300'}`}>
                                    +SM ${Math.round(node.smartMoneyNetflow24h / 1000)}k
                                  </span>
                                </DrawablyHighlight>
                              )}
                            </div>
                            <span className={`text-xs leading-relaxed break-words ${soft}`}>
                              {node.strategy || node.category}
                            </span>
                          </div>
                          <ChevronRight className={`w-5 h-5 shrink-0 mt-0.5 ${soft}`} aria-hidden="true" />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <span className={`px-2 py-1 rounded-none text-xs font-extrabold shrink-0 ${chip}`}>
                            {node.chain}
                          </span>
                          <span className={`text-sm font-semibold break-words min-w-0 ${muted}`}>
                            {node.app}
                          </span>
                          {isCritical ? (
                            <DrawablyCircle
                              seed={hashId(node.id)}
                              roughness={1.05}
                              boil={0.3}
                              stroke={isLight ? '#e11d48' : '#f43f5e'}
                              width={1.5}
                              className="inline-flex"
                            >
                              <DitherBadge status={riskDither(node.riskLevel)} idPrefix="ledger" isLight={isLight}>
                                {RISK_LABEL[node.riskLevel]}
                              </DitherBadge>
                            </DrawablyCircle>
                          ) : (
                            <DitherBadge status={riskDither(node.riskLevel)} idPrefix="ledger" isLight={isLight}>
                              {RISK_LABEL[node.riskLevel]}
                            </DitherBadge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
                          <div className="min-w-0">
                            <div className={`text-xs uppercase tracking-wider font-bold mb-1 ${soft}`}>
                              Value
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <LedgerRowSparkline node={node} isLight={isLight} />
                              <div className="min-w-0">
                                <div className={`font-extrabold text-base tabular-nums break-all ${ink}`}>
                                  <NumberFlip value={node.valueUsd} prefix="$" />
                                </div>
                                {node.pnl24hUsd !== undefined && (
                                  <div
                                    className={`text-xs font-bold tabular-nums mt-0.5 ${
                                      node.pnl24hUsd >= 0 ? good : bad
                                    }`}
                                  >
                                    {node.pnl24hUsd >= 0 ? '+' : ''}${Math.abs(node.pnl24hUsd).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="min-w-0 text-right">
                            <div className={`text-xs uppercase tracking-wider font-bold mb-1 ${soft}`}>
                              Yield / HF
                            </div>
                            {node.apy !== undefined ? (
                              <div className={`font-extrabold text-base tabular-nums ${good}`}>
                                {node.apy}% APY
                              </div>
                            ) : (
                              <div className={`font-extrabold text-base tabular-nums ${soft}`}>—</div>
                            )}
                            {node.healthFactor !== undefined && (
                              <div
                                className={`text-xs font-extrabold tabular-nums mt-0.5 ${
                                  node.healthFactor < 1.15 ? bad : warn
                                }`}
                              >
                                HF: {node.healthFactor.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFocusNodeOnCanvas(node);
                            }}
                            className={`inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-none border text-sm font-bold transition-colors ${
                              isLight
                                ? 'bg-slate-100 hover:bg-amber-100 text-slate-900 hover:text-amber-950 border-slate-300'
                                : 'bg-white/5 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border-white/15'
                            }`}
                            title="Focus on Spatial Canvas"
                          >
                            <Orbit className="w-4 h-4" aria-hidden="true" />
                            Focus canvas
                          </button>
                        </div>
                      </div>

                      {/* Wide table row — xl+ only, min-width shell prevents crush */}
                      <div className="hidden xl:block" style={{ minWidth: TABLE_MIN_W }}>
                      <div
                        className="grid gap-x-3 px-4 pr-8 py-3.5 items-center"
                        style={{ gridTemplateColumns: TABLE_COLS }}
                      >
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`font-extrabold truncate text-sm hover:text-amber-500 ${ink}`}>
                              {node.title}
                            </div>
                            {node.smartMoneyNetflow24h !== undefined && node.smartMoneyNetflow24h > 20000 && (
                              <DrawablyHighlight
                                seed={hashId(node.id + ':sm')}
                                roughness={0.9}
                                boil={0.2}
                                fill={isLight ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)'}
                                className="inline-flex shrink-0"
                              >
                                <span className={`text-[9px] font-bold font-mono ${isLight ? 'text-amber-950' : 'text-cyan-300'}`}>
                                  +SM ${Math.round(node.smartMoneyNetflow24h / 1000)}k
                                </span>
                              </DrawablyHighlight>
                            )}
                          </div>
                          <div className={`text-xs truncate mt-0.5 ${soft}`}>
                            {node.strategy || node.category}
                          </div>
                        </div>

                        <div className="min-w-0 overflow-hidden flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-none text-xs font-extrabold max-w-full truncate ${chip}`}>
                            {node.chain}
                          </span>
                          <span className={`text-xs font-semibold truncate max-w-full ${muted}`}>
                            {node.app}
                          </span>
                        </div>

                        <div className="min-w-0 flex items-center justify-end gap-2 overflow-hidden">
                          <LedgerRowSparkline node={node} isLight={isLight} />
                          <div className="min-w-0 text-right overflow-hidden">
                            <div className={`font-extrabold text-sm tabular-nums truncate ${ink}`}>
                              <NumberFlip value={node.valueUsd} prefix="$" />
                            </div>
                            {node.pnl24hUsd !== undefined && (
                              <div
                                className={`text-xs font-bold tabular-nums truncate ${
                                  node.pnl24hUsd >= 0 ? good : bad
                                }`}
                              >
                                {node.pnl24hUsd >= 0 ? '+' : ''}${Math.abs(node.pnl24hUsd).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 text-right overflow-hidden">
                          {node.apy !== undefined ? (
                            <div className={`font-extrabold text-sm tabular-nums truncate ${good}`}>
                              {node.apy}% APY
                            </div>
                          ) : (
                            <div className={`font-extrabold text-sm tabular-nums ${soft}`}>—</div>
                          )}
                          {node.healthFactor !== undefined && (
                            <div
                              className={`text-xs font-extrabold tabular-nums truncate ${
                                node.healthFactor < 1.15 ? bad : warn
                              }`}
                            >
                              HF: {node.healthFactor.toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          {isCritical ? (
                            <DrawablyCircle
                              seed={hashId(node.id)}
                              roughness={1.05}
                              boil={0.3}
                              stroke={isLight ? '#e11d48' : '#f43f5e'}
                              width={1.5}
                              className="inline-flex shrink-0"
                            >
                              <DitherBadge
                                status={riskDither(node.riskLevel)}
                                idPrefix="ledger"
                                isLight={isLight}
                                className="shrink-0"
                              >
                                {RISK_LABEL_COMPACT[node.riskLevel]}
                              </DitherBadge>
                            </DrawablyCircle>
                          ) : (
                            <DitherBadge
                              status={riskDither(node.riskLevel)}
                              idPrefix="ledger"
                              isLight={isLight}
                              className="shrink-0"
                            >
                              {RISK_LABEL_COMPACT[node.riskLevel]}
                            </DitherBadge>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFocusNodeOnCanvas(node);
                            }}
                            className={`p-1.5 min-w-[32px] min-h-[32px] shrink-0 inline-flex items-center justify-center rounded-none border transition-colors ${
                              isLight
                                ? 'bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 border-slate-300'
                                : 'bg-white/5 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border-white/15'
                            }`}
                            title="Focus on Spatial Canvas"
                            aria-label="Focus on Spatial Canvas"
                          >
                            <Orbit className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <ChevronRight className={`w-4 h-4 shrink-0 ${soft}`} aria-hidden="true" />
                        </div>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <RowWindowFooter
                shown={windowed.shown}
                loaded={windowed.loaded}
                hasMore={windowed.hasMore}
                sentinelRef={windowed.sentinelRef}
                noun="position"
                isLight={isLight}
              />
            </ScrollRegion>
          </Frame>
        </div>
      </BendScroll>
    </div>
  );
};
