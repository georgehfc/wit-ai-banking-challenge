# WIT challenge · 02 Verified facts, assistant patterns, persona

2 Nov 2026, evening session (~30 min timebox). This closes the open items in `01-research-kickoff.md`. Sources are listed with each item. Where a figure comes from a press report of an official release rather than the release itself, it says so.

## 1. Verification of the [to verify] items

| Item | What 01 said | Verified | Verdict | Source |
|---|---|---|---|---|
| INE average wage 2025 | About €1,600 gross/month | **€1,694** total gross monthly pay per worker in 2025 (+5.6% nominal, +3.2% real). **Base** pay €1,277. Q4 2025 total €1,877 (pushed up by the Christmas allowance). Public sector €2,244, private €1,483. Q1 2026: €1,611. | **Corrected.** 01 was too low on total pay and too high on base pay. | INE release via [ECO, 13 Feb 2026](https://eco.sapo.pt/2026/02/13/salario-medio-em-portugal-sobe-para-1-694-euros-brutos-por-mes/); [idealista, Q1 2026](https://www.idealista.pt/news/node/75459) |
| Minimum wage close to the average? | Plausible | 2025 minimum €870 = **68% of average base pay**, 51% of average total pay. Private-sector average total (€1,483) is only 1.7× the minimum. | **Supported for base pay**, which is what people actually budget on. Good line for the slides. | Same, plus Eurostat earn_mw_cur (01) |
| BdP mortgage stock | Not stated | **€116.8bn** outstanding at end of June 2026, +10.9% a year, the fastest growth since Feb 2003. | Verified | BdP via [Dinheiro Vivo](https://dinheirovivo.dn.pt/economia/crdito-habitao-dispara-109-em-junho-a-maior-subida-desde-2003) |
| New mortgage loans by rate type | Not stated | 2025: **75% mixed** (fixed for the first years, then variable), 18.7% variable, 6.3% fixed (by number of contracts). €23.4bn lent, +34.9%. Average APR (TAEG) 4.8%. Stock (Apr 2026): **49% variable, 45% mixed**. | Verified. Half the stock still moves with Euribor. | BdP *Relatório de Acompanhamento dos Mercados de Crédito 2025* via [Doutor Finanças](https://www.doutorfinancas.pt/creditos/credito-habitacao/credito-habitacao-cresceu-quase-35-em-2025/); stock split: [Doutor Finanças, 8 Jun 2026](https://www.doutorfinancas.pt/creditos/credito-habitacao/peso-da-taxa-variavel-no-credito-habitacao-nunca-foi-tao-baixo/) |
| Financial Literacy Survey on saving | "2023 survey" | 4th edition, fieldwork 2023, **published April 2024** (CNSF). Only **53.9% saved anything in the past year** (65% in 2020, 68.3% in 2015). Of savers, **84% leave it in the current account**, 33.9% term deposits, 7.7% at home. Only 32.3% plan income vs spending, and only **4.9% use a bank app or budgeting tool** for it. But 67.6% could pay an expense equal to a month's income without borrowing. | Verified. Fixes the date. Strongest design hook in the whole research: savings exist but sit idle and unplanned. | [CNSF report (PDF)](https://www.todoscontam.pt/sites/default/files/2024-04/relatorio4ilf2023.pdf) pp. 11, 28, 31, 34–35; [ECO](https://eco.sapo.pt/2024/10/31/maioria-das-familias-deixa-as-poupancas-paradas-em-depositos/) |
| Same survey, young people | Not stated | **70% of 18–24s didn't save** last year; 56.1% have money decisions made by someone else. Lowest digital-finance knowledge. | Verified | Same report pp. 25, 32 |
| Same survey, digital channels | Not stated | 27.4% have no internet access. Of those online: ~47% check balance online often, ~27% transfer online. MB WAY use **15.9% → 33%** (2020→2023). Only 9.9% change passwords regularly. | Verified. Reminder that a chat-only path would exclude people (and the EAA requires alternatives anyway). | Same report pp. 12–14 |
| MB WAY / SIBS | Not stated | **6M+ users, ~70M transactions a month** (SIBS, Nov 2024). | Verified but dated. SIBS 2025 annual report exists, not checked in this timebox. | [ECO interview with SIBS, 25 Nov 2024](https://eco.sapo.pt/entrevista/dona-do-mb-way-prepara-novas-funcionalidades-e-entra-em-cabo-verde/) |
| IRS refund average and timing | Apr–Jul | 2026 campaign (2025 income): average refund **~€980**, €2.66bn owed. Filing **1 Apr – 30 Jun**; IRS Automático refunds paid in ~12 days on average; all on-time refunds due by **31 Aug**. | **Corrected:** the window runs to end of August, not July. | Ministry data via [RTP/Lusa, 3 Sep 2026](https://www.rtp.pt/noticias/economia/fisco-paga-2660-me-em-reembolsos-de-irs-com-valor-medio-nos-980-euros_n1763211) |
| EU AI Act, Art. 50 transparency | From Aug 2026 | Applies from **2 Aug 2026** (confirmed). Content-marking (Art. 50(2)) for systems already on the market: **2 Dec 2026**. | Verified | [Hunton, Digital Omnibus in force](https://www.hunton.com/privacy-and-cybersecurity-law-blog/eu-digital-omnibus-on-ai-enters-into-force) |
| EU AI Act, high-risk | "A 2025 proposal may delay it" | The **Digital Omnibus on AI is now law** (in force 27 Jul 2026). Annex III high-risk (which includes creditworthiness scoring) moved from Aug 2026 to **2 Dec 2027**. | **Corrected.** The delay happened. Design stance doesn't change: keep the assistant out of credit decisions. | Hunton (above); [Hogan Lovells on the May 2026 deal](https://www.hlc.com/en/publications/eu-legislators-agree-to-delay-for-highrisk-ai-rules) |
| Consumer Credit Directive 2023/2225 | From Nov 2026 | Transposition was due **20 Nov 2025**, application **20 Nov 2026**. As of 1 Oct 2026 **Portugal had not transposed it**; the Commission sent a reasoned opinion. | **Nuanced.** Say "applies from 20 Nov 2026 under EU law; Portuguese transposition pending" | [Hogan Lovells](https://www.hlc.com/en/publications/eu-second-consumer-credit-directive-changes-ahead-for-credit-providers); [Dinheiro Vivo, 1 Oct 2026](https://dinheirovivo.dn.pt/economia/bruxelas-d-dois-meses-a-portugal-para-transpor-diretiva-sobre-contratos-de-crdito) |
| "Olá pai/mãe" scam stats | [to verify stats] | PSP: **at least 13 victims a day**; PGR cybercrime office: complaints +59.97% year on year; MB WAY scams 3,978 victims (~11/day). | Verified but **old (Jan 2024)**. Use as "a known pattern", not a current number. | [Postal, 2 Jan 2024](https://postal.pt/nacional/burla-ola-pai-ola-mae-faz-13-vitimas-diarias-em-portugal-veja-como-se-proteger/) |
| Allowance timing (*subsídio de férias / Natal*) | June/July and Nov/Dec | Labour Code: Christmas allowance by **15 Dec** (art. 263); holiday allowance before the holiday period starts (art. 264). | From prior knowledge of the Código do Trabalho. Not re-fetched tonight; fine to cite with the article numbers. | Código do Trabalho, arts. 263–264 |

Not done (out of timebox): INE/BdP regional data for Lisbon renters; SIBS 2025 report.

### What changes for the design
- **The target behaviour is "move idle money into a plan", not "find money that doesn't exist".** 84% of savers keep it in the current account and almost nobody uses an app to plan. That is the gap the journey fills.
- **Two Portuguese "extra money" events are real and datable:** the Christmas allowance (lands by 15 Dec, i.e. *right after* someone starts this plan in November) and the IRS refund (~€980 average, Apr–Aug). The holiday allowance arrives before the holiday itself, which is the trip spending money rather than savings. The assistant can suggest sending part of the Christmas allowance to the pot, and treat the IRS refund as *optional upside*, never counted in the base plan.
- **Mortgage handoff copy can be concrete:** half the stock is still variable, so "how would a Euribor change hit me?" is a believable thing to hand off.

## 2. AI banking assistants: what to borrow, what to avoid

### Revolut AIR (launched 2026, UK then EU)
- Does: card actions ("freeze my card", single-use card), pause recurring payments, subscriptions, spending, FX, eSIMs. Chat sits as an overlay; the normal menus remain.
- Trust: "AIR cannot perform sensitive actions without your biometric approval." Labelled as AI that "may not always be accurate". Claims access only to data the user can already see, and zero retention by third-party model providers. Not investment advice.
- Criticism: no clear route to a human from AIR itself; reviewers flag it nudging free users toward paid plans mid-task; "navigation will disappear" overpromises; chat is slower than a menu for known tasks.
- Sources: [Revolut blog](https://revolut.com/blog/post/air-ai-by-revolut), [Ergomania UX analysis](https://ergomania.eu/revolut-air-ai-banking-assistant-ux/)

### Bank of America Erica (since 2018)
- Scale: passed 3 billion client interactions in Aug 2025 (2bn and 42M clients by Apr 2024).
- Deliberately **not generative**: ~700 curated topics, a team of data scientists reviewing answers, 50,000+ tuning changes. Their line: "there can be no hallucinations".
- **"Off-ramp" principle:** never a dead end; you can always move to a human banker, an appointment or a video call.
- Proactive insights (e.g. a pattern of small charges), but acting on them needs the client's authorisation.
- Sources: [The Financial Brand](https://thefinancialbrand.com/news/customer-experience-banking/hy-bank-of-americas-erica-virtual-assistant-has-a-human-touch-187354), [BofA newsroom, Aug 2025](https://newsroom.bankofamerica.com/content/newsroom/press-releases/2025/08/a-decade-of-ai-innovation--bofa-s-virtual-assistant-erica-surpas.html), [FF News, Apr 2024](https://ffnews.com/blog/2024/04/08/bofas-erica-surpasses-2-billion-interactions-helping-42-million-clients-since-launch)

### Portugal: CGD Assistente Digital, and the supervisors' planned assistant
- CGD's Caixadirecta assistant (2020, voice in PT/EN): balances, transfers to contacts or IBAN, bill payments, card requests and **requesting personal credit** from the assistant. Command-driven, not a planning tool. Source: [ECO, Jan 2020](https://eco.sapo.pt/2020/01/27/ola-caixa-cgd-lanca-assistente-virtual-que-responde-a-comandos-de-voz); [e-konomista (CGD sponsored), 2022](https://www.e-konomista.pt/ja-conhece-a-assistente-virtual-do-seu-banco/)
- BdP, CMVM and ASF are building "a kind of financial ChatGPT" on Todos Contam that answers only from supervisor-verified content (prototype testing announced for later in 2026, no launch date). Source: [Portugal Post, May 2026](https://theportugalpost.com/posts/portugal-launches-free-ai-money-coach-and-new-financial-training-plan-for-residents)
- Couldn't find a Portuguese bank with a live generative planning assistant in this search. Worth saying in the walkthrough as "gap in the market", with that caveat.

### Patterns to borrow
1. **Biometric approval on a dedicated review step** (AIR). Our version adds what AIR doesn't show: amount, from/to account, schedule, first date, and how to pause, on one screen before Face ID (PSD2 dynamic linking).
2. **Always an off-ramp** (Erica). Every assistant turn has a visible "talk to a person" route, and regulated topics hand off with a named next step, not a refusal.
3. **Say what data it used** (AIR's "only data you can already see"). We go one step further: show the months used and let the user correct an assumption inline.
4. **Answers from verified sources for explanations** (Erica, the supervisors' assistant). Matches 01's rule: numbers come from the bank's engine; the model only explains them.
5. **Chat and menus side by side** (AIR overlay). Every chat result has a tappable control and every control is reachable without chat.

### Patterns to avoid
1. **Selling mid-task** (AIR upsell). No product promotion inside the goal flow. If a term deposit fits, it's presented as an option with its cost, not a banner.
2. **Credit inside the assistant** (CGD's "request personal credit"). With CCD2 coming and credit scoring classed as high-risk, the savings journey never offers credit, even when the goal looks unreachable. It shrinks or moves the goal instead.
3. **Dead ends and fake humans.** The assistant is visibly an AI (Art. 50) and never pretends otherwise.
4. **Voice- or chat-only actions that move money.** Speed is the wrong goal for transfers, given the MB WAY/WhatsApp scam pattern.
5. **Overpromising ("menus will disappear").** Our pitch is narrower: one intent, done well, with a clear exit.

## 3. Persona options for "save for a goal"

Both are Lisbon renters on a 14-payment salary with a thin margin. Salary, rent and margin figures are illustrative, chosen to sit inside the verified averages. Net pay is an estimate; check with the 2026 withholding tables before it goes on a screen.

### Option A: Inês, 28, shares a flat in Arroios *(recommended)*
- Junior marketing coordinator, private sector, **€1,450 gross × 14** (between average base and average total pay). Net roughly €1,150/month **[estimate]**.
- Pays €650 for her half of a T2. After bills, transport and food, her margin swings between **€120 and €280** depending on the month. *(Superseded by the dataset, 2 Nov: €575 for a room in a shared T2, meal card covers most groceries, margin €150–280. See `data/README.md`.)*
- Has about €900 sitting in her current account, which she thinks of as "not really savings". Matches the 84% stat.
- Intent: "I want to save €3,000 for a holiday next summer, but I don't know how much I can afford every month." Trip with friends, July 2027, about 8 months away.
- Why she works: she's the brief's example user almost word for word, and she's the 18–34 group the survey says saves least. Her story shows all five brief requirements without edge cases. The Portuguese layer comes in naturally: Christmas allowance lands in December (seed the pot), IRS refund is optional upside in spring, and the assistant is honest that €375/month (3,000 ÷ 8) is a stretch on her margin. Worked example: ~€220/month × 8 + €600 of the Christmas allowance = **~€2,360 by July**, with her €900 kept as a buffer. It shows the €640 gap and lets her choose: count the IRS refund *if* it arrives, push the date to September, or trim the trip. That choice is the "meaningful user decision" the prototype needs.
- Risk: can feel "safe". Fix that with honesty: the plan shows a real trade-off and a month where she'll fall short.

### Option B: Marta, 37, single mother in Amadora
- Administrative assistant, **€1,250 gross × 14**, one child aged 8. Rents a T1 for €850.
- Margin €50–200; one unexpected bill wipes a month. She's in the group where 54.6% can't absorb an unexpected expense (Eurostat, 01).
- Intent: same holiday goal, framed as a first proper holiday with her son.
- Why she's strong: much higher stakes, so trust and honesty matter more. The best moment would be the assistant saying "build a €500 buffer first, then the holiday" and stretching the goal to 2028.
- Risks: the honest answer is close to "not this year", which fights the brief's happy path; more edge cases (child benefit, alimony timing) to defend live; a €3,000 trip may read as out of touch for this budget; easier to drift into sensitive inferences from spending.

### Recommendation (George agreed, 2 Nov)
**Go with Inês.** She delivers a complete, approvable journey in 4–6 screens and keeps the focus on interaction quality, which is what the scoring rewards. Take Marta's best idea into Inês's flow as a rule rather than a persona: **the assistant checks for a buffer before committing a monthly amount**, and it can say "this is a stretch". Mention Marta in the walkthrough as the stress case the rules were designed for.

## 4. Mobbin benchmarks (iOS)

Pulled from Mobbin on 2 Nov. Links open the screen on Mobbin. Grouped by the step of our journey they inform.

### Conversation shell: the elegance reference
- **Notion AI**: [empty state](https://mobbin.com/screens/4944cf22-bef5-4f13-abc2-6d8ee041fef1), [answer with collapsed steps](https://mobbin.com/screens/116fa290-07ba-4e68-bc42-4832deffeb9b), [action done, then reverted](https://mobbin.com/screens/5415dd8d-025e-435b-a395-077684dbd4fd). **Borrow:** the calm layout (small centred avatar, lots of white, one floating input: "Ask, search, or make anything…"); the reasoning folded into a "2 steps ›" line you can open if you care; and above all the **action receipt with a visible "Reverted" state**. That's the undo pattern we want after the plan is created. **Don't copy:** the raw "thought" text it can expand to. Too technical for a bank.
- **Cash App**: [answer with inline chart](https://mobbin.com/screens/2d543e0f-4c65-44d5-8828-a35df58ba902). The input placeholder is **"I want to…"**. That is the brief's "express intent naturally" in two words. Also shows a chart inside the answer, plus a quiet "AI can make mistakes" line under the input.

### Labelling and control (AI Act Art. 50, in practice)
- **Lloyds**: [spending chat](https://mobbin.com/screens/0b513db0-3b95-44c1-aa50-6ebd386b1c8a): "BETA" pill + "Conversations are powered by AI" as a divider. Plain and enough.
- **Starling**: [assistant](https://mobbin.com/screens/9945b34d-e821-478e-b14a-543d7f22186b) with "Responses generated by AI" under the title; [Spending Intelligence](https://mobbin.com/screens/8369ed6d-3492-441e-addc-8ac1d1a62e5a) with suggested questions and a visible **"Turn off Spending Intelligence"** link. Best opt-out pattern found.
- **Binance AI**: [answer](https://mobbin.com/screens/328de467-6852-4d42-b971-16e3b5b8f69c): a "Data from binance.com" source chip plus thumbs up/down. Our version: "Based on your current account, Aug–Oct".
- **Avoid, Venmo**: [consent wall](https://mobbin.com/screens/1431af01-2ee9-4aa8-b00e-283f92a93fef). Legal disclaimer stacked above the input before you've asked anything.

### Proactive openers and entry points
- **Origin**: [Ask Sidekick](https://mobbin.com/screens/c759f1aa-5c8a-46d2-a265-f2260a873275): "Plan with AI" list (Emergency Fund, Retirement…) for people who don't know what to ask. Good second entry point next to free text.
- **Cleo**: [proactive opener](https://mobbin.com/screens/73d8bc4c-bc92-4520-9633-40e0f6f4bec5): reply chips ("yes, let's set up bills" / "no, I'm good for now"). **Borrow** the chips. **Avoid** the roast tone ("committed relationship with Starbucks") and the "Get $400" cash-advance button in the header, which is a credit nudge on every screen.

### Visualising the recommendation and adjusting it
- **Plum**: [projection with deposit selector](https://mobbin.com/screens/d0c5e5ef-7c61-4164-9e1e-0b49ad537db0): segmented control (£100 / £200 / £500) redraws the projection. Closest match to our "adjust assumptions" step. (It's an investment product with a "Buy" CTA; we take the interaction, not the context.)
- **bunq**: [balance prediction](https://mobbin.com/screens/f5ca0ce0-971b-4d41-a5e3-d957be27fbec): solid line for actual, dotted for predicted, plus a plain warning card. Good grammar for "where you'll be in July".
- **Up**: [goal summary](https://mobbin.com/screens/43f50b0f-c667-404f-8d39-f5c22e0bafc6): answer first ("you should save $2,000 a month"), then editable rows that recalculate.

### Goal setup (the familiar non-AI path)
- [GoHenry](https://mobbin.com/screens/a59127cd-a3d1-4ab4-afb1-0e0c7d133d9f): one sentence that says what will happen ("We'll transfer £1.12 every Saturday so they'll reach their goal by…") and a "Lock goal" toggle.
- [Gusto](https://mobbin.com/screens/97da07b7-3b11-4925-a9fd-e61a9d30b3b2): preset amount chips + "Other". [Monzo](https://mobbin.com/screens/3321502f-b505-463a-aed4-890ffb6f8235), [N26](https://mobbin.com/screens/459fe34c-1917-471b-a773-762b629381c7): amount + optional date.
- [KOHO flow](https://mobbin.com/flows/b58170c4-3261-470e-a6f2-522deb3757b0): ends on a "Goal Created" toast with the goal card and **Next deposit** date. Good model for our confirmation state.

### Review and approve
- **Ubank**: [One last check](https://mobbin.com/screens/d3b43667-83a6-468b-afae-2c632ce655fd): the review is a **sentence** ("Schedule $100 to Save account from Spend account") with tappable chips for date and repeat. Strongest single reference: it bridges conversation and controls.
- **Zopa**: [confirm](https://mobbin.com/screens/0a1c54e3-9a8b-436c-9bcf-7c5b03cb61f4): Confirm + an equal-weight "Edit payment". **Chime**: [review](https://mobbin.com/screens/fffb53ce-56d2-4903-84ea-54d1b92301dc): a "Learn how your money moves" link. **Neo**: [recurring transfer](https://mobbin.com/screens/a9a4ab97-91ff-4f48-9b46-c17984151ae9) states consequences up front ("can't be cancelled").
- **Avoid, Fidelity**: [review](https://mobbin.com/screens/ec459a25-2846-446a-975e-58818f843cc7): a legal certification paragraph above Submit.

### What's missing
None of the assistants found on Mobbin **proposes a plan in chat and then hands it to a proper review screen**. The AI ones answer questions; the review screens belong to manual flows. Joining those two (Notion-style conversation → Plum-style adjustable projection → Ubank-style sentence review → Face ID → KOHO-style confirmation with Notion-style undo) is our design's main bet.

## 5. Assistant architecture (agreed 2 Nov, to unpack at the end)

Presented as **one assistant, one calculator, two safety layers and a handoff**, not "five agents".

| Role | What it does | LLM? | Where Inês sees it |
|---|---|---|---|
| Assistant | Understands intent, asks what's missing, explains, keeps context between chat and controls. Always labelled AI. | Yes | Every bubble |
| Plan engine | Margin, buffer check, monthly amount, projection; Christmas allowance and IRS as marked inputs | **No** (deterministic) | "Calculated by planner" line in the steps receipt |
| Guardrail checker | Every reply checked: no credit, no investment advice, no sensitive inferences, transaction text treated as data | Rules + classifier | "Checked against conduct rules" in the receipt |
| Action drafter | Turns the chosen plan into a draft standing order. Cannot execute | No | Review screen / approval request |
| Handoff router | Mortgage, investments, insurance, tax → person or regulated flow, context passed | Classifier | Handoff card |
| *(Next, not in PoC)* Monitor | Off-track alerts, Christmas allowance prompt | — | One line in the slides |

How it surfaces: subtly. While working, the bubble shows live steps ("Reading Aug–Oct… Calculating… Checking…"); when done, it folds into one "3 steps ›" receipt under the bubble (Notion pattern) that expands to name each role. The review screen repeats it once as "Prepared by the assistant · numbers from the planner".

**Approval request component** (George's pick, from Claude's own permission card): "<Assistant> wants to <action> from <source>" + parameter list + Decline / Approve. Two variants: *read data* (can offer "Always allow", e.g. reading spending) and *move money* (never "Always allow"; every approval goes to Face ID, per PSD2 SCA). Candidate for the handoff spec.
