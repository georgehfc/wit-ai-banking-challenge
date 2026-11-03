# 04 · Journeys and the plan for Foundations, Components, Screens

Inputs: `data/plan-output.json` (numbers), `design/*.md` (rules), `research/02–05` (why). Timebox reminder: 4–6 h total; keep the core journey polished, breadth as hand-offs.

## 1. User journeys

### J1 · Save for the holiday (core, prototyped)
| # | Inês | Assistant / system | Screen | Widgets | Brief requirement |
|---|---|---|---|---|---|
| 1 | Types her intent | Acknowledges, says what it'll read | 01 Intent | IntentInput, AI label | Express intent naturally |
| 2 | — | Reads Aug–Oct, shows steps, then her monthly picture | 02 Understanding | StepsReceipt, MarginSnapshot | Meaningful visuals |
| 3 | Reads the plan | Buffer kept (€900); full goal = stretch (€375); proposes €220 + €600 Christmas → €2,360, gap €640 | 03 Recommendation | PlanCard(stretch), ProjectionChart, ExtraMoneyCalendar | AI recommendation |
| 4 | Drags to €250, then back | Projection + copy update live ("August would have been short") | 04 Adjust | AmountControl, ProjectionChart(adjusting) | Adjust assumptions; **state change** |
| 5 | Opens the gap, picks September (+€200 holiday allowance) | Shows 3 options; never picks | 04b Gap | GapResolver | Meaningful decision |
| 6 | Reviews | Exact payload, how to pause | 05 Review | ApprovalRequest(move-money) → Face ID | Explicit approval |
| 7 | Done | Goal created, next transfer 1 Dec, Christmas reminder, Pause | 06 Confirmation | PlanStatus, receipt | Confirmation / next step |
Continuity: from 06, "Ask about this plan" reopens the chat at the same point (context preserved).

### J2 · Christmas allowance lands (proactive; one slide frame or prototype extra)
Notification → "Your Christmas allowance arrived. Send €600 to Holiday as planned?" → ApprovalRequest → done. Shows the monitor role and the "intent mandate" idea (limit + expiry, revocable).

### J3 · Off-track month (walkthrough only)
A big bill in January → PlanStatus(short-this-month) → "Skip January's €220 and spread it over Feb–Jun (+€44/month)?" → approve.

### J4 · "Could I borrow to go sooner?" (side moment, one frame)
Guardrail catches credit → HandoffCard: why the assistant won't suggest borrowing, costs and a human review exist, "I'll pass on what we discussed". Shows breadth + judgement.

### J5 · First use: consent (one sheet)
"To help, I'll read your current account (last 3 months). Until 2 Feb 2027. You can stop this any time." Allow / Not now.

## 2. Foundations (page "2 · Foundations") — plan + ideas
- **Collections**: `Primitives` (neutral ramp, accent, ai, positive, warning, danger; space; radius) → `Semantic` with modes Light / Dark. Names = `design/tokens/tokens.json`.
- **Type**: one family with good tabular figures and Portuguese diacritics; styles display, title, body, label, caption, amount (tnum).
- **Ideas**:
  - The **AI colour is a marker, not a theme**: used only on the assistant glyph/rule and the steps receipt. Everything else neutral + one accent.
  - **Amounts as a type style** of their own (big, tabular) so planner numbers look different from chat prose: the numbers' source is visible.
  - A **dashed line language** for "planned/estimated" vs solid for "real" (projection, calendar). Reused everywhere uncertainty exists.
  - Dark mode only if time allows; tokens are ready for it.
- **Claude Code can**: push tokens.json into Figma variables via the Figma MCP; lint contrast; generate a foundations doc frame.

