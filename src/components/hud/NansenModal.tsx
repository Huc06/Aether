import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Activity, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Database, 
  Cpu, 
  RefreshCw, 
  Search, 
  Zap, 
  Globe 
} from 'lucide-react';
import { 
  getNansenApiKey, 
  setNansenApiKey, 
  getApiCallCount, 
  PRESET_ENTITIES, 
  DEFAULT_NANSEN_KEY, 
  NansenEntityTarget 
} from '../../services/nansenApi';
import { LensConfig } from '../../types';

interface NansenModalProps {
  isOpen: boolean;
  onClose: () => void;
  config?: LensConfig;
  onLoadEntity: (entity: NansenEntityTarget) => void;
  onShowToast: (msg: string) => void;
}

export const NansenModal: React.FC<NansenModalProps> = ({
  isOpen,
  onClose,
  config,
  onLoadEntity,
  onShowToast
}) => {
  const [apiKey, setApiKeyState] = useState(getNansenApiKey());
  const [callCount, setCallCount] = useState(getApiCallCount());
  const [customAddress, setCustomAddress] = useState('');
  const [customChain, setCustomChain] = useState<'Ethereum' | 'Solana' | 'Arbitrum' | 'Hyperliquid' | 'Berachain'>('Ethereum');
  const [isLoadingEntity, setIsLoadingEntity] = useState(false);
  const isLight = config?.themeMode === 'light';

  if (!isOpen) return null;

  const handleSaveKey = () => {
    setNansenApiKey(apiKey);
    onShowToast('Nansen API Key saved successfully');
  };

  const handleResetDefaultKey = () => {
    setApiKeyState(DEFAULT_NANSEN_KEY);
    setNansenApiKey(DEFAULT_NANSEN_KEY);
    onShowToast('Reverted to default Meridian Buildathon API Key');
  };

  const handleSelectPreset = async (preset: typeof PRESET_ENTITIES[0]) => {
    setIsLoadingEntity(true);
    try {
      await onLoadEntity(preset);
      onShowToast(`Loaded on-chain graph for ${preset.label}`);
      onClose();
    } catch (err: any) {
      onShowToast(`Failed to load: ${err?.message}`);
    } finally {
      setIsLoadingEntity(false);
    }
  };

  const handleLoadCustom = async () => {
    if (!customAddress.trim()) return;
    setIsLoadingEntity(true);
    try {
      await onLoadEntity({
        id: `custom-${Date.now()}`,
        label: `Address: ${customAddress.slice(0, 6)}...${customAddress.slice(-4)}`,
        address: customAddress.trim(),
        chain: customChain,
        description: `Custom inspected address on ${customChain}`
      });
      onShowToast('Generated spatial graph from Nansen Profiler');
      onClose();
    } catch (err: any) {
      onShowToast(`Failed to load custom address: ${err?.message}`);
    } finally {
      setIsLoadingEntity(false);
    }
  };

  const qualifiedTarget = 1000;
  const progressPct = Math.min(100, Math.round((callCount / qualifiedTarget) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col font-mono transition-colors ${
          isLight 
            ? 'bg-white/98 text-slate-900 border-slate-300 shadow-2xl' 
            : 'glass-panel text-slate-200 border-cyan-500/40'
        }`}
        style={{
          boxShadow: isLight ? '0 20px 60px rgba(0, 0, 0, 0.15)' : '0 0 50px rgba(6, 182, 212, 0.25), 0 25px 60px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50/95 border-slate-200' : 'bg-slate-900/90 border-white/10'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`p-1.5 rounded-lg border ${
              isLight ? 'bg-cyan-100 text-cyan-800 border-cyan-300' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}>
              <Database className="w-4 h-4" />
            </span>
            <div>
              <div className={`font-black text-sm flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                <span>NANSEN ONCHAIN INTELLIGENCE</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${
                  isLight ? 'bg-cyan-100 text-cyan-900 border-cyan-300' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  MERIDIAN BUILDATHON
                </span>
              </div>
              <span className={`text-[10px] ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                Surface the Signal &bull; Live Profiler, Smart Money &amp; Agent APIs
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded border transition-colors cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 border-slate-300' : 'bg-slate-800 text-slate-400 hover:text-white border-white/10'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* Buildathon Qualification Tracker Card */}
          <div className={`rounded-xl border p-4 flex flex-col gap-2.5 ${
            isLight 
              ? 'bg-cyan-50/80 border-cyan-300 text-slate-900 shadow-sm' 
              : 'bg-gradient-to-br from-cyan-950/40 to-slate-900/80 border-cyan-500/30'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <div className={`flex items-center gap-2 font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                <Activity className={`w-4 h-4 animate-pulse ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
                <span>API Usage &amp; Buildathon Qualification</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded font-extrabold ${
                callCount >= qualifiedTarget 
                  ? 'bg-emerald-500 text-black shadow shadow-emerald-500/30' 
                  : (isLight ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30')
              }`}>
                {callCount >= qualifiedTarget ? '✓ 1,000+ CALLS QUALIFIED' : `${callCount} / 1,000 CALLS`}
              </span>
            </div>

            <div className={`w-full rounded-full h-2 overflow-hidden border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-white/10'}`}>
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className={`flex items-center justify-between text-[11px] font-mono ${isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}`}>
              <span>Endpoint calls registered in session</span>
              <span className={isLight ? 'text-cyan-800 font-extrabold' : 'text-cyan-300 font-semibold'}>{progressPct}% of requirement</span>
            </div>
          </div>

          {/* API Key Configuration */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-950 font-black' : 'text-slate-300'}`}>
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Nansen API Key
              </span>
              <button
                onClick={handleResetDefaultKey}
                className={`text-[10px] hover:underline cursor-pointer ${isLight ? 'text-cyan-700 font-bold' : 'text-cyan-400'}`}
              >
                Reset to Buildathon Key
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                placeholder="nsn_..."
                className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono outline-none transition-colors ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-cyan-500 font-semibold' 
                    : 'bg-black/50 border-white/15 focus:border-cyan-400 text-white'
                }`}
              />
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs transition-all shrink-0 cursor-pointer shadow"
              >
                Save Key
              </button>
            </div>
            <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Keys are stored securely in local browser storage and authenticated through backend proxy.
            </div>
          </div>

          {/* Preset On-Chain Wallets / Entities */}
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className={`text-xs uppercase tracking-wider ${isLight ? 'text-slate-950 font-black' : 'text-slate-300 font-bold'}`}>
                Inspect Curated On-Chain Entities
              </span>
              <span className={`text-[10px] ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-500'}`}>1-Click Live Graph</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_ENTITIES.map((preset) => (
                <button
                  key={preset.id}
                  disabled={isLoadingEntity}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-1 group cursor-pointer ${
                    isLight 
                      ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-cyan-400 hover:shadow-md' 
                      : 'bg-slate-900/60 hover:bg-slate-800 border-white/10 hover:border-cyan-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs transition-colors ${
                      isLight ? 'text-slate-950 font-black group-hover:text-cyan-700' : 'text-white font-bold group-hover:text-cyan-300'
                    }`}>
                      {preset.label}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                      isLight ? 'bg-slate-200 text-slate-800' : 'bg-white/10 text-slate-300'
                    }`}>
                      {preset.chain}
                    </span>
                  </div>
                  <span className={`text-[10px] line-clamp-2 ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Address Lookup */}
          <div className={`flex flex-col gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
            <div className={`text-xs ${isLight ? 'text-slate-950 font-black' : 'text-slate-300 font-bold'}`}>
              Inspect Any Custom Wallet or Contract
            </div>
            <div className="flex gap-2">
              <select
                value={customChain}
                onChange={(e) => setCustomChain(e.target.value as any)}
                className={`border rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-black/50 border-white/15 text-slate-300'
                }`}
              >
                <option value="Ethereum">Ethereum</option>
                <option value="Solana">Solana</option>
                <option value="Arbitrum">Arbitrum</option>
                <option value="Hyperliquid">Hyperliquid</option>
              </select>
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="0x... or Solana base58 address"
                className={`w-full border rounded-xl px-3 py-2 text-xs font-mono outline-none transition-colors ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white focus:border-cyan-500 font-semibold' 
                    : 'bg-black/50 border-white/15 focus:border-cyan-400 text-white'
                }`}
              />
              <button
                disabled={isLoadingEntity || !customAddress.trim()}
                onClick={handleLoadCustom}
                className={`px-3.5 py-2 rounded-xl font-extrabold text-xs border transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  isLight 
                    ? 'bg-cyan-50 hover:bg-cyan-500 hover:text-black text-cyan-900 border-cyan-300 shadow-sm' 
                    : 'bg-slate-800 hover:bg-cyan-500 hover:text-black text-cyan-400 border-cyan-500/40'
                }`}
              >
                {isLoadingEntity ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Fetch</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
