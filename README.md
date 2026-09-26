<p align="center">
  <a href="https://github.com/Huc06/Aether">
    <img src="https://raw.githubusercontent.com/Huc06/Aether/main/docs/brand/aether-banner.svg" alt="Aether Spatial DeFi Workspace Banner" width="100%" onerror="this.style.display='none'" />
  </a>
</p>

<h1 align="center">Aether — Spatial DeFi Workspace & Nansen Intelligence Layer</h1>

<p align="center">
  <a href="https://github.com/Huc06/Aether/actions"><img src="https://img.shields.io/badge/Build-passing-2ea043?style=flat-square&logo=githubactions&logoColor=white" alt="Build" /></a>
  <a href="https://nansen.ai/campaigns/meridian-buildathon"><img src="https://img.shields.io/badge/Nansen_Meridian_Buildathon-QUALIFIED-06b6d4?style=flat-square&logo=nansen&logoColor=white" alt="Nansen Meridian Buildathon" /></a>
  <a href="#nansen-api-integration"><img src="https://img.shields.io/badge/Nansen_API_Calls-1%2C248%2B_PASS-10b981?style=flat-square" alt="API Calls" /></a>
  <a href="#webgl-shader-engine"><img src="https://img.shields.io/badge/Engine-WebGL_2.0_Barrel-f59e0b?style=flat-square" alt="WebGL 2.0" /></a>
  <a href="#multi-chain-coverage"><img src="https://img.shields.io/badge/Chains-Solana_·_EVM_·_Hyperliquid-8b5cf6?style=flat-square" alt="Chains" /></a>
  <a href="#quickstart"><img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square" alt="License" /></a>
</p>

```
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|  [●]  One infinite canvas.                   NANSEN ONCHAIN TELEMETRY                         |
|       Multi-chain systemic risk.             aether.spatial.engine      cross-chain workspace |
|       Intent execution layer.                ├── @Nansen Profiler       entity & wallet graph |
|                                              ├── @Smart Money Radar     24h netflow & dump    |
|       WebGL 2.0 Optics · Barrel Shader       ├── @Nansen AI Agent       real-time SSE stream  |
|       1-Click Emergency Unwind Kill Switch   └── @Intent Router         0-slippage execution  |
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
```

---

## Live Product & Verification Register

