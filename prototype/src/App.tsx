import { useEffect, useState } from 'react'
import { Assistant, type Trigger } from './assistant'

// Prototype tweaks: how the app starts, colour mode, reset. Esc also resets.
export default function App() {
  const [start, setStart] = useState<'open' | 'closed'>('open')
  const [trigger, setTrigger] = useState<Trigger>('rest')
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
      <aside className="panel" aria-label="Ajustes do protótipo">
        <p className="panel-title">Ajustes</p>
        <div className="tweak">
          <span className="panel-note">Começar com a app</span>
          <div className="segmented small" role="radiogroup" aria-label="Começar com a app">
            {(['open', 'closed'] as const).map((s) => <button key={s} role="radio" aria-checked={start === s} className={start === s ? 'on' : ''} onClick={() => { setStart(s); reset() }}>{s === 'open' ? 'Aberta' : 'Fechada'}</button>)}
          </div>
        </div>
        <div className="tweak">
          <span className="panel-note">IA no Início</span>
          <div className="segmented small" role="radiogroup" aria-label="IA no Início">
            {([['rest', 'Repouso'], ['alert', 'Alerta'], ['processing', 'Processar']] as const).map(([k, l]) => <button key={k} role="radio" aria-checked={trigger === k} className={trigger === k ? 'on' : ''} onClick={() => { setTrigger(k); setStart('open'); reset() }}>{l}</button>)}
          </div>
          <span className="panel-note">{trigger === 'alert' ? 'Toca no botão para abrir, ou × para dispensar (com Anular).' : trigger === 'processing' ? 'A trabalhar em segundo plano, depois “pronto”. Toca para abrir.' : 'Toca em “Pergunta à IA” para começar.'}</span>
        </div>
        <div className="tweak">
          <span className="panel-note">Cor</span>
          <div className="segmented small" role="radiogroup" aria-label="Modo de cor">
            {(['light', 'dark'] as const).map((t) => <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>{t === 'light' ? 'Clara' : 'Escura'}</button>)}
          </div>
        </div>
        <button className="panel-btn" onClick={reset}>Repor</button>
        <p className="panel-note">Esc também repõe. Todos os números vêm do planeador.</p>
      </aside>
      <div className="phone" key={`${start}-${trigger}-${run}`}><Assistant startClosed={start === 'closed'} trigger={trigger} /></div>
    </main>
  )
}
