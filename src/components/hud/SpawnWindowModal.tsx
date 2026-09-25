import React, { useState } from 'react';
import { CanvasNode, WindowContentType } from '../../types';
import { 
  X, 
  PlusCircle, 
  Terminal, 
  Code2, 
  Activity, 
  Music, 
  Box, 
  MessageSquare, 
  Wallet, 
  TrendingUp, 
  Layers 
} from 'lucide-react';

interface SpawnWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawn: (newNode: Partial<CanvasNode>) => void;
}

export const SpawnWindowModal: React.FC<SpawnWindowModalProps> = ({
  isOpen,
  onClose,
  onSpawn
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('defi-vault');
  const [title, setTitle] = useState('');
  const [chain, setChain] = useState<'Solana' | 'Arbitrum' | 'Ethereum' | 'Hyperliquid'>('Solana');
  const [valueUsd, setValueUsd] = useState(50000);
  const [apy, setApy] = useState(18.5);

  if (!isOpen) return null;

  const TEMPLATES = [
    {
      id: 'defi-vault',
      name: 'DeFi Vault / LP Position',
      icon: '🌊',
      type: 'position' as const,
      category: 'Yield' as const,
      desc: 'Concentrated liquidity or yield compounding vault with APY & liquidation metrics.'
    },
    {
      id: 'terminal',
      name: 'Interactive Terminal (Alacritty / Fastfetch)',
      icon: '',
      type: 'window' as const,
      windowContent: 'terminal' as WindowContentType,
      category: 'Terminal' as const,
      desc: 'System CLI logs, fastfetch banner, and spatial router output.'
    },
    {
      id: 'code',
      name: 'Neovim Code Editor',
      icon: '',
      type: 'window' as const,
      windowContent: 'code' as WindowContentType,
      category: 'Development' as const,
      desc: 'Syntax-highlighted spatial routing smart contract script.'
    },
    {
      id: 'btop',
      name: 'Btop++ RPC & Cluster Monitor',
      icon: '',
      type: 'window' as const,
      windowContent: 'btop' as WindowContentType,
      category: 'System' as const,
      desc: 'Real-time animated RPC latencies and multi-chain node metrics.'
    },
    {
      id: '3d',
      name: '3D Wireframe Mesh Viewport',
      icon: '',
      type: 'window' as const,
      windowContent: '3d' as WindowContentType,
      category: 'Graphics' as const,
      desc: 'Live rotating 3D parametric liquidity surface torus.'
    },
    {
      id: 'music',
      name: 'Audio Player & Visualizer',
      icon: '',
      type: 'window' as const,
      windowContent: 'music' as WindowContentType,
      category: 'Media' as const,
      desc: 'DeFi focus soundtrack with live equalizers.'
    },
    {
      id: 'chat',
      name: 'Alpha Traders Chat',
      icon: '',
      type: 'window' as const,
      windowContent: 'chat' as WindowContentType,
      category: 'System' as const,
      desc: 'Sub-second real-time cross-chain messaging stream.'
    }
  ];

  const handleCreate = () => {
    const t = TEMPLATES.find(tpl => tpl.id === selectedTemplate) || TEMPLATES[0];
    const nodeTitle = title.trim() || t.name;

    onSpawn({
      title: nodeTitle,
      app: t.name.split(' ')[0],
      type: t.type,
      windowContent: t.windowContent,
      category: t.category,
      chain: chain,
      icon: t.icon,
      valueUsd: valueUsd,
      pnl24hUsd: Math.round(valueUsd * 0.024),
      pnlPercent: 2.4,
      apy: t.type === 'position' ? apy : undefined,
      healthFactor: t.type === 'position' ? 2.5 : undefined,
      liquidationDistancePct: t.type === 'position' ? 45.0 : undefined,
      riskLevel: 'safe',
      w: t.type === 'position' ? 460 : 540,
      h: t.type === 'position' ? 300 : 380,
      strategy: `Custom ${t.name} on ${chain}.`
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md transition-all">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-white/15 p-5 flex flex-col gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 font-extrabold text-white text-base">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <span>Spawn New Spatial Window / DeFi Node</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Selector */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Select Window Type
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col gap-1 ${
                  selectedTemplate === tpl.id
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                    : 'bg-black/40 border-white/10 text-slate-300 hover:border-white/25'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span>{tpl.icon}</span>
                  <span className="truncate">{tpl.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {tpl.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Node Properties */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs font-mono">
          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Window Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Orca SOL/USDC Concentrated LP, alacritty — logs"
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Target Chain</span>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value as any)}
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
            >
              <option value="Solana">Solana</option>
              <option value="Arbitrum">Arbitrum</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Hyperliquid">Hyperliquid</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Initial Value ($)</span>
            <input
              type="number"
              value={valueUsd}
              onChange={(e) => setValueUsd(Number(e.target.value))}
              className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleCreate}
          className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <PlusCircle className="w-4 h-4 fill-black text-amber-500" />
          <span>Spawn Window on Canvas</span>
        </button>
      </div>
    </div>
  );
};
