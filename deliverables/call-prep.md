# Call prep · WIT AI-Assisted UI/UX Designer

Notes for George, not a script. Say it your way. Updated 5 Nov 2026.

## Where it stands (health check, 5 Nov)

| Area | State |
|---|---|
| Code prototype | Builds clean, types pass, planner check passes (app numbers = `data/planner.py`). Live on GitHub Pages, serving the current build. |
| Journeys in code | J0 first use (default) → J1 save for a holiday (core). J2 Christmas allowance, J3 short month, J4 credit hand-off, picked from the hidden tweaks drawer (T or pull from the right edge). |
| Figma | 77 variables (Primitives → Semantic Light/Dark), 16 text styles, 5 effects, 88 components and sets bound to variables. 20 screens on page 4 (J1 + supporting chats + entry points), 18 on page 5 (J0, J2–J4, entry map), all built from instances. |
| Figma prototype | Wired: 61 hotspots, 9 flows. Start with "J1 · Poupar para algo" on page 4. T on Home opens the tweaks overlay. |
| Summary slides | Page 6, both filled. **Hours is a placeholder for you.** |
| Handoff | ApprovalCard spec on page 7 + `deliverables/handoff-spec.md`. Code Connect sketched, not connected (needs a paid published library). |
| AI log | `ai-log/log.md`, one row per AI contribution with what was wrong; `learnings.md` for process lessons. |
| Decisions | `design/DECISIONS.md` (D1 search + AI, D2 gradient stroke) and the board on Figma page 1. |

Gaps to own, not hide:
- **Hours.** The brief says 4–6. This went well past it (git shows work on 3, 4 and 5 Nov; on 4 Nov alone commits span 11:14 to 21:08). Give the real number and say why: you chose to settle the experience in code and test it on your phone and on people.
- **Replies are scripted**, no live model. That was on purpose (see answers below).
- **Testing** was informal: you showed it to a few people and they found the double search confusing. That's one real finding, not a study.
- **Dark mode** exists as variables and in the code; the Figma screens are shown in Light.
- **The cover page** is just the WIT logo. Fine, but you could add a one-line "start on page 4, flow J1".

## The 2-minute version

Say it in your own words. The beats:
1. The problem in Portugal: few people save, most leave it in the current account (CNSF 2024: 53.9% saved anything, 84% of savers keep it in the current account). So the job is moving idle money into a plan, not finding money that isn't there.
2. Inês types what she wants. The assistant shows what she actually had left each month, then a plan that fits (220 € a month + the Christmas allowance = 2360 € by July), and is honest about the 640 € gap.
3. She changes it by talking or dragging (the state change), picks how to close the gap, reviews exactly what will move, approves with Face ID, and lands back on Home with Undo.
4. How you worked: AI did most of the drafting through Claude Code and the Figma MCP. You set the direction, tested on your phone, and threw away a lot (logged).

## 45-minute panel: suggested order

1. **Prototype first (8 min).** Phone or desktop, J1 end to end. Then one secondary journey (J2 or J3) from the drawer to show breadth.
2. **Figma structure (10 min).** Page 2 variables (Primitives → Semantic, Light/Dark, code syntax = CSS vars) → page 3 components (AssistantPill states, PromptBox states, PlanCard variants, the AiMessage callout with a widget slot) → page 4 screens built from instances → page 7 handoff.
3. **AI workflow (8 min).** Slide 2. Pick two concrete stories: the planner check catching hand-typed numbers (three times), and the double-search finding that moved search into the dock.
4. **Trade-offs (8 min).** Scripted vs live LLM, code-first vs Figma-first, scope (one journey polished, the rest secondary).
5. **Live iteration (10 min).** See below.

## Likely questions and what to say

**Why design in code first?** The interesting part is the conversation: timing, streaming, what folds, what the suggestions offer next. You can't judge that in static frames. Code let you test it on your phone the same day. Figma got the system and the screens once the experience was settled.

**Why scripted replies, not a real model?** The numbers must be right, so they come from the planner and the model only explains them. A live model would add variability to a demo whose point is trust. In production the model would route intent and phrase replies; numbers, eligibility and actions stay in bank systems.

**How do you stop the AI making up numbers?** It never produces them. Every figure on screen comes from the planner (`plan-output.json`), and a check script fails the build if the app disagrees with it. That script caught real mistakes.

