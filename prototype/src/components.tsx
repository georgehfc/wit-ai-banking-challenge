// Components used by J1, named as in DESIGN.md / Figma page 3 (code name = Figma name).
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GOAL, eur, monthShort, type Plan, type GapOption } from './planner'
import { AiOrb } from './orb'

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
  clip: <path d="M20 11.5l-7.8 7.8a5 5 0 01-7.1-7.1l8.5-8.5a3.3 3.3 0 014.7 4.7l-8.5 8.5a1.7 1.7 0 01-2.4-2.4l7.8-7.8" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></>,
  square: <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" />,
  history: <><path d="M4 12a8 8 0 108-8 8 8 0 00-6.3 3" /><path d="M4 4v4h4M12 8v4l3 2" /></>,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />,
  trash: <><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  shield: <><path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
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
// Glass pill with a shimmer travelling round its border (adapted from a 21st.dev glassmorphism CTA, in plain CSS).
export type PillState = 'idle' | 'nudge' | 'working' | 'ready'
// Modes: rest (idle) · alert (nudge, dismissible) · processing (working) · ready (answer waiting).
export function AssistantPill({ state, label, action, onOpen, onDismiss }: { state: PillState; label?: string; action?: string; onOpen: () => void; onDismiss?: () => void }) {
  const text = label ?? 'Pergunta à IA'
  return (
    <div className={`pill pill-${state} ai-ring${state === 'working' ? ' ai-busy' : ''}`}>
      <button className="pill-main" onClick={onOpen} aria-label={state === 'idle' ? 'Pergunta à IA, assistente de IA' : `Assistente de IA: ${text}${action ? `. ${action}` : ''}`}>
        <span className="pill-glyph"><AiOrb size={32} state={state === 'working' ? 'thinking' : 'idle'} />{(state === 'nudge' || state === 'ready') && <span className="badge" />}</span>
        <span className="pill-label">{text}</span>
        {action ? <span className="pill-action">{action}</span> : state === 'idle' ? <span className="pill-spark" aria-hidden="true"><Icon name="mic" size={16} /></span> : null}
      </button>
      {onDismiss && <button className="pill-dismiss" onClick={onDismiss} aria-label="Dispensar"><Icon name="close" size={16} /></button>}
    </div>
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
export function StepsReceipt({ steps, onDone, summary = 'Read Aug–Oct · Calculated by planner · Checked rules', title }: { steps: Step[]; onDone?: () => void; summary?: string; title?: string }) {
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
      {done ? <button className="steps-head" onClick={() => setOpen(false)}>Trabalhou 2 s <Icon name="down" size={14} /></button> : title && <span className="steps-title">{title}</span>}
      {steps.map((s, i) => (
        <div key={s.label} className={`step ${i < n ? 'done' : i === n ? 'now' : 'todo'}`}>
          <span className="step-dot">{i < n && <Icon name="check" size={11} />}</span>
          <span>{s.label}</span><span className="step-role">{s.role}</span>
        </div>
      ))}
    </div>
  )
  return <button className="steps steps-collapsed" onClick={() => setOpen(true)} aria-label={`Trabalhou 2 segundos, ${steps.length} passos. Mostrar passos`}><span className="step-dot done"><Icon name="check" size={11} /></span><span className="grow-text">Trabalhou 2 s · {summary}</span><Icon name="chevron" size={14} /></button>
}

// PromptBox: the assistant's input. Text that grows as you type; attach a screenshot (scam check); voice; send ↔ stop.
// Adapted from a 21st.dev "AI prompt box" to the design system (tokens, light/dark, focus rings kept);
// its Search/Think/Canvas modes were left out: they mean nothing in a banking assistant.
export function PromptBox({ value, onChange, onSend, busy = false, onStop, placeholder = 'Pergunta o que quiseres', transcript }: {
  value: string; onChange: (v: string) => void; onSend: (image?: { url: string; name: string }) => void
  busy?: boolean; onStop?: () => void; placeholder?: string; transcript: () => string
}) {
  const ta = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const [image, setImage] = useState<{ url: string; name: string } | null>(null)
  const [rec, setRec] = useState(false)
  const [secs, setSecs] = useState(0)
  useEffect(() => { const el = ta.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px` }, [value])
  useEffect(() => { if (!rec) return; setSecs(0); const t = setInterval(() => setSecs((x) => x + 1), 1000); return () => clearInterval(t) }, [rec])
  const has = !!value.trim() || !!image
  const submit = () => { if (!has || busy) return; onSend(image ?? undefined); setImage(null) }
  const stopRec = () => { setRec(false); onChange(transcript()); setTimeout(() => ta.current?.focus(), 0) }
  const pickFile = (f?: File) => { if (!f || !f.type.startsWith('image/')) return; const r = new FileReader(); r.onload = () => setImage({ url: String(r.result), name: f.name }); r.readAsDataURL(f) }
  const mode = busy ? 'stop' : rec ? 'rec' : has ? 'send' : 'mic'
  return (
    <form className={`prompt ${busy ? 'busy' : ''} ${rec ? 'recording' : ''}${busy || rec ? ' ai-ring ai-busy' : has ? ' ai-ring' : ''}`} onSubmit={(e) => { e.preventDefault(); submit() }}>
      {image && !rec && (
        <div className="prompt-attachments">
          <span className="thumb"><img src={image.url} alt={`Anexo: ${image.name}`} /><button type="button" aria-label="Remover captura de ecrã" onClick={() => setImage(null)}><Icon name="close" size={12} /></button></span>
          <span className="caption muted">Captura de ecrã anexada. Lida só como texto.</span>
        </div>
      )}
      {rec ? (
        <div className="prompt-rec" role="status" aria-live="polite">
          <span className="rec-time"><i />{`0:${String(secs).padStart(2, '0')}`}</span>
          <span className="rec-bars" aria-hidden="true">{Array.from({ length: 28 }, (_, k) => <i key={k} style={{ animationDelay: `${(k % 7) * 90}ms`, height: `${30 + ((k * 37) % 60)}%` }} />)}</span>
          <span className="caption muted">A ouvir… toca em parar quando terminares</span>
        </div>
      ) : (
        <textarea ref={ta} rows={1} value={value} placeholder={busy ? 'A IA está a responder…' : placeholder} aria-label="Mensagem para a IA"
          onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          onPaste={(e) => { const f = [...e.clipboardData.files].find((x) => x.type.startsWith('image/')); if (f) { e.preventDefault(); pickFile(f) } }} />
      )}
      <div className="prompt-actions">
        <span className="prompt-left">
          {!rec && <button type="button" className="prompt-icon" aria-label="Anexar captura de ecrã" title="Anexar captura de ecrã" onClick={() => file.current?.click()} disabled={busy}><Icon name="clip" size={20} /></button>}
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { pickFile(e.target.files?.[0]); e.target.value = '' }} />
        </span>
        <button type={mode === 'send' ? 'submit' : 'button'} className={`prompt-main ${mode}`}
          aria-label={mode === 'stop' ? 'Parar a resposta' : mode === 'rec' ? 'Parar a gravação' : mode === 'send' ? 'Enviar' : 'Falar em vez de escrever'}
          title={mode === 'stop' ? 'Parar a resposta' : mode === 'rec' ? 'Parar a gravação' : mode === 'send' ? 'Enviar' : 'Falar em vez de escrever'}
          onClick={mode === 'stop' ? onStop : mode === 'rec' ? stopRec : mode === 'mic' ? () => setRec(true) : undefined}>
          <Icon name={mode === 'stop' ? 'square' : mode === 'rec' ? 'square' : mode === 'send' ? 'up' : 'mic'} size={18} />
        </button>
      </div>
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
          <span className="body-strong">{eur(m.margin)} livres</span>
        </div>
      ))}
      <div className="legend"><span><i className="fixed" />Fixos {eur(fixed)}</span><span><i className="spend" />Gastos</span><span><i className="left" />Livre</span></div>
      <p className="caption muted">Com base na tua conta, ago–out · Calculado pelo planeador</p>
    </div>
  )
}

export function ProjectionChart({ p, goal = GOAL }: { p: Plan; goal?: number }) {
  const last = p.byMonth[p.byMonth.length - 1]
  const label = `Poupado até ${monthShort(last.month)}: ${eur(p.total)} de ${eur(goal)}.${p.gap > 0 ? ` Faltam ${eur(goal - p.total)}.` : ' Objetivo atingido.'}`
  const top = Math.max(goal, p.total)
  return (
    <div className="chart" role="img" aria-label={label}>
      <div className="goal-line" style={{ bottom: `calc(20px + (100% - 24px) * ${goal / top})` }}><span>Objetivo {eur(goal)}</span></div>
      {p.byMonth.map((m, i) => {
        const isLast = i === p.byMonth.length - 1
        return (
          <div className="bar-col" key={m.month}>
            <div className="bar-track">
              {isLast && goal > m.saved && <div className="bar-gap" style={{ height: `${((goal - m.saved) / top) * 100}%`, bottom: `${(m.saved / top) * 100}%` }} />}
              <div className={`bar ${isLast ? 'highlight' : ''}`} style={{ height: `${(m.saved / top) * 100}%` }}>{m.christmas > 0 && <div className="bar-xmas" style={{ height: `${(m.christmas / m.saved) * 100}%` }} />}</div>
            </div>
            <span className="caption muted">{monthShort(m.month)}</span>
          </div>
        )
      })}
    </div>
  )
}

export function fitBadge(p: Plan) {
  if (p.fit === 'fits') return <StatusBadge kind="positive">Cabe em todos os meses</StatusBadge>
  if (p.fit === 'too_high') return <StatusBadge kind="danger">Mais do que qualquer mês</StatusBadge>
  return <StatusBadge kind="warning">Curto em {p.shortMonths.length} de 3 meses</StatusBadge>
}

export function AmountControl({ value, onChange, min, max, presets, total }: { value: number; onChange: (v: number) => void; min: number; max: number; presets: number[]; total: string }) {
  return (
    <div className="amount-control">
      <input type="range" min={min} max={max} step={10} value={value} onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Valor mensal" aria-valuetext={`${eur(value)} a month, ${total}`} style={{ ['--pct' as string]: `${((value - min) / (max - min)) * 100}%` }} />
      <div className="ends caption muted"><span>{eur(min)}</span><span>{eur(max)} (objetivo completo)</span></div>
      <div className="chips" role="group" aria-label="Valores sugeridos">
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
        <button key={o.id} role="radio" aria-checked={picked === o.id} className={`option ${picked === o.id ? 'selected ai-ring' : ''} ${o.certain === false ? 'uncertain' : ''}`} onClick={() => onPick(o.id)}>
          <span className="radio" aria-hidden="true" />
          <span className="option-text"><span className="body-strong">{o.label}</span><span className="caption muted">{o.result}</span></span>
        </button>
      ))}
    </div>
  )
}
export function GapResolver({ gap, options, picked, onPick }: { gap: number; options: GapOption[]; picked: string | null; onPick: (id: GapOption['id']) => void }) {
  return <div className="card"><OptionList title={`Fechar a diferença de ${eur(gap)}`} label={`Formas de fechar a diferença de ${eur(gap)}`} options={options} picked={picked} onPick={(id) => onPick(id as GapOption['id'])} /></div>
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
        <span>{ok ? 'Aprovado' : 'Face ID'}</span>
      </div>
    </div>
  )
}

// ---------- added for J0, J2–J5 ----------
export function ReplyChips({ items }: { items: { label: string; onClick: () => void }[] }) {
  return <div className="chips" role="group" aria-label="Respostas sugeridas">{items.map((c) => <button key={c.label} className="chip" onClick={c.onClick}>{c.label}</button>)}</div>
}

// ApprovalRequest inline in chat (move-money). No "always allow" for money, by design (SECURITY.md).
export function ApprovalCard({ title, rows, after, note, state, onDecline, onApprove }: {
  title: string; rows: [string, string, boolean?][]; after?: [string, string][]; note: string
  state: 'pending' | 'approved' | 'declined'; onDecline: () => void; onApprove: () => void
}) {
  return (
    <div className="card" aria-label={title}>
      <div className="row-between"><span className="body-strong">{title}</span>{state === 'approved' && <StatusBadge kind="positive">Aprovado</StatusBadge>}{state === 'declined' && <span className="caption muted">Agora não</span>}</div>
      {rows.map(([k, v, strong]) => <Row key={k} k={k} v={v} strong={strong} />)}
      {after && <><hr />{after.map(([k, v]) => <Row key={k} k={k} v={v} />)}</>}
      {state === 'pending' && <><p className="caption muted">{note}</p>
        <div className="actions"><Button kind="secondary" grow onClick={onDecline}>Agora não</Button><Button grow onClick={onApprove}>Aprovar com Face ID</Button></div></>}
    </div>
  )
}

export function HandoffCard({ topic, why, passOn, onKeep, onTalk, done }: { topic: string; why: string; passOn: string[]; onKeep: () => void; onTalk: () => void; done: boolean }) {
  return (
    <div className="card" aria-label={`${topic}: passar a uma pessoa`}>
      <div className="row-between"><span className="body-strong">{topic}</span><span className="tag">Com uma pessoa</span></div>
      <p className="muted">{why}</p>
      <hr />
      <span className="label muted">O que vou passar</span>
      <ul className="bullets">{passOn.map((x) => <li key={x}>{x}</li>)}</ul>
      {!done && <div className="actions"><Button kind="secondary" grow onClick={onKeep}>Manter o meu plano</Button><Button grow onClick={onTalk}>Falar com uma pessoa</Button></div>}
    </div>
  )
}

export function ContextChip({ children }: { children: ReactNode }) {
  return <div className="context-chip"><span className="caption muted">Antes nesta conversa</span><span className="caption">{children}</span></div>
}
