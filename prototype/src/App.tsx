import { useEffect, useState } from 'react'
import { Assistant } from './assistant'

// Prototype tweaks: how the app starts, colour mode, reset. Esc also resets.
export default function App() {
  const [start, setStart] = useState<'open' | 'closed'>('open')
  const [run, setRun] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const reset = () => setRun((r) => r + 1)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); reset() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <main className="stage">
      <aside className="panel" aria-label="Prototype tweaks">
        <p className="panel-title">Tweaks</p>
        <div className="tweak">
          <span className="panel-note">Start with the app</span>
          <div className="segmented small" role="radiogroup" aria-label="Start with the app">
            {(['open', 'closed'] as const).map((s) => <button key={s} role="radio" aria-checked={start === s} className={start === s ? 'on' : ''} onClick={() => { setStart(s); reset() }}>{s === 'open' ? 'Open' : 'Closed'}</button>)}
          </div>
        </div>
        <div className="tweak">
          <span className="panel-note">Colour</span>
          <div className="segmented small" role="radiogroup" aria-label="Colour mode">
            {(['light', 'dark'] as const).map((t) => <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>{t === 'light' ? 'Light' : 'Dark'}</button>)}
          </div>
        </div>
        <button className="panel-btn" onClick={reset}>Reset</button>
        <p className="panel-note">Esc resets too. Every number comes from the planner.</p>
      </aside>
      <div className="phone" key={`${start}-${run}`}><Assistant startClosed={start === 'closed'} /></div>
    </main>
  )
}
