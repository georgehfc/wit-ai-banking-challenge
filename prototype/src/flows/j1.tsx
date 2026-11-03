// J1 · Save for the holiday (the core journey).
// Home → AI sheet: intent → steps → monthly picture → plan (adjust: state change) → gap (decision) → Review → Face ID → Confirmation → back on Home.
import { useState, type ReactNode } from 'react'
import out from '../../../data/plan-output.json' with { type: 'json' }
import ines from '../../../data/ines.json' with { type: 'json' }
import { AmountControl, AssistantMessage, Button, FaceId, GapResolver, Icon, MarginSnapshot, ProgressBar, ProjectionChart, ReplyChips, Row, StatusBadge, StepsReceipt, UserMessage, fitBadge, type PillState } from '../components'
import { BUFFER, CHRISTMAS, CHRISTMAS_DATE, GOAL, HOLIDAY_ALLOWANCE_DATE, NEEDED, SUGGESTED, day, eur, gapOptions, list, monthLong, plan, type Plan } from '../planner'
import { Home, Screen, Sheet, account, last4, savingsName } from '../shell'

export const INTENT = ines.intent.text_en

type Turn =
  | { kind: 'user'; text: string } | { kind: 'ai'; text: string } | { kind: 'fallback' }
  | { kind: 'ack' } | { kind: 'steps' } | { kind: 'snapshot' } | { kind: 'plan' } | { kind: 'gap' } | { kind: 'chosen' }
type Choice = 'irs' | 'september' | 'trim' | null
type Flow = { turns: Turn[]; monthly: number; adjusting: boolean; adjusted: boolean; choice: Choice; view: 'chat' | 'review' | 'faceid' | 'confirm'; stepsDone: boolean; paused: boolean }
const fresh = (): Flow => ({ turns: [], monthly: SUGGESTED, adjusting: false, adjusted: false, choice: null, view: 'chat', stepsDone: false, paused: false })

function finalPlan(f: Flow) {
  const p = plan(f.monthly, f.choice === 'september' ? 'september' : 'july')
  const goal = f.choice === 'trim' ? Math.floor(plan(f.monthly).total / 100) * 100 : GOAL
  const topup = f.choice === 'september' && p.gap > 0 ? p.gap : 0
  return { p, goal, topup }
}

// "€250 gets you to €2,600 by July, but it only fitted September…" (TONE.md: honest, plain)
function reaction(p: Plan) {
  const reached = p.gap <= 0
  const by = `${eur(p.monthly)} gets you to ${eur(p.total)} by July${reached ? ', the full goal' : ''}`
  const ok = p.okMonths.map(monthLong), short = p.shortMonths.map(monthLong)
  if (!short.length) return `${by}. It fitted every one of the last 3 months.`
  if (!ok.length) return `${by}. That’s more than you had left in any of the last 3 months.`
  return `${by}, but it only fitted ${list(ok)}. ${list(short)} would have been short.`
}

