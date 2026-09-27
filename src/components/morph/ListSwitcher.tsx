import React, { useMemo } from 'react';
import { CanvasNode, PositionExitRoute, LensConfig } from '../../types';
import { WordTiles } from '../effects/WordTiles';
import { NumberFlip } from './NumberFlip';
import { DashedFrame } from '../data/DashedFrame';
import { AreaChart } from '../data/AreaChart';
import { BarRanking } from '../data/BarRanking';
import { MarkdownTable } from '../data/MarkdownTable';
import { derivePortfolioExposureSeries, derivePortfolioPnlSeries } from '../data/series';
import { Orbit, Camera, List as ListIcon, AlertTriangle, ShieldCheck, TrendingUp, Layers } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

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

export const ListSwitcher: React.FC<ListSwitcherProps> = ({
  nodes,
  viewMode: _viewMode,
  config,
  onChangeViewMode,
  onFocusNodeOnCanvas,
  onInspectNode,
  onEmergencyKill,
}) => {
  const isLight = config?.themeMode === 'light';

  // Deterministic aggregate metrics
  const totalValue = useMemo(
    () => nodes.reduce((sum, n) => sum + (n.valueUsd || 0), 0),
    [nodes]
  );

  const totalPnl24h = useMemo(
    () => nodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0),
    [nodes]
  );

  const pnlPercent = totalValue > 0 ? (totalPnl24h / totalValue) * 100 : 0;

  const criticalNodes = useMemo(
    () => nodes.filter((n) => n.riskLevel === 'critical'),
    [nodes]
  );

  const weightedApy = useMemo(() => {
    const yieldNodes = nodes.filter((n) => n.apy !== undefined && n.apy > 0);
    if (yieldNodes.length === 0) return 0;
    const weightedSum = yieldNodes.reduce((sum, n) => sum + (n.apy || 0) * (n.valueUsd || 0), 0);
    const totalYieldVal = yieldNodes.reduce((sum, n) => sum + (n.valueUsd || 0), 0);
    return totalYieldVal > 0 ? weightedSum / totalYieldVal : 0;
  }, [nodes]);

  // Deterministic 30-day exposure and 24h PnL series
  const exposureSeries = useMemo(() => derivePortfolioExposureSeries(nodes, 30), [nodes]);
  const pnlSeries = useMemo(() => derivePortfolioPnlSeries(nodes, 24), [nodes]);

  return (
    <div
      className={`absolute inset-0 z-30 pt-[78px] sm:pt-[84px] md:pt-[92px] pb-28 overflow-y-auto overflow-x-hidden font-mono transition-colors duration-200 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#07090e] text-slate-100'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 px-3 sm:px-6 md:px-8 pb-12 pt-2 animate-morph-rise">
        {/* Workspace Top Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-dashed pb-4 border-inherit">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                aether · spatial analytics & data ledger
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500 text-black font-extrabold border border-amber-600">
                VIEW: 02
              </span>
            </div>
            <WordTiles sentence="onchain exposure ledger" />
          </div>

          {/* Workspace switch (beui underline tabs) */}
          <Tabs
            value="list"
            onValueChange={(v) => onChangeViewMode(v as PortfolioViewMode)}
            variant="underline"
            className="shrink-0"
          >
            <TabsList
              className={isLight ? 'border-slate-300' : 'border-white/10'}
              indicatorClassName="bg-amber-500"
            >
              <TabsTrigger
                value="canvas"
                className={`px-3 pb-2 pt-1 text-xs font-bold ${isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                <Orbit className="w-3.5 h-3.5 text-amber-500" />
                <span>Canvas (1)</span>
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className={`px-3 pb-2 pt-1 text-xs font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}
              >
                <ListIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Table List (2)</span>
              </TabsTrigger>
              <TabsTrigger
                value="exposure-grid"
                className={`px-3 pb-2 pt-1 text-xs font-bold ${isLight ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'}`}
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>CCTV Feed (3)</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </header>

        {/* Top KPI Metric Cards (Dashed Borders) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Total NAV */}
          <div className={`p-3.5 border border-dashed ${isLight ? 'border-slate-300 bg-white/80' : 'border-white/15 bg-white/[0.02]'}`}>
            <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              TOTAL NET ASSET VALUE
            </div>
            <div className={`text-lg sm:text-xl font-extrabold ${isLight ? 'text-slate-950' : 'text-white'}`}>
              <NumberFlip value={totalValue} prefix="$" />
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>{nodes.length} connected positions</span>
            </div>
          </div>

          {/* Card 2: 24h Performance */}
          <div className={`p-3.5 border border-dashed ${isLight ? 'border-slate-300 bg-white/80' : 'border-white/15 bg-white/[0.02]'}`}>
            <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              24H NET RETURN
            </div>
            <div className={`text-lg sm:text-xl font-extrabold flex items-baseline gap-1.5 ${
              totalPnl24h >= 0
                ? isLight ? 'text-emerald-700' : 'text-emerald-400'
                : isLight ? 'text-rose-700' : 'text-rose-400'
            }`}>
              <span>{totalPnl24h >= 0 ? '+' : ''}${Math.round(totalPnl24h).toLocaleString()}</span>
              <span className="text-xs font-bold">
                ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Trailing mark-to-market</span>
            </div>
          </div>

          {/* Card 3: Weighted APY */}
          <div className={`p-3.5 border border-dashed ${isLight ? 'border-slate-300 bg-white/80' : 'border-white/15 bg-white/[0.02]'}`}>
            <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              WEIGHTED YIELD (APY)
            </div>
            <div className={`text-lg sm:text-xl font-extrabold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {weightedApy.toFixed(2)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Collateralized yield baseline
            </div>
          </div>

          {/* Card 4: Risk Posture */}
          <div className={`p-3.5 border border-dashed ${isLight ? 'border-slate-300 bg-white/80' : 'border-white/15 bg-white/[0.02]'}`}>
            <div className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              RISK POSTURE
            </div>
            <div className="text-lg sm:text-xl font-extrabold flex items-center gap-1.5">
              {criticalNodes.length > 0 ? (
                <span className="text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{criticalNodes.length} CRITICAL</span>
                </span>
              ) : (
                <span className="text-emerald-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span>NOMINAL</span>
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {criticalNodes.length > 0 ? 'Immediate kill execution required' : 'No liquidation warnings detected'}
            </div>
          </div>
        </div>

        {/* Top Charts Row: Exposure 30D + 24H PnL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* (a) Total Exposure Area Chart (8 of 12 cols on desktop) */}
          <div className="lg:col-span-8 flex">
            <DashedFrame
              tag="01"
              title="PORTFOLIO EXPOSURE [30D]"
              caption="// deterministic mark-to-market NAV random walk anchored on live node balances"
              isLight={isLight}
              badge={
                <span className={`text-[10px] px-1.5 py-0.2 border font-bold ${
                  isLight ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                }`}>
                  [LIVE: 30 PTS]
                </span>
              }
              actions={
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  HIGH: ${Math.round(Math.max(...exposureSeries.map((s) => s.value))).toLocaleString()}
                </span>
              }
            >
              <AreaChart
                data={exposureSeries}
                color="amber"
                height={200}
                isLight={isLight}
                valueFormatter={(v) => `$${Math.round(v).toLocaleString()}`}
              />
            </DashedFrame>
          </div>

          {/* (b) 24h PnL Line / Area Chart (4 of 12 cols on desktop) */}
          <div className="lg:col-span-4 flex">
            <DashedFrame
              tag="02"
              title="24H PNL PERFORMANCE"
              caption="// cumulative 24h return anchored on live node pnl metrics"
              isLight={isLight}
              badge={
                <span className={`text-[10px] px-1.5 py-0.2 border font-bold ${
                  totalPnl24h >= 0
                    ? isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : isLight ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                }`}>
                  {totalPnl24h >= 0 ? '[NET POSITIVE]' : '[NET DRAWDOWN]'}
                </span>
              }
            >
              <AreaChart
                data={pnlSeries}
                color={totalPnl24h >= 0 ? 'emerald' : 'rose'}
                height={200}
                baseline={0}
                isLight={isLight}
                valueFormatter={(v) => `${v >= 0 ? '+' : ''}$${Math.round(v).toLocaleString()}`}
              />
            </DashedFrame>
          </div>
        </div>

        {/* Middle Row: (c) Exposure Ranking Bars */}
        <DashedFrame
          tag="03"
          title="NODE ALLOCATION RANKING"
          caption="// top asset distribution and portfolio share across connected chains and vaults"
          isLight={isLight}
          badge={
            <span className={`text-[10px] px-1.5 py-0.2 border font-bold ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white/10 text-slate-300 border-white/15'
            }`}>
              [TOP 6 ALLOCATIONS]
            </span>
          }
        >
          <BarRanking
            nodes={nodes}
            limit={6}
            totalPortfolioValue={totalValue}
            isLight={isLight}
            onSelectNode={(node) => onInspectNode(node)}
          />
        </DashedFrame>

        {/* Bottom Row: (d) Full Positions Markdown Table */}
        <DashedFrame
          tag="04"
          title="ONCHAIN POSITIONS LEDGER"
          caption="// interactive markdown table with column-sort, embedded sparklines, and execution triggers"
          isLight={isLight}
          badge={
            <span className={`text-[10px] px-1.5 py-0.2 border font-bold ${
              isLight ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-amber-950/50 text-amber-300 border-amber-500/30'
            }`}>
              [LIVE TERMINAL]
            </span>
          }
        >
          <MarkdownTable
            nodes={nodes}
            isLight={isLight}
            onInspectNode={onInspectNode}
            onFocusNodeOnCanvas={onFocusNodeOnCanvas}
            onEmergencyKill={onEmergencyKill}
          />
        </DashedFrame>
      </div>
    </div>
  );
};
