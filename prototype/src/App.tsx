import { useEffect, useState } from 'react'
import { J0, J0_STATES, type FlowId } from './flows/j0'
import { J1 } from './flows/j1'
import { J2 } from './flows/j2'
import { J3 } from './flows/j3'
import { J4 } from './flows/j4'
import { J5 } from './flows/j5'

const FLOWS: { id: FlowId; name: string; entry: string; variants?: { id: string; name: string }[] }[] = [
  { id: 'j1', name: 'J1 · Save for the holiday', entry: 'You ask. Tap “Ask AI”, then “Save for something”. Drag the amount or type “make it 250”.' },
  { id: 'j2', name: 'J2 · Christmas allowance lands', entry: 'Money arrives. Approve moving €600 to Holiday.', variants: [{ id: 'closed', name: 'App closed' }, { id: 'open', name: 'App open' }] },
  { id: 'j3', name: 'J3 · Off-track month', entry: 'The planner sees a short January coming. Pick what to do.' },
  { id: 'j4', name: 'J4 · Borrowing handoff', entry: 'A credit question mid-chat. Send the question.' },
  { id: 'j5', name: 'J5 · First use: consent', entry: 'First tap on the pill: intro, then consent, then J1.' },
  { id: 'j0', name: 'J0 · Entry points', entry: 'The assistant asleep. Pick a state, then tap the pill to enter that journey.', variants: J0_STATES.map((s) => ({ id: s.id, name: s.name })) },
]

export default function App() {
  const [flow, setFlow] = useState<FlowId>('j1')
  const [variant, setVariant] = useState<Record<string, string>>({ j2: 'closed', j0: 'idle' })
  const [run, setRun] = useState(0) // bump to restart the selected flow from its root
  const [enter, setEnter] = useState<string | null>(null) // set when J0 hands over: open straight into the journey
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const restart = () => { setEnter(null); setRun((r) => r + 1) }
  const go = (f: FlowId, v?: string, from?: string) => { setFlow(f); if (v) setVariant((x) => ({ ...x, [f]: v })); setRun((r) => r + 1); setEnter(from ?? null) }

  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  // Esc: back to the root of the selected flow
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); restart() } }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  const def = FLOWS.find((f) => f.id === flow)!
  const v = variant[flow]
  const key = `${flow}-${v ?? ''}-${run}-${enter ?? ''}`
  return (
    <main className="stage calm">
      <aside className="panel" aria-label="Prototype controls">
        <p className="panel-title">Journeys</p>
        <div className="flow-list" role="radiogroup" aria-label="Journey">
          {FLOWS.map((f) => (
            <button key={f.id} role="radio" aria-checked={f.id === flow} className={f.id === flow ? 'on' : ''} onClick={() => go(f.id)}>{f.name}</button>
          ))}
        </div>
        {def.variants && (
          <div className="variants" role="radiogroup" aria-label="Variant">
            {def.variants.map((x) => <button key={x.id} role="radio" aria-checked={x.id === v} className={x.id === v ? 'on' : ''} onClick={() => go(flow, x.id)}>{x.name}</button>)}
          </div>
        )}
        <p className="panel-note">{def.entry}</p>
        {flow === 'j0' && <p className="panel-note">{J0_STATES.find((s) => s.id === v)?.why}</p>}
        <div className="panel-row">
          <button onClick={restart}>Reset</button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>Color mode: {theme === 'light' ? 'Light' : 'Dark'}</button>
        </div>
        <p className="panel-note">Esc goes back to the start of the journey. Numbers come from the planner.</p>
      </aside>
      <div className="phone" key={key}>
        {flow === 'j0' && <J0 state={v} go={go} />}
        {flow === 'j1' && <J1 startOpen={!!enter} resumeWorking={enter === 'working'} />}
        {flow === 'j2' && <J2 variant={v as 'closed' | 'open'} entered={!!enter} />}
        {flow === 'j3' && <J3 entered={!!enter} />}
        {flow === 'j4' && <J4 />}
        {flow === 'j5' && <J5 entered={!!enter} />}
      </div>
    </main>
  )
}
