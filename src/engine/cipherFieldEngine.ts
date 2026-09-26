/**
 * 2D Canvas Cipher Field with Dynamic ASCII Matrix and CSS Mask Integration
 */

export interface CipherFieldOptions {
  radius?: number;
  softness?: number;
  cell?: number;
  aspect?: number;
  charset?: string;
  color?: string;
  opacity?: number;
  edgeWidth?: number;
  scramble?: number;
  scrambleSpeed?: number;
  smoothing?: number;
}

export interface CipherFieldElements {
  surface: HTMLCanvasElement;
  host: HTMLElement;
}

export interface CipherFieldInstance {
  setOptions: (options: CipherFieldOptions) => void;
  setPaused: (paused: boolean) => void;
  destroy: () => void;
}

const CHARSET = Array.from({ length: 94 }, (_, i) =>
  String.fromCharCode(33 + i),
).join("");

const DEFAULTS: Required<CipherFieldOptions> = {
  radius: 200,
  softness: 0.55,
  cell: 13,
  aspect: 0.6,
  charset: CHARSET,
  color: "#f59e0b",
  opacity: 0.75,
  edgeWidth: 0.22,
  scramble: 0.06,
  scrambleSpeed: 9,
  smoothing: 0.12,
};

const ALPHA_STEPS = 12;
const ATLAS_PAD = 2;

