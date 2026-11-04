// Checks the TypeScript planner port against data/plan-output.json (written by planner.py).
// Run: node --experimental-strip-types scripts/check-planner.ts
import out from '../../data/plan-output.json' with { type: 'json' }
import { plan, gapOptions } from '../src/planner.ts'

const fails: string[] = []
const eq = (name: string, a: unknown, b: unknown) => { if (JSON.stringify(a) !== JSON.stringify(b)) fails.push(`${name}: ts=${JSON.stringify(a)} py=${JSON.stringify(b)}`) }
const p = plan(out.plan.monthly)
eq('total', p.total, out.plan.total_by_deadline); eq('gap', p.gap, out.plan.gap); eq('fit', p.fit, out.plan.fit)
eq('short', p.shortMonths, out.plan.short_months_in_history)
const w = out.scenarios.j1_what_if[0]; const p2 = plan(w.monthly)
eq('250 total', p2.total, w.total_by_deadline); eq('250 gap', p2.gap, w.gap); eq('250 short', p2.shortMonths, w.short_months_in_history)
const s = plan(out.plan.monthly, 'september'); const c = out.scenarios.j1_chosen
eq('sep total', s.total, c.total_from_transfers); eq('sep scheduled', s.scheduledTotal, c.scheduled_total); eq('sep transfers', s.transfers.length, c.transfers)
const nums = (t: string) => (t.match(/\d[\d.,\u00a0\u202f ]*\d|\d/g) ?? []).map((x) => x.replace(/\D/g, '')); const g = gapOptions(p); eq('gap option figures', g.map((o) => nums(o.result)), out.gap_options.map((o) => nums(o.result)))
console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'OK: TS planner matches plan-output.json (220, 250, September, gap options)')
process.exit(fails.length ? 1 : 0)
