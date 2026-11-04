// AiOrb: the assistant's mark. A soft bubble: see-through body, glowing violet rim that wobbles, bright arc on top.
// The noise and setup are ported from a 21st.dev "gradient orb" (three.js + react-three-fiber) to plain WebGL:
// no new dependencies, one tiny canvas per orb. Colours come from the design tokens (AI violet, accent teal, warm coral),
// so it follows light/dark mode. Idle is calm; thinking turns faster and brighter. Pauses off screen; still under
// Reduce Motion; falls back to a CSS orb if WebGL isn't available.
import { useEffect, useRef, useState } from 'react'

export type OrbState = 'idle' | 'thinking' | 'listening'

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision highp float;
uniform float iTime; uniform vec2 iRes; uniform float rot; uniform float glow; uniform float px; uniform float light;
uniform vec3 c0; uniform vec3 c1; uniform vec3 c2;
varying vec2 vUv;
vec3 hash33(vec3 p3){ p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787)); p3 += dot(p3, p3.yxz + 19.19); return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx); }
float snoise3(vec3 p){
  const float K1 = 0.333333333; const float K2 = 0.166666667;
  vec3 i = floor(p + (p.x + p.y + p.z) * K1); vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
  vec3 e = step(vec3(0.0), d0 - d0.yzx); vec3 i1 = e * (1.0 - e.zxy); vec3 i2 = 1.0 - e.zxy * (1.0 - e);
  vec3 d1 = d0 - (i1 - K2); vec3 d2 = d0 - (i2 - K1); vec3 d3 = d0 - 0.5;
  vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
  vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
  return dot(vec4(31.316), n);
}
// A soft bubble: see-through body, glowing rim that wobbles slowly, bright arc on top, mauve at the bottom.
void main(){
  vec2 uv = (vUv * iRes - iRes * 0.5) / min(iRes.x, iRes.y) * 2.0;
  float r = length(uv);
  vec2 dir = r > 0.0 ? uv / r : vec2(0.0, 1.0);
  float s = sin(rot), c = cos(rot); vec2 rd = vec2(c * dir.x - s * dir.y, s * dir.x + c * dir.y);
  float wob = snoise3(vec3(rd * 1.1, iTime * 0.3));
  float R = 0.78 + 0.045 * wob;
  float d = r - R;
  float w = max(0.055, 3.4 / px);
  float rim = exp(-(d * d) / (w * w));
  float inner = d < 0.0 ? exp(d * 3.5) : 0.0;
  float outer = d > 0.0 ? exp(-d * 12.0) : 0.0;
  float top = pow(max(0.0, dot(dir, normalize(vec2(-0.12, 1.0)))), 5.0);
  float bottom = smoothstep(0.1, -0.9, dir.y);
  vec3 col = mix(c1, c0, 0.5 + 0.5 * rd.x);
  col = mix(col, c2, bottom * 0.7);
  vec3 hi = mix(vec3(1.0), c0, light * 0.6);
  col = mix(col, hi, top * 0.85);
  float a = rim * (0.62 + 0.18 * glow) * (1.0 - 0.15 * light) + inner * (0.3 + 0.12 * glow) + outer * 0.3 + light * 0.05 * step(d, 0.0);
  a *= smoothstep(1.0, 0.94, r);
  a = clamp(a, 0.0, 1.0);
  gl_FragColor = vec4(col * a, a);
}`

const hex = (h: string): [number, number, number] => { const m = h.trim().replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255) as [number, number, number] }
// Lavender (top), violet (sides), mauve (bottom). Light mode uses the deeper violet so the rim shows on white.
const isDark = () => document.documentElement.dataset.theme === 'dark'
const tokenColours = () => {
  const cs = getComputedStyle(document.documentElement)
  const ai300 = cs.getPropertyValue('--p-color-ai-300') || '#B3A4F7'
  return (isDark() ? [ai300, '#8B6CFF', '#D98BC9'] : ['#9D86F7', '#A894FA', '#E2A4D6']).map(hex)
}
const SPEED: Record<OrbState, number> = { idle: 0.7, thinking: 2.4, listening: 1.6 }

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
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = size * dpr; canvas.height = size * dpr; gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u('iRes'), canvas.width, canvas.height)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    const setColours = () => { const [a, b, c] = tokenColours(); gl.uniform3f(u('c0'), ...a); gl.uniform3f(u('c1'), ...b); gl.uniform3f(u('c2'), ...c); gl.uniform1f(u('light'), isDark() ? 0 : 1) }
    gl.uniform1f(u('px'), size * dpr)
    setColours()
    const themeObs = new MutationObserver(setColours); themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    let t = 4, rot = 0, speed = SPEED[stateRef.current], last = performance.now(), raf = 0, visible = true
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      speed += (SPEED[stateRef.current] - speed) * 0.06
      t += dt * speed; rot += dt * 0.3 * speed
      gl.uniform1f(u('iTime'), t); gl.uniform1f(u('rot'), rot); gl.uniform1f(u('glow'), stateRef.current === 'thinking' ? 1.5 : 1)
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!still && visible) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const io = new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting && !document.hidden; if (visible && !was && !still) { last = performance.now(); raf = requestAnimationFrame(frame) } })
    io.observe(canvas)
    return () => { cancelAnimationFrame(raf); io.disconnect(); themeObs.disconnect(); gl.deleteBuffer(buf); gl.deleteProgram(prog) }
  }, [size])

  return (
    <span className={`orb orb-${state}`} style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {fallback ? <span className="orb-css" /> : <canvas ref={ref} style={{ width: size, height: size }} />}
    </span>
  )
}
