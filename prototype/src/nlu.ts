// Understanding layer (local learning build): turns free text into an intent + entities.
// Deterministic, no model. It's the "router" an agent would have in production: classify the ask,
// pull out amounts, months and categories, and say when something is missing so the assistant can
// ask one short question instead of failing. Checked by scripts/check-nlu.ts (a small eval set).

export type Intent =
  | 'greeting' | 'thanks' | 'help'
  | 'save' | 'amount' | 'why' | 'gap' | 'review' | 'deadline' | 'keep' | 'irs' | 'trim'
  | 'pause' | 'resume' | 'saved_so_far' | 'next_transfer' | 'back_to_plan'
  | 'spending' | 'spending_month' | 'spending_category'
  | 'scam' | 'scam_tapped' | 'scam_safe' | 'scam_entered' | 'report'
  | 'credit' | 'yes' | 'no' | 'unknown'

export type Parsed = {
  intent: Intent
  amount?: number                       // euros
  amountKind?: 'monthly' | 'goal'       // undefined = ambiguous
  month?: string                        // '2026-08' … or a month name key for deadlines: 'jun' | 'jul' | 'ago' | 'set' …
  category?: string                     // spending group id from plan-output.json
}

const MONTHS: Record<string, string> = { jan: '01', janeiro: '01', fev: '02', fevereiro: '02', mar: '03', marco: '03', abr: '04', abril: '04', mai: '05', maio: '05', jun: '06', junho: '06', jul: '07', julho: '07', ago: '08', agosto: '08', set: '09', setembro: '09', out: '10', outubro: '10', nov: '11', novembro: '11', dez: '12', dezembro: '12', january: '01', february: '02', march: '03', april: '04', may: '05', june: '06', july: '07', august: '08', september: '09', october: '10', november: '11', december: '12' }
const CATEGORIES: Record<string, string> = { restaurante: 'eating_out', restaurantes: 'eating_out', jantar: 'eating_out', jantares: 'eating_out', comer: 'eating_out', supermercado: 'groceries', mercado: 'groceries', compras: 'shopping', roupa: 'shopping', transporte: 'transport', transportes: 'transport', passe: 'transport', uber: 'transport', bolt: 'transport', viagem: 'travel', viagens: 'travel', saidas: 'going_out', concertos: 'going_out', renda: 'rent', casa: 'rent', contas: 'bills', luz: 'bills', telemovel: 'bills', subscricoes: 'subscriptions', netflix: 'subscriptions', spotify: 'subscriptions', saude: 'health', farmacia: 'health' }

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[“”"!?¿.,;:()]/g, ' ').replace(/\s+/g, ' ').trim()

// One edit away (substitution, insertion, deletion) for words of 5+ letters: tolerates typos like "poupr", "diferenca".
const near = (a: string, b: string) => {
  if (a === b) return true
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, edits = 0
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue } if (++edits > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++ } }
  return edits + (a.length - i) + (b.length - j) <= 1
}
const has = (words: string[], ...keys: string[]) => keys.some((k) => k.includes(' ') ? ` ${words.join(' ')} `.includes(` ${k} `) : words.some((w) => k.length < 4 ? w === k : w.startsWith(k) || near(w, k)))

