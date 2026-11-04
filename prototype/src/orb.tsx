// AiOrb: the assistant's mark. A grainy gradient sphere: wavy bands (white → cream → gold → orange → blue → ink)
// moving slowly inside a ball, with fine film grain. The shader is ported from a 21st.dev "gradient shader card"
// (three.js + react-three-fiber) to plain WebGL: no new dependencies, one small canvas per orb. White replaces the
// original pink at the top. Thinking makes the waves move faster. Pauses off screen; one still frame under Reduce Motion;
// CSS gradient fallback without WebGL.
import { useEffect, useRef, useState } from 'react'

export type OrbState = 'idle' | 'thinking' | 'listening'

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision highp float;
uniform float iTime; uniform vec2 iRes;
varying vec2 vUv;
vec2 hash(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x), mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0)), f - vec2(1.0)), u.x), u.y); }
vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw); vec4 s0 = floor(b0) * 2.0 + 1.0; vec4 s1 = floor(b1) * 2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))); p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0); m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
vec2 warp(vec2 p){
  float n1 = noise(p * 0.5 + vec2(iTime * 0.24, 0.0)); float n2 = noise(p * 0.5 + vec2(0.0, iTime * 0.2));
  float n3 = noise(p * 0.8 + vec2(-iTime * 0.3, iTime * 0.3)) * 0.5; float n4 = noise(p * 1.2 + vec2(iTime * 0.3, -iTime * 0.3)) * 0.3;
  return p + vec2(n1 + n3, n2 + n4) * 1.2;
}
vec3 grad(float t){
  vec3 c0 = vec3(1.0); vec3 c1 = vec3(0.984, 0.957, 0.925); vec3 c2 = vec3(0.980, 0.714, 0.082); vec3 c3 = vec3(0.988, 0.408, 0.118);
  vec3 c4 = vec3(0.051, 0.365, 0.957); vec3 c5 = vec3(0.043, 0.290, 0.733); vec3 c6 = vec3(0.090, 0.075, 0.110);
  t = clamp(t, 0.0, 1.0);
  if (t < 0.22) return mix(c0, c1, smoothstep(0.0, 0.22, t));
  if (t < 0.38) return mix(c1, c2, smoothstep(0.22, 0.38, t));
  if (t < 0.50) return mix(c2, c3, smoothstep(0.38, 0.50, t));
  if (t < 0.66) return mix(c3, c4, smoothstep(0.50, 0.66, t));
  if (t < 0.86) return mix(c4, c5, smoothstep(0.66, 0.86, t));
  return mix(c5, c6, smoothstep(0.86, 1.0, t));
}
void main(){
  vec2 q = (vUv * iRes - 0.5 * iRes) / iRes.y;
  float r = length(q) * 2.0;
  float edge = smoothstep(1.0, 1.0 - 2.5 / iRes.y, r);
  if (edge <= 0.0) { gl_FragColor = vec4(0.0); return; }
  vec2 w = warp(q * 1.6);
  w += snoise(vec3(w * 2.0, iTime * 0.15)) * 0.35;
  float arch = 1.0 - length(w) * 0.5;
  float wave = (sin(w.x * 3.0 + iTime * 0.6) * 0.5 * arch + sin(w.x * 5.0 - iTime * 0.4) * 0.3 * arch + sin(w.y * 4.0 + iTime * 0.42) * 0.15 - w.x * w.x * 0.2) * (sin(iTime * 0.5) * 0.1 + 0.9) * 0.3;
  float pos = vUv.y + wave * 0.9;
  vec3 col = grad(smoothstep(0.0, 1.0, clamp(1.0 - pos, 0.0, 1.0)));
  float z = sqrt(max(0.0, 1.0 - r * r));
  col *= mix(0.78, 1.0, smoothstep(0.0, 0.6, z));
  vec2 hl = q * 2.0 - vec2(-0.35, 0.45); col += vec3(0.18) * exp(-dot(hl, hl) * 3.5);
  float g = fract(sin(dot(vUv * iRes, vec2(12.9898, 78.233))) * 43758.5453 + iTime * 2.0);
  col += (g - 0.5) * 0.07;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * edge, edge);
}`

const SPEED: Record<OrbState, number> = { idle: 0.55, thinking: 1.8, listening: 1.2 }

export function AiOrb({ size = 32, state = 'idle', label }: { size?: number; state?: OrbState; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef(state); stateRef.current = state
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true })
    if (!gl || gl.isContextLost()) { setFallback(true); return }
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setFallback(true); return }
    gl.useProgram(prog)
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uT = gl.getUniformLocation(prog, 'iTime')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = size * dpr; canvas.height = size * dpr; gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(gl.getUniformLocation(prog, 'iRes'), canvas.width, canvas.height)
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let t = 3 + Math.random() * 20, speed = SPEED[stateRef.current], last = performance.now(), raf = 0, visible = true
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      speed += (SPEED[stateRef.current] - speed) * 0.05; t += dt * speed
      gl.uniform1f(uT, t); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!still && visible) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const io = new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was && !still) { last = performance.now(); raf = requestAnimationFrame(frame) } })
    io.observe(canvas)
    return () => { cancelAnimationFrame(raf); io.disconnect(); gl.deleteBuffer(buf); gl.deleteProgram(prog) }
  }, [size])

  return (
    <span className={`orb orb-${state}`} style={{ width: size, height: size, ['--s' as string]: `${size}px` }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {fallback ? <span className="orb-css" /> : <canvas ref={ref} style={{ width: size, height: size }} />}
    </span>
  )
}
