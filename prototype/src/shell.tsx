// App chrome shared by every journey: Home (assistant asleep), the assistant sheet, full screens, bottom sheets, lock screen.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import ines from '../../data/ines.json' with { type: 'json' }
import { AssistantPill, Button, Icon, PromptBox, ProgressBar, StatusBadge, Toast, type PillState } from './components'
import { day, eur } from './planner'
import { AiOrb } from './orb'

export const account = ines.accounts[0]
export const last4 = account.iban_display.slice(-4)
export const savingsName = ines.products_available.find((p) => p.id === 'prod_savings')!.name
const pretty = (m: string) => m.replace('SALARIO', 'Salário').replace(' Lda', '')

export type TxItem = { initial: string; title: string; sub: string; amount: number }
export const defaultRecent: TxItem[] = [...ines.transactions]
  .filter((t) => ['salary', 'groceries', 'leisure', 'eating_out'].includes(t.category))
  .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
  .map((t) => ({ initial: t.merchant[0], title: pretty(t.merchant), sub: day(t.date), amount: t.amount }))

export type GoalCardProps = {
  saved: number; goal: number; status: { kind: 'positive' | 'warning'; label: string }
  line: string; tone?: 'muted' | 'accent' | 'warn'; highlight?: boolean; onAsk?: () => void
}
export function GoalCard(g: GoalCardProps) {
  return (
    <section className={`card goal-card ${g.highlight ? 'highlight' : ''}`} aria-label="Holiday goal">
      <div className="row-between">
        <span className="row-gap"><span className="goal-icon"><Icon name="plane" size={16} /></span><span className="body-strong">Holiday</span></span>
        <StatusBadge kind={g.status.kind}>{g.status.label}</StatusBadge>
      </div>
      <div className="row-baseline"><span className="amount-sm">{eur(g.saved)}</span><span className="caption muted">of {eur(g.goal)}</span></div>
      <ProgressBar value={g.saved / g.goal} />
      <p className={`caption ${g.tone === 'accent' ? 'accent' : g.tone === 'warn' ? 'warn' : 'muted'}`}>{g.line}</p>
      {g.onAsk && <Button kind="tertiary" onClick={g.onAsk}>Ask about this plan</Button>}
    </section>
  )
}

export function Home({ pill, goal, toast, onOpen, masked, recentTitle = 'Recent', recent = defaultRecent }: {
  pill: { state: PillState; label?: string; action?: string; onDismiss?: () => void }
  goal?: GoalCardProps | null; toast?: null | { text: string; action?: string; onAction?: () => void }
  onOpen: () => void; masked?: boolean; recentTitle?: string; recent?: TxItem[]
}) {
  return (
    <div className="home">
      <div className="statusbar"><span>9:41</span></div>
      <div className="home-scroll">
        <header className="home-header">
          <span className="avatar">IM</span>
          <div className="search"><Icon name="search" size={18} /><span>Search</span></div>
        </header>
        <section className="balance" aria-label="Balance">
          <span className="caption muted">{account.name} · EUR</span>
          {masked ? <span className="amount" aria-label="Balance hidden">€ ••••</span> : <span className="amount">{eur(account.balance, 2)}</span>}
        </section>
        <nav className="quick" aria-label="Quick actions">
          {[['plus', 'Add money'], ['swap', 'Move'], ['target', 'Goals'], ['more', 'More']].map(([i, l]) => (
            <button key={l}><span className="quick-icon"><Icon name={i} /></span><span className="caption">{l}</span></button>
          ))}
        </nav>
        {goal && <GoalCard {...goal} />}
        <section className="card" aria-label={recentTitle}>
          <span className="label muted">{recentTitle}</span>
          {recent.map((t) => (
            <div className="tx" key={t.title + t.sub}>
              <span className="tx-avatar">{t.initial}</span>
              <span className="tx-text"><span className="body-strong">{t.title}</span><span className="caption muted">{t.sub}</span></span>
              <span className={`body-strong ${t.amount > 0 ? 'pos' : ''}`}>{t.amount > 0 ? '+' : '−'}{eur(Math.abs(t.amount), 2)}</span>
            </div>
          ))}
        </section>
      </div>
      <div className="dock">
        {toast && <TimedToast key={toast.text} {...toast} />}
        <AssistantPill {...pill} onOpen={onOpen} />
      </div>
      <nav className="tabbar" aria-label="Main">
        {[['home', 'Home', true], ['swap', 'Payments'], ['target', 'Savings'], ['card', 'Cards']].map(([i, l, on]) => (
          <button key={l as string} className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}><Icon name={i as string} size={22} /><span>{l}</span></button>
        ))}
      </nav>
    </div>
  )
}

