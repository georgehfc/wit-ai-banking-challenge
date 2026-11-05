import { useEffect, useRef, useState } from 'react'
import { Assistant, type Journey, type Trigger } from './assistant'

// Prototype tweaks, hidden like an admin drawer: pull left from the right edge, tap the handle, or press T.
// Changes apply at once; "Voltar ao fluxo", the scrim, a swipe right or Esc closes it. Esc with the drawer closed resets.
const JOURNEYS: [Journey, string, string][] = [
  ['j0', 'J0 · Primeiro uso', 'Introdução e consentimento (início)'],
  ['j1', 'J1 · Poupar para algo', 'A jornada principal'],
  ['j2', 'J2 · Chega o subsídio de Natal', 'Aprovar 600 € para Férias'],
  ['j3', 'J3 · Mês apertado', 'A IA vê um pagamento e propõe mudar janeiro'],
  ['j4', 'J4 · Pedir crédito', 'Passagem para uma pessoa'],
]
const JOURNEY_HINT: Partial<Record<Journey, string>> = {
  j2: 'Dezembro: o subsídio chegou. Toca no alerta do Início (ou começa com a app fechada para ver a notificação).',
  j3: '28 dez: pagaste 180 € na Worten. Toca no alerta do Início para rever janeiro.',
  j4: 'Abre uma conversa a pedir crédito. Também acontece em J1, na diferença: “Posso pedir emprestado?”.',
  j0: 'Primeiro toque no botão da IA: introdução, depois o pedido de acesso à conta.',
}

export default function App() {
  const [start, setStart] = useState<'open' | 'closed'>('open')
  const [trigger, setTrigger] = useState<Trigger>('rest')
  const [journey, setJourney] = useState<Journey>('j0')
  const [run, setRun] = useState(0)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [open, setOpen] = useState(false)
  const openRef = useRef(open); openRef.current = open
  const reset = () => setRun((r) => r + 1)
  useEffect(() => { document.documentElement.dataset.theme = theme }, [theme])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.('textarea, input')
      if (e.key === 'Escape') { e.preventDefault(); if (openRef.current) setOpen(false); else reset() }
      else if ((e.key === 't' || e.key === 'T') && !typing) setOpen((o) => !o)
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Pull gestures: from the right edge leftwards opens; on the drawer rightwards closes.
  const drag = useRef<{ x: number; y: number; mode: 'open' | 'close' } | null>(null)
  const down = (mode: 'open' | 'close') => (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, mode }; if (mode === 'open') { e.preventDefault(); (e.currentTarget as Element).setPointerCapture(e.pointerId) } }
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return
    const dx = e.clientX - d.x, dy = Math.abs(e.clientY - d.y)
    if (d.mode === 'open' && dx < -30 && dy < 60) { setOpen(true); drag.current = null }
    if (d.mode === 'close' && dx > 50 && dy < 60) { setOpen(false); drag.current = null }
  }
  const up = () => { drag.current = null }

  const seg = <T extends string>(label: string, value: T, options: readonly (readonly [T, string])[], onPick: (v: T) => void) => (
    <div className="tweak">
      <span className="panel-note">{label}</span>
      <div className="segmented small" role="radiogroup" aria-label={label}>
        {options.map(([k, l]) => <button key={k} role="radio" aria-checked={value === k} className={value === k ? 'on' : ''} onClick={() => onPick(k)}>{l}</button>)}
      </div>
    </div>
  )

  return (
    <main className="stage">
      <div className="phone" key={`${journey}-${start}-${trigger}-${run}`}><Assistant startClosed={start === 'closed' && journey !== 'j4' && journey !== 'j0'} trigger={trigger} journey={journey} /></div>

      <div className="edge-zone" aria-hidden="true" onPointerDown={down('open')} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      {!open && <button className="tweaks-handle" onClick={() => setOpen(true)} aria-label="Abrir ajustes do protótipo (T)" title="Ajustes (T)"><i /><span className="tweaks-label">Ajustes</span><kbd>T</kbd></button>}
      <div className={`tweaks-scrim ${open ? 'open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`tweaks ${open ? 'open' : ''}`} aria-label="Ajustes do protótipo" aria-hidden={!open} onPointerDown={down('close')} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="panel">
          <div className="panel-head"><p className="panel-title">Ajustes do protótipo</p></div>
          <div className="tweak">
            <span className="panel-note">Jornada</span>
            <div className="journey-list" role="radiogroup" aria-label="Jornada">
              {JOURNEYS.map(([k, l, sub]) => <button key={k} role="radio" aria-checked={journey === k} className={journey === k ? 'on' : ''} onClick={() => { setJourney(k); reset() }}><span className="body-strong">{l}</span><span className="caption muted">{sub}</span></button>)}
            </div>
          </div>
          {seg('Começar com a app', start, [['open', 'Aberta'], ['closed', 'Fechada']] as const, (s) => { setStart(s); reset() })}
          {journey === 'j1' && seg('IA no Início', trigger, [['rest', 'Repouso'], ['alert', 'Alerta'], ['processing', 'Processar']] as const, (k) => { setTrigger(k); setStart('open'); reset() })}
          <span className="panel-note">{JOURNEY_HINT[journey] ?? (trigger === 'alert' ? 'Toca no botão para abrir, ou × para dispensar (com Anular).' : trigger === 'processing' ? 'A trabalhar em segundo plano, depois “pronto”. Toca para abrir.' : 'Toca em “Pergunta à IA” para começar.')}</span>
          {seg('Cor', theme, [['light', 'Clara'], ['dark', 'Escura']] as const, setTheme)}
          <button className="panel-btn" onClick={reset}>Repor o protótipo</button>
          <button className="panel-btn tweaks-back" onClick={() => setOpen(false)}>Voltar ao fluxo</button>
          <p className="panel-note">Abre com um gesto da margem direita para a esquerda, ou com a tecla T. Esc fecha; com os ajustes fechados, Esc repõe. Todos os números vêm do planeador.</p>
        </div>
      </aside>
    </main>
  )
}
