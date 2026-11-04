// The app around the assistant: bank pages with Ask AI asleep on top, and the assistant itself with chat threads.
// Threads: start screen (root) · open a chat · rename · delete · clear all · back to the start. Each thread keeps its
// own conversation; account facts (Holiday goal, card frozen) live here so every thread and every page agrees.
// Ask AI modes on Home: rest · alert (dismissible, with Undo) · processing · ready. State diagrams: design/STATES.md.
import { useEffect, useRef, useState } from 'react'
import { Button, Icon, PromptBox } from './components'
import { Conversation, INTENT, SHORTCUTS, type Autostart, type Choice, type Goal, type ThreadStatus } from './conversation'
import { GOAL, day, eur, plan } from './planner'
import { AppScreens, BottomSheet, Sheet, type PillProps, type Tab } from './shell'
import { AiOrb } from './orb'

export type Trigger = 'rest' | 'alert' | 'processing'
type Thread = { id: string; title: string; autostart?: Autostart }

const titleFor = (a: Autostart) =>
  a.proactive === 'spending' ? 'Aug–Oct summary'
    : a.image || /message|sms|scam|mensagem/i.test(a.text ?? '') ? 'Message check'
    : /where.*money|spen[dt]|money go/i.test(a.text ?? '') ? 'Where my money went'
    : /sav|holiday|trip|férias|€/i.test(a.text ?? '') ? 'Holiday plan'
    : (a.text ?? 'New chat').slice(0, 28)

let seq = 0
const newId = () => `t${++seq}`

