// Search and ask, one field (decided 4 Nov 2026, see design/DECISIONS.md · D1).
// As you type, exact results appear instantly from the account and the app: payments, places in the app. No AI involved.
// One row, "Perguntar à IA", opens the assistant with the query already sent. It comes first when the query reads as a
// question ("quanto…", "posso…", "?"), last when it looks like a lookup ("EDP").
import { useEffect, useRef, useState } from 'react'
import ines from '../../data/ines.json' with { type: 'json' }
import { Icon } from './components'
import { AiOrb } from './orb'
import { day, eur } from './planner'
import type { Tab } from './shell'

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const name = (m: string) => m.replace('SALARIO · ', 'Salário · ').replace(' Lda', '').replace('Transfer to landlord', 'Renda').replace(' (½ share)', ' (metade)')
const TX = [...ines.transactions].sort((a, b) => b.date.localeCompare(a.date)).map((t) => ({ ...t, label: name(t.merchant) }))

type Place = { label: string; sub: string; icon: string; tab: Tab; keys: string }
const PLACES: Place[] = [
  { label: 'Congelar cartão', sub: 'Cartões', icon: 'lock', tab: 'cards', keys: 'congelar bloquear cartao perdi roubado freeze' },
  { label: 'Limites do cartão', sub: 'Cartões', icon: 'card', tab: 'cards', keys: 'limites cartao levantamento' },
  { label: 'Ver PIN', sub: 'Cartões', icon: 'card', tab: 'cards', keys: 'pin codigo cartao' },
  { label: 'Cartões', sub: 'Página', icon: 'card', tab: 'cards', keys: 'cartoes cartao debito' },
  { label: 'Transferir', sub: 'Pagamentos', icon: 'swap', tab: 'payments', keys: 'transferir transferencia enviar iban' },
  { label: 'MB WAY', sub: 'Pagamentos', icon: 'phone', tab: 'payments', keys: 'mb way mbway enviar pedir' },
  { label: 'Pagar contas', sub: 'Pagamentos', icon: 'swap', tab: 'payments', keys: 'pagar contas servicos referencia multibanco' },
  { label: 'Objetivos e poupança', sub: 'Poupança', icon: 'target', tab: 'savings', keys: 'poupanca poupar objetivos ferias juros' },
]

const QUESTION = /\?|^(quanto|quantos|como|posso|porque|porqu[eê]|para onde|onde|quando|o que|qual|quero|ajuda|devo|consigo|e se)\b/i

export function SearchScreen({ onClose, onAsk, onGo }: { onClose: () => void; onAsk: (q: string) => void; onGo: (t: Tab) => void }) {
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { const t = setTimeout(() => input.current?.focus(), 250); return () => clearTimeout(t) }, [])
  const n = norm(q.trim())
  const words = n.split(/\s+/).filter((w) => w.length > 1)
  const tx = n.length < 2 ? [] : TX.filter((t) => norm(t.label).includes(n) || words.some((w) => w.length > 2 && norm(t.label).includes(w)))
  const places = n.length < 2 ? [] : PLACES.filter((p) => words.some((w) => norm(p.label + ' ' + p.keys).includes(w)))
  const question = QUESTION.test(q.trim())
  const total = tx.reduce((s, t) => s + t.amount, 0)

  const askRow = q.trim() && (
    <button className="search-ask" onClick={() => onAsk(q.trim())}>
      <AiOrb size={28} />
      <span className="stack"><span className="body-strong">Perguntar à IA</span><span className="caption muted one-line">“{q.trim()}”</span></span>
      <Icon name="chevron" size={18} />
    </button>
  )

  return (
    <div className="screen search-screen" aria-label="Pesquisar ou perguntar">
      <div className="statusbar"><span>9:41</span></div>
      <header className="search-head">
        <label className="search field">
          <Icon name="search" size={18} />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar ou perguntar" aria-label="Pesquisar ou perguntar"
            onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) onAsk(q.trim()); if (e.key === 'Escape') onClose() }} enterKeyHint="search" />
          {q && <button className="icon-btn" onClick={() => setQ('')} aria-label="Limpar"><Icon name="close" size={16} /></button>}
        </label>
        <button className="link" onClick={onClose}>Cancelar</button>
      </header>
      <div className="screen-body search-body">
        {!q.trim() ? <>
          <section className="search-group">
            <span className="label muted">Procurar</span>
            <div className="chips wrap">{['Continente', 'EDP', 'MB WAY', 'Congelar cartão'].map((s) => <button key={s} className="chip" onClick={() => setQ(s)}>{s}</button>)}</div>
          </section>
          <section className="search-group">
            <span className="label muted">Perguntar à IA</span>
            {['Quanto gastei em restaurantes?', 'Posso poupar para umas férias?', 'Recebi uma mensagem estranha'].map((s) => (
              <button key={s} className="list-line" onClick={() => onAsk(s)}><span className="row-gap"><AiOrb size={18} /><span>{s}</span></span><Icon name="chevron" size={18} /></button>
            ))}
          </section>
        </> : <>
          {question && askRow}
          {places.length > 0 && <section className="search-group">
            <span className="label muted">Na app</span>
            {places.slice(0, 3).map((p) => (
              <button key={p.label} className="list-line" onClick={() => onGo(p.tab)}><span className="row-gap"><span className="lead-icon sm"><Icon name={p.icon} size={16} /></span><span className="stack"><span>{p.label}</span><span className="caption muted">{p.sub}</span></span></span><Icon name="chevron" size={18} /></button>
            ))}
          </section>}
          {tx.length > 0 && <section className="search-group">
            <div className="row-between"><span className="label muted">Movimentos · ago–out</span><span className="caption muted">{tx.length} · {total > 0 ? '+' : '−'}{eur(Math.abs(total), 2)}</span></div>
            {tx.slice(0, 5).map((t) => (
              <div className="tx" key={t.id}>
                <span className="tx-avatar">{t.label[0]}</span>
                <span className="tx-text"><span className="body-strong">{t.label}</span><span className="caption muted">{day(t.date)}</span></span>
                <span className={`body-strong num ${t.amount > 0 ? 'pos' : ''}`}>{t.amount > 0 ? '+' : '−'}{eur(Math.abs(t.amount), 2)}</span>
              </div>
            ))}
            {tx.length > 5 && <span className="caption muted">e mais {tx.length - 5}</span>}
          </section>}
          {!places.length && !tx.length && !question && <p className="muted">Sem resultados exatos para “{q.trim()}”. A IA pode procurar por ti.</p>}
          {!question && askRow}
          <p className="caption muted search-note"><Icon name="lock" size={14} /> Os resultados aparecem logo e não usam IA. Só “Perguntar à IA” abre uma conversa.</p>
        </>}
      </div>
    </div>
  )
}
