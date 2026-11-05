---
# DESIGN.md (Google Labs format, alpha). Token VALUES here are placeholders until George sets the
# visual direction in Figma; the source of truth for values is tokens/tokens.json (DTCG 2025.10).
name: "PoC bank · savings assistant"
version: 0.1.0
colors:                       # 5 Nov: light, slightly cool grey neutrals (were warm beige; read as "AI"), ink actions, blue AI marker
  surface: "#FFFFFF"
  surface-raised: "#F4F5F7"
  text: "#16171A"
  text-muted: "#666A72"
  text-on-accent: "#FFFFFF"
  border: "#E2E4E8"
  border-strong: "#666A72"
  accent: "#16171A"           # ink: primary buttons, selected, chart bars
  ai: "#1F5BE8"               # blue from the AI sphere; assistant marker only
  ai-gradient: ["#FFFFFF", "#FBF4EC", "#FAB615", "#FC681E", "#0D5DF4", "#0B4ABB", "#17131C"]  # the AI sphere and reply rule
  positive: "#1F7A34"
  warning: "#9A5B00"
  danger: "#B4291E"
typography:
  family: "Inter"             # draft: tnum + PT diacritics; Figma text styles of the same names
  display: { size: 40, weight: 700, line: 44 }
  title: { size: 22, weight: 600, line: 28 }
  body: { size: 16, weight: 400, line: 22 }
  body-strong: { size: 16, weight: 600, line: 22 }
  label: { size: 14, weight: 500, line: 18 }
  caption: { size: 12, weight: 400, line: 16 }
  amount: { size: 48, weight: 700, line: 52, features: ["tnum"] }
  amount-sm: { size: 20, weight: 600, line: 24, features: ["tnum"] }
spacing: { unit: 4, scale: [4, 8, 12, 16, 20, 24, 32, 40, 56] }
rounded: { sm: 8, md: 16, lg: 24, pill: 999 }
elevation: { card: "0 1 2 / 4%, 0 2 8 / 4%", sheet: "0 -4 24 / 8%" }
components:
  approval-request: { surface: "{colors.surface-raised}", radius: "{rounded.lg}" }
  message-assistant: { marker: "{colors.ai}" }
---

# DESIGN.md

How this product should look and behave. Read with `TONE.md`, `ASSISTANT.md`, `ACCESSIBILITY.md`, `SECURITY.md`. Numbers come from `../data/plan-output.json`, never typed by hand.

## Principles (in priority order)
1. **Inês approves, the assistant proposes.** Nothing that moves money happens without a review and Face ID.
2. **Numbers are the planner's, words are the assistant's.** Every figure traces to `data/planner.py`.
3. **Honest over upbeat.** "This is a stretch" is a feature. Never hide a gap.
4. **Chat and controls are the same state.** Dragging the amount updates the conversation; typing "make it 250" moves the control.
5. **Closed widget catalog.** The assistant can only show components from this system (A2UI idea). It never generates layout or style.
6. **Familiar first.** Banking patterns people already know (amount sheet, review, receipt) over novelty.
7. **Calm.** One accent, one AI marker, lots of space (Notion AI as the elegance reference).

## Experience model
- **Conversation layer**: intent input ("I want to…"), assistant messages, reply chips, steps receipt.
- **Widget layer** (inside messages): margin snapshot, plan card + projection, extra-money calendar, gap resolver, approval request, plan status, handoff card.
- **Familiar layer** (full screens/sheets): review & approve, amount sheet, goal detail, confirmation.
- Moving between layers keeps context: a widget opened full-screen returns to the same point in the chat.

## Layout
- Frame 393 × 852 (iPhone 16/17). Margins 16. Grid: 4-pt.
- Safe areas respected; bottom input docked above home indicator; sheets 24 radius.
- Min touch target 44 × 44.

## AI marking (EU AI Act Art. 50)
- Assistant name + "AI" label in the conversation header, always visible.
- AI-written text carries the `ai` marker (a small glyph or rule), never colour alone.
- Planner numbers show a "Calculated by the planner" source in the steps receipt.

## Components (Figma ⇄ code names match)
| Component | Variants / states |
|---|---|
| `AssistantPill` | idle · nudge · working · ready (the dormant assistant; built in Figma 3 Nov) |
| `IntentInput` | empty · typing · sending · disabled |
| `Message` | user · assistant · assistant-with-widget · system |
| `StepsReceipt` | working · done (collapsed) · done (expanded) · reverted |
| `ReplyChip` | default · selected · disabled |
| `MarginSnapshot` | default · loading |
| `PlanCard` | fits · stretch · short |
| `ProjectionChart` | default · adjusting · with-gap · goal-met |
| `AmountControl` | slider · presets; synced/unsynced |
| `ExtraMoneyCalendar` | items: christmas · irs (optional) · holiday (trip money) |
| `GapResolver` | 3 options, one selected |
| `ApprovalRequest` | read-data (can "always allow") · move-money (never; Face ID) · approved · declined |
| `PlanStatus` | active · paused · short-this-month |
| `HandoffCard` | credit · mortgage · investments · insurance |
| Basics | `Button` (primary/secondary/tertiary/destructive), `ListRow`, `TopBar`, `Sheet`, `Toast` |

Figma: components on page "3 · Components", variables mirror `tokens/tokens.json` names exactly (`color/surface/default` ⇄ `color.surface.default`).

## Motion
- Widgets enter with a short rise + fade (≤ 200 ms); projection redraws by tweening, not jumping.
- Respect Reduce Motion: crossfade only.
- Steps receipt: live steps tick in order, then collapse.

## Open decisions (George)
Visual direction, typeface, accent and AI colour · product/assistant name · UI language (recommendation: English UI for the panel, one screen also in PT-PT to show localisation, PT number formats in the PT version) · which component gets the code handoff (recommendation: `ApprovalRequest`).
