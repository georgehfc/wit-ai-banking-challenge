// The app around the assistant: bank pages with Ask AI asleep on top, and the assistant itself with chat threads.
// Threads: start screen (root) · open a chat · rename · delete · clear all · back to the start. Each thread keeps its
// own conversation; account facts (Holiday goal, card frozen) live here so every thread and every page agrees.
// Ask AI modes on Home: rest · alert (dismissible, with Undo) · processing · ready. State diagrams: design/STATES.md.
import { useEffect, useRef, useState } from 'react'
import { Button, Icon, PromptBox, Row } from './components'
import ines from '../../data/ines.json' with { type: 'json' }
const account_last4 = ines.accounts[0].iban_display.slice(-4)
import { CREDIT_Q, Conversation, INTENT, SAVE, SHORTCUTS, type Autostart, type Choice, type Goal, type ThreadStatus } from './conversation'
import out from '../../data/plan-output.json' with { type: 'json' }
import { GOAL, day, eur, plan } from './planner'
import { AppScreens, BottomSheet, Sheet, type PillProps, type Tab, type TxItem } from './shell'
import { AiOrb } from './orb'
import { SearchScreen } from './search'

export type Trigger = 'rest' | 'alert' | 'processing'
// Journeys selectable from the prototype tweaks: J0 first use (default on landing) leads into J1, the core; J2–J4 start from a preset account state.
export type Journey = 'j0' | 'j1' | 'j2' | 'j3' | 'j4'
const J2 = out.scenarios.j2_christmas_lands, J3 = out.scenarios.j3_off_track_month
const PRESET_GOAL: Goal = { monthly: out.scenarios.j1_chosen.monthly, choice: 'september', paused: false }
type Thread = { id: string; title: string; autostart?: Autostart }

const titleFor = (a: Autostart) =>
  a.proactive === 'spending' ? 'Resumo ago–out'
    : a.proactive === 'christmas' ? 'Subsídio de Natal'
    : a.proactive === 'shortmonth' ? 'Janeiro'
    : /emprest|cr[ée]dito/i.test(a.text ?? '') ? 'Crédito'
    : a.image || /mensagem|sms|burla|message|scam/i.test(a.text ?? '') ? 'Verificação de mensagem'
    : /para onde foi|onde.*dinheiro|gast|where.*money/i.test(a.text ?? '') ? 'Para onde foi o dinheiro'
    : /poup|férias|viagem|€|sav|holiday/i.test(a.text ?? '') ? 'Plano de férias'
    : (a.text ?? 'Nova conversa').slice(0, 28)

let seq = 0
const newId = () => `t${++seq}`

