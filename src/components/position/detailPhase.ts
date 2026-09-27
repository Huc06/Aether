import { CanvasNode, RiskLevel } from '../../types';

export type DetailPhase = 'none' | 'peek' | 'sheet' | 'inspect' | 'confirm';

export function initialPhaseForNode(node: CanvasNode): Exclude<DetailPhase, 'none' | 'confirm'> {
  return node.riskLevel === 'critical' ? 'sheet' : 'peek';
}

export function riskRailClass(risk: RiskLevel, isLight: boolean): string {
  if (risk === 'critical') return isLight ? 'border-l-rose-600' : 'border-l-rose-500';
  if (risk === 'high') return isLight ? 'border-l-amber-600' : 'border-l-amber-500';
  return isLight ? 'border-l-emerald-600' : 'border-l-emerald-500';
}

export function instrumentPanelClass(risk: RiskLevel, isLight: boolean): string {
  const rail = riskRailClass(risk, isLight);
  return isLight
    ? `rounded-lg border border-slate-300 bg-white border-l-2 pl-3 ${rail}`
    : `rounded-lg border border-white/10 bg-transparent border-l-2 pl-3 ${rail}`;
}
