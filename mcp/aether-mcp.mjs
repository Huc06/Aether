#!/usr/bin/env node

/**
 * Aether Model Context Protocol (MCP) Server
 * Protocol Version: 2024-11-05
 * 
 * Exposes live Aether workspace state and UI control commands to external AI agents
 * (Claude Desktop, Claude Code, Cursor, ChatGPT) via stdio JSON-RPC 2.0.
 */

import readline from 'readline';

const AETHER_URL = (process.env.AETHER_URL || 'http://localhost:3000').replace(/\/+$/, '');
const PROTOCOL_VERSION = '2024-11-05';
const SERVER_INFO = {
  name: 'aether-mcp',
  version: '1.0.0',
};

// Send JSON-RPC response to stdout (newline delimited)
function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

// Fetch live workspace state from Aether HTTP bridge
async function fetchState() {
  let res;
  try {
    res = await fetch(`${AETHER_URL}/api/agent/state`);
  } catch (err) {
    throw new Error(
      `Cannot connect to Aether server at ${AETHER_URL}. Ensure Aether is running ('npm run dev:full' or 'npm start'). (${err.message})`
    );
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} from ${AETHER_URL}/api/agent/state`);
  }

  const data = await res.json();
  if (!data || data.ok === false || !Array.isArray(data.nodes) || data.nodes.length === 0) {
    const detail = (data && data.error) || 'no browser connected — open http://localhost:3000';
    throw new Error(detail);
  }

  return data;
}

// Send command to Aether HTTP bridge (?wait=1 waits for browser ack up to 5s)
async function sendCommand(type, payload = {}) {
  let res;
  try {
    res = await fetch(`${AETHER_URL}/api/agent/command?wait=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
  } catch (err) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Cannot connect to Aether server at ${AETHER_URL}. Ensure Aether is running ('npm run dev:full' or 'npm start'). (${err.message})`,
      }],
    };
  }

  if (!res.ok) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `HTTP error ${res.status} ${res.statusText} while dispatching command '${type}'`,
      }],
    };
  }

  const result = await res.json();

  if (result.delivered === 0) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `no browser connected — open http://localhost:3000 (command '${type}' queued with ID ${result.id}, but 0 active browser subscribers connected to SSE stream)`,
      }],
    };
  }

  if (result.timeout) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Command '${type}' was delivered to ${result.delivered} browser(s), but acknowledgment timed out after 5000ms (command ID: ${result.id})`,
      }],
    };
  }

  if (result.ok === false) {
    return {
      isError: true,
      content: [{
        type: 'text',
        text: `Command '${type}' failed in browser: ${result.error || 'Unknown error'}`,
      }],
    };
  }

  return {
    isError: false,
    content: [{
      type: 'text',
      text: JSON.stringify({
        status: 'success',
        command: type,
        payload,
        id: result.id,
        delivered: result.delivered,
        result: result.result || null,
      }, null, 2),
    }],
  };
}

// Complete tool registry with full JSON schemas
const TOOLS = [
  {
    name: 'aether_get_state',
    description: 'Retrieve the complete live Aether workspace state including active viewMode, all nodes (positions, debts, wallets), flow wires, portfolio totals (exposure, 24h PnL, health factor), CCTV grid state, and data freshness (staleMs).',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'aether_list_positions',
    description: 'List and filter active DeFi positions from the live Aether workspace. Supports filtering by chain (Solana, Arbitrum, Ethereum, Hyperliquid, Berachain), risk level (safe, medium, high, critical), or minimum USD value.',
    inputSchema: {
      type: 'object',
      properties: {
        chain: {
          type: 'string',
          description: "Filter positions by chain name (e.g. 'Solana', 'Arbitrum', 'Ethereum', 'Hyperliquid', 'Berachain')",
        },
        riskLevel: {
          type: 'string',
          enum: ['safe', 'medium', 'high', 'critical'],
          description: "Filter positions by risk tier ('safe', 'medium', 'high', 'critical')",
        },
        minValueUsd: {
          type: 'number',
          description: 'Filter positions with valueUsd greater than or equal to this threshold',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'aether_get_position',
    description: 'Get deep details for a specific position node by its unique ID, including balances, APY, debt ratios, liquidation distance, Nansen smart money signals, and exit routes.',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Unique identifier of the position node (e.g. 'sol-1', 'arb-1', 'eth-1')",
        },
      },
      required: ['nodeId'],
      additionalProperties: false,
    },
  },
  {
    name: 'aether_portfolio_summary',
    description: 'Get an executive portfolio summary: total exposure USD, 24h net PnL, aggregate health factor, chain distribution, risk tier breakdown, and active workspace view mode.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'aether_set_view',
    description: "Switch the active workspace view mode in the Aether frontend: 'canvas' (WebGL 2D/3D Spatial Canvas), 'list' (Nymspace Bend Ledger), or 'exposure-grid' (CCTV Surveillance Feed).",
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['canvas', 'list', 'exposure-grid'],
          description: "Workspace view mode: 'canvas', 'list', or 'exposure-grid'",
        },
      },
      required: ['mode'],
      additionalProperties: false,
    },
  },
  {
    name: 'aether_focus_node',
    description: 'Center and zoom the spatial canvas camera onto a specific position node in the Aether UI.',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Node ID to center and focus (e.g. 'sol-1')",
        },
      },
      required: ['nodeId'],
      additionalProperties: false,
    },
  },
  {
    name: 'aether_inspect_node',
    description: 'Open the detailed inspection modal for a specific node in the Aether UI, showing liquidation distance gauges, route simulations, and Nansen intelligence signals.',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Node ID to inspect (e.g. 'sol-1')",
        },
      },
      required: ['nodeId'],
      additionalProperties: false,
    },
  },
  {
    name: 'aether_close_inspector',
    description: 'Close any currently open node inspection modal in the Aether UI.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'aether_kill_switch',
    description: 'Trigger the 1-click emergency unwind kill switch for a high-risk position node in Aether, initiating emergency unwinding routes.',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: "Node ID to emergency unwind (e.g. 'sol-1')",
        },
      },
      required: ['nodeId'],
      additionalProperties: false,
    },
  },
  {
    name: 'aether_set_cctv',
    description: 'Configure the CCTV Surveillance Matrix workspace: adjust grid dimensions (columns and rows) and toggle video post-processing shader treatments.',
    inputSchema: {
      type: 'object',
      properties: {
        columns: {
          type: 'integer',
          minimum: 1,
          maximum: 6,
          description: 'Number of feed columns in the surveillance wall (e.g. 2, 3, 4)',
        },
        rows: {
          type: 'integer',
          minimum: 1,
          maximum: 4,
          description: 'Number of feed rows in the surveillance wall (e.g. 1, 2, 3)',
        },
        treatment: {
          type: 'string',
          enum: ['chroma', 'exposure', 'monochrome'],
          description: "Shader filter treatment: 'chroma', 'exposure', or 'monochrome'",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'aether_set_theme',
    description: "Switch the Aether UI theme between 'dark' (Cyberpunk Dark) and 'light' (Clean Slate Light).",
    inputSchema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['dark', 'light'],
          description: "Target theme: 'dark' or 'light'",
        },
      },
      required: ['mode'],
      additionalProperties: false,
    },
  },
];

// Execute requested tool and return MCP content block
async function callTool(name, args) {
  try {
    switch (name) {
      case 'aether_get_state': {
        const state = await fetchState();
        return {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify(state, null, 2) }],
        };
      }

      case 'aether_list_positions': {
        const state = await fetchState();
        let positions = state.nodes || [];

        if (args.chain) {
          positions = positions.filter((p) => p.chain?.toLowerCase() === args.chain.toLowerCase());
        }
        if (args.riskLevel) {
          positions = positions.filter((p) => p.riskLevel?.toLowerCase() === args.riskLevel.toLowerCase());
        }
        if (typeof args.minValueUsd === 'number') {
          positions = positions.filter((p) => (p.valueUsd || 0) >= args.minValueUsd);
        }

        const summary = {
          totalWorkspaceNodes: (state.nodes || []).length,
          matchedCount: positions.length,
          filtersApplied: {
            chain: args.chain || null,
            riskLevel: args.riskLevel || null,
            minValueUsd: args.minValueUsd ?? null,
          },
          positions: positions.map((p) => ({
            id: p.id,
            title: p.title,
            app: p.app,
            category: p.category,
            chain: p.chain,
            valueUsd: p.valueUsd,
            pnl24hUsd: p.pnl24hUsd,
            riskLevel: p.riskLevel,
            apy: p.apy,
            healthFactor: p.healthFactor,
            liquidationDistancePct: p.liquidationDistancePct,
            nansenLabel: p.nansenLabel,
            nansenDivergence: p.nansenDivergence,
            smartMoneyNetflow24h: p.smartMoneyNetflow24h,
          })),
        };

        return {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
        };
      }

      case 'aether_get_position': {
        if (!args.nodeId) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Missing required argument: "nodeId"' }],
          };
        }
        const state = await fetchState();
        const node = (state.nodes || []).find((p) => p.id === args.nodeId);
        if (!node) {
          const availableIds = (state.nodes || []).map((p) => p.id).join(', ');
          return {
            isError: true,
            content: [{
              type: 'text',
              text: `Position node with ID "${args.nodeId}" not found. Available node IDs: [${availableIds}]`,
            }],
          };
        }
        const connectedWires = (state.wires || []).filter(
          (w) => w.fromId === args.nodeId || w.toId === args.nodeId
        );
        return {
          isError: false,
          content: [{
            type: 'text',
            text: JSON.stringify({ node, connectedWires }, null, 2),
          }],
        };
      }

      case 'aether_portfolio_summary': {
        const state = await fetchState();
        const nodes = state.nodes || [];
        const chains = [...new Set(nodes.map((n) => n.chain).filter(Boolean))];
        const riskDistribution = {
          safe: nodes.filter((n) => n.riskLevel === 'safe').length,
          medium: nodes.filter((n) => n.riskLevel === 'medium').length,
          high: nodes.filter((n) => n.riskLevel === 'high').length,
          critical: nodes.filter((n) => n.riskLevel === 'critical').length,
        };

        const summary = {
          totals: state.totals || null,
          viewMode: state.viewMode,
          staleMs: state.staleMs,
          nodeCount: nodes.length,
          wireCount: (state.wires || []).length,
          chains,
          riskDistribution,
          cctvStatus: state.cctv
            ? {
                columns: state.cctv.columns,
                rows: state.cctv.rows,
                treatment: state.cctv.treatment,
                slotCount: (state.cctv.slots || []).length,
              }
            : null,
          lastUpdatedTs: state.ts,
        };

        return {
          isError: false,
          content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
        };
      }

      case 'aether_set_view': {
        if (!args.mode || !['canvas', 'list', 'exposure-grid'].includes(args.mode)) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Argument "mode" must be one of: "canvas", "list", "exposure-grid"' }],
          };
        }
        return await sendCommand('set_view', { mode: args.mode });
      }

      case 'aether_focus_node': {
        if (!args.nodeId) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Missing required argument: "nodeId"' }],
          };
        }
        return await sendCommand('focus_node', { nodeId: args.nodeId });
      }

      case 'aether_inspect_node': {
        if (!args.nodeId) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Missing required argument: "nodeId"' }],
          };
        }
        return await sendCommand('inspect_node', { nodeId: args.nodeId });
      }

      case 'aether_close_inspector': {
        return await sendCommand('close_inspector', {});
      }

      case 'aether_kill_switch': {
        if (!args.nodeId) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Missing required argument: "nodeId"' }],
          };
        }
        return await sendCommand('kill_switch', { nodeId: args.nodeId });
      }

      case 'aether_set_cctv': {
        const payload = {};
        if (typeof args.columns === 'number') payload.columns = args.columns;
        if (typeof args.rows === 'number') payload.rows = args.rows;
        if (args.treatment) payload.treatment = args.treatment;
        return await sendCommand('set_cctv', payload);
      }

      case 'aether_set_theme': {
        if (!args.mode || !['dark', 'light'].includes(args.mode)) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Argument "mode" must be one of: "dark", "light"' }],
          };
        }
        return await sendCommand('set_theme', { mode: args.mode });
      }

      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown tool: "${name}"` }],
        };
    }
  } catch (err) {
    return {
      isError: true,
      content: [{ type: 'text', text: err.message }],
    };
  }
}

