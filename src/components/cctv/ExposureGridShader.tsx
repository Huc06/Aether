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

const DEFAULT_COLORS: ExposureGridColors = {
  grid: '#06b6d4',
  accent: '#f59e0b',
  secondary: '#38bdf8',
  ink: '#07090e',
  paper: '#0d1522',
};

const DEFAULT_SETTINGS: ExposureGridSettings = {
  treatment: 'chroma',
  columns: 3,
  rows: 3,
  lineWidth: 2.0,
  lineOpacity: 0.35,
  activity: 0.45,
  tempo: 1.1,
  intensity: 0.75,
  zoom: 0.65,
  grain: 0.60,
  interaction: 0.85,
  colors: DEFAULT_COLORS,
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
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_pointerStrength;
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

void main() {
  vec2 cells = vec2(max(u_columns, 1.0), max(u_rows, 1.0));
  vec2 cellSpace = v_uv * cells;
  vec2 cellId = floor(cellSpace);
  vec2 local = fract(cellSpace);
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

  vec3 baseBg = u_ink;
  vec3 treated;
  
  if (u_treatment == 1) {
    // Exposure shift
    float exposure = mix(0.78, 1.45, seed);
    treated = mix(u_ink, u_accent, exposure * 0.4);
    treated = mix(treated, u_paper, max(0.0, exposure - 1.0) * 0.2);
  } else if (u_treatment == 2) {
    // Monochrome CCTV night-vision
    treated = mix(vec3(0.02, 0.15, 0.05), vec3(0.1, 0.9, 0.3), smoothstep(0.1, 0.9, seed));
  } else {
    // Chroma separation
    vec3 shadowInk = mix(u_secondary, u_ink, 0.3);
    vec3 lightInk = mix(u_accent, u_paper, 0.2);
    treated = mix(shadowInk, lightInk, seed);
  }

  // Film grain & analog raster
  float stableGrain = hash(gl_FragCoord.xy + cellId * 37.0);
  float paperGrain = (stableGrain - 0.5) * u_grain;
  float scanline = sin(gl_FragCoord.y * 1.8) * 0.5 + 0.5;
  
  treated += paperGrain * vec3(0.12, 0.10, 0.14);
  treated = mix(treated, treated * (0.88 + scanline * 0.12), u_grain * 0.4);
  
  vec3 color = mix(baseBg, treated, presence * u_intensity * 0.6 + 0.08);

  // Exposure Grid Lines
  vec2 edgeDistance = min(local, 1.0 - local);
  vec2 pixelInCell = 1.0 / max(u_resolution / cells, vec2(1.0));
  float verticalLine = 1.0 - smoothstep(0.0, pixelInCell.x * u_lineWidth, edgeDistance.x);
  float horizontalLine = 1.0 - smoothstep(0.0, pixelInCell.y * u_lineWidth, edgeDistance.y);
  float gridLine = max(verticalLine, horizontalLine);
  
  float verticalGlow = 1.0 - smoothstep(0.0, pixelInCell.x * u_lineWidth * 3.5, edgeDistance.x);
  float horizontalGlow = 1.0 - smoothstep(0.0, pixelInCell.y * u_lineWidth * 3.5, edgeDistance.y);
  float gridGlow = max(verticalGlow, horizontalGlow);
  
  color = mix(color, u_grid, gridGlow * u_lineOpacity * 0.12);
  color = mix(color, u_grid, gridLine * u_lineOpacity * 0.65);
  
  // Lens Vignette
  float vignette = smoothstep(0.92, 0.28, length((v_uv - 0.5) * vec2(0.72, 1.0)));
  color *= mix(0.92, 1.02, vignette);
  
  outColor = vec4(color, 0.85);
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

interface ExposureGridProps {
  treatment?: ExposureGridTreatment;
  columns?: number;
  rows?: number;
  colors?: Partial<ExposureGridColors>;
  className?: string;
}

export const ExposureGridShader: React.FC<ExposureGridProps> = ({
  treatment = 'chroma',
  columns = 3,
  rows = 3,
  colors,
  className = 'absolute inset-0 w-full h-full pointer-events-none'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resolved = useMemo<ExposureGridSettings>(() => ({
    ...DEFAULT_SETTINGS,
    treatment,
    columns,
    rows,
    colors: { ...DEFAULT_COLORS, ...colors }
  }), [treatment, columns, rows, colors]);

  const settingsRef = useRef(resolved);
  useEffect(() => {
    settingsRef.current = resolved;
  }, [resolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
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

    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      resolution: uniform('u_resolution'),
      pointer: uniform('u_pointer'),
      pointerStrength: uniform('u_pointerStrength'),
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

    const target = { x: 0.5, y: 0.5, strength: 0 };
    const pointer = { ...target };

    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      target.x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
      target.y = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      target.strength = 1;
    };
    const leave = () => { target.strength = 0; };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerleave', leave);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
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

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);

      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.pointerStrength, pointer.strength);
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
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerleave', leave);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
};