## 3. Components (page "3 · Components") — build order
1. Basics: Button, ListRow, TopBar, Sheet, Toast (fast; Auto Layout + variants).
2. Conversation: IntentInput, Message, ReplyChip, **StepsReceipt** (working → done → expanded → reverted).
3. Widgets: PlanCard, ProjectionChart, AmountControl, ExtraMoneyCalendar, GapResolver, MarginSnapshot.
4. Trust: **ApprovalRequest** (read-data / move-money / approved / declined), PlanStatus, HandoffCard.
- **Ideas**:
  - ApprovalRequest anatomy from Claude's own permission card: "<Assistant> wants to <action> from <source>" → parameter rows → Not now / Approve with Face ID. Move-money variant has no "Always allow" by design: say why in the component description.
  - StepsReceipt names the roles ("Read your account · Planner calculated · Checked rules"): the architecture becomes a trust feature.
  - ProjectionChart uses Figma variables for the monthly amount so the prototype slider really changes the bar heights (variable modes or conditional).
  - Every component description in Figma = its code name + props (sets up the handoff).

## 4. Screens (page "4 · Screens") — content from the data
| Screen | Must show (numbers from planner) | Idea |
|---|---|---|
| 01 Intent | "I want to…", 3 shortcuts (Save for something · Where did my money go · Check a message), AI label | Shortcuts are Origin's "Plan with AI" pattern; one of them is the scam check (anti-fraud) |
| 02 Understanding | Steps ticking; margin €150 / €280 / €230; fixed €732 | Salary bars hint at 14 payments (June/Dec taller) |
| 03 Recommendation | Buffer €900 kept · needs €375 = stretch · €220 + €600 → €2,360 · gap €640 | Gap is visible on the chart, not in small print |
| 04 Adjust (state change) | €220 → €250: total and copy change; Aug flagged short | Chat line and slider update together (same state) |
| 04b Gap | IRS (uncertain, dashed) · September €2,800 · €2,300 trip | Uncertain option styled with the dashed language |
| 05 Review | €220 monthly, Conta à ordem → Holiday, 1 Dec–1 Sep, pause any time; Face ID | Sentence review (Ubank) + approval request |
| 06 Confirmation | Goal created, next transfer 1 Dec, Christmas reminder, Pause | Receipt + Notion-style "Revert" (undo window) |
| 07 Handoff (optional) | Credit question → HandoffCard | Proves judgement without building a regulated flow |

## 5. Prototype (page "5 · Prototype")
01 → 02 (after delay, steps animate) → 03 → drag/tap preset (state change via variables) → 04b → 05 → Face ID overlay → 06. Smart Animate for chart; Reduce Motion variant noted.

## 6. Who does what
| George (Figma, defends live) | Claude / Claude Code (logged) |
|---|---|
| Visual direction, type, colour, name | Research, data, planner, specs (done) |
| Components and variants | Push tokens → Figma variables (Figma MCP) |
| Screens and prototype | Copy deck per screen from plan-output.json |
| Final calls on every trade-off | Contrast/accessibility checks, design critique on request |
| | Build `ApprovalRequest` in code + Code Connect or handoff spec |
| | Draft the 2 slides' text from ai-log (George rewrites in his voice) |

## 7. Backlog to pick up in code (ready-to-paste prompts for Claude Code)
1. "Read design/tokens/tokens.json and create matching Figma variable collections (Primitives, Semantic with Light/Dark) in file OoHpwsDJex2JomXCL3xPft via the Figma MCP. Log it in ai-log."
2. "Generate deliverables/copy-deck.md: every string for screens 01–07 from design/TONE.md and data/plan-output.json; flag any number not from the planner."
3. "Run python3 data/planner.py --monthly 250 and give me the exact strings for the Adjust state."
4. "Build ApprovalRequest as a React + TypeScript component (variants: read-data, move-money, approved, declined) using tokens.json; add a Storybook-style demo page; write deliverables/handoff-approval-request.md mapping Figma props → code props." (Code Connect if a repo is set up.)
5. "Lint design/DESIGN.md and tokens for contrast once George sets colours."
6. "Critique screen 03 against DESIGN.md principles and ACCESSIBILITY.md." (design-critique skill)
7. "Draft the two summary slides from ai-log/log.md and plan/04; plain language; George rewrites."
