# Nansen Meridian Buildathon — Judge 5-Minute Verification Guide

> **Project:** Aether — Tri-Modal Spatial DeFi Workspace & Nansen Intelligence Layer  
> **Live Production App:** [https://aether-production-c385.up.railway.app](https://aether-production-c385.up.railway.app)  
> **GitHub Repository:** [https://github.com/Huc06/Aether](https://github.com/Huc06/Aether)  
> **Submission Portal:** [nsn.ai/meridian-submit](https://nsn.ai/meridian-submit)  

---

## 1. Executive Summary & Scoring Alignment

| Scoring Dimension | Weight | How Aether Delivers |
|---|:---:|---|
| **Data Integration** | **25%** | Nansen data directly dictates spatial node coordinates ($x, y$), particle velocities, Smart Money accumulation pulses (`[+] SM Inflow`), and relational graph wires. |
| **Creativity & Originality** | **25%** | Replaces traditional flat spreadsheets with an infinite WebGL 2.0 spatial canvas, Nymspace 3D cylindrical page bend, and 9-channel CCTV CRT monitoring feed. |
| **Functionality & Workability** | **25%** | Real-time SSE streaming from `/api/v1/agent/fast`, 11 Model Context Protocol (MCP) tools, zero-crash fail-safe snapshots, and 100% strict TypeScript build. |
| **Documentation & Submission** | **25%** | Reproducible in under 2 minutes (`npm run build && npm run dev:full`), with zero client secrets, live Railway proxy receipts, and comprehensive cURL test suite. |

---

## 2. Integrated Nansen Endpoints Register

| Endpoint | Method | Role in Aether Spatial Engine |
|---|:---:|---|
| `/api/v1/profiler/address/current-balance` | `POST` | Fetches live token balances, prices, and USD values to decompose into orbital token nodes. |
| `/api/v1/profiler/address/related-wallets` | `POST` | Identifies 1st-degree entities (*First Funder, Multisig Signer, Token Millionaire*) to synthesize relational Bezier wires. |
| `/api/v1/smart-money/netflow` | `POST` | Computes 24h netflow across Top 5,000 Smart Money wallets to render accumulation/dump divergence alarms. |
| `/api/v1/agent/fast` | `POST` (SSE) | Powers the `Cmd+K` Thesis Desk with real-time streaming on-chain reasoning and tool-calling telemetry. |
| `/api/v1/portfolio/defi-holdings` | `POST` | Tracks multi-chain lending, staking, and LP vault balances across protocols. |

---

## 3. Step-by-Step 5-Minute Evaluation Flow

### Step 1: Clone & Launch (< 60 seconds)
```bash
git clone https://github.com/Huc06/Aether.git
cd Aether
npm install
npm run build
npm run dev:full
```
*Open `http://localhost:5199` (or test live on [`https://aether-production-c385.up.railway.app`](https://aether-production-c385.up.railway.app)).*

---

### Step 2: Test Nansen Live Entity Profiler (1 minute)
1. In the top bar, click the **`[NANSEN API]`** status button.
2. Observe the **1,000+ API Calls Qualified** tracker (100% requirement verified).
3. Click on the curated preset **`Vitalik Buterin (vitalik.eth)`**.
4. **Expected Result:**
   - The camera glides seamlessly to coordinates `(0, 0)`.
   - The center node renders `Vitalik Buterin (vitalik.eth)` with live portfolio valuation.
   - Orbital token nodes spawn for `WHITE`, `MOODENG`, `ETH`, `ENS` with live prices and valuations.
   - Violet lineage wires connect to `vitalikbuterin.eth (First Funder)` and `Proxy (Multisig Signer)`.

---

### Step 3: Test Nansen AI Research Agent & Thesis Desk (1 minute)
1. Press **`Cmd + K`** (or click `[Intent]` in dock) to open **Mission Control**: glass panel floats over the live canvas.
2. Click the preset pill **`[Smart Money Accumulation (Live)]`** or **`[Thesis Desk]`** (or ask: *"Which tokens are smart money accumulating today?"*).
3. **Expected Result:**
   - Real-time SSE streaming answer from Nansen Fast Agent (`/api/v1/agent/fast`).
   - Active tool call telemetry badge: `[tool: token_discovery_screener]`.
   - Canvas automatically spotlights researched token nodes and adjusts camera focus.
   - A 2-step **Visual Execution Pipeline** renders below the thesis.
   - Click **`Simulate Route`** $\rightarrow$ Pipeline executes with 0-slippage routing $\rightarrow$ Confetti celebration triggers.

---

### Step 4: Test Smart Money Divergence & Emergency Unwind (1 minute)
1. On the spatial canvas, locate the node **`Drift SOL-PERP 10x Long`** (marked with critical health factor).
2. Double-click the node to open the **Position Cockpit Deck**.
3. Observe the Nansen Smart Money 24h netflow correlation and optical Solvency Gauge.
4. Press & hold **`Hold 1.2s to Emergency Unwind`** (or hold **`Space`** key).
5. **Expected Result:**
   - Visual progress fill completes after 1.2s of intentional hold.
   - MEV-shielded private RPC bundle executes to eliminate sandwich attacks.
   - Node status updates to `(Unwound & Safe)` and generates onchain Settlement Receipt.

---

### Step 5: Test Tri-Modal Workspaces & MCP Server (1 minute)
1. Press **`2`** to switch to the **Dashed-Frame Data Ledger**: scroll to experience the Nymspace 3D cylindrical page-bend physics (`bendEngine.ts`) and hover over live sparklines.
2. Press **`3`** to switch to the **CCTV Surveillance Matrix**: monitor 9 camera feeds with pixel-locked CRT scanline shaders and SMPTE `NO SIGNAL` channels.
3. Test the Model Context Protocol (MCP) server:
   ```bash
   node mcp/aether-mcp.mjs
   ```
   *Exposes 11 specialized agent tools for Claude Desktop, Cursor, and ChatGPT.*

---

## 4. Live Verification Receipts & cURL Commands

Judges can test endpoints against either our live Railway proxy (zero API key needed) or directly against the Nansen API:

### A. Live Railway Proxy (Zero Configuration Needed)
```bash
# Test Smart Money Netflow
curl -s -X POST 'https://aether-production-c385.up.railway.app/api/nansen/smart-money/netflow' \
  -H 'Content-Type: application/json' \
  -d '{"chains": ["ethereum"]}'

# Test Live Profiler Balances (vitalik.eth)
curl -s -X POST 'https://aether-production-c385.up.railway.app/api/nansen/profiler/address/current-balance' \
  -H 'Content-Type: application/json' \
  -d '{"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "chain": "ethereum"}'

# Test Nansen AI Fast Agent Stream
curl -N -X POST 'https://aether-production-c385.up.railway.app/api/nansen/agent/fast' \
  -H 'Content-Type: application/json' \
  -d '{"text": "Which tokens are smart money accumulating on Ethereum today?"}'
```

### B. Direct Nansen API
```bash
export NANSEN_API_KEY="your_nansen_api_key_here"

curl -s -X POST 'https://api.nansen.ai/api/v1/smart-money/netflow' \
  -H 'Content-Type: application/json' \
  -H "apikey: $NANSEN_API_KEY" \
  -d '{"chains": ["ethereum"]}'
```

---

## 5. Security & Architecture Guarantees

- **Zero Secret Leakage:** All client-side requests are authenticated through the Express proxy gate (`/api/nansen/*`), preventing Nansen API key exposure in browser bundles.
- **Fail-Safe Offline Snapshots:** If rate limits or network issues occur, Aether gracefully degrades to deterministic onchain snapshots so judges experience zero downtime.
- **Strict Typing:** Production build compiles cleanly in ~1.6s with `tsc && vite build` and zero type errors.
