import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CanvasNode, WireConnection, LensConfig, RecommendedRoute, PositionExitRoute } from './types';
import { INITIAL_NODES, INITIAL_WIRES, INTENT_PRESETS, DEFAULT_LENS_CONFIG } from './data/mockData';
import { CameraController } from './engine/camera';
import { WebGLShaderPipeline } from './engine/shaderPipeline';
import { GraphRenderer } from './engine/graphRenderer';
import { TopBar } from './components/hud/TopBar';
import { ListSwitcher, PortfolioViewMode } from './components/morph/ListSwitcher';
import { ExposureGridFeed } from './components/cctv/ExposureGridFeed';
import { IntentPanel } from './components/intent/IntentPanel';
import { PositionDetailModal } from './components/position/PositionDetailModal';
import { LiveTuner } from './components/hud/LiveTuner';
import { HelpModal } from './components/hud/HelpModal';
import { NansenModal } from './components/hud/NansenModal';
import { Toast } from './components/hud/Toast';
import { buildNansenSpatialGraph, buildNansenResearchSubgraph, PRESET_ENTITIES } from './services/nansenApi';

export const App: React.FC = () => {
  // Application Data & State
  const [nodes, setNodes] = useState<CanvasNode[]>(() => {
    const saved = localStorage.getItem('aether_nodes_v1') || localStorage.getItem('phantomat_nodes_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved nodes', e);
      }
    }
    return INITIAL_NODES;
  });

  const [wires, setWires] = useState<WireConnection[]>(INITIAL_WIRES);
  const [config, setConfig] = useState<LensConfig>(() => {
    const saved = localStorage.getItem('aether_config_v1') || localStorage.getItem('phantomat_config_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.normalScale === 1.0) {
          parsed.normalScale = 0.76;
          parsed.overviewScale = 0.32;
        }
        return { ...DEFAULT_LENS_CONFIG, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
    return DEFAULT_LENS_CONFIG;
  });

  const [highlightNodeIds, setHighlightNodeIds] = useState<string[]>([]);
  const [focusedNodeId, setFocusedNodeId] = useState<string>(nodes[0]?.id || 'wallet-ledger');
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [viewMode, setViewMode] = useState<PortfolioViewMode>('canvas');
  const [isOverview, setIsOverview] = useState(false);
  const [isIntentOpen, setIsIntentOpen] = useState(false);
  const [isNansenOpen, setIsNansenOpen] = useState(false);
  const [isTunerOpen, setIsTunerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSimulatingRoute, setIsSimulatingRoute] = useState(false);

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

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Save state persistence
  useEffect(() => {
    localStorage.setItem('aether_nodes_v1', JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem('aether_config_v1', JSON.stringify(config));
  }, [config]);

  const recordHistory = useCallback(() => {
    historyRef.current.push(JSON.stringify(nodes));
    if (historyRef.current.length > 20) historyRef.current.shift();
  }, [nodes]);

  // Focus node and fly camera
  const focusNode = useCallback((nodeId: string, flyTo = true) => {
    setFocusedNodeId(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && flyTo) {
      cameraRef.current.flyTo(node.x + node.w / 2, node.y + node.h / 2);
    }
  }, [nodes]);

  // Load Nansen Entity & Build Dynamic Spatial Graph
  const handleLoadNansenEntity = useCallback(async (entity: typeof PRESET_ENTITIES[0]) => {
    recordHistory();
    showToast(`Indexing on-chain data for ${entity.label}...`);
    try {
      const { nodes: newNodes, wires: newWires } = await buildNansenSpatialGraph(entity);
      if (newNodes.length > 0) {
        setNodes(newNodes);
        setWires(newWires);
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

  // Smart Arrange algorithm by Chain / Risk cluster
  const handleSmartArrange = useCallback(() => {
    recordHistory();
    showToast('Smart arranged nodes into Chain Clusters (Ctrl+A)');

    const clusters: Record<string, CanvasNode[]> = {};
    nodes.forEach(node => {
      const key = node.chain;
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(node);
    });

    const newNodes = [...nodes];
    const chainKeys = Object.keys(clusters);
    const colGap = 480;
    const rowGap = 320;
    const startX = -((chainKeys.length - 1) * colGap) / 2;

    chainKeys.forEach((chain, colIdx) => {
      const chainNodes = clusters[chain];
      const startY = -((chainNodes.length - 1) * rowGap) / 2;
      chainNodes.forEach((node, rowIdx) => {
        const found = newNodes.find(n => n.id === node.id);
        if (found) {
          found.x = startX + colIdx * colGap;
          found.y = startY + rowIdx * rowGap;
        }
      });
    });

    setNodes([...newNodes]);
  }, [nodes, recordHistory, showToast]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length > 0) {
      const prev = historyRef.current.pop();
      if (prev) {
        setNodes(JSON.parse(prev));
        showToast('Undo layout change (Ctrl+Z)');
      }
    }
  }, [showToast]);

  // Toggle Overview & Intent
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

  const handleFocusNode = useCallback((node: CanvasNode, openDetail = false) => {
    focusNode(node.id, true);
    cameraRef.current.state.isOverview = false;
    setIsOverview(false);
    setIsIntentOpen(false);
    if (openDetail) {
      setSelectedNode(node);
    }
  }, [focusNode]);

  // Filter high-risk positions
  const handleFilterRisk = useCallback(() => {
    const criticalNodes = nodes.filter(n => n.riskLevel === 'critical' || n.riskLevel === 'high');
    const ids = criticalNodes.map(n => n.id);
    setHighlightNodeIds(ids);
    toggleOverviewMode(true);
    showToast(`Spotlighting ${criticalNodes.length} High-Risk Positions`);
  }, [nodes, toggleOverviewMode, showToast]);

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

  // Handle Kill Switch
  const handleKillSwitch = useCallback((node: CanvasNode, route: PositionExitRoute) => {
    showToast(`KILL SWITCH ACTIVATED: Unwound ${node.title} -> ${route.targetAsset}`);
    setNodes(prev => prev.map(n => {
      if (n.id === node.id) {
        return {
          ...n,
          riskLevel: 'safe',
          title: `${n.title} (Unwound & Safe)`,
          pnl24hUsd: 0,
          healthFactor: 99.9,
          debtRatioPct: 0,
          borrowDebtUsd: 0
        };
      }
      return n;
    }));
  }, [showToast]);

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

      // Cmd+K / SUPER+CTRL+G / / -> Toggle Intent
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') ||
        e.key === '/'
      ) {
        e.preventDefault();
        toggleOverviewMode();
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

      // Escape -> Dismiss panels / reset camera
      if (e.key === 'Escape') {
        setIsIntentOpen(false);
        setIsNansenOpen(false);
        setIsTunerOpen(false);
        setIsHelpOpen(false);
        setSelectedNode(null);
        setHighlightNodeIds([]);
        if (cameraRef.current.state.isOverview) {
          toggleOverviewMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    nodes,
    focusedNodeId,
    toggleOverviewMode,
    handleSmartArrange,
    handleUndo,
    handleToggleFill,
    handleTogglePin,
    handleNudge,
    handleFocusNearest
  ]);

  // WebGL & Render Loop
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

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const w = offscreen.width;
      const h = offscreen.height;

      // Update camera physics
      cameraRef.current.update(dt, config.cameraSpeed);

      // Render 2D scene onto offscreen canvas
      const ctx = offscreen.getContext('2d');
      if (ctx) {
        graphRendererRef.current.renderScene(
          ctx,
          w,
          h,
          cameraRef.current,
          nodes,
          wires,
          config,
          dt,
          highlightNodeIds,
          focusedNodeId,
          isSimulatingRoute
        );
      }

      // WebGL Shader Pass
      shaderPipelineRef.current.render(
        offscreen,
        canvas.width,
        canvas.height,
        config,
        cameraRef.current.state.transitionProgress
      );

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [nodes, wires, config, highlightNodeIds, focusedNodeId, isSimulatingRoute]);

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
        recordHistory();
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

        if (e.detail === 2 || node.type === 'position') {
          setSelectedNode(node);
        }

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

    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const offscreen = offscreenCanvasRef.current;
    if (!offscreen) return;

    if (isDraggingNodeRef.current && draggedNodeRef.current) {
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

  const handleMouseUp = () => {
    isDraggingNodeRef.current = false;
    draggedNodeRef.current = null;
    isPanningRef.current = false;
    isMinimapDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
    const nextScale = Math.max(0.18, Math.min(2.5, cameraRef.current.state.targetScale * zoomFactor));
    cameraRef.current.state.targetScale = nextScale;

    if (nextScale < 0.45 && !cameraRef.current.state.isOverview) {
      setIsOverview(true);
      cameraRef.current.state.isOverview = true;
    } else if (nextScale >= 0.75 && cameraRef.current.state.isOverview) {
      setIsOverview(false);
      cameraRef.current.state.isOverview = false;
    }
  };

  // Dynamic calculations
  const totalValue = nodes.reduce((sum, n) => sum + n.valueUsd, 0);
  const totalPnl = nodes.reduce((sum, n) => sum + (n.pnl24hUsd || 0), 0);
  const pnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;
  const criticalCount = nodes.filter(n => n.riskLevel === 'critical' || n.riskLevel === 'high').length;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] font-mono text-slate-200 select-none">
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* Screen 1: Top Bar & Portfolio Exposure HUD */}
      <TopBar
        config={config}
        nodes={nodes}
        isOverview={isOverview}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onToggleOverview={() => toggleOverviewMode()}
        onSmartArrange={handleSmartArrange}
        onOpenNansen={() => setIsNansenOpen(true)}
        onOpenTuner={() => setIsTunerOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onFilterRisk={handleFilterRisk}
      />

      {/* Morph UI: List Switcher (Dense Table List View) */}
      {viewMode === 'list' && (
        <ListSwitcher
          nodes={nodes}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onFocusNodeOnCanvas={(node) => {
            setViewMode('canvas');
            handleFocusNode(node, false);
          }}
          onInspectNode={(node) => setSelectedNode(node)}
          onEmergencyKill={handleKillSwitch}
        />
      )}

      {/* CCTV Surveillance: SolaceUI Exposure Grid Mode */}
      {viewMode === 'exposure-grid' && (
        <ExposureGridFeed
          nodes={nodes}
          onInspectNode={(node) => setSelectedNode(node)}
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
        onClose={() => toggleOverviewMode(false)}
        nodes={nodes}
        intentPresets={INTENT_PRESETS}
        onSelectNode={(node) => handleFocusNode(node, true)}
        onHighlightNodes={setHighlightNodeIds}
        onExecuteRoute={handleExecuteRoute}
        onApplyDynamicResearchGraph={handleApplyDynamicResearchGraph}
      />

      {/* Screen 3: Position Detail Deep Focus & 1-Click Kill Switch */}
      <PositionDetailModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onKillSwitch={handleKillSwitch}
      />

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
        onClose={() => setIsNansenOpen(false)}
        onLoadEntity={handleLoadNansenEntity}
        onShowToast={showToast}
      />

      {/* Help & Shortcuts Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Status Toast */}
      <Toast message={toastMessage} />

      {/* Corner HUD coordinates & camera state readout */}
      <div className="absolute bottom-5 left-6 font-mono text-[10px] text-slate-500 tracking-wider pointer-events-none flex flex-col gap-1 drop-shadow">
        <span>CAM_POS: [X: {Math.round(cameraRef.current?.state.x || 0)}, Y: {Math.round(cameraRef.current?.state.y || 0)}]</span>
        <span>ZOOM_SCALE: {(cameraRef.current?.state.scale || 1.0).toFixed(2)}x &bull; NODES: {nodes.length} &bull; WIRES: {wires.length}</span>
        <span className="text-amber-500 font-bold">⌘K INTENT ENGINE &bull; ^A ARRANGE &bull; TAB VIEW SWITCH</span>
      </div>
    </div>
  );
};
