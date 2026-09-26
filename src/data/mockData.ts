import { CanvasNode, WireConnection, IntentQuery, LensConfig } from '../types';

export const INITIAL_NODES: CanvasNode[] = [
  // Wallets
  {
    id: 'wallet-ledger',
    title: 'Ledger Vault (Cold Storage)',
    app: 'Ledger X',
    type: 'wallet',
    category: 'Wallet',
    chain: 'Ethereum',
    x: -800,
    y: -380,
    w: 420,
    h: 220,
    valueUsd: 850000,
    pnl24hUsd: 18400,
    pnlPercent: 2.2,
    riskLevel: 'safe',
    strategy: 'Institutional multi-sig cold vault securing primary treasury.',
    exitRoutes: []
  },
  {
    id: 'wallet-phantom',
    title: 'Solana Active Trading Hub',
    app: 'Phantom',
    type: 'wallet',
    category: 'Wallet',
    chain: 'Solana',
    x: 120,
    y: -420,
    w: 420,
    h: 220,
    valueUsd: 345000,
    pnl24hUsd: 11200,
    pnlPercent: 3.35,
    riskLevel: 'safe',
    strategy: 'High-velocity Solana ecosystem operations and yield deployment.',
    exitRoutes: []
  },
  {
    id: 'wallet-arbitrum',
    title: 'Arbitrum DeFi Farmer',
    app: 'Rabby',
    type: 'wallet',
    category: 'Wallet',
    chain: 'Arbitrum',
    x: 1040,
    y: -380,
    w: 420,
    h: 220,
    valueUsd: 178500,
    pnl24hUsd: 2150,
    pnlPercent: 1.22,
    riskLevel: 'safe',
    strategy: 'L2 yield aggregation and GMX liquidity provisioning.',
    exitRoutes: []
  },
  {
    id: 'wallet-hyperliquid',
    title: 'Hyperliquid Margin Account',
    app: 'Hyperliquid',
    type: 'wallet',
    category: 'Wallet',
    chain: 'Hyperliquid',
    x: -800,
    y: 360,
    w: 420,
    h: 220,
    valueUsd: 155000,
    pnl24hUsd: 14300,
    pnlPercent: 10.16,
    riskLevel: 'medium',
    strategy: 'Cross-margin derivatives trading with automated take-profit triggers.',
    exitRoutes: []
  },

  // Positions on Solana Cluster
  {
    id: 'pos-kamino-sol-usdc',
    title: 'Kamino SOL/USDC Concentrated LP',
    app: 'Kamino Finance',
    type: 'position',
    category: 'Yield',
    chain: 'Solana',
    x: -180,
    y: -100,
    w: 460,
    h: 300,
    valueUsd: 240000,
    pnl24hUsd: 4850,
    pnlPercent: 2.06,
    apy: 28.4,
    healthFactor: 2.85,
    liquidationDistancePct: 58.2,
    debtRatioPct: 14.5,
    borrowDebtUsd: 35000,
    riskLevel: 'safe',
    strategy: 'Automated dynamic rebalancing concentrated liquidity vault.',
    collateralAsset: '1,250 SOL ($240,000)',
    borrowAsset: '35,000 USDC',
    fees24hUsd: 186.4,
    auditedBy: ['OtterSec', 'Sec3'],
    oracleProvider: 'Pyth Real-time Sub-second Feed',
    exitRoutes: [
      {
        targetAsset: 'Native SOL',
        estReturn: '1,248.5 SOL ($239,700)',
        fee: '$12.40 (0.005%)',
        timeSeconds: 4,
        routeSummary: 'Instant Unwind -> Raydium Swap -> Phantom Wallet'
      },
      {
        targetAsset: 'Pure USDC',
        estReturn: '239,850 USDC',
        fee: '$8.20 (0.003%)',
        timeSeconds: 3,
        routeSummary: 'Close LP -> Jupiter Route -> USDC Vault'
      }
    ]
  },
  {
    id: 'pos-orca-jito',
    title: 'Orca JitoSOL / SOL Whirlpool',
    app: 'Orca Whirlpools',
    type: 'position',
    category: 'DEX',
    chain: 'Solana',
    x: 360,
    y: -100,
    w: 460,
    h: 300,
    valueUsd: 180000,
    pnl24hUsd: 1650,
    pnlPercent: 0.92,
    apy: 14.8,
    healthFactor: 3.5,
    liquidationDistancePct: 88.0,
    riskLevel: 'safe',
    strategy: 'Correlated LST peg-stability yield generator with MEV kickback.',
    collateralAsset: '850 JitoSOL + 850 SOL',
    fees24hUsd: 73.2,
    auditedBy: ['Kudelski', 'Neodyme'],
    oracleProvider: 'Switchboard Onchain LST Feed',
    exitRoutes: [
      {
        targetAsset: 'Native SOL',
        estReturn: '1,842 SOL ($179,880)',
        fee: '$4.50',
        timeSeconds: 2,
        routeSummary: 'Direct Whirlpool Burn -> Single-token SOL output'
      }
    ]
  },
  {
    id: 'pos-drift-perp',
    title: 'Drift SOL-PERP 10x Degenerate Long',
    app: 'Drift Protocol',
    type: 'position',
    category: 'Perps',
    chain: 'Solana',
    x: 90,
    y: 280,
    w: 460,
    h: 320,
    valueUsd: 68500,
    pnl24hUsd: -12300,
    pnlPercent: -15.22,
    healthFactor: 1.08,
    liquidationPrice: 172.5,
    currentPrice: 188.2,
    liquidationDistancePct: 8.34,
    debtRatioPct: 89.2,
    borrowDebtUsd: 615000,
    riskLevel: 'critical',
    strategy: 'High-leverage aggressive long capturing momentum breakout.',
    collateralAsset: '68,500 USDC Margin',
    borrowAsset: '3,270 SOL ($615,000 Notional)',
    fees24hUsd: 340.0,
    auditedBy: ['Trail of Bits', 'Zellic'],
    oracleProvider: 'Pyth + Drift TWAP Cross-Oracle',
    exitRoutes: [
      {
        targetAsset: 'USDC Margin Buffer',
        estReturn: '67,820 USDC',
        fee: '$68.50 (0.1%)',
        timeSeconds: 2,
        routeSummary: 'EMERGENCY MARKET UNWIND: Drift Orderbook Fill'
      },
      {
        targetAsset: 'Native SOL',
        estReturn: '356.5 SOL',
        fee: '$75.00',
        timeSeconds: 4,
        routeSummary: 'Market Close -> Jup Swap USDC to SOL'
      }
    ]
  },

  // Positions on Arbitrum Cluster
  {
    id: 'pos-gmx-gm-sol',
    title: 'GMX v2 GM-SOL Liquidity Pool',
    app: 'GMX v2',
    type: 'position',
    category: 'DEX',
    chain: 'Arbitrum',
    x: 900,
    y: -100,
    w: 460,
    h: 300,
    valueUsd: 95000,
    pnl24hUsd: 1420,
    pnlPercent: 1.51,
    apy: 34.2,
    healthFactor: 3.1,
    riskLevel: 'safe',
    strategy: 'Market-making liquidity token taking trader loss counterparty yield.',
    collateralAsset: 'GM-SOL LP Tokens',
    fees24hUsd: 88.6,
    auditedBy: ['OpenZeppelin'],
    oracleProvider: 'Chainlink Data Streams Low-Latency',
    exitRoutes: [
      {
        targetAsset: 'USDC.e (Arbitrum)',
        estReturn: '94,880 USDC',
        fee: '$14.20',
        timeSeconds: 5,
        routeSummary: 'Unstake GM Tokens -> Redeem USDC'
      }
    ]
  },
  {
    id: 'pos-aave-eth',
    title: 'Aave v3 wstETH / ETH Collateral Loop',
    app: 'Aave v3',
    type: 'position',
    category: 'Lending',
    chain: 'Ethereum',
    x: -360,
    y: 360,
    w: 460,
    h: 320,
    valueUsd: 320000,
    pnl24hUsd: 3100,
    pnlPercent: 0.98,
    apy: 11.2,
    healthFactor: 1.38,
    liquidationDistancePct: 18.5,
    debtRatioPct: 72.4,
    borrowDebtUsd: 231680,
    riskLevel: 'medium',
    strategy: 'Leveraged liquid staking token carry-trade looping wstETH for ETH.',
    collateralAsset: '98.5 wstETH ($320,000)',
    borrowAsset: '71.2 ETH ($231,680)',
    fees24hUsd: 45.0,
    auditedBy: ['Sigma Prime', 'Certora', 'OpenZeppelin'],
    oracleProvider: 'Chainlink ETH/USD & wstETH/stETH Exchange Rate',
    exitRoutes: [
      {
        targetAsset: 'L1 Pure ETH',
        estReturn: '27.1 ETH Net ($88,100)',
        fee: '$48.00 (L1 Gas)',
        timeSeconds: 15,
        routeSummary: 'Flashloan Deleverage -> Repay ETH -> Return wstETH equity'
      }
    ]
  },

  // Positions on Hyperliquid Cluster
  {
    id: 'pos-hl-btc-perp',
    title: 'Hyperliquid BTC-PERP 5x Cross Long',
    app: 'Hyperliquid',
    type: 'position',
    category: 'Perps',
    chain: 'Hyperliquid',
    x: -360,
    y: 740,
    w: 460,
    h: 320,
    valueUsd: 150000,
    pnl24hUsd: 24500,
    pnlPercent: 19.52,
    healthFactor: 1.22,
    liquidationPrice: 79200,
    currentPrice: 94800,
    liquidationDistancePct: 16.45,
    debtRatioPct: 80.0,
    borrowDebtUsd: 600000,
    riskLevel: 'medium',
    strategy: 'Macro BTC breakout trend-following position with trailing stop.',
    collateralAsset: '150,000 USDC Margin',
    borrowAsset: '7.91 BTC ($750,000 Notional)',
    fees24hUsd: 120.0,
    auditedBy: ['Hyperliquid L1 Consensus Audit'],
    oracleProvider: 'Hyperliquid Internal CEX-Weighted Oracle',
    exitRoutes: [
      {
        targetAsset: 'USDC (Hyperliquid L1)',
        estReturn: '174,500 USDC (including +$24.5k PnL)',
        fee: '$35.00',
        timeSeconds: 1,
        routeSummary: '1-Click L1 Market Close -> USDC Margin Balance'
      }
    ]
  },

  // Positions on Berachain & Pendle
  {
    id: 'pos-pendle-pt',
    title: 'Pendle PT-eETH Fixed Yield 2026',
    app: 'Pendle Finance',
    type: 'position',
    category: 'Yield',
    chain: 'Ethereum',
    x: 900,
    y: 280,
    w: 460,
    h: 300,
    valueUsd: 125000,
    pnl24hUsd: 950,
    pnlPercent: 0.76,
    apy: 9.8,
    healthFactor: 4.0,
    riskLevel: 'safe',
    strategy: 'Zero-slippage locked fixed maturity yield token.',
    collateralAsset: '38.4 PT-eETH',
    fees24hUsd: 12.0,
    auditedBy: ['Ackee Blockchain', 'Dedaub'],
    oracleProvider: 'Chainlink Oracle',
    exitRoutes: [
      {
        targetAsset: 'eETH / Native ETH',
        estReturn: '38.35 eETH ($124,800)',
        fee: '$22.00',
        timeSeconds: 12,
        routeSummary: 'Redeem early via Pendle AMM -> Swap to ETH'
      }
    ]
  }
];