// Dispatch incoming JSON-RPC 2.0 messages
async function handleMessage(message) {
  // Notifications do not have an id and expect no response
  if (message.id === undefined || message.id === null) {
    if (message.method === 'notifications/initialized') {
      console.error('[aether-mcp] Received notifications/initialized');
      return;
    }
    console.error('[aether-mcp] Received unhandled notification:', message.method);
    return;
  }

  const { id, method, params } = message;

  switch (method) {
    case 'initialize': {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          serverInfo: SERVER_INFO,
          capabilities: {
            tools: {},
          },
        },
      });
      break;
    }

    case 'ping': {
      send({
        jsonrpc: '2.0',
        id,
        result: {},
      });
      break;
    }

    case 'tools/list': {
      send({
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS,
        },
      });
      break;
    }

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      console.error(`[aether-mcp] Invoking tool "${toolName}" with args:`, toolArgs);
      const toolResult = await callTool(toolName, toolArgs);
      send({
        jsonrpc: '2.0',
        id,
        result: toolResult,
      });
      break;
    }

    default: {
      send({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      });
      break;
    }
  }
}

// Readline interface for stdio JSON-RPC (newline delimited)
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const message = JSON.parse(trimmed);
    handleMessage(message).catch((err) => {
      console.error('[aether-mcp] Unhandled error during message processing:', err);
      if (message.id !== undefined && message.id !== null) {
        send({
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message: `Internal error: ${err.message}`,
          },
        });
      }
    });
  } catch (err) {
    console.error('[aether-mcp] JSON parse error on line:', trimmed);
    send({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: `Parse error: invalid JSON (${err.message})`,
      },
    });
  }
});

console.error(`[aether-mcp] Server initialized (protocolVersion: ${PROTOCOL_VERSION}, target: ${AETHER_URL})`);
