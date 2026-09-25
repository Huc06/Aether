export interface CameraState {
  x: number;
  y: number;
  scale: number;
  targetX: number;
  targetY: number;
  targetScale: number;
  isOverview: boolean;
  transitionProgress: number; // 0 = detailed focus, 1 = macro overview
}

export class CameraController {
  state: CameraState = {
    x: 0,
    y: 0,
    scale: 0.76,
    targetX: 0,
    targetY: 0,
    targetScale: 0.76,
    isOverview: false,
    transitionProgress: 0.0
  };

  worldToScreen(wx: number, wy: number, screenW: number, screenH: number) {
    const cx = screenW / 2;
    const cy = screenH / 2;
    return {
      x: cx + (wx - this.state.x) * this.state.scale,
      y: cy + (wy - this.state.y) * this.state.scale
    };
  }

  screenToWorld(sx: number, sy: number, screenW: number, screenH: number) {
    const cx = screenW / 2;
    const cy = screenH / 2;
    return {
      x: this.state.x + (sx - cx) / this.state.scale,
      y: this.state.y + (sy - cy) / this.state.scale
    };
  }

  update(dt: number, cameraSpeed: number) {
    const ease = Math.min(1.0, dt * cameraSpeed);
    this.state.x += (this.state.targetX - this.state.x) * ease;
    this.state.y += (this.state.targetY - this.state.y) * ease;
    this.state.scale += (this.state.targetScale - this.state.scale) * ease;

    const targetProg = this.state.isOverview ? 1.0 : 0.0;
    this.state.transitionProgress += (targetProg - this.state.transitionProgress) * Math.min(1.0, dt * (cameraSpeed * 1.25));
  }

  flyTo(x: number, y: number, scale?: number) {
    this.state.targetX = x;
    this.state.targetY = y;
    if (scale !== undefined) {
      this.state.targetScale = scale;
    }
  }

  setOverview(enable: boolean, overviewScale: number, normalScale: number, centerX = 0, centerY = 0) {
    this.state.isOverview = enable;
    if (enable) {
      this.state.targetScale = overviewScale;
      this.state.targetX = centerX;
      this.state.targetY = centerY;
    } else {
      this.state.targetScale = normalScale;
    }
  }
}