export const INITIAL_WIRES: WireConnection[] = [
  {
    id: 'wire-1',
    fromId: 'wallet-ledger',
    toId: 'pos-aave-eth',
    label: '$320,000 Collateral Backing',
    flowValueUsd: 320000,
    type: 'collateral',
    color: '#38bdf8'
  },
  {
    id: 'wire-2',
    fromId: 'wallet-phantom',
    toId: 'pos-kamino-sol-usdc',
    label: '$240,000 Liquidity Allocation',
    flowValueUsd: 240000,
    type: 'yield',
    color: '#f59e0b'
  },
  {
    id: 'wire-3',
    fromId: 'wallet-phantom',
    toId: 'pos-orca-jito',
    label: '$180,000 Peg Staking',
    flowValueUsd: 180000,
    type: 'yield',
    color: '#10b981'
  },
  {
    id: 'wire-4',
    fromId: 'wallet-phantom',
    toId: 'pos-drift-perp',
    label: '$68,500 High-Risk Margin (10x)',
    flowValueUsd: 68500,
    type: 'debt',
    color: '#ef4444'
  },
  {
    id: 'wire-5',
    fromId: 'wallet-arbitrum',
    toId: 'pos-gmx-gm-sol',
    label: '$95,000 GLP/GM Yield Flow',
    flowValueUsd: 95000,
    type: 'yield',
    color: '#06b6d4'
  },
  {
    id: 'wire-6',
    fromId: 'wallet-ledger',
    toId: 'wallet-hyperliquid',
    label: '$155,000 Cross-Chain Bridge L1',
    flowValueUsd: 155000,
    type: 'bridge',
    color: '#a855f7'
  },
  {
    id: 'wire-7',
    fromId: 'wallet-hyperliquid',
    toId: 'pos-hl-btc-perp',
    label: '$150,000 5x Cross Margin Margin',
    flowValueUsd: 150000,
    type: 'debt',
    color: '#f59e0b'
  },
  {
    id: 'wire-8',
    fromId: 'wallet-arbitrum',
    toId: 'pos-pendle-pt',
    label: '$125,000 Fixed Yield Deposit',
    flowValueUsd: 125000,
    type: 'yield',
    color: '#10b981'
  }
];

