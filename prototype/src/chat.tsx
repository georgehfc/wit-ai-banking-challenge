// Chat primitives: how a reply arrives (typing → streamed text → widget), folded summaries, suggested replies,
// animated numbers, and the widgets for "Where did my money go?" and "Check a message I got".
import { useEffect, useRef, useState, type ReactNode } from 'react'
import out from '../../data/plan-output.json' with { type: 'json' }
import { Icon, StatusBadge } from './components'
import { AiOrb } from './orb'
import { eur, list, monthLong, monthShort } from './planner'

export const TYPING_MS = 650
export const WORD_MS = 28
export const WIDGET_MS = 260
export const replyDuration = (text: string, widget: boolean) => TYPING_MS + text.split(/\s+/).length * WORD_MS + (widget ? WIDGET_MS + 200 : 120)

export function TypingDots() {
  return <span className="typing" role="status" aria-label="AI is writing"><AiOrb size={22} state="thinking" /><span className="dots"><i /><i /><i /></span></span>
}

// One assistant reply. Mounts once per turn: typing dots, then the text streams in, then the widget rises in.
export function AiReply({ text, widget, onGrow, skip = false }: { text: string; widget?: ReactNode; onGrow?: () => void; skip?: boolean }) {
  const words = text.split(/(\s+)/)
  const total = words.filter((w) => w.trim()).length
  const [phase, setPhase] = useState<'typing' | 'text' | 'done'>('typing')
  const [n, setN] = useState(0)
  useEffect(() => { const t = setTimeout(() => setPhase('text'), TYPING_MS); return () => clearTimeout(t) }, [])
  useEffect(() => { if (skip) setPhase('done') }, [skip])
  useEffect(() => {
    if (phase !== 'text') return
    if (n >= total) { const t = setTimeout(() => setPhase('done'), widget ? 120 : 0); return () => clearTimeout(t) }
    const t = setTimeout(() => setN((x) => x + 1), WORD_MS)
    return () => clearTimeout(t)
  }, [phase, n]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onGrow?.() }, [phase, n === total]) // eslint-disable-line react-hooks/exhaustive-deps
  let shown = 0
  return (
    <div className="msg-ai">
      <span className="ai-rule" aria-hidden="true" />
      <div className="msg-ai-content">
        {phase === 'typing' ? <TypingDots /> : (
          <p aria-label={text}>{words.map((w, i) => {
            if (!w.trim()) return w
            shown++
            return shown <= n || phase === 'done' ? <span key={i} className="word">{w}</span> : null
          })}</p>
        )}
        {phase === 'done' && widget && <div className="widget-in">{widget}</div>}
      </div>
    </div>
  )
}

export function UserBubble({ text, quote, image }: { text?: string; quote?: string; image?: string }) {
  return (
    <div className="msg-user">
      {quote ? <div className="quote">{image && <img className="quote-img" src={image} alt="Screenshot you attached" />}<span className="caption muted">{image ? 'Text in your screenshot · read as text only' : 'Pasted message · read as text only'}</span><p>{quote}</p></div> : <p>{text}</p>}
    </div>
  )
}

// A finished widget folds into one line once the conversation moves on. Tap to open it again.
export function Folded({ summary, open, onToggle, children }: { summary: ReactNode; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <div className={`folded ${open ? 'open' : ''}`}>
      <button className="folded-head" onClick={onToggle} aria-expanded={open}><span>{summary}</span><Icon name="down" size={16} /></button>
      {open && <div className="folded-body">{children}</div>}
    </div>
  )
}

export function Suggestions({ items, onPick }: { items: string[]; onPick: (s: string) => void }) {
  if (!items.length) return null
  return (
    <div className="suggestions" role="group" aria-label="Suggested replies">
      {items.map((s, i) => <button key={s} className="chip" style={{ animationDelay: `${i * 40}ms` }} onClick={() => onPick(s)}>{s}</button>)}
    </div>
  )
}

// Numbers tween instead of jumping (DESIGN.md motion). Reduced motion: set straight away.
export function Num({ value, format = (n: number) => eur(n) }: { value: number; format?: (n: number) => string }) {
  const [v, setV] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(value); from.current = value; return }
    const a = from.current, start = performance.now(); let raf = 0
    const step = (t: number) => { const k = Math.min(1, (t - start) / 260); const e = 1 - Math.pow(1 - k, 3); setV(a + (value - a) * e); if (k < 1) raf = requestAnimationFrame(step); else from.current = value }
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf)
  }, [value])
  return <span className="num">{format(Math.round(v))}</span>
}

