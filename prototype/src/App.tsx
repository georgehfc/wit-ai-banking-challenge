import { useState } from 'react'
import { screens, ScreenStub } from './screens'

export default function App() {
  const [i, setI] = useState(0)
  const go = (d: number) => setI((x) => Math.min(screens.length - 1, Math.max(0, x + d)))
  return (
    <main className="stage">
      <nav className="picker" aria-label="Screens">
        {screens.map((s, n) => (
          <button key={s.id} aria-current={n === i} onClick={() => setI(n)}>{s.id} {s.title}</button>
        ))}
      </nav>
      <div className="phone" role="region" aria-label={`Screen ${screens[i].id}`}>
        <ScreenStub screen={screens[i]} />
      </div>
      <div className="controls">
        <button onClick={() => go(-1)} disabled={i === 0}>Back</button>
        <button onClick={() => go(1)} disabled={i === screens.length - 1}>Next</button>
      </div>
    </main>
  )
}
