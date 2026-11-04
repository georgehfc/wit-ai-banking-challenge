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
export type PillProps = { state: PillState; label?: string; action?: string; onDismiss?: () => void; onVoice?: () => void }
export type GoalCardProps = {
  saved: number; goal: number; status: { kind: 'positive' | 'warning'; label: string }
  line: string; tone?: 'muted' | 'accent' | 'warn'; highlight?: boolean; onAsk?: () => void
}

export function GoalCard(g: GoalCardProps) {
  return (
    <section className={`card goal-card ${g.highlight ? 'highlight' : ''}`} aria-label="Objetivo Férias">
      <div className="row-between">
        <span className="row-gap"><span className="goal-icon"><Icon name="plane" size={16} /></span><span className="body-strong">Férias</span></span>
        <StatusBadge kind={g.status.kind}>{g.status.label}</StatusBadge>
      </div>
      <div className="row-baseline"><span className="amount-sm">{eur(g.saved)}</span><span className="caption muted">de {eur(g.goal)}</span></div>
      <ProgressBar value={g.saved / g.goal} />
      <p className={`caption ${g.tone === 'accent' ? 'accent' : g.tone === 'warn' ? 'warn' : 'muted'}`}>{g.line}</p>
      {g.onAsk && <Button kind="tertiary" onClick={g.onAsk}>Perguntar sobre este plano</Button>}
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

export function AppScreens({ tab, onTab, pill, goal, toast, onOpen, frozen, onFreeze, onPlanWithAI, onSearch }: {
  tab: Tab; onTab: (t: Tab) => void; pill: PillProps; goal?: GoalCardProps | null
  toast?: null | { text: string; action?: string; onAction?: () => void }
  onOpen: () => void; frozen: boolean; onFreeze: () => void; onPlanWithAI: () => void; onSearch: () => void
}) {
  const oct = tx.filter((t) => t.date.startsWith('2026-10')).slice(0, 8).map((t) => ({ initial: t.merchant[0], title: pretty(t.merchant), sub: day(t.date), amount: t.amount }))
  return (
    <div className="home">
      <div className="statusbar"><span>9:41</span></div>
      <div className="home-scroll" key={tab}>
        {tab === 'home' && <>
          <header className="home-header">
            <span className="avatar">IM</span>
            <span className="greeting-inline">Olá, {ines.customer.name.split(' ')[0]}</span>
          </header>
          <section className="balance" aria-label="Saldo">
            <span className="caption muted">{account.name} · EUR</span>
            <span className="amount">{eur(account.balance, 2)}</span>
          </section>
          <nav className="quick" aria-label="Ações rápidas">
            {([['plus', 'Carregar', null], ['swap', 'Transferir', 'payments'], ['target', 'Objetivos', 'savings'], ['more', 'Mais', null]] as const).map(([i, l, to]) => (
              <button key={l} onClick={() => to && onTab(to)}><span className="quick-icon"><Icon name={i} /></span><span className="caption">{l}</span></button>
            ))}
          </nav>
          {goal && <GoalCard {...goal} />}
          <TxList title="Recentes" items={defaultRecent} />
        </>}
        {tab === 'payments' && <>
          <h1 className="page-title">Pagamentos</h1>
          <div className="chips">{['Enviar', 'Pedir', 'Pagar contas', 'MB WAY'].map((c) => <button key={c} className="chip">{c}</button>)}</div>
          <TxList title="Outubro" items={oct} />
        </>}
        {tab === 'savings' && <>
          <h1 className="page-title">Poupança</h1>
          <section className="card">
            <div className="row-between"><span className="body-strong">{savingsName}</span><span className="tag">{(savingsRate * 100).toLocaleString('pt-PT')}% por ano, ilustrativo</span></div>
            <p className="caption muted">Levanta quando quiseres sem perder juros.</p>
          </section>
          {goal ? <GoalCard {...goal} /> : (
            <section className="card empty-goal">
              <span className="body-strong">Ainda sem objetivos</span>
              <p className="muted">Diz à IA para que estás a poupar. Ela calcula um valor que cabe no teu mês, e nada se move sem a tua aprovação.</p>
              <Button onClick={onPlanWithAI}>Planear com a IA</Button>
            </section>
          )}
        </>}
        {tab === 'cards' && <>
          <h1 className="page-title">Cartões</h1>
          <CardControl frozen={frozen} onToggle={onFreeze} />
          <section className="card list-card">
            {['Limites do cartão', 'Ver PIN', 'Substituir cartão'].map((r) => <button key={r} className="list-line"><span>{r}</span><Icon name="chevron" size={18} /></button>)}
          </section>
        </>}
      </div>
      <div className="dock">
        <div className={`dock-float ${tab === 'home' ? '' : 'compact'}`}>
          {toast && <TimedToast key={toast.text} {...toast} />}
          {tab === 'home'
            ? <div className={`home-dock ${pill.state === 'nudge' ? 'alerting' : ''}`}>
                <button className="search-fab" onClick={onSearch} aria-label="Pesquisar" title="Pesquisar" tabIndex={pill.state === 'nudge' ? -1 : 0}><Icon name="search" size={20} /></button>
                <AssistantPill {...pill} onOpen={onOpen} />
              </div>
            : <button className={`sphere-fab ${pill.state} ai-ring${pill.state === 'working' ? ' ai-busy' : ''}`} onClick={onOpen} aria-label={pill.state === 'idle' ? 'Pergunta à IA' : `Assistente de IA: ${pill.label ?? ''}`}>
                <AiOrb size={48} state={pill.state === 'working' ? 'thinking' : 'idle'} />{(pill.state === 'nudge' || pill.state === 'ready') && <span className="badge" />}
              </button>}
        </div>
      </div>
      <nav className="tabbar" aria-label="Principal">
        {([['home', 'home', 'Início'], ['payments', 'swap', 'Pagamentos'], ['savings', 'target', 'Poupança'], ['cards', 'card', 'Cartões']] as const).map(([id, i, l]) => (
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
    <div className={`sheet ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Assistente de IA" aria-hidden={!open}>
      <div className="statusbar"><span>9:41</span></div>
      <header className="topbar">
        <button className="icon-btn round" onClick={onClose} aria-label="Fechar assistente"><Icon name="down" /></button>
        <div className="topbar-title">
          <span className="brand"><AiOrb size={16} state={busy ? 'thinking' : 'idle'} /><span className="body-strong">{title ?? 'IA'}</span></span>
          <span className="caption muted">Assistente de IA · pode cometer erros</span>
        </div>
        <button className="icon-btn round" onClick={onHistory} aria-label="Conversas"><Icon name="history" /></button>
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
        <button className="icon-btn round" onClick={onBack} aria-label="Voltar"><Icon name="back" /></button>
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
      <button className="scrim" aria-label="Fechar" onClick={onScrim} />
      <div className="bsheet"><span className="grabber" aria-hidden="true" />{children}</div>
    </div>
  )
}
