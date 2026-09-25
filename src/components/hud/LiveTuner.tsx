import React from 'react';
import { LensConfig } from '../../types';
import { THEME_PRESETS } from '../../data/mockData';
import { X, Sliders, Sparkles, Eye } from 'lucide-react';

interface LiveTunerProps {
  isOpen: boolean;
  onClose: () => void;
  config: LensConfig;
  onChangeConfig: (newConfig: LensConfig) => void;
  onShowToast: (msg: string) => void;
}

export const LiveTuner: React.FC<LiveTunerProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onShowToast
}) => {
  if (!isOpen) return null;

  const handleSlider = (key: keyof LensConfig, val: number | boolean) => {
    onChangeConfig({
      ...config,
      [key]: val
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    const preset = THEME_PRESETS[presetKey];
    if (!preset) return;
    const updated = {
      ...config,
      ...preset
    };
    onChangeConfig(updated);
    document.documentElement.style.setProperty('--accent', updated.accent);
    document.documentElement.style.setProperty('--accent-glow', `${updated.accent}66`);
    document.documentElement.style.setProperty('--accent-dim', `${updated.accent}26`);
    onShowToast(`Theme preset applied: ${preset.name}`);
  };

  return (
    <div className="fixed top-16 right-4 z-50 w-80 max-h-[85vh] overflow-y-auto glass-panel rounded-xl border border-white/15 p-4 flex flex-col gap-4 text-xs select-none shadow-2xl animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2 font-extrabold text-white">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Live CRT Lens Tuner</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Theme Presets */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Theme Presets
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(THEME_PRESETS).map(([k, p]) => (
            <button
              key={k}
              onClick={() => handleApplyPreset(k)}
              className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 text-left font-mono font-bold text-[11px] text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: p.accent }}
              />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shader Parameters */}
      <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Eye className="w-3 h-3 text-cyan-400" />
          Barrel Shader (barrel.frag)
        </span>

        {/* Distortion */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-slate-300">
            <span>Barrel Curvature</span>
            <span className="text-amber-400 font-bold">{config.distort.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-0.25"
            max="0.45"
            step="0.01"
            value={config.distort}
            onChange={(e) => handleSlider('distort', parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />
        </div>

        {/* Chromatic Aberration */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-slate-300">
            <span>Chromatic Aberration</span>
            <span className="text-amber-400 font-bold">{config.chromatic.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={config.chromatic}
            onChange={(e) => handleSlider('chromatic', parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />
        </div>

        {/* Vignette */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-slate-300">
            <span>Vignette Edge Shade</span>
            <span className="text-amber-400 font-bold">{config.vignette.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={config.vignette}
            onChange={(e) => handleSlider('vignette', parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />
        </div>

        {/* Edge Bokeh Blur */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-slate-300">
            <span>Corner Bokeh Blur</span>
            <span className="text-amber-400 font-bold">{config.edgeBlur.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={config.edgeBlur}
            onChange={(e) => handleSlider('edgeBlur', parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />
        </div>

        {/* Grid Spacing */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-slate-300">
            <span>Grid Spacing</span>
            <span className="text-amber-400 font-bold">{config.gridSpacing}px</span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            step="5"
            value={config.gridSpacing}
            onChange={(e) => handleSlider('gridSpacing', parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />
        </div>

        {/* Camera Speed */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-slate-300">
            <span>Camera Damping Speed</span>
            <span className="text-amber-400 font-bold">{config.cameraSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="16.0"
            step="0.5"
            value={config.cameraSpeed}
            onChange={(e) => handleSlider('cameraSpeed', parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />
        </div>

        {/* Minimap Opacity */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between font-mono text-[11px] text-slate-300">
            <span>Radar Minimap Opacity</span>
            <span className="text-amber-400 font-bold">{config.minimapOpacity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={config.minimapOpacity}
            onChange={(e) => handleSlider('minimapOpacity', parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded"
          />
        </div>

        {/* Scanlines Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-[11px] text-slate-300">CRT Scanlines</span>
          <button
            onClick={() => handleSlider('showScanlines', !config.showScanlines)}
            className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
              config.showScanlines
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            {config.showScanlines ? 'ENABLED' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
