// App chrome: the bank's pages (Home, Payments, Savings, Cards) with the assistant asleep on top of them,
// the assistant's frame (sheet + header), full screens and bottom sheets.
// On Home the assistant is a full "Ask AI" pill; on the other pages it's only the sphere, so it isn't the focus.
import { useEffect, useState, type ReactNode } from 'react'
import ines from '../../data/ines.json' with { type: 'json' }
import { AssistantPill, Button, Icon, ProgressBar, StatusBadge, Toast, type PillState } from './components'
import { CardControl } from './chat'
import { day, eur } from './planner'
import { AiOrb } from './orb'

export const account = ines.accounts[0]
export const last4 = account.iban_display.slice(-4)
export const savingsName = ines.products_available.find((p) => p.id === 'prod_savings')!.name
const savingsRate = ines.products_available.find((p) => p.id === 'prod_savings')!.rate_tanb_illustrative as number
const pretty = (m: string) => m.replace('SALARIO', 'Salário').replace(' Lda', '')
const tx = [...ines.transactions].sort((a, b) => b.date.localeCompare(a.date))

export type TxItem = { initial: string; title: string; sub: string; amount: number }
export const defaultRecent: TxItem[] = tx
  .filter((t) => ['salary', 'groceries', 'leisure', 'eating_out'].includes(t.category)).slice(0, 3)
  .map((t) => ({ initial: t.merchant[0], title: pretty(t.merchant), sub: day(t.date), amount: t.amount }))

export type Tab = 'home' | 'payments' | 'savings' | 'cards'
export type PillProps = { state: PillState; label?: string; action?: string; onDismiss?: () => void }
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

function TxList({ items, title }: { items: TxItem[]; title: string }) {
  return (
    <section className="card" aria-label={title}>
      <span className="label muted">{title}</span>
      {items.map((t) => (
        <div className="tx" key={t.title + t.sub + t.amount}>
          <span className="tx-avatar">{t.initial}</span>
          <span className="tx-text"><span className="body-strong">{t.title}</span><span className="caption muted">{t.sub}</span></span>
          <span className={`body-strong num ${t.amount > 0 ? 'pos' : ''}`}>{t.amount > 0 ? '+' : '−'}{eur(Math.abs(t.amount), 2)}</span>
        </div>
      ))}
    </section>
  )
}

// Undo window: toasts hide after 6 s.
function TimedToast(t: { text: string; action?: string; onAction?: () => void }) {
  const [on, setOn] = useState(true)
  useEffect(() => { const x = setTimeout(() => setOn(false), 6000); return () => clearTimeout(x) }, [])
  return on ? <Toast {...t} /> : null
}

