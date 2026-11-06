# 04 · Journeys and the plan for Foundations, Components, Screens

Inputs: `data/plan-output.json` (numbers), `design/*.md` (rules), `research/02–05` (why). Timebox reminder: 4–6 h total; keep the core journey polished, breadth as hand-offs.

## 1. User journeys

### J0 · The assistant asleep (added 3 Nov)
The assistant is dormant in a pill above the tab bar (Notion pattern, see research/06). Each journey has an entry trigger and ends by handing back to the app: J1 you ask · J2 money arrives · J3 planner forecast · J4 guardrail mid-chat · J5 first tap / consent renewal. Figma: row J0 (pill states + entry points map); every journey row now starts with its entry and ends "Back in the app".

### J1 · Save for the holiday (core, prototyped)
| # | Inês | Assistant / system | Screen | Widgets | Brief requirement |
|---|---|---|---|---|---|
| 1 | Types her intent | Acknowledges, says what it'll read | 01 Intent | IntentInput, AI label | Express intent naturally |
| 2 | — | Reads Aug–Oct, shows steps, then her monthly picture | 02 Understanding | StepsReceipt, MarginSnapshot | Meaningful visuals |
| 3 | Reads the plan | Buffer kept (€900); full goal = stretch (€375); proposes €220 + €600 Christmas → €2,360, gap €640 | 03 Recommendation | PlanCard(stretch), ProjectionChart, ExtraMoneyCalendar | AI recommendation |
| 4 | Drags to €250, then back | Projection + copy update live (€2,600, gap €400; "only fitted September; August and October would have been short", from `scenarios.j1_what_if`) | 04 Adjust | AmountControl, ProjectionChart(adjusting) | Adjust assumptions; **state change** |
| 5 | Opens the gap, picks September (+€200 holiday allowance) | Shows 3 options; never picks | 04b Gap | GapResolver | Meaningful decision |
| 6 | Reviews | Exact payload, how to pause | 05 Review | ApprovalRequest(move-money) → Face ID | Explicit approval |
| 7 | Done | Goal created, next transfer 1 Dec, Christmas reminder, Pause | 06 Confirmation | PlanStatus, receipt | Confirmation / next step |
Continuity: from 06, "Ask about this plan" reopens the chat at the same point (context preserved).

### J2 · Christmas allowance lands (proactive; one slide frame or prototype extra)
Notification → "Your Christmas allowance arrived. Send €600 to Holiday as planned?" → ApprovalRequest → done. Shows the monitor role and the "intent mandate" idea (limit + expiry, revocable).

### J3 · Off-track month (walkthrough only)
A €180 laptop repair in January → PlanStatus(short-this-month) → three options from the planner (`scenarios.j3_off_track_month`, computed on the September plan Inês chose in J1): skip January (€2,580 by Sep, €220 short of plan) · spread it, +€28 on the next 8 transfers (€248/month, €2,804) · keep it (€180 from the buffer) → review → approve, undo until 1 Jan. (Was "+€44 over Feb–Jun", typed by hand; replaced by the planner on 3 Nov.)

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

## 3. Components (page "3 · Components") — only what the prototype actually uses

**4 Nov update:** the prototype is now one assistant with three conversations (save, spending, scam check); J0 and J2–J5 code is gone, so the J2–J5 rows below are kept only for the page 5 wireframes. (5–6 Nov: J0 and J2–J4 are back in the build and all five journeys are on Figma page 4.) New, from `src/chat.tsx` and `src/assistant.tsx`:

| Group | Component | Variants / states |
|---|---|---|
| Conversation | `AiReply` | typing → streaming → widget (one per assistant turn) |
| | `TypingDots` | default |
| | `UserBubble` | text · pasted message (quote, "read as text only") |
| | `Folded` | closed · open (an older widget as a one-line summary) |
| | `Suggestions` | suggested replies above the input (same path as typing) |
| | `IntentInput` | idle · typing · AI replying (send disabled) |
| Widgets | `SpendingBreakdown` | period Aug–Oct · Aug · Sep · Oct; fixed costs row; top 5 + show more; row expanded (top places) |
| | `ScamVerdict` | likely scam (reasons + "link not opened") |
| | `CardControl` | active · frozen (freeze switch) |
| | `Num` | animated number (tabular) |
| | `Segmented` | period / tweak switcher |
| Trust | `BottomSheet` | report confirmation |
| Brand | `AiOrb` | idle · thinking · listening; soap-bubble shader (WebGL), CSS fallback; sizes 20 / 22 / 32 / 88 |
| Conversation | `PromptBox` (replaces `IntentInput`) | empty (mic) · typing (send) · replying (stop) · recording (timer + levels) · screenshot attached |

