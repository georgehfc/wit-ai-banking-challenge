// Components used by J1, named as in DESIGN.md / Figma page 3 (code name = Figma name).
import { useEffect, useState, type ReactNode } from 'react'
import { GOAL, eur, monthShort, type Plan, type GapOption } from './planner'

// ---------- Icons (inline, 24 grid, stroke = currentColor) ----------
const paths: Record<string, ReactNode> = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  down: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  plane: <path d="M3 13l18-7-7 18-2.5-7.5L3 13z" />,
  home: <path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" />,
  swap: <path d="M7 7h12l-3-3M17 17H5l3 3" />,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
  card: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  more: <><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /></>,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16v.5" /></>,
  ok: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>,
}
export function Icon({ name, size = 20 }: { name: keyof typeof paths | string; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

// ---------- Basics ----------
export function Button({ kind = 'primary', children, onClick, disabled, grow }: { kind?: 'primary' | 'secondary' | 'tertiary'; children: ReactNode; onClick?: () => void; disabled?: boolean; grow?: boolean }) {
  return <button className={`btn btn-${kind}${grow ? ' grow' : ''}`} onClick={onClick} disabled={disabled}>{children}</button>
}
export function StatusBadge({ kind, children }: { kind: 'positive' | 'warning' | 'danger'; children: ReactNode }) {
  return <span className={`status status-${kind}`}><Icon name={kind === 'positive' ? 'ok' : 'alert'} size={14} />{children}</span>
}
export function ProgressBar({ value }: { value: number }) {
  return <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}><div style={{ width: `${Math.max(2, value * 100)}%` }} /></div>
}
export function Row({ k, v, strong }: { k: string; v: ReactNode; strong?: boolean }) {
  return <div className="kv"><span className="muted">{k}</span><span className={strong ? 'amount-sm' : 'body-strong'}>{v}</span></div>
}
export function Toast({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return <div className="toast" role="status"><span>{text}</span>{action && <button onClick={onAction}>{action}</button>}</div>
}

// ---------- AssistantPill: the assistant asleep ----------
export type PillState = 'idle' | 'nudge' | 'working' | 'ready'
export function AssistantPill({ state, label, action, onOpen }: { state: PillState; label?: string; action?: string; onOpen: () => void }) {
  const text = label ?? 'Ask AI'
  return (
    <button className={`pill pill-${state}`} onClick={onOpen} aria-label={state === 'idle' ? 'Ask AI, AI assistant' : `AI assistant: ${text}`}>
      <span className="pill-glyph"><span className="core" />{(state === 'nudge' || state === 'ready') && <span className="badge" />}</span>
      <span className="pill-label">{text}</span>
      {action && <span className="pill-action">{action}</span>}
    </button>
  )
}

// ---------- Conversation ----------
export function UserMessage({ children }: { children: ReactNode }) {
  return <div className="msg-user"><p>{children}</p></div>
}
export function AssistantMessage({ children, text }: { children?: ReactNode; text?: ReactNode }) {
  return <div className="msg-ai"><span className="ai-rule" aria-hidden="true" /><div className="msg-ai-content">{text && <p>{text}</p>}{children}</div></div>
}

export type Step = { label: string; role: string }
export function StepsReceipt({ steps, onDone, summary = 'Read Aug–Oct · Calculated by planner · Checked rules' }: { steps: Step[]; onDone?: () => void; summary?: string }) {
  const [n, setN] = useState(0)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (n >= steps.length) { onDone?.(); return }
    const t = setTimeout(() => setN((x) => x + 1), 650)
    return () => clearTimeout(t)
  }, [n]) // eslint-disable-line react-hooks/exhaustive-deps
  const done = n >= steps.length
  if (!done || open) return (
    <div className="steps" role="status" aria-live="polite">
      {done && <button className="steps-head" onClick={() => setOpen(false)}>Worked for 2 s <Icon name="down" size={14} /></button>}
      {steps.map((s, i) => (
        <div key={s.label} className={`step ${i < n ? 'done' : i === n ? 'now' : 'todo'}`}>
          <span className="step-dot">{i < n && <Icon name="check" size={11} />}</span>
          <span>{s.label}</span><span className="step-role">{s.role}</span>
        </div>
      ))}
    </div>
  )
  return <button className="steps steps-collapsed" onClick={() => setOpen(true)} aria-label={`Worked for 2 seconds, ${steps.length} steps. Show steps`}><span className="step-dot done"><Icon name="check" size={11} /></span><span className="grow-text">Worked for 2 s · {summary}</span><Icon name="chevron" size={14} /></button>
}

