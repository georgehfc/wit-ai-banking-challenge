// One chat thread with the assistant. It can help with three things:
//   Save for something (J1, the core journey) · Where did my money go? · Check a message I got
// Account-level facts (the Holiday goal, card frozen) live in the app and come in as props, so every thread agrees.
// Replies are scripted (no live LLM). Numbers come from planner.ts / plan-output.json. Copy: design/TONE.md.
// State diagrams: design/STATES.md.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import out from '../../data/plan-output.json' with { type: 'json' }
import ines from '../../data/ines.json' with { type: 'json' }
import { AmountControl, Button, FaceId, GapResolver, Icon, MarginSnapshot, ProgressBar, ProjectionChart, PromptBox, Row, StatusBadge, StepsReceipt, fitBadge, type Step } from './components'
import { AiReply, ApprovalCard, CardControl, Folded, HandoffCard, J3, J3_OPTIONS, MandateNote, Num, ScamVerdict, ShortMonthCard, SpendingBreakdown, Suggestions, UserBubble, replyDuration } from './chat'
import { BUFFER, CHRISTMAS, CHRISTMAS_DATE, GOAL, HOLIDAY_ALLOWANCE_DATE, MARGINS, NEEDED, SUGGESTED, cap, day, eur, gapOptions, list, monthLong, monthShort, plan, type Plan } from './planner'
import { BottomSheet, Screen, account, last4, savingsName } from './shell'

export const INTENT = ines.intent.text
export const SMS = 'Banco: Detetámos um acesso invulgar à sua conta. Confirme os seus dados em secure-verify-pt.com nas próximas 24h ou a conta será bloqueada.'
const SMS_DOMAIN = 'secure-verify-pt.com'
const SP = out.spending
const newSubs = out.side_widgets.new_subscriptions_this_summer
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export type Choice = 'irs' | 'september' | 'trim' | 'keep' | null
export type Goal = { monthly: number; choice: Choice; paused: boolean; saved?: number; note?: string; badge?: { kind: 'positive' | 'warning'; label: string } }
export type Autostart = { text?: string; image?: string; proactive?: 'spending' | 'christmas' | 'shortmonth' }
export type ThreadStatus = { busy: boolean; unseen: boolean; hasPlan: boolean; preview: string }
export type Account = { goal: Goal | null; frozen: boolean; planThreadId: string | null }
export type Actions = {
  setFrozen: (v: boolean) => void; setPaused: (v: boolean) => void
  onPlanSet: (g: { monthly: number; choice: Choice }) => void; openThread: (id: string) => void
  complete: (flow: 'j2' | 'j3', option?: string) => void
}

type Widget = 'margin' | 'plan' | 'gap' | 'review' | 'spending' | 'verdict' | 'card' | 'fraudline' | 'shortcuts' | 'openplan' | 'approval' | 'mandate' | 'shortmonth' | 'review3' | 'handoff' | 'finish'
type Turn = { id: number; who: 'user' | 'ai' | 'steps'; tone?: 'status' | 'reply' | 'callout'; title?: string; text?: string; quote?: string; image?: string; widget?: Widget; snap?: number; steps?: Step[]; summary?: string; instant?: boolean }
type NewTurn = Omit<Turn, 'id'>
type ScamStage = 'paste' | 'verdict' | 'tapped' | 'safe' | 'entered' | 'reported' | null

export const SAVE = 'Poupar para algo', SPEND = 'Para onde foi o meu dinheiro?', CHECK = 'Verificar uma mensagem'
export const SHORTCUTS: [string, string][] = [[SAVE, 'Encontra um valor que cabe no teu mês'], [SPEND, 'Os teus últimos 3 meses por categoria'], [CHECK, 'Descobre se um SMS ou email é mesmo do banco']]
const KEEP = 'Manter o plano como está'
export const CREDIT_Q = `Posso pedir emprestados os ${eur(plan(SUGGESTED).gap)} para ir em julho na mesma?`
const SAVE_RE = /poup|guardar|férias|viagem|sav|holiday|€|\d/i

function reaction(p: Plan) {
  const ok = p.okMonths.map(monthLong), short = p.shortMonths.map(monthLong)
  const head = `${eur(p.monthly)} por mês dá ${eur(p.total)} até julho${p.gap <= 0 ? ', o objetivo completo' : ''}.`
  if (!short.length) return `${head} Coube em todos os últimos 3 meses.`
  if (!ok.length) return `${head} É mais do que te sobrou em qualquer dos últimos 3 meses.`
  return `${head} Coube em ${list(ok)}. Em ${list(short)} ficaria curto.`
}

