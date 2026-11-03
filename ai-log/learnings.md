# Learnings (process, tools, judgement)

Running notes on what worked, what didn't and what changed because of it. Feeds the "AI tools" slide and the walkthrough.

## 2 Nov 2026
- **Verification paid off immediately.** Five claims in the kickoff notes were wrong or stale (average wage, survey date, IRS window, AI Act delay, CCD2 transposition). Rule kept: nothing on a slide without a source.
- **Making data real exposed a persona flaw.** With €650 rent and normal spending, Inês couldn't have the margin the persona promised. Fixed with a €575 room share and the meal card (very Portuguese, and it explains low grocery spend). Building the dataset was a design-research step, not just prep.
- **The planner beat hand maths.** Hand estimates of interest (€19) and round-ups (€14) were off; code says ~€17 and ~€7. Round-ups dropped from "widget" to "side note" because of it.
- **Honesty in copy can be wrong by accident.** "You haven't used these subscriptions" sounded helpful but a bank can't know usage. Changed to "added in August".
- **Figma MCP is the backbone**, but image upload needs a network path: the cloud workspace and the Mac shell are blocked from Figma's upload endpoint and Mobbin's image CDN. Working route: Claude in Chrome fetches the Mobbin image and POSTs it to the Figma MCP upload URL. Inlining images as base64 through the model was rejected (hundreds of KB through the context).
- **Mobbin has no Revolut AIR screens yet.** Used Revolut's goal/schedule/paused flows for patterns and the AIR blog + UX reviews for the assistant.
- **Copying a competitor's UI is the wrong move** even as "reference screens": we keep real screenshots on the board and build unbranded structure studies of the patterns instead.
- **Vocabulary matters for trust.** "Five agents" sounds like five things acting on your money; "one assistant, one calculator, two safety layers and a handoff" is the same architecture, easier to defend.
- **Industry language that helps:** closed widget catalog (A2UI), approval as a signed mandate (AP2), DESIGN.md + DTCG tokens so agents and designers share one source.
