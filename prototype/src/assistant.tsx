// The app around the assistant: bank pages with Ask AI asleep on top, and the assistant itself with chat threads.
// Threads: start screen (root) · open a chat · rename · delete · clear all · back to the start. Each thread keeps its
// own conversation; account facts (Holiday goal, card frozen) live here so every thread and every page agrees.
// Ask AI modes on Home: rest · alert (dismissible, with Undo) · processing · ready. State diagrams: design/STATES.md.
import { useEffect, useRef, useState } from 'react'
import { Button, Icon, PromptBox } from './components'
import { Conversation, INTENT, SAVE, SHORTCUTS, type Autostart, type Choice, type Goal, type ThreadStatus } from './conversation'
import { GOAL, day, eur, plan } from './planner'
import { AppScreens, BottomSheet, Sheet, type PillProps, type Tab } from './shell'
import { AiOrb } from './orb'
import { SearchScreen } from './search'

export type Trigger = 'rest' | 'alert' | 'processing'
type Thread = { id: string; title: string; autostart?: Autostart }

const titleFor = (a: Autostart) =>
  a.proactive === 'spending' ? 'Resumo ago–out'
    : a.image || /mensagem|sms|burla|message|scam/i.test(a.text ?? '') ? 'Verificação de mensagem'
    : /para onde foi|onde.*dinheiro|gast|where.*money/i.test(a.text ?? '') ? 'Para onde foi o dinheiro'
    : /poup|férias|viagem|€|sav|holiday/i.test(a.text ?? '') ? 'Plano de férias'
    : (a.text ?? 'Nova conversa').slice(0, 28)

let seq = 0
const newId = () => `t${++seq}`

