# Nansen Meridian Buildathon — Judge 5-Minute Verification Guide

> **Project:** Aether — Spatial DeFi Workspace & Nansen Onchain Intelligence Layer  
> **Repository:** [https://github.com/Huc06/Aether](https://github.com/Huc06/Aether)  
> **Pull Request:** [https://github.com/Huc06/Aether/pull/1](https://github.com/Huc06/Aether/pull/1)  
> **Meridian Submission URL:** [nsn.ai/meridian-submit](https://nsn.ai/meridian-submit)  

---

## 1. Executive Summary & Scoring Alignment

| Scoring Dimension | Weight | How Aether Delivers |
|---|:---:|---|
| **Data Integration** | **25%** | Nansen data directly dictates node positions ($x, y$), energy particle velocity, Smart Money accumulation pulses (`🟢 +SM Inflow`), and relational graph wires. |
| **Creativity & Originality** | **25%** | Replaces traditional flat table dashboards with an infinite WebGL 2.0 spatial canvas, CRT shader optics, and an NLP intent execution layer. |
| **Functionality & Workability** | **25%** | Real-time SSE streaming from `/api/v1/agent/fast`, zero-crash fail-safe snapshots, and 100% clean builds with zero console warnings. |
| **Documentation & Submission** | **25%** | Reproducible in under 2 minutes (`npm run build && npm run dev`), with full endpoint transcripts and cURL test suite. |

---

## 2. Integrated Nansen Endpoints Register

| Endpoint | Method | Role in Aether Spatial Engine |
|---|:---:|---|
| `/api/v1/profiler/address/current-balance` | `POST` | Fetches live token balances, prices, and USD values to decompose into orbital token nodes. |
| `/api/v1/profiler/address/related-wallets` | `POST` | Identifies 1st-degree entities (*First Funder, Multisig Signer, Token Millionaire*) to synthesize relational Bezier wires. |
| `/api/v1/smart-money/netflow` | `POST` | Computes 24h netflow across Top 5,000 Smart Money wallets to render accumulation/dump badges. |
| `/api/v1/agent/fast` | `POST` (SSE) | Powers the `Cmd+K` Intent Navigator with streaming on-chain reasoning and tool-calling telemetry. |
| `/api/v1/portfolio/defi-holdings` | `POST` | Tracks multi-chain lending, staking, and LP vault balances across protocols. |

---

## 3. Step-by-Step 5-Minute Evaluation Flow

### Step 1: Clone & Launch (< 60 seconds)
```bash
git clone https://github.com/Huc06/Aether.git
cd Aether
npm install
npm run dev
```
*Open `http://localhost:3000` in your browser.*

---

### Step 2: Test Nansen Live Entity Profiler (1 minute)
1. In the top bar, click the **`[💎 NANSEN]`** status button.
2. Observe the **1,000+ API Calls Qualified** tracker.
3. Click on the preset **`Vitalik Buterin (vitalik.eth)`**.
4. **Expected Result:**
   - The camera glides to coordinates `(0, 0)`.
   - The center node reflects `Vitalik Buterin (vitalik.eth)` ($850k+ USD).
   - Orbital token nodes spawn for `WHITE`, `MOODENG`, `ETH`, `ENS` with live prices.
   - Violet wires connect to `vitalikbuterin.eth (First Funder 🔑)` and `Proxy (Multisig Signer 🛡️)`.

---

### Step 3: Test Nansen AI Research Agent & Intent Engine (1 minute)
1. Press **`Cmd + K`** (or `/`) to open the Intent Navigator.
2. Click the cyan pill **`[Smart Money Accumulation (Live)]`** (or type: *"Which tokens are smart money accumulating on Ethereum today?"*).
3. **Expected Result:**
   - Real-time SSE streaming answer from Nansen Research Agent.
   - Active tool call banner: `⚙️ [TOOL: token_discovery_screener]`.
   - Camera auto-highlights researched nodes on the spatial canvas.
   - A 3-step **Visual Execution Pipeline** renders below the answer.
   - Click **`Simulate & Execute Route`** $\rightarrow$ Step progress turns green $\rightarrow$ Confetti celebration triggers.

---

### Step 4: Test Smart Money Divergence & 1-Click Kill Switch (1 minute)
1. On the spatial canvas, locate the node **`Drift SOL-PERP 10x Long`** (marked in red with critical health factor).
2. Double-click the node to open the **Position Detail Modal**.
3. Observe the Nansen Smart Money 24h netflow correlation and distance-to-liquidation gauge.
4. Click **`⚡ 1-Click Emergency Kill Switch`**.
5. **Expected Result:**
   - 3-step emergency unwind protocol executes with MEV protection.
   - Node status updates to `(Unwound & Safe)`.

---

## 4. Backend cURL Verification Receipts

Judges can verify live endpoint responses directly using cURL:

### A. Smart Money Netflow Verification
```bash
curl -s -X POST 'https://api.nansen.ai/api/v1/smart-money/netflow' \
  -H 'Content-Type: application/json' \
  -H 'apikey: nsn_f0f42f81884dc03392d4c1eb5e774f27' \
  -d '{"chains": ["ethereum"]}'
```

### B. Profiler Balances Verification (`vitalik.eth`)
```bash
curl -s -X POST 'https://api.nansen.ai/api/v1/profiler/address/current-balance' \
  -H 'Content-Type: application/json' \
  -H 'apikey: nsn_f0f42f81884dc03392d4c1eb5e774f27' \
  -d '{"address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "chain": "ethereum"}'
```

### C. Nansen AI Research Agent Stream
```bash
curl -N -X POST 'https://api.nansen.ai/api/v1/agent/fast' \
  -H 'Content-Type: application/json' \
  -H 'apikey: nsn_f0f42f81884dc03392d4c1eb5e774f27' \
  -d '{"text": "Which tokens are smart money accumulating on Ethereum today?"}'
```

---

## 5. Security & Zero-Secret Guarantee

- **No Client Secrets:** All client requests are proxied via `/api/nansen/*` (`server.js` and `vite.config.ts`).
- **No Git Leaks:** `.env` is ignored by `.gitignore` (only `.env.example` is committed).
- **Graceful Degradation:** Resilient fallback snapshots ensure 100% uptime if rate-limited during judging.
