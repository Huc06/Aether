import React, { useRef, useEffect, useState } from 'react';
import { createDecryptReveal, type DecryptRevealInstance } from '../../engine/decryptRevealEngine';
import { createCipherField, type CipherFieldInstance } from '../../engine/cipherFieldEngine';
import { createDomRaster } from '../../engine/domRaster';

export interface DecryptGateProps {
  children: React.ReactNode;
  active?: boolean;
  onToggleActive?: () => void;
  isLight?: boolean;
  className?: string;
  subject?: string;
}

export const DecryptGate: React.FC<DecryptGateProps> = ({
  children,
  active = false,
  onToggleActive,
  isLight = false,
  className = '',
  subject = 'encrypted telemetry',
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<'decrypt-reveal' | 'cipher-field' | 'none'>('none');
  const instanceRef = useRef<DecryptRevealInstance | CipherFieldInstance | null>(null);

  useEffect(() => {
    if (!active) {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      setEngine('none');
      return;
    }

    const host = hostRef.current;
    const content = contentRef.current;
    const canvas = canvasRef.current;
    if (!host || !content || !canvas) return;

    const accentColor = isLight ? '#b45309' : '#f59e0b';
    const bgColor = isLight ? '#f8fafc' : '#07090e';

    const raster = createDomRaster(content, bgColor);
    let instance: DecryptRevealInstance | CipherFieldInstance | null = null;

    if (raster) {
      instance = createDecryptReveal(
        {
          source: document.createElement('canvas'),
          content,
          output: canvas,
          capture: (dpr) => (raster.paint(dpr) ? raster.canvas : null),
        },
        {
          radius: 220,
          softness: 0.55,
          cell: 11,
          aspect: 0.7,
          color: accentColor,
          background: bgColor,
          colored: 1,
          passthrough: 0.08,
          aberration: 8,
          edgeGlow: 2.2,
          edgeFlicker: 1,
        }
      );
    }

    if (instance) {
      setEngine('decrypt-reveal');
    } else {
      instance = createCipherField(
        { surface: canvas, host },
        {
          radius: 200,
          softness: 0.55,
          cell: 12,
          color: accentColor,
          opacity: 0.75,
        }
      );
      setEngine(instance ? 'cipher-field' : 'none');
    }

    instanceRef.current = instance;

    return () => {
      instance?.destroy();
      instanceRef.current = null;
    };
  }, [active, isLight]);

  return (
    <div
      ref={hostRef}
      className={`cipher-host relative w-full min-w-0 ${className}`}
      data-engine={engine}
    >
      {/* Content to be veiled */}
      <div
        ref={contentRef}
        className={`cipher-content w-full min-w-0 transition-opacity duration-200 ${
          active ? 'select-none pointer-events-none' : ''
        }`}
      >
        {children}
      </div>

      {/* Blur layer for 2D fallback */}
      {active && engine === 'cipher-field' && (
        <div
          aria-hidden
          className="cipher-blur absolute inset-0 z-10 pointer-events-none"
        />
      )}

      {/* WebGL2 / 2D Canvas Glyph Overlay */}
      {active && (
        <canvas
          ref={canvasRef}
          aria-hidden
          className="cipher-glyphs absolute inset-0 z-20 w-full h-full pointer-events-none"
        />
      )}

      {/* Floating Prompt & Scanner Control */}
      {active && (
        <div className="absolute top-4 right-4 z-30 pointer-events-auto">
          <div className={`glass-panel px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-xl ${
            isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-slate-900/95 border-amber-500/40 text-amber-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
              [ SCANNER ACTIVE: {subject} ]
            </span>
            {onToggleActive && (
              <button
                onClick={onToggleActive}
                className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900' 
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}
              >
                Disable
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
