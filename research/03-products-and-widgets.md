# WIT challenge · 03 Products the assistant can consult, widgets, other flows

2 Nov 2026, night. Goal: a believable product set for the PoC bank, so the assistant's data and widgets feel real. Built from what Revolut actually offers in Portugal, crossed with 01–02.

## 1. Revolut in Portugal (verified)

| Product / fact | Detail | Source |
|---|---|---|
| Scale | **2.3M+ Portuguese customers** (Apr 2026), target 2.5M in 2026; wants to overtake CGD | [Dinheiro Vivo, 22 Apr 2026](https://dinheirovivo.dn.pt/empresas/revolut-quer-alcanar-25-milhes-de-portugueses-em-2026-e-superar-a-cgd-nos-prximos-anos) |
| Portuguese branch, **PT50 IBAN**, **MB WAY**, Multibanco | BdP authorised Feb 2025; branch live Jul 2025; new customers get a PT IBAN; salary and direct debits can move over; no more Anexo J in IRS | [4gnews, 24 Jul 2025](https://4gnews.pt/revolut-agora-com-iban-portugues-e-mb-way-o-que-muda-para-quem-vive-em-portugal/) |
| **Savings account** (*conta poupança*) | **Interest paid daily**, withdraw any time without losing interest. Promo 2.5% TANB for 6 months (Jan 2026, PT IBAN required); earlier 1.50–2.25%. Savings demand +217% last year | [Dinheiro Vivo, 22 Jan 2026](https://dinheirovivo.dn.pt/empresas/revolut-sobe-a-fasquia-nas-contas-poupana-quais-so-as-opes-para-2026); Apr 2026 article above |
| Goals, Pockets, Automations, Scheduled payments, Budgets, "Spent this month" | Seen on Mobbin: "Setting a goal", "Creating a pocket", recurring transfer, paused/reactivate, spending budget, home widgets | Mobbin (board group A) |
| **Personal credit** | €1,000–30,000, no opening or early-repayment fees (Jun 2024) | [Jornal de Negócios](https://www.jornaldenegocios.pt/mercados/credito/detalhe/revolut-lanca-credito-pessoal-digital-ate-30-mil-euros) |
| Investments | Stocks, bonds, robo-advisor (Mobbin), growing demand | Apr 2026 article; Mobbin |
| Mortgages | **Not in Portugal in 2026** | Apr 2026 article |
| AIR assistant | Card actions, subscriptions, spending, FX, eSIMs; biometric approval for sensitive actions | 02 §2 |

Not verified tonight: deposit guarantee details for the PT branch, current savings rate after the promo, travel insurance by plan.

## 2. The PoC bank's product set (fictional brand, Revolut-like, Portuguese)

We don't use Revolut's brand. The set below is what the assistant can see and act on. Rates are **illustrative** and labelled as such on screen.

| Product | What the assistant may do | Lane |
|---|---|---|
| Current account (PT IBAN, MB WAY) | Read balance, salary (14 payments detected), fixed costs, spending | **Read** (data consent shown) |
| Savings account, daily interest, illustrative 2.0–2.5% TANB | Explain, project interest, propose a goal inside it | **Do with approval** |
| Goals (pots inside savings) | Create, rename, change target/date | **Do with approval** |
| Scheduled transfers | Draft, then Inês approves with Face ID; pause/resume | **Do with approval** (money moves, never "Always allow") |
| Round-ups | Estimate from last 3 months, suggest turning on | **Do with approval** |
| Budgets + spending analytics | Show where money goes; suggest a category budget | **Do with approval** (no money moves) |
| Subscriptions / scheduled payments | List, show what pausing would free up | **Explain**; cancelling stays with Inês |
| FX / travel | Show what the goal is worth in the destination currency; rate alert | **Explain** (no advice, no prediction) |
| Personal credit | Never suggested inside the savings journey. If asked: costs + human review (CCD2) | **Hand off** |
| Investments / PPR | General explanation only | **Hand off** (MiFID suitability) |
| Mortgage | Simulation only, FINE, advisor | **Hand off** (also: not offered in PT this year, matches reality) |
| Insurance (e.g. travel) | Mention exists | **Hand off** (IDD) |

## 3. Widgets the assistant can put in the conversation

Each widget = data from a product + calculation by the planner + one action (or none). All numbers below for Inês are illustrative.

1. **Margin snapshot**: income (salary bars, June and December double), rent, other fixed costs, typical spend → "you had €150–280 left each month (Aug–Oct)". Source: current account + analytics.
2. **Goal plan card + projection**: €220/month + €600 from the Christmas allowance → ~€2,360 by July; gap €640; target line; solid saved vs dashed planned. Source: planner.
3. **Interest add-on line**: "Daily interest adds about €17 by July (2.5% illustrative, after 28% tax)". Small but honest. (Computed by `data/planner.py`; an earlier hand estimate of €19 was slightly high.)
4. **Extra-money calendar**: Christmas allowance (by 15 Dec), IRS refund window (Apr–Aug, ~€980 average, *optional*), holiday allowance (before the trip, so trip money, not savings). Tap one to include it in the plan.
5. **Gap resolver** (the decision): three options as chips: count IRS if it arrives / move date to September / trim the trip. Each redraws the projection.
6. **Subscription check**: "You added 2 subscriptions in August: €17.98/month". Read-only, links to manage; no automatic cancel. (Corrected: the bank sees payments, not usage, so it can't say "you haven't used them".)
7. **Round-up estimate**: "Round-ups would have added ~€7/month (Aug–Oct)". Toggle with approval. Small, so it's a side note, not a hero.
8. **Approval request**: "Assistant wants to schedule €220 every month from Current to Holiday, from 1 Dec" → Decline / Approve → Face ID.
9. **Plan status**: on track / paused / short this month; Pause and Resume in one tap (Revolut paused-state study).
10. **Destination currency** (if abroad): "€3,000 ≈ ¥X today. Rates move; this isn't a forecast." Optional rate alert.
11. **Handoff card**: topic, why the assistant stops, who takes over, what context goes with it.

Core PoC uses 1, 2, 4, 5, 8, 9 (plus 3 as a line). 6, 7, 10, 11 are breadth: one appears as a side moment at most.

## 4. Other interesting flows (for the walkthrough, not built)

- **Christmas allowance lands** (proactive): "Your Christmas allowance arrived. Send €600 to Holiday as planned?" → approval request. Shows the monitor role.
- **IRS refund lands**: offer a split (goal / buffer / spend), never automatic.
- **Off-track month**: rent rose or a big bill → "skip December's €220 and spread it?" → plan updates.
- **Trip with friends**: split costs in a group (Revolut has group bills) and track who paid.
- **Travel mode**: card abroad, FX, eSIM. Natural follow-on from the holiday goal.
- **Scam check**: paste a suspicious "Olá mãe" message → assistant explains red flags, never asks for codes (Starling pattern).
- **Move my salary here**: PT IBAN domiciliation checklist. Unlocks the 14-salary detection.
- **"Could I borrow to go sooner?"**: credit handoff done right (no nudge, costs shown, human review).
- **"Can I afford a T1?"**: mortgage handoff; simulation only.
- **Buffer builder** (Marta's case): build €500 before any goal.

## 5. Next: make the assistant's data real

With the product set fixed, the next step is a small mock dataset for Inês: 3 months of transactions (Aug–Oct 2026) on a PT current account, salary ×14 pattern, rent, bills, 2 subscriptions, card spend by category, an existing €900 balance. That feeds every widget with consistent numbers and becomes the source for screen copy.