export function IntentInput({ value, onChange, onSend, placeholder = 'I want to…' }: { value: string; onChange: (v: string) => void; onSend: () => void; placeholder?: string }) {
  return (
    <form className={`intent ${value ? 'typing' : ''}`} onSubmit={(e) => { e.preventDefault(); if (value.trim()) onSend() }}>
      <textarea rows={value.length > 38 ? 2 : 1} value={value} placeholder={placeholder} aria-label="Message the AI assistant" onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (value.trim()) onSend() } }} />
      {value && <button className="send" aria-label="Send"><Icon name="up" size={18} /></button>}
    </form>
  )
}

// ---------- Widgets ----------
export function MarginSnapshot({ months }: { months: { month: string; income: number; fixed: number; variable: number; margin: number }[] }) {
  const fixed = months[0].fixed
  return (
    <div className="card">
      {months.map((m) => (
        <div className="margin-row" key={m.month}>
          <span className="muted label">{monthShort(m.month)}</span>
          <div className="margin-bar" aria-hidden="true">
            <span className="seg fixed" style={{ flex: m.fixed }} /><span className="seg spend" style={{ flex: m.variable }} /><span className="seg left" style={{ flex: m.margin }} />
          </div>
          <span className="body-strong">{eur(m.margin)} left</span>
        </div>
      ))}
      <div className="legend"><span><i className="fixed" />Fixed {eur(fixed)}</span><span><i className="spend" />Spending</span><span><i className="left" />Left</span></div>
      <p className="caption muted">Based on your account, Aug–Oct · Calculated by the planner</p>
    </div>
  )
}