export function Conversation({ id, active, visible, autostart, account: acct, actions, onStatus, voice }: {
  id: string; active: boolean; visible: boolean; autostart?: Autostart; voice?: number
  account: Account; actions: Actions; onStatus: (id: string, s: ThreadStatus) => void
}) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [busy, setBusy] = useState(false)
  const [unseen, setUnseen] = useState(false)
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [monthly, setMonthly] = useState(SUGGESTED)
  const [adjusting, setAdjusting] = useState(false)
  const [choice, setChoice] = useState<Choice>(null)
  const [view, setView] = useState<'chat' | 'review' | 'faceid' | 'confirm'>('chat')
  const [month, setMonth] = useState('all')
  const [scam, setScam] = useState<ScamStage>(null)
  const [reportSheet, setReportSheet] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [approval, setApproval] = useState<'approved' | 'declined' | undefined>()
  const [jan, setJan] = useState<string | null>(null)
  const [handoffSent, setHandoffSent] = useState(false)
  const [faceFor, setFaceFor] = useState<'j2' | 'j3' | null>(null)
  const [flowDone, setFlowDone] = useState<'j2' | 'j3' | null>(null)

  const nextId = useRef(1)
  const visibleRef = useRef(visible); visibleRef.current = visible
  const skipRef = useRef(false)
  const started = useRef(false)
  const scroller = useRef<HTMLDivElement>(null)
  const anchored = useRef<Element | null>(null)

  const goal = acct.goal, goalOn = !!goal, paused = !!goal?.paused, frozen = acct.frozen
  const ownsPlan = acct.planThreadId === null || acct.planThreadId === id

  // ---------- engine: typing → streamed text → widget, one turn at a time ----------
  const say = async (...items: NewTurn[]) => {
    setBusy(true)
    for (const it of items) {
      const t = { ...it, id: nextId.current++, instant: it.instant || (skipRef.current && it.who === 'ai') }
      setTurns((x) => [...x, t])
      const ms = skipRef.current ? 60 : it.who === 'steps' ? (it.steps!.length * 650 + 350) : it.tone === 'status' ? 400 + (it.text ?? '').split(/\s+/).length * 28 : it.who === 'ai' && !it.instant ? replyDuration(it.text ?? '', !!it.widget) : 220
      await wait(ms)
    }
    setBusy(false); skipRef.current = false; setSkipping(false)
    if (!visibleRef.current) setUnseen(true)
  }
  const user = (text: string, quote?: string, image?: string): NewTurn => ({ who: 'user', text, quote, image })
  // Callouts (the gradient rule) only for the key results: the plan, the spending summary, the scam verdict.
  const ai = (text: string, widget?: Widget, extra?: Partial<NewTurn>): NewTurn => ({ who: 'ai', text, widget, tone: widget && ['plan', 'spending', 'verdict', 'approval', 'shortmonth', 'handoff'].includes(widget) ? 'callout' : 'reply', ...extra })

  const p = plan(monthly)
  const has = (w: Widget) => turns.some((t) => t.widget === w)
  const saveStage = !has('plan') ? 'none' : choice ? 'chosen' : has('gap') ? 'gap' : 'plan'

  // ---------- Save for something ----------
  const startSave = (text: string) => say(user(text),
    { who: 'steps', title: 'A verificar a tua conta, ago–out', steps: [{ label: 'Li a tua conta à ordem, ago–out', role: 'Dados' }, { label: 'Calculei o que sobrou em cada mês', role: 'Planeador' }, { label: 'Confirmei que o plano mantém a tua reserva', role: 'Regras' }], summary: 'Leu ago–out · Planeador · Regras' },
    ai(`Depois da renda, das contas e dos gastos, sobraram-te entre ${eur(out.margin.min)} e ${eur(out.margin.max)} por mês.`, 'margin'),
    ai(`A tua reserva de ${eur(BUFFER)} fica intocada. Poupar os ${eur(GOAL)} até julho pediria ${eur(NEEDED)} por mês, mais do que te sobrou em qualquer mês. Isto é o que cabe:`, 'plan', { snap: SUGGESTED }))
  const setAmount = (v: number, text: string) => { setMonthly(v); setAdjusting(true); say(user(text), ai(reaction(plan(v)), 'plan', { snap: v })) }
  const why = (text: string) => {
    const avg = out.margin.avg, low = MARGINS.find((m) => m.margin === out.margin.min)!
    say(user(text), ai(`É o que te sobrou em média de agosto a outubro (${eur(avg)}), arredondado aos 10 € abaixo. ${cap(list(plan(SUGGESTED).okMonths.map(monthLong)))} cobriram-no. ${cap(monthLong(low.month))} deixou ${eur(low.margin)}, faltaram ${eur(SUGGESTED - low.margin)}.`))
  }
  const showGap = (text: string) => say(user(text), ai(`Com ${eur(monthly)} por mês ficam a faltar ${eur(p.gap)} em julho. Há três formas de fechar a diferença. Escolhe uma, ou mantém o plano como está.`, 'gap'))
  const pick = (gid: 'irs' | 'september' | 'trim' | 'keep') => {
    setChoice(gid)
    const sep = plan(monthly, 'september'), trimTo = Math.floor(p.total / 100) * 100
    const label = gid === 'keep' ? KEEP : gapOptions(p).find((o) => o.id === gid)!.label
    const reply = gid === 'september'
      ? (sep.gap > 0 ? `Então são ${eur(sep.total)} até ${day(sep.transfers[sep.transfers.length - 1])}, com o subsídio de Natal. ${eur(sep.gap)} do teu subsídio de férias (${day(HOLIDAY_ALLOWANCE_DATE)}) completam os ${eur(GOAL)}. Pergunto-te antes de o mover.` : `Então são ${eur(sep.total)} até ${day(sep.transfers[sep.transfers.length - 1])}, o objetivo completo.`)
      : gid === 'trim' ? `Então o objetivo passa a ${eur(trimTo)}, atingido até julho com este plano.`
      : gid === 'keep' ? `Combinado. ${eur(p.total)} até julho, faltam ${eur(p.gap)} para os ${eur(GOAL)}. Podes mudar quando quiseres.`
      : `O plano fica em julho sem contar com o reembolso. Se chegar e for de pelo menos ${eur(p.gap)}, consegues. Eu aviso-te.`
    say(user(label), ai(reply, 'review'))
  }
  const backToPlan = (text: string) => {
    if (!ownsPlan) return say(user(text), ai('O teu plano de férias está noutra conversa.', 'openplan'))
    if (goal) { const q = plan(goal.monthly, goal.choice === 'september' ? 'september' : 'july'); return say(user(text), ai(`O teu plano de férias está ${paused ? 'em pausa' : 'ativo'}: ${eur(goal.monthly)} por mês, de ${day(q.transfers[0])} a ${day(q.transfers[q.transfers.length - 1])}.`)) }
    if (choice) return say(user(text), ai('O teu plano está pronto a rever quando quiseres.', 'review'))
    return say(user(text), ai(reaction(plan(monthly)), 'plan', { snap: monthly }))
  }

  // ---------- Where did my money go? ----------
  const startSpending = (text: string | null) => {
    const avg = SP.spent_total / 3, hi = SP.highest_everyday_month
    const first: NewTurn[] = text ? [user(text), { who: 'steps', title: 'A verificar a tua conta, ago–out', steps: [{ label: 'Li as tuas transações, ago–out', role: 'Dados' }, { label: 'Agrupei-as por tipo', role: 'Planeador' }], summary: 'Leu ago–out · Agrupou por tipo' }] : []
    setMonth('all')
    say(...first,
      ai(`Gastaste ${eur(SP.spent_total)} em três meses, cerca de ${eur(avg)} por mês. ${eur(SP.fixed_avg)} por mês são fixos: renda, contas, passe e subscrições.`, 'spending'),
      ai(`${cap(monthLong(hi))} foi o mês com mais gastos do dia a dia (${eur((SP.everyday_by_month as Record<string, number>)[hi])}), sobretudo a viagem a Lagos (${eur(SP.travel_in_highest)}). ${['Nenhuma', 'Uma', 'Duas', 'Três', 'Quatro'][newSubs.length] ?? newSubs.length} subscrições começaram em ${monthLong(hi)}: ${list(newSubs.map((s) => s.merchant))}, ${eur(out.side_widgets.new_subscriptions_monthly, 2)} por mês no total.`))
  }
  const showMonth = (m: string, text: string) => { setMonth(m); say(user(text), ai(`${cap(monthLong(m))}: saíram ${eur((SP.spent_by_month as Record<string, number>)[m])}, ${eur((SP.everyday_by_month as Record<string, number>)[m])} em gastos do dia a dia. O resumo acima mostra agora ${monthLong(m)}.`)) }

  // ---------- Check a message I got ----------
  const startScam = (text: string) => { setScam('paste'); say(user(text), ai('Cola aqui a mensagem, ou anexa uma captura de ecrã. Leio-a só como texto e nunca abro links.')) }
  const checkSms = (sms: string, image?: string) => {
    setScam('verdict')
    say(user('', sms, image),
      { who: 'steps', title: image ? 'A ler a captura de ecrã' : 'A verificar a mensagem', steps: [{ label: 'Li a mensagem como texto', role: 'Dados' }, { label: 'Comparei com a forma como o banco te contacta', role: 'Regras' }, { label: 'Verifiquei para onde vai o link', role: 'Regras' }], summary: 'Lida como texto · Regras' },
      ai('Isto parece uma burla. Não toques no link; podes apagar a mensagem.', 'verdict'))
  }
  const tapped = (text: string) => { setScam('tapped'); say(user(text), ai('Escreveste alguma coisa nessa página?')) }
  const safe = (text: string) => { setScam('safe'); say(user(text), ai('Então a tua conta está segura. Fecha a página e apaga a mensagem. Se alguém te ligar a pedir um código, desliga. O banco nunca pede códigos.')) }
  const entered = (text: string) => { setScam('entered'); say(user(text), ai(frozen ? 'O teu cartão já está congelado. A seguir, liga para a linha de fraude para o cancelarem e te enviarem um novo.' : 'Congela já o cartão. Bloqueia novos pagamentos e podes descongelá-lo quando quiseres.', frozen ? 'fraudline' : 'card')) }
  const toggleFreeze = () => {
    const now = !frozen; actions.setFrozen(now)
    if (now && !turns.some((t) => t.widget === 'fraudline')) say(ai('Cartão congelado. A seguir, liga para a linha de fraude para o cancelarem e te enviarem um novo.', 'fraudline'))
  }
  const sendReport = () => { setReportSheet(false); setScam('reported'); say(user('Denunciar'), ai('Denunciado. A equipa de fraude usa denúncias como esta para tirar sites falsos do ar. Não precisas de fazer mais nada.')) }

  // ---------- J2 · The Christmas allowance lands ----------
  const J2 = out.scenarios.j2_christmas_lands
  const startChristmas = () => say(ai(`O teu subsídio de Natal chegou: ${eur(J2.allowance)}. Quando criaste o plano, pediste-me para perguntar antes de mover ${eur(J2.to_goal)} para Férias. Movo?`, 'approval'), { who: 'ai', text: '', widget: 'mandate', instant: true })
  const christmasApproved = () => { setApproval('approved'); setFlowDone('j2'); say(ai(`Feito. ${eur(J2.to_goal)} estão em Férias e ${eur(J2.stays_in_account)} ficaram na tua conta. Férias vai em ${eur(J2.goal_saved_after)} de ${eur(GOAL)}.`, 'finish')) }
  const christmasDeclined = () => { setApproval('declined'); say(user('Agora não'), ai(`Nada saiu da conta. Os ${eur(J2.allowance)} ficam na conta à ordem; pergunto-te outra vez se quiseres.`)) }

  // ---------- J3 · A payment that changes the plan ----------
  const startShortMonth = () => say(
    { who: 'steps', title: 'A verificar o próximo mês', steps: [{ label: `Vi o pagamento de ${eur(J3.bill.amount)} na ${J3.bill.merchant}`, role: 'Dados' }, { label: 'Estimei o que sobra este mês', role: 'Planeador' }, { label: 'Comparei com a transferência de 1 jan', role: 'Regras' }], summary: 'Viu o pagamento · Planeador · Regras' },
    ai(`Pagaste ${eur(J3.bill.amount)} na ${J3.bill.merchant} (${J3.bill.label.toLowerCase()}) a ${day(J3.bill.paid)}. Com isso, este mês deve sobrar-te cerca de ${eur(J3.expected_left_estimate)}, e a transferência de ${eur(J3.transfer)} a 1 jan ia mexer na tua reserva. Queres rever janeiro?`, 'shortmonth'))
  const pickJan = (oid: string) => {
    setJan(oid); const o = J3_OPTIONS.find((x) => x.id === oid)!
    if (oid === 'keep') return say(user(o.label), ai(`Combinado. A transferência de ${eur(J3.transfer)} a 1 jan mantém-se; os ${eur(J3.buffer_dip_if_kept)} saem da tua reserva. Se mudares de ideias, é só dizer.`))
    say(user(o.label), ai(oid === 'spread' ? `Então janeiro fica saltado e, de fevereiro a setembro, passam a ser ${eur(J3.options[1].new_monthly!)} por mês. Chegas a ${eur(J3.options[1].total_by_deadline!)} em setembro.` : `Então janeiro fica saltado e o resto do plano não muda. Chegas a ${eur(J3.options[0].total_by_deadline!)} em setembro, ${eur(J3.options[0].short_of_plan!)} abaixo do plano.`, 'review3'))
  }
  const janApproved = () => { setFlowDone('j3'); say(ai(jan === 'spread' ? `Feito. Janeiro fica saltado e, a partir de 1 fev, o plano move ${eur(J3.options[1].new_monthly!)} por mês. Podes anular até 1 jan.` : `Feito. Janeiro fica saltado; a próxima transferência é a 1 fev. Podes anular até 1 jan.`, 'finish')) }

  // ---------- J4 · Borrowing: hand off to a person ----------
  const credit = (text: string) => say(user(text), ai('Isso é uma questão de crédito. Não sou a pessoa certa para sugerir um empréstimo; mostro-te quem pode ajudar e passo o que falámos.', 'handoff'))
  const toPerson = () => { setHandoffSent(true); say(user('Falar com uma pessoa'), ai('Enviei o resumo à equipa de crédito. Um especialista vai contactar-te; até lá, nada muda no teu plano.')) }

  // ---------- routing: typed text and suggested replies take the same path ----------
  const send = (raw: string, image?: { url: string; name: string }) => {
    const text = raw.trim(); setInput('')
    if (busy) return
    if (image) { if (scam === null) setScam('paste'); return checkSms(SMS, image.url) }
    if (!text) return
    const n = Number((text.replace(/[,.]/g, '').match(/\d{2,4}/) ?? [])[0])
    if (scam === 'paste') return checkSms(text === 'Colar a mensagem' ? SMS : text)
    if (/^denunciar|^report/i.test(text) && scam === 'verdict') return setReportSheet(true)
    if (/toquei|cliquei|abri o link|tap|click/i.test(text) && scam === 'verdict') return tapped(text)
    if (scam === 'tapped' && /^n[ãa]o|^no/i.test(text)) return safe(text)
    if (scam === 'tapped' && /^sim|escrevi|cart[ãa]o|^yes/i.test(text)) return entered(text)
    if (/emprest|cr[ée]dito|borrow|\bloan/i.test(text)) return credit(text)
    if (/para onde foi|onde.*dinheiro|gastei|gastos|where.*money|spen[dt]/i.test(text)) return startSpending(text)
    if (/mensagem|sms|burla|e-?mail|message|scam/i.test(text)) return startScam(text)
    if (has('spending') && /ago.?–?.?out|todos|tr[êe]s meses/i.test(text)) { setMonth('all'); return say(user(text), ai(`De volta aos três meses: ${eur(SP.spent_total)} gastos.`)) }
    if (has('spending') && /\b(ago|set|out)/i.test(text) && !/poup/i.test(text)) { const m = SP.months.find((x) => monthShort(x) === text.toLowerCase().match(/\b(ago|set|out)/)![1])!; return showMonth(m, text) }
    if (/^(voltar ao meu plano|ver o meu plano|o teu plano de férias)$/i.test(text) || ((saveStage !== 'none' || !ownsPlan || goalOn) && text === SAVE)) return backToPlan(text)
    if (goalOn && /^pausar|^pause/i.test(text)) { actions.setPaused(true); return say(user(text), ai('Em pausa. Não sai nenhuma transferência até retomares. Mais nada muda.')) }
    if (goalOn && /^retomar|^resume/i.test(text)) { actions.setPaused(false); const q = plan(goal!.monthly, goal!.choice === 'september' ? 'september' : 'july'); return say(user(text), ai(`Retomado. Próxima transferência: ${eur(goal!.monthly)} a ${day(q.transfers[0])}.`)) }
    if (saveStage === 'none' && SAVE_RE.test(text)) return ownsPlan && !goalOn ? startSave(text === SAVE ? INTENT : text) : backToPlan(text)
    if (saveStage === 'plan' || saveStage === 'gap') {
      if (/porqu|why/i.test(text)) return why(text)
      if (n >= 100 && n <= 500) return setAmount(Math.round(n / 10) * 10, text)
      if (/diferen[çc]a|falta|fechar|gap/i.test(text) && p.gap > 0) return showGap(text)
      if (/rever|aprovar|parece bem|avan[çc]a|review/i.test(text)) { say(user(text)); setView('review'); return }
    }
    if (saveStage === 'gap' && !choice) { if (/manter|como est[áa]/i.test(text)) return pick('keep'); if (/setembro/i.test(text)) return pick('september'); if (/irs|reembolso/i.test(text)) return pick('irs'); if (/mais pequena|viagem de/i.test(text)) return pick('trim') }
    if (saveStage === 'chosen' && !goalOn && /rever|aprovar|ok|sim/i.test(text)) { say(user(text)); setView('review'); return }
    say(user(text), ai('Ainda não consigo ajudar com isso. Posso ajudar com:', 'shortcuts'))
  }

  // ---------- suggested replies: follow where this conversation is ----------
  const last = [...turns].reverse().find((t) => t.widget)?.widget
  const saveChip = !ownsPlan || goalOn ? 'Ver o meu plano' : saveStage === 'none' ? SAVE : 'Voltar ao meu plano'
  const monthChip = month === 'all' ? `Mostrar ${monthLong(SP.highest_everyday_month)}` : 'Mostrar ago–out'
  const suggestions: string[] = busy || view !== 'chat' || !turns.length ? [] :
    scam === 'paste' ? ['Colar a mensagem'] :
    scam === 'verdict' && last === 'verdict' ? ['Denunciar', 'Toquei no link'] :
    scam === 'tapped' ? ['Não, só abri', 'Sim, escrevi os dados do cartão'] :
    last === 'spending' ? [monthChip, saveChip, CHECK] :
    saveStage === 'plan' && last === 'plan' && !goalOn ? (p.gap > 0 ? [monthly === SUGGESTED ? `Porquê ${eur(SUGGESTED)}?` : `Volta aos ${eur(SUGGESTED)}`, monthly === 250 ? `Põe ${eur(280)}` : `Põe ${eur(250)}`, 'E a diferença?'] : ['Rever o plano']) :
    saveStage === 'gap' && !choice && last === 'gap' ? ['Posso pedir emprestado?'] :
    last === 'handoff' && !handoffSent ? [] :
    goalOn && ownsPlan && (saveStage === 'chosen' || last === undefined) ? [paused ? 'Retomar o plano' : 'Pausar o plano', SPEND, CHECK] :
    scam === 'safe' || scam === 'reported' || (scam === 'entered' && frozen) ? [SPEND, saveChip] : []

  // ---------- status up to the app; autostart; unread ----------
  const preview = [...turns].reverse().find((t) => t.who === 'ai')?.text ?? ''
  useEffect(() => { onStatus(id, { busy, unseen, hasPlan: has('plan'), preview }) }, [busy, unseen, turns.length]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (visible) setUnseen(false) }, [visible])
  // Reopening a chat lands on its latest message.
  useEffect(() => { if (!visible) return; const el = scroller.current; if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight }) }, [visible])
  useEffect(() => {
    if (started.current || !autostart) return
    started.current = true
    if (autostart.proactive === 'spending') startSpending(null)
    else if (autostart.proactive === 'christmas') startChristmas()
    else if (autostart.proactive === 'shortmonth') startShortMonth()
    else if (autostart.image) { setScam('paste'); checkSms(SMS, autostart.image) }
    else if (autostart.text) send(autostart.text)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- scrolling: short message → stay at the bottom; tall one → anchor at its top ----------
  const smart = () => {
    const el = scroller.current; if (!el) return
    const lastTurn = el.lastElementChild as HTMLElement | null; if (!lastTurn) return
    if (lastTurn.offsetHeight > el.clientHeight * 0.6) { if (anchored.current === lastTurn) return; anchored.current = lastTurn; el.scrollTo({ top: lastTurn.offsetTop - 12, behavior: 'smooth' }) }
    else el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }
  useEffect(() => { smart() }, [turns.length, active]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- rendering ----------
  // Fold only what came before your latest message; everything in the current answer stays open.
  const lastUserId = [...turns].reverse().find((t) => t.who === 'user')?.id ?? 0
  const lastWidgetId = [...turns].reverse().find((t) => t.widget && !['review', 'fraudline', 'shortcuts', 'openplan'].includes(t.widget))?.id
  const toggle = (k: number) => setExpanded((s) => { const nx = new Set(s); if (nx.has(k)) nx.delete(k); else nx.add(k); return nx })
  const planCard = (q: Plan, live: boolean) => (
    <div className="card plan-card">
      <div className="row-between"><span className="label muted">Plano de férias</span>{fitBadge(q)}</div>
      <div className="row-baseline"><span className="amount"><Num value={q.monthly} /></span><span className="muted">por mês</span></div>
      <p className="muted">+ {eur(CHRISTMAS)} do subsídio de Natal, {day(CHRISTMAS_DATE)}</p>
      {live && adjusting && <AmountControl value={monthly} min={150} max={NEEDED} presets={[150, SUGGESTED, 250, 280]} total={`${eur(q.total)} até julho`} onChange={(v) => setMonthly(v)} />}
      <ProjectionChart p={q} />
      <div className="row-between result">
        <span className="stack"><span className="amount-sm"><Num value={q.total} /> até julho</span><span className="caption muted">Calculado pelo planeador</span></span>
        {q.gap > 0 ? <span className="stack end"><span className="amount-sm warn"><Num value={q.gap} format={(v) => `faltam ${eur(v)}`} /></span><span className="caption muted">de {eur(GOAL)} · tracejado</span></span>
          : <StatusBadge kind="positive">Objetivo atingido</StatusBadge>}
      </div>
      {live && !choice && <Button kind="secondary" onClick={() => setAdjusting(!adjusting)}>{adjusting ? 'Feito' : 'Mudar valor'}</Button>}
    </div>
  )
  const widget = (t: Turn): ReactNode => {
    const latest = t.id === lastWidgetId || t.id > lastUserId
    switch (t.widget) {
      case 'margin': return latest ? <MarginSnapshot months={out.picture} />
        : <Folded open={expanded.has(t.id)} onToggle={() => toggle(t.id)} summary={<>Sobrou por mês: {out.picture.map((m) => eur(m.margin)).join(' · ')}</>}><MarginSnapshot months={out.picture} /></Folded>
      case 'plan': {
        const live = t.id === [...turns].reverse().find((x) => x.widget === 'plan')?.id && latest && !goalOn
        if (live) return <>{planCard(p, true)}{adjusting && monthly !== t.snap && <p className="live" aria-live="polite">{reaction(p)}</p>}</>
        const q = plan(t.snap ?? SUGGESTED)
        return <Folded open={expanded.has(t.id)} onToggle={() => toggle(t.id)} summary={<>Plano: {eur(q.monthly)} por mês · {eur(q.total)} até julho</>}>{planCard(q, false)}</Folded>
      }
      case 'gap': return choice
        ? <Folded open={expanded.has(t.id)} onToggle={() => toggle(t.id)} summary={<>Escolhido: {choice === 'keep' ? KEEP : gapOptions(p).find((o) => o.id === choice)!.label}</>}><GapResolver gap={p.gap} options={gapOptions(p)} picked={choice} onPick={() => {}} /></Folded>
        : <><GapResolver gap={p.gap} options={gapOptions(p)} picked={choice} onPick={(gid) => !busy && pick(gid)} /><Button kind="tertiary" onClick={() => !busy && pick('keep')}>{KEEP}</Button></>
      case 'review': return t.id === [...turns].reverse().find((x) => x.widget === 'review')?.id && !goalOn ? <Button onClick={() => setView('review')}>Rever o plano</Button> : null
      case 'spending': return latest ? <SpendingBreakdown month={month} onMonth={setMonth} />
        : <Folded open={expanded.has(t.id)} onToggle={() => toggle(t.id)} summary={<>Gasto ago–out: {eur(SP.spent_total)}</>}><SpendingBreakdown month={month} onMonth={setMonth} /></Folded>
      case 'verdict': return <ScamVerdict domain={SMS_DOMAIN} reasons={['Pede para confirmares os teus dados através de um link. O banco nunca faz isso.', `O link vai para ${SMS_DOMAIN}, que não é um endereço do banco.`, 'Dá-te 24 horas para agir. As burlas usam prazos para te apressar.']} />
      case 'card': return <CardControl frozen={frozen} onToggle={toggleFreeze} />
      case 'fraudline': return <Button kind="secondary" onClick={() => {}}><Icon name="phone" size={18} />Ligar para a linha de fraude</Button>
      case 'openplan': return acct.planThreadId ? <Button kind="secondary" onClick={() => actions.openThread(acct.planThreadId!)}>Abrir essa conversa</Button> : null
      case 'approval': return <ApprovalCard done={approval} onApprove={() => !busy && setFaceFor('j2')} onDecline={() => !busy && christmasDeclined()} />
      case 'mandate': return approval ? null : <MandateNote />
      case 'shortmonth': return <ShortMonthCard picked={jan} onPick={(o) => !busy && !jan && pickJan(o)} />
      case 'review3': return !flowDone && t.id === [...turns].reverse().find((x) => x.widget === 'review3')?.id ? <Button onClick={() => setView('review')}>Rever a alteração</Button> : null
      case 'handoff': { const own = has('plan') ? p : plan(SUGGESTED); return <HandoffCard monthly={own.monthly} gap={own.gap} sent={handoffSent} onKeep={() => !busy && send(has('plan') ? 'Voltar ao meu plano' : SAVE)} onPerson={() => !busy && toPerson()} /> }
      case 'finish': return flowDone ? <Button onClick={() => actions.complete(flowDone, jan ?? undefined)}>Concluir</Button> : null
      case 'shortcuts': return <div className="shortcut-list">{SHORTCUTS.map(([s]) => s === SAVE ? saveChip : s).map((s) => <button key={s} className="list-row compact" onClick={() => send(s)}><span className="body-strong">{s}</span><Icon name="chevron" /></button>)}</div>
    }
  }
  const renderTurn = (t: Turn) => {
    if (t.who === 'user') return <UserBubble key={t.id} text={t.text} quote={t.quote} image={t.image} />
    if (t.who === 'steps') return <StepsReceipt key={t.id} steps={t.steps!} summary={t.summary} title={t.title} />
    if (t.instant) return <div key={t.id} className={`msg-ai ${t.tone ?? 'reply'}`}>{t.tone === 'callout' && <span className="ai-rule" aria-hidden="true" />}<div className="msg-ai-content"><p>{t.text}</p>{t.widget && widget(t)}</div></div>
    return <AiReply key={t.id} text={t.text ?? ''} widget={t.widget ? widget(t) : undefined} onGrow={smart} skip={skipping} tone={t.tone} />
  }

  // ---------- review / confirm (J1) ----------
  const fp = (() => { const q = plan(monthly, choice === 'september' ? 'september' : 'july'); return { q, goal: choice === 'trim' ? Math.floor(plan(monthly).total / 100) * 100 : GOAL, topup: choice === 'september' && q.gap > 0 ? q.gap : 0 } })()
  const first = fp.q.transfers[0], lastT = fp.q.transfers[fp.q.transfers.length - 1]
  const done = () => {
    setView('chat')
    setTurns((x) => [...x, { id: nextId.current++, who: 'ai', instant: true, text: `O teu plano de férias está ativo. Primeira transferência: ${eur(fp.q.monthly)} a ${day(first)}.` }])
    actions.onPlanSet({ monthly, choice })
  }
  const j3review = jan && jan !== 'keep' && (view === 'review' || view === 'faceid') ? (
    <Screen label="Rever a alteração" title="Rever a alteração" sub="Preparado pela IA" onBack={() => setView('chat')}
      dock={<><p className="caption muted">Nada muda até aprovares.</p>
        <div className="actions"><Button kind="secondary" grow onClick={() => { setView('chat'); say(ai('Nada mudou. A transferência de 1 jan mantém-se até decidires.')) }}>Agora não</Button><Button grow onClick={() => setView('faceid')}>Aprovar com Face ID</Button></div></>}>
      <h1 className="title">{jan === 'spread' ? `Saltar os ${eur(J3.transfer)} de 1 jan e depois mover ${eur(J3.options[1].new_monthly!)} por mês de 1 fev a 1 set.` : `Saltar os ${eur(J3.transfer)} de 1 jan. O resto do plano fica igual.`}</h1>
      <div className="card">
        <Row k="1 jan" v={`Saltada · ${eur(0, 2)}`} />
        <Row k="A partir de 1 fev" v={`${eur(jan === 'spread' ? J3.options[1].new_monthly! : J3.transfer, 2)} por mês`} strong />
        <Row k="Transferências restantes" v={String(J3.options[1].count)} />
        <Row k="De" v={`${account.name} ··${last4}`} />
        <Row k="Para" v={`Férias · ${savingsName}`} />
        <Row k="Até 1 set" v={`${eur(jan === 'spread' ? J3.options[1].total_by_deadline! : J3.options[0].total_by_deadline!)} poupados`} />
      </div>
      {jan === 'spread' && <div className="card flat gap"><StatusBadge kind="warning">Esforço</StatusBadge><p className="muted">{eur(J3.options[1].new_monthly!)} é mais do que sobrou em agosto e outubro. Se um mês ficar apertado, volto a perguntar-te.</p></div>}
      <p className="caption muted">Podes anular até 1 jan. Calculado pelo planeador.</p>
      {view === 'faceid' && <FaceId onDone={() => { setView('chat'); janApproved() }} />}
    </Screen>
  ) : null
  const overlay = j3review ?? (faceFor === 'j2' ? <div className="screen-overlay"><FaceId onDone={() => { setFaceFor(null); christmasApproved() }} /></div> : null) ?? (view === 'chat' ? (reportSheet ? (
    <BottomSheet label="Denunciar esta mensagem" onScrim={() => setReportSheet(false)}>
      <h2 className="title">Enviar esta mensagem à equipa de fraude?</h2>
      <p className="muted">Vão ver o texto da mensagem e quando a recebeste. Nada da tua conta é partilhado.</p>
      <div className="quote small"><p>{SMS}</p></div>
      <div className="actions"><Button kind="secondary" grow onClick={() => setReportSheet(false)}>Cancelar</Button><Button grow onClick={sendReport}>Enviar denúncia</Button></div>
    </BottomSheet>
  ) : null) : view === 'confirm' ? (
    <Screen label="Plano confirmado" dock={<div className="actions"><Button grow onClick={done}>Concluir</Button></div>}>
      <span className="success"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path className="draw" d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
      <h1 className="title center">O teu plano está criado</h1>
      <p className="caption muted center">Aprovado com Face ID</p>
      <div className="card">
        <div className="row-between"><span className="amount-sm">{eur(0)} de {eur(fp.goal)}</span><StatusBadge kind="positive">Ativo</StatusBadge></div>
        <ProgressBar value={0} />
        <p className="caption muted">Até {day(lastT, true)} · {eur(fp.q.scheduledTotal)} em transferências + {eur(CHRISTMAS)} do subsídio de Natal{fp.topup ? ` + ${eur(fp.topup)} do subsídio de férias` : ''}</p>
        <hr />
        <Row k="Primeira transferência" v={`${day(first)} · ${eur(fp.q.monthly, 2)}`} />
      </div>
      <div className="card flat"><span className="label accent">{day(CHRISTMAS_DATE)}</span><p>Antes de mover {eur(CHRISTMAS)} do teu subsídio de Natal, vais receber um pedido.</p></div>
    </Screen>
  ) : (
    <Screen label="Rever o teu plano" title="Rever o teu plano" sub="Preparado pela IA" onBack={() => setView('chat')}
      dock={<><p className="caption muted">Nada sai da conta até aprovares.</p>
        <div className="actions"><Button kind="secondary" grow onClick={() => { setView('chat'); say(ai('Nada saiu da conta. O plano fica aqui para quando quiseres.')) }}>Agora não</Button><Button grow onClick={() => setView('faceid')}>Aprovar com Face ID</Button></div></>}>
      <h1 className="title">{eur(fp.q.monthly)} por mês da {account.name} para Férias, de {day(first, true)} a {day(lastT, true)}.</h1>
      {(choice === 'keep' || choice === 'irs') && fp.q.gap > 0 && <p className="caption warn">Isto dá {eur(fp.q.total)} até julho, faltam {eur(fp.q.gap)} para os {eur(GOAL)}{choice === 'irs' ? ', a não ser que o reembolso do IRS cubra a diferença' : ''}.</p>}
      <div className="card">
        <Row k="Valor" v={`${eur(fp.q.monthly, 2)} por mês`} strong />
        <Row k="De" v={`${account.name} ··${last4}`} />
        <Row k="Para" v={`Férias · ${savingsName}`} />
        <hr />
        <Row k="Primeira transferência" v={day(first, true)} />
        <Row k="Última transferência" v={day(lastT, true)} />
        <Row k="Transferências" v={`${fp.q.transfers.length} · ${eur(fp.q.scheduledTotal, 2)} no total`} />
      </div>
      <div className="not-included">
        <span className="label muted">Não faz parte desta aprovação</span>
        <div className="info-row"><span className="tag">{day(CHRISTMAS_DATE)}</span><span className="stack"><span className="body-strong">{eur(CHRISTMAS)} do teu subsídio de Natal</span><span className="caption muted">Vais receber um pedido quando chegar.</span></span></div>
        {fp.topup > 0 && <div className="info-row"><span className="tag">{day(HOLIDAY_ALLOWANCE_DATE)}</span><span className="stack"><span className="body-strong">{eur(fp.topup)} do teu subsídio de férias</span><span className="caption muted">Vais receber um pedido quando chegar.</span></span></div>}
      </div>
      <p className="caption muted">Pausa ou muda o plano quando quiseres no objetivo Férias. O dinheiro em Férias pode ser levantado a qualquer momento.</p>
      {view === 'faceid' && <FaceId onDone={() => setView('confirm')} />}
    </Screen>
  ))

  return (
    <div className={`thread ${view !== 'chat' ? 'pushed' : ''}`} style={{ display: active ? 'flex' : 'none' }}>
      <div className="conversation" ref={scroller} aria-live="polite">{turns.map(renderTurn)}</div>
      <div className="input-dock">
        <Suggestions items={suggestions} onPick={(s) => send(s)} />
        <PromptBox value={input} onChange={setInput} onSend={(img) => send(input, img)} busy={busy} recordSignal={active ? voice : undefined}
          onStop={() => { skipRef.current = true; setSkipping(true) }}
          transcript={() => suggestions[0] && !/^(colar|denunciar)/i.test(suggestions[0]) ? suggestions[0] : SPEND} />
      </div>
      {overlay}
    </div>
  )
}
