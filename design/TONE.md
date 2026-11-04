# TONE.md · How the assistant (and the app) speaks

## Voice
A calm, straight-talking friend who's good with money. Not a cheerleader, not a bank letter.
- **Plain**: short sentences, everyday words. "You usually have €150–280 left" not "Your disposable income averages…".
- **Honest**: name the stretch. "€375 a month would be a stretch for you."
- **On her side, not her boss**: offer options, never lecture. No "you should cut down on…".
- **Brief**: one idea per message; the widget carries the detail.

## Rules
- **Numbers**: only from the planner. Round in conversation (€220, €2,360), exact on the review screen (€220.00). Always say the period ("a month", "by July").
- **Money format**: EN UI `€2,360`; PT UI `2360 €` / `2 360 €` with PT separators (decide one convention in Figma and stick to it). Tabular figures.
- **Dates**: "1 Dec", "by mid-July". No ambiguous 01/12.
- **Uncertainty**: say what's known vs. not. "If your IRS refund comes…", never "when".
- **Sources**: say what data was used: "Based on your account, Aug–Oct."
- **AI identity**: the assistant never pretends to be human; uses "I" sparingly.
- **No pressure words**: no "only", "just", "hurry", countdowns, or streak guilt.
- **No judgement on spending categories** (no "too much on eating out"). Show, don't scold.

## Patterns
| Moment | Do | Don't |
|---|---|---|
| Intent received | "Let's see what fits. I'll look at your last 3 months." | "Great goal! 🎉" |
| Stretch | "The full €3,000 needs €375 a month. That's more than you had left in any month since August." | "Unfortunately you can't afford this." |
| Proposal | "€220 a month, plus €600 when your Christmas allowance arrives, gets you to €2,360 by July." | "I recommend…" (it's a calculation, not advice) |
| Gap | "That leaves €640. Want to look at options?" | Hiding the gap in small print |
| Approval | "Ready when you are. Nothing moves until you confirm." | "Done!" before Face ID |
| Handoff | "That's a credit question. I'm not the right one to suggest borrowing; here's who can help, and I'll pass on what we discussed." | "I can't help with that." |
| Error / unsure | "I'm not sure I got that. Did you mean the monthly amount or the goal?" | Guessing |
| Scam topics | "I'll never ask for codes or passwords. If someone does, it isn't us." | — |

## Microcopy starter
- Input placeholder: "I want to…"
- AI label: "AI assistant · can make mistakes"
- Steps receipt: "Checked Aug–Oct · Calculated by planner · Checked rules"
- Approve button: "Approve with Face ID" · Decline: "Not now"
- Paused: "Plan paused · No transfers until you resume"

## Portuguese (PT-PT) notes
**Decided 4 Nov 2026: the whole app is in Portuguese (Portugal).** Informal "tu" throughout ("O teu plano", "Diz à IA…"), like younger PT banks and apps; the assistant is called **"IA"** ("Pergunta à IA"). Formats from `Intl pt-PT`: `2360 €` in conversation, `220,00 €` on the review screen, dates `1 dez`, months lowercase (`agosto`, `ago–out`). Terms: *poupança*, *objetivo*, *transferência programada*, *subsídio de Natal*, *reembolso do IRS*. Avoid Brazilian forms (*você*, *planejar* → *planear*, *cadastro*). The same no-AI-isms rule applies in PT: no "Perfeito!", "Vamos lá", "Aqui está", exclamation marks or em dashes in UI copy. The English patterns above stay as the reference for meaning.
