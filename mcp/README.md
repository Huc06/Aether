# Aether Model Context Protocol (MCP) Server

Stdio JSON-RPC 2.0 server (`protocolVersion: 2024-11-05`) connecting AI agents (Claude Desktop, Claude Code, Cursor, ChatGPT) directly to the live Aether Spatial DeFi Workspace.

## Capabilities & Architecture

```
┌─────────────────────────────────┐           Stdio JSON-RPC 2.0
│ Claude Desktop / Cursor / Agent │ ◄────────────────────────────────────► ┌──────────────────────┐
└─────────────────────────────────┘                                        │  mcp/aether-mcp.mjs  │
                                                                           └──────────┬───────────┘
                                                                                      │ HTTP fetch
                                                                                      │ (Port 3000)
                                                                                      ▼
┌─────────────────────────────────┐           SSE Stream / Command Ack     ┌──────────────────────┐
│  Aether Frontend (Browser)      │ ◄────────────────────────────────────► │  server.js (Bridge)  │
│  - Spatial WebGL Canvas         │    GET  /api/agent/events              │  - In-memory State   │
│  - Nymspace Bend Ledger         │    POST /api/agent/state               │  - SSE Dispatcher    │
│  - CCTV Surveillance Matrix     │    POST /api/agent/ack                 │  - Command Waiters   │
└─────────────────────────────────┘                                        └──────────────────────┘
```

The MCP server connects to the Aether Express bridge (`http://localhost:3000` by default or configured via `AETHER_URL`). It provides 11 specialized tools for state introspection and autonomous workspace control.

## Available Tools

| Tool Name | Type | Description |
|---|---|---|
| `aether_get_state` | Read | Fetch complete workspace snapshot (nodes, wires, portfolio totals, CCTV state, staleMs). |
| `aether_list_positions` | Read | Query and filter positions by `chain`, `riskLevel` (`safe`, `medium`, `high`, `critical`), or `minValueUsd`. |
| `aether_get_position` | Read | Deep position inspection by `nodeId` including debt ratios, health factor, Nansen signals, and exit routes. |
| `aether_portfolio_summary` | Read | High-level metrics: total exposure, 24h PnL, health factor, chain distribution, risk breakdown. |
| `aether_set_view` | Control | Switch workspace mode: `'canvas'` (Spatial Canvas), `'list'` (Bend Ledger), `'exposure-grid'` (CCTV Feed). |
| `aether_focus_node` | Control | Pan and zoom the WebGL spatial camera to focus a position node (`nodeId`). |
| `aether_inspect_node` | Control | Open the detailed position inspection modal for `nodeId`. |
| `aether_close_inspector` | Control | Close any active inspection modal. |
| `aether_kill_switch` | Control | Trigger emergency unwind kill switch for a high-risk position (`nodeId`). |
| `aether_set_cctv` | Control | Configure CCTV surveillance matrix: grid layout (`columns`, `rows`) and video shader `treatment` (`chroma`, `exposure`, `monochrome`). |
| `aether_set_theme` | Control | Switch workspace theme: `'dark'` (Cyberpunk Dark) or `'light'` (Clean Slate Light). |

## Quickstart

```bash
# 1. Start full-stack environment (Express on 3000 + Vite on 5199)
npm run dev:full

# 2. Open http://localhost:5199 in your browser so Aether establishes the SSE command bridge

# 3. Test MCP server over stdio
npm run mcp
```
