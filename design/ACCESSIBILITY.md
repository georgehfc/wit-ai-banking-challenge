# ACCESSIBILITY.md

Target: **WCAG 2.2 AA** (the European Accessibility Act covers banking since June 2025; EN 301 549 references WCAG 2.1 AA, so 2.2 AA is a safe superset).

## Non-negotiables
- **No chat-only path.** Every action the assistant offers is also reachable with controls (and vice versa).
- **Contrast**: text 4.5:1, large text and UI parts 3:1, checked for every semantic token pair in light and dark (DESIGN.md CLI can lint).
- **Targets**: 44 × 44 pt minimum (WCAG 2.2 asks 24 × 24; iOS 44).
- **Dynamic Type** up to the largest accessibility size; widgets reflow, amounts never truncate.
- **Never colour alone**: stretch/short/on-track use label + icon; AI marker is a glyph + label.

## Conversation specifics
- New assistant messages announced via a polite live region; streaming text is announced once complete, not token by token.
- Focus doesn't jump when a widget appears; it moves only when the user acts (e.g. opening review).
- Steps receipt: announced as a single status ("Working: checking your account") then "Done, 3 steps".
- Reply chips are buttons with full labels; selected state announced.

## Charts and numbers
- `ProjectionChart` has a text alternative: "Saved by July: €2,360 of €3,000. Gap €640." plus an optional data table.
- Slider: adjustable with VoiceOver swipe up/down in €10 steps, announces the new amount and the new total.
- Amounts read naturally ("two thousand three hundred and sixty euros"), tabular figures visually.

## Motion and time
- Respect Reduce Motion (crossfade only). No auto-advancing content. No time limits on approval (the session can re-authenticate instead).

## Language
- Plain language (TONE.md). `lang` set per screen (EN / PT-PT).

## Check before submit
VoiceOver pass on the core journey · contrast lint · largest Dynamic Type screenshot of plan card and review · keyboard/Switch Control can complete approval.
