// Chat primitives: how a reply arrives (typing → streamed text → widget), folded summaries, suggested replies,
// animated numbers, and the widgets for "Where did my money go?" and "Check a message I got".
import { useEffect, useRef, useState, type ReactNode } from 'react'
import out from '../../data/plan-output.json' with { type: 'json' }
import ines from '../../data/ines.json' with { type: 'json' }
import { Button, Icon, OptionList, Row, StatusBadge, type OptionItem } from './components'
import { AiOrb } from './orb'
import { eur, monthShort } from './planner'

export const TYPING_MS = 650
export const WORD_MS = 28
export const WIDGET_MS = 260
export const replyDuration = (text: string, widget: boolean) => TYPING_MS + text.split(/\s+/).length * WORD_MS + (widget ? WIDGET_MS + 200 : 120)

export function TypingDots() {
  return <span className="typing" role="status" aria-label="A IA está a escrever"><AiOrb size={22} state="thinking" /><span className="dots"><i /><i /><i /></span></span>
}

// One assistant reply. Mounts once per turn: typing dots, then the text streams in, then the widget rises in.
// tone: 'status' = quiet progress line (no typing dots) · 'reply' = plain text · 'callout' = key result, marked with the gradient rule.
export function AiReply({ text, widget, onGrow, skip = false, tone = 'reply' }: { text: string; widget?: ReactNode; onGrow?: () => void; skip?: boolean; tone?: 'status' | 'reply' | 'callout' }) {
  const words = text.split(/(\s+)/)
  const total = words.filter((w) => w.trim()).length
  const [phase, setPhase] = useState<'typing' | 'text' | 'done'>(tone === 'status' ? 'text' : 'typing')
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
    <div className={`msg-ai ${tone}`}>
      {tone === 'callout' && <span className="ai-rule" aria-hidden="true" />}
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
      {quote ? <div className="quote">{image && <img className="quote-img" src={image} alt="Captura de ecrã que anexaste" />}<span className="caption muted">{image ? 'Texto da tua captura de ecrã · lido só como texto' : 'Mensagem colada · lida só como texto'}</span><p>{quote}</p></div> : <p>{text}</p>}
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
    <div className="suggestions" role="group" aria-label="Respostas sugeridas">
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
// Portuguese labels for the planner's spending groups (ids from plan-output.json).
const PT: Record<string, string> = { rent: 'Renda', bills: 'Contas e telemóvel', subscriptions: 'Subscrições', transport: 'Transportes', groceries: 'Supermercado', eating_out: 'Restaurantes', shopping: 'Compras', travel: 'Viagens', going_out: 'Saídas', other: 'Outros' }
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
      <div className="segmented" role="tablist" aria-label="Período">
        {['all', ...S.months].map((m) => <button key={m} role="tab" aria-selected={m === month} className={m === month ? 'on' : ''} onClick={() => onMonth(m)}>{m === 'all' ? 'ago–out' : monthShort(m)}</button>)}
      </div>
      <div className="row-baseline"><span className="amount-sm"><Num value={total} /></span></div>
      <ul className="spend-list">
        <li>
          <button className="spend-row fixed-row" onClick={() => setOpen(open === 'fixed' ? null : 'fixed')} aria-expanded={open === 'fixed'}>
            <span className="spend-label"><span>Renda e contas</span><span className="tag">Fixo</span></span>
            <span />
            <span className="body-strong num"><Num value={fixedTotal} /></span>
          </button>
          {open === 'fixed' && <ul className="merchants">{fixed.map((g) => <li key={g.id}><span>{PT[g.id] ?? g.label}</span><span className="num">{eur(val(g))}</span></li>)}</ul>}
        </li>
        {shown.map(({ g, v }, idx) => (
          <li key={g.id}>
            <button className="spend-row" onClick={() => setOpen(open === g.id ? null : g.id)} aria-expanded={open === g.id} disabled={!g.top.length}>
              <span className="spend-label"><span>{PT[g.id] ?? g.label}</span></span>
              <span className="spend-bar" aria-hidden="true"><i className={idx === 0 ? 'top' : ''} style={{ width: `${(v / max) * 100}%` }} /></span>
              <span className="body-strong num"><Num value={v} /></span>
            </button>
            {open === g.id && <ul className="merchants">{g.top.map((m) => <li key={m.name}><span>{m.name}</span><span className="num">{eur(m.total)}</span></li>)}</ul>}
          </li>
        ))}
      </ul>
      {rows.length > 5 && <button className="btn btn-tertiary" onClick={() => setAll(!all)}>{all ? 'Mostrar menos' : `Mostrar mais ${rows.length - 5}`}</button>}
      <p className="caption muted">A tua conta à ordem, ago–out. Toca numa linha para ver onde.</p>
    </div>
  )
}

// ---------- Check a message I got ----------
export function ScamVerdict({ domain, reasons }: { domain: string; reasons: string[] }) {
  return (
    <div className="card verdict">
      <div className="row-between"><span className="body-strong">Provável burla</span><StatusBadge kind="danger">Não toques no link</StatusBadge></div>
      <ul className="reasons">{reasons.map((r) => <li key={r}><Icon name="alert" size={16} /><span>{r}</span></li>)}</ul>
      <p className="caption muted">Comparado com a forma como o banco te contacta. O link ({domain}) não foi aberto.</p>
    </div>
  )
}

