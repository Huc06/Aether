import React, { useEffect, useRef, useState, useCallback, startTransition } from 'react';
import { CanvasNode, WireConnection, LensConfig, RecommendedRoute, PositionExitRoute } from './types';
import { INITIAL_NODES, INITIAL_WIRES, INTENT_PRESETS, DEFAULT_LENS_CONFIG } from './data/mockData';
import { CameraController } from './engine/camera';
import { WebGLShaderPipeline } from './engine/shaderPipeline';
import { GraphRenderer } from './engine/graphRenderer';
import { TopBar } from './components/hud/TopBar';
import { ListSwitcher, PortfolioViewMode } from './components/morph/ListSwitcher';
import { ExposureGridFeed } from './components/cctv/ExposureGridFeed';
import { IntentPanel } from './components/intent/IntentPanel';
import { PositionPeek } from './components/position/PositionPeek';
import { PositionCommandSheet } from './components/position/PositionCommandSheet';
import { PositionInspector } from './components/position/PositionInspector';
import { UnwindConfirmModal } from './components/position/UnwindConfirmModal';
import { SettlementReceiptModal } from './components/position/SettlementReceiptModal';
import { DetailPhase, initialPhaseForNode } from './components/position/detailPhase';
import { PositionSettlementReceipt } from './types';
import { LiveTuner } from './components/hud/LiveTuner';
import { HelpModal } from './components/hud/HelpModal';
import { NansenModal } from './components/hud/NansenModal';
import { Toast } from './components/hud/Toast';
import { ViewModeDock } from './components/hud/ViewModeDock';
import { buildNansenSpatialGraph, buildNansenResearchSubgraph, PRESET_ENTITIES, NansenEntityTarget } from './services/nansenApi';

