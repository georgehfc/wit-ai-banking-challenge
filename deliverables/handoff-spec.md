# Handoff · ApprovalCard

The card the assistant uses when it wants to move money (J2: the Christmas allowance). It's the component where trust is decided, so it's the one worth specifying for production. Figma: page 3 (Widgets) and page 7. Code today: `prototype/src/chat.tsx` → `ApprovalCard`. States: `design/STATES.md` §3.

## What it does

Shows exactly what will execute, and nothing else: amount, from, to, when, and what stays behind. One decision: decline or approve with biometrics. What the user sees is what gets authorised (PSD2 dynamic linking: amount and payee are bound to the authentication).

## Anatomy

| Part | Figma layer | Token / style |
|---|---|---|
| Container | `ApprovalCard` | `color/surface/default`, border `color/border/default`, radius `radius/md` (16), padding `space/4` |
| Header | sphere 20 + "A IA quer mover dinheiro" | `AiOrb Size=20`, `body-strong` |
| Primary row | Row `Strong=true` (Valor) | key `body` + `color/text/muted`, value `amount-sm` |
| Detail rows | Row `Strong=false` × 3 (De, Para, Quando) | value `body-strong` |
| Divider | 1 px | `color/border/default` |
| After rows | Fica na conta, Férias depois disto | Row `Strong=false` |
| Note | "Nada se move até confirmares…" | `caption`, `color/text/muted` |
| Actions | Button `secondary` "Agora não", Button `primary` "Aprovar com Face ID", stacked, full width | min height 44 |
| Wrapper | Shown inside an `AiMessage` callout (gradient rule) | `brand/ai-rule` |

## Props (production)

```ts
type ApprovalRequest = {
  id: string                       // idempotency key, also sent with the authorisation
  kind: 'move_money'               // 'read_data' is the other variant (consent, can offer "always allow")
  amount: Money                    // { value: 600, currency: 'EUR' }
  from: AccountRef                 // { label: 'Conta à ordem', mask: '4821' }
  to: AccountRef | GoalRef         // { label: 'Objetivo Férias' }
  when: { type: 'once'; date: string } | { type: 'monthly'; first: string; last: string; count: number }
  after?: { label: string; value: string }[]   // what stays, goal progress
  mandate?: string                 // standing instruction that triggered the ask
}
type ApprovalState = 'pending' | 'authenticating' | 'approved' | 'declined' | 'failed'

<ApprovalCard request={req} state={state} onApprove={() => auth(req)} onDecline={() => decline(req.id)} />
```

Figma variant property → prop: the card has no visual variants beyond state; the J1 review screen (`ReviewSummary` + action dock) is the full-screen version of the same contract for scheduled transfers.

## States

| State | What shows | Notes |
|---|---|---|
| pending | Rows + both buttons | Default. Buttons disabled while the assistant is still streaming. |
| authenticating | Face ID sheet over the chat | System biometric prompt in production. |
| approved | Rows + `StatusBadge positive` "Aprovado com Face ID" | Buttons removed; the reply below confirms and offers "Concluir". |
| declined | Rows + `StatusBadge warning` "Não movido" | Reply: nothing moved, can ask again. |
| failed | Rows + error line, buttons back | Biometric fail or bank error. Never retries by itself. (Figma only in the prototype.) |

## Rules (non-negotiable)

- Never "always allow" on money movement. Every transfer needs its own approval.
- The amount on screen is the amount signed. Any change re-issues the request with a new `id`.
- No action from a notification or a nudge: they open the chat, the card does the asking.
- Numbers come from the bank's systems (the planner in the prototype), never from the model's text.

## Accessibility

- Container `role="group"`, `aria-labelledby` the header. Rows read as "Valor, 600 euros".
- Approve button label includes the action and amount for screen readers: "Aprovar 600 euros para Férias com Face ID".
- Focus moves to the card when it appears; after approval, focus moves to the confirmation reply.
- Contrast: all text pairs pass AA in light and dark (checked in `design/ACCESSIBILITY.md`).
- Reduce Motion: the card fades in, no slide.

## Code Connect (sketch)

```ts
// approval-card.figma.tsx
import figma from '@figma/code-connect'
import { ApprovalCard } from './ApprovalCard'

figma.connect(ApprovalCard, 'https://www.figma.com/design/OoHpwsDJex2JomXCL3xPft?node-id=<ApprovalCard>', {
  props: {},
  example: () => <ApprovalCard request={exampleRequest} state="pending" onApprove={() => {}} onDecline={() => {}} />,
})
```

Code Connect needs the library published on a paid plan, so it isn't connected in this file; the names already match (Figma component = React component, variant properties = props, variables = CSS custom properties with the same names via `design/tokens/tokens.json`).