export const INTENT_PRESETS: IntentQuery[] = [
  {
    id: 'intent-risk',
    query: 'Show high-risk assets & near-liquidation positions',
    description: 'Filter and spotlight positions with health factor < 1.2 or liquidation distance < 15%.',
    category: 'SAFETY',
    highlightNodeIds: ['pos-drift-perp', 'pos-hl-btc-perp'],
    recommendedRoutes: [
      {
        id: 'route-kill-drift',
        title: '1-Click Emergency Unwind Drift 10x Long',
        tag: 'SAFEST',
        estTime: '3.2s',
        gasCost: '$0.008 (Solana)',
        riskChange: 'Critical (1.08 HF) -> 100% Safe (Cash USDC)',
        steps: [
          {
            stepNumber: 1,
            type: 'withdraw',
            protocol: 'Drift Protocol',
            fromAsset: '3,270 SOL Long Position',
            fromChain: 'Solana',
            amount: '$615,000 Notional',
            estTime: '1.2s',
            gasCost: '$0.004',
            slippage: '0.08%'
          },
          {
            stepNumber: 2,
            type: 'swap',
            protocol: 'Jupiter Aggregator',
            fromAsset: 'Remaining Unsettled PnL',
            toAsset: 'USDC',
            fromChain: 'Solana',
            amount: '$67,820 USDC',
            estTime: '1.8s',
            gasCost: '$0.004',
            slippage: '0.02%'
          },
          {
            stepNumber: 3,
            type: 'deposit',
            protocol: 'Phantom Wallet Cold Ledger',
            fromAsset: 'Clean Stables',
            fromChain: 'Solana',
            amount: '67,820 USDC',
            estTime: '0.2s',
            gasCost: '$0.000'
          }
        ]
      }
    ]
  },
  {
    id: 'intent-usdc',
    query: 'Find all USDC positions & stablecoin yields',
    description: 'Spotlight all vaults, liquidity pools, and margin balances holding or generating USDC.',
    category: 'SEARCH',
    highlightNodeIds: ['pos-kamino-sol-usdc', 'pos-drift-perp', 'pos-hl-btc-perp'],
    recommendedRoutes: [
      {
        id: 'route-optimize-usdc',
        title: 'Rebalance idle USDC to Kamino Automated Stables Vault (19.4% APY)',
        tag: 'RECOMMENDED',
        estTime: '4.8s',
        gasCost: '$0.012',
        netApyImpact: '+8.2% Net Portfolio APY Boost',
        steps: [
          {
            stepNumber: 1,
            type: 'withdraw',
            protocol: 'Arbitrum Farmer Wallet',
            fromAsset: 'Idle USDC.e',
            fromChain: 'Arbitrum',
            amount: '45,000 USDC.e',
            estTime: '1.5s',
            gasCost: '$0.40'
          },
          {
            stepNumber: 2,
            type: 'bridge',
            protocol: 'deBridge DLN High-Speed L2-SVM',
            fromAsset: 'USDC.e (Arbitrum)',
            toAsset: 'Native USDC (Solana)',
            fromChain: 'Arbitrum',
            toChain: 'Solana',
            amount: '44,990 USDC',
            estTime: '2.5s',
            gasCost: '$1.20',
            slippage: '0.01%'
          },
          {
            stepNumber: 3,
            type: 'deposit',
            protocol: 'Kamino Finance Vault',
            fromAsset: 'USDC',
            fromChain: 'Solana',
            amount: '44,990 USDC',
            estTime: '0.8s',
            gasCost: '$0.005'
          }
        ]
      }
    ]
  },
  {
    id: 'intent-rebalance-arb-sol',
    query: 'Rebalance idle Arbitrum stables into Kamino Solana vault',
    description: 'Automated cross-chain route migrating idle liquidity to highest risk-adjusted yield venue.',
    category: 'REBALANCE',
    highlightNodeIds: ['wallet-arbitrum', 'pos-kamino-sol-usdc'],
    recommendedRoutes: [
      {
        id: 'route-fast-bridge',
        title: 'deBridge Ultra-Fast Cross-Chain Pipeline',
        tag: 'FASTEST',
        estTime: '6.5s',
        gasCost: '$1.45',
        netApyImpact: '+28.4% APY on Solana',
        steps: [
          {
            stepNumber: 1,
            type: 'withdraw',
            protocol: 'Arbitrum Wallet',
            fromAsset: 'USDC.e',
            fromChain: 'Arbitrum',
            amount: '35,000 USDC.e',
            estTime: '1.2s',
            gasCost: '$0.35'
          },
          {
            stepNumber: 2,
            type: 'bridge',
            protocol: 'deBridge DLN 0-Slippage Intent',
            fromAsset: 'USDC.e',
            toAsset: 'SOL USDC',
            fromChain: 'Arbitrum',
            toChain: 'Solana',
            amount: '34,995 USDC',
            estTime: '4.1s',
            gasCost: '$1.10',
            slippage: '0.00%'
          },
          {
            stepNumber: 3,
            type: 'deposit',
            protocol: 'Kamino Concentrated Vault',
            fromAsset: 'USDC',
            fromChain: 'Solana',
            amount: '34,995 USDC',
            estTime: '1.2s',
            gasCost: '$0.004'
          }
        ]
      },
      {
        id: 'route-cheap-bridge',
        title: 'Across Protocol Standard Bridge Pipeline',
        tag: 'CHEAPEST',
        estTime: '45s',
        gasCost: '$0.65',
        netApyImpact: '+28.4% APY',
        steps: [
          {
            stepNumber: 1,
            type: 'bridge',
            protocol: 'Across Protocol',
            fromAsset: 'USDC.e',
            toAsset: 'USDC',
            fromChain: 'Arbitrum',
            toChain: 'Solana',
            amount: '35,000 USDC',
            estTime: '40s',
            gasCost: '$0.60'
          },
          {
            stepNumber: 2,
            type: 'deposit',
            protocol: 'Kamino Finance',
            fromAsset: 'USDC',
            fromChain: 'Solana',
            amount: '35,000 USDC',
            estTime: '5s',
            gasCost: '$0.005'
          }
        ]
      }
    ]
  },
  {
    id: 'intent-hedge-eth',
    query: 'Hedge ETH drop with 3x Short on Hyperliquid',
    description: 'Calculate delta-neutral hedge for $320k wstETH collateral against systemic downside.',
    category: 'HEDGE',
    highlightNodeIds: ['pos-aave-eth', 'wallet-hyperliquid', 'pos-hl-btc-perp'],
    recommendedRoutes: [
      {
        id: 'route-hedge-hl',
        title: 'Automated 1-Click Delta-Neutral Hedge Position',
        tag: 'RECOMMENDED',
        estTime: '2.1s',
        gasCost: '$0.05',
        riskChange: 'Portfolio Delta: +124 ETH -> 0 Net Delta (Protected)',
        steps: [
          {
            stepNumber: 1,
            type: 'deposit',
            protocol: 'Hyperliquid Margin Engine',
            fromAsset: 'USDC Collateral',
            fromChain: 'Hyperliquid',
            amount: '$50,000 USDC',
            estTime: '0.8s',
            gasCost: '$0.01'
          },
          {
            stepNumber: 2,
            type: 'swap',
            protocol: 'Hyperliquid Orderbook',
            fromAsset: 'ETH-PERP Short 3x',
            fromChain: 'Hyperliquid',
            amount: '70 ETH ($228,000 Notional)',
            estTime: '1.3s',
            gasCost: '$0.04',
            slippage: '0.01%'
          }
        ]
      }
    ]
  }
];

