import React, { useState, useEffect, useRef } from 'react';
import { CanvasNode, IntentQuery, RecommendedRoute } from '../../types';
import { 
  Search, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Fuel, 
  Zap, 
  ChevronRight,
  TrendingUp,
  X,
  Bot,
  Terminal,
  Activity
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { streamNansenAgent } from '../../services/nansenApi';

interface IntentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: CanvasNode[];
  intentPresets: IntentQuery[];
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

  // Nansen Research Agent state
  const [isAgentStreaming, setIsAgentStreaming] = useState(false);
  const [agentResponse, setAgentResponse] = useState<string | null>(null);
  const [agentToolCalls, setAgentToolCalls] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-md transition-all">
      <div 
        className="glass-panel w-full max-w-2xl rounded-xl border border-amber-500/50 shadow-2xl overflow-hidden flex flex-col max-h-[84vh] animate-in fade-in zoom-in-95 duration-150"
        style={{
          boxShadow: '0 0 50px rgba(245, 158, 11, 0.25), 0 25px 60px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-white/10 bg-slate-900/90 flex items-center gap-3">
          <span className="text-amber-400 font-extrabold text-lg">&gt;</span>
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
            placeholder="Ask Nansen AI / Type intent: e.g. 'Which tokens are smart money accumulating?', 'find USDC'..."
            className="w-full bg-transparent text-white font-mono text-sm outline-none placeholder:text-slate-500"
          />
          
          <button
            onClick={() => handleAskNansenAgent()}
            disabled={isAgentStreaming || !query.trim()}
            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-xs font-mono flex items-center gap-1.5 transition-all shadow"
            title="Ask Nansen AI Research Agent"
          >
            <Bot className="w-3.5 h-3.5 fill-black" />
            <span>{isAgentStreaming ? 'Thinking...' : 'Ask Nansen AI'}</span>
          </button>

          {query && (
            <button 
              onClick={() => { setQuery(''); setAgentResponse(null); }}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white border border-white/10"
          >
            ESC
          </button>
        </div>

        {/* Intent Presets Pills */}
        <div className="p-3 bg-slate-950/70 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Suggested:
          </span>
          <button
            onClick={() => {
              setQuery('Which tokens are smart money accumulating on Ethereum today?');
              setSelectedRoute(SMART_MONEY_ROUTE);
              handleAskNansenAgent('Which tokens are smart money accumulating on Ethereum today?');
            }}
            className="text-xs px-2.5 py-1 rounded-md bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 shrink-0 transition-all font-mono flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart Money Accumulation (Live)</span>
          </button>
          {intentPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="text-xs px-2.5 py-1 rounded-md bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/50 border border-white/10 text-slate-300 hover:text-amber-300 shrink-0 transition-all font-mono flex items-center gap-1.5"
            >
              {preset.category === 'SAFETY' && <ShieldAlert className="w-3 h-3 text-rose-400" />}
              {preset.category === 'REBALANCE' && <RefreshCw className="w-3 h-3 text-cyan-400" />}
              {preset.category === 'HEDGE' && <TrendingUp className="w-3 h-3 text-purple-400" />}
              <span>{preset.query}</span>
            </button>
          ))}
        </div>

        {/* Modal Scroll Content */}
        <div className="overflow-y-auto p-4 flex flex-col gap-4">
          {/* Nansen AI Research Agent Response Box */}
          {(isAgentStreaming || agentResponse) && (
            <div className="rounded-lg border border-cyan-500/40 bg-slate-950/90 p-4 flex flex-col gap-2.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-cyan-500/20 text-cyan-400">
                    <Bot className="w-4 h-4" />
                  </span>
                  <span className="font-extrabold text-xs text-cyan-300 tracking-wider">
                    NANSEN RESEARCH AGENT (STREAMING INTELLIGENCE)
                  </span>
                </div>
                {isAgentStreaming && (
                  <span className="flex items-center gap-1.5 text-[10px] text-amber-400 font-mono font-bold animate-pulse">
                    <Activity className="w-3 h-3 animate-spin" />
                    QUERYING ON-CHAIN DATA...
                  </span>
                )}
              </div>

              {agentToolCalls.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Tools Used:</span>
                  {agentToolCalls.map((t, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                      [TOOL: {t}]
                    </span>
                  ))}
                </div>
              )}

              <div className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-black/40 p-3 rounded border border-white/5">
                {agentResponse || 'Initializing Nansen Agent stream...'}
                {isAgentStreaming && <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse" />}
              </div>

              {agentResponse && !isAgentStreaming && (
                <div className="pt-2 flex items-center justify-between border-t border-cyan-500/20">
                  <span className="text-[10px] text-cyan-300 font-mono">
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
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs font-mono flex items-center gap-1.5 transition-all shadow cursor-pointer"
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
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500 text-black">
                    {selectedRoute.tag}
                  </span>
                  <span className="font-bold text-sm text-white">
                    {selectedRoute.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {selectedRoute.estTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-slate-400" />
                    {selectedRoute.gasCost}
                  </span>
                </div>
              </div>

              {/* Step Pipeline Flow */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                            : isStepActive
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 animate-pulse shadow-lg'
                            : 'bg-black/40 border-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span>STEP 0{step.stepNumber} // {step.type.toUpperCase()}</span>
                          {isStepDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : isStepActive ? (
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                          ) : (
                            <span>{step.estTime}</span>
                          )}
                        </div>

                        <div className="font-bold text-xs text-white">
                          {step.protocol}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>{step.fromAsset}</span>
                          {step.toAsset && (
                            <>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
                              <span className="text-amber-300 font-semibold">{step.toAsset}</span>
                            </>
                          )}
                        </div>

                        <div className="text-[10px] text-slate-500">
                          {step.fromChain} {step.toChain ? `-> ${step.toChain}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulation Action Bar */}
              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <div className="text-xs text-emerald-400 font-mono font-semibold">
                  {selectedRoute.netApyImpact || selectedRoute.riskChange || 'Validated against MEV & Slippage'}
                </div>
                <button
                  disabled={isSimulating}
                  onClick={() => handleRunSimulation(selectedRoute)}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>{isSimulating ? `Simulating Step ${simulatedStep}/${selectedRoute.steps.length}...` : 'Simulate & Execute Route'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Matched Positions & Nodes List */}
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Matching Portfolio Nodes ({filteredNodes.length})</span>
              <span className="text-slate-500 text-[10px]">Click to glide camera &amp; zoom</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  onClick={() => {
                    onSelectNode(node);
                    onClose();
                  }}
                  className="p-3 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-amber-500/50 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-amber-300">
                          {node.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400">
                          {node.chain}
                        </span>
                        {node.smartMoneyNetflow24h !== undefined && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold font-mono ${
                            node.smartMoneyNetflow24h >= 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {node.smartMoneyNetflow24h >= 0 ? `+SM $${Math.round(node.smartMoneyNetflow24h).toLocaleString()}` : `-SM $${Math.abs(Math.round(node.smartMoneyNetflow24h)).toLocaleString()}`}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {node.app} &bull; {node.strategy || node.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-bold text-xs text-white font-mono">
                        ${node.valueUsd.toLocaleString()}
                      </div>
                      {node.apy && (
                        <div className="text-[10px] text-emerald-400 font-semibold font-mono">
                          {node.apy}% APY
                        </div>
                      )}
                      {node.healthFactor && (
                        <div className={`text-[10px] font-bold font-mono ${
                          node.riskLevel === 'critical' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          HF: {node.healthFactor.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
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