// "5 mil", "5k", "cinco mil", "3.000 €", "250€"
const NUMBER_WORDS: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, cem: 100, duzentos: 200, trezentos: 300, quatrocentos: 400, quinhentos: 500 }
export function amountOf(text: string): number | undefined {
  const t = norm(text.replace(/(\d)[.\s\u00a0\u202f](\d{3})\b/g, '$1$2'))
  const m = t.match(/(\d+(?:,\d+)?)\s*(k|mil)\b/) ; if (m) return Math.round(parseFloat(m[1].replace(',', '.')) * 1000)
  const w = t.match(/\b(um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\s+mil\b/); if (w) return NUMBER_WORDS[w[1]] * 1000
  const d = t.match(/\b(\d{2,5})(?:,\d+)?\b/); if (d) return parseInt(d[1], 10)
  const h = t.match(/\b(cem|duzentos|trezentos|quatrocentos|quinhentos)\b/); if (h) return NUMBER_WORDS[h[1]]
  return undefined
}

export function parse(text: string): Parsed {
  const t = norm(text), w = t.split(' ')
  const amount = amountOf(text)
  const monthKey = w.map((x) => MONTHS[x] ? x : null).find(Boolean) ?? undefined
  const category = w.map((x) => CATEGORIES[x]).find(Boolean)
  const monthlyCue = has(w, 'por mes', 'mensal', 'cada mes', 'a month', 'monthly', 'poe', 'por', 'mete', 'mudar para', 'e com', 'e se for') && !has(w, 'objetivo', 'total')
  const goalCue = has(w, 'poupar', 'juntar', 'objetivo', 'total', 'quero', 'save', 'goal')
  const amountKind = amount === undefined ? undefined : amount >= 1000 ? 'goal' : monthlyCue ? 'monthly' : goalCue && amount >= 500 ? 'goal' : undefined
  const base = { amount, amountKind, category } as Parsed
  const month = monthKey ? MONTHS[monthKey] : undefined
  const is = (intent: Intent, extra: Partial<Parsed> = {}): Parsed => ({ ...base, intent, ...extra })

  if (/^(ola|oi|bom dia|boa tarde|boa noite|hello|hi|hey)\b/.test(t) && w.length <= 4) return is('greeting')
  if (/^(obrigad|valeu|thanks|thank you)/.test(t)) return is('thanks')
  if (has(w, 'o que fazes', 'o que podes', 'ajuda', 'help', 'what can you')) return is('help')
  if (has(w, 'emprest', 'credito', 'borrow', 'loan')) return is('credit')
  if (has(w, 'denunci', 'report')) return is('report')
  if (has(w, 'toquei', 'cliquei', 'abri o link', 'tapped', 'clicked')) return is('scam_tapped')
  if (has(w, 'escrevi', 'meti os dados', 'dados do cartao')) return is('scam_entered')
  if (has(w, 'mensagem', 'sms', 'burla', 'email', 'e mail', 'phishing', 'scam', 'message', 'colar a mensagem')) return is('scam')
  if (has(w, 'pausar', 'pausa', 'parar o plano', 'pause')) return is('pause')
  if (has(w, 'retomar', 'continuar o plano', 'resume')) return is('resume')
  if (has(w, 'ja poupei', 'quanto tenho', 'quanto ja', 'how much have i saved')) return is('saved_so_far')
  if (has(w, 'proxima transferencia', 'quando e a proxima', 'next transfer')) return is('next_transfer')
  if (category && has(w, 'gastei', 'gasto', 'gastos', 'spent', 'spend', 'quanto')) return is('spending_category', { month: month ? `2026-${month}` : undefined })
  if (has(w, 'para onde foi', 'onde foi o dinheiro', 'gastei', 'gastos', 'where did my money', 'spent', 'spending')) return month ? is('spending_month', { month: `2026-${month}` }) : is('spending')
  if (monthKey && has(w, 'mostrar', 'mostra', 'e em', 'show') && !goalCue) return is('spending_month', { month: `2026-${month}` })
  if (has(w, 'porque', 'porqu', 'why')) return is('why')
  if (has(w, 'diferenca', 'falta', 'faltam', 'fechar', 'gap')) return is('gap')
  if (has(w, 'manter', 'como esta', 'keep')) return is('keep')
  if (has(w, 'irs', 'reembolso', 'refund')) return is('irs')
  if (has(w, 'mais pequena', 'viagem de', 'mais barata', 'smaller trip')) return is('trim')
  if (has(w, 'rever', 'aprovar', 'avanca', 'parece bem', 'review', 'approve')) return is('review')
  if (has(w, 'voltar ao meu plano', 'ver o meu plano', 'o meu plano', 'my plan')) return is('back_to_plan')
  if (monthKey && has(w, 'adiar', 'em', 'ate', 'para', 'by', 'in') && !amount) return is('deadline', { month: monthKey })
  if (has(w, 'poupar', 'poupanca', 'juntar', 'guardar', 'ferias', 'viagem', 'save', 'holiday', 'trip', 'objetivo')) return is('save', monthKey ? { month: monthKey } : {})
  if (amount !== undefined) return is('amount')
  if (/^(sim|ok|claro|pode ser|yes|sure|bora)\b/.test(t)) return is('yes')
  if (/^(nao|no|agora nao)\b/.test(t)) return is('no')
  return is('unknown')
}