export const DEFAULT_LENS_CONFIG: LensConfig = {
  accent: '#f59e0b',
  accentRgb: [0.96, 0.62, 0.04],
  themeMode: 'dark',
  distort: 0.14,
  contrast: 1.08,
  feather: 0.025,
  edgeBlur: 0.25,
  edgeBlurStart: 0.45,
  vignette: 0.35,
  chromatic: 0.45,
  gridSpacing: 40,
  cameraSpeed: 8.0,
  minimapOpacity: 0.85,
  overviewScale: 0.32,
  normalScale: 0.76,
  showScanlines: true
};

export const THEME_PRESETS: Record<string, Partial<LensConfig> & { name: string }> = {
  amber: {
    name: 'Omarchy Amber',
    accent: '#f59e0b',
    accentRgb: [0.96, 0.62, 0.04],
    distort: 0.14,
    chromatic: 0.45,
    vignette: 0.35,
    edgeBlur: 0.25
  },
  cyan: {
    name: 'Cyberpunk Cyan',
    accent: '#06b6d4',
    accentRgb: [0.02, 0.71, 0.83],
    distort: 0.16,
    chromatic: 0.60,
    vignette: 0.40,
    edgeBlur: 0.30
  },
  matrix: {
    name: 'Matrix Emerald',
    accent: '#10b981',
    accentRgb: [0.06, 0.72, 0.51],
    distort: 0.12,
    chromatic: 0.30,
    vignette: 0.30,
    edgeBlur: 0.15
  },
  magenta: {
    name: 'Synthwave Magenta',
    accent: '#ec4899',
    accentRgb: [0.92, 0.28, 0.60],
    distort: 0.18,
    chromatic: 0.70,
    vignette: 0.50,
    edgeBlur: 0.35
  },
  flat: {
    name: 'Clean Flat (No Curve)',
    accent: '#38bdf8',
    accentRgb: [0.22, 0.74, 0.97],
    distort: 0.0,
    chromatic: 0.0,
    vignette: 0.0,
    edgeBlur: 0.0
  }
};
