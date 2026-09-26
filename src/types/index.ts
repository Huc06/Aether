export type RiskLevel = 'safe' | 'medium' | 'high' | 'critical';

export type NodeType = 'wallet' | 'chain' | 'protocol' | 'position';

export interface RouteStep {
  stepNumber: number;
  type: 'bridge' | 'swap' | 'stake' | 'deposit' | 'withdraw' | 'repay' | 'revoke';
  protocol: string;
  fromAsset: string;
  toAsset?: string;
  fromChain: string;
  toChain?: string;
  amount: string;
  estTime: string;
  gasCost: string;
  slippage?: string;
  status?: 'pending' | 'simulating' | 'completed';
}

export interface RecommendedRoute {
  id: string;
  title: string;
  tag: 'FASTEST' | 'CHEAPEST' | 'SAFEST' | 'RECOMMENDED';
  steps: RouteStep[];
  estTime: string;
  gasCost: string;
  netApyImpact?: string;
  riskChange?: string;
}

export interface PositionExitRoute {
  targetAsset: string;
  estReturn: string;
  fee: string;
  timeSeconds: number;
  routeSummary: string;
}

export interface CanvasNode {
  id: string;
  title: string;
  app: string;
  type: NodeType;
  category: 'Wallet' | 'Chain' | 'Lending' | 'DEX' | 'Perps' | 'Yield' | 'Staking';
  chain: 'Solana' | 'Arbitrum' | 'Ethereum' | 'Hyperliquid' | 'Berachain';
  x: number;
  y: number;
  w: number;
  h: number;
  focused?: boolean;
  isPinned?: boolean;
  isFilled?: boolean;
  originalBounds?: { x: number; y: number; w: number; h: number };
  
  // Financial metrics
  valueUsd: number;
  pnl24hUsd?: number;
  pnlPercent?: number;
  apy?: number;
  healthFactor?: number;
  liquidationPrice?: number;
  currentPrice?: number;
  liquidationDistancePct?: number;
  debtRatioPct?: number;
  borrowDebtUsd?: number;
  riskLevel: RiskLevel;

  // Position Details
  strategy?: string;
  collateralAsset?: string;
  borrowAsset?: string;
  fees24hUsd?: number;
  auditedBy?: string[];
  oracleProvider?: string;
  exitRoutes?: PositionExitRoute[];

  // Nansen Onchain Intelligence Signals
  nansenLabel?: string;
  smartMoneyNetflow24h?: number;
  smartMoneyTraderCount?: number;
  nansenDivergence?: 'accumulating' | 'distributing' | 'neutral';
  relationType?: string;
  transactionHash?: string;
}

export interface WireConnection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  flowValueUsd?: number;
  color?: string;
  type: 'collateral' | 'debt' | 'yield' | 'bridge';
}

export interface LensConfig {
  accent: string;
  accentRgb: [number, number, number];
  distort: number;
  contrast: number;
  feather: number;
  edgeBlur: number;
  edgeBlurStart: number;
  vignette: number;
  chromatic: number;
  gridSpacing: number;
  cameraSpeed: number;
  minimapOpacity: number;
  overviewScale: number;
  normalScale: number;
  showScanlines: boolean;
}

export interface IntentQuery {
  id: string;
  query: string;
  description: string;
  category: 'SEARCH' | 'REBALANCE' | 'SAFETY' | 'HEDGE' | 'YIELD';
  highlightNodeIds: string[];
  recommendedRoutes?: RecommendedRoute[];
}
