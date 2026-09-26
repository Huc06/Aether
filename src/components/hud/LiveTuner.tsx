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
  const isLight = config.themeMode === 'light';

  const handleSlider = (key: keyof LensConfig, val: number | boolean | string) => {
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
    <div className={`fixed top-16 right-4 z-50 w-80 max-h-[85vh] overflow-y-auto rounded-xl border p-4 flex flex-col gap-4 text-xs select-none shadow-2xl animate-in fade-in duration-150 transition-colors ${
      isLight ? 'bg-white/98 text-slate-900 border-slate-300 shadow-2xl' : 'glass-panel text-slate-200 border-white/15'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-2.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <div className={`flex items-center gap-2 font-extrabold ${isLight ? 'text-slate-950' : 'text-white'}`}>
          <Sliders className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
          <span>Live CRT Lens Tuner</span>
        </div>
        <button
          onClick={onClose}
          className={`w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white'
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Theme Presets */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
            <Sparkles className={`w-3 h-3 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            Theme Palette &amp; Mode
          </span>
          <button
            onClick={() => {
              const nextMode = config.themeMode === 'light' ? 'dark' : 'light';
              handleSlider('themeMode' as any, nextMode);
              onShowToast(nextMode === 'light' ? '☀ Light Mode' : '🌙 Dark Mode');
            }}
            className={`text-[10px] px-2 py-0.5 rounded font-extrabold border transition-colors cursor-pointer ${
              isLight 
                ? 'bg-cyan-50 border-cyan-300 text-cyan-900 hover:bg-cyan-100' 
                : 'bg-white/10 border-white/15 text-cyan-300 hover:border-cyan-400'
            }`}
          >
            {config.themeMode === 'light' ? '☀ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(THEME_PRESETS).map(([k, p]) => (
            <button
              key={k}
              onClick={() => handleApplyPreset(k)}
              className={`px-2.5 py-1.5 rounded-md text-left font-mono font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer border ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900' 
                  : 'bg-white/5 hover:bg-white/15 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: p.accent }}
              />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Shader Parameters */}
      <div className={`flex flex-col gap-3 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
        <span className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
          <Eye className={`w-3 h-3 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
          Barrel Shader (barrel.frag)
        </span>

        {/* Distortion */}
        <div className="flex flex-col gap-1">
          <div className={`flex justify-between font-mono text-[11px] ${isLight ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>
            <span>Barrel Curvature</span>
            <span className={`font-extrabold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{config.distort.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="-0.25"
            max="0.45"
            step="0.01"
            value={config.distort}
            onChange={(e) => handleSlider('distort', parseFloat(e.target.value))}
            className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
          />
        </div>

        {/* Chromatic Aberration */}
        <div className="flex flex-col gap-1">
          <div className={`flex justify-between font-mono text-[11px] ${isLight ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>
            <span>Chromatic Aberration</span>
            <span className={`font-extrabold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{config.chromatic.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={config.chromatic}
            onChange={(e) => handleSlider('chromatic', parseFloat(e.target.value))}
            className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
          />
        </div>

        {/* Vignette */}
        <div className="flex flex-col gap-1">
          <div className={`flex justify-between font-mono text-[11px] ${isLight ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>
            <span>Vignette Edge Shade</span>
            <span className={`font-extrabold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{config.vignette.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.0"
            step="0.05"
            value={config.vignette}
            onChange={(e) => handleSlider('vignette', parseFloat(e.target.value))}
            className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
          />
        </div>

        {/* Edge Bokeh Blur */}
        <div className="flex flex-col gap-1">
          <div className={`flex justify-between font-mono text-[11px] ${isLight ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>
            <span>Corner Bokeh Blur</span>
            <span className={`font-extrabold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{config.edgeBlur.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={config.edgeBlur}
            onChange={(e) => handleSlider('edgeBlur', parseFloat(e.target.value))}
            className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
          />
        </div>

        {/* Grid Spacing */}
        <div className="flex flex-col gap-1">
          <div className={`flex justify-between font-mono text-[11px] ${isLight ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>
            <span>Grid Spacing</span>
            <span className={`font-extrabold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{config.gridSpacing}px</span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            step="5"
            value={config.gridSpacing}
            onChange={(e) => handleSlider('gridSpacing', parseInt(e.target.value, 10))}
            className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
          />
        </div>

        {/* Camera Speed */}
        <div className="flex flex-col gap-1">
          <div className={`flex justify-between font-mono text-[11px] ${isLight ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>
            <span>Camera Damping Speed</span>
            <span className={`font-extrabold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{config.cameraSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="3.0"
            max="16.0"
            step="0.5"
            value={config.cameraSpeed}
            onChange={(e) => handleSlider('cameraSpeed', parseFloat(e.target.value))}
            className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
          />
        </div>

        {/* Minimap Opacity */}
        <div className="flex flex-col gap-1">
          <div className={`flex justify-between font-mono text-[11px] ${isLight ? 'text-slate-800 font-bold' : 'text-slate-300'}`}>
            <span>Radar Minimap Opacity</span>
            <span className={`font-extrabold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{config.minimapOpacity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={config.minimapOpacity}
            onChange={(e) => handleSlider('minimapOpacity', parseFloat(e.target.value))}
            className={`w-full accent-amber-500 cursor-pointer h-1.5 rounded ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
          />
        </div>

        {/* Scanlines Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className={`font-mono text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>CRT Scanlines</span>
          <button
            onClick={() => handleSlider('showScanlines', !config.showScanlines)}
            className={`px-3 py-1 rounded text-xs font-extrabold border transition-all cursor-pointer ${
              config.showScanlines
                ? (isLight ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-amber-500/20 border-amber-500 text-amber-300')
                : (isLight ? 'bg-slate-100 border-slate-300 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400')
            }`}
          >
            {config.showScanlines ? 'ENABLED' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