export function ProjectionChart({ p, goal = GOAL }: { p: Plan; goal?: number }) {
  const last = p.byMonth[p.byMonth.length - 1]
  const label = `Saved by ${monthShort(last.month)}: ${eur(p.total)} of ${eur(goal)}.${p.gap > 0 ? ` Gap ${eur(goal - p.total)}.` : ' Goal reached.'}`
  const top = Math.max(goal, p.total)
  return (
    <div className="chart" role="img" aria-label={label}>
      <div className="goal-line" style={{ bottom: `calc(20px + (100% - 24px) * ${goal / top})` }}><span>Goal {eur(goal)}</span></div>
      {p.byMonth.map((m, i) => {
        const isLast = i === p.byMonth.length - 1
        return (
          <div className="bar-col" key={m.month}>
            <div className="bar-track">
              {isLast && goal > m.saved && <div className="bar-gap" style={{ height: `${((goal - m.saved) / top) * 100}%`, bottom: `${(m.saved / top) * 100}%` }} />}
              <div className="bar" style={{ height: `${(m.saved / top) * 100}%` }}>{m.christmas > 0 && <div className="bar-xmas" style={{ height: `${(m.christmas / m.saved) * 100}%` }} />}</div>
            </div>
            <span className="caption muted">{monthShort(m.month)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function fitBadge(p: Plan) {
  if (p.fit === 'fits') return <StatusBadge kind="positive">Fits every month</StatusBadge>
  if (p.fit === 'too_high') return <StatusBadge kind="danger">More than any month</StatusBadge>
  return <StatusBadge kind="warning">Short {p.shortMonths.length} of 3 months</StatusBadge>
}

export function AmountControl({ value, onChange, min, max, presets, total }: { value: number; onChange: (v: number) => void; min: number; max: number; presets: number[]; total: string }) {
  return (
    <div className="amount-control">
      <input type="range" min={min} max={max} step={10} value={value} onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Monthly amount" aria-valuetext={`${eur(value)} a month, ${total}`} style={{ ['--pct' as string]: `${((value - min) / (max - min)) * 100}%` }} />
      <div className="ends caption muted"><span>{eur(min)}</span><span>{eur(max)} (full goal)</span></div>
      <div className="chips" role="group" aria-label="Presets">
        {presets.map((v) => <button key={v} className={`chip ${v === value ? 'selected' : ''}`} aria-pressed={v === value} onClick={() => onChange(v)}>{eur(v)}</button>)}
      </div>
    </div>
  )
}

export type OptionItem = { id: string; label: string; result: string; certain?: boolean }
export function OptionList({ title, options, picked, onPick, label }: { title?: ReactNode; options: OptionItem[]; picked: string | null; onPick: (id: string) => void; label: string }) {
  return (
    <div className="option-list" role="radiogroup" aria-label={label}>
      {title && <p className="body-strong">{title}</p>}
      {options.map((o) => (
        <button key={o.id} role="radio" aria-checked={picked === o.id} className={`option ${picked === o.id ? 'selected' : ''} ${o.certain === false ? 'uncertain' : ''}`} onClick={() => onPick(o.id)}>
          <span className="radio" aria-hidden="true" />
          <span className="option-text"><span className="body-strong">{o.label}</span><span className="caption muted">{o.result}</span></span>
        </button>
      ))}
    </div>
  )
}
export function GapResolver({ gap, options, picked, onPick }: { gap: number; options: GapOption[]; picked: string | null; onPick: (id: GapOption['id']) => void }) {
  return <div className="card"><OptionList title={`Close the ${eur(gap)} gap`} label={`Ways to close the ${eur(gap)} gap`} options={options} picked={picked} onPick={(id) => onPick(id as GapOption['id'])} /></div>
}

export function FaceId({ onDone }: { onDone: () => void }) {
  const [ok, setOk] = useState(false)
  useEffect(() => { const a = setTimeout(() => setOk(true), 1100); const b = setTimeout(onDone, 1700); return () => { clearTimeout(a); clearTimeout(b) } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="faceid" role="status" aria-live="assertive">
      <div className={`faceid-box ${ok ? 'ok' : ''}`}>
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          {ok ? <path d="M18 33l9 9 19-20" /> : <><path d="M8 20V12a4 4 0 014-4h8M44 8h8a4 4 0 014 4v8M56 44v8a4 4 0 01-4 4h-8M20 56h-8a4 4 0 01-4-4v-8" /><path d="M24 24v4M40 24v4M32 26v10h-3M25 43c4 3 10 3 14 0" /></>}
        </svg>
        <span>{ok ? 'Approved' : 'Face ID'}</span>
      </div>
    </div>
  )
}

// ---------- added for J0, J2–J5 ----------
export function ReplyChips({ items }: { items: { label: string; onClick: () => void }[] }) {
  return <div className="chips" role="group" aria-label="Suggested replies">{items.map((c) => <button key={c.label} className="chip" onClick={c.onClick}>{c.label}</button>)}</div>
}

// ApprovalRequest inline in chat (move-money). No "always allow" for money, by design (SECURITY.md).
export function ApprovalCard({ title, rows, after, note, state, onDecline, onApprove }: {
  title: string; rows: [string, string, boolean?][]; after?: [string, string][]; note: string
  state: 'pending' | 'approved' | 'declined'; onDecline: () => void; onApprove: () => void
}) {
  return (
    <div className="card" aria-label={title}>
      <div className="row-between"><span className="body-strong">{title}</span>{state === 'approved' && <StatusBadge kind="positive">Approved</StatusBadge>}{state === 'declined' && <span className="caption muted">Not now</span>}</div>
      {rows.map(([k, v, strong]) => <Row key={k} k={k} v={v} strong={strong} />)}
      {after && <><hr />{after.map(([k, v]) => <Row key={k} k={k} v={v} />)}</>}
      {state === 'pending' && <><p className="caption muted">{note}</p>
        <div className="actions"><Button kind="secondary" grow onClick={onDecline}>Not now</Button><Button grow onClick={onApprove}>Approve with Face ID</Button></div></>}
    </div>
  )
}

export function HandoffCard({ topic, why, passOn, onKeep, onTalk, done }: { topic: string; why: string; passOn: string[]; onKeep: () => void; onTalk: () => void; done: boolean }) {
  return (
    <div className="card" aria-label={`${topic}: hand over to a person`}>
      <div className="row-between"><span className="body-strong">{topic}</span><span className="tag">With a person</span></div>
      <p className="muted">{why}</p>
      <hr />
      <span className="label muted">What I’ll pass on</span>
      <ul className="bullets">{passOn.map((x) => <li key={x}>{x}</li>)}</ul>
      {!done && <div className="actions"><Button kind="secondary" grow onClick={onKeep}>Keep my plan</Button><Button grow onClick={onTalk}>Talk to a person</Button></div>}
    </div>
  )
}

export function ContextChip({ children }: { children: ReactNode }) {
  return <div className="context-chip"><span className="caption muted">Earlier in this chat</span><span className="caption">{children}</span></div>
}
