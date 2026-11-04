// AiOrb: the assistant's mark. A dark glossy ball with a soft violet rim and two eyes.
// Inspired by a 21st.dev robot hero (three.js + drei): only its head, rebuilt in CSS + SVG, so it stays crisp at 20 px
// and needs no 3D canvas. With no cursor on a phone, the eyes do the "alive" part: they blink every few seconds and
// glance around now and then. Thinking: eyes look up and scan. Listening: eyes widen. Reduce Motion: eyes stay still.
import { useEffect, useRef, useState } from 'react'

export type OrbState = 'idle' | 'thinking' | 'listening'

// One eye: a rounded rectangle split into a top and a bottom half, like the reference.
const W = 3.6, H = 5.4, R = 3, G = 0.9
const half = (s: 1 | -1) => `M${-W},${s * G} L${-W},${s * (H - R)} Q${-W},${s * H} ${-W + R},${s * H} L${W - R},${s * H} Q${W},${s * H} ${W},${s * (H - R)} L${W},${s * G}`
const EYE = `${half(1)} ${half(-1)}`

const LOOKS: [number, number][] = [[-4, 0], [4, 0], [-3, -2], [3, -2], [0, 2], [-4, 1], [4, 1]]
const rand = (a: number, b: number) => a + Math.random() * (b - a)

export function AiOrb({ size = 32, state = 'idle', label }: { size?: number; state?: OrbState; label?: string }) {
  const [look, setLook] = useState<[number, number]>([0, 0])
  const [blink, setBlink] = useState(false)
  const stateRef = useRef(state); stateRef.current = state

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let alive = true
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(() => alive && fn(), ms)) }
    const doBlink = () => { setBlink(true); later(() => setBlink(false), 140); later(doBlink, rand(2600, 5200)) }
    const glance = () => {
      if (stateRef.current === 'thinking') { setLook([rand(-4, 4), -3]); later(glance, rand(500, 900)); return }
      const target = LOOKS[Math.floor(Math.random() * LOOKS.length)]
      setLook(target)
      later(() => setLook([0, 0]), rand(700, 1400))
      later(glance, rand(2800, 6000))
    }
    later(doBlink, rand(900, 2400))
    later(glance, rand(1500, 3500))
    return () => { alive = false; timers.forEach(clearTimeout) }
  }, [])

  useEffect(() => { if (state !== 'thinking') setLook([0, 0]) }, [state])

  const eyeScale = state === 'listening' ? 1.15 : 1
  return (
    <span className={`orb orb-${state}`} style={{ width: size, height: size, ['--s' as string]: `${size}px` }} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <svg viewBox="-24 -24 48 48" width={size} height={size}>
        <g className="orb-eyes" style={{ transform: `translate(${look[0]}px, ${look[1] + 1}px) scale(${eyeScale}, ${blink ? 0.12 : eyeScale})` }}>
          <path d={EYE} transform="translate(-7.5 0)" />
          <path d={EYE} transform="translate(7.5 0)" />
        </g>
      </svg>
    </span>
  )
}