// ---------- Where did my money go? ----------
const S = out.spending
type Group = (typeof S.groups)[number]
export function SpendingBreakdown({ month, onMonth }: { month: string; onMonth: (m: string) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  const [all, setAll] = useState(false)
  const val = (g: Group) => month === 'all' ? g.total : (g.by_month as Record<string, number>)[month]
  const fixed = S.groups.filter((g) => g.kind === 'fixed')
  const fixedTotal = fixed.reduce((a, g) => a + val(g), 0)
  const rows = S.groups.filter((g) => g.kind !== 'fixed').map((g) => ({ g, v: val(g) })).filter((r) => r.v > 0).sort((a, b) => b.v - a.v)
  const shown = all ? rows : rows.slice(0, 5)
  const total = month === 'all' ? S.spent_total : (S.spent_by_month as Record<string, number>)[month]
  const max = Math.max(...rows.map((r) => r.v))
  return (
    <div className="card spending">
      <div className="segmented" role="tablist" aria-label="Period">
        {['all', ...S.months].map((m) => <button key={m} role="tab" aria-selected={m === month} className={m === month ? 'on' : ''} onClick={() => onMonth(m)}>{m === 'all' ? 'Aug–Oct' : monthShort(m)}</button>)}
      </div>
      <div className="row-baseline"><span className="amount-sm"><Num value={total} /></span><span className="caption muted">{month === 'all' ? 'spent in 3 months' : `spent in ${monthLong(month)}`}</span></div>
      <ul className="spend-list">
        <li>
          <button className="spend-row fixed-row" onClick={() => setOpen(open === 'fixed' ? null : 'fixed')} aria-expanded={open === 'fixed'}>
            <span className="spend-label"><span>{list(fixed.map((g, i) => i ? g.label.split(' ')[0].toLowerCase() : g.label.split(' ')[0]))}</span><span className="tag">Fixed</span></span>
            <span />
            <span className="body-strong num"><Num value={fixedTotal} /></span>
          </button>
          {open === 'fixed' && <ul className="merchants">{fixed.map((g) => <li key={g.id}><span>{g.label}</span><span className="num">{eur(val(g))}</span></li>)}</ul>}
        </li>
        {shown.map(({ g, v }) => (
          <li key={g.id}>
            <button className="spend-row" onClick={() => setOpen(open === g.id ? null : g.id)} aria-expanded={open === g.id} disabled={!g.top.length}>
              <span className="spend-label"><span>{g.label}</span></span>
              <span className="spend-bar" aria-hidden="true"><i style={{ width: `${(v / max) * 100}%` }} /></span>
              <span className="body-strong num"><Num value={v} /></span>
            </button>
            {open === g.id && <ul className="merchants">{g.top.map((m) => <li key={m.name}><span>{m.name}</span><span className="num">{eur(m.total)}</span></li>)}<li className="caption muted">Aug–Oct total per place</li></ul>}
          </li>
        ))}
      </ul>
      {rows.length > 5 && <button className="btn btn-tertiary" onClick={() => setAll(!all)}>{all ? 'Show less' : `Show ${rows.length - 5} more`}</button>}
      <p className="caption muted">Your current account, Aug–Oct. Tap a row to see where.</p>
    </div>
  )
}

// ---------- Check a message I got ----------
export function ScamVerdict({ domain, reasons }: { domain: string; reasons: string[] }) {
  return (
    <div className="card verdict">
      <div className="row-between"><span className="body-strong">Likely a scam</span><StatusBadge kind="danger">Don’t tap the link</StatusBadge></div>
      <ul className="reasons">{reasons.map((r) => <li key={r}><Icon name="alert" size={16} /><span>{r}</span></li>)}</ul>
      <p className="caption muted">Checked against how the bank contacts you. The link ({domain}) was not opened.</p>
    </div>
  )
}

export function CardControl({ frozen, onToggle }: { frozen: boolean; onToggle: () => void }) {
  return (
    <div className="card">
      <div className={`bank-card ${frozen ? 'frozen' : ''}`} aria-hidden="true">
        <span className="caption">Debit card</span>
        <span className="bank-card-chip" />
        <span className="caption">Inês Marques</span>
        {frozen && <span className="frost"><Icon name="lock" size={22} />Frozen</span>}
      </div>
      <label className="switch-row">
        <span className="stack"><span className="body-strong">Freeze card</span><span className="caption muted">{frozen ? 'No payments can go through. Unfreeze any time.' : 'Blocks new payments. Your account stays open.'}</span></span>
        <input type="checkbox" role="switch" checked={frozen} onChange={onToggle} aria-label="Freeze card" />
      </label>
    </div>
  )
}