export function Assistant({ startClosed, trigger = 'rest' }: { startClosed: boolean; trigger?: Trigger }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, ThreadStatus>>({})
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [rootInput, setRootInput] = useState('')
  const [tab, setTab] = useState<Tab>('home')
  // account
  const [goal, setGoal] = useState<Goal | null>(null)
  const [frozen, setFrozen] = useState(false)
  const [highlight, setHighlight] = useState(false)
  const [toast, setToast] = useState<null | { text: string; action?: string; onAction?: () => void }>(null)
  // entry
  const [locked, setLocked] = useState(startClosed)
  const [alert, setAlert] = useState(trigger === 'alert')
  const started = useRef(false)

  const planThreadId = threads.find((t) => status[t.id]?.hasPlan)?.id ?? null
  const startThread = (a: Autostart, show = true) => {
    const t = { id: newId(), title: titleFor(a), autostart: a }
    setThreads((x) => [t, ...x]); setActiveId(t.id)
    if (show) setOpen(true)
    return t.id
  }
  // "Save for something" never starts a second plan: it opens the chat that owns it.
  const shortcut = (s: string) => {
    if ((s === SAVE || s === 'O teu plano de férias') && planThreadId) { setActiveId(planThreadId); return }
    startThread({ text: s })
  }
  const openThread = (id: string) => { setActiveId(id); setHistoryOpen(false); setOpen(true) }
  const toRoot = () => { setActiveId(null); setHistoryOpen(false) }
  const remove = (id: string) => { setThreads((x) => x.filter((t) => t.id !== id)); setStatus((s) => { const n = { ...s }; delete n[id]; return n }); if (activeId === id) setActiveId(null) }
  const clearAll = () => { setThreads([]); setStatus({}); setActiveId(null); setHistoryOpen(false) }
  const rename = (id: string, title: string) => { setThreads((x) => x.map((t) => t.id === id ? { ...t, title: title.trim() || t.title } : t)); setRenaming(null) }
  const onStatus = (id: string, s: ThreadStatus) => setStatus((x) => ({ ...x, [id]: s }))

  // ---------- plan set (from the review → Face ID → Done in a thread) ----------
  const onPlanSet = (g: { monthly: number; choice: Choice }) => {
    setGoal({ ...g, paused: false }); setOpen(false); setTab('home'); setHighlight(true); setTimeout(() => setHighlight(false), 2400)
    const q = plan(g.monthly, g.choice === 'september' ? 'september' : 'july')
    setToast({ text: `Plano criado. Primeira transferência a ${day(q.transfers[0])}`, action: 'Anular', onAction: () => { setGoal(null); setToast({ text: 'Plano cancelado. Nada vai sair da conta.' }) } })
  }
  const goalCard = goal ? (() => {
    const q = plan(goal.monthly, goal.choice === 'september' ? 'september' : 'july')
    const target = goal.choice === 'trim' ? Math.floor(plan(goal.monthly).total / 100) * 100 : GOAL
    return {
      saved: 0, goal: target, highlight, onAsk: planThreadId ? () => openThread(planThreadId) : undefined,
      status: goal.paused ? { kind: 'warning' as const, label: 'Em pausa' } : { kind: 'positive' as const, label: 'Ativo' },
      line: goal.paused ? 'Plano em pausa. Sem transferências até retomares.' : `Próxima transferência ${day(q.transfers[0])} · ${eur(goal.monthly, 2)} · até ${day(q.transfers[q.transfers.length - 1], true)}`,
    }
  })() : null

  // ---------- Ask AI modes ----------
  const busyThread = threads.find((t) => status[t.id]?.busy)
  const unseenThread = threads.find((t) => status[t.id]?.unseen)
  function dismissAlert() { setAlert(false); setToast({ text: 'Dispensado. Fica na IA para quando quiseres.', action: 'Anular', onAction: () => { setAlert(true); setToast(null) } }) }
  const pill: PillProps =
    alert && !open ? { state: 'nudge', label: 'O teu resumo de ago–out está pronto', action: 'Ver', onDismiss: dismissAlert }
      : busyThread && !open ? { state: 'working', label: `A trabalhar: ${busyThread.title}` }
      : unseenThread && !open ? { state: 'ready', label: `Pronto: ${unseenThread.title}`, action: 'Abrir' }
      : { state: 'idle' }
  const openFromPill = () => {
    if (alert) { setAlert(false); startThread({ proactive: 'spending' }); return }
    if (unseenThread) setActiveId(unseenThread.id)
    setOpen(true)
  }
  useEffect(() => { if (trigger === 'processing' && !started.current && !startClosed) { started.current = true; startThread({ text: INTENT }, false) } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const unlock = () => { setLocked(false); setTimeout(() => startThread({ proactive: 'spending' }), 450) }

  if (locked) return (
    <div className="lock" data-theme="dark">
      <div className="statusbar"><span /></div>
      <div className="lock-clock"><span className="muted">segunda-feira, 2 de novembro</span><span className="lock-time">9:41</span></div>
      <div className="lock-stack">
        <button className="notification" onClick={unlock}>
          <span className="row-between"><span className="row-gap"><AiOrb size={20} /><span className="caption muted">IA · o teu banco</span></span><span className="caption muted">agora</span></span>
          <span className="body-strong">Para onde foi o teu dinheiro</span>
          <span>O teu resumo de agosto a outubro está pronto.</span>
        </button>
        <p className="caption muted center">Os valores ficam ocultos no ecrã de bloqueio.</p>
      </div>
    </div>
  )

  const active = threads.find((t) => t.id === activeId)
  const account = { goal, frozen, planThreadId }
  const actions = { setFrozen, setPaused: (v: boolean) => setGoal((g) => g && { ...g, paused: v }), onPlanSet, openThread }
  const recent = threads.slice(0, 4)

  return (
    <div className="app-launch">
      <AppScreens tab={tab} onTab={setTab} pill={pill} toast={toast} onOpen={openFromPill} goal={goalCard}
        frozen={frozen} onFreeze={() => setFrozen((f) => !f)} onPlanWithAI={() => shortcut(SAVE)} onSearch={() => setSearching(true)} />
      {searching && <SearchScreen onClose={() => setSearching(false)} onGo={(t) => { setSearching(false); setTab(t) }}
        onAsk={(q) => { setSearching(false); shortcut(q); setOpen(true) }} />}
      <Sheet open={open} onClose={() => setOpen(false)} title={active ? active.title : undefined} busy={!!(active && status[active.id]?.busy)} onHistory={() => setHistoryOpen(true)}>
        {/* Root: the start of every chat */}
        <div className="thread" style={{ display: active ? 'none' : 'flex' }}>
          <div className="conversation">
            <div className="empty">
              <span className="hero-orb"><AiOrb size={72} label="Assistente de IA" /></span>
              <h1 className="root-title">{goal ? 'O teu plano está ativo. E agora?' : 'Em que posso ajudar?'}</h1>
              <p className="trust-line"><Icon name="lock" size={14} />Leio a tua conta à ordem dos últimos 3 meses. Nada se move sem a tua aprovação.</p>
              {SHORTCUTS.map(([t, s]) => {
                const label = t === SAVE && planThreadId ? 'O teu plano de férias' : t
                const sub = t === SAVE && goal ? (goal.paused ? 'Em pausa' : `${eur(goal.monthly)} por mês, ativo`) : t === SAVE && planThreadId ? 'Rascunho, ainda não aprovado' : s
                const icon = t === SAVE ? 'target' : t === SHORTCUTS[1][0] ? 'chart' : 'shield'
                return <button key={t} className="shortcut-card" onClick={() => shortcut(label)}><span className="lead-icon"><Icon name={icon} size={18} /></span><span className="stack"><span className="body-strong">{label}</span><span className="caption muted">{sub}</span></span><Icon name="chevron" /></button>
              })}
              {recent.length > 0 && <>
                <div className="row-between section-head"><span className="label muted">Conversas recentes</span><button className="link" onClick={() => setHistoryOpen(true)}>Ver todas</button></div>
                {recent.map((t) => <button key={t.id} className="list-row compact" onClick={() => setActiveId(t.id)}><span className="stack"><span className="body-strong">{t.title}</span><span className="caption muted one-line">{status[t.id]?.busy ? 'A trabalhar…' : status[t.id]?.preview || ' '}</span></span><Icon name="chevron" /></button>)}
              </>}
            </div>
          </div>
          <div className="input-dock">
            <PromptBox value={rootInput} onChange={setRootInput} transcript={() => INTENT}
              onSend={(img) => { const text = rootInput.trim(); setRootInput(''); if (img) startThread({ image: img.url }); else if (text) shortcut(text) }} />
          </div>
        </div>
        {threads.map((t) => (
          <Conversation key={t.id} id={t.id} active={t.id === activeId} visible={open && t.id === activeId} autostart={t.autostart}
            account={account} actions={actions} onStatus={onStatus} />
        ))}
        {historyOpen && (
          <BottomSheet label="Conversas" onScrim={() => { setHistoryOpen(false); setRenaming(null) }}>
            <div className="row-between"><h2 className="title">Conversas</h2><Button kind="secondary" onClick={toRoot}><Icon name="plus" size={16} />Nova conversa</Button></div>
            {threads.length === 0 ? <p className="muted">Ainda não há conversas. Começa por um atalho ou escreve uma pergunta.</p> : (
              <ul className="thread-list">
                {threads.map((t) => (
                  <li key={t.id} className={t.id === activeId ? 'on' : ''}>
                    {renaming === t.id
                      ? <input className="rename" autoFocus defaultValue={t.title} aria-label="Nome da conversa" onBlur={(e) => rename(t.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') rename(t.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') { e.stopPropagation(); setRenaming(null) } }} />
                      : <button className="thread-open" onClick={() => openThread(t.id)}><span className="body-strong">{t.title}</span><span className="caption muted one-line">{status[t.id]?.busy ? 'A trabalhar…' : status[t.id]?.preview || ' '}</span></button>}
                    <button className="icon-btn small" aria-label={`Mudar o nome de ${t.title}`} onClick={() => setRenaming(t.id)}><Icon name="pencil" size={16} /></button>
                    <button className="icon-btn small" aria-label={`Apagar ${t.title}`} onClick={() => remove(t.id)}><Icon name="trash" size={16} /></button>
                  </li>
                ))}
              </ul>
            )}
            {threads.length > 0 && <Button kind="tertiary" onClick={clearAll}>Apagar todas as conversas</Button>}
            <p className="caption muted">Apagar uma conversa não desfaz nada que tenhas aprovado nela.</p>
          </BottomSheet>
        )}
      </Sheet>
    </div>
  )
}