export function AppScreens({ tab, onTab, pill, goal, toast, onOpen, frozen, onFreeze, onPlanWithAI }: {
  tab: Tab; onTab: (t: Tab) => void; pill: PillProps; goal?: GoalCardProps | null
  toast?: null | { text: string; action?: string; onAction?: () => void }
  onOpen: () => void; frozen: boolean; onFreeze: () => void; onPlanWithAI: () => void
}) {
  const oct = tx.filter((t) => t.date.startsWith('2026-10')).slice(0, 8).map((t) => ({ initial: t.merchant[0], title: pretty(t.merchant), sub: day(t.date), amount: t.amount }))
  return (
    <div className="home">
      <div className="statusbar"><span>9:41</span></div>
      <div className="home-scroll" key={tab}>
        {tab === 'home' && <>
          <header className="home-header">
            <span className="avatar">IM</span>
            <div className="search"><Icon name="search" size={18} /><span>Search</span></div>
          </header>
          <section className="balance" aria-label="Balance">
            <span className="caption muted">{account.name} · EUR</span>
            <span className="amount">{eur(account.balance, 2)}</span>
          </section>
          <nav className="quick" aria-label="Quick actions">
            {[['plus', 'Add money'], ['swap', 'Move'], ['target', 'Goals'], ['more', 'More']].map(([i, l]) => (
              <button key={l}><span className="quick-icon"><Icon name={i} /></span><span className="caption">{l}</span></button>
            ))}
          </nav>
          {goal && <GoalCard {...goal} />}
          <TxList title="Recent" items={defaultRecent} />
        </>}
        {tab === 'payments' && <>
          <h1 className="page-title">Payments</h1>
          <div className="chips">{['Send', 'Request', 'Pay a bill', 'MB WAY'].map((c) => <button key={c} className="chip">{c}</button>)}</div>
          <TxList title="October" items={oct} />
        </>}
        {tab === 'savings' && <>
          <h1 className="page-title">Savings</h1>
          <section className="card">
            <div className="row-between"><span className="body-strong">{savingsName}</span><span className="tag">{(savingsRate * 100).toLocaleString('en-IE')}% a year, illustrative</span></div>
            <p className="caption muted">Take money out any time without losing interest.</p>
          </section>
          {goal ? <GoalCard {...goal} /> : (
            <section className="card empty-goal">
              <span className="body-strong">No goals yet</span>
              <p className="muted">Tell AI what you’re saving for. It works out an amount that fits your month, and nothing moves until you approve.</p>
              <Button onClick={onPlanWithAI}>Plan it with AI</Button>
            </section>
          )}
        </>}
        {tab === 'cards' && <>
          <h1 className="page-title">Cards</h1>
          <CardControl frozen={frozen} onToggle={onFreeze} />
          <section className="card list-card">
            {['Card limits', 'Show PIN', 'Replace card'].map((r) => <button key={r} className="list-line"><span>{r}</span><Icon name="chevron" size={18} /></button>)}
          </section>
        </>}
      </div>
      <div className="dock">
        <div className={`dock-float ${tab === 'home' ? '' : 'compact'}`}>
          {toast && <TimedToast key={toast.text} {...toast} />}
          {tab === 'home'
            ? <AssistantPill {...pill} onOpen={onOpen} />
            : <button className={`sphere-fab ${pill.state}`} onClick={onOpen} aria-label={pill.state === 'idle' ? 'Ask AI' : `AI assistant: ${pill.label ?? ''}`}>
                <AiOrb size={48} state={pill.state === 'working' ? 'thinking' : 'idle'} />{(pill.state === 'nudge' || pill.state === 'ready') && <span className="badge" />}
              </button>}
        </div>
      </div>
      <nav className="tabbar" aria-label="Main">
        {([['home', 'home', 'Home'], ['payments', 'swap', 'Payments'], ['savings', 'target', 'Savings'], ['cards', 'card', 'Cards']] as const).map(([id, i, l]) => (
          <button key={id} className={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => onTab(id)}><Icon name={i} size={22} /><span>{l}</span></button>
        ))}
      </nav>
    </div>
  )
}

// The assistant, awake: a full-height sheet over the app. Header: close · title · chat history.
export function Sheet({ open, onClose, title, busy, onHistory, children }: {
  open: boolean; onClose: () => void; title?: string; busy?: boolean; onHistory: () => void; children: ReactNode
}) {
  return (
    <div className={`sheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="AI assistant" aria-hidden={!open}>
      <div className="statusbar"><span>9:41</span></div>
      <header className="topbar">
        <button className="icon-btn round" onClick={onClose} aria-label="Close assistant"><Icon name="down" /></button>
        <div className="topbar-title">
          <span className="brand"><AiOrb size={16} state={busy ? 'thinking' : 'idle'} /><span className="body-strong">{title ?? 'AI'}</span></span>
          <span className="caption muted">AI assistant · can make mistakes</span>
        </div>
        <button className="icon-btn round" onClick={onHistory} aria-label="Chats"><Icon name="history" /></button>
      </header>
      {children}
    </div>
  )
}

export function Screen({ title, sub, onBack, children, dock, label }: { title?: string; sub?: string; onBack?: () => void; children: ReactNode; dock?: ReactNode; label: string }) {
  return (
    <div className="screen" aria-label={label}>
      <div className="statusbar"><span>9:41</span></div>
      {title && <header className="topbar">
        <button className="icon-btn round" onClick={onBack} aria-label="Back"><Icon name="back" /></button>
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
