# Aether — Spatial DeFi Workspace & Execution Layer

> **A visual, intent-driven portfolio and execution layer. Explore cross-chain positions, understand systemic exposure, and preview transactions through an infinite zoomable canvas.**

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![Built with WebGL 2.0](https://img.shields.io/badge/Engine-WebGL%202.0%20%2B%20Canvas-cyan.svg)]()

---

## 🌌 The Pitch & Core Idea

Managing modern DeFi portfolios across multiple chains (Solana, Arbitrum, Ethereum, Hyperliquid) has become fragmented, opaque, and cognitively exhausting. Traditional dashboards present static lists of numbers that fail to illustrate **where your collateral is locked**, **which debt obligations depend on what assets**, and **what happens before you sign a transaction**.

**Aether** reimagines portfolio management by turning your assets into a **persistent, zoomable spatial workspace**:
- **Infinite Canvas:** Wallets, positions, protocols, chains, and pending transactions live as connected, interactive objects on one endless plane.
- **True Systemic Context:** Zoom out to see macro asset allocation, net exposure, and aggregate PnL. Zoom in to dissect smart contract risk, liquidation thresholds, and exit routes.
- **Intent-Driven Execution:** Type what you want to achieve in natural language and watch the visual execution route assemble in real time with end-to-end simulation before signing.

---

## 🖥️ The Three Core Screens

Aether is intentionally built around a focused, high-density 3-screen workflow:

```
+---------------------------------------------------------------------------------------------------+
|  [AETHER // SPATIAL DEFI]       Total Value: $1,428,500   24h PnL: +$32,450 (+2.3%)   Health: 2.18 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|    [Solana Cluster]                     [Arbitrum Cluster]                 [Radar Minimap]        |
|    +-------------------+                +-------------------+              +------------------+   |
|    | Main Ledger       | ===(wire)===>  | Arbitrum Vault    |              | [..] [..]        |   |
|    | $850,000          |                | $380,000          |              |       [Cam Box]  |   |
|    +-------------------+                +-------------------+              +------------------+   |
|            |                                    |                                                 |
|            v                                    v                          [Live Tuner / Lens]    |
|    +-------------------+                +-------------------+              - Barrel Distortion    |
|    | Kamino SOL/USDC   |                | Hyperliquid Perp  |              - Chromatic Aberration |
|    | APY: 24.5% [SAFE] |                | BTC Long 3x [MED] |              - CRT Scanlines / HUD  |
|    +-------------------+                +-------------------+                                     |
|                                                                                                   |
|  [SCREEN 2: INTENT / SEARCH PANEL] (Summoned via CMD+K / / / SUPER+CTRL+G)                         |
|  > "Exit all high-risk USDC positions to Solana SOL"                                              |
|  [Recommended Visual Route: Step 1 Unstake -> Step 2 deBridge -> Step 3 Jup Swap]                  |
|                                                                                                   |
|  [SCREEN 3: POSITION DETAIL & EMERGENCY KILL SWITCH] (Zoomed on Node Click)                       |
|  - Strategy Breakdown | Liquidation Distance (-28%) | Simulation Flow | [⚡ 1-CLICK KILL SWITCH]    |
+---------------------------------------------------------------------------------------------------+
```

### 1. Spatial Canvas (Assets, Protocols, Chains & Exposure)
- **Connected Graph Nodes:** Visualizes wallets (Cold Ledger, Trading Wallets), protocols (Kamino, Orca, Raydium, Aave v3, GMX, Hyperliquid), and LP/Perp positions connected via animated bezier flow wires.
- **Exposure & Risk Heatmap:** Color-coded border glow indicating position health (Safe, Moderate, High Risk, Liquidation Alert).
- **Aether Post-Processing Lens:** Custom WebGL 2.0 Barrel Shader engine featuring chromatic aberration, vignette, curvature distortion, and interactive dot-grid backdrop.
- **Persistent Workspace:** Rearrange your nodes freely; positions are remembered locally. Includes `Smart Arrange` (Ctrl+A) to cluster nodes by chain or risk category.

### 2. Intent / Search Panel (NLP Request + Recommended Routes)
- **Instant NLP Command Bar:** Trigger with `Cmd+K`, `/`, or `SUPER+CTRL+G`. Type queries like:
  - *"Find all USDC lending positions"*
  - *"Show high risk perps with leverage > 3x"*
  - *"Rebalance idle Arbitrum stables into Kamino Solana vault"*
  - *"Close high risk positions and hedge ETH"*
- **Visual Route Preview:** Renders animated step-by-step transaction pipelines across bridges, DEX swaps, and liquidity vaults before signing.
- **Route Optimization Engine:** Automatically compares routes by Fastest Speed, Lowest Gas, and Minimal Slippage.

### 3. Position Detail & Safety Hub (Risk, Preview & Kill Switch)
- **Deep Zoom Inspection:** Seamlessly glides the camera into the selected position node.
- **Liquidation & Health Gauge:** Real-time distance-to-liquidation tracker, borrow APRs, and oracle dependency analysis.
- **Pre-computed Exit Routes:** Clear, unambiguous exit pathways to safe native assets (SOL/USDC/ETH).
- **⚡ 1-Click Emergency Kill Switch:** Instant emergency unwind mechanism that revokes permissions, withdraws collateral, and converts to safe stables with MEV protection.

---

## ⌨️ Keyboard Shortcuts & Controls

| Shortcut | Action |
| --- | --- |
| `SUPER + CTRL + G` / `Cmd + K` / `/` | Toggle Intent Navigator / Zoom Overview |
| `Click + Drag` | Pan Infinite Canvas |
| `Mouse Wheel` | Smooth Zoom In / Zoom Out |
| `Ctrl + A` | Smart Arrange Nodes by Chain / Risk Cluster |
| `Ctrl + Z` | Undo Canvas Arrangement |
| `Ctrl + ,` | Open Live CRT Lens & Shader Tuner |
| `F1` | Help & Shortcuts Guide |
| `Esc` | Reset Camera to Full Exposure / Dismiss Panels |

---

## 🛠️ Architecture & Tech Stack

- **Frontend Core:** React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Nansen Onchain Intelligence:** Profiler API, Smart Money Netflows, Token God Mode, and Nansen AI Research Agent (`/api/v1/agent/fast`).
- **Spatial Shader Engine:** WebGL 2.0 Post-Processing Pipeline (exact mathematical port of `barrel.frag` with golden-angle disc bokeh blur, radial chromatic aberration, and pincushion/barrel distortion).
- **State & Coordinate System:** Zero-latency 2D camera transform with smooth spring damping physics.
- **Production Deployment:** Multi-stage Docker container served via Node.js Express on Railway.

---

## 💎 Nansen API Integration (Meridian Buildathon)

Aether connects directly to Nansen's onchain intelligence layer to drive spatial graph generation, smart money divergence alerts, and AI-driven intent routing:

1. **Live Entity & Spatial Graph Profiler (`/api/v1/profiler/*`)**:
   - Fetches token balances (`/profiler/address/current-balance`) and related wallet clusters (`/profiler/address/related-wallets`).
   - Automatically constructs the spatial node-wire graph with entity relations (First Funder, Multisig Signer, Token Millionaire).
2. **Smart Money Flow & Divergence Signals (`/api/v1/smart-money/netflow`)**:
   - Real-time 24h net inflow/outflow tags and trader counts on canvas token nodes.
   - Highlights smart money accumulation (`+SM Inflow`) and warns on distribution/dumping.
3. **Nansen AI Research Agent (`/api/v1/agent/fast`)**:
   - Streamed natural language onchain intelligence inside the Intent Engine (`Cmd+K`).
   - Translates questions into reasoning, tool calls, and auto-focuses corresponding portfolio nodes.
4. **Meridian Buildathon Call Counter & Zero-Crash Architecture**:
   - Integrated API usage counter tracking progress toward the 1,000 calls requirement.
   - Secure proxy layer hiding API keys from client exposure + resilient fallback snapshots for 100% uptime.

---

## 🚀 Quickstart & Local Development

### Prerequisites
- Node.js 18+ or Bun / pnpm

```bash
# Clone the repository
git clone https://github.com/Huc06/aether.git
cd aether

# Configure environment variables
cp .env.example .env
# Edit .env and enter your NANSEN_API_KEY (optional: comes pre-configured with demo key)

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploy to Railway

This project is configured out-of-the-box for Railway deployment:

1. Connect your GitHub repository to [Railway](https://railway.app).
2. Railway will automatically detect the `Dockerfile` and `railway.json`.
3. Or deploy directly via Railway CLI:
```bash
railway login
railway init
railway up
```