export function createCipherField(
  elements: CipherFieldElements,
  options: CipherFieldOptions = {},
): CipherFieldInstance | null {
  const { surface, host } = elements;
  const ctx = surface.getContext("2d", { alpha: true });
  if (!ctx) return null;

  let config = { ...DEFAULTS, ...options };

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  const atlas = document.createElement("canvas");
  const atlasCtx = atlas.getContext("2d");
  if (!atlasCtx) return null;

  let atlasCellW = 0;
  let atlasCellH = 0;
  let glyphs: string[] = [];

  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let field = new Uint8Array(0);
  let gridDirty = true;
  let atlasDirty = true;

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: 0, target: 0 };

  let lastTime = performance.now();
  let raf = 0;
  let running = false;
  let visible = true;
  let paused = false;
  let destroyed = false;

  function cellSize() {
    const h = Math.max(4, config.cell);
    return { w: h * config.aspect, h };
  }

  function buildAtlas() {
    const { w, h } = cellSize();
    glyphs = Array.from(new Set(Array.from(config.charset))).slice(0, 255);
    if (glyphs.length === 0) glyphs = Array.from(CHARSET);

    atlasCellW = Math.ceil((w + ATLAS_PAD * 2) * dpr);
    atlasCellH = Math.ceil((h + ATLAS_PAD * 2) * dpr);
    atlas.width = atlasCellW * glyphs.length;
    atlas.height = atlasCellH;

    atlasCtx!.clearRect(0, 0, atlas.width, atlas.height);
    atlasCtx!.textAlign = "center";
    atlasCtx!.textBaseline = "middle";
    atlasCtx!.fillStyle = config.color;
    atlasCtx!.font = `${h * dpr}px 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, monospace`;

    for (let i = 0; i < glyphs.length; i++) {
      atlasCtx!.fillText(
        glyphs[i]!,
        i * atlasCellW + atlasCellW / 2,
        atlasCellH / 2,
      );
    }
    atlasDirty = false;
  }

  function syncGrid() {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    const deviceW = Math.max(1, Math.round(width * nextDpr));
    const deviceH = Math.max(1, Math.round(height * nextDpr));

    if (nextDpr !== dpr) {
      dpr = nextDpr;
      atlasDirty = true;
    }
    if (surface.width !== deviceW || surface.height !== deviceH) {
      surface.width = deviceW;
      surface.height = deviceH;
    }

    const { w, h } = cellSize();
    const nextCols = Math.max(1, Math.ceil(width / w));
    const nextRows = Math.max(1, Math.ceil(height / h));
    if (nextCols !== cols || nextRows !== rows) {
      cols = nextCols;
      rows = nextRows;
      field = new Uint8Array(cols * rows);
      for (let i = 0; i < field.length; i++) {
        field[i] = Math.floor(Math.random() * 255);
      }
    }
    gridDirty = false;
  }

  function exposure(dx: number, dy: number) {
    if (pointer.active < 1e-3) return 0;
    const dist = Math.hypot(dx, dy);
    const outer = config.radius;
    const inner = outer * (1 - Math.min(Math.max(config.softness, 0), 1));
    if (dist >= outer) return 0;
    if (dist <= inner) return pointer.active;
    const t = (outer - dist) / Math.max(outer - inner, 1e-4);
    return pointer.active * t * t * (3 - 2 * t);
  }

  function render() {
    if (atlasDirty) buildAtlas();

    const { w, h } = cellSize();
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, surface.width / dpr, surface.height / dpr);

    const band = config.radius * config.edgeWidth;
    const inner = config.radius * (1 - Math.min(Math.max(config.softness, 0), 1));
    const glyphCount = glyphs.length;
    let alpha = -1;

    for (let row = 0; row < rows; row++) {
      const cy = row * h + h / 2;
      for (let col = 0; col < cols; col++) {
        const cx = col * w + w / 2;
        const clear = exposure(cx - pointer.x, cy - pointer.y);
        if (clear > 0.985) continue;

        const index = row * cols + col;
        let glyph = field[index]! % glyphCount;

        const dist = Math.hypot(cx - pointer.x, cy - pointer.y);
        const onEdge =
          pointer.active > 1e-3 && dist >= inner && dist <= inner + band;
        let boost = 0;
        if (onEdge && !reducedMotion) {
          glyph = Math.floor(Math.random() * glyphCount);
          boost = 0.28 * (1 - Math.abs(dist - inner - band / 2) / (band / 2 || 1));
        }

        const next =
          Math.round(
            (config.opacity * (1 - clear) + boost) * ALPHA_STEPS,
          ) / ALPHA_STEPS;
        if (next <= 0) continue;
        if (next !== alpha) {
          alpha = next;
          ctx!.globalAlpha = Math.min(alpha, 1);
        }

        ctx!.drawImage(
          atlas,
          glyph * atlasCellW,
          0,
          atlasCellW,
          atlasCellH,
          cx - (w / 2 + ATLAS_PAD),
          cy - (h / 2 + ATLAS_PAD),
          w + ATLAS_PAD * 2,
          h + ATLAS_PAD * 2,
        );
      }
    }
    ctx!.globalAlpha = 1;
  }

  function churn(delta: number) {
    if (reducedMotion || config.scramble <= 0 || config.scrambleSpeed <= 0) {
      return;
    }
    const count = Math.round(
      field.length * config.scramble * config.scrambleSpeed * delta,
    );
    for (let i = 0; i < count; i++) {
      field[Math.floor(Math.random() * field.length)] = Math.floor(
        Math.random() * 255,
      );
    }
  }

  function publish() {
    host.style.setProperty("--cipher-x", `${pointer.x}px`);
    host.style.setProperty("--cipher-y", `${pointer.y}px`);
    host.style.setProperty("--cipher-r", `${config.radius * pointer.active}px`);
    host.style.setProperty(
      "--cipher-r-inner",
      `${config.radius * (1 - config.softness) * pointer.active}px`,
    );
  }

  function frame(now: number) {
    if (destroyed) return;
    if (!visible || paused) {
      running = false;
      return;
    }

    const delta = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;

    if (gridDirty) syncGrid();

    const tau = Math.max(config.smoothing, 1e-4);
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta / tau);
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;
    pointer.active += (pointer.target - pointer.active) * k;

    churn(delta);
    publish();
    render();

    const settled =
      Math.abs(pointer.tx - pointer.x) < 0.25 &&
      Math.abs(pointer.ty - pointer.y) < 0.25 &&
      Math.abs(pointer.target - pointer.active) < 1e-3;
    const churning =
      !reducedMotion &&
      ((config.scramble > 0 && config.scrambleSpeed > 0) || pointer.active > 1e-3);

    if (settled && !churning) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
      pointer.active = pointer.target;
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running || !visible || paused) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  }

  function onPointerMove(event: PointerEvent) {
    const rect = host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (pointer.target === 0 && pointer.active < 1e-3) {
      pointer.x = x;
      pointer.y = y;
    }
    pointer.tx = x;
    pointer.ty = y;
    pointer.target = 1;
    start();
  }

  function onPointerLeave() {
    pointer.target = 0;
    start();
  }

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    start();
  }

  const resize = new ResizeObserver(() => {
    gridDirty = true;
    if (paused) {
      if (!destroyed && visible) render();
    } else {
      start();
    }
  });
  resize.observe(host);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (visible) start();
  });
  intersection.observe(host);

  host.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });
  host.addEventListener("pointerleave", onPointerLeave as EventListener, { passive: true });
  motionQuery.addEventListener("change", onMotionChange);

  syncGrid();
  publish();
  start();

  return {
    setOptions(next) {
      const previous = config;
      config = { ...config, ...next };
      if (
        previous.charset !== config.charset ||
        previous.color !== config.color ||
        previous.cell !== config.cell ||
        previous.aspect !== config.aspect
      ) {
        atlasDirty = true;
      }
      if (previous.cell !== config.cell || previous.aspect !== config.aspect) {
        gridDirty = true;
      }
      start();
    },
    setPaused(next) {
      if (paused === next) return;
      paused = next;
      if (paused) cancelAnimationFrame(raf);
      running = false;
      if (!paused) start();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      intersection.disconnect();
      host.removeEventListener("pointermove", onPointerMove as EventListener);
      host.removeEventListener("pointerleave", onPointerLeave as EventListener);
      motionQuery.removeEventListener("change", onMotionChange);
    },
  };
}
