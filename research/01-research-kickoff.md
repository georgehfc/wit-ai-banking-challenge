# WIT challenge · 01 Research kickoff

Started 2 Nov 2026. Goal: know what Portuguese users actually need from an AI banking assistant, and what we must commit to (compliance, security) before designing. Timebox for this phase: about 45 minutes of the 4–6 hours, so the brief stays focused (they score "focused and polished", not breadth).

Status of sources: Eurostat figures below were pulled from the Eurostat API today and are verified. Items originally marked [to verify] were checked on the evening of 2 Nov; corrections are inline below and full sources are in `02-verified-and-patterns.md`. One item is still open and keeps its tag.

## 1. What the numbers say (Eurostat, verified)

| Indicator | Portugal | EU / comparison | Year |
|---|---|---|---|
| Minimum wage, monthly (12-month basis) | €1,073 (= €920 × 14 payments) | ES €1,425 · FR €1,867 · DE €2,343 | 2026 |
| Household saving rate | 12.3% (7.3% in 2022, recovered since) | EU 14.3% · ES 11.9% · DE 18.9% | 2025 |
| House prices, annual change | **+17.6%** (+9.1% in 2024) | EU +5.5% | 2025 |
| Can't face an unexpected expense | 29.2% of people | EU 29.2% | 2025 |
| …single parents with children | **54.6%** (rising from 46.5% in 2022) | EU 53.7% | 2025 |
| …below the poverty line | 59.8% | EU 61.2% | 2025 |
| Housing cost overburden (>40% of income on housing) | 6.3% | EU 7.6% | 2025 |
| Arrears on mortgage or rent | 1.9% | EU 3.0% | 2025 |

Sources: Eurostat tec00131, earn_mw_cur, prc_hpi_a, ilc_mdes04, ilc_lvho07a, ilc_mdes06.

## 2. George's hypotheses, checked

| Hypothesis | Verdict | Note |
|---|---|---|
| Minimum wage much lower than Western Europe | **Supported** | Half of Germany's, 75% of Spain's. |
| Minimum wage close to the average wage | **Supported for base pay** | INE 2025: average total gross pay €1,694/month, average base pay €1,277. The 2025 minimum (€870) is 68% of average base pay (01 had estimated ~€1,600; corrected, see 02). |
| Housing crisis is severe | **Supported, and the sharpest in the EU** | Prices +17.6% in 2025, three times the EU rate. |
| Saving is very hard for most people | **Nuanced** | The national saving rate recovered to ~12%, and the share who can't absorb a shock equals the EU's. The squeeze is concentrated: single parents, people under the poverty line, young people and renters in Lisbon and Porto **[to verify with INE/BdP regional data — still open]**. The 2023 Literacy Survey backs the age point: 70% of 18–24s saved nothing in the past year (see 02). Arrears stay low: people cut savings before they miss payments. |

Design implication: the user isn't "everyone is broke". It's someone whose monthly margin is thin and uneven, for whom a wrong suggestion has real cost. Affordability has to be honest, and the assistant has to say "this is a stretch" when it is.

**Portugal-specific detail worth using:** salaries are paid 14 times a year. The holiday allowance (*subsídio de férias*) usually lands in June or July and the Christmas allowance in November or December. A "save for next summer" plan in Portugal can count on that extra month. A generic European app wouldn't know that.

## 3. Banking products and jobs to map

To fill with BdP retail-market reports, SIBS (MB WAY, Multibanco) and the 2023 Financial Literacy Survey (Inquérito à Literacia Financeira, published April 2024; verified figures in 02):

| Job the user wants done | Product | Frequency | Pain in PT now | Fits the brief (intent → visual → adjust → approve) | Regulatory weight | Demo in 4–6 screens |
|---|---|---|---|---|---|---|
| Save for a goal | Savings pot, standing transfer, term deposit | Monthly | High (thin margins) | **Strong**: the brief's own example | Low (no advice, no credit) | **Easy** |
| Understand where my money goes | Spending insights / categories | Weekly | High | Good (visuals) | Low-medium (profiling, GDPR) | Easy |
| Can I afford a house? | Mortgage simulation (*crédito habitação*) | Rare, high stakes | **Very high** | Good | **High**: creditworthiness = AI Act high-risk; Mortgage Credit Directive (FINE/ESIS) | Hard to do honestly |
| What will my IRS refund be, and what do I do with it? | Tax refund estimate + savings | Yearly (Apr–Jul) | Medium | Good | Medium (tax info isn't the bank's to compute) | Medium |
| Am I paying the right Social Security? | Contributions for *recibos verdes* (self-employed) | Quarterly | Medium (niche) | Weak (not a bank product) | Medium | Hard |
| Protect myself | Insurance simulation (home, life, health) | Rare | Medium | OK | **High**: IDD demands-and-needs test | Medium |
| Grow my money | PPR (retirement plan with IRS deduction), Certificados de Aforro, ETFs | Monthly / rare | Medium | OK | **High**: MiFID II suitability | Hard |

