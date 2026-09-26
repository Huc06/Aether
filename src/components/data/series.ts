import { CanvasNode } from '../../types';

export interface ChartPoint {
  index: number;
  label: string;
  value: number;
  secondaryValue?: number;
  changePct?: number;
}

/**
 * Fast 32-bit FNV-1a hash for deterministic seeds.
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic Mulberry32 PRNG.
 */
function createRng(seed: number) {
  let s = seed | 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a deterministic 30-point portfolio exposure series anchored on the current total value.
 */
export function derivePortfolioExposureSeries(
  nodes: CanvasNode[],
  points: number = 30
): ChartPoint[] {
  const totalValue = nodes.reduce((sum, n) => sum + (n.valueUsd || 0), 0);
  const totalPnl24h = nodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0);
  
  if (points <= 0) return [];
  if (totalValue === 0) {
    return Array.from({ length: points }, (_, i) => ({
      index: i,
      label: i === points - 1 ? 'NOW' : `T-${points - 1 - i}d`,
      value: 0,
      changePct: 0,
    }));
  }

  // Seed derived from node IDs, values, and total
  const seedString = nodes
    .map((n) => `${n.id}:${Math.round(n.valueUsd)}`)
    .sort()
    .join('|') + `::${Math.round(totalValue)}`;
  const rng = createRng(hashString(seedString));

  // Determine an overall 30-day drift trend
  // If 24h PnL is positive, bias upward slightly, but maintain realistic historical fluctuation
  const pnlFraction = totalValue > 0 ? totalPnl24h / totalValue : 0;
  const net30dDrift = Math.min(0.25, Math.max(-0.25, pnlFraction * 12));
  
  // We work forward and then rescale so the final value strictly equals totalValue
  const rawValues: number[] = [];
  let current = 1000;
  rawValues.push(current);

  const stepDrift = net30dDrift / points;
  for (let i = 1; i < points; i++) {
    // seeded step with slight mean-reverting momentum
    const noise = (rng() - 0.485) * 0.035;
    current = current * (1 + stepDrift + noise);
    // prevent negative or degenerate numbers
    current = Math.max(10, current);
    rawValues.push(current);
  }

  // Anchor final point to totalValue
  const finalRaw = rawValues[rawValues.length - 1];
  const scale = totalValue / finalRaw;

  return rawValues.map((val, i) => {
    const value = Math.round(val * scale * 100) / 100;
    const startVal = rawValues[0] * scale;
    const changePct = startVal > 0 ? ((value - startVal) / startVal) * 100 : 0;
    const daysAgo = points - 1 - i;
    const label = daysAgo === 0 ? 'NOW' : `T-${daysAgo}d`;

    return {
      index: i,
      label,
      value,
      changePct: Math.round(changePct * 100) / 100,
    };
  });
}

/**
 * Generate a deterministic 24-point (hourly) or 30-point cumulative PnL series.
 */
export function derivePortfolioPnlSeries(
  nodes: CanvasNode[],
  points: number = 24
): ChartPoint[] {
  const totalPnl24h = nodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0);
  const totalValue = nodes.reduce((sum, n) => sum + (n.valueUsd || 0), 0);

  if (points <= 0) return [];

  const seedString = nodes
    .map((n) => `${n.id}:${n.pnl24hUsd ?? 0}`)
    .sort()
    .join('|') + `::PNL::${Math.round(totalPnl24h)}`;
  const rng = createRng(hashString(seedString));

  // Hourly steps from 24h ago to now
  // Final point must equal totalPnl24h
  const steps: number[] = [0];
  let acc = 0;
  for (let i = 1; i < points; i++) {
    const delta = (rng() - 0.48) * 1.5;
    acc += delta;
    steps.push(acc);
  }

  // Rescale cumulative steps so endpoint = totalPnl24h
  const lastStep = steps[steps.length - 1];
  const result: ChartPoint[] = [];

  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    // Interpolate so endpoint lands precisely on totalPnl24h
    let pnlVal: number;
    if (Math.abs(lastStep) > 0.001) {
      pnlVal = (steps[i] / lastStep) * totalPnl24h;
    } else {
      pnlVal = t * totalPnl24h;
    }
    // Add small intermediate wobble that vanishes at t=0 and t=1
    const bridgeWobble = Math.sin(t * Math.PI) * (totalValue * 0.0015) * (rng() - 0.5);
    const value = Math.round((pnlVal + bridgeWobble) * 100) / 100;
    
    // Ensure final point is exact
    const finalValue = i === points - 1 ? totalPnl24h : value;
    const hoursAgo = points - 1 - i;
    const label = hoursAgo === 0 ? 'NOW' : `-${hoursAgo}h`;

    result.push({
      index: i,
      label,
      value: finalValue,
    });
  }

  return result;
}

/**
 * Generate a deterministic array of numbers for a node sparkline.
 * Anchored so the last item equals node.valueUsd, and the trend reflects pnlPercent.
 */
export function deriveNodeSparkline(
  node: CanvasNode,
  points: number = 16
): number[] {
  if (points <= 1) return [node.valueUsd];

  const seed = hashString(`${node.id}:${node.valueUsd}:${node.pnlPercent || 0}:${node.chain}`);
  const rng = createRng(seed);

  const endVal = node.valueUsd;
  const pnlPct = (node.pnlPercent ?? 0) / 100;
  // If pnlPct is +5%, start was endVal / 1.05
  const startVal = pnlPct !== -1 ? endVal / (1 + pnlPct) : endVal * 0.9;
  
  const raw: number[] = [startVal];
  let curr = startVal;
  const netStep = (endVal - startVal) / (points - 1);
  const volatility = Math.abs(endVal * 0.015);

  for (let i = 1; i < points - 1; i++) {
    const noise = (rng() - 0.5) * volatility;
    curr += netStep + noise;
    // Keep strictly positive
    curr = Math.max(endVal * 0.1, curr);
    raw.push(curr);
  }
  raw.push(endVal);

  return raw.map((v) => Math.round(v * 100) / 100);
}
