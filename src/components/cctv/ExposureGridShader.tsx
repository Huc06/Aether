import React, { useEffect, useMemo, useRef } from 'react';

export type ExposureGridTreatment = 'chroma' | 'exposure' | 'monochrome';
export type ExposureGridColors = {
  grid: string;
  accent: string;
  secondary: string;
  ink: string;
  paper: string;
};

export type ExposureGridSettings = {
  treatment: ExposureGridTreatment;
  columns: number;
  rows: number;
  lineWidth: number;
  lineOpacity: number;
  activity: number;
  tempo: number;
  intensity: number;
  zoom: number;
  grain: number;
  interaction: number;
  colors: ExposureGridColors;
};

export const SOLACE_COLORS: ExposureGridColors = {
  grid: '#06b6d4',
  accent: '#f59e0b',
  secondary: '#38bdf8',
  ink: '#07090e',
  paper: '#0f172a',
};

export const SOLACE_SETTINGS: ExposureGridSettings = {
  treatment: 'chroma',
  columns: 3,
  rows: 3,
  lineWidth: 2.5,
  lineOpacity: 0.65,
  // Text-heavy camera frames: slow, low-amplitude sampling so the matrix reads
  // as surveillance optics instead of strobing.
  activity: 0.22,
  tempo: 0.16,
  intensity: 0.7,
  zoom: 0.22,
  grain: 0.16,
  interaction: 0.85,
  colors: SOLACE_COLORS,
};

const VERTEX = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_pointerStrength;
uniform float u_sourceAspect;
uniform float u_time;
uniform float u_columns;
uniform float u_rows;
uniform float u_lineWidth;
uniform float u_lineOpacity;
uniform float u_activity;
uniform float u_tempo;
uniform float u_intensity;
uniform float u_zoom;
uniform float u_grain;
uniform float u_interaction;
uniform int u_treatment;
uniform vec3 u_grid;
uniform vec3 u_accent;
uniform vec3 u_secondary;
uniform vec3 u_ink;
uniform vec3 u_paper;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 coverUv(vec2 uv) {
  float viewportAspect = u_resolution.x / max(u_resolution.y, 1.0);
  if (viewportAspect > u_sourceAspect) uv.y = 0.5 + (uv.y - 0.5) * (u_sourceAspect / viewportAspect);
  else uv.x = 0.5 + (uv.x - 0.5) * (viewportAspect / u_sourceAspect);
  return clamp(uv, 0.001, 0.999);
}

vec3 sourceAt(vec2 uv) {
  return texture(u_source, coverUv(uv)).rgb;
}