**What did AI get wrong?** Hand-typed numbers that didn't match the planner. A stacking bug that put the pill over the sheet (you caught it on the live page). The first AI marks (orb, bubble, robot) didn't fit, and you rejected them. A misleading confirmation line ("3100 € em transferências" included the Christmas allowance). A J3 trigger that didn't match how people pay for repairs. All in the log.

**How did you judge quality?** Against the brief and the rules you wrote down (TONE.md, the stroke rule, numbers only from the planner). Screenshots after every Figma batch, a binding audit, contrast checks, clicking every path, and testing on your iPhone, where you found the Safari scroll bug and the dead "Planear com a IA" button.

**Why the gradient stroke?** You want people to see where the AI is acting or about to act without adding labels everywhere. Static gradient = something for you to act on, turning gradient = the AI is working. Badges went neutral so colour stays meaningful.

**Why one search with the AI in the dock?** First version had a search field and an Ask AI pill. People saw two searches. Notion's pattern fixed it: search button bottom-left, AI pill next to it with the mic. Search results stay instant and non-AI, with one "Perguntar à IA" row.

**Trust and regulation?** Nothing moves without a review screen and Face ID, and what's shown is what's signed (PSD2 dynamic linking). No "always allow" on money. The assistant says it's AI and can make mistakes (AI Act transparency). It hands credit to a person instead of suggesting a loan. Health spending is never named (GDPR guardrail).

**Accessibility?** AA contrast for every token pair in both modes, Reduce Motion respected, status never by colour alone (icons + words), screen-reader labels on the key controls. Main buttons and icon buttons are 44 px. Be honest about the rest: chips are 36 px and the period switcher and toast action 32 px. That passes WCAG 2.2 AA (24 px minimum) but not Apple's 44 pt guideline, and it's the first thing you'd fix. A VoiceOver pass is planned (ACCESSIBILITY.md), not done.

**What would you do next?** Test J1 with 5 people for real. Connect Code Connect for the core components. Run the copy past a native PT banking copywriter. Measure plans started vs approved and how often people change the suggested amount.

**How does this scale to other products?** The same parts: intent → understanding (steps receipt) → callout with a widget → review → approval. New journeys are new widgets and planner rules, not new screens.

**Why Portuguese, informal "tu"?** The persona is in Lisbon and the brief is a Portuguese company; "tu" matches younger PT banking apps. Easy to switch.

## Live iteration: rehearse these

| Likely ask | Where | How |
|---|---|---|
| Change the suggested amount or copy on the plan | Figma page 3 `PlanCard`, or code `conversation.tsx` | In code, numbers come from the planner: change the data, re-run `python3 data/planner.py`. |
| Make the AI's colour less loud | Figma paint style `brand/ai-sphere` / `brand/viz-highlight` | Styles are shared, so every component updates. |
| Add a state to a component | `AssistantPill` or `PromptBox` set | Duplicate a variant, rename the property value, change the stroke style. |
| Switch to dark | Figma: set the page/frame mode to Dark on the Semantic collection | Variables already have Dark values. |
| Add a new gap option | `GapOption` in Figma, `gapOptions()` in `planner.ts` | Planner first, then the card. |
| Move a screen into the prototype | Page 4 | Add a hotspot frame and an On click → Navigate. |

## Recruiter call (likely before the panel)

- **Why WIT:** your own words. Don't mirror the posting. One concrete thing from this challenge is better than any adjective.
- **Hours used:** give the real number, and that you chose to go deeper in code.
- **Availability, remote:** posting says Portugal, remote.
- **Salary:** ask their range first. If pushed: 42–45k gross a year, floor 35k (from your application notes).
- **Questions to ask them:** own products or client work? Who would you work with day to day? How do their developers use Figma today (Dev Mode, Code Connect)?

## Numbers to have in your head

Inês: about 900 € in the current account. Left each month Aug–Oct: 150 / 280 / 230 €. Plan: 220 € a month + 600 € Christmas allowance = 2360 € by July, 640 € short. 250 € a month → 2600 €. September → 2800 € + 200 € holiday allowance = 3000 €. J2: 600 € to Holiday, 530 € stays, 820 € saved. J3: 180 € paid at Worten on 28 Dec, about 40 € left; skip January → 2580 €, spread → 248 € × 8 = 2804 €.
