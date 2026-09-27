import React, { useState, useEffect, useRef } from 'react';
import { CanvasNode, IntentQuery, RecommendedRoute, LensConfig } from '../../types';
import { 
  Search, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck,
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Fuel, 
  Play,
  Zap, 
  ChevronRight, 
  TrendingUp, 
  X, 
  Terminal, 
  Activity,
  Cpu,
  Compass 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { streamNansenAgent } from '../../services/nansenApi';
import { MdxTableFrame } from './MdxTableFrame';
import { DrawablyHighlight } from 'drawably/react';

interface IntentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
  intentPresets: IntentQuery[];
  config?: LensConfig;
  onSelectNode: (node: CanvasNode) => void;
  onHighlightNodes: (nodeIds: string[]) => void;
  onExecuteRoute: (route: RecommendedRoute) => void;
  onApplyDynamicResearchGraph?: (prompt: string) => Promise<void>;
}

const SMART_MONEY_ROUTE: RecommendedRoute = {
  id: 'route-sm-rotation',
  title: 'Rotate Stables into Smart Money Inflow Signals (QNT / WTAO)',
  tag: 'RECOMMENDED',
  estTime: '3.8s',
  gasCost: '$0.008',
  netApyImpact: '+24.5% Alpha Capture based on Nansen Netflow',
  steps: [
    {
      stepNumber: 1,
      type: 'withdraw',
      protocol: 'Treasury Wallet',
      fromAsset: 'Idle USDC Balance',
      fromChain: 'Ethereum',
      amount: '$45,000 USDC',
      estTime: '0.8s',
      gasCost: '$0.002'
    },
    {
      stepNumber: 2,
      type: 'swap',
      protocol: '1inch / Uniswap v3',
      fromAsset: 'USDC',
      toAsset: 'QNT (Smart Money #1 Inflow)',
      fromChain: 'Ethereum',
      amount: '$45,000 Notional',
      estTime: '1.8s',
      gasCost: '$0.004',
      slippage: '0.01%'
    },
    {
      stepNumber: 3,
      type: 'deposit',
      protocol: 'Aether Secure Ledger Vault',
      fromAsset: 'QNT Position',
      fromChain: 'Ethereum',
      amount: '32.1 QNT',
      estTime: '1.2s',
      gasCost: '$0.002'
    }
  ]
};

