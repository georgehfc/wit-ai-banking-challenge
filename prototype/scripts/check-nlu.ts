// Small eval set for the understanding layer: real phrasings (PT and EN, typos, missing accents) and what they must map to.
// Run: npm run check:nlu. Add a line whenever a phrase lands in the wrong place.
import { parse, type Intent } from '../src/nlu.ts'

type Case = [string, Intent, Partial<{ amount: number; amountKind: 'monthly' | 'goal'; month: string; category: string }>?]
const cases: Case[] = [
  ['Quero poupar 3.000 € para umas férias no próximo verão', 'save', { amount: 3000, amountKind: 'goal' }],
  ['quero juntar 5 mil para ir ao japão', 'save', { amount: 5000, amountKind: 'goal' }],
  ['quero poupar cinco mil até dezembro', 'save', { amount: 5000, amountKind: 'goal', month: 'dezembro' }],
  ['I want to save 3k for a trip', 'save', { amount: 3000, amountKind: 'goal' }],
  ['poupr para ferias', 'save'],
  ['põe 250', 'amount', { amount: 250, amountKind: 'monthly' }],
  ['e com 300?', 'amount', { amount: 300, amountKind: 'monthly' }],
  ['300', 'amount', { amount: 300 }],
  ['consigo 180 por mês', 'amount', { amount: 180, amountKind: 'monthly' }],
  ['porquê 220 €?', 'why', { amount: 220 }],
  ['porque', 'why'],
  ['e a diferenca?', 'gap'],
  ['quanto falta?', 'gap'],
  ['manter o plano como está', 'keep'],
  ['adiar para setembro', 'deadline', { month: 'setembro' }],
  ['e se for em setembro', 'deadline', { month: 'setembro' }],
  ['contar com o reembolso do irs', 'irs'],
  ['uma viagem mais barata', 'trim'],
  ['rever o plano', 'review'],
  ['parece bem, avança', 'review'],
  ['pausar o plano', 'pause'],
  ['retomar o plano', 'resume'],
  ['quanto já poupei?', 'saved_so_far'],
  ['quando é a próxima transferência?', 'next_transfer'],
  ['para onde foi o meu dinheiro?', 'spending'],
  ['onde gastei mais em agosto?', 'spending_month', { month: '2026-08' }],
  ['mostrar setembro', 'spending_month', { month: '2026-09' }],
  ['quanto gastei em restaurantes?', 'spending_category', { category: 'eating_out' }],
  ['quanto gastei em transportes em outubro', 'spending_category', { category: 'transport', month: '2026-10' }],
  ['quanto gasto na farmácia', 'spending_category', { category: 'health' }],
  ['recebi uma mensagem estranha', 'scam'],
  ['isto é burla?', 'scam'],
  ['toquei no link', 'scam_tapped'],
  ['sim, escrevi os dados do cartão', 'scam_entered'],
  ['denunciar', 'report'],
  ['posso pedir emprestado?', 'credit'],
  ['preciso de um crédito', 'credit'],
  ['olá', 'greeting'],
  ['bom dia', 'greeting'],
  ['obrigado', 'thanks'],
  ['o que podes fazer?', 'help'],
  ['qual é a capital de frança', 'unknown'],
  ['voltar ao meu plano', 'back_to_plan'],
]
let fail = 0
for (const [text, intent, ent = {}] of cases) {
  const p = parse(text)
  const bad = p.intent !== intent || Object.entries(ent).some(([k, v]) => (p as Record<string, unknown>)[k] !== v)
  if (bad) { fail++; console.log(`FAIL  "${text}" → ${JSON.stringify(p)}  (expected ${intent} ${JSON.stringify(ent)})`) }
}
console.log(fail ? `${fail} of ${cases.length} failed` : `OK: ${cases.length} phrases understood`)
if (fail) process.exit(1)
