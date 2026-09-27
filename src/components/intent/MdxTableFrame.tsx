import React from 'react';
import { Frame } from '../terminal/Frame';
import { DrawablyHighlight } from 'drawably/react';

export interface MdxTableTokenRow {
  symbol: string;
  netflow24h: string;
  fundsCount: number;
  signal: 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL';
  volume24h: string;
  isTopPick?: boolean;
}

interface MdxTableFrameProps {
  title?: string;
  rows?: MdxTableTokenRow[];
  isLight?: boolean;
}

const DEFAULT_ROWS: MdxTableTokenRow[] = [
  { symbol: 'PENDLE', netflow24h: '+$1,420,500', fundsCount: 24, signal: 'ACCUMULATION', volume24h: '$48.2M', isTopPick: true },
  { symbol: 'QNT', netflow24h: '+$890,200', fundsCount: 18, signal: 'ACCUMULATION', volume24h: '$22.5M' },
  { symbol: 'WTAO', netflow24h: '+$640,000', fundsCount: 14, signal: 'ACCUMULATION', volume24h: '$18.1M' },
  { symbol: 'ETHFI', netflow24h: '-$420,000', fundsCount: 12, signal: 'DISTRIBUTION', volume24h: '$14.8M' },
];

export const MdxTableFrame: React.FC<MdxTableFrameProps> = ({
  title = 'Nansen Smart Money Accumulation Screener',
  rows = DEFAULT_ROWS,
  isLight = false,
}) => {
  return (
    <Frame title={title} isLight={isLight} surface="card" className="my-2">
      <div className="overflow-x-auto no-scrollbar font-mono text-xs w-full">
        <div className={`min-w-[540px] grid grid-cols-12 gap-2 pb-2 border-b text-[10px] font-bold uppercase tracking-wider ${
          isLight ? 'border-slate-300 text-slate-700' : 'border-white/10 text-slate-400'
        }`}>
          <div className="col-span-2">Token</div>
          <div className="col-span-3 text-right">24h Netflow</div>
          <div className="col-span-2 text-center">SM Funds</div>
          <div className="col-span-3 text-center">Signal</div>
          <div className="col-span-2 text-right">24h Vol</div>
        </div>

        <div className={`min-w-[540px] flex flex-col ${isLight ? 'divide-y divide-slate-200' : 'divide-y divide-white/5'}`}>
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 py-2 items-center">
              <div className="col-span-2 flex items-center gap-1.5 font-bold">
                {r.isTopPick ? (
                  <DrawablyHighlight
                    seed={idx + 42}
                    roughness={1}
                    boil={0.2}
                    fill={isLight ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.25)'}
                    className="inline-flex"
                  >
                    <span className={isLight ? 'text-amber-950 font-black' : 'text-cyan-300 font-black'}>
                      {r.symbol}
                    </span>
                  </DrawablyHighlight>
                ) : (
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>{r.symbol}</span>
                )}
              </div>

              <div className={`col-span-3 text-right font-bold tabular-nums ${
                r.netflow24h.startsWith('+') 
                  ? (isLight ? 'text-emerald-700' : 'text-emerald-400') 
                  : (isLight ? 'text-rose-700' : 'text-rose-400')
              }`}>
                {r.netflow24h}
              </div>

              <div className={`col-span-2 text-center font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {r.fundsCount} funds
              </div>

              <div className="col-span-3 text-center">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                  r.signal === 'ACCUMULATION'
                    ? (isLight ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-emerald-950 text-emerald-400 border-emerald-800')
                    : (isLight ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-rose-950 text-rose-400 border-rose-800')
                }`}>
                  {r.signal}
                </span>
              </div>

              <div className={`col-span-2 text-right font-mono ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                {r.volume24h}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
};