export function J1({ startOpen = false, intro, resumeWorking = false }: { startOpen?: boolean; intro?: string; resumeWorking?: boolean }) {
  const [f, setF] = useState<Flow>(() => resumeWorking ? { ...fresh(), turns: [{ kind: 'user', text: INTENT }, { kind: 'ack' }, { kind: 'steps' }] } : fresh())
  const [open, setOpen] = useState(startOpen)
  const [input, setInput] = useState('')
  const [goalOn, setGoalOn] = useState(false)
  const [highlight, setHighlight] = useState(false)
  const [toast, setToast] = useState<null | { text: string; action?: string; onAction?: () => void }>(null)
  const set = (u: Partial<Flow> | ((f: Flow) => Partial<Flow>)) => setF((x) => ({ ...x, ...(typeof u === 'function' ? u(x) : u) }))
  const push = (...t: Turn[]) => set((x) => ({ turns: [...x.turns, ...t] }))
  const p = plan(f.monthly)
  const fp = finalPlan(f)

  // Chat and controls are one state: "make it 250" moves the slider; the slider changes the card the chat refers to.
  const send = (raw = input) => {
    const text = raw.trim(); setInput('')
    if (!text) return
    const hasPlan = f.turns.some((t) => t.kind === 'plan')
    const n = Number((text.match(/\d{2,4}/) ?? [])[0])
    if (!hasPlan && !f.turns.some((t) => t.kind === 'steps')) {
      if (/sav|poup|holiday|férias|trip|€|\d/i.test(text)) set((x) => ({ turns: [...x.turns, { kind: 'user', text }, { kind: 'ack' }, { kind: 'steps' }] }))
      else push({ kind: 'user', text }, { kind: 'fallback' })
      return
    }
    if (hasPlan && n >= 100 && n <= 500 && !f.choice) {
      const v = Math.round(n / 10) * 10
      set((x) => ({ monthly: v, adjusting: true, adjusted: true, turns: [...x.turns, { kind: 'user', text }, { kind: 'ai', text: `Done, I moved it to ${eur(v)} a month. The plan above has the new numbers.` }] }))
      return
    }
    push({ kind: 'user', text }, { kind: 'ai', text: hasPlan ? 'I can change the monthly amount or look at the gap with you. Try “make it €250”.' : 'One moment, I’m still working out your plan.' })
  }

  const pill: { state: PillState; label?: string; action?: string } =
    !f.turns.length || goalOn ? { state: 'idle' }
      : f.turns.some((t) => t.kind === 'steps') && !f.turns.some((t) => t.kind === 'plan') ? { state: 'working', label: 'Working on your holiday plan…' }
      : f.turns.some((t) => t.kind === 'plan') ? { state: 'ready', label: 'Your holiday plan is ready', action: 'Open' } : { state: 'idle' }

  const done = () => {
    setOpen(false); setGoalOn(true); setHighlight(true); setTimeout(() => setHighlight(false), 2400)
    setToast({ text: 'Plan set · AI will ask on 15 Dec', action: 'Undo', onAction: () => { setGoalOn(false); setF(fresh()); setToast({ text: 'Plan cancelled. Nothing will move.' }) } })
  }
  const askAbout = () => { push({ kind: 'ai', text: `Your Holiday plan is ${f.paused ? 'paused' : 'active'}: ${eur(f.monthly)} a month from ${day(fp.p.transfers[0])}. What would you like to change?` }); set({ view: 'chat' }); setOpen(true) }

  const render = (t: Turn, i: number): ReactNode => {
    switch (t.kind) {
      case 'user': return <UserMessage key={i}>{t.text}</UserMessage>
      case 'ai': return <AssistantMessage key={i} text={t.text} />
      case 'fallback': return (
        <AssistantMessage key={i} text="I’m not sure I got that. Here’s what I can help with:">
          <ReplyChips items={[{ label: 'Save for something', onClick: () => send(INTENT) }, { label: 'Where did my money go?', onClick: () => push({ kind: 'user', text: 'Where did my money go?' }, { kind: 'ai', text: 'That one isn’t in this prototype yet. Try saving for something.' }) }]} />
        </AssistantMessage>
      )
      case 'ack': return <AssistantMessage key={i} text="Let’s see what fits. I’ll look at your account, Aug–Oct." />
      case 'steps': return <StepsReceipt key={i} steps={[{ label: 'Read your current account, Aug–Oct', role: 'Data' }, { label: 'Worked out your monthly picture', role: 'Planner' }, { label: 'Checked the plan against your buffer', role: 'Rules' }]}
        onDone={() => { if (f.stepsDone) return; set({ stepsDone: true }); setTimeout(() => push({ kind: 'snapshot' }), 250); setTimeout(() => push({ kind: 'plan' }), 1100) }} />
      case 'snapshot': return <AssistantMessage key={i} text={`After rent, bills and spending, you had ${eur(out.margin.min)} to ${eur(out.margin.max)} left each month.`}><MarginSnapshot months={out.picture} /></AssistantMessage>
      case 'plan': return (
        <AssistantMessage key={i} text={`You keep ${eur(BUFFER)} as a buffer; I won’t touch it. The full ${eur(GOAL)} by July needs ${eur(NEEDED)} a month, more than you had left in any month.`}>
          <div className="card plan-card">
            <div className="row-between"><span className="label muted">Holiday plan</span>{fitBadge(p)}</div>
            <div className="row-baseline"><span className="amount">{eur(f.monthly)}</span><span className="muted">a month</span></div>
            <p>+ {eur(CHRISTMAS)} Christmas allowance, {day(CHRISTMAS_DATE)}</p>
            {f.adjusting && <AmountControl value={f.monthly} min={150} max={NEEDED} presets={[150, SUGGESTED, 250, 280]} total={`${eur(p.total)} by July`} onChange={(v) => set({ monthly: v, adjusted: true })} />}
            <ProjectionChart p={p} />
            <div className="row-between result">
              <span className="stack"><span className="amount-sm">{eur(p.total)} by July</span><span className="caption muted">{f.monthly === SUGGESTED ? 'Calculated by the planner' : `was ${eur(plan(SUGGESTED).total)} at ${eur(SUGGESTED)}`}</span></span>
              {p.gap > 0 ? <span className="stack end"><span className="amount-sm warn">Gap {eur(p.gap)}</span><span className="caption muted">of {eur(GOAL)} goal · dashed</span></span>
                : <span className="stack end"><span className="amount-sm pos">Goal reached</span></span>}
            </div>
            {!f.choice && <div className="actions">
              <Button kind="secondary" grow onClick={() => set({ adjusting: !f.adjusting })}>{f.adjusting ? 'Done adjusting' : 'Adjust amount'}</Button>
              {p.gap > 0 ? <Button grow onClick={() => { set({ adjusting: false }); if (!f.turns.some((x) => x.kind === 'gap')) push({ kind: 'user', text: 'Let’s look at the gap.' }, { kind: 'gap' }) }}>Look at the gap</Button>
                : <Button grow onClick={() => set({ view: 'review', adjusting: false })}>Review plan</Button>}
            </div>}
          </div>
          {f.adjusted && <p aria-live="polite">{reaction(p)}</p>}
        </AssistantMessage>
      )
      case 'gap': return (
        <AssistantMessage key={i} text={`At ${eur(f.monthly)} a month that leaves ${eur(p.gap)}. Here are three ways to look at it. I won’t pick for you.`}>
          <GapResolver gap={p.gap} options={gapOptions(p)} picked={f.choice} onPick={(id) => {
            const first = !f.choice
            set({ choice: id })
            if (first) push({ kind: 'user', text: id === 'september' ? 'September. I’ll add the rest from my holiday allowance in June.' : id === 'trim' ? `Let’s make it a ${eur(Math.floor(p.total / 100) * 100)} trip.` : 'Count my IRS refund if it comes.' }, { kind: 'chosen' })
          }} />
        </AssistantMessage>
      )
      case 'chosen': {
        const { p: q, goal, topup } = fp
        const text = f.choice === 'september'
          ? `Got it: ${eur(q.total)} by ${day(q.transfers[q.transfers.length - 1])}${topup ? `, plus ${eur(topup)} of your holiday allowance (${day(HOLIDAY_ALLOWANCE_DATE)}) makes ${eur(GOAL)}. I’ll ask before moving that ${eur(topup)}.` : '. That reaches your goal.'}`
          : f.choice === 'trim' ? `Got it: a ${eur(goal)} trip, reached by July on this plan.`
          : `OK. I’ll plan for July without counting it, and tell you if a refund lands. If it’s at least ${eur(p.gap)}, you’re there.`
        return <AssistantMessage key={i} text={text}><Button onClick={() => set({ view: 'review' })}>Review plan</Button></AssistantMessage>
      }
    }
  }

  const first = fp.p.transfers[0], lastT = fp.p.transfers[fp.p.transfers.length - 1]
  const overlay = f.view === 'chat' ? null : f.view === 'confirm' ? (
    <Screen label="Plan confirmed" dock={<div className="actions"><Button grow onClick={done}>Done</Button></div>}>
      <span className="success"><Icon name="check" size={28} /></span>
      <h1 className="title center">Your plan is set</h1>
      <p className="caption muted center">Approved with Face ID · just now</p>
      <div className="card">
        <div className="row-between"><span className="amount-sm">{eur(0)} of {eur(fp.goal)}</span>{f.paused ? <StatusBadge kind="warning">Paused</StatusBadge> : <StatusBadge kind="positive">Active</StatusBadge>}</div>
        <ProgressBar value={0} />
        <p className="caption muted">By {day(lastT, true)} · {eur(fp.p.total)} from transfers{fp.topup ? ` + ${eur(fp.topup)} holiday allowance` : ''}</p>
        <hr />
        <Row k="Next transfer" v={f.paused ? 'Paused' : `${day(first)} · ${eur(fp.p.monthly, 2)}`} />
        <div className="actions"><Button kind="secondary" grow onClick={() => set({ paused: !f.paused })}>{f.paused ? 'Resume plan' : 'Pause plan'}</Button></div>
      </div>
      <div className="card flat"><span className="label accent">{day(CHRISTMAS_DATE)}</span><p>I’ll ask about moving {eur(CHRISTMAS)} of your Christmas allowance. Nothing moves without you.</p></div>
    </Screen>
  ) : (
    <Screen label="Review your plan" title="Review your plan" sub="Drafted by AI · you approve" onBack={() => set({ view: 'chat' })}
      dock={<><p className="caption muted">Nothing moves until you approve. Calculated by the planner.</p>
        <div className="actions">
          <Button kind="secondary" grow onClick={() => { set({ view: 'chat' }); push({ kind: 'ai', text: 'No problem. Nothing has moved. The plan stays here when you want it.' }) }}>Not now</Button>
          <Button grow onClick={() => set({ view: 'faceid' })}>Approve with Face ID</Button>
        </div></>}>
      <h1 className="title">Move {eur(fp.p.monthly)} every month from {account.name} to Holiday, from {day(first, true)} to {day(lastT, true)}.</h1>
      <div className="card">
        <Row k="Amount" v={`${eur(fp.p.monthly, 2)} a month`} strong />
        <Row k="From" v={`${account.name} ··${last4}`} />
        <Row k="To" v={`Holiday · ${savingsName}`} />
        <hr />
        <Row k="First transfer" v={day(first, true)} />
        <Row k="Last transfer" v={day(lastT, true)} />
        <Row k="Transfers" v={`${fp.p.transfers.length} · ${eur(fp.p.scheduledTotal, 2)} in total`} />
      </div>
      <div className="not-included">
        <span className="label muted">Not part of this approval</span>
        <div className="info-row"><span className="tag">{day(CHRISTMAS_DATE)}</span><span className="stack"><span className="body-strong">{eur(CHRISTMAS)} of your Christmas allowance</span><span className="caption muted">I’ll ask you when it lands.</span></span></div>
        {fp.topup > 0 && <div className="info-row"><span className="tag">{day(HOLIDAY_ALLOWANCE_DATE)}</span><span className="stack"><span className="body-strong">{eur(fp.topup)} of your holiday allowance</span><span className="caption muted">I’ll ask you when it lands.</span></span></div>}
      </div>
      <p className="caption muted">Pause or change the plan any time from the Holiday goal. Money in Holiday can be taken out any time.</p>
      {f.view === 'faceid' && <FaceId onDone={() => set({ view: 'confirm' })} />}
    </Screen>
  )

  return (
    <>
      <Home pill={pill} toast={toast} onOpen={() => setOpen(true)}
        goal={goalOn ? { saved: 0, goal: fp.goal, highlight, onAsk: askAbout,
          status: f.paused ? { kind: 'warning', label: 'Paused' } : { kind: 'positive', label: 'Active' },
          line: f.paused ? 'Plan paused · No transfers until you resume' : `Next transfer ${day(first)} · ${eur(fp.p.monthly, 2)} · by ${day(lastT, true)}` } : null} />
      <Sheet open={open} onClose={() => setOpen(false)} overlay={overlay} watch={[f.turns.length, f.adjusting, f.choice]}
        input={{ value: input, onChange: setInput, onSend: () => send() }}>
        {f.turns.length === 0 ? (
          <div className="empty">
            <h1 className="title">What would you like to sort out?</h1>
            <p className="muted">{intro ?? 'I can read your current account (last 3 months) and work things out with you. Nothing moves without your approval.'}</p>
            {[['Save for something', 'Find an amount that fits your month', INTENT], ['Where did my money go?', 'Your last 3 months, in plain words', ''], ['Check a message I got', 'Is it really from the bank? I’ll never ask for codes', '']].map(([t, s, fill]) => (
              <button key={t} className="list-row" onClick={() => fill && setInput(fill)} aria-disabled={!fill}>
                <span className="stack"><span className="body-strong">{t}</span><span className="caption muted">{s}</span></span><Icon name="chevron" />
              </button>
            ))}
          </div>
        ) : f.turns.map(render)}
      </Sheet>
    </>
  )
}