// Undo window: toasts hide after 6 s.
function TimedToast(t: { text: string; action?: string; onAction?: () => void }) {
  const [on, setOn] = useState(true)
  useEffect(() => { const x = setTimeout(() => setOn(false), 6000); return () => clearTimeout(x) }, [])
  return on ? <Toast {...t} /> : null
}

// The assistant, awake: a full-height sheet over the app. Conversation is children; overlay is a full screen on top.
// Scrolling: a short new message keeps the view at the bottom; a tall one (a widget) is anchored at its top, so the page never jumps past it.
export function Sheet({ open, onClose, children, input, overlay, watch, above, nudge }: {
  open: boolean; onClose: () => void; children: ReactNode
  input: { value: string; onChange: (v: string) => void; onSend: (image?: { url: string; name: string }) => void; busy?: boolean; onStop?: () => void; transcript: () => string }
  overlay?: ReactNode; watch?: unknown; above?: ReactNode; nudge?: (fn: () => void) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const anchored = useRef<Element | null>(null)
  const smart = () => {
    const el = scroller.current; if (!el) return
    const lastTurn = el.lastElementChild as HTMLElement | null; if (!lastTurn) return
    if (lastTurn.offsetHeight > el.clientHeight * 0.6) {
      if (anchored.current === lastTurn) return
      anchored.current = lastTurn
      el.scrollTo({ top: lastTurn.offsetTop - 12, behavior: 'smooth' })
    } else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }
  nudge?.(smart)
  useEffect(() => { smart() }, [watch]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`sheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="AI assistant" aria-hidden={!open}>
      <div className="statusbar"><span>9:41</span></div>
      <header className="topbar">
        <button className="icon-btn round" onClick={onClose} aria-label="Close assistant"><Icon name="down" /></button>
        <div className="topbar-title"><span className="brand"><AiOrb size={20} state={input.busy ? 'thinking' : 'idle'} /><span className="body-strong">AI</span></span><span className="caption muted">AI assistant · can make mistakes</span></div>
        <span className="icon-btn" />
      </header>
      <div className="conversation" ref={scroller} aria-live="polite">{children}</div>
      <div className="input-dock">{above}<PromptBox {...input} /></div>
      {overlay}
    </div>
  )
}

export function Screen({ title, sub, onBack, children, dock, label }: { title?: string; sub?: string; onBack?: () => void; children: ReactNode; dock?: ReactNode; label: string }) {
  return (
    <div className="screen" aria-label={label}>
      <div className="statusbar"><span>9:41</span></div>
      {title && <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="back" /></button>
        <div className="topbar-title"><span className="body-strong">{title}</span>{sub && <span className="caption muted">{sub}</span>}</div>
        <span className="icon-btn" />
      </header>}
      <div className="screen-body">{children}</div>
      {dock && <div className="action-dock">{dock}</div>}
    </div>
  )
}

export function BottomSheet({ children, label, onScrim }: { children: ReactNode; label: string; onScrim?: () => void }) {
  return (
    <div className="bsheet-wrap" role="dialog" aria-modal="true" aria-label={label}>
      <button className="scrim" aria-label="Close" onClick={onScrim} />
      <div className="bsheet"><span className="grabber" aria-hidden="true" />{children}</div>
    </div>
  )
}

export function LockScreen({ date, time, title, body, onOpen }: { date: string; time: string; title: string; body: string; onOpen: () => void }) {
  return (
    <div className="lock" data-theme="dark">
      <div className="statusbar"><span /></div>
      <div className="lock-clock"><span className="muted">{date}</span><span className="lock-time">{time}</span></div>
      <div className="lock-stack">
        <button className="notification" onClick={onOpen}>
          <span className="row-between"><span className="row-gap"><span className="app-icon" /><span className="caption muted">AI · your bank</span></span><span className="caption muted">now</span></span>
          <span className="body-strong">{title}</span>
          <span>{body}</span>
        </button>
        <p className="caption muted center">Amounts are hidden on the lock screen.</p>
      </div>
    </div>
  )
}