export const App: React.FC = () => {
  // Application Data & State
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    const saved = localStorage.getItem('aether_nodes_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved nodes', e);
      }
    }
    return INITIAL_NODES;
  });

  const [wires, setWires] = useState<WireConnection[]>(() => {
    const saved = localStorage.getItem('aether_wires_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved wires', e);
      }
    }
    return INITIAL_WIRES;
  });
  const [config, setConfig] = useState<LensConfig>(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme') as 'light' | 'dark' | null;
    const saved = localStorage.getItem('aether_config_v1') || localStorage.getItem('phantomat_config_v1');
    let base = DEFAULT_LENS_CONFIG;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.normalScale === 1.0) {
          parsed.normalScale = 0.76;
          parsed.overviewScale = 0.32;
        }
        base = { ...DEFAULT_LENS_CONFIG, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
    if (themeParam === 'light' || themeParam === 'dark') {
      return { ...base, themeMode: themeParam };
    }
    return base;
  });

  const [highlightNodeIds, setHighlightNodeIds] = useState<string[]>([]);
  const [focusedNodeId, setFocusedNodeId] = useState<string>(nodes[0]?.id || 'wallet-ledger');
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const nodeId = params.get('node');
    if (nodeId) {
      return nodes.find(n => n.id === nodeId || n.id.toLowerCase().includes(nodeId.toLowerCase())) || null;
    }
    return null;
  });
  const [detailPhase, setDetailPhase] = useState<DetailPhase>(() => {
    const params = new URLSearchParams(window.location.search);
    const nodeId = params.get('node');
    if (nodeId) {
      const found = nodes.find(n => n.id === nodeId || n.id.toLowerCase().includes(nodeId.toLowerCase()));
      if (found) return initialPhaseForNode(found);
    }
    return 'none';
  });
  const [confirmRouteIndex, setConfirmRouteIndex] = useState(0);
  const [confirmReturnPhase, setConfirmReturnPhase] = useState<'peek' | 'sheet' | 'inspect'>('inspect');
  const [activeSettlementReceipt, setActiveSettlementReceipt] = useState<{ node: CanvasNode; receipt: PositionSettlementReceipt } | null>(null);
  const [viewMode, setViewMode] = useState<PortfolioViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view');
    if (v === 'list' || v === 'exposure-grid' || v === 'canvas') return v;
    return 'canvas';
  });
  const [isOverview, setIsOverview] = useState(false);
  const [isIntentOpen, setIsIntentOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('intent') === '1' || params.get('intent') === 'true';
  });
  const [isNansenOpen, setIsNansenOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('nansen') === '1' || params.get('nansen') === 'true';
  });
  const [isTunerOpen, setIsTunerOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tuner') === '1' || params.get('tuner') === 'true';
  });
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulatingRoute, setIsSimulatingRoute] = useState(false);
  const [activeNansenEntity, setActiveNansenEntity] = useState<NansenEntityTarget | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const entityParam = params.get('entity');
    if (entityParam) {
      const found = PRESET_ENTITIES.find(e => e.label.toLowerCase().includes(entityParam.toLowerCase()) || e.address.toLowerCase() === entityParam.toLowerCase());
      if (found) return found;
    }
    const saved = localStorage.getItem('aether_active_entity_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved Nansen entity', e);
      }
    }
    return null;
  });

  // History for Undo
  const historyRef = useRef<string[]>([]);

  // Canvas References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const cameraRef = useRef<CameraController>(new CameraController());
  const shaderPipelineRef = useRef<WebGLShaderPipeline>(new WebGLShaderPipeline());
  const graphRendererRef = useRef<GraphRenderer>(new GraphRenderer());

  // Mouse interaction state
  const isDraggingNodeRef = useRef(false);
  const draggedNodeRef = useRef<CanvasNode | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const isMinimapDraggingRef = useRef(false);
  const pointerDownClientRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const pendingInspectRef = useRef<CanvasNode | null>(null);
  const pendingFocusClusterRef = useRef<string | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const gestureClosedRef = useRef(false);
  const CLICK_DRAG_THRESHOLD_PX = 6;
  const DOUBLE_CLICK_DELAY_MS = 280;

  const cancelPendingClick = useCallback(() => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Save state persistence
  useEffect(() => {
    localStorage.setItem('aether_nodes_v3', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      localStorage.setItem('aether_config_v1', JSON.stringify(config));
    }, 250);
    return () => window.clearTimeout(t);
  }, [config]);

  useEffect(() => {
    localStorage.setItem('aether_wires_v1', JSON.stringify(wires));
  }, [wires]);

  useEffect(() => {
    if (activeNansenEntity) {
      localStorage.setItem('aether_active_entity_v1', JSON.stringify(activeNansenEntity));
    } else {
      localStorage.removeItem('aether_active_entity_v1');
    }
  }, [activeNansenEntity]);

  // Drop dangling wires whose endpoints no longer exist (refresh / undo / node close)
  useEffect(() => {
    const nodeIds = new Set(nodes.map(n => n.id));
    setWires(prev => {
      const next = prev.filter(w => nodeIds.has(w.fromId) && nodeIds.has(w.toId));
      return next.length === prev.length ? prev : next;
    });
  }, [nodes]);

  // Restore camera on mount & persist it continuously (survives F5)
  useEffect(() => {
    const cam = cameraRef.current;
    try {
      const saved = localStorage.getItem('aether_camera_v1');
      if (saved) {
        const p = JSON.parse(saved);
        if (typeof p.x === 'number' && typeof p.y === 'number' && typeof p.scale === 'number') {
          cam.state.x = p.x;
          cam.state.y = p.y;
          cam.state.targetX = p.x;
          cam.state.targetY = p.y;
          cam.state.scale = p.scale;
          cam.state.targetScale = p.scale;
          if (p.isOverview) {
            cam.state.isOverview = true;
            cam.state.transitionProgress = 1;
            setIsOverview(true);
          }
        }
      }
    } catch (e) {
      console.error('Failed to restore camera state', e);
    }

    const saveCamera = () => {
      try {
        localStorage.setItem('aether_camera_v1', JSON.stringify({
          x: cam.state.x,
          y: cam.state.y,
          scale: cam.state.scale,
          isOverview: cam.state.isOverview
        }));
      } catch (e) {
        console.error('Failed to save camera state', e);
      }
    };

    const interval = window.setInterval(saveCamera, 1000);
    window.addEventListener('beforeunload', saveCamera);
    return () => {
      saveCamera();
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', saveCamera);
    };
  }, []);

  // If ?intent=1 was passed in URL on mount, activate overview camera
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intent') === '1' || params.get('intent') === 'true') {
      cameraRef.current.setOverview(true, config.overviewScale, config.normalScale, 0, 0);
      setIsOverview(true);
    }
  }, [config.overviewScale, config.normalScale]);

  // Synchronize URL query parameters with active UI state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // View mode
    if (viewMode === 'canvas') {
      params.delete('view');
    } else {
      params.set('view', viewMode);
    }

    // Theme mode
    if (config.themeMode === 'light') {
      params.set('theme', 'light');
    } else {
      params.delete('theme');
    }

    // Modals / Panels
    if (isIntentOpen) {
      params.set('intent', '1');
    } else {
      params.delete('intent');
    }

    if (isNansenOpen) {
      params.set('nansen', '1');
    } else {
      params.delete('nansen');
    }

    if (isTunerOpen) {
      params.set('tuner', '1');
    } else {
      params.delete('tuner');
    }

    // Entity
    if (activeNansenEntity) {
      params.set('entity', activeNansenEntity.address || activeNansenEntity.label);
    } else {
      params.delete('entity');
    }

    // Selected node
    if (selectedNode && detailPhase !== 'none') {
      params.set('node', selectedNode.id);
    } else {
      params.delete('node');
    }

    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (newUrl !== currentUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [viewMode, config.themeMode, isIntentOpen, isNansenOpen, isTunerOpen, activeNansenEntity, selectedNode, detailPhase]);

  const recordHistory = useCallback(() => {
    historyRef.current.push(JSON.stringify(nodes));
    if (historyRef.current.length > 20) historyRef.current.shift();
  }, [nodes]);

  // Focus node and fly camera
  const focusNode = useCallback((nodeId: string, flyTo = true, targetScale?: number) => {
    setFocusedNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && flyTo) {
      const scaleToUse = targetScale !== undefined 
        ? targetScale 
        : (cameraRef.current.state.isOverview ? Math.max(0.85, config.normalScale) : cameraRef.current.state.scale);
      cameraRef.current.state.isOverview = false;
      setIsOverview(false);
      cameraRef.current.flyTo(node.x + node.w / 2, node.y + node.h / 2, scaleToUse);
    }
  }, [nodes, config.normalScale]);

  // Load Nansen Entity & Build Dynamic Spatial Graph
  const handleLoadNansenEntity = useCallback(async (entity: typeof PRESET_ENTITIES[0]) => {
    recordHistory();
    showToast(`Indexing on-chain data for ${entity.label}...`);
    try {
      const { nodes: newNodes, wires: newWires } = await buildNansenSpatialGraph(entity);
      if (newNodes.length > 0) {
        setNodes(newNodes);
        setWires(newWires);
        setActiveNansenEntity(entity);
        focusNode(newNodes[0].id, true);
        cameraRef.current.state.x = newNodes[0].x;
        cameraRef.current.state.y = newNodes[0].y;
        cameraRef.current.state.targetX = newNodes[0].x;
        cameraRef.current.state.targetY = newNodes[0].y;
        showToast(`Generated live spatial graph for ${entity.label}`);
      }
    } catch (e: any) {
      console.error('Failed to load Nansen graph:', e);
      showToast(`Error loading Nansen data: ${e?.message || 'Unknown error'}`);
    }
  }, [recordHistory, focusNode, showToast]);

  // Toggle Fill Screen (Super+T)
  const handleToggleFill = useCallback((nodeId: string) => {
    recordHistory();
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        if (!n.isFilled) {
          return {
            ...n,
            isFilled: true,
            originalBounds: { x: n.x, y: n.y, w: n.w, h: n.h },
            x: cameraRef.current.state.x - 480,
            y: cameraRef.current.state.y - 320,
            w: 960,
            h: 640
          };
        } else if (n.originalBounds) {
          return {
            ...n,
            isFilled: false,
            x: n.originalBounds.x,
            y: n.originalBounds.y,
            w: n.originalBounds.w,
            h: n.originalBounds.h
          };
        }
      }
      return n;
    }));
    showToast('Toggled Fill Screen (Super+T)');
  }, [recordHistory, showToast]);

  // Toggle Pin (Super+O)
  const handleTogglePin = useCallback((nodeId: string) => {
    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        const nextPinned = !n.isPinned;
        showToast(nextPinned ? `Pinned ${n.title} to screen` : `Unpinned ${n.title}`);
        return { ...n, isPinned: nextPinned };
      }
      return n;
    }));
  }, [showToast]);

  // Nudge focused window (Super + Shift + Arrows)
  const handleNudge = useCallback((dx: number, dy: number) => {
    recordHistory();
    const step = config.gridSpacing;
    setNodes(prev => prev.map(n => {
      if (n.id === focusedNodeId) {
        return {
          ...n,
          x: n.x + dx * step,
          y: n.y + dy * step
        };
      }
      return n;
    }));
  }, [focusedNodeId, config.gridSpacing, recordHistory]);

  // Focus nearest window in direction (Super + Arrows)
  const handleFocusNearest = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    const cur = nodes.find(n => n.id === focusedNodeId);
    if (!cur) return;

    let nearestNode: CanvasNode | null = null;
    let minDist = Infinity;

    nodes.forEach(n => {
      if (n.id === cur.id) return;
      const dx = n.x - cur.x;
      const dy = n.y - cur.y;

      let isValid = false;
      if (dir === 'left' && dx < -50) isValid = true;
      if (dir === 'right' && dx > 50) isValid = true;
      if (dir === 'up' && dy < -50) isValid = true;
      if (dir === 'down' && dy > 50) isValid = true;

      if (isValid) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestNode = n;
        }
      }
    });

    if (nearestNode) {
      focusNode((nearestNode as CanvasNode).id, true);
    }
  }, [nodes, focusedNodeId, focusNode]);

  // Click a window → star cluster: selected center, linked nodes around, others parked+dimmed
  const layoutFocusCluster = useCallback((centerId: string) => {
    const center = nodes.find(n => n.id === centerId);
    if (!center) return;

    const relatedIds = new Set<string>([centerId]);
    wires.forEach(w => {
      if (w.fromId === centerId) relatedIds.add(w.toId);
      if (w.toId === centerId) relatedIds.add(w.fromId);
    });

    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const neighbors = [...relatedIds]
      .filter(id => id !== centerId)
      .map(id => nodeById.get(id)!)
      .filter(Boolean);
    const others = nodes.filter(n => !relatedIds.has(n.id));

    recordHistory();

    const cx = 0;
    const cy = 0;
    const maxNeighborSpan = neighbors.reduce(
      (m, n) => Math.max(m, n.w, n.h),
      Math.max(center.w, center.h)
    );
    const radius = Math.max(460, maxNeighborSpan * 0.7 + 300);

    const posById = new Map<string, { x: number; y: number }>();
    posById.set(centerId, { x: cx - center.w / 2, y: cy - center.h / 2 });

    if (neighbors.length === 1) {
      const n = neighbors[0];
      posById.set(n.id, { x: cx - n.w / 2, y: cy - radius - n.h / 2 });
    } else if (neighbors.length === 2) {
      neighbors.forEach((n, i) => {
        const side = i === 0 ? -1 : 1;
        posById.set(n.id, {
          x: cx + side * radius * 0.95 - n.w / 2,
          y: cy - n.h / 2,
        });
      });
    } else {
      neighbors.forEach((n, i) => {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / neighbors.length;
        const rx = radius * 1.2;
        const ry = radius * 0.95;
        posById.set(n.id, {
          x: cx + Math.cos(angle) * rx - n.w / 2,
          y: cy + Math.sin(angle) * ry - n.h / 2,
        });
      });
    }

    const parkX = cx + radius * 1.2 + Math.max(center.w, 480) + 120;
    const parkGap = 200;
    const parkY0 = cy - ((others.length - 1) * parkGap) / 2;
    others.forEach((n, i) => {
      posById.set(n.id, {
        x: parkX,
        y: parkY0 + i * parkGap - n.h / 2,
      });
    });

    setNodes(prev => prev.map(n => {
      const next = posById.get(n.id);
      return next ? { ...n, x: next.x, y: next.y } : n;
    }));
    setHighlightNodeIds([...relatedIds]);
    setFocusedNodeId(centerId);

    // Initial camera: will be refined once nodes settle; Shift+F re-fits tighter.
    const roughSpan = radius * 2.2 + Math.max(center.w, center.h);
    const canvas = canvasRef.current;
    const screenW = canvas?.clientWidth || window.innerWidth;
    const screenH = canvas?.clientHeight || window.innerHeight;
    const initScale = Math.max(
      0.35,
      Math.min(2.2, Math.min((screenW - 48) / roughSpan, (screenH - 80) / roughSpan) * 1.12)
    );
    cameraRef.current.flyTo(cx, cy, initScale);
    showToast(
      neighbors.length > 0
        ? `Focus: ${center.title} + ${neighbors.length} linked (Shift+F fit · Ctrl+Z undo · Esc clear dim)`
        : `Focus: ${center.title} (Shift+F fit · no linked windows)`
    );
  }, [nodes, wires, recordHistory, showToast]);

  // Fit current focus cluster (or focused node + linked) to the live viewport
  const fitFocusClusterToScreen = useCallback(() => {
    const relatedIds = new Set<string>(
      highlightNodeIds.length > 0 ? highlightNodeIds : [focusedNodeId]
    );
    if (highlightNodeIds.length === 0 && focusedNodeId) {
      wires.forEach(w => {
        if (w.fromId === focusedNodeId) relatedIds.add(w.toId);
        if (w.toId === focusedNodeId) relatedIds.add(w.fromId);
      });
    }

    const cluster = nodes.filter(n => relatedIds.has(n.id));
    if (cluster.length === 0) {
      showToast('Nothing to fit — click a window first');
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    cluster.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });

    const worldW = Math.max(1, maxX - minX);
    const worldH = Math.max(1, maxY - minY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const canvas = canvasRef.current;
    const screenW = canvas?.clientWidth || window.innerWidth;
    const screenH = canvas?.clientHeight || window.innerHeight;
    // Tight chrome padding — fill most of the viewport
    const padX = 36;
    const padY = 64;
    const FILL = 1.15;
    const fitScale = Math.max(
      0.3,
      Math.min(
        2.4,
        Math.min((screenW - padX) / worldW, (screenH - padY) / worldH) * FILL
      )
    );

    cameraRef.current.state.isOverview = false;
    setIsOverview(false);
    cameraRef.current.flyTo(cx, cy, fitScale);
    showToast(
      cluster.length > 1
        ? `Fit ${cluster.length} windows to screen`
        : `Fit ${cluster[0].title} to screen`
    );
  }, [nodes, wires, highlightNodeIds, focusedNodeId, showToast]);

  // Tidy: one column per wallet, children stacked below → wires stay short/vertical
  const handleSmartArrange = useCallback(() => {
    recordHistory();

    const GUTTER = 64;
    const riskRank: Record<string, number> = { critical: 0, high: 1, medium: 2, safe: 3 };
    const nodeById = new Map(nodes.map(n => [n.id, n]));

    const wallets = nodes
      .filter(n => n.type === 'wallet')
      .sort((a, b) => b.valueUsd - a.valueUsd);

    const childIdsByWallet = new Map<string, string[]>();
    const assigned = new Set<string>();
    wallets.forEach(w => childIdsByWallet.set(w.id, []));

    wires.forEach(wire => {
      const from = nodeById.get(wire.fromId);
      const to = nodeById.get(wire.toId);
      if (!from || !to) return;
      if (from.type === 'wallet' && to.type !== 'wallet' && !assigned.has(to.id)) {
        childIdsByWallet.get(from.id)?.push(to.id);
        assigned.add(to.id);
      } else if (to.type === 'wallet' && from.type !== 'wallet' && !assigned.has(from.id)) {
        childIdsByWallet.get(to.id)?.push(from.id);
        assigned.add(from.id);
      }
    });

    childIdsByWallet.forEach((ids, walletId) => {
      ids.sort((a, b) => {
        const na = nodeById.get(a)!;
        const nb = nodeById.get(b)!;
        const riskDelta = (riskRank[na.riskLevel] ?? 9) - (riskRank[nb.riskLevel] ?? 9);
        return riskDelta !== 0 ? riskDelta : nb.valueUsd - na.valueUsd;
      });
      childIdsByWallet.set(walletId, ids);
    });

    const orphans = nodes.filter(n => n.type !== 'wallet' && !assigned.has(n.id));
    const columns: CanvasNode[][] = wallets.map(w => {
      const kids = (childIdsByWallet.get(w.id) || [])
        .map(id => nodeById.get(id)!)
        .filter(Boolean);
      return [w, ...kids];
    });
    if (orphans.length > 0) {
      orphans.sort((a, b) => b.valueUsd - a.valueUsd);
      columns.push(orphans);
    }
    if (columns.length === 0) return;

    const allNodes = columns.flat();
    const cellW = Math.max(...allNodes.map(n => n.w), 420) + GUTTER;
    const cellH = Math.max(...allNodes.map(n => n.h), 220) + GUTTER;
    const maxRows = Math.max(...columns.map(c => c.length));
    const gridW = columns.length * cellW - GUTTER;
    const gridH = maxRows * cellH - GUTTER;
    const originX = -gridW / 2;
    const originY = -gridH / 2;

    const posById = new Map<string, { x: number; y: number }>();
    columns.forEach((colNodes, col) => {
      colNodes.forEach((node, row) => {
        const cellX = originX + col * cellW;
        const cellY = originY + row * cellH;
        posById.set(node.id, {
          x: cellX + (cellW - GUTTER - node.w) / 2,
          y: cellY + (cellH - GUTTER - node.h) / 2,
        });
      });
    });

    setNodes(prev => prev.map(n => {
      const next = posById.get(n.id);
      return next ? { ...n, x: next.x, y: next.y } : n;
    }));
    setHighlightNodeIds([]);

    const fitScale = Math.min(
      config.normalScale,
      Math.max(0.32, Math.min(1500 / gridW, 900 / gridH))
    );
    cameraRef.current.flyTo(0, gridH * 0.05, fitScale);
    showToast('Tidied into wallet columns — click a window to isolate its cluster');
  }, [nodes, wires, recordHistory, showToast, config.normalScale]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length > 0) {
      const prev = historyRef.current.pop();
      if (prev) {
        setNodes(JSON.parse(prev));
        showToast('Undo layout change (Ctrl+Z)');
      }
    }
  }, [showToast]);

  // Overview zoom — may open Intent when entering, always clears Intent when leaving
  const toggleOverviewMode = useCallback((enable?: boolean) => {
    const nextState = enable !== undefined ? enable : !cameraRef.current.state.isOverview;
    cameraRef.current.setOverview(
      nextState,
      config.overviewScale,
      config.normalScale,
      0,
      0
    );
    setIsOverview(nextState);
    if (nextState) {
      setIsIntentOpen(true);
    } else {
      setIsIntentOpen(false);
    }
  }, [config.overviewScale, config.normalScale]);

  /** Mission Control: ensure overview + open Spotlight (canvas stays visible underneath) */
  const openIntentMissionControl = useCallback(() => {
    if (!cameraRef.current.state.isOverview) {
      cameraRef.current.setOverview(
        true,
        config.overviewScale,
        config.normalScale,
        0,
        0
      );
      setIsOverview(true);
    }
    setIsIntentOpen(true);
  }, [config.overviewScale, config.normalScale]);

  /** Soft-close Spotlight only — keep overview so demo pan/zoom of the map continues */
  const closeIntentSpotlight = useCallback(() => {
    setIsIntentOpen(false);
  }, []);

  const openPositionDetail = useCallback((node: CanvasNode) => {
    setSelectedNode(node);
    setFocusedNodeId(node.id);
    setDetailPhase(initialPhaseForNode(node));
  }, []);

  const clearPositionDetail = useCallback(() => {
    setSelectedNode(null);
    setDetailPhase('none');
  }, []);

  const closeDetailLayer = useCallback(() => {
    if (detailPhase === 'confirm') {
      setDetailPhase(confirmReturnPhase);
      return;
    }
    if (detailPhase === 'inspect') {
      setDetailPhase(selectedNode?.riskLevel === 'critical' ? 'sheet' : 'peek');
      return;
    }
    clearPositionDetail();
  }, [detailPhase, confirmReturnPhase, selectedNode, clearPositionDetail]);

  const requestUnwind = useCallback((returnPhase: 'peek' | 'sheet' | 'inspect', routeIndex = 0) => {
    setConfirmReturnPhase(returnPhase);
    setConfirmRouteIndex(routeIndex);
    setDetailPhase('confirm');
  }, []);

  const handleFocusNode = useCallback((node: CanvasNode, openDetail = false) => {
    focusNode(node.id, true, Math.max(0.88, config.normalScale));
    cameraRef.current.state.isOverview = false;
    setIsOverview(false);
    setIsIntentOpen(false);
    if (openDetail) {
      openPositionDetail(node);
    }
  }, [focusNode, openPositionDetail, config.normalScale]);

  // Smoothly glide and zoom to a single node from Intent Spotlight
  const handleZoomSingleNode = useCallback((node: CanvasNode) => {
    const canvas = canvasRef.current;
    const screenW = canvas?.clientWidth || window.innerWidth;
    let cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    const fitScale = Math.max(0.88, config.normalScale);

    if (window.innerWidth >= 768) {
      // Offset camera horizontally so the node appears in the center of the right viewing area
      const leftPanelWidth = 540;
      const shiftScreenPx = leftPanelWidth / 2;
      cx -= shiftScreenPx / fitScale;
    }

    cameraRef.current.state.isOverview = false;
    setIsOverview(false);
    cameraRef.current.flyTo(cx, cy, fitScale);
    setFocusedNodeId(node.id);
    setHighlightNodeIds([node.id]);
    showToast(`Zoomed to ${node.title}`);
  }, [config.normalScale, showToast]);

  // Frame and zoom all matching search options on canvas
  const handleFitNodes = useCallback((nodeIds: string[]) => {
    const targetNodes = nodes.filter(n => nodeIds.includes(n.id));
    if (targetNodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    targetNodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.w);
      maxY = Math.max(maxY, n.y + n.h);
    });

    const worldW = Math.max(1, maxX - minX);
    const worldH = Math.max(1, maxY - minY);
    let cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const canvas = canvasRef.current;
    const screenW = canvas?.clientWidth || window.innerWidth;
    const screenH = canvas?.clientHeight || window.innerHeight;

    // Available viewport width when Spotlight is docked on the left (desktop >= 768px)
    const leftPanelWidth = window.innerWidth >= 768 ? 540 : 0;
    const usableW = Math.max(320, screenW - leftPanelWidth);
    const padX = 72;
    const padY = 96;

    const fitScale = Math.max(
      0.35,
      Math.min(
        1.45,
        Math.min((usableW - padX) / worldW, (screenH - padY) / worldH) * 0.92
      )
    );

    // If Spotlight is on the left, offset camera center horizontally so the cluster is centered in the right pane
    if (window.innerWidth >= 768) {
      const shiftScreenPx = leftPanelWidth / 2;
      cx -= shiftScreenPx / fitScale;
    }

    cameraRef.current.state.isOverview = false;
    setIsOverview(false);
    cameraRef.current.flyTo(cx, cy, fitScale);
    setHighlightNodeIds(nodeIds);
    showToast(
      targetNodes.length > 1
        ? `Framed ${targetNodes.length} matching options on canvas`
        : `Zoomed to ${targetNodes[0].title}`
    );
  }, [nodes, showToast]);

  // Filter high-risk positions
  const handleFilterRisk = useCallback(() => {
    const criticalNodes = nodes.filter(n => n.riskLevel === 'critical' || n.riskLevel === 'high');
    const ids = criticalNodes.map(n => n.id);
    setHighlightNodeIds(ids);
    toggleOverviewMode(true);
    showToast(`Spotlighting ${criticalNodes.length} High-Risk Positions`);
  }, [nodes, toggleOverviewMode, showToast]);

  // Toggle Theme Mode (Light / Dark) — startTransition keeps UI snappy
  const handleToggleThemeMode = useCallback(() => {
    startTransition(() => {
      setConfig((prev) => ({
        ...prev,
        themeMode: prev.themeMode === 'light' ? 'dark' : 'light',
      }));
    });
  }, []);

  // Dynamically generate and inject research graph & animated wires
  const handleApplyDynamicResearchGraph = useCallback(async (prompt: string) => {
    try {
      const res = await buildNansenResearchSubgraph(prompt, nodes, wires);
      setNodes(res.nodes);
      setWires(res.wires);
      setHighlightNodeIds(res.highlightIds);

      const targetNode = res.nodes.find(n => n.id === res.primaryTargetId) || res.nodes[0];
      if (targetNode) {
        focusNode(targetNode.id, true);
      }
      showToast(`Energized dynamic flow graph with ${res.highlightIds.length} nodes & wires`);
    } catch (err: any) {
      console.warn('Failed to apply dynamic research graph:', err);
    }
  }, [nodes, wires, focusNode, showToast]);

  // Handle Route Execution Simulation
  const handleExecuteRoute = useCallback((route: RecommendedRoute) => {
    setIsSimulatingRoute(true);
    showToast(`Executing route: ${route.title}`);
    setTimeout(() => {
      setIsSimulatingRoute(false);
      setIsIntentOpen(false);
      showToast('Route Executed & Settled Successfully!');
    }, 4000);
  }, [showToast]);

  // Handle Kill Switch & Output Detailed Settlement Receipt
  const handleKillSwitch = useCallback((node: CanvasNode, route: PositionExitRoute) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const txHash = '5Kz' + Math.random().toString(36).substring(2, 9) + '9pQ' + Math.random().toString(36).substring(2, 6);
    const penaltySaved = '+$' + Math.round((node.valueUsd || 68500) * 0.82).toLocaleString();

    const receipt: PositionSettlementReceipt = {
      timestamp,
      txHash,
      targetAsset: route.targetAsset,
      recoveredAmount: route.estReturn,
      debtExtinguished: node.borrowAsset || '3,270 SOL ($615,000 Notional)',
      liquidationPenaltySaved: penaltySaved,
      priorHealthFactor: node.healthFactor ?? 1.08,
      newHealthFactor: 99.9,
      feePaid: route.fee,
      routeSummary: route.routeSummary,
      mevProtection: 'Jito MEV Shielded Bundle (Private RPC)'
    };

    const updatedNode: CanvasNode = {
      ...node,
      riskLevel: 'safe',
      title: `${node.title} (Unwound & Safe)`,
      pnl24hUsd: 0,
      healthFactor: 99.9,
      debtRatioPct: 0,
      borrowDebtUsd: 0,
      settlementReceipt: receipt
    };

    setNodes(prev => prev.map(n => (n.id === node.id ? updatedNode : n)));
    setActiveSettlementReceipt({ node: updatedNode, receipt });
    showToast(`SETTLED: Recovered ${route.estReturn} • Debt Cleared to $0`);
  }, [showToast]);

  // Reset to Default Portfolio (Ctrl+Shift+R or HUD button)
  const handleResetPortfolio = useCallback(() => {
    [
      'aether_nodes_v3',
      'aether_nodes_v2',
      'aether_nodes_v1',
      'phantomat_nodes_v1',
      'aether_wires_v1',
      'aether_camera_v1',
      'aether_active_entity_v1'
    ].forEach(k => localStorage.removeItem(k));

    historyRef.current = [];
    setNodes(JSON.parse(JSON.stringify(INITIAL_NODES)));
    setWires(JSON.parse(JSON.stringify(INITIAL_WIRES)));
    setActiveNansenEntity(null);
    setHighlightNodeIds([]);
    clearPositionDetail();
    setFocusedNodeId(INITIAL_NODES[0]?.id || 'wallet-ledger');

    const cam = cameraRef.current;
    cam.state.isOverview = false;
    cam.state.transitionProgress = 0;
    cam.state.x = 0;
    cam.state.y = 0;
    cam.state.targetX = 0;
    cam.state.targetY = 0;
    cam.state.scale = config.normalScale;
    cam.state.targetScale = config.normalScale;
    setIsOverview(false);
    setIsIntentOpen(false);

    showToast('Reset to Default Portfolio');
  }, [config.normalScale, showToast, clearPositionDetail]);

  useEffect(() => {
    if (selectedNode && detailPhase === 'none') {
      setDetailPhase(initialPhaseForNode(selectedNode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- URL bootstrap only
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Super + T -> Toggle Fill
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleToggleFill(focusedNodeId);
        return;
      }

      // Super + O -> Toggle Pin
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleTogglePin(focusedNodeId);
        return;
      }

      // View dock shortcuts (1: Canvas, 2: Table List, 3: CCTV Feed, 4: Intent)
      if (e.key === '1' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setViewMode('canvas');
        return;
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setViewMode('list');
        return;
      }
      if (e.key === '3' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setViewMode('exposure-grid');
        return;
      }
      if (e.key === '4' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (isIntentOpen) closeIntentSpotlight();
        else openIntentMissionControl();
        return;
      }

      // Super + Shift + Arrows -> Nudge window
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); handleNudge(-1, 0); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); handleNudge(1, 0); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); handleNudge(0, -1); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); handleNudge(0, 1); return; }
      }

      // Super + Arrows -> Focus nearest
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); handleFocusNearest('left'); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); handleFocusNearest('right'); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); handleFocusNearest('up'); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); handleFocusNearest('down'); return; }
      }

      // Cmd+K / SUPER+CTRL+G / / -> Mission Control Spotlight (soft toggle)
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') ||
        e.key === '/'
      ) {
        e.preventDefault();
        if (isIntentOpen) {
          closeIntentSpotlight();
        } else {
          openIntentMissionControl();
        }
        return;
      }

      // Ctrl + A -> Smart Arrange
      if (e.ctrlKey && e.key.toLowerCase() === 'a' && !e.metaKey) {
        e.preventDefault();
        handleSmartArrange();
        return;
      }

      // Ctrl + Z -> Undo
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Ctrl + , -> Live Tuner
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setIsTunerOpen(prev => !prev);
        return;
      }

      // F1 -> Help Modal
      if (e.key === 'F1') {
        e.preventDefault();
        setIsHelpOpen(prev => !prev);
        return;
      }

      // Shift+F -> Fit focus cluster to current screen (e.code survives layouts/IME)
      if (
        e.shiftKey &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.repeat &&
        (e.code === 'KeyF' || e.key.toLowerCase() === 'f')
      ) {
        e.preventDefault();
        e.stopPropagation();
        if (viewMode !== 'canvas') {
          showToast('Switch to Canvas (1) then Shift+F to fit');
          return;
        }
        fitFocusClusterToScreen();
        return;
      }

      // Ctrl/Cmd + Shift + R -> Reset to Default Portfolio
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleResetPortfolio();
        return;
      }

      // Escape -> staged dismiss: Spotlight first, then overview / other panels
      if (e.key === 'Escape') {
        if (isIntentOpen) {
          closeIntentSpotlight();
          return;
        }
        setIsNansenOpen(false);
        setIsTunerOpen(false);
        setIsHelpOpen(false);
        if (detailPhase !== 'none') return;
        setHighlightNodeIds([]);
        cancelPendingClick();
        pendingInspectRef.current = null;
        pendingFocusClusterRef.current = null;
        didDragRef.current = false;
        isDraggingNodeRef.current = false;
        draggedNodeRef.current = null;
        isPanningRef.current = false;
        isMinimapDraggingRef.current = false;
        if (cameraRef.current.state.isOverview) {
          toggleOverviewMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [
    nodes,
    focusedNodeId,
    isIntentOpen,
    toggleOverviewMode,
    openIntentMissionControl,
    closeIntentSpotlight,
    detailPhase,
    closeDetailLayer,
    handleSmartArrange,
    handleUndo,
    handleToggleFill,
    handleTogglePin,
    handleNudge,
    handleFocusNearest,
    handleResetPortfolio,
    cancelPendingClick,
    fitFocusClusterToScreen,
    viewMode,
    showToast
  ]);

  // Persistent render state ref for 60/120 FPS render loop without context loss
  const renderStateRef = useRef({
    nodes,
    wires,
    config,
    highlightNodeIds,
    focusedNodeId,
    isSimulatingRoute
  });

  useEffect(() => {
    renderStateRef.current = {
      nodes,
      wires,
      config,
      highlightNodeIds,
      focusedNodeId,
      isSimulatingRoute
    };
  }, [nodes, wires, config, highlightNodeIds, focusedNodeId, isSimulatingRoute]);

  // WebGL & Render Loop (Initialized once on mount)
  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreen = offscreenCanvasRef.current;
    if (!canvas || !offscreen) return;

    shaderPipelineRef.current.init(canvas);

    let animationFrameId: number;
    let lastTime = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);

      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
    };

    resize();
    window.addEventListener('resize', resize);

    // Direct non-passive wheel event for buttery smooth zero-latency zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const nextScale = Math.max(0.18, Math.min(2.5, cameraRef.current.state.targetScale * zoomFactor));
      cameraRef.current.state.targetScale = nextScale;

      if (nextScale < 0.45 && !cameraRef.current.state.isOverview) {
        cameraRef.current.state.isOverview = true;
        setIsOverview(true);
      } else if (nextScale >= 0.75 && cameraRef.current.state.isOverview) {
        cameraRef.current.state.isOverview = false;
        setIsOverview(false);
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = offscreen.width;
      const h = offscreen.height;
      const state = renderStateRef.current;

      // Update camera physics
      cameraRef.current.update(dt, state.config.cameraSpeed);

      // Render 2D scene onto offscreen canvas
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        graphRendererRef.current.renderScene(
          ctx,
          w,
          h,
          cameraRef.current,
          state.nodes,
          state.wires,
          state.config,
          dt,
          state.highlightNodeIds,
          state.focusedNodeId,
          state.isSimulatingRoute
        );
      }

      // WebGL Shader Pass
      shaderPipelineRef.current.render(
        offscreen,
        canvas.width,
        canvas.height,
        state.config,
        cameraRef.current.state.transitionProgress
      );

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Canvas Mouse / Touch Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const offscreen = offscreenCanvasRef.current;
    if (!canvas || !offscreen) return;

    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (offscreen.width / rect.width);
    const sy = (e.clientY - rect.top) * (offscreen.height / rect.height);

    // Check Radar Minimap click (bottom-right)
    const mapW = 230, mapH = 145, margin = 24;
    const mapX = offscreen.width - mapW - margin;
    const mapY = offscreen.height - mapH - margin;

    if (sx >= mapX && sx <= mapX + mapW && sy >= mapY && sy <= mapY + mapH) {
      if (sx >= mapX + mapW - 26 && sy <= mapY + 26) {
        handleSmartArrange();
        return;
      }

      const minX = -1200, maxX = 1800, minY = -700, maxY = 1200;
      const targetWorldX = minX + ((sx - mapX) / mapW) * (maxX - minX);
      const targetWorldY = minY + ((sy - mapY) / mapH) * (maxY - minY);
      cameraRef.current.flyTo(targetWorldX, targetWorldY);
      isMinimapDraggingRef.current = true;
      return;
    }

    const worldPos = cameraRef.current.screenToWorld(sx, sy, offscreen.width, offscreen.height);

    // Check if clicked a node (from top to bottom)
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (
        worldPos.x >= node.x && worldPos.x <= node.x + node.w &&
        worldPos.y >= node.y && worldPos.y <= node.y + node.h
      ) {
        focusNode(node.id, false);

        // Check if clicking traffic light red dot (close/delete node)
        const dotPad = 12;
        const dotR = 8;
        if (
          worldPos.x >= node.x + dotPad - dotR &&
          worldPos.x <= node.x + dotPad + dotR &&
          worldPos.y >= node.y + 4 &&
          worldPos.y <= node.y + 30
        ) {
          recordHistory();
          setNodes(prev => prev.filter(n => n.id !== node.id));
          showToast(`Closed window: ${node.title}`);
          return;
        }

        // Check if clicking yellow dot (fill/unfill)
        if (
          worldPos.x >= node.x + dotPad + 12 - dotR &&
          worldPos.x <= node.x + dotPad + 12 + dotR &&
          worldPos.y >= node.y + 4 &&
          worldPos.y <= node.y + 30
        ) {
          handleToggleFill(node.id);
          return;
        }

        if (cameraRef.current.state.isOverview) {
          handleFocusNode(node, false);
          return;
        }

        // Arm drag. Single clean click → cluster (deferred); double-click → cluster + inspect.
        gestureClosedRef.current = false;
        if (e.detail >= 2) {
          // Cancel the deferred single-click from the first click of this double-click.
          cancelPendingClick();
          pendingFocusClusterRef.current = node.id;
          pendingInspectRef.current = node;
        } else {
          pendingFocusClusterRef.current = node.id;
          pendingInspectRef.current = null;
        }
        didDragRef.current = false;
        pointerDownClientRef.current = { x: e.clientX, y: e.clientY };
        isDraggingNodeRef.current = true;
        draggedNodeRef.current = node;
        dragOffsetRef.current = {
          x: worldPos.x - node.x,
          y: worldPos.y - node.y
        };

        const reordered = [...nodes];
        reordered.splice(i, 1);
        reordered.push(node);
        setNodes(reordered);
        return;
      }
    }

    cancelPendingClick();
    pendingInspectRef.current = null;
    pendingFocusClusterRef.current = null;
    didDragRef.current = false;
    gestureClosedRef.current = false;
    setHighlightNodeIds([]);
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const offscreen = offscreenCanvasRef.current;
    if (!offscreen) return;

    if (isDraggingNodeRef.current && draggedNodeRef.current) {
      const moveDx = e.clientX - pointerDownClientRef.current.x;
      const moveDy = e.clientY - pointerDownClientRef.current.y;
      if (!didDragRef.current) {
        if (Math.hypot(moveDx, moveDy) < CLICK_DRAG_THRESHOLD_PX) return;
        didDragRef.current = true;
        cancelPendingClick();
        pendingInspectRef.current = null;
        pendingFocusClusterRef.current = null;
        recordHistory();
      }

      const rect = canvasRef.current!.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (offscreen.width / rect.width);
      const sy = (e.clientY - rect.top) * (offscreen.height / rect.height);
      const worldPos = cameraRef.current.screenToWorld(sx, sy, offscreen.width, offscreen.height);

      const targetX = worldPos.x - dragOffsetRef.current.x;
      const targetY = worldPos.y - dragOffsetRef.current.y;

      setNodes(prev => prev.map(n => {
        if (n.id === draggedNodeRef.current!.id) {
          return { ...n, x: targetX, y: targetY };
        }
        return n;
      }));
    } else if (isPanningRef.current) {
      const dx = (e.clientX - panStartRef.current.x) / cameraRef.current.state.scale;
      const dy = (e.clientY - panStartRef.current.y) / cameraRef.current.state.scale;

      cameraRef.current.state.x -= dx;
      cameraRef.current.state.y -= dy;
      cameraRef.current.state.targetX = cameraRef.current.state.x;
      cameraRef.current.state.targetY = cameraRef.current.state.y;

      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };

  const clearPointerInteraction = useCallback(() => {
    // Canvas mouseup + window mouseup both fire — only handle the gesture once.
    if (gestureClosedRef.current) return;
    if (!isDraggingNodeRef.current && !isPanningRef.current && !isMinimapDraggingRef.current) {
      return;
    }
    gestureClosedRef.current = true;

    const wasDrag = didDragRef.current;
    const clusterId = !wasDrag ? pendingFocusClusterRef.current : null;
    const inspectNode = !wasDrag ? pendingInspectRef.current : null;

    pendingInspectRef.current = null;
    pendingFocusClusterRef.current = null;
    didDragRef.current = false;
    isDraggingNodeRef.current = false;
    draggedNodeRef.current = null;
    isPanningRef.current = false;
    isMinimapDraggingRef.current = false;

    if (!clusterId && !inspectNode) return;

    // Double-click: run immediately (cluster + progressive detail).
    if (inspectNode) {
      cancelPendingClick();
      layoutFocusCluster(clusterId || inspectNode.id);
      openPositionDetail(inspectNode);
      return;
    }

    // Single-click: defer so a following double-click can cancel this.
    cancelPendingClick();
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      layoutFocusCluster(clusterId!);
    }, DOUBLE_CLICK_DELAY_MS);
  }, [layoutFocusCluster, cancelPendingClick, openPositionDetail]);

  const handleMouseUp = () => {
    clearPointerInteraction();
  };

  // Safety net: modal/overlay can steal canvas mouseup and leave drag armed.
  useEffect(() => {
    const onPointerUp = () => clearPointerInteraction();
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('pointerup', onPointerUp);
      cancelPendingClick();
    };
  }, [clearPointerInteraction, cancelPendingClick]);

  // Dynamic calculations
  const totalValue = nodes.reduce((sum, n) => sum + n.valueUsd, 0);
  const totalPnl = nodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0);
  const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
  const criticalCount = nodes.filter(n => n.riskLevel === 'critical' || n.riskLevel === 'high').length;

  return (
    <div className={`relative w-screen h-screen overflow-hidden font-mono select-none ${
      config.themeMode === 'light' ? 'theme-light bg-[#f8fafc] text-slate-900' : 'bg-[#07090e] text-slate-200'
    }`}>
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`absolute inset-0 w-full h-full block cursor-crosshair ${
          viewMode === 'canvas' ? '' : 'invisible pointer-events-none'
        }`}
      />

      {/* Screen 1: Top Bar & Portfolio Exposure HUD */}
      <TopBar
        config={config}
        nodes={nodes}
        onSmartArrange={handleSmartArrange}
        onOpenNansen={() => setIsNansenOpen(true)}
        onOpenTuner={() => setIsTunerOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onToggleThemeMode={handleToggleThemeMode}
      />

      {/* Morph UI: List Switcher (Dense Table List View) */}
      {viewMode === 'list' && (
        <ListSwitcher
          nodes={nodes}
          viewMode={viewMode}
          config={config}
          onChangeViewMode={setViewMode}
          onFocusNodeOnCanvas={(node) => {
            setViewMode('canvas');
            handleFocusNode(node, false);
          }}
          onInspectNode={openPositionDetail}
          onEmergencyKill={handleKillSwitch}
        />
      )}

      {/* CCTV Surveillance: SolaceUI Exposure Grid Mode */}
      {viewMode === 'exposure-grid' && (
        <ExposureGridFeed
          nodes={nodes}
          config={config}
          onInspectNode={openPositionDetail}
          onFocusNodeOnCanvas={(node) => {
            setViewMode('canvas');
            handleFocusNode(node, false);
          }}
          onEmergencyKill={handleKillSwitch}
        />
      )}

      {/* Screen 2: Natural Language Intent & Route Preview Panel */}
      <IntentPanel
        isOpen={isIntentOpen}
        onClose={closeIntentSpotlight}
        nodes={nodes}
        intentPresets={INTENT_PRESETS}
        config={config}
        onSelectNode={(node) => handleFocusNode(node, true)}
        onHighlightNodes={setHighlightNodeIds}
        onExecuteRoute={handleExecuteRoute}
        onApplyDynamicResearchGraph={handleApplyDynamicResearchGraph}
        onFitNodes={handleFitNodes}
        onZoomSingleNode={handleZoomSingleNode}
      />

      {/* Progressive position detail: peek → sheet → inspector → confirm */}
      {selectedNode && detailPhase === 'peek' && (
        <PositionPeek
          node={selectedNode}
          config={config}
          onInspect={() => setDetailPhase('inspect')}
          onUnwind={() => requestUnwind('peek')}
          onClose={clearPositionDetail}
        />
      )}
      {selectedNode && detailPhase === 'sheet' && (
        <PositionCommandSheet
          node={selectedNode}
          config={config}
          onInspect={() => setDetailPhase('inspect')}
          onUnwind={() => requestUnwind('sheet')}
          onClose={clearPositionDetail}
        />
      )}
      {selectedNode && detailPhase === 'inspect' && (
        <PositionInspector
          node={selectedNode}
          config={config}
          onClose={closeDetailLayer}
          onRequestUnwind={(routeIndex) => requestUnwind('inspect', routeIndex)}
          onDirectKillSwitch={(node, route) => {
            handleKillSwitch(node, route);
            clearPositionDetail();
          }}
        />
      )}
      {selectedNode && detailPhase === 'confirm' && (
        <UnwindConfirmModal
          node={selectedNode}
          config={config}
          initialRouteIndex={confirmRouteIndex}
          onClose={() => setDetailPhase(confirmReturnPhase)}
          onKillSwitch={(node, route) => {
            handleKillSwitch(node, route);
            clearPositionDetail();
          }}
        />
      )}

      {/* Active On-Chain Settlement Receipt Modal */}
      {activeSettlementReceipt && (
        <SettlementReceiptModal
          node={activeSettlementReceipt.node}
          receipt={activeSettlementReceipt.receipt}
          config={config}
          onClose={() => setActiveSettlementReceipt(null)}
          onFocusNode={(n) => handleFocusNode(n, false)}
          onShowToast={showToast}
        />
      )}

      {/* Live CRT Lens Tuner */}
      <LiveTuner
        isOpen={isTunerOpen}
        onClose={() => setIsTunerOpen(false)}
        config={config}
        onChangeConfig={setConfig}
        onShowToast={showToast}
      />

      {/* Nansen Intelligence & Profiler Modal */}
      <NansenModal
        isOpen={isNansenOpen}
        config={config}
        onClose={() => setIsNansenOpen(false)}
        onLoadEntity={handleLoadNansenEntity}
        onShowToast={showToast}
      />

      {/* Help & Shortcuts Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        config={config}
      />

      {/* macOS-style Floating Workspace Dock */}
      <ViewModeDock
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        config={config}
        isDimmed={viewMode === 'exposure-grid'}
        isIntentOpen={isIntentOpen}
        onToggleIntent={() => {
          if (isIntentOpen) closeIntentSpotlight();
          else openIntentMissionControl();
        }}
      />

      {/* Status Toast */}
      <Toast 
        message={toastMessage} 
        isLight={config.themeMode === 'light'} 
      />

      {/* Corner HUD coordinates & camera state readout */}
      {viewMode === 'canvas' && (
      <div className="absolute bottom-5 left-6 font-mono text-[10px] text-slate-500 tracking-wider pointer-events-none flex flex-col gap-1 drop-shadow">
        <span>CAM_POS: [X: {Math.round(cameraRef.current?.state.x || 0)}, Y: {Math.round(cameraRef.current?.state.y || 0)}]</span>
        <span>ZOOM_SCALE: {(cameraRef.current?.state.scale || 1.0).toFixed(2)}x &bull; NODES: {nodes.length} &bull; WIRES: {wires.length}</span>
        {activeNansenEntity && (
          <span className="text-cyan-400 font-bold">NANSEN_CTX: {activeNansenEntity.label} [{activeNansenEntity.chain}]</span>
        )}
        <span className="text-amber-500 font-bold">⌘K INTENT ENGINE &bull; ^A ARRANGE &bull; TAB VIEW SWITCH</span>
        <button
          onClick={handleResetPortfolio}
          className="pointer-events-auto mt-1 self-start px-2 py-1 rounded border border-white/15 bg-white/5 hover:bg-amber-500/20 hover:border-amber-400/60 text-slate-400 hover:text-amber-300 text-[10px] font-bold tracking-wider transition-all cursor-pointer"
        >
          ↺ RESET TO DEFAULT PORTFOLIO
        </button>
      </div>
      )}
    </div>
  );
};
