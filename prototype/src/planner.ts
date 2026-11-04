// Live planner: a TypeScript port of the maths in data/planner.py, so the slider can recalculate
// without a round trip. Inputs (margins, goal, Christmas share, dates) come from plan-output.json;
// scripts/check-planner.mjs checks this port against the Python output for €220 and €250.
import out from '../../data/plan-output.json' with { type: 'json' }
import ines from '../../data/ines.json' with { type: 'json' }

export const GOAL = out.plan.goal
export const CHRISTMAS = out.plan.christmas_share
export const CHRISTMAS_DATE = '2026-12-15'
export const MARGINS = out.picture.map((p) => ({ month: p.month, margin: p.margin }))
export const NEEDED = out.plan.needed_for_full_goal
export const BUFFER = out.buffer.balance
export const SUGGESTED = out.plan.monthly
export const IRS_AVG = ines.expected_income.find((e) => e.type === 'irs_refund')!.national_average_2026 as number
export const HOLIDAY_ALLOWANCE_DATE = out.scenarios.j1_chosen.holiday_allowance_date

export type Deadline = 'july' | 'september'

const transferDates = (deadline: Deadline) => {
  const d = ['2026-12-01', '2027-01-01', '2027-02-01', '2027-03-01', '2027-04-01', '2027-05-01', '2027-06-01', '2027-07-01']
  return deadline === 'september' ? [...d, '2027-08-01', '2027-09-01'] : d
}

export type Plan = {
  monthly: number
  deadline: Deadline
  transfers: string[]
  total: number
  gap: number
  scheduledTotal: number
  fit: 'fits' | 'stretch_some_months' | 'too_high'
  shortMonths: string[]
  okMonths: string[]
  byMonth: { month: string; saved: number; christmas: number }[]
}

export function plan(monthly: number, deadline: Deadline = 'july'): Plan {
  const transfers = transferDates(deadline)
  const events = [...transfers.map((date) => ({ date, add: monthly, kind: 'monthly' })), { date: CHRISTMAS_DATE, add: CHRISTMAS, kind: 'christmas' }]
    .sort((a, b) => a.date.localeCompare(b.date))
  let saved = 0
  const byMonthMap = new Map<string, { saved: number; christmas: number }>()
  for (const e of events) {
    saved += e.add
    const m = e.date.slice(0, 7)
    const prev = byMonthMap.get(m) ?? { saved: 0, christmas: 0 }
    byMonthMap.set(m, { saved, christmas: prev.christmas + (e.kind === 'christmas' ? e.add : 0) })
  }
  const total = round2(saved)
  const margins = MARGINS.map((m) => m.margin)
  const fit = monthly <= Math.min(...margins) ? 'fits' : monthly <= Math.max(...margins) ? 'stretch_some_months' : 'too_high'
  return {
    monthly, deadline, transfers, total,
    gap: round2(GOAL - total),
    scheduledTotal: round2(monthly * transfers.length),
    fit,
    shortMonths: MARGINS.filter((m) => m.margin < monthly).map((m) => m.month),
    okMonths: MARGINS.filter((m) => m.margin >= monthly).map((m) => m.month),
    byMonth: [...byMonthMap].map(([month, v]) => ({ month, ...v })),
  }
}

export type GapOption = { id: 'irs' | 'september' | 'trim'; label: string; result: string; certain: boolean }

// Same rules as planner.py section 6; the assistant never picks one.
export function gapOptions(p: Plan): GapOption[] {
  const sep = plan(p.monthly, 'september')
  const trimTo = Math.floor(p.total / 100) * 100
  return [
    { id: 'irs', label: 'Contar com o reembolso do IRS, se vier', certain: false,
      result: `Cobre a diferença se o reembolso for de ${eur(p.gap)} ou mais (média nacional ~${eur(IRS_AVG)}). Não é garantido.` },
    { id: 'september', label: 'Adiar a viagem para setembro', certain: true,
      result: sep.gap > 0 ? `Mais duas transferências: ${eur(sep.total)} poupados, faltam ${eur(sep.gap)}.` : `Mais duas transferências: ${eur(sep.total)} poupados. Objetivo atingido.` },
    { id: 'trim', label: `Fazer uma viagem de ${eur(trimTo)}`, certain: true, result: 'Atingido com o plano atual.' },
  ]
}

const round2 = (n: number) => Math.round(n * 100) / 100

// Portuguese (Portugal) formats: 2360 € · 220,00 € · 1 dez · "agosto e outubro".
export const eur = (n: number, digits = 0) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const monthShort = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1]
export const monthLong = (ym: string) => LONG[Number(ym.slice(5, 7)) - 1]
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const day = (iso: string, withYear = false) => `${Number(iso.slice(8, 10))} ${monthShort(iso)}${withYear ? ' ' + iso.slice(0, 4) : ''}`
export const list = (xs: string[]) => xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`