export function Assistant({ startClosed, trigger = 'rest', journey = 'j0' }: { startClosed: boolean; trigger?: Trigger; journey?: Journey }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState<Record<string, ThreadStatus>>({})
  const [open, setOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [voice, setVoice] = useState(0)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [rootInput, setRootInput] = useState('')
  const [tab, setTab] = useState<Tab>('home')
  // account
  const [goal, setGoal] = useState<Goal | null>(journey === 'j2' ? { ...PRESET_GOAL, saved: J2.goal_saved_before, note: `${eur(J2.to_goal)} à espera da tua aprovação` } : journey === 'j3' ? { ...PRESET_GOAL, saved: J3.saved_now, note: `Os ${eur(J3.transfer)} de 1 jan iam mexer na tua reserva`, badge: { kind: 'warning', label: 'Curto este mês' } } : null)
  const [consent, setConsent] = useState<'none' | 'intro' | 'asking' | 'granted' | 'declined'>(journey === 'j0' ? 'none' : 'granted')
  const [recentOverride, setRecentOverride] = useState<TxItem[] | undefined>(journey === 'j2' ? [{ initial: 'S', title: 'Subsídio de Natal · Agência Lumen', sub: 'Hoje, 9:12', amount: J2.allowance }] : journey === 'j3' ? [{ initial: 'W', title: `${J3.bill.merchant} · ${J3.bill.label.toLowerCase()}`, sub: day(J3.bill.paid), amount: -J3.bill.amount }] : undefined)
  const [frozen, setFrozen] = useState(false)
  const [highlight, setHighlight] = useState(false)
  const [toast, setToast] = useState<null | { text: string; action?: string; onAction?: () => void }>(null)
  // entry
  const [locked, setLocked] = useState(startClosed)
  const [alert, setAlert] = useState(journey === 'j2' || journey === 'j3' || (journey === 'j1' && trigger === 'alert'))
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
    // Saving is one conversation per person: reopen the chat that owns the plan (or the one already under way), never a second one.
    const saveThreadId = planThreadId ?? threads.find((t) => /poup|férias|save|holiday/i.test(t.autostart?.text ?? ''))?.id
    if ((s === SAVE || s === 'O teu plano de férias') && saveThreadId) { setActiveId(saveThreadId); setHistoryOpen(false); setOpen(true); return }
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
  const complete = (flow: 'j2' | 'j3', option?: string) => {
    setOpen(false); setTab('home'); setHighlight(true); setTimeout(() => setHighlight(false), 2400)
    if (flow === 'j2') {
      const before = goal
      setGoal((g) => g && { ...g, saved: J2.goal_saved_after, note: `Próxima transferência 1 jan · ${eur(J3.transfer, 2)}`, badge: undefined })
      setRecentOverride([{ initial: 'F', title: 'Para Férias', sub: 'Hoje, 9:13 · aprovado com Face ID', amount: -J2.to_goal }, { initial: 'S', title: 'Subsídio de Natal · Agência Lumen', sub: 'Hoje, 9:12', amount: J2.allowance }])
      setToast({ text: `${eur(J2.to_goal)} movidos para Férias`, action: 'Anular', onAction: () => { setGoal(before); setToast({ text: `Anulado. Os ${eur(J2.to_goal)} voltaram à conta à ordem.` }) } })
    } else {
      const spread = option === 'spread', before = goal
      setGoal((g) => g && { ...g, note: `1 jan saltado · próxima transferência 1 fev · ${eur(spread ? J3.options[1].new_monthly! : J3.transfer, 2)}`, badge: undefined })
      setToast({ text: 'Alteração guardada · podes anular até 1 jan', action: 'Anular', onAction: () => { setGoal(before); setToast({ text: 'Anulado. O plano voltou ao que era.' }) } })
    }
  }
  const goalCard = goal ? (() => {
    const q = plan(goal.monthly, goal.choice === 'september' ? 'september' : 'july')
    const target = goal.choice === 'trim' ? Math.floor(plan(goal.monthly).total / 100) * 100 : GOAL
    return {
      saved: goal.saved ?? 0, goal: target, highlight, onAsk: planThreadId ? () => openThread(planThreadId) : undefined,
      status: goal.paused ? { kind: 'warning' as const, label: 'Em pausa' } : goal.badge ?? { kind: 'positive' as const, label: 'Ativo' },
      line: goal.paused ? 'Plano em pausa. Sem transferências até retomares.' : goal.note ?? `Próxima transferência ${day(q.transfers[0])} · ${eur(goal.monthly, 2)} · até ${day(q.transfers[q.transfers.length - 1], true)}`,
    }
  })() : null

  // ---------- Ask AI modes ----------
  const busyThread = threads.find((t) => status[t.id]?.busy)
  const unseenThread = threads.find((t) => status[t.id]?.unseen)
  function dismissAlert() { setAlert(false); setToast({ text: 'Dispensado. Fica na IA para quando quiseres.', action: 'Anular', onAction: () => { setAlert(true); setToast(null) } }) }
  const pill: PillProps =
    alert && !open ? { state: 'nudge', label: journey === 'j2' ? `Subsídio de Natal: rever ${eur(J2.to_goal)}` : journey === 'j3' ? 'Janeiro: rever o plano' : 'Resumo de ago–out pronto', action: 'Ver', onDismiss: dismissAlert }
      : busyThread && !open ? { state: 'working', label: `A trabalhar: ${busyThread.title}` }
      : unseenThread && !open ? { state: 'ready', label: `Pronto: ${unseenThread.title}`, action: 'Abrir' }
      : { state: 'idle', onVoice: () => { setOpen(true); setTimeout(() => setVoice((v) => v + 1), 420) } }
  const openFromPill = () => {
    if (consent === 'none') { setConsent('intro'); return }
    if (alert) { setAlert(false); startThread({ proactive: journey === 'j2' ? 'christmas' : journey === 'j3' ? 'shortmonth' : 'spending' }); return }
    if (unseenThread) setActiveId(unseenThread.id)
    setOpen(true)
  }
  useEffect(() => {
    if (started.current || startClosed) return
    if (journey === 'j1' && trigger === 'processing') { started.current = true; startThread({ text: INTENT }, false) }
    if (journey === 'j4') { started.current = true; setTimeout(() => startThread({ text: CREDIT_Q }), 500) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const unlock = () => { setLocked(false); setAlert(false); setTimeout(() => startThread({ proactive: journey === 'j2' ? 'christmas' : journey === 'j3' ? 'shortmonth' : 'spending' }), 450) }
  const lockCopy = journey === 'j2' ? { date: 'terça-feira, 15 de dezembro', time: '9:12', title: 'O teu subsídio de Natal chegou', body: 'Toca para rever uma transferência para Férias.' }
    : journey === 'j3' ? { date: 'segunda-feira, 28 de dezembro', time: '18:40', title: 'Janeiro vai ficar apertado', body: 'Toca para rever o teu plano de férias.' }
    : { date: 'segunda-feira, 2 de novembro', time: '9:41', title: 'Para onde foi o teu dinheiro', body: 'O teu resumo de agosto a outubro está pronto.' }

  if (locked) return (
    <div className="lock" data-theme="dark">
      <div className="statusbar"><span /></div>
      <div className="lock-clock"><span className="muted">{lockCopy.date}</span><span className="lock-time">{lockCopy.time}</span></div>
      <div className="lock-stack">
        <button className="notification" onClick={unlock}>
          <span className="row-between"><span className="row-gap"><AiOrb size={20} /><span className="caption muted">IA · o teu banco</span></span><span className="caption muted">agora</span></span>
          <span className="body-strong">{lockCopy.title}</span>
          <span>{lockCopy.body}</span>
        </button>
        <p className="caption muted center">Os valores ficam ocultos no ecrã de bloqueio.</p>
      </div>
    </div>
  )

  const active = threads.find((t) => t.id === activeId)
  const account = { goal, frozen, planThreadId }
  const actions = { setFrozen, setPaused: (v: boolean) => setGoal((g) => g && { ...g, paused: v }), onPlanSet, openThread, complete }
  const recent = threads.slice(0, 4)

  return (
    <div className="app-launch">
      <AppScreens behind={open} tab={tab} onTab={setTab} pill={pill} toast={toast} onOpen={openFromPill} goal={goalCard}
        frozen={frozen} onFreeze={() => setFrozen((f) => !f)} onPlanWithAI={() => shortcut(SAVE)} onSearch={() => setSearching(true)}
        recent={recentOverride} masked={journey === 'j2' || journey === 'j3'} />
      {consent === 'intro' && (
        <BottomSheet label="Conhece a IA" onScrim={() => setConsent('none')}>
          <AiOrb size={48} />
          <h2 className="title">Conhece a IA</h2>
          <div className="intro-points"><div><p className="body-strong">Lê</p><p className="muted">A tua conta à ordem, só se deixares.</p></div><div><p className="body-strong">Faz as contas</p><p className="muted">Os números vêm do planeador do banco, não de palpites.</p></div><div><p className="body-strong">Tu decides</p><p className="muted">Nada se move sem o teu Face ID.</p></div></div>
          <p className="caption muted">Assistente de IA · pode cometer erros</p>
          <div className="actions"><Button kind="secondary" grow onClick={() => setConsent('none')}>Agora não</Button><Button grow onClick={() => { setConsent('asking'); setActiveId(null); setOpen(true) }}>Continuar</Button></div>
        </BottomSheet>
      )}
      <div className={`modal-status ${open ? 'on' : ''}`} aria-hidden="true"><span>9:41</span></div>
      {searching && <SearchScreen onClose={() => setSearching(false)} onGo={(t) => { setSearching(false); setTab(t) }}
        onAsk={(q) => { setSearching(false); shortcut(q); setOpen(true) }} />}
      <Sheet open={open} onClose={() => setOpen(false)} title={active ? active.title : undefined} busy={!!(active && status[active.id]?.busy)} onHistory={() => setHistoryOpen(true)}>
        {/* Root: the start of every chat */}
        <div className="thread" style={{ display: active ? 'none' : 'flex' }}>
          <div className="conversation">
            <div className="empty">
              <span className="hero-orb"><AiOrb size={72} label="Assistente de IA" /></span>
              <h1 className="root-title">{goal ? 'O teu plano está ativo. E agora?' : 'Em que posso ajudar?'}</h1>
              <p className="trust-line"><Icon name="lock" size={14} />{journey === 'j0' && consent === 'granted' ? 'Obrigado. Já posso ler a tua conta à ordem (ago–out) até 2 fev 2027. Nada se move sem a tua aprovação.' : consent === 'declined' ? 'Sem acesso à conta, só posso ajudar com perguntas gerais, como verificar uma mensagem.' : 'Leio a tua conta à ordem dos últimos 3 meses. Nada se move sem a tua aprovação.'}</p>
              {consent === 'declined' && <Button kind="secondary" onClick={() => setConsent('asking')}>Permitir acesso à conta</Button>}
              {SHORTCUTS.map(([t, s]) => {
                const needsData = consent === 'declined' && t !== SHORTCUTS[2][0]
                const label = t === SAVE && planThreadId ? 'O teu plano de férias' : t
                const sub = t === SAVE && goal ? (goal.paused ? 'Em pausa' : `${eur(goal.monthly)} por mês, ativo`) : t === SAVE && planThreadId ? 'Rascunho, ainda não aprovado' : s
                const icon = t === SAVE ? 'target' : t === SHORTCUTS[1][0] ? 'chart' : 'shield'
                return <button key={t} className="shortcut-card" onClick={() => needsData ? setConsent('asking') : shortcut(label)}><span className="lead-icon"><Icon name={icon} size={18} /></span><span className="stack"><span className="body-strong">{label}</span><span className="caption muted">{sub}</span></span><Icon name="chevron" /></button>
              })}
              {recent.length > 0 && <>
                <div className="row-between section-head"><span className="label muted">Conversas recentes</span><button className="link" onClick={() => setHistoryOpen(true)}>Ver todas</button></div>
                {recent.map((t) => <button key={t.id} className="list-row compact" onClick={() => setActiveId(t.id)}><span className="stack"><span className="body-strong">{t.title}</span><span className="caption muted one-line">{status[t.id]?.busy ? 'A trabalhar…' : status[t.id]?.preview || ' '}</span></span><Icon name="chevron" /></button>)}
              </>}
            </div>
          </div>
          <div className="input-dock">
            <PromptBox value={rootInput} onChange={setRootInput} transcript={() => INTENT} recordSignal={active ? undefined : voice}
              onSend={(img) => { const text = rootInput.trim(); setRootInput(''); if (img) startThread({ image: img.url }); else if (text) shortcut(text) }} />
          </div>
        </div>
        {threads.map((t) => (
          <Conversation key={t.id} id={t.id} active={t.id === activeId} visible={open && t.id === activeId} autostart={t.autostart}
            account={account} actions={actions} onStatus={onStatus} voice={voice} />
        ))}
        {consent === 'asking' && (
          <BottomSheet label="Consentimento" onScrim={() => setConsent('declined')}>
            <h2 className="title">Posso ler a tua conta à ordem?</h2>
            <p className="muted">Para ajudar com planos, leio a tua conta à ordem dos últimos 3 meses. Podes parar isto quando quiseres nas Definições.</p>
            <div className="card flat gap"><Row k="O quê" v="Saldo e movimentos" /><Row k="Conta" v={`Conta à ordem ··${account_last4}`} /><Row k="Período" v="Últimos 3 meses" /><Row k="Até" v="2 fev 2027" /><Row k="Nunca" v="Move dinheiro" /></div>
            <p className="caption muted">Nunca te peço códigos nem palavras-passe. Se alguém pedir, não somos nós.</p>
            <div className="actions"><Button kind="secondary" grow onClick={() => setConsent('declined')}>Agora não</Button><Button grow onClick={() => setConsent('granted')}>Permitir</Button></div>
          </BottomSheet>
        )}
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
