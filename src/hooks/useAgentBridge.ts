import { useEffect, useRef } from 'react';
import { CanvasNode, WireConnection, LensConfig } from '../types';
import { PortfolioViewMode } from '../components/morph/ListSwitcher';

type ViewMode = PortfolioViewMode;

export interface AgentCommand {
  id: string;
  type:
    | 'set_view'
    | 'focus_node'
    | 'inspect_node'
    | 'close_inspector'
    | 'kill_switch'
    | 'set_cctv'
    | 'set_theme';
  payload?: Record<string, unknown>;
}

export interface AgentBridgeHandlers {
  setView: (mode: ViewMode) => void;
  focusNode: (nodeId: string) => boolean;
  inspectNode: (nodeId: string) => boolean;
  closeInspector: () => void;
  killSwitch: (nodeId: string) => boolean;
  setCctv: (patch: { columns?: number; rows?: number; treatment?: string }) => void;
  setTheme: (mode: 'dark' | 'light') => void;
}

export interface AgentBridgeSnapshot {
  viewMode: ViewMode;
  nodes: CanvasNode[];
  wires: WireConnection[];
  config: LensConfig;
  cctv: { columns: number; rows: number; treatment: string; slots: { cam: string; nodeId: string | null; status: string }[] };
}

const STATE_URL = '/api/agent/state';
const EVENTS_URL = '/api/agent/events';
const ACK_URL = '/api/agent/ack';

/**
 * Publishes the live workspace to the Express agent bridge and executes
 * commands issued by MCP clients (Claude, ChatGPT, Cursor) over SSE.
 */
export function useAgentBridge(snapshot: AgentBridgeSnapshot, handlers: AgentBridgeHandlers) {
  const snapshotRef = useRef(snapshot);
  const handlersRef = useRef(handlers);
  snapshotRef.current = snapshot;
  handlersRef.current = handlers;

  // Publish state to the bridge; backs off to 30s while the bridge is offline.
  useEffect(() => {
    let cancelled = false;
    let failures = 0;
    let timer = 0;
    const push = async () => {
      const snap = snapshotRef.current;
      const totals = snap.nodes.reduce(
        (acc, n) => {
          acc.exposureUsd += n.valueUsd;
          acc.pnl24hUsd += n.pnl24hUsd ?? 0;
          return acc;
        },
        { exposureUsd: 0, pnl24hUsd: 0 }
      );
      try {
        const res = await fetch(STATE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viewMode: snap.viewMode,
            themeMode: snap.config.themeMode ?? 'dark',
            nodes: snap.nodes,
            wires: snap.wires,
            totals: {
              ...totals,
              criticalCount: snap.nodes.filter(n => n.riskLevel === 'critical').length
            },
            cctv: snap.cctv,
            ts: Date.now()
          })
        });
        failures = res.ok ? 0 : failures + 1;
      } catch {
        // Bridge offline (pure Vite dev without the Express server).
        failures += 1;
      }
      if (!cancelled) timer = window.setTimeout(push, failures > 2 ? 30000 : 2000);
    };
    timer = window.setTimeout(push, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // Execute inbound agent commands.
  useEffect(() => {
    let source: EventSource | null = null;
    let retry = 0;

    const ack = (id: string, ok: boolean, result: unknown) => {
      void fetch(ACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ok, result })
      }).catch(() => undefined);
    };

    const run = (cmd: AgentCommand) => {
      const h = handlersRef.current;
      const p = (cmd.payload ?? {}) as Record<string, never>;
      switch (cmd.type) {
        case 'set_view':
          h.setView((p.mode as unknown as ViewMode) ?? 'canvas');
          return { viewMode: p.mode };
        case 'focus_node':
          return { focused: h.focusNode(p.nodeId as unknown as string) };
        case 'inspect_node':
          return { inspecting: h.inspectNode(p.nodeId as unknown as string) };
        case 'close_inspector':
          h.closeInspector();
          return { closed: true };
        case 'kill_switch':
          return { executed: h.killSwitch(p.nodeId as unknown as string) };
        case 'set_cctv':
          h.setCctv(p as unknown as { columns?: number; rows?: number; treatment?: string });
          return { cctv: p };
        case 'set_theme':
          h.setTheme((p.mode as unknown as 'dark' | 'light') ?? 'dark');
          return { themeMode: p.mode };
        default:
          throw new Error(`unknown command: ${(cmd as AgentCommand).type}`);
      }
    };

    const connect = () => {
      source = new EventSource(EVENTS_URL);
      source.onopen = () => {
        retry = 0;
      };
      source.onmessage = event => {
        let cmd: AgentCommand;
        try {
          cmd = JSON.parse(event.data);
        } catch {
          return;
        }
        try {
          ack(cmd.id, true, run(cmd));
        } catch (err) {
          ack(cmd.id, false, { error: err instanceof Error ? err.message : String(err) });
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        retry = Math.min(retry + 1, 6);
        window.setTimeout(connect, 1000 * retry);
      };
    };

    connect();
    return () => {
      source?.close();
    };
  }, []);
}