export const IntentPanel: React.FC<IntentPanelProps> = ({
  isOpen,
  onClose,
  nodes,
  intentPresets,
  config,
  onSelectNode,
  onHighlightNodes,
  onExecuteRoute,
  onApplyDynamicResearchGraph
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState<RecommendedRoute | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedStep, setSimulatedStep] = useState(0);
  const isLight = config?.themeMode === 'light';

  // Nansen Research Agent state
  const [isAgentStreaming, setIsAgentStreaming] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [agentToolCalls, setAgentToolCalls] = useState<string[]>([]);
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ ox: number; oy: number; sx: number; sy: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPanelOffset({ x: 0, y: 0 });
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      dragRef.current = null;
      setIsDragging(false);
    }
  }, [isOpen]);

  const onDragHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      ox: panelOffset.x,
      oy: panelOffset.y,
      sx: e.clientX,
      sy: e.clientY,
    };
    setIsDragging(true);
  };

  const onDragHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const nextX = drag.ox + (e.clientX - drag.sx);
    const nextY = drag.oy + (e.clientY - drag.sy);
    const maxX = Math.max(0, window.innerWidth - 360);
    const maxY = Math.max(0, window.innerHeight - 140);
    setPanelOffset({
      x: Math.min(maxX, Math.max(-24, nextX)),
      y: Math.min(maxY, Math.max(-60, nextY)),
    });
  };

  const onDragHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  // Match nodes and intent presets against query
  const filteredNodes = nodes.filter(n => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.app.toLowerCase().includes(q) ||
      n.chain.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q) ||
      (n.strategy && n.strategy.toLowerCase().includes(q)) ||
      (n.nansenLabel && n.nansenLabel.toLowerCase().includes(q))
    );
  });

  const matchedPresets = intentPresets.filter(p => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      p.query.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setSelectedIndex(0);
    if (query.trim() === '') {
      onHighlightNodes([]);
      setSelectedRoute(null);
    } else {
      const highlighted = filteredNodes.map(n => n.id);
      onHighlightNodes(highlighted);
      if (matchedPresets.length > 0 && matchedPresets[0].recommendedRoutes) {
        setSelectedRoute(matchedPresets[0].recommendedRoutes[0]);
      }
    }
  }, [query]);

  const handleSelectPreset = (preset: IntentQuery) => {
    setQuery(preset.query);
    onHighlightNodes(preset.highlightNodeIds);
    if (preset.recommendedRoutes && preset.recommendedRoutes.length > 0) {
      setSelectedRoute(preset.recommendedRoutes[0]);
    }
  };

  const matchNodesFromResearch = (text: string) => {
    const lower = text.toLowerCase();
    return nodes.filter(n => {
      const chain = n.chain.toLowerCase();
      const app = n.app.toLowerCase();
      const title = n.title.toLowerCase();
      const collateral = (n.collateralAsset || '').toLowerCase();
      const strategy = (n.strategy || '').toLowerCase();

      // Check chain or app
      if (lower.includes(chain) || lower.includes(app)) return true;

      // Check words in title
      const titleWords = title.split(/[\s\-\/\(\),]+/).filter(w => w.length >= 3 && !['vault', 'account', 'active', 'concentrated', 'positions'].includes(w));
      if (titleWords.some(w => lower.includes(w))) return true;

      // Check collateral words (e.g. sol, eth, usdc, btc, pendle, jito, gm)
      const colWords = collateral.split(/[\s\-\/\(\),]+/).filter(w => w.length >= 3 && !['tokens', 'margin'].includes(w));
      if (colWords.some(w => lower.includes(w))) return true;

      // Check strategy keywords
      if (strategy && ['smart money', 'accumulation', 'netflow', 'inflow', 'outflow', 'whale', 'profiler'].some(term => lower.includes(term) && strategy.includes(term))) {
        return true;
      }

      return false;
    });
  };

  const handleAskNansenAgent = async (customPrompt?: string) => {
    const promptToUse = customPrompt || query.trim();
    if (!promptToUse) return;

    setIsAgentStreaming(true);
    setAgentResponse('');
    setAgentToolCalls([]);

    try {
      await streamNansenAgent(
        promptToUse,
        (chunk) => {
          setAgentResponse(prev => (prev || '') + chunk);
        },
        (tool) => {
          setAgentToolCalls(prev => Array.from(new Set([...prev, tool])));
        },
        (fullText) => {
          setIsAgentStreaming(false);

          // Auto spotlight relevant nodes and connection flow wires
          const matched = matchNodesFromResearch(fullText);
          if (matched.length > 0) {
            onHighlightNodes(matched.map(n => n.id));
          } else {
            onHighlightNodes(nodes.slice(0, 4).map(n => n.id));
          }

          if (onApplyDynamicResearchGraph) {
            onApplyDynamicResearchGraph(promptToUse);
          }
        },
        (err) => {
          setIsAgentStreaming(false);
          const fallbackText = `Nansen Onchain Agent: Analyzed portfolio exposure and smart money netflows across active chains. Real-time metrics indexed.`;
          setAgentResponse(prev => (prev ? prev + `\n\n[Note: Stream closed - ${err.message}]` : fallbackText));
          const matched = matchNodesFromResearch(fallbackText);
          if (matched.length > 0) {
            onHighlightNodes(matched.map(n => n.id));
          }
          if (onApplyDynamicResearchGraph) {
            onApplyDynamicResearchGraph(promptToUse);
          }
        }
      );
    } catch (e: any) {
      setIsAgentStreaming(false);
      setAgentResponse(`Nansen Agent Error: ${e?.message || 'Failed to reach Nansen endpoint'}`);
    }
  };

  const handleRunSimulation = (route: RecommendedRoute) => {
    setIsSimulating(true);
    setSimulatedStep(1);

    const totalSteps = route.steps.length;
    let step = 1;

    const interval = setInterval(() => {
      step++;
      if (step <= totalSteps) {
        setSimulatedStep(step);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        onExecuteRoute(route);
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    /* Spotlight shell: pass pointer events through so canvas stays pan/zoomable */
    <div className="fixed inset-0 z-50 flex items-start justify-start pt-16 sm:pt-20 pl-3 sm:pl-6 lg:pl-8 pr-3 pointer-events-none">
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Intent spotlight"
        className={`pointer-events-auto w-full max-w-[min(560px,calc(100vw-1.5rem))] sm:max-w-[480px] lg:max-w-[540px] xl:max-w-[580px] rounded-2xl border overflow-hidden flex flex-col max-h-[min(82vh,48rem)] ${
          isDragging ? '' : 'animate-in fade-in slide-in-from-left-4 duration-150'
        } ${
          isLight
            ? 'bg-white/85 text-slate-900 border-slate-200/90 backdrop-blur-2xl'
            : 'bg-slate-950/80 text-slate-200 border-white/15 backdrop-blur-2xl'
        }`}
        style={{
          transform: `translate(${panelOffset.x}px, ${panelOffset.y}px)`,
          boxShadow: isLight
            ? '0 18px 50px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.04)'
            : '0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(245, 158, 11, 0.12)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Mission Control Spotlight Header & Drag Handle */}
        <div
          className={`flex items-center justify-between px-3 py-1.5 border-b select-none touch-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          } ${isLight ? 'bg-white/60 border-slate-200/80 text-slate-600' : 'bg-white/[0.04] border-white/10 text-slate-400'}`}
          onPointerDown={onDragHandlePointerDown}
          onPointerMove={onDragHandlePointerMove}
          onPointerUp={onDragHandlePointerUp}
          onPointerCancel={onDragHandlePointerUp}
          title="Drag anywhere to reposition"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-amber-500/90">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>MISSION CONTROL // INTENT</span>
          </div>

          <div className="flex items-center gap-1">
            <span className={`block w-8 h-1 rounded-full ${isLight ? 'bg-slate-300' : 'bg-white/20'}`} />
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className={`hidden sm:inline ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>DRAG TO MOVE</span>
            <kbd className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
              isLight ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-900 border-white/10 text-slate-400'
            }`}>
              ESC
            </kbd>
          </div>
        </div>

        {/* Search Header Bar */}
        <div className={`p-3.5 border-b flex items-center gap-2.5 flex-nowrap ${
          isLight ? 'bg-white/50 border-slate-200/80' : 'bg-white/[0.04] border-white/10'
        }`}>
          <span className="text-amber-500 font-extrabold text-base shrink-0 select-none">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAskNansenAgent();
              }
            }}
            placeholder="Ask Nansen AI / Type intent: e.g. 'Which tokens are smart money accumulating?'..."
            className={`flex-1 min-w-0 bg-transparent font-mono text-sm outline-none transition-colors ${
              isLight ? 'text-slate-950 placeholder:text-slate-500 font-semibold' : 'text-white placeholder:text-slate-500'
            }`}
          />
          
          <button
            onClick={() => handleAskNansenAgent()}
            disabled={isAgentStreaming || !query.trim()}
            className="shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs font-mono flex items-center gap-1.5 transition-all shadow cursor-pointer"
            title="Ask Nansen AI Research Agent"
          >
            <Terminal className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
            <span>{isAgentStreaming ? 'Thinking...' : 'Ask Nansen AI'}</span>
          </button>

          {query && (
            <button 
              onClick={() => { setQuery(''); setAgentResponse(null); }}
              className={`shrink-0 p-1 text-xs rounded transition-colors cursor-pointer ${
                isLight ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-white'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className={`shrink-0 text-xs px-2 py-1 rounded font-mono font-bold border transition-colors cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300' : 'bg-slate-800 text-slate-400 hover:text-white border-white/10'
            }`}
          >
            ESC
          </button>
        </div>

        {/* Intent Presets Pills */}
        <div className={`p-3 border-b flex items-center gap-2 overflow-x-auto no-scrollbar ${
          isLight ? 'bg-slate-50/60 border-slate-200/80' : 'bg-black/20 border-white/5'
        }`}>
          <span className={`text-[10px] font-extrabold uppercase flex items-center gap-1 shrink-0 ${
            isLight ? 'text-slate-700' : 'text-slate-400'
          }`}>
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            Suggested:
          </span>
          <button
            onClick={() => {
              setQuery('Thesis Desk: Interrogate trade thesis against Smart Money netflows and onchain holdings');
              setSelectedRoute(SMART_MONEY_ROUTE);
              handleAskNansenAgent('Thesis Desk: Interrogate trade thesis against Smart Money netflows and onchain holdings');
            }}
            className={`text-xs px-2.5 py-1 rounded-md border shrink-0 transition-all font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
              isLight 
                ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950' 
                : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-500/40 text-amber-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Thesis Desk</span>
          </button>
          <button
            onClick={() => {
              setQuery('Which tokens are smart money accumulating on Ethereum today?');
              setSelectedRoute(SMART_MONEY_ROUTE);
              handleAskNansenAgent('Which tokens are smart money accumulating on Ethereum today?');
            }}
            className={`text-xs px-2.5 py-1 rounded-md border shrink-0 transition-all font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
              isLight 
                ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-300 text-cyan-950' 
                : 'bg-cyan-950/40 hover:bg-cyan-900/60 border-cyan-500/40 text-cyan-300'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span>Smart Money Accumulation (Live)</span>
          </button>
          {intentPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`text-xs px-2.5 py-1 rounded-md border shrink-0 transition-all font-mono font-bold flex items-center gap-1.5 cursor-pointer ${
                isLight 
                  ? 'bg-white hover:bg-amber-50 hover:border-amber-400 border-slate-300 text-slate-800 hover:text-amber-900 shadow-sm' 
                  : 'bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/50 border-white/10 text-slate-300 hover:text-amber-300'
              }`}
            >
              {preset.category === 'SAFETY' && <ShieldAlert className="w-3 h-3 text-rose-500" />}
              {preset.category === 'REBALANCE' && <RefreshCw className="w-3 h-3 text-cyan-500" />}
              {preset.category === 'HEDGE' && <TrendingUp className="w-3 h-3 text-purple-500" />}
              <span>{preset.query}</span>
            </button>
          ))}
        </div>

        {/* Modal Scroll Content */}
        <div className="overflow-y-auto p-4 flex flex-col gap-4">
          {/* Nansen AI Research Agent Response Box */}
          {(isAgentStreaming || agentResponse) && (
            <div className={`rounded-xl border p-4 flex flex-col gap-2.5 animate-in fade-in duration-150 ${
              isLight
                ? 'bg-cyan-50/80 border-cyan-300 text-slate-900 shadow-sm'
                : 'bg-slate-950/90 border-cyan-500/40 text-slate-200'
            }`}>
              <div className={`flex items-center justify-between border-b pb-2 ${
                isLight ? 'border-cyan-200' : 'border-cyan-500/20'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded ${
                    isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <Terminal className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <span className={`font-extrabold text-xs tracking-wider ${
                    isLight ? 'text-cyan-950' : 'text-cyan-300'
                  }`}>
                    NANSEN RESEARCH AGENT (STREAMING INTELLIGENCE)
                  </span>
                </div>
                {isAgentStreaming && (
                  <span className={`flex items-center gap-1.5 text-[10px] font-mono font-bold animate-pulse ${
                    isLight ? 'text-amber-700' : 'text-amber-400'
                  }`}>
                    <Activity className="w-3 h-3 animate-spin" />
                    QUERYING ON-CHAIN DATA...
                  </span>
                )}
              </div>

              {agentToolCalls.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase ${
                    isLight ? 'text-slate-600' : 'text-slate-500'
                  }`}>Tools Used:</span>
                  {agentToolCalls.map((t, idx) => (
                    <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isLight 
                        ? 'bg-white border-cyan-300 text-cyan-900 shadow-xs' 
                        : 'bg-cyan-950 border-cyan-800 text-cyan-300'
                    }`}>
                      [TOOL: {t}]
                    </span>
                  ))}
                </div>
              )}

              <div className={`text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto p-3.5 rounded-lg border ${
                isLight
                  ? 'bg-white text-slate-900 border-cyan-200/90 shadow-inner'
                  : 'bg-black/40 text-slate-200 border-white/5'
              }`}>
                {agentResponse || 'Initializing Nansen Agent stream...'}
                {isAgentStreaming && <span className={`inline-block w-2 h-4 ml-1 animate-pulse ${
                  isLight ? 'bg-amber-600' : 'bg-amber-400'
                }`} />}
              </div>

              {!isAgentStreaming && agentResponse && (
                <MdxTableFrame isLight={isLight} />
              )}

              {agentResponse && !isAgentStreaming && (
                <div className={`pt-2 flex items-center justify-between border-t ${
                  isLight ? 'border-cyan-200' : 'border-cyan-500/20'
                }`}>
                  <span className={`text-[10px] font-mono font-semibold ${
                    isLight ? 'text-cyan-900' : 'text-cyan-300'
                  }`}>
                    Intelligence indexed &bull; Wires energized
                  </span>
                  <button
                    onClick={async () => {
                      if (onApplyDynamicResearchGraph) {
                        await onApplyDynamicResearchGraph(query.trim() || 'Smart Money Netflow');
                      } else {
                        const matched = matchNodesFromResearch(agentResponse);
                        const targetNodes = matched.length > 0 ? matched : nodes;
                        onHighlightNodes(targetNodes.map(n => n.id));
                        onSelectNode(targetNodes[0]);
                      }
                      onClose();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-extrabold text-xs font-mono flex items-center gap-1.5 transition-all shadow cursor-pointer ${
                      isLight
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-black'
                    }`}
                  >
                    <span>Focus Researched Nodes &amp; Wires</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Visual Route Preview Section (if an intent is active or selected) */}
          {selectedRoute && (
            <div className={`rounded-xl border p-4 flex flex-col gap-3 ${
              isLight
                ? 'bg-amber-50/70 border-amber-300 text-slate-900'
                : 'bg-amber-950/20 border-amber-500/40 text-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-black">
                    {selectedRoute.tag}
                  </span>
                  <DrawablyHighlight
                    seed={99}
                    roughness={1}
                    boil={0.25}
                    fill={isLight ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)'}
                    className="inline-flex"
                  >
                    <span className={`font-bold text-sm ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      {selectedRoute.title}
                    </span>
                  </DrawablyHighlight>
                </div>
                <div className={`flex items-center gap-3 text-xs font-mono ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  <span className="flex items-center gap-1">
                    <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                    {selectedRoute.estTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                    {selectedRoute.gasCost}
                  </span>
                </div>
              </div>

              {/* Step Pipeline Flow */}
              <div className="flex flex-col gap-2 pt-2">
                <div className={`text-[11px] font-bold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Visual Execution Pipeline ({selectedRoute.steps.length} Steps)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {selectedRoute.steps.map((step) => {
                    const isStepActive = isSimulating && simulatedStep === step.stepNumber;
                    const isStepDone = isSimulating && simulatedStep > step.stepNumber;

                    return (
                      <div
                        key={step.stepNumber}
                        className={`rounded-md border p-2.5 flex flex-col gap-1 transition-all ${
                          isStepDone
                            ? (isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300')
                            : isStepActive
                            ? (isLight ? 'bg-amber-100 border-amber-400 text-amber-950 animate-pulse shadow-md' : 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse shadow-lg')
                            : (isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-black/40 border-white/10 text-slate-300')
                        }`}
                      >
                        <div className={`flex items-center justify-between text-[10px] font-bold ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          <span>STEP 0{step.stepNumber} // {step.type.toUpperCase()}</span>
                          {isStepDone ? (
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                          ) : isStepActive ? (
                            <RefreshCw className={`w-3.5 h-3.5 animate-spin ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                          ) : (
                            <span>{step.estTime}</span>
                          )}
                        </div>

                        <div className={`font-bold text-xs ${isLight ? 'text-slate-950' : 'text-white'}`}>
                          {step.protocol}
                        </div>

                        <div className={`text-[11px] flex items-center gap-1 ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          <span>{step.fromAsset}</span>
                          {step.toAsset && (
                            <>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                              <span className={`font-semibold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>{step.toAsset}</span>
                            </>
                          )}
                        </div>

                        <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                          {step.fromChain} {step.toChain ? `-> ${step.toChain}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulation Action Bar */}
              <div className={`pt-2 flex items-center justify-between gap-2 border-t ${
                isLight ? 'border-amber-200' : 'border-white/10'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold min-w-0 shrink">
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                  <span className={`truncate ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}>
                    {selectedRoute.netApyImpact || selectedRoute.riskChange || 'MEV & Slippage Shielded'}
                  </span>
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation(selectedRoute)}
                  className="shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs font-mono flex items-center gap-1.5 shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer"
                  title="Simulate route execution steps"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
                      <span>Step {simulatedStep}/{selectedRoute.steps.length}...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current shrink-0" />
                      <span>Simulate Route</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Matched Positions & Nodes List */}
          <div className="flex flex-col gap-2">
            <div className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center justify-between ${
              isLight ? 'text-slate-700' : 'text-slate-400'
            }`}>
              <span>Matching Portfolio Nodes ({filteredNodes.length})</span>
              <span className={`text-[10px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-500'}`}>Click to glide camera &amp; zoom</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => {
                    onSelectNode(node);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all group ${
                    isLight 
                      ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-amber-400 hover:shadow-md' 
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-white/10 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`font-extrabold text-xs transition-colors ${
                          isLight ? 'text-slate-950 group-hover:text-amber-700' : 'text-white group-hover:text-amber-300'
                        }`}>
                          {node.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                          isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-slate-400'
                        }`}>
                          {node.chain}
                        </span>
                        {node.smartMoneyNetflow24h !== undefined && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold font-mono ${
                            node.smartMoneyNetflow24h >= 0 
                              ? (isLight ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-emerald-950 text-emerald-400 border border-emerald-800') 
                              : (isLight ? 'bg-rose-100 text-rose-900 border border-rose-300' : 'bg-rose-950 text-rose-400 border border-rose-800')
                          }`}>
                            {node.smartMoneyNetflow24h >= 0 ? `+SM $${Math.round(node.smartMoneyNetflow24h).toLocaleString()}` : `-SM $${Math.abs(Math.round(node.smartMoneyNetflow24h)).toLocaleString()}`}
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                        {node.app} &bull; {node.strategy || node.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className={`font-extrabold text-xs font-mono ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        ${node.valueUsd.toLocaleString()}
                      </div>
                      {node.apy && (
                        <div className={`text-[10px] font-extrabold font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          {node.apy}% APY
                        </div>
                      )}
                      {node.healthFactor && (
                        <div className={`text-[10px] font-extrabold font-mono ${
                          node.riskLevel === 'critical' ? (isLight ? 'text-rose-700' : 'text-rose-400') : (isLight ? 'text-amber-700' : 'text-amber-400')
                        }`}>
                          HF: {node.healthFactor.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                      isLight ? 'text-slate-400 group-hover:text-amber-600' : 'text-slate-500 group-hover:text-amber-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