export function CardControl({ frozen, onToggle }: { frozen: boolean; onToggle: () => void }) {
  return (
    <div className="card">
      <div className={`bank-card ${frozen ? 'frozen' : ''}`} aria-hidden="true">
        <div className="bc-row"><span className="bc-label">Débito</span>
          <svg className="bc-contactless" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M8.5 8.5a5 5 0 010 7M12 6a8.5 8.5 0 010 12M15.5 3.5a12 12 0 010 17" /></svg></div>
        <span className="bank-card-chip" />
        <div className="bc-row bc-bottom"><span className="bc-name">{ines.customer.name}</span><span className="bc-num">•••• {ines.accounts[0].iban_display.slice(-4)}</span></div>
        {frozen && <span className="frost"><Icon name="lock" size={22} />Congelado</span>}
      </div>
      <label className="switch-row">
        <span className="stack"><span className="body-strong">Congelar cartão</span><span className="caption muted">{frozen ? 'Nenhum pagamento passa. Descongela quando quiseres.' : 'Bloqueia novos pagamentos. A tua conta continua aberta.'}</span></span>
        <input type="checkbox" role="switch" checked={frozen} onChange={onToggle} aria-label="Congelar cartão" />
      </label>
    </div>
  )
}


// ---------- J2 · The Christmas allowance lands: one approval under a standing instruction ----------
const J2 = out.scenarios.j2_christmas_lands
export function ApprovalCard({ onApprove, onDecline, done }: { onApprove: () => void; onDecline: () => void; done?: 'approved' | 'declined' }) {
  return (
    <div className="card approval">
      <div className="row-gap"><AiOrb size={20} /><span className="body-strong">A IA quer mover dinheiro</span></div>
      <Row k="Valor" v={eur(J2.to_goal, 2)} strong />
      <Row k="De" v={`Conta à ordem ··${ines.accounts[0].iban_display.slice(-4)}`} />
      <Row k="Para" v="Objetivo Férias" />
      <Row k="Quando" v="Hoje, uma vez" />
      <hr />
      <Row k="Fica na conta" v={eur(J2.stays_in_account, 2)} />
      <Row k="Férias depois disto" v={`${eur(J2.goal_saved_after)} de ${eur(3000)}`} />
      <p className="caption muted">Nada se move até confirmares. Transferências nunca têm “permitir sempre”.</p>
      {done ? <StatusBadge kind={done === 'approved' ? 'positive' : 'warning'}>{done === 'approved' ? 'Aprovado com Face ID' : 'Não movido'}</StatusBadge>
        : <div className="stack-actions"><Button kind="secondary" onClick={onDecline}>Agora não</Button><Button onClick={onApprove}>Aprovar com Face ID</Button></div>}
    </div>
  )
}
export function MandateNote() {
  return <div className="mandate"><span className="caption muted">Instrução permanente: perguntar antes de mover até {eur(J2.to_goal)} quando o subsídio chegar.</span><Button kind="tertiary">Alterar</Button></div>
}

// ---------- J3 · A short month: the assistant spots a payment that changes the plan ----------
export const J3 = out.scenarios.j3_off_track_month
export const J3_OPTIONS: OptionItem[] = [
  { id: 'skip', label: `Saltar os ${eur(J3.transfer)} de janeiro`, result: `${eur(J3.options[0].total_by_deadline!)} até setembro · faltam ${eur(J3.options[0].short_of_plan!)} para o plano`, certain: true },
  { id: 'spread', label: `Distribuir: +${eur(J3.options[1].extra!)} nas próximas ${J3.options[1].count}`, result: `${eur(J3.options[1].new_monthly!)} por mês fev–set · ${eur(J3.options[1].total_by_deadline!)} até set. Mais do que sobrou em agosto e outubro.`, certain: true },
  { id: 'keep', label: 'Manter como planeado', result: `Os ${eur(J3.buffer_dip_if_kept)} saem da tua reserva de ${eur(900)}`, certain: true },
]
export function ShortMonthCard({ picked, onPick }: { picked: string | null; onPick: (id: string) => void }) {
  return (
    <div className="card">
      <div className="estimate"><span className="body-strong">Este mês deve sobrar cerca de {eur(J3.expected_left_estimate)}</span><span className="caption muted">Estimativa com base em ago–out, já com os {eur(J3.bill.amount)} pagos</span></div>
      <OptionList title="Mudar janeiro" label="Opções para janeiro" options={J3_OPTIONS} picked={picked} onPick={onPick} />
      <p className="caption muted">Não escolho por ti. O que escolheres pode ser anulado até 1 jan.</p>
    </div>
  )
}

// ---------- J4 · Borrowing is a hand-off, never advice ----------
export function HandoffCard({ monthly, gap, onKeep, onPerson, sent }: { monthly: number; gap: number; onKeep: () => void; onPerson: () => void; sent?: boolean }) {
  return (
    <div className="card">
      <div className="row-between"><span className="body-strong">Crédito pessoal</span><span className="tag">Com uma pessoa</span></div>
      <p className="muted">Pedir emprestado tem custos e precisa de uma análise do que podes pagar. Um especialista de crédito mostra-te o custo total antes de decidires.</p>
      <span className="label muted">O que vou passar</span>
      <ul className="bullets"><li>O teu objetivo: férias de {eur(3000)}</li><li>O teu plano: {eur(monthly)} por mês, faltam {eur(gap)} em julho</li><li>Perguntaste sobre um empréstimo para fechar a diferença</li></ul>
      {sent ? <StatusBadge kind="positive">Resumo enviado</StatusBadge> : <div className="stack-actions"><Button kind="secondary" onClick={onKeep}>Manter o meu plano</Button><Button onClick={onPerson}>Falar com uma pessoa</Button></div>}
    </div>
  )
}