void main() {
  vec2 cells = vec2(max(u_columns, 1.0), max(u_rows, 1.0));
  vec2 cellSpace = v_uv * cells;
  vec2 cellId = floor(cellSpace);
  vec2 local = fract(cellSpace);
  vec2 center = (cellId + 0.5) / cells;
  float seed = hash(cellId + 3.17);
  float totalCells = cells.x * cells.y;
  float cellIndex = cellId.y * cells.x + cellId.x;
  
  float sequence = u_time * max(u_tempo, 0.0);
  float sequenceIndex = floor(sequence);
  float sequenceLife = fract(sequence);
  
  float primaryA = floor(hash(vec2(sequenceIndex + 0.71, 8.17)) * totalCells);
  float primaryB = floor(hash(vec2(sequenceIndex + 1.71, 8.17)) * totalCells);
  float primaryMatchA = 1.0 - step(0.1, abs(cellIndex - primaryA));
  float primaryMatchB = 1.0 - step(0.1, abs(cellIndex - primaryB));
  float handoff = smoothstep(0.72, 0.96, sequenceLife);
  float primaryPresence = mix(primaryMatchA, primaryMatchB, handoff);
  
  float echoIndex = floor(hash(vec2(sequenceIndex + 4.37, 2.91)) * totalCells);
  float echoMatch = 1.0 - step(0.1, abs(cellIndex - echoIndex));
  float echoGate = step(hash(vec2(sequenceIndex + 7.23, 5.14)), u_activity);
  float echoPresence = echoMatch * echoGate * 0.32 * (1.0 - handoff);
  float randomPresence = max(primaryPresence, echoPresence);
  
  vec2 pointerCell = floor(clamp(u_pointer, 0.0, 0.9999) * cells);
  float pointerCellMatch = 1.0 - step(0.1, length(cellId - pointerCell));
  float focusedPresence = pointerCellMatch * u_pointerStrength * u_interaction;
  float presence = clamp(max(randomPresence * (1.0 - u_pointerStrength * u_interaction), focusedPresence), 0.0, 1.0);

  float scale = 1.0 - u_zoom * (0.055 + seed * 0.035) * presence;
  vec2 direction = vec2(hash(cellId + sequenceIndex + 9.1), hash(cellId - sequenceIndex + 4.2)) - 0.5;
  vec2 sampleUv = center + (v_uv - center) * scale + direction / cells * u_zoom * 0.025 * presence;
  
  vec3 source = sourceAt(v_uv);
  vec3 sampled = sourceAt(sampleUv);
  
  float luminance = dot(sampled, vec3(0.299, 0.587, 0.114));
  vec2 sourceTexel = 1.4 / max(u_resolution, vec2(1.0));
  float luminanceX = dot(sourceAt(sampleUv + vec2(sourceTexel.x, 0.0)), vec3(0.299, 0.587, 0.114));
  float luminanceY = dot(sourceAt(sampleUv + vec2(0.0, sourceTexel.y)), vec3(0.299, 0.587, 0.114));
  float relief = clamp((abs(luminance - luminanceX) + abs(luminance - luminanceY)) * 5.5, 0.0, 1.0);
  
  vec3 treated;
  if (u_treatment == 1) {
    // Exposure treatment
    float exposure = mix(0.78, 1.34, seed);
    treated = pow(max(sampled * exposure, 0.0), vec3(mix(1.08, 0.88, seed)));
    treated = mix(treated, u_paper, max(0.0, exposure - 1.0) * 0.08);
  } else if (u_treatment == 2) {
    // Monochrome CCTV night vision treatment
    treated = mix(u_ink, u_paper, smoothstep(0.12, 0.92, luminance));
    treated = mix(treated, sampled, 0.08);
  } else {
    // SolaceUI Photographic ink separation (Chroma)
    vec2 registration = direction / cells * (0.006 + u_zoom * 0.008);
    vec3 registered = vec3(
      sourceAt(sampleUv + registration).r,
      sampled.g,
      sourceAt(sampleUv - registration).b
    );
    float registeredLuma = dot(registered, vec3(0.299, 0.587, 0.114));
    float surround = (
      dot(sourceAt(sampleUv + vec2(sourceTexel.x * 4.0, 0.0)), vec3(0.299, 0.587, 0.114)) +
      dot(sourceAt(sampleUv - vec2(sourceTexel.x * 4.0, 0.0)), vec3(0.299, 0.587, 0.114)) +
      dot(sourceAt(sampleUv + vec2(0.0, sourceTexel.y * 4.0)), vec3(0.299, 0.587, 0.114)) +
      dot(sourceAt(sampleUv - vec2(0.0, sourceTexel.y * 4.0)), vec3(0.299, 0.587, 0.114))
    ) * 0.25;
    float photographicDetail = clamp((registeredLuma - surround) * 3.2, -0.22, 0.22);
    float tone = smoothstep(0.07, 0.93, registeredLuma + photographicDetail * 1.7 + relief * 0.035);
    float highlight = smoothstep(0.58, 0.98, registeredLuma);
    vec3 shadowInk = mix(u_secondary, u_ink, 0.14);
    vec3 lightInk = mix(u_accent, u_paper, 0.16);
    vec3 inkSeparation = mix(shadowInk, lightInk, tone);
    inkSeparation = mix(inkSeparation, u_paper, highlight * 0.46);

    vec3 multiplyPass = registered * (0.56 + inkSeparation * 0.78);
    vec3 screenPass = 1.0 - (1.0 - registered) * (1.0 - inkSeparation);
    vec3 photographicPass = mix(multiplyPass, screenPass, smoothstep(0.22, 0.78, registeredLuma));
    treated = mix(inkSeparation, photographicPass, 0.48);
    treated *= mix(0.78, 1.1, tone);
    treated += photographicDetail * mix(vec3(0.62), u_paper, 0.24);
    treated += relief * mix(u_secondary, u_accent, tone) * 0.055;
  }

  // Grain & Raster Scanlines
  float stableGrain = hash(gl_FragCoord.xy + cellId * 37.0);
  float paperGrain = (stableGrain - 0.5) * u_grain;
  float raster = sin((gl_FragCoord.x + gl_FragCoord.y) * 1.05) * 0.5 + 0.5;
  treated += paperGrain * vec3(0.1, 0.08, 0.12);
  treated = mix(treated, treated * (0.94 + raster * 0.06), u_grain * 0.28);
  vec3 color = mix(source, treated, presence * u_intensity);

  // Glowing SolaceUI Grid Lines
  vec2 edgeDistance = min(local, 1.0 - local);
  vec2 pixelInCell = 1.0 / max(u_resolution / cells, vec2(1.0));
  float verticalLine = 1.0 - smoothstep(0.0, pixelInCell.x * u_lineWidth, edgeDistance.x);
  float horizontalLine = 1.0 - smoothstep(0.0, pixelInCell.y * u_lineWidth, edgeDistance.y);
  float gridLine = max(verticalLine, horizontalLine);
  float verticalGlow = 1.0 - smoothstep(0.0, pixelInCell.x * u_lineWidth * 3.8, edgeDistance.x);
  float horizontalGlow = 1.0 - smoothstep(0.0, pixelInCell.y * u_lineWidth * 3.8, edgeDistance.y);
  float gridGlow = max(verticalGlow, horizontalGlow);
  
  color = mix(color, u_grid, gridGlow * u_lineOpacity * 0.15);
  color = mix(color, u_grid, gridLine * u_lineOpacity * 0.85);
  color = mix(color, u_paper, gridLine * presence * u_lineOpacity * 0.35);
  
  float vignette = smoothstep(0.92, 0.28, length((v_uv - 0.5) * vec2(0.72, 1.0)));
  color *= mix(0.96, 1.01, vignette);
  
  outColor = vec4(color, 1.0);
}`;

function parseColor(hex: string) {
  const source = hex.replace('#', '');
  const normalized = source.length === 3 ? source.split('').map((c) => c + c).join('') : source.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  return new Float32Array([((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create exposure grid shader.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compilation error.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export interface ExposureGridRendererProps {
  sourceCanvas: HTMLCanvasElement | null;
  treatment?: ExposureGridTreatment;
  columns?: number;
  rows?: number;
  colors?: Partial<ExposureGridColors>;
  className?: string;
  onCellClick?: (col: number, row: number) => void;
  /**
   * 'cover' keeps the source aspect (photo/video sources).
   * 'fill' maps the source 1:1 onto the viewport so a composite canvas painted
   * per grid cell stays pixel-aligned with the shader's cell lines.
   */
  fit?: 'cover' | 'fill';
  /** Backing-store size of the shader surface, so the source can match it exactly. */
  onSurfaceResize?: (width: number, height: number) => void;
  /** Fires with the grid cell under the pointer, or null when the pointer leaves. */
  onCellHover?: (cell: { col: number; row: number } | null) => void;
}

export const ExposureGridRenderer: React.FC<ExposureGridRendererProps> = ({
  sourceCanvas,
  treatment = 'chroma',
  columns = 3,
  rows = 3,
  colors,
  className = 'w-full h-full block cursor-crosshair',
  onCellClick,
  fit = 'cover',
  onSurfaceResize,
  onCellHover
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fitRef = useRef(fit);
  const surfaceResizeRef = useRef(onSurfaceResize);
  const hoverRef = useRef(onCellHover);
  const gridRef = useRef({ columns, rows });
  const lastCellRef = useRef<string>('');
  useEffect(() => {
    fitRef.current = fit;
    surfaceResizeRef.current = onSurfaceResize;
    hoverRef.current = onCellHover;
    gridRef.current = { columns, rows };
  }, [fit, onSurfaceResize, onCellHover, columns, rows]);

  const resolved = useMemo<ExposureGridSettings>(() => ({
    ...SOLACE_SETTINGS,
    treatment,
    columns,
    rows,
    colors: { ...SOLACE_COLORS, ...colors }
  }), [treatment, columns, rows, colors]);

  const settingsRef = useRef(resolved);
  useEffect(() => {
    settingsRef.current = resolved;
  }, [resolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance'
    });
    if (!gl) return;

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      source: uniform('u_source'),
      resolution: uniform('u_resolution'),
      pointer: uniform('u_pointer'),
      pointerStrength: uniform('u_pointerStrength'),
      sourceAspect: uniform('u_sourceAspect'),
      time: uniform('u_time'),
      columns: uniform('u_columns'),
      rows: uniform('u_rows'),
      lineWidth: uniform('u_lineWidth'),
      lineOpacity: uniform('u_lineOpacity'),
      activity: uniform('u_activity'),
      tempo: uniform('u_tempo'),
      intensity: uniform('u_intensity'),
      zoom: uniform('u_zoom'),
      grain: uniform('u_grain'),
      interaction: uniform('u_interaction'),
      treatment: uniform('u_treatment'),
      grid: uniform('u_grid'),
      accent: uniform('u_accent'),
      secondary: uniform('u_secondary'),
      ink: uniform('u_ink'),
      paper: uniform('u_paper'),
    };

    gl.uniform1i(uniforms.source, 0);

    const target = { x: 0.5, y: 0.5, strength: 0 };
    const pointer = { ...target };

    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const rx = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
      const ry = (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      target.x = rx;
      target.y = 1 - ry;
      target.strength = 1;

      const { columns: gc, rows: gr } = gridRef.current;
      const col = Math.min(gc - 1, Math.max(0, Math.floor(rx * gc)));
      const row = Math.min(gr - 1, Math.max(0, Math.floor(ry * gr)));
      const key = `${col}:${row}`;
      if (key !== lastCellRef.current) {
        lastCellRef.current = key;
        hoverRef.current?.({ col, row });
      }
    };
    const leave = () => {
      target.strength = 0;
      lastCellRef.current = '';
      hoverRef.current?.(null);
    };

    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      surfaceResizeRef.current?.(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let frame = 0;
    let disposed = false;
    const started = performance.now();

    const render = (now: number) => {
      if (disposed) return;
      const current = settingsRef.current;

      pointer.x += (target.x - pointer.x) * 0.13;
      pointer.y += (target.y - pointer.y) * 0.13;
      pointer.strength += (target.strength - pointer.strength) * 0.1;

      // Upload source canvas texture every frame
      if (sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      const viewportAspect = canvas.width / Math.max(canvas.height, 1);
      const sourceAspect = fitRef.current === 'fill' || !sourceCanvas || sourceCanvas.height === 0
        ? viewportAspect
        : sourceCanvas.width / sourceCanvas.height;

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.pointerStrength, pointer.strength);
      gl.uniform1f(uniforms.sourceAspect, sourceAspect);
      gl.uniform1f(uniforms.time, (now - started) / 1000);
      gl.uniform1f(uniforms.columns, Math.round(current.columns));
      gl.uniform1f(uniforms.rows, Math.round(current.rows));
      gl.uniform1f(uniforms.lineWidth, current.lineWidth);
      gl.uniform1f(uniforms.lineOpacity, current.lineOpacity);
      gl.uniform1f(uniforms.activity, current.activity);
      gl.uniform1f(uniforms.tempo, current.tempo);
      gl.uniform1f(uniforms.intensity, current.intensity);
      gl.uniform1f(uniforms.zoom, current.zoom);
      gl.uniform1f(uniforms.grain, current.grain);
      gl.uniform1f(uniforms.interaction, current.interaction);
      gl.uniform1i(uniforms.treatment, current.treatment === 'exposure' ? 1 : current.treatment === 'monochrome' ? 2 : 0);
      gl.uniform3fv(uniforms.grid, parseColor(current.colors.grid));
      gl.uniform3fv(uniforms.accent, parseColor(current.colors.accent));
      gl.uniform3fv(uniforms.secondary, parseColor(current.colors.secondary));
      gl.uniform3fv(uniforms.ink, parseColor(current.colors.ink));
      gl.uniform3fv(uniforms.paper, parseColor(current.colors.paper));

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerleave', leave);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(program);
    };
  }, [sourceCanvas]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCellClick || !canvasRef.current) return;
    const bounds = canvasRef.current.getBoundingClientRect();
    const xRatio = (e.clientX - bounds.left) / bounds.width;
    const yRatio = (e.clientY - bounds.top) / bounds.height;
    const col = Math.floor(xRatio * resolved.columns);
    const row = Math.floor(yRatio * resolved.rows);
    onCellClick(col, row);
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className={className}
      role="img"
      aria-label="SolaceUI Exposure Grid Multi-Camera CCTV Stream"
    />
  );
};
