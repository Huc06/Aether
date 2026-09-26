/**
 * 3D Perspective Page / Panel Bend Shader Engine (WebGL2 + Canvas2D DomRaster)
 * Folds the top and bottom of scrollable views over a virtual 3D perspective arc
 */

import { createDomRaster, type DomRaster } from "./domRaster";
import { createRectCache } from "./rectCache";

export interface BendOptions {
  zone?: number;
  angle?: number;
  rounding?: number;
  perspective?: number;
  direction?: "out" | "in";
  ease?: number;
  smoothing?: number;
  top?: boolean;
  bottom?: boolean;
  tumble?: number;
  tilt?: number;
}

export interface BendElements {
  source: HTMLCanvasElement;
  content: HTMLElement;
  output: HTMLCanvasElement;
}

export interface BendInstance {
  setOptions: (options: BendOptions) => void;
  resize: () => void;
  destroy: () => void;
}

const DEFAULTS: Required<BendOptions> = {
  zone: 200,
  angle: 75,
  rounding: 130,
  perspective: 700,
  direction: "in",
  ease: 200,
  smoothing: 0.1,
  top: true,
  bottom: true,
  tumble: 0.4,
  tilt: 0.4,
};

const VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main () {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uContent;
uniform float uZone;
uniform float uAngle;
uniform float uPersp;
uniform float uDir;
uniform float uTopAmt;
uniform float uBotAmt;
uniform float uMaxX;
uniform float uPxY;
uniform float uPxX;
uniform float uCover;
uniform vec3 uBg;
uniform float uTiltX;
uniform float uTiltY;
uniform float uPhi;
uniform float uRound;

vec3 foldEdge (float sy, float amt) {
  float yf = 1.0 - uZone;
  if (amt < 1e-4) return vec3(sy, 0.0, 1.0);
  float theta = uAngle * amt;
  if (uRound < 1e-4) {
    float s = sin(theta) * uDir;
    float c = cos(theta);
    float denom = max(c * uPersp + s * (0.5 - sy), 1e-5);
    float tRaw = uPersp * (sy - yf) / denom;
    float t = clamp(tRaw, 0.0, uZone);
    float z = max(t * s, -0.85 * uPersp);
    float alpha = 1.0 - smoothstep(uZone, uZone + 2.0 * uPxY, tRaw);
    return vec3(yf + t, z, alpha);
  }
  if (sy <= yf) return vec3(sy, 0.0, 1.0);
  float R = min(uRound, uZone);
  float r = R / theta;
  float ca = cos(theta);
  float sa = sin(theta);
  float yA = r * sa;
  float zA = r * (1.0 - ca);
  float prevSy = yf;
  float prevZ = 0.0;
  float prevU = 0.0;
  float bestU = -1.0;
  float bestZ = 0.0;
  float maxSy = yf;
  float du = uZone / 40.0;
  for (int i = 1; i <= 40; i++) {
    float u = du * float(i);
    float Y;
    float Zm;
    if (u <= R) {
      float a = u / r;
      Y = r * sin(a);
      Zm = r * (1.0 - cos(a));
    } else {
      Y = yA + (u - R) * ca;
      Zm = zA + (u - R) * sa;
    }
    Y += yf;
    float Z = max(Zm * uDir, -0.85 * uPersp);
    float scr = 0.5 + (Y - 0.5) * uPersp / (uPersp + Z);
    if ((prevSy - sy) * (scr - sy) <= 0.0 && abs(scr - prevSy) > 1e-7) {
      float f = clamp((sy - prevSy) / (scr - prevSy), 0.0, 1.0);
      bestU = mix(prevU, u, f);
      bestZ = mix(prevZ, Z, f);
      if (uDir > 0.0) break;
    }
    maxSy = max(maxSy, scr);
    prevSy = scr;
    prevZ = Z;
    prevU = u;
  }
  if (bestU < 0.0) {
    float alpha = 1.0 - smoothstep(maxSy - uPxY, maxSy + uPxY, sy);
    return vec3(1.0, prevZ, alpha);
  }
  return vec3(yf + bestU, bestZ, 1.0);
}

vec2 tipPlane (float sy, float phi) {
  float s = sin(phi);
  float c = cos(phi);
  float denom = max(c * uPersp + s * (sy - 0.5), 1e-4);
  float t = uPersp * (1.0 - sy) / denom;
  return vec2(1.0 - t, t * s);
}

void main () {
  vec2 uv = vUv;
  float cx = uMaxX * 0.5;
  float zSum = 0.0;

  if (abs(uPhi) > 1e-4) {
    if (uPhi > 0.0) {
      vec2 r = tipPlane(uv.y, uPhi);
      uv.y = r.x;
      zSum += r.y;
    } else {
      vec2 r = tipPlane(1.0 - uv.y, -uPhi);
      uv.y = 1.0 - r.x;
      zSum += r.y;
    }
  }

  float zG = uTiltX * (uv.x - cx) + uTiltY * (uv.y - 0.5);
  zSum += zG;
  uv.y = 0.5 + (uv.y - 0.5) * (uPersp + zG) / uPersp;

  float inTop = step(1.0 - uZone, uv.y);
  float inBot = step(uv.y, uZone);

  vec3 top = foldEdge(uv.y, uTopAmt);
  vec3 bot = foldEdge(1.0 - uv.y, uBotAmt);

  float srcY = uv.y;
  srcY = mix(srcY, top.x, inTop);
  srcY = mix(srcY, 1.0 - bot.x, inBot);

  zSum += inTop * top.y + inBot * bot.y;
  float alpha = mix(1.0, top.z, inTop) * mix(1.0, bot.z, inBot);

  float srcX = cx + (uv.x - cx) * (uPersp + zSum) / uPersp;

  alpha *= smoothstep(-2.0 * uPxX, 0.0, srcX);
  alpha *= 1.0 - smoothstep(uMaxX, uMaxX + 2.0 * uPxX, srcX);
  alpha *= smoothstep(-2.0 * uPxY, 0.0, srcY);
  alpha *= 1.0 - smoothstep(1.0, 1.0 + 2.0 * uPxY, srcY);

  vec2 p = vec2(
    clamp(srcX, 0.0005, uMaxX - 0.0005),
    clamp(srcY, 0.0005, 0.9995)
  );
  vec4 base = texture(uContent, vec2(p.x, 1.0 - p.y));

  outColor = vec4(mix(uBg, base.rgb, alpha * base.a), uCover);
}`;

export function createBend(
  elements: BendElements,
  options: BendOptions = {},
): BendInstance | null {
  const config = { ...DEFAULTS, ...options };
  const { content, output } = elements;

  const gl = output.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
  });
  if (!gl || gl.isContextLost()) return null;

  let contentDirty = false;

  function compile(type: number, text: string): WebGLShader {
    const shader = gl!.createShader(type)!;
    gl!.shaderSource(shader, text);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      console.error("Bend shader error:", gl!.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vertexShader = compile(gl.VERTEX_SHADER, VERT);
  const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const uniforms: Record<string, WebGLUniformLocation> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)!;
    uniforms[info.name] = gl.getUniformLocation(program, info.name)!;
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const contentTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, contentTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );
  gl.generateMipmap(gl.TEXTURE_2D);

  let contentMaxX = 1;
  let bg: [number, number, number] = [0.03, 0.04, 0.06];
  let bgCss = "#07090e";

  function syncBgColor() {
    let el: Element | null = content;
    while (el) {
      const css = getComputedStyle(el).backgroundColor;
      if (css && css !== "transparent" && !css.includes("rgba(0, 0, 0, 0)")) {
        bgCss = css;
        break;
      }
      el = el.parentElement;
    }
  }

  function syncCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(output.clientWidth * dpr));
    const height = Math.max(1, Math.round(output.clientHeight * dpr));
    if (output.width !== width || output.height !== height) {
      output.width = width;
      output.height = height;
    }
    contentMaxX = Math.min(
      1,
      Math.max(0.05, content.clientWidth / Math.max(output.clientWidth, 1)),
    );
    contentDirty = true;
  }

  let scrollable = false;
  let topTarget = 0;
  let bottomTarget = 0;
  let topCurrent = 0;
  let bottomCurrent = 0;
  let over = 0;
  let phiCurrent = 0;
  let tiltXTarget = 0;
  let tiltYTarget = 0;
  let tiltXCurrent = 0;
  let tiltYCurrent = 0;

  function syncScroll() {
    const max = content.scrollHeight - content.clientHeight;
    const t = content.scrollTop;
    scrollable = max > 1;
    const e = Math.max(config.ease, 1);
    const ramp = (v: number) => {
      const x = Math.min(Math.max(v / e, 0), 1);
      return x * x * (3 - 2 * x);
    };
    topTarget = max > 1 && config.top ? ramp(t) : 0;
    bottomTarget = max > 1 && config.bottom ? ramp(max - t) : 0;
  }

  syncCanvasSize();
  syncScroll();
  syncBgColor();

  const rasterReady = () => {
    contentDirty = true;
    start();
  };

  let raster: DomRaster | null = createDomRaster(content, bgCss, rasterReady);
  let rasterBg = bgCss;
  let covered = false;

  function upload(from: TexImageSource) {
    gl!.bindTexture(gl!.TEXTURE_2D, contentTexture);
    gl!.texImage2D(
      gl!.TEXTURE_2D,
      0,
      gl!.RGBA,
      gl!.RGBA,
      gl!.UNSIGNED_BYTE,
      from,
    );
    gl!.generateMipmap(gl!.TEXTURE_2D);
  }

  function uploadContent(engaged: boolean) {
    if (!raster || !engaged) {
      contentDirty = false;
      return;
    }
    contentDirty = false;
    syncBgColor();
    if (bgCss !== rasterBg) {
      raster = createDomRaster(content, bgCss, rasterReady);
      rasterBg = bgCss;
      if (!raster) return;
    }
    if (!raster.paint(Math.min(window.devicePixelRatio || 1, 2))) return;
    upload(raster.canvas);
  }

  function setCovered(next: boolean) {
    if (next === covered) return;
    covered = next;
    content.style.opacity = next ? "0" : "";
  }

  function render() {
    const engaged =
      raster !== null &&
      scrollable &&
      (topCurrent > 1e-2 ||
        bottomCurrent > 1e-2 ||
        phiCurrent !== 0 ||
        tiltXCurrent !== 0 ||
        tiltYCurrent !== 0);

    setCovered(engaged);
    uploadContent(engaged);

    const h = Math.max(output.clientHeight, 1);
    const w = Math.max(output.clientWidth, 1);
    const zoneFrac = Math.min(Math.max(config.zone, 8) / h, 0.49);

    gl!.useProgram(program);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, contentTexture);
    gl!.uniform1i(uniforms.uContent, 0);
    gl!.uniform1f(uniforms.uZone, zoneFrac);
    gl!.uniform1f(
      uniforms.uAngle,
      Math.min(Math.max(config.angle, 1), 160) * (Math.PI / 180),
    );
    gl!.uniform1f(uniforms.uPersp, Math.max(config.perspective, 50) / h);
    gl!.uniform1f(uniforms.uDir, config.direction === "in" ? -1 : 1);
    gl!.uniform1f(uniforms.uTopAmt, topCurrent);
    gl!.uniform1f(uniforms.uBotAmt, bottomCurrent);
    gl!.uniform1f(uniforms.uMaxX, contentMaxX);
    gl!.uniform1f(uniforms.uPxY, 1.5 / h);
    gl!.uniform1f(uniforms.uPxX, 1.5 / w);
    gl!.uniform1f(uniforms.uCover, covered ? 1 : 0);
    gl!.uniform3f(uniforms.uBg, bg[0], bg[1], bg[2]);
    gl!.uniform1f(uniforms.uTiltX, tiltXCurrent);
    gl!.uniform1f(uniforms.uTiltY, tiltYCurrent);
    gl!.uniform1f(uniforms.uPhi, phiCurrent);
    gl!.uniform1f(
      uniforms.uRound,
      Math.min(Math.max(config.rounding, 0) / h, zoneFrac),
    );
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, output.width, output.height);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  let raf = 0;
  let lastTime = performance.now();
  let destroyed = false;
  let running = false;
  let visible = true;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  function frame(now: number) {
    if (destroyed) return;
    if (!visible) {
      running = false;
      return;
    }
    const delta = Math.min((now - lastTime) / 1000, 1 / 30);
    lastTime = now;
    const tau = config.smoothing;
    const k =
      reducedMotion || tau <= 0
        ? 1
        : 1 - Math.exp(-delta / Math.max(tau, 1e-4));
    topCurrent += (topTarget - topCurrent) * k;
    bottomCurrent += (bottomTarget - bottomCurrent) * k;
    if (Math.abs(topTarget - topCurrent) < 0.001) topCurrent = topTarget;
    if (Math.abs(bottomTarget - bottomCurrent) < 0.001)
      bottomCurrent = bottomTarget;

    over *= Math.exp(-delta / 0.22);
    if (Math.abs(over) < 0.5) over = 0;
    const phiTarget =
      reducedMotion || config.tumble <= 0
        ? 0
        : Math.tanh(over / 500) * 0.4 * Math.min(config.tumble, 1);
    phiCurrent += (phiTarget - phiCurrent) * Math.min(delta / 0.09, 1);
    if (phiTarget === 0 && Math.abs(phiCurrent) < 1e-4) phiCurrent = 0;

    if (reducedMotion || config.tilt <= 0) {
      tiltXTarget = 0;
      tiltYTarget = 0;
    }
    const kT = Math.min(delta / 0.15, 1);
    tiltXCurrent += (tiltXTarget - tiltXCurrent) * kT;
    tiltYCurrent += (tiltYTarget - tiltYCurrent) * kT;
    if (Math.abs(tiltXTarget - tiltXCurrent) < 1e-4) tiltXCurrent = tiltXTarget;
    if (Math.abs(tiltYTarget - tiltYCurrent) < 1e-4) tiltYCurrent = tiltYTarget;

    render();
    if (
      !contentDirty &&
      topCurrent === topTarget &&
      bottomCurrent === bottomTarget &&
      over === 0 &&
      phiCurrent === 0 &&
      tiltXCurrent === tiltXTarget &&
      tiltYCurrent === tiltYTarget
    ) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running || !visible) return;
    running = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(frame);
  }

  start();

  function onScroll() {
    syncScroll();
    contentDirty = true;
    start();
  }
  content.addEventListener("scroll", onScroll, { passive: true });

  function onWheel(event: WheelEvent) {
    if (config.tumble <= 0 || reducedMotion) return;
    if (!scrollable) return;
    const max = content.scrollHeight - content.clientHeight;
    if (max <= 1) return;
    const st = content.scrollTop;
    if (event.deltaY > 0 && st >= max - 1) {
      over = Math.min(over + event.deltaY, 900);
    } else if (event.deltaY < 0 && st <= 1) {
      over = Math.max(over + event.deltaY, -900);
    } else {
      return;
    }
    start();
  }
  content.addEventListener("wheel", onWheel as EventListener, { passive: true });

  const rectCache = createRectCache(output);

  function onPointerMove(event: PointerEvent) {
    if (!event.isPrimary) return;
    if (config.tilt > 0 && !reducedMotion && scrollable) {
      const rect = rectCache.current;
      if (rect.width > 0 && rect.height > 0) {
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = 0.5 - (event.clientY - rect.top) / rect.height;
        const amp = Math.min(config.tilt, 1) * 0.14;
        tiltXTarget = -nx * amp;
        tiltYTarget = -ny * amp;
        start();
      }
    }
  }
  content.addEventListener("pointermove", onPointerMove as EventListener, { passive: true });

  function onPointerLeave() {
    tiltXTarget = 0;
    tiltYTarget = 0;
    start();
  }
  content.addEventListener("pointerleave", onPointerLeave as EventListener);

  function onMotionChange() {
    reducedMotion = motionQuery.matches;
    start();
  }
  motionQuery.addEventListener("change", onMotionChange);

  const observer = new ResizeObserver(() => {
    syncCanvasSize();
    syncScroll();
    start();
  });
  observer.observe(output);
  observer.observe(content);

  const intersection = new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1]?.isIntersecting ?? true;
    if (visible) start();
  });
  intersection.observe(output);

  return {
    setOptions(next) {
      Object.assign(config, next);
      syncScroll();
      start();
    },
    resize() {
      syncCanvasSize();
      syncScroll();
      start();
    },
    destroy() {
      destroyed = true;
      rectCache.destroy();
      cancelAnimationFrame(raf);
      content.removeEventListener("scroll", onScroll);
      content.removeEventListener("wheel", onWheel as EventListener);
      content.removeEventListener("pointermove", onPointerMove as EventListener);
      content.removeEventListener("pointerleave", onPointerLeave as EventListener);
      observer.disconnect();
      intersection.disconnect();
      content.style.opacity = "";
      motionQuery.removeEventListener("change", onMotionChange);
      gl!.deleteTexture(contentTexture);
      gl!.deleteProgram(program);
      gl!.deleteShader(vertexShader);
      gl!.deleteShader(fragmentShader);
      gl!.deleteBuffer(quad);
    },
  };
}
