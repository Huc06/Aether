import { CanvasNode, WireConnection, LensConfig } from '../types';
import { CameraController } from './camera';

export class GraphRenderer {
  private particleTime = 0;

  renderScene(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: CameraController,
    nodes: CanvasNode[],
    wires: WireConnection[],
    config: LensConfig,
    dt: number,
    highlightIds: string[] = [],
    selectedNodeId: string | null = null,
    isSimulating = false
  ) {
    this.particleTime += dt * (isSimulating ? 3.5 : 1.0);

    // Clear background
    ctx.fillStyle = '#07090e';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    this.drawGrid(ctx, width, height, camera, config);

    // Draw Connection Wires with flowing particles
    this.drawWires(ctx, width, height, camera, nodes, wires, config, highlightIds, isSimulating);

    // Draw Spatial Nodes & Windows
    this.drawNodes(ctx, width, height, camera, nodes, config, highlightIds, selectedNodeId);

    // Draw Minimap
    this.drawMinimap(ctx, width, height, camera, nodes, config, selectedNodeId);
  }

  private drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: CameraController,
    config: LensConfig
  ) {
    ctx.save();
    const sc = camera.state.scale;
    const step = config.gridSpacing * sc;
    if (step < 8) {
      ctx.restore();
      return;
    }

    const offset = camera.worldToScreen(0, 0, width, height);
    const startX = (offset.x % step + step) % step;
    const startY = (offset.y % step + step) % step;

    const dotAlpha = Math.min(0.28, Math.max(0.04, (sc - 0.1) * 0.35));
    ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;

    const dotSize = Math.max(1.0, 1.8 * Math.min(1.0, sc));

    for (let x = startX; x < width; x += step) {
      for (let y = startY; y < height; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Canvas Origin Axis Crosshairs
    const origin = camera.worldToScreen(0, 0, width, height);
    if (origin.x >= 0 && origin.x <= width && origin.y >= 0 && origin.y <= height) {
      ctx.strokeStyle = `${config.accent}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(origin.x - 16, origin.y);
      ctx.lineTo(origin.x + 16, origin.y);
      ctx.moveTo(origin.x, origin.y - 16);
      ctx.lineTo(origin.x, origin.y + 16);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawWires(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: CameraController,
    nodes: CanvasNode[],
    wires: WireConnection[],
    config: LensConfig,
    highlightIds: string[],
    isSimulating: boolean
  ) {
    const sc = camera.state.scale;
    const nodeMap = new Map<string, CanvasNode>();
    nodes.forEach(n => nodeMap.set(n.id, n));

    wires.forEach(wire => {
      const fromNode = nodeMap.get(wire.fromId);
      const toNode = nodeMap.get(wire.toId);
      if (!fromNode || !toNode) return;

      const isHighlighted = highlightIds.length === 0 || highlightIds.includes(fromNode.id) || highlightIds.includes(toNode.id);

      const fromCenter = {
        x: fromNode.x + fromNode.w / 2,
        y: fromNode.y + fromNode.h / 2
      };
      const toCenter = {
        x: toNode.x + toNode.w / 2,
        y: toNode.y + toNode.h / 2
      };

      const p1 = camera.worldToScreen(fromCenter.x, fromCenter.y, width, height);
      const p2 = camera.worldToScreen(toCenter.x, toCenter.y, width, height);

      // Bezier curve calculation
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const cp1x = p1.x + dx * 0.5;
      const cp1y = p1.y;
      const cp2x = p1.x + dx * 0.5;
      const cp2y = p2.y;

      ctx.save();

      // Base Wire Glow
      const wireColor = wire.color || config.accent;
      ctx.strokeStyle = isHighlighted ? wireColor : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = (isHighlighted ? 2.5 : 1.0) * Math.max(0.5, sc);
      ctx.lineCap = 'round';

      if (isHighlighted) {
        ctx.shadowColor = wireColor;
        ctx.shadowBlur = 12 * sc;
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      ctx.stroke();

      // Flowing Energy Particles
      if (isHighlighted) {
        const numParticles = Math.max(3, Math.floor(dist / (80 * sc)));
        for (let i = 0; i < numParticles; i++) {
          const t = ((this.particleTime * 0.35 + i / numParticles) % 1.0);
          
          const u = 1 - t;
          const tt = t * t;
          const uu = u * u;
          const uuu = uu * u;
          const ttt = tt * t;

          const px = uuu * p1.x + 3 * uu * t * cp1x + 3 * u * tt * cp2x + ttt * p2.x;
          const py = uuu * p1.y + 3 * uu * t * cp1y + 3 * u * tt * cp2y + ttt * p2.y;

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = isSimulating ? '#4ade80' : wireColor;
          ctx.shadowBlur = (isSimulating ? 16 : 8) * sc;
          ctx.beginPath();
          ctx.arc(px, py, (isSimulating ? 4.5 : 2.5) * Math.max(0.6, sc), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Wire Label in medium/close zoom
      if (sc > 0.45 && wire.label && isHighlighted) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.font = `600 ${Math.max(8, Math.floor(10 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const padX = 8 * sc;
        const textW = ctx.measureText(wire.label).width;
        
        ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
        ctx.beginPath();
        ctx.roundRect(midX - textW / 2 - padX, midY - 10 * sc, textW + padX * 2, 20 * sc, 4 * sc);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();

        ctx.fillStyle = wireColor;
        ctx.fillText(wire.label, midX, midY);
      }

      ctx.restore();
    });
  }

  private drawNodes(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: CameraController,
    nodes: CanvasNode[],
    config: LensConfig,
    highlightIds: string[],
    selectedNodeId: string | null
  ) {
    const sc = camera.state.scale;

    nodes.forEach(node => {
      const pos = camera.worldToScreen(node.x, node.y, width, height);
      const sw = node.w * sc;
      const sh = node.h * sc;

      // Culling offscreen
      if (pos.x + sw < -50 || pos.x > width + 50 || pos.y + sh < -50 || pos.y > height + 50) {
        return;
      }

      const isSelected = node.id === selectedNodeId;
      const isHighlighted = highlightIds.length === 0 || highlightIds.includes(node.id);
      const alphaMultiplier = isHighlighted ? 1.0 : 0.25;

      ctx.save();
      ctx.globalAlpha = alphaMultiplier;

      // Risk-based color identification
      let riskColor = config.accent;
      if (node.riskLevel === 'critical') riskColor = '#ef4444';
      else if (node.riskLevel === 'high') riskColor = '#f97316';
      else if (node.riskLevel === 'medium') riskColor = '#f59e0b';
      else riskColor = '#10b981';

      // Card Shadow / Glow
      if (isSelected || node.riskLevel === 'critical') {
        ctx.shadowColor = isSelected ? config.accent : riskColor;
        ctx.shadowBlur = (isSelected ? 30 : 20) * sc;
        ctx.shadowOffsetY = 4 * sc;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = 14 * sc;
        ctx.shadowOffsetY = 6 * sc;
      }

      // Card Background (Glass dark)
      const radius = 10 * sc;
      ctx.fillStyle = isSelected ? 'rgba(18, 24, 38, 0.95)' : 'rgba(10, 14, 22, 0.90)';
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, sw, sh, radius);
      ctx.fill();

      // Card Border
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = isSelected ? 2.5 : (node.riskLevel === 'critical' ? 2.0 : 1.2);
      ctx.strokeStyle = isSelected ? config.accent : (node.riskLevel === 'critical' ? '#ef4444' : 'rgba(255, 255, 255, 0.14)');
      ctx.stroke();

      // Title Bar Header
      const headerH = 34 * sc;
      ctx.fillStyle = isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 21, 32, 0.9)';
      ctx.beginPath();
      ctx.roundRect(pos.x, pos.y, sw, headerH, [radius, radius, 0, 0]);
      ctx.fill();

      // Traffic Light status dots (Phantomat style close, fill, fullscreen)
      const dotPad = 12 * sc;
      const dotY = pos.y + headerH / 2;
      const dotR = 4 * sc;

      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(pos.x + dotPad, dotY, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.beginPath(); ctx.arc(pos.x + dotPad + 12 * sc, dotY, dotR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(pos.x + dotPad + 24 * sc, dotY, dotR, 0, Math.PI * 2); ctx.fill();

      // Header Title & Clean Monospace Text
      const headerFontSize = Math.max(9, Math.floor(12 * sc));
      ctx.font = `700 ${headerFontSize}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = isSelected ? '#ffffff' : '#e2e8f0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.title, pos.x + dotPad + 38 * sc, dotY);

      // Pinned indicator
      if (node.isPinned) {
        ctx.font = `700 ${Math.max(7, Math.floor(8 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = config.accent;
        ctx.fillText('[PIN]', pos.x + sw - 120 * sc, dotY);
      }

      // Chain / Category Badge
      if (sc > 0.28) {
        ctx.font = `700 ${Math.max(7, Math.floor(9 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = riskColor;
        ctx.textAlign = 'right';
        ctx.fillText(`[${node.chain.toUpperCase()} // ${node.category.toUpperCase()}]`, pos.x + sw - 12 * sc, dotY);
      }

      // Card Content Body Clip
      const bodyY = pos.y + headerH;
      const bodyH = sh - headerH;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pos.x, bodyY, sw, bodyH);
      ctx.clip();

      this.drawDeFiContent(ctx, node, pos.x, bodyY, sw, bodyH, sc, riskColor, isSelected);

      ctx.restore();

      // Macro Label in overview mode
      if (camera.state.isOverview || camera.state.transitionProgress > 0.3) {
        const badgeAlpha = Math.min(1.0, (camera.state.transitionProgress - 0.2) / 0.6);
        ctx.fillStyle = `rgba(10, 14, 22, ${0.92 * badgeAlpha})`;
        ctx.strokeStyle = isSelected ? config.accent : `rgba(255, 255, 255, ${0.25 * badgeAlpha})`;
        ctx.lineWidth = 1;

        const badgeW = 220 * sc;
        const badgeH = 26 * sc;
        const badgeX = pos.x + (sw - badgeW) / 2;
        const badgeY = pos.y - badgeH - 8 * sc;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4 * sc);
        ctx.fill();
        ctx.stroke();

        ctx.font = `800 ${Math.max(8, Math.floor(11 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = isSelected ? config.accent : `rgba(255, 255, 255, ${0.9 * badgeAlpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${node.app.toUpperCase()}`, badgeX + badgeW / 2, badgeY + badgeH / 2);
      }

      ctx.restore();
    });
  }

  private drawDeFiContent(
    ctx: CanvasRenderingContext2D,
    node: CanvasNode,
    x: number,
    y: number,
    w: number,
    h: number,
    sc: number,
    riskColor: string,
    isSelected: boolean
  ) {
    const pad = 14 * sc;

    // Primary Value Metric
    ctx.font = `800 ${Math.max(12, Math.floor(20 * sc))}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`$${node.valueUsd.toLocaleString()}`, x + pad, y + pad);

    // 24h PnL tag
    if (node.pnl24hUsd !== undefined) {
      const pnlIsPos = node.pnl24hUsd >= 0;
      ctx.font = `700 ${Math.max(8, Math.floor(11 * sc))}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = pnlIsPos ? '#4ade80' : '#f87171';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${pnlIsPos ? '+' : ''}$${Math.abs(node.pnl24hUsd).toLocaleString()} (${pnlIsPos ? '+' : ''}${node.pnlPercent}%)`,
        x + w - pad,
        y + pad + 2 * sc
      );
    }

    // Metrics Grid / Key-Values
    let lineY = y + pad + 32 * sc;
    const rowH = 20 * sc;

    if (node.type === 'position') {
      if (node.apy !== undefined) {
        ctx.font = `600 ${Math.max(8, Math.floor(10 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText('Net Yield (APY):', x + pad, lineY);
        ctx.fillStyle = '#4ade80';
        ctx.textAlign = 'right';
        ctx.fillText(`${node.apy}%`, x + w - pad, lineY);
        lineY += rowH;
      }

      if (node.healthFactor !== undefined) {
        ctx.font = `600 ${Math.max(8, Math.floor(10 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText('Health Factor:', x + pad, lineY);
        ctx.fillStyle = riskColor;
        ctx.textAlign = 'right';
        ctx.fillText(`${node.healthFactor.toFixed(2)} [${node.riskLevel.toUpperCase()}]`, x + w - pad, lineY);
        lineY += rowH;
      }

      if (node.liquidationDistancePct !== undefined) {
        ctx.font = `600 ${Math.max(8, Math.floor(10 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'left';
        ctx.fillText('Liq Distance:', x + pad, lineY);
        ctx.fillStyle = node.liquidationDistancePct < 15 ? '#ef4444' : '#cbd5e1';
        ctx.textAlign = 'right';
        ctx.fillText(`-${node.liquidationDistancePct.toFixed(1)}%`, x + w - pad, lineY);
        lineY += rowH;
      }

      if (node.collateralAsset && sc > 0.4) {
        ctx.font = `500 ${Math.max(7, Math.floor(9 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(`Collateral: ${node.collateralAsset}`, x + pad, lineY);
        lineY += rowH;
      }

      // Nansen Smart Money Signal Indicator
      if (node.smartMoneyNetflow24h !== undefined && sc > 0.35) {
        const isPositive = node.smartMoneyNetflow24h >= 0;
        ctx.font = `700 ${Math.max(7, Math.floor(9 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = isPositive ? '#10b981' : '#f43f5e';
        ctx.textAlign = 'left';
        const smText = isPositive
          ? `[SM INFLOW: +$${Math.round(node.smartMoneyNetflow24h).toLocaleString()}${node.smartMoneyTraderCount ? ` (${node.smartMoneyTraderCount} traders)` : ''}]`
          : `[SM OUTFLOW: -$${Math.abs(Math.round(node.smartMoneyNetflow24h)).toLocaleString()}]`;
        ctx.fillText(smText, x + pad, lineY);
        lineY += rowH;
      }
    } else if (node.type === 'wallet') {
      ctx.font = `500 ${Math.max(8, Math.floor(10 * sc))}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'left';
      ctx.fillText('Status: Connected & Streaming', x + pad, lineY);
      lineY += rowH;
      ctx.fillText(`Role: ${node.strategy || 'Treasury Vault'}`, x + pad, lineY);
      lineY += rowH;

      if (node.nansenLabel && sc > 0.35) {
        ctx.font = `700 ${Math.max(7, Math.floor(9 * sc))}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`[NANSEN] ${node.nansenLabel}`, x + pad, lineY);
        lineY += rowH;
      }
    }

    // Emergency Badge for Critical Nodes
    if (node.riskLevel === 'critical' && sc > 0.35) {
      const badgeW = w - pad * 2;
      const badgeH = 26 * sc;
      const badgeY = y + h - pad - badgeH;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + pad, badgeY, badgeW, badgeH, 4 * sc);
      ctx.fill();
      ctx.stroke();

      ctx.font = `800 ${Math.max(8, Math.floor(10 * sc))}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CRITICAL RISK // CLICK TO INSPECT EXIT', x + w / 2, badgeY + badgeH / 2);
    }
  }

  private drawMinimap(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camera: CameraController,
    nodes: CanvasNode[],
    config: LensConfig,
    selectedNodeId: string | null
  ) {
    if (config.minimapOpacity <= 0.05) return;

    const mapW = 230;
    const mapH = 145;
    const margin = 24;
    const mapX = width - mapW - margin;
    const mapY = height - mapH - margin;

    ctx.save();

    // Minimap Panel Background
    ctx.fillStyle = `rgba(10, 14, 22, ${config.minimapOpacity})`;
    ctx.strokeStyle = `rgba(255, 255, 255, 0.18)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mapX, mapY, mapW, mapH, 8);
    ctx.fill();
    ctx.stroke();

    // World bounds
    const minX = -1200, maxX = 1800, minY = -700, maxY = 1200;
    const worldW = maxX - minX;
    const worldH = maxY - minY;

    const worldToMini = (wx: number, wy: number) => ({
      x: mapX + ((wx - minX) / worldW) * mapW,
      y: mapY + ((wy - minY) / worldH) * mapH
    });

    // Draw Node Rects on Minimap
    nodes.forEach(node => {
      const p1 = worldToMini(node.x, node.y);
      const p2 = worldToMini(node.x + node.w, node.y + node.h);
      const mw = Math.max(4, p2.x - p1.x);
      const mh = Math.max(4, p2.y - p1.y);

      let color = node.id === selectedNodeId ? config.accent : 'rgba(148, 163, 184, 0.55)';
      if (node.riskLevel === 'critical') color = '#ef4444';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(p1.x, p1.y, mw, mh, 2);
      ctx.fill();

      if (node.id === selectedNodeId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Viewport Camera Rect
    const vTopLeft = camera.screenToWorld(0, 0, width, height);
    const vBottomRight = camera.screenToWorld(width, height, width, height);
    const vp1 = worldToMini(vTopLeft.x, vTopLeft.y);
    const vp2 = worldToMini(vBottomRight.x, vBottomRight.y);

    const vpW = Math.max(8, vp2.x - vp1.x);
    const vpH = Math.max(8, vp2.y - vp1.y);

    ctx.fillStyle = `rgba(${Math.floor(config.accentRgb[0] * 255)}, ${Math.floor(config.accentRgb[1] * 255)}, ${Math.floor(config.accentRgb[2] * 255)}, 0.15)`;
    ctx.strokeStyle = config.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(vp1.x, vp1.y, vpW, vpH, 3);
    ctx.fill();
    ctx.stroke();

    // 6-cell arrange button
    const btnSize = 20;
    const btnX = mapX + mapW - btnSize - 6;
    const btnY = mapY + 6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnSize, btnSize, 3);
    ctx.fill();

    ctx.fillStyle = config.accent;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        ctx.fillRect(btnX + 5 + c * 5.5, btnY + 4 + r * 4.5, 3.5, 3);
      }
    }

    ctx.font = "700 8px 'JetBrains Mono', monospace";
    ctx.fillStyle = '#64748b';
    ctx.fillText("RADAR // MINIMAP", mapX + 8, mapY + 15);

    ctx.restore();
  }
}
