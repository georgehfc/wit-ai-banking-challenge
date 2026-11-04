// The assistant: one conversation, three things it can help with.
//   Save for something (J1, the core journey) · Where did my money go? · Check a message I got
// Replies are scripted (no live LLM). Numbers come from planner.ts / plan-output.json. Copy: design/TONE.md.
import { useRef, useState, type ReactNode } from 'react'
import out from '../../data/plan-output.json' with { type: 'json' }
import ines from '../../data/ines.json' with { type: 'json' }
import { AmountControl, Button, FaceId, GapResolver, Icon, MarginSnapshot, ProgressBar, ProjectionChart, Row, StatusBadge, StepsReceipt, fitBadge, type PillState, type Step } from './components'
import { AiReply, CardControl, Folded, Num, ScamVerdict, SpendingBreakdown, Suggestions, UserBubble, replyDuration } from './chat'
import { BUFFER, CHRISTMAS, CHRISTMAS_DATE, GOAL, HOLIDAY_ALLOWANCE_DATE, MARGINS, NEEDED, SUGGESTED, day, eur, gapOptions, list, monthLong, monthShort, plan, type Plan } from './planner'
import { BottomSheet, Home, Screen, Sheet, account, last4, savingsName } from './shell'
import { AiOrb } from './orb'

const INTENT = ines.intent.text_en
const SMS = 'Banco: Detetámos um acesso invulgar à sua conta. Confirme os seus dados em secure-verify-pt.com nas próximas 24h ou a conta será bloqueada.'
const SMS_DOMAIN = 'secure-verify-pt.com'
const SP = out.spending
const newSubs = out.side_widgets.new_subscriptions_this_summer
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Widget = 'margin' | 'plan' | 'gap' | 'review' | 'spending' | 'verdict' | 'card' | 'fraudline' | 'shortcuts'
type Turn = { id: number; who: 'user' | 'ai' | 'steps'; text?: string; quote?: string; image?: string; widget?: Widget; snap?: number; steps?: Step[]; summary?: string; instant?: boolean }
type NewTurn = Omit<Turn, 'id'>
type Choice = 'irs' | 'september' | 'trim' | null
type ScamStage = 'paste' | 'verdict' | 'tapped' | 'safe' | 'entered' | 'reported' | null

const SHORTCUTS: [string, string][] = [['Save for something', 'Find an amount that fits your month'], ['Where did my money go?', 'Your last 3 months by category'], ['Check a message I got', 'Find out if a text or email is really from the bank']]

function reaction(p: Plan) {
  const ok = p.okMonths.map(monthLong), short = p.shortMonths.map(monthLong)
  const head = `${eur(p.monthly)} a month gets you ${eur(p.total)} by July${p.gap <= 0 ? ', the full goal' : ''}.`
  if (!short.length) return `${head} It fitted all of the last 3 months.`
  if (!ok.length) return `${head} That’s more than any of the last 3 months left you.`
  return `${head} It fitted ${list(ok)}. ${list(short)} would have been short.`
}