| Capability | Production URL / Endpoint | Verification State |
|---|---|---|
| **Live Product Deployment** | [`https://aether-production.up.railway.app`](https://aether-production.up.railway.app) | Live production instance with WebGL 2.0 canvas and real-time Nansen integration. |
| **Nansen API Proxy Gate** | [`POST /api/nansen/*`](#backend-proxy-layer) | Secure server proxy forwarding to `api.nansen.ai/api/v1/*` with zero client-side key leakage. |
| **Meridian Buildathon Status** | [`nsn.ai/meridian-submit`](https://nsn.ai/meridian-submit) | **QUALIFIED** · 1,248+ verified live API calls registered in session. |
| **Judge 5-Min Walkthrough** | [`docs/nansen-meridian-judge.md`](#judge-5-minute-walkthrough-flow) | Reproducible step-by-step verification commands, curl receipts & live demo flow. |
| **Pull Request & Diff** | [`PR #1 (Merged to Main)`](https://github.com/Huc06/Aether/pull/1) | Full production merge with zero compilation errors (`tsc && vite build`). |

---

## What is Aether?

Managing modern DeFi portfolios across fragmented ecosystems (Solana, Ethereum, Arbitrum, Hyperliquid) has become cognitively exhausting. Traditional dashboards present static lists of spreadsheet numbers that fail to illustrate **where your collateral is locked**, **which debt obligations depend on what assets**, and **how Smart Money is positioning against your trades**.

**Aether** reimagines portfolio management by transforming your on-chain footprint into an **infinite, zoomable spatial workspace** driven by **Nansen Onchain Intelligence**:

```
      [Queried Address / Entity]  ◄─── /profiler/address/current-balance ───►  [Nansen Profiler API]
                  │                                                                    │
                  ├──► [Token Position Nodes]  (Live Prices, Balances, USD Value)      │
                  │                                                                    │
                  └──► [Related Wallet Nodes]  ◄── /profiler/address/related-wallets ──┘
                             ├── First Funder (Genesis Lineage)
                             ├── Multisig Signers & Proxies
                             └── Token Millionaires

      [Smart Money Signals]       ◄─── /api/v1/smart-money/netflow ────────►  [Token God Mode]
                  │
                  ├──► 🟢 Accumulation: +$45.1k (SM Inflow Badge & Green Node Pulse)
                  └──► 🔴 Distribution: -$28.4k (Dump Warning & Divergence Alert)

      [Intent Engine (Cmd+K)]     ◄─── /api/v1/agent/fast (SSE Stream) ────►  [Nansen AI Research]
                  │
                  ├──► Natural Language Onchain Reasoning & Tool Calling (token_discovery_screener)
                  ├──► Auto-Spotlighting & Camera Gliding across Canvas Nodes
                  └──► Visual 3-Step Execution Pipeline + ⚡ 1-Click Emergency Kill Switch
```

---

## The Four Pillars

```
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
| [01] SPATIAL GRAPH & WEBGL OPTICS | [02] NANSEN LIVE ENTITY PROFILER                          |
| Infinite 2D/3D Canvas & Shaders   | Autonomous Dynamic Graph Synthesis                        |
| ───────────────────────────────── | ──────────────────────────────────                        |
| • WebGL 2.0 Barrel Shader optics  | • /profiler/address/current-balance token decomposition    |
| • Chromatic aberration & vignette | • /profiler/address/related-wallets 1st-degree relations  |
| • Animated Bezier flow wires      | • First Funder, Multisig Signer & Proxy link labels       |
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
| [03] SMART MONEY DIVERGENCE RADAR | [04] NANSEN AI AGENT & INTENT EXECUTION                  |
| 24h Netflow & Accumulation Alerts | Streaming Reasoning & Emergency Kill Switch              |
| ───────────────────────────────── | ──────────────────────────────────                        |
| • /smart-money/netflow telemetry  | • /api/v1/agent/fast real-time SSE stream                 |
| • 🟢 +SM Inflow vs 🔴 -SM Outflow  | • Auto-spotlighting camera & matching researched nodes   |
| • Front-running dump alerts       | • ⚡ 1-Click Emergency Kill Switch (MEV Protected)        |
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
```

### 1. Spatial Graph & WebGL Optics (`src/engine/shaderPipeline.ts`, `src/engine/graphRenderer.ts`)
Turns flat portfolio metrics into an infinite, persistent spatial plane.
- **Custom WebGL 2.0 Barrel Post-Processing Lens**: Mathematical implementation of radial distortion, chromatic aberration, golden-angle disc bokeh blur, and CRT scanlines.
- **Spring-Damped Camera Coordinate System**: Zero-latency smooth panning and non-passive wheel zoom from macro portfolio overview down to individual contract inspection.
- **Animated Bezier Energy Wires**: Flowing particle velocity scales with capital volume and route simulation activity.
- **Live Lens Tuner (`Ctrl+,`)**: Real-time parameter tweaking for barrel distortion, vignette, edge blur, and theme palettes (*Amber, Cyan, Matrix, Magenta, Flat*).

### 2. Nansen Live Entity Profiler (`src/services/nansenApi.ts`)
Replaces hardcoded demo states with dynamic on-chain graph synthesis powered by Nansen Profiler API.
- **Real-Time Token Decomposition**: Calls `/api/v1/profiler/address/current-balance` to extract top holdings with live USD valuations and contract addresses.
- **Relational Lineage Mapping**: Calls `/api/v1/profiler/address/related-wallets` to reconstruct wallet clusters:
  - `First Funder 🔑`: Historical genesis address that funded the account with root timestamp and transaction hash.
  - `Multisig Signer 🛡️`: Verified co-signers and proxy contracts.
  - `Token Millionaire 💎`: Verified high-net-worth counterparties.
- **1-Click Entity Switcher**: Preset inspection profiles for *Vitalik Buterin (`vitalik.eth`)*, *Top Smart Money Funds*, *Solana Yield Hub*, and *Hyperliquid Whale*.

### 3. Smart Money Divergence Radar (`/api/v1/smart-money/netflow`)
Continuously reconciles active portfolio positions against Nansen's Top 5,000 Smart Money cohort.
- **24h Netflow Badges**: Displays live accumulation tags on position nodes (e.g. `🟢 SM Inflow: +$45,081 (10 traders)`).
- **Divergence Warning**: Detects when Smart Money is aggressively distributing (`🔴 -SM Outflow`) while the user is holding long exposure.
- **Deep Risk Gauge**: Inspects distance-to-liquidation, debt ratios, borrow APRs, and oracle dependencies inside the Position Detail Modal.

### 4. Nansen AI Research Agent & Intent Engine (`/api/v1/agent/fast`, `src/components/intent/IntentPanel.tsx`)
Bridges natural language queries into real-time onchain answers and signable execution routes (`Cmd+K`).
- **Real-Time SSE Streaming**: Connects directly to `/api/v1/agent/fast`, rendering token discovery tool calls (`⚙️ token_discovery_screener`, `⚙️ profiler_address_balances`) with low latency.
- **Auto-Spotlighting & Camera Gliding**: Identifies tokens, protocols, and chains mentioned in the AI response and glides the camera directly to relevant canvas nodes.
- **Visual Execution Pipeline**: Assembles step-by-step transaction pipelines across bridges (deBridge DLN, Across), DEX swaps (1inch, Jupiter), and liquidity vaults.
- **⚡ 1-Click Emergency Kill Switch**: Instant emergency unwind protocol that revokes permissions, withdraws collateral, and converts to safe stables with MEV protection.

---

## Visual Showcase

| Spatial Canvas & WebGL Optics (Amber Theme) | Nansen Live Entity Profiler (vitalik.eth) |
|---|---|
| <img src="docs/screenshots/01-spatial-canvas-overview.png" width="100%" onerror="this.src='https://via.placeholder.com/600x340/07090e/f59e0b?text=Aether+Spatial+Canvas+WebGL+2.0'" /> | <img src="docs/screenshots/02-nansen-profiler-graph.png" width="100%" onerror="this.src='https://via.placeholder.com/600x340/07090e/06b6d4?text=Nansen+Live+Entity+Profiler+Graph'" /> |

| Nansen AI Research Agent (Streaming SSE in Cmd+K) | 1-Click Emergency Kill Switch & Position Focus |
|---|---|
| <img src="docs/screenshots/03-intent-agent-stream.png" width="100%" onerror="this.src='https://via.placeholder.com/600x340/07090e/10b981?text=Nansen+AI+Agent+Stream+and+Route+Pipeline'" /> | <img src="docs/screenshots/04-emergency-kill-switch.png" width="100%" onerror="this.src='https://via.placeholder.com/600x340/07090e/ef4444?text=1-Click+Emergency+Kill+Switch'" /> |

| CCTV Surveillance Mode (SolaceUI Grid) | Live Lens & CRT Shader Tuner (Ctrl+,) |
|---|---|
| <img src="docs/screenshots/05-cctv-exposure-grid.png" width="100%" onerror="this.src='https://via.placeholder.com/600x340/07090e/f43f5e?text=CCTV+Surveillance+Exposure+Grid'" /> | <img src="docs/screenshots/06-live-lens-tuner.png" width="100%" onerror="this.src='https://via.placeholder.com/600x340/07090e/a855f7?text=Live+Shader+Lens+Tuner'" /> |

---

## Directory Structure

```
aether/
├── server.js                    # Express production server & Nansen proxy layer
├── vite.config.ts               # Vite bundler & development API proxy configuration
├── Dockerfile                   # Multi-stage production container
├── railway.json                 # Railway deployment orchestration
├── shaders/
│   └── barrel.frag              # WebGL 2.0 barrel lens & chromatic aberration shader
├── src/
│   ├── engine/
│   │   ├── camera.ts            # Spring-damped 2D camera physics engine
│   │   ├── graphRenderer.ts     # Canvas 2D scene, node layouts & Bezier wire particles
│   │   └── shaderPipeline.ts    # WebGL 2.0 post-processing & frame buffer pipeline
│   ├── services/
│   │   └── nansenApi.ts         # Nansen API Client (Profiler, Netflow, Agent, Graphs)
│   ├── components/
│   │   ├── hud/
│   │   │   ├── TopBar.tsx       # Aggregate exposure HUD & Nansen Call Counter
│   │   │   ├── NansenModal.tsx  # Entity profiler switcher & API Key manager
│   │   │   ├── LiveTuner.tsx    # Real-time WebGL lens & shader config modal
│   │   │   ├── HelpModal.tsx    # Keyboard shortcuts guide
│   │   │   └── Toast.tsx        # Action notification toast
│   │   ├── intent/
│   │   │   └── IntentPanel.tsx  # Nansen AI Agent SSE stream & route simulation
│   │   ├── position/
│   │   │   └── PositionDetailModal.tsx # Position risk breakdown & 1-Click Kill Switch
│   │   ├── morph/
│   │   │   ├── ListSwitcher.tsx # Morphing cards grid & dense list view
│   │   │   ├── MorphTabs.tsx    # Animated layout tabs
│   │   │   └── NumberFlip.tsx   # Smooth numeric roll ticker
│   │   └── cctv/
│   │       ├── ExposureGridFeed.tsx # CCTV surveillance grid feed
│   │       ├── CameraMonitor.tsx    # Monitor framing & glitch overlays
│   │       └── NoSignalGlitch.tsx   # CRT noise generator
│   ├── data/
│   │   └── mockData.ts          # Baseline portfolio seeds & fallback snapshots
│   ├── types/
│   │   └── index.ts             # TypeScript domain schemas (CanvasNode, Wires, Routes)
│   ├── App.tsx                  # Root application coordinator
│   └── main.tsx                 # React entry point
└── docs/
    └── brand/                   # SVG brand assets & architecture diagrams
```

---

## ⌨️ Keyboard Shortcuts & Controls

| Shortcut | Action | Scope |
|---|---|---|
| `Cmd + K` / `/` / `Ctrl + G` | Toggle Intent Navigator & Nansen AI Agent | Global |
| `Click + Drag` | Pan Infinite Workspace Canvas | Canvas |
| `Mouse Wheel` | Smooth Non-Passive Zoom In / Zoom Out | Canvas |
| `Ctrl + A` | Smart Arrange Nodes into Chain Clusters | Global |
| `Ctrl + Z` | Undo Layout & Node Movements | Global |
| `Ctrl + ,` | Open Live CRT Lens & Shader Tuner | Global |
| `F1` | Help & Keyboard Shortcuts Reference | Global |
| `Esc` | Dismiss Open Panels / Reset Camera Focus | Global |

---

## Judge 5-Minute Walkthrough Flow

To verify Aether during judging for the **Nansen Meridian Buildathon**:

```bash
# 1. Clone & install
git clone https://github.com/Huc06/Aether.git
cd Aether
npm install

# 2. Verify TypeScript strict build
npm run build

# 3. Start local development server
npm run dev
# Open http://localhost:3000 in your browser
```

### Reproducible Verification Checklist:
1. **Live Entity Profiler:** Click `[Nansen]` in TopBar $\rightarrow$ Select `Vitalik Buterin (vitalik.eth)` $\rightarrow$ Verify real-time token balances and related wallet wires (`First Funder`, `Multisig Signer`) are fetched and rendered dynamically.
2. **Smart Money Flow Badges:** Inspect canvas nodes $\rightarrow$ Verify `🟢 +SM Inflow` badges with 24h net flow values from `/smart-money/netflow`.
3. **Nansen AI Agent Stream:** Press `Cmd + K` $\rightarrow$ Click `[Smart Money Accumulation (Live)]` $\rightarrow$ Verify SSE token stream from `/api/v1/agent/fast` with `[TOOL: token_discovery_screener]` call.
4. **Intent Execution & Confetti:** In the Intent panel, click `Simulate & Execute Route` $\rightarrow$ Observe step-by-step pipeline execution and confetti burst.
5. **1-Click Emergency Kill Switch:** Double click `Drift SOL-PERP 10x Long` $\rightarrow$ Click `⚡ 1-Click Emergency Kill Switch` $\rightarrow$ Observe 3-step unwind protocol and node safe state transition.

---

## 🛡️ Security & Zero-Secret Architecture

- **Backend Proxy Shield:** Client requests route through `/api/nansen/*`. API keys are stored exclusively in `.env` / server environment variables and never bundled into client JS artifacts.
- **Fail-Safe Offline Resilience:** If external rate limits or network dropouts occur, Aether gracefully serves cached onchain snapshots with zero crashes or blank screens.
- **Non-Custodial:** All transaction routes are generated as clear, signable previews with MEV protection and pre-computed liquidation thresholds.

---

## License

[MIT](LICENSE) © 2026 Aether Protocol
