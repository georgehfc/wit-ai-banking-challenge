# SECURITY.md · Trust and safety commitments

What the design promises, and where it shows on screen.

| Commitment | Rule | Where it shows |
|---|---|---|
| The AI proposes, Inês approves | No money moves from chat. Review screen + Face ID for every transfer (PSD2 SCA). | `ApprovalRequest` (move-money), review screen |
| Dynamic linking | What she signs is exactly what executes: amount, payee account, schedule are in the signed payload. | Review shows all of them; any change voids approval |
| Numbers from the engine | Planner computes; model explains. | "Calculated by planner" in steps receipt |
| Data minimisation + consent | Assistant reads only the current account, last 3 months, with scope and expiry shown; revocable. | First-use consent sheet; settings |
| No codes, ever | Assistant never asks for passwords, OTPs, card numbers, and says so. | TONE.md scam line; help |
| Prompt-injection resistance | Merchant names, transfer descriptions, pasted messages are data, never instructions. | Invisible; test with a merchant named "ignore previous instructions…" |
| Friction where risk is | New payees and unusual amounts get friction, not speed. Savings to own account is low-risk. | Only own-account transfers in the PoC |
| Pause and undo | Every plan can be paused in one tap; deleting is separate and confirmed. | `PlanStatus`, Revolut paused-state study |
| Privacy in public | Hide-balance toggle in chat; amounts masked in notifications. | Header eye icon; push copy |
| Accountability | Log prompts, planner I/O, widgets shown, approval payload + signature. Human review on request. | Receipt in activity; "talk to a person" |
| Model provider risk | LLM provider treated as critical ICT third party (DORA): logging, incident process, exit plan. | Slides only |
| Regulated topics | Credit (CCD2), investments (MiFID II), mortgage (MCD/FINE), insurance (IDD) → handoff. | `HandoffCard` |