Decided 3 Nov: scope frozen to J1; the list below is taken from the code prototype (`prototype/src/components.tsx`), so Figma builds what the experience really uses. Built in Figma after George settles the experience in code. Code name = Figma name.

| Group | Component | Variants / states used in J1 |
|---|---|---|
| Basics | `Button` | primary · secondary · tertiary · disabled |
| | `StatusBadge` | positive · warning · danger (label + icon, never colour alone) |
| | `ProgressBar`, `Row` (key–value), `Toast` (with action), `Icon` (one set, 24 grid) | — |
| | `TopBar` | assistant (close + "AI" + disclosure) · screen (back + title + subtitle) |
| | `TabBar`, `ListRow` | shortcut · transaction |
| Conversation | `AssistantPill` | idle · working · ready (nudge kept for J2/J3) |
| | `IntentInput` | empty · typing |
| | `Message` | user · assistant (AI rule) |
| | `StepsReceipt` | working · done collapsed · done expanded |
| Widgets | `MarginSnapshot` | default |
| | `PlanCard` | default · adjusting (badge from the planner's fit) |
| | `ProjectionChart` | with-gap · goal-reached (dashed = planned/gap) |
| | `AmountControl` | slider + preset `Chip`s (default · selected) |
| | `GapResolver` + `Option` | default · selected · uncertain (dashed) |
| Trust | `ApprovalRequest` (review) | move-money |
| | `FaceIdOverlay` | scanning · approved |
| | `GoalCard` / `PlanStatus` | active · paused · highlighted (hand-back) |

Added while building J0, J2–J5 in code (3 Nov):

| Group | Component | Variants / states | Used in |
|---|---|---|---|
| Conversation | `ReplyChips` | default | J1 fallback ("I'm not sure I got that"), J5 limited mode |
| | `ContextChip` | default | J4 (earlier context carried into the chat) |
| | `StepsReceipt` | + custom summary (e.g. "Rules: credit question → a person") | J4 |
| Widgets | `OptionList` + `Option` | default · selected · uncertain | J1 gap (as `GapResolver`), J3 January options |
| Trust | `ApprovalCard` (inline move-money) | pending · approved · declined; no "always allow" | J2 |
| | `HandoffCard` | credit (open · done) | J4 |
| | `Mandate` note | default | J2 (standing instruction + Change) |
| Shell | `GoalCard` | active · short-this-month · paused · highlighted | Home in J1–J3 |
| | `Home` | balance shown · masked; Recent · Today · Coming up | all |
| | `BottomSheet` | intro · consent · share-confirm | J4, J5 |
| | `LockScreen` + `Notification` | amounts hidden | J2 (app closed) |
| | `Screen` (full, with `TopBar` + `ActionDock`) | review · confirmation | J1, J3 |

Dropped: `ExtraMoneyCalendar` (the Christmas allowance is a line in the plan card + a lighter bar segment); `ReplyChip` merged into `Chip`/`ReplyChips`.

## 4. Screens (page "4 · Screens") — content from the data

Figma layout (3 Nov): one section (row) per journey. J1 row 01–06 incl. 04b Gap; J2 row notification → approve → done; J3 row short-this-month → review → done with undo; J4 handoff and J5 consent as single frames. Chosen-plan numbers (September, 10 × €220 = €2,200 scheduled) from `scenarios.j1_chosen`.
| Screen | Must show (numbers from planner) | Idea |
|---|---|---|
| 01 Intent | "I want to…", 3 shortcuts (Save for something · Where did my money go · Check a message), AI label | Shortcuts are Origin's "Plan with AI" pattern; one of them is the scam check (anti-fraud) |
| 02 Understanding | Steps ticking; margin €150 / €280 / €230; fixed €732 | Salary bars hint at 14 payments (June/Dec taller) |
| 03 Recommendation | Buffer €900 kept · needs €375 = stretch · €220 + €600 → €2,360 · gap €640 | Gap is visible on the chart, not in small print |
| 04 Adjust (state change) | €220 → €250: €2,600, gap €400; Aug and Oct flagged short | Chat line and slider update together (same state) |
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