Working recommendation: **one core journey, "save for a goal", with two Portuguese layers**: affordability that includes housing costs, and the *subsídio de férias*. Mortgage, IRS refund and investments appear only as **context the assistant mentions and hands off** (e.g. "This looks like a mortgage question. I can show you a simulation, but a decision needs a FINE and an advisor."). That shows breadth and judgement without a regulated flow we can't do honestly in 5 hours.

## 4. Compliance: what the design commits to

Dates checked 2 Nov (sources in 02). Corrections: the AI Act high-risk delay is now law (2 Dec 2027); CCD2 applies 20 Nov 2026 but Portugal hadn't transposed it as of 1 Oct 2026.

| Rule | What it means for the screens |
|---|---|
| **EU AI Act, Art. 50 transparency** (from Aug 2026) | It's always clear you're talking to an AI. AI-generated content is labelled. |
| **EU AI Act, high-risk** (credit scoring of people; life and health insurance pricing) | Keep the assistant out of credit decisions and insurance pricing. Simulations only, decisions made by people and regulated flows. *The Digital Omnibus (in force 27 Jul 2026) moved Annex III obligations to 2 Dec 2027.* |
| **GDPR, Art. 22 and transparency** | No solely automated decision with significant effect. Explain what data the suggestion used ("last 3 months of your current account"). Let the user correct assumptions. Don't infer sensitive data (health, religion) from spending. |
| **PSD2, strong customer authentication + dynamic linking** | Creating a standing transfer needs explicit approval with the amount, account and schedule shown, then Face ID/PIN. The AI can never confirm on the user's behalf. |
| **Open banking (PSD2 AIS)** | Pulling data from other banks needs explicit, time-limited consent. Out of scope for the demo. |
| **Consumer Credit Directive 2023/2225** (applies 20 Nov 2026; PT transposition pending) | Any credit mention: no nudging into borrowing, right to human review, clear costs. Our journey avoids credit. |
| **Mortgage Credit Directive / DL 74-A/2017** | Mortgage numbers are simulations, with a FINE (standardised info sheet) before any offer. |
| **MiFID II suitability** | Recommending investments = advice, so a suitability test is needed. The assistant can explain options in general terms, not say "buy X". |
| **Insurance Distribution Directive** | Demands-and-needs test before an insurance suggestion. Simulation only. |
| **European Accessibility Act** (banking in scope since June 2025) | WCAG 2.1 AA: contrast, screen readers, no voice-only or chat-only paths. Every chat action has a tappable alternative. |
| **Banco de Portugal conduct rules** | Plain-language, fair information. Costs and risks stated, not buried. |
| **DORA** (since Jan 2025) | The LLM provider is a critical ICT third party: logging, incident handling, exit plan. Mostly backstage, but worth one line in the slides. |

## 5. Security and AI safety commitments

- **The AI proposes, the user approves.** No money moves from chat alone; every action goes through a review screen with strong authentication.
- **Numbers come from the bank's engine, not the model.** The LLM explains and converses; balances, projections and amounts are computed deterministically and shown as such.
- **Anti-fraud by design.** Portugal has a wave of "Olá pai/mãe" WhatsApp scams and fake bank messages (PSP: at least 13 "Olá pai/mãe" victims a day, reported Jan 2024; dated, see 02). The assistant never asks for codes or passwords, and says so. New payees and unusual amounts get friction, not speed.
- **Prompt-injection resistance.** The assistant can't be steered by text inside transaction descriptions, documents or messages. Instructions come only from the user.
- **Undo and pause.** Every plan can be paused or stopped. The confirmation screen says how.
- **Privacy in public.** The balance can be hidden in conversation (shoulder-surfing). Sensitive values are masked in notifications.

## 6. Open questions, next steps (after 19:00)

1. Verify: INE average wage 2025; BdP mortgage stock and new loans by rate type; 2023 Literacy Survey on saving habits and digital channel use; SIBS/MB WAY users; IRS refund average and timing.
2. Find 2–3 comparable AI-banking assistants for patterns (e.g. Bank of America Erica, Revolut AIR, a Portuguese bank's assistant). Done in 02.
3. Pick the persona: probably a Lisbon renter in their late 20s or early 30s, with an irregular margin and a 14-payment salary.
4. Decide whether the IRS refund enters the savings journey as a second source.

## AI log (moved to ai-log/log.md)

- **2 Nov, Claude Code:** pulled 6 Eurostat datasets through the API (verified figures above). Drafted the product map, compliance and security tables from prior knowledge, marked **[to verify]**. George set the direction (Portugal, housing, low wages) and the candidate products; Claude checked his hypotheses against the data, which **nuanced** the "nobody can save" assumption.
