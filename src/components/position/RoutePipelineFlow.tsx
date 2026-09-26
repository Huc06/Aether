import React from 'react';
import { ArrowRight, CircleDot } from 'lucide-react';

interface RoutePipelineFlowProps {
  summary: string;
  isLight?: boolean;
  isSelected?: boolean;
}

export const RoutePipelineFlow: React.FC<RoutePipelineFlowProps> = ({
  summary,
  isLight = false,
  isSelected = false,
}) => {
  const steps = summary.split('->').map(s => s.trim()).filter(Boolean);

  if (steps.length <= 1) {
    return (
      <div 
        title={summary}
        className={`text-[10px] font-mono flex items-center gap-1.5 truncate pt-1 border-t ${
          isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
        }`}
      >
        <CircleDot className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        <span className="truncate">{summary}</span>
      </div>
    );
  }

  return (
    <div className={`pt-1.5 border-t flex items-center gap-1 overflow-x-auto no-scrollbar ${
      isLight ? 'border-slate-200/80' : 'border-slate-800/80'
    }`}>
      {steps.map((step, idx) => (
        <React.Fragment key={idx}>
          <span 
            title={step}
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono tracking-tight whitespace-nowrap truncate max-w-[130px] border transition-colors ${
              idx === steps.length - 1
                ? (isSelected 
                    ? (isLight ? 'bg-slate-200 text-slate-900 border-slate-300 font-bold' : 'bg-slate-800 text-white border-slate-700 font-bold')
                    : (isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-900 text-slate-300 border-slate-800'))
                : (isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950/80 text-slate-400 border-slate-800/60')
            }`}
          >
            {step}
          </span>
          {idx < steps.length - 1 && (
            <ArrowRight className={`w-2.5 h-2.5 shrink-0 opacity-60 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