export function Assistant({ startClosed, trigger = 'rest' }: { startClosed: boolean; trigger?: Trigger }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, ThreadStatus>>({})
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
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
    if (/^save for something$|^your holiday plan$/i.test(s) && planThreadId) { setActiveId(planThreadId); return }
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
    setToast({ text: `Plan set. First transfer ${day(q.transfers[0])}`, action: 'Undo', onAction: () => { setGoal(null); setToast({ text: 'Plan cancelled. Nothing will move.' }) } })
  }
  const goalCard = goal ? (() => {
    const q = plan(goal.monthly, goal.choice === 'september' ? 'september' : 'july')
    const target = goal.choice === 'trim' ? Math.floor(plan(goal.monthly).total / 100) * 100 : GOAL
    return {
      saved: 0, goal: target, highlight, onAsk: planThreadId ? () => openThread(planThreadId) : undefined,
      status: goal.paused ? { kind: 'warning' as const, label: 'Paused' } : { kind: 'positive' as const, label: 'Active' },
      line: goal.paused ? 'Plan paused. No transfers until you resume.' : `Next transfer ${day(q.transfers[0])} · ${eur(goal.monthly, 2)} · by ${day(q.transfers[q.transfers.length - 1], true)}`,
    }
  })() : null

  // ---------- Ask AI modes ----------
  const busyThread = threads.find((t) => status[t.id]?.busy)
  const unseenThread = threads.find((t) => status[t.id]?.unseen)
  function dismissAlert() { setAlert(false); setToast({ text: 'Dismissed. It’s in Ask AI when you want it.', action: 'Undo', onAction: () => { setAlert(true); setToast(null) } }) }
  const pill: PillProps =
    alert && !open ? { state: 'nudge', label: 'Your Aug–Oct summary is ready', action: 'View', onDismiss: dismissAlert }
      : busyThread && !open ? { state: 'working', label: `Working on: ${busyThread.title}` }
      : unseenThread && !open ? { state: 'ready', label: `Ready: ${unseenThread.title}`, action: 'Open' }
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
      <div className="lock-clock"><span className="muted">Monday 2 November</span><span className="lock-time">9:41</span></div>
      <div className="lock-stack">
        <button className="notification" onClick={unlock}>
          <span className="row-between"><span className="row-gap"><AiOrb size={20} /><span className="caption muted">AI · your bank</span></span><span className="caption muted">now</span></span>
          <span className="body-strong">Where your money went</span>
          <span>Your summary for August to October is ready.</span>
        </button>
        <p className="caption muted center">Amounts are hidden on the lock screen.</p>
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
        frozen={frozen} onFreeze={() => setFrozen((f) => !f)} onPlanWithAI={() => shortcut('Save for something')} />
      <Sheet open={open} onClose={() => setOpen(false)} title={active ? active.title : undefined} busy={!!(active && status[active.id]?.busy)} onHistory={() => setHistoryOpen(true)}>
        {/* Root: the start of every chat */}
        <div className="thread" style={{ display: active ? 'none' : 'flex' }}>
          <div className="conversation">
            <div className="empty">
              <span className="hero-orb"><AiOrb size={88} label="AI assistant" /></span>
              <h1 className="title">{goal ? 'Your plan is set. What next?' : 'What can I help with?'}</h1>
              <p className="muted">I can read your current account for the last 3 months. Nothing moves without your approval.</p>
              {SHORTCUTS.map(([t, s]) => {
                const label = t === 'Save for something' && planThreadId ? 'Your holiday plan' : t
                const sub = t === 'Save for something' && goal ? (goal.paused ? 'Paused' : `${eur(goal.monthly)} a month, active`) : t === 'Save for something' && planThreadId ? 'Draft, not approved yet' : s
                return <button key={t} className="list-row" onClick={() => shortcut(label)}><span className="stack"><span className="body-strong">{label}</span><span className="caption muted">{sub}</span></span><Icon name="chevron" /></button>
              })}
              {recent.length > 0 && <>
                <div className="row-between section-head"><span className="label muted">Recent chats</span><button className="link" onClick={() => setHistoryOpen(true)}>See all</button></div>
                {recent.map((t) => <button key={t.id} className="list-row compact" onClick={() => setActiveId(t.id)}><span className="stack"><span className="body-strong">{t.title}</span><span className="caption muted one-line">{status[t.id]?.busy ? 'Working…' : status[t.id]?.preview || ' '}</span></span><Icon name="chevron" /></button>)}
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
          <BottomSheet label="Chats" onScrim={() => { setHistoryOpen(false); setRenaming(null) }}>
            <div className="row-between"><h2 className="title">Chats</h2><Button kind="secondary" onClick={toRoot}><Icon name="plus" size={16} />New chat</Button></div>
            {threads.length === 0 ? <p className="muted">No chats yet. Start one from the shortcuts or type a question.</p> : (
              <ul className="thread-list">
                {threads.map((t) => (
                  <li key={t.id} className={t.id === activeId ? 'on' : ''}>
                    {renaming === t.id
                      ? <input className="rename" autoFocus defaultValue={t.title} aria-label="Chat name" onBlur={(e) => rename(t.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') rename(t.id, (e.target as HTMLInputElement).value); if (e.key === 'Escape') { e.stopPropagation(); setRenaming(null) } }} />
                      : <button className="thread-open" onClick={() => openThread(t.id)}><span className="body-strong">{t.title}</span><span className="caption muted one-line">{status[t.id]?.busy ? 'Working…' : status[t.id]?.preview || ' '}</span></button>}
                    <button className="icon-btn small" aria-label={`Rename ${t.title}`} onClick={() => setRenaming(t.id)}><Icon name="pencil" size={16} /></button>
                    <button className="icon-btn small" aria-label={`Delete ${t.title}`} onClick={() => remove(t.id)}><Icon name="trash" size={16} /></button>
                  </li>
                ))}
              </ul>
            )}
            {threads.length > 0 && <Button kind="tertiary" onClick={clearAll}>Clear all chats</Button>}
            <p className="caption muted">Deleting a chat doesn’t undo anything you approved in it.</p>
          </BottomSheet>
        )}
      </Sheet>
    </div>
  )
}