export function Assistant({ startClosed }: { startClosed: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  // save
  const [monthly, setMonthly] = useState(SUGGESTED)
  const [adjusting, setAdjusting] = useState(false)
  const [choice, setChoice] = useState<Choice>(null)
  const [view, setView] = useState<'chat' | 'review' | 'faceid' | 'confirm'>('chat')
  const [paused, setPaused] = useState(false)
  const [goalOn, setGoalOn] = useState(false)
  const [highlight, setHighlight] = useState(false)
  const [toast, setToast] = useState<null | { text: string; action?: string; onAction?: () => void }>(null)
  // spending
  const [month, setMonth] = useState('all')
  // scam
  const [scam, setScam] = useState<ScamStage>(null)
  const [frozen, setFrozen] = useState(false)
  const [reportSheet, setReportSheet] = useState(false)
  // lock screen (App closed)
  const [locked, setLocked] = useState(startClosed)

  const nextId = useRef(1)
  const openRef = useRef(open); openRef.current = open
  const scrollNudge = useRef<() => void>(() => {})
  const skipRef = useRef(false)
  const [skipping, setSkipping] = useState(false)

  const say = async (...items: NewTurn[]) => {
    setBusy(true)
    for (const it of items) {
      const t = { ...it, id: nextId.current++, instant: it.instant || (skipRef.current && it.who === 'ai') }
      setTurns((x) => [...x, t])
      const ms = skipRef.current ? 60 : it.who === 'steps' ? (it.steps!.length * 650 + 350) : it.who === 'ai' && !it.instant ? replyDuration(it.text ?? '', !!it.widget) : 220
      await wait(ms)
    }
    setBusy(false); skipRef.current = false; setSkipping(false)
    if (!openRef.current) setUnseen(true)
  }
  const user = (text: string, quote?: string, image?: string): NewTurn => ({ who: 'user', text, quote, image })
  const ai = (text: string, widget?: Widget, extra?: Partial<NewTurn>): NewTurn => ({ who: 'ai', text, widget, ...extra })

  const p = plan(monthly)
  const has = (w: Widget) => turns.some((t) => t.widget === w)
  const saveStage = !has('plan') ? 'none' : choice ? 'chosen' : has('gap') ? 'gap' : 'plan'

  // ---------- Save for something ----------
  const startSave = (text: string) => say(user(text),
    ai('Checking your account for August to October.'),
    { who: 'steps', steps: [{ label: 'Read your current account, Aug–Oct', role: 'Data' }, { label: 'Worked out what was left each month', role: 'Planner' }, { label: 'Made sure the plan keeps your buffer', role: 'Rules' }], summary: 'Read Aug–Oct · Planner · Rules' },
    ai(`After rent, bills and spending, you had ${eur(out.margin.min)} to ${eur(out.margin.max)} left each month.`, 'margin'),
    ai(`Your ${eur(BUFFER)} buffer stays untouched. Saving the full ${eur(GOAL)} by July would take ${eur(NEEDED)} a month, more than any month left you. This is what fits:`, 'plan', { snap: SUGGESTED }))
  const setAmount = (v: number, text: string) => { setMonthly(v); setAdjusting(true); say(user(text), ai(reaction(plan(v)), 'plan', { snap: v })) }
  const why = (text: string) => {
    const avg = out.margin.avg, low = MARGINS.find((m) => m.margin === out.margin.min)!
    say(user(text), ai(`It’s what you had left on average over August to October (${eur(avg)}), rounded down to the nearest €10. ${list(plan(SUGGESTED).okMonths.map(monthLong))} covered it. ${monthLong(low.month)} left ${eur(low.margin)}, ${eur(SUGGESTED - low.margin)} short.`))
  }
  const showGap = (text: string) => say(user(text), ai(`At ${eur(monthly)} a month you’d be ${eur(p.gap)} short by July. Three ways to close it. Pick one, or keep the plan as it is.`, 'gap'))
  const pick = (id: 'irs' | 'september' | 'trim') => {
    setChoice(id)
    const sep = plan(monthly, 'september'), trimTo = Math.floor(p.total / 100) * 100
    const label = gapOptions(p).find((o) => o.id === id)!.label
    const reply = id === 'september'
      ? (sep.gap > 0 ? `Then it’s ${eur(sep.total)} from transfers by ${day(sep.transfers[sep.transfers.length - 1])}. ${eur(sep.gap)} of your holiday allowance (${day(HOLIDAY_ALLOWANCE_DATE)}) makes ${eur(GOAL)}. I’ll ask before moving it.` : `Then it’s ${eur(sep.total)} by ${day(sep.transfers[sep.transfers.length - 1])}, the full goal.`)
      : id === 'trim' ? `Then the goal is ${eur(trimTo)}, reached by July on this plan.`
      : `The plan stays at July without counting the refund. If one arrives and it’s at least ${eur(p.gap)}, you’re there. I’ll let you know.`
    say(user(label), ai(reply, 'review'))
  }

  // ---------- Where did my money go? ----------
  const startSpending = (text: string | null) => {
    const avg = SP.spent_total / 3, hi = SP.highest_everyday_month
    const first: NewTurn[] = text ? [user(text), ai('Checking your account for August to October.'), { who: 'steps', steps: [{ label: 'Read your transactions, Aug–Oct', role: 'Data' }, { label: 'Grouped them by type', role: 'Planner' }], summary: 'Read Aug–Oct · Grouped by type' }] : []
    setMonth('all')
    say(...first,
      ai(`You spent ${eur(SP.spent_total)} over three months, about ${eur(avg)} a month. ${eur(SP.fixed_avg)} a month is fixed: rent, bills, your transport pass and subscriptions.`, 'spending'),
      ai(`${monthLong(hi)} had the most everyday spending (${eur((SP.everyday_by_month as Record<string, number>)[hi])}), mostly the Lagos trip (${eur(SP.travel_in_highest)}). ${['No', 'One', 'Two', 'Three', 'Four'][newSubs.length] ?? newSubs.length} subscriptions started in ${monthLong(hi)}: ${list(newSubs.map((s) => s.merchant))}, ${eur(out.side_widgets.new_subscriptions_monthly, 2)} a month together.`))
  }
  const showMonth = (m: string, text: string) => { setMonth(m); say(user(text), ai(`${monthLong(m)}: ${eur((SP.spent_by_month as Record<string, number>)[m])} out, ${eur((SP.everyday_by_month as Record<string, number>)[m])} of it on everyday things. The breakdown above now shows ${monthLong(m)}.`)) }

  // ---------- Check a message I got ----------
  const startScam = (text: string) => { setScam('paste'); say(user(text), ai('Paste the message here. I read it as text only and never open links in it.')) }
  const checkSms = (sms: string, image?: string) => {
    setScam('verdict')
    say(user('', sms, image), ai(image ? 'Reading the screenshot.' : 'Checking the message.'),
      { who: 'steps', steps: [{ label: 'Read the message as text', role: 'Data' }, { label: 'Compared it with how the bank contacts you', role: 'Rules' }, { label: 'Checked where the link goes', role: 'Rules' }], summary: 'Read as text · Rules' },
      ai('This looks like a scam. Don’t tap the link, and you can delete the message.', 'verdict'))
  }
  const tapped = (text: string) => { setScam('tapped'); say(user(text), ai('Did you type anything on that page?')) }
  const safe = (text: string) => { setScam('safe'); say(user(text), ai('Then your account is safe. Close the page and delete the message. If someone calls asking for a code, hang up. The bank never asks for one.')) }
  const entered = (text: string) => { setScam('entered'); say(user(text), ai('Freeze your card now. It blocks new payments and you can unfreeze it any time.', 'card')) }
  const toggleFreeze = () => {
    const nowFrozen = !frozen; setFrozen(nowFrozen)
    if (nowFrozen && !turns.some((t) => t.widget === 'fraudline')) say(ai('Card frozen. Next, call the fraud line so they can cancel it and send you a new one.', 'fraudline'))
  }
  const report = () => setReportSheet(true)
  const sendReport = () => { setReportSheet(false); setScam('reported'); say(user('Report it'), ai('Reported. The fraud team uses reports like this to get fake sites taken down. Nothing else to do.')) }

  // ---------- routing: typed text and suggested replies take the same path ----------
  const send = (raw: string, image?: { url: string; name: string }) => {
    const text = raw.trim(); setInput('')
    if (busy) return
    // A screenshot is read as a message to check (scripted: the prototype reads the sample text).
    if (image) { if (scam === null) setScam('paste'); return checkSms(SMS, image.url) }
    if (!text) return
    const n = Number((text.replace(/[,.]/g, '').match(/\d{2,4}/) ?? [])[0])
    if (scam === 'paste') return checkSms(text === 'Paste the message' ? SMS : text)
    if (/^report/i.test(text) && scam === 'verdict') return report()
    if (/tap|click|open/i.test(text) && scam === 'verdict') return tapped(text)
    if (scam === 'tapped' && /^no/i.test(text)) return safe(text)
    if (scam === 'tapped' && /^yes|typed|entered|card/i.test(text)) return entered(text)
    if (/where.*money|spen[dt]|money go|gastei|breakdown/i.test(text)) return startSpending(text)
    if (/message|sms|scam|text i got|e-?mail|mensagem/i.test(text)) return startScam(text)
    if (has('spending') && /aug|sep|oct/i.test(text) && !/save/i.test(text)) { const m = SP.months.find((x) => monthShort(x).toLowerCase() === text.match(/aug|sep|oct/i)![0].toLowerCase())!; return showMonth(m, text) }
    if (saveStage === 'none' && /sav|poup|holiday|férias|trip|€|\d/i.test(text)) return startSave(/^save for something$/i.test(text) ? INTENT : text)
    if (saveStage === 'plan' || saveStage === 'gap') {
      if (/why/i.test(text)) return why(text)
      if (n >= 100 && n <= 500) return setAmount(Math.round(n / 10) * 10, text)
      if (/gap|short|close/i.test(text) && p.gap > 0) return showGap(text)
      if (/review|approve|looks good|go ahead/i.test(text)) { say(user(text)); setView('review'); return }
    }
    if (saveStage === 'gap' && !choice) { if (/sep/i.test(text)) return pick('september'); if (/irs|refund/i.test(text)) return pick('irs'); if (/trim|smaller|2,?300/i.test(text)) return pick('trim') }
    if (saveStage === 'chosen' && /review|approve|ok|yes/i.test(text)) { say(user(text)); setView('review'); return }
    say(user(text), ai('I can’t help with that yet. These I can do:', 'shortcuts'))
  }

  // ---------- suggested replies for where the conversation is ----------
  const last = [...turns].reverse().find((t) => t.widget)?.widget
  const suggestions: string[] = busy ? [] :
    scam === 'paste' ? ['Paste the message'] :
    scam === 'verdict' && last === 'verdict' ? ['Report it', 'I tapped the link'] :
    scam === 'tapped' ? ['No, I only opened it', 'Yes, I typed my card details'] :
    last === 'spending' ? [`Show ${monthLong(SP.highest_everyday_month)}`, 'Save for something', 'Check a message I got'] :
    saveStage === 'plan' ? (p.gap > 0 ? [monthly === SUGGESTED ? `Why ${eur(SUGGESTED)}?` : `Back to ${eur(SUGGESTED)}`, monthly === 250 ? 'Make it €280' : 'Make it €250', 'What about the gap?'] : ['Review the plan']) :
        turns.length && (scam === 'safe' || scam === 'reported' || (scam === 'entered' && frozen)) ? ['Where did my money go?', 'Save for something'] : []

  // ---------- rendering ----------
  const lastWidgetId = [...turns].reverse().find((t) => t.widget && t.widget !== 'review' && t.widget !== 'fraudline' && t.widget !== 'shortcuts')?.id
  const toggle = (id: number) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  const planCard = (q: Plan, live: boolean) => (
    <div className="card plan-card">
      <div className="row-between"><span className="label muted">Holiday plan</span>{fitBadge(q)}</div>
      <div className="row-baseline"><span className="amount"><Num value={q.monthly} /></span><span className="muted">a month</span></div>
      <p className="muted">+ {eur(CHRISTMAS)} Christmas allowance, {day(CHRISTMAS_DATE)}</p>
      {live && adjusting && <AmountControl value={monthly} min={150} max={NEEDED} presets={[150, SUGGESTED, 250, 280]} total={`${eur(q.total)} by July`} onChange={(v) => setMonthly(v)} />}
      <ProjectionChart p={q} />
      <div className="row-between result">
        <span className="stack"><span className="amount-sm"><Num value={q.total} /> by July</span><span className="caption muted">Calculated by the planner</span></span>
        {q.gap > 0 ? <span className="stack end"><span className="amount-sm warn"><Num value={q.gap} format={(n) => `${eur(n)} short`} /></span><span className="caption muted">of {eur(GOAL)} · dashed</span></span>
          : <span className="stack end"><span className="amount-sm pos">Full goal</span></span>}
      </div>
      {live && !choice && <Button kind="secondary" onClick={() => setAdjusting(!adjusting)}>{adjusting ? 'Done' : 'Change amount'}</Button>}
    </div>
  )

  const widget = (t: Turn): ReactNode => {
    const latest = t.id === lastWidgetId
    switch (t.widget) {
      case 'margin': return latest ? <MarginSnapshot months={out.picture} />
        : <Folded open={expanded.has(t.id)} onToggle={() => toggle(t.id)} summary={<>Left each month: {out.picture.map((m) => eur(m.margin)).join(' · ')}</>}><MarginSnapshot months={out.picture} /></Folded>
      case 'plan': {
        const isLivePlan = t.id === [...turns].reverse().find((x) => x.widget === 'plan')?.id && latest
        if (isLivePlan) return <>{planCard(p, true)}{adjusting && monthly !== t.snap && <p className="live" aria-live="polite">{reaction(p)}</p>}</>
        const q = plan(t.snap ?? SUGGESTED)
        return <Folded open={expanded.has(t.id)} onToggle={() => toggle(t.id)} summary={<>Plan: {eur(q.monthly)} a month · {eur(q.total)} by July</>}>{planCard(q, false)}</Folded>
      }
      case 'gap': return choice
        ? <Folded open={expanded.has(t.id)} onToggle={() => toggle(t.id)} summary={<>Chosen: {gapOptions(p).find((o) => o.id === choice)!.label}</>}><GapResolver gap={p.gap} options={gapOptions(p)} picked={choice} onPick={() => {}} /></Folded>
        : <GapResolver gap={p.gap} options={gapOptions(p)} picked={choice} onPick={(id) => !busy && pick(id)} />
      case 'review': return t.id === [...turns].reverse().find((x) => x.widget === 'review')?.id && !goalOn ? <Button onClick={() => setView('review')}>Review the plan</Button> : null
      case 'spending': return latest ? <SpendingBreakdown month={month} onMonth={setMonth} />
        : <Folded open={expanded.has(t.id)} onToggle={() => toggle(t.id)} summary={<>Spent Aug–Oct: {eur(SP.spent_total)}</>}><SpendingBreakdown month={month} onMonth={setMonth} /></Folded>
      case 'verdict': return <ScamVerdict domain={SMS_DOMAIN} reasons={['It asks you to confirm your details through a link. The bank never does that.', `The link goes to ${SMS_DOMAIN}, which isn’t a bank address.`, 'It gives you 24 hours to act. Scams use deadlines to rush you.']} />
      case 'card': return <CardControl frozen={frozen} onToggle={toggleFreeze} />
      case 'fraudline': return <Button kind="secondary" onClick={() => {}}><Icon name="phone" size={18} />Call the fraud line</Button>
      case 'shortcuts': return <div className="shortcut-list">{SHORTCUTS.map(([t2]) => <button key={t2} className="list-row compact" onClick={() => send(t2)}><span className="body-strong">{t2}</span><Icon name="chevron" /></button>)}</div>
    }
  }

  const renderTurn = (t: Turn) => {
    if (t.who === 'user') return <UserBubble key={t.id} text={t.text} quote={t.quote} image={t.image} />
    if (t.who === 'steps') return <StepsReceipt key={t.id} steps={t.steps!} summary={t.summary} />
    if (t.instant) return <div key={t.id} className="msg-ai"><span className="ai-rule" aria-hidden="true" /><div className="msg-ai-content"><p>{t.text}</p>{t.widget && widget(t)}</div></div>
    return <AiReply key={t.id} text={t.text ?? ''} widget={t.widget ? widget(t) : undefined} onGrow={() => scrollNudge.current()} skip={skipping} />
  }

  // ---------- review / confirm (J1) ----------
  const fp = (() => { const q = plan(monthly, choice === 'september' ? 'september' : 'july'); return { q, goal: choice === 'trim' ? Math.floor(plan(monthly).total / 100) * 100 : GOAL, topup: choice === 'september' && q.gap > 0 ? q.gap : 0 } })()
  const first = fp.q.transfers[0], lastT = fp.q.transfers[fp.q.transfers.length - 1]
  const done = () => {
    setView('chat'); setOpen(false); setGoalOn(true); setHighlight(true); setTimeout(() => setHighlight(false), 2400)
    setTurns((x) => [...x, { id: nextId.current++, who: 'ai', instant: true, text: `Your Holiday plan is active. First transfer: ${eur(fp.q.monthly)} on ${day(first)}.` }])
    setToast({ text: `Plan set. First transfer ${day(first)}`, action: 'Undo', onAction: () => { setGoalOn(false); setChoice(null); setToast({ text: 'Plan cancelled. Nothing will move.' }) } })
  }
  const overlay = view === 'chat' ? (reportSheet ? (
    <BottomSheet label="Report this message" onScrim={() => setReportSheet(false)}>
      <h2 className="title">Send this message to the fraud team?</h2>
      <p className="muted">They’ll see the message text and when you got it. Nothing from your account is shared.</p>
      <div className="quote small"><p>{SMS}</p></div>
      <div className="actions"><Button kind="secondary" grow onClick={() => setReportSheet(false)}>Cancel</Button><Button grow onClick={sendReport}>Send report</Button></div>
    </BottomSheet>
  ) : null) : view === 'confirm' ? (
    <Screen label="Plan confirmed" dock={<div className="actions"><Button grow onClick={done}>Done</Button></div>}>
      <span className="success"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="draw" d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
      <h1 className="title center">Your plan is set</h1>
      <p className="caption muted center">Approved with Face ID</p>
      <div className="card">
        <div className="row-between"><span className="amount-sm">{eur(0)} of {eur(fp.goal)}</span>{paused ? <StatusBadge kind="warning">Paused</StatusBadge> : <StatusBadge kind="positive">Active</StatusBadge>}</div>
        <ProgressBar value={0} />
        <p className="caption muted">By {day(lastT, true)} · {eur(fp.q.total)} from transfers{fp.topup ? ` + ${eur(fp.topup)} holiday allowance` : ''}</p>
        <hr />
        <Row k="Next transfer" v={paused ? 'Paused' : `${day(first)} · ${eur(fp.q.monthly, 2)}`} />
        <Button kind="secondary" onClick={() => setPaused(!paused)}>{paused ? 'Resume plan' : 'Pause plan'}</Button>
      </div>
      <div className="card flat"><span className="label accent">{day(CHRISTMAS_DATE)}</span><p>I’ll ask before moving {eur(CHRISTMAS)} of your Christmas allowance.</p></div>
    </Screen>
  ) : (
    <Screen label="Review your plan" title="Review your plan" sub="Drafted by AI · you approve" onBack={() => setView('chat')}
      dock={<><p className="caption muted">Nothing moves until you approve.</p>
        <div className="actions"><Button kind="secondary" grow onClick={() => setView('chat')}>Not now</Button><Button grow onClick={() => setView('faceid')}>Approve with Face ID</Button></div></>}>
      <h1 className="title">{eur(fp.q.monthly)} every month from {account.name} to Holiday, {day(first, true)} to {day(lastT, true)}.</h1>
      <div className="card">
        <Row k="Amount" v={`${eur(fp.q.monthly, 2)} a month`} strong />
        <Row k="From" v={`${account.name} ··${last4}`} />
        <Row k="To" v={`Holiday · ${savingsName}`} />
        <hr />
        <Row k="First transfer" v={day(first, true)} />
        <Row k="Last transfer" v={day(lastT, true)} />
        <Row k="Transfers" v={`${fp.q.transfers.length} · ${eur(fp.q.scheduledTotal, 2)} in total`} />
      </div>
      <div className="not-included">
        <span className="label muted">Not part of this approval</span>
        <div className="info-row"><span className="tag">{day(CHRISTMAS_DATE)}</span><span className="stack"><span className="body-strong">{eur(CHRISTMAS)} of your Christmas allowance</span><span className="caption muted">You’ll be asked when it arrives.</span></span></div>
        {fp.topup > 0 && <div className="info-row"><span className="tag">{day(HOLIDAY_ALLOWANCE_DATE)}</span><span className="stack"><span className="body-strong">{eur(fp.topup)} of your holiday allowance</span><span className="caption muted">You’ll be asked when it arrives.</span></span></div>}
      </div>
      <p className="caption muted">Pause or change the plan any time from the Holiday goal. Money in Holiday can be taken out any time.</p>
      {view === 'faceid' && <FaceId onDone={() => setView('confirm')} />}
    </Screen>
  )

  // ---------- the app around it ----------
  const pill: { state: PillState; label?: string; action?: string } =
    busy && !open ? { state: 'working', label: 'Working on it…' }
      : unseen && !open ? { state: 'ready', label: 'Your answer is ready', action: 'Open' }
      : { state: 'idle' }
  const openSheet = () => { setOpen(true); setUnseen(false) }
  const unlock = () => { setLocked(false); setTimeout(() => { setOpen(true); startSpending(null) }, 450) }

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

  return (
    <div className="app-launch">
      <Home pill={pill} toast={toast} onOpen={openSheet}
        goal={goalOn ? { saved: 0, goal: fp.goal, highlight, onAsk: () => { setTurns((x) => [...x, { id: nextId.current++, who: 'ai', instant: true, text: `Your Holiday plan is ${paused ? 'paused' : 'active'}: ${eur(fp.q.monthly)} a month from ${day(first)}. What would you like to change?` }]); openSheet() },
          status: paused ? { kind: 'warning', label: 'Paused' } : { kind: 'positive', label: 'Active' },
          line: paused ? 'Plan paused. No transfers until you resume.' : `Next transfer ${day(first)} · ${eur(fp.q.monthly, 2)} · by ${day(lastT, true)}` } : null} />
      <Sheet open={open} onClose={() => setOpen(false)} overlay={overlay} watch={turns.length} nudge={(fn) => { scrollNudge.current = fn }}
        input={{ value: input, onChange: setInput, onSend: (img) => send(input, img), busy, onStop: () => { skipRef.current = true; setSkipping(true) }, transcript: () => suggestions[0] && !/^(paste|report)/i.test(suggestions[0]) ? suggestions[0] : turns.length ? 'Where did my money go?' : INTENT }}
        above={<Suggestions items={suggestions} onPick={(s) => send(s)} />}>
        {turns.length === 0 ? (
          <div className="empty">
            <span className="hero-orb"><AiOrb size={88} label="AI assistant" /></span>
            <h1 className="title">What can I help with?</h1>
            <p className="muted">I can read your current account for the last 3 months. Nothing moves without your approval.</p>
            {SHORTCUTS.map(([t, s]) => (
              <button key={t} className="list-row" onClick={() => send(t)}>
                <span className="stack"><span className="body-strong">{t}</span><span className="caption muted">{s}</span></span><Icon name="chevron" />
              </button>
            ))}
          </div>
        ) : turns.map(renderTurn)}
      </Sheet>
    </div>
  )
}
