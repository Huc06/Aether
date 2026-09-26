import { LensConfig } from '../types';

const VS_SOURCE = `#version 300 es
  in vec2 a_position;
  out vec2 v_texcoord;
  void main() {
    v_texcoord = vec2(a_position.x * 0.5 + 0.5, 1.0 - (a_position.y * 0.5 + 0.5));
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FS_SOURCE = `#version 300 es
  precision highp float;

  in vec2 v_texcoord;
  layout(location = 0) out vec4 fragColor;

  uniform sampler2D tex;
  uniform vec2 fullSize;
  uniform float distort;
  uniform float contrast;   // edge overscan
  uniform float brightness; // edge feather width
  uniform float edgeBlur;      // 0..1 bokeh blur
  uniform float edgeBlurStart; // start radius
  uniform float vignette;      // edge darkening
  uniform float chromatic;     // chromatic aberration
  uniform float scanlines;     // CRT scanlines strength

  const float GOLDEN_ANGLE = 2.39996323;
  const int   BLUR_TAPS    = 20;

  vec3 lensSample(vec2 uv, vec2 fringe) {
    if (fringe.x == 0.0 && fringe.y == 0.0)
      return texture(tex, clamp(uv, 0.0, 1.0)).rgb;
    return vec3(
      texture(tex, clamp(uv + fringe, 0.0, 1.0)).r,
      texture(tex, clamp(uv, 0.0, 1.0)).g,
      texture(tex, clamp(uv - fringe, 0.0, 1.0)).b
    );
  }

  void main() {
    bool hasLens = abs(distort) >= 0.0001 || abs(contrast - 1.0) >= 0.0001 || edgeBlur > 0.001 || vignette > 0.001 || chromatic > 0.001;

    vec2 uv = v_texcoord;
    float edgeAlpha = 1.0;
    float shade = 1.0;
    vec3 rgb;

    if (!hasLens) {
      rgb = texture(tex, uv).rgb;
    } else {
      vec2 centered = v_texcoord * 2.0 - 1.0;
      float radius2 = dot(centered, centered);

      // Barrel / pincushion radial mapping
      vec2 warped = centered * (1.0 + distort * radius2) / max(contrast, 0.001);
      uv = warped * 0.5 + 0.5;

      // Edge fade / crop
      vec2 edgeDistance = min(uv, 1.0 - uv);
      edgeAlpha = brightness <= 0.0 ? 1.0 : smoothstep(0.0, brightness, min(edgeDistance.x, edgeDistance.y));

      float radius = sqrt(radius2) * 0.70710678;
      float ramp = smoothstep(min(edgeBlurStart, 0.99), 1.0, radius);
      vec2 outward = radius > 0.0001 ? centered / sqrt(radius2) : vec2(0.0);
      
      float fringeRamp = smoothstep(0.1, 1.0, radius);
      vec2 fringe = outward * chromatic * fringeRamp * fringeRamp * 0.015;

      float blur = edgeBlur * ramp;
      if (blur > 0.005) {
        float radiusPx = blur * 0.02 * fullSize.y;
        vec2 texel = 1.0 / max(fullSize, vec2(1.0));
        vec3 sum = vec3(0.0);
        for (int i = 0; i < BLUR_TAPS; ++i) {
          float t = (float(i) + 0.5) / float(BLUR_TAPS);
          float angle = float(i) * GOLDEN_ANGLE;
          sum += lensSample(uv + vec2(cos(angle), sin(angle)) * sqrt(t) * radiusPx * texel, fringe);
        }
        rgb = sum / float(BLUR_TAPS);
      } else {
        rgb = lensSample(uv, fringe);
      }

      shade = 1.0 - vignette * smoothstep(0.2, 1.0, radius);
    }

    // Optional subtle CRT scanlines
    if (scanlines > 0.01) {
      float scan = sin(gl_FragCoord.y * 1.5) * 0.5 + 0.5;
      rgb *= (1.0 - scanlines * 0.12 * (1.0 - scan));
    }

    fragColor = vec4(rgb * edgeAlpha * shade, 1.0);
  }
`;

export class WebGLShaderPipeline {
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private screenTexture: WebGLTexture | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  init(canvas: HTMLCanvasElement): boolean {
    this.gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    });

    if (!this.gl) {
      console.warn('[Aether Engine] WebGL 2.0 not supported, falling back to 2D canvas.');
      return false;
    }

    const gl = this.gl;

    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl.FRAGMENT_SHADER, FS_SOURCE);
    if (!vs || !fs) return false;

    this.program = gl.createProgram();
    if (!this.program) return false;

    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(this.program));
      return false;
    }

    // Screen Quad
    const quadPositions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]);

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Screen Texture
    this.screenTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Uniform locations
    gl.useProgram(this.program);
    const uniformNames = [
      'tex',
      'fullSize',
      'distort',
      'contrast',
      'brightness',
      'edgeBlur',
      'edgeBlurStart',
      'vignette',
      'chromatic',
      'scanlines'
    ];
    uniformNames.forEach(name => {
      this.uniforms[name] = gl.getUniformLocation(this.program!, name);
    });

    return true;
  }

  render(sourceCanvas: HTMLCanvasElement, width: number, height: number, config: LensConfig, transitionProgress: number) {
    if (!this.gl || !this.program || !this.screenTexture || !this.vao) return;

    const gl = this.gl;
    gl.viewport(0, 0, width, height);

    gl.bindTexture(gl.TEXTURE_2D, this.screenTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    gl.useProgram(this.program);

    // Active real-time lens shader pipeline with overview focus boost
    const isLight = config.themeMode === 'light';
    const overviewBoost = 1.0 + transitionProgress * 0.35;
    gl.uniform1i(this.uniforms.tex, 0);
    gl.uniform2f(this.uniforms.fullSize, width, height);
    gl.uniform1f(this.uniforms.distort, config.distort * overviewBoost);
    gl.uniform1f(this.uniforms.contrast, config.contrast);
    gl.uniform1f(this.uniforms.brightness, config.feather);
    gl.uniform1f(this.uniforms.edgeBlur, config.edgeBlur * (0.5 + transitionProgress * 0.5));
    gl.uniform1f(this.uniforms.edgeBlurStart, config.edgeBlurStart);
    gl.uniform1f(this.uniforms.vignette, isLight ? config.vignette * 0.2 : config.vignette * overviewBoost);
    gl.uniform1f(this.uniforms.chromatic, config.chromatic * overviewBoost);
    gl.uniform1f(this.uniforms.scanlines, config.showScanlines ? (isLight ? 0.25 : 1.0) : 0.0);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
