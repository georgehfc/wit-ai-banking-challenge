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

## 3 Nov 2026
- **Tokens first, Figma second.** Wrote the drafted values into tokens.json, then pushed that file into Figma, so code, DESIGN.md and Figma never disagree. Contrast was checked in a script before anything was drawn.
- **Plugin API gap:** text styles can't take OpenType features (tnum) through the API. Small, but amounts are the whole point of the `amount` style, so it's a manual step to remember.
- **The token file's "muted" in dark (neutral 200) was almost the same as default text.** Drafting real values surfaced it; moved to neutral 400 (6.9:1).
- **The numbers rule caught a hand-typed figure.** J3's "+€44 a month" came from mental maths in the plan; putting the scenario through the planner gave +€37 over six transfers. Small, but it's exactly the kind of number the assistant must never invent.
- **Ask for the layout of the file, not only the content.** Building "key screens only" left a page that read as unfinished: empty J1 artboards and no journey labels. George reads the canvas as rows per journey; sections per journey fixed it.
- **The planner keeps catching the script.** Two more hand-written claims were wrong (€250 "works in 2 of 3 months"; J3 not following the September choice). Any number in copy goes through `planner.py` first.
- **Figma quirk:** a variable-bound fill can keep a stale fallback colour and render it (one frame showed black). Re-binding with a fresh paint fixes it; check screenshots, not just bindings.
- **Recording real products beats screenshots.** George's 3-minute recordings showed what screenshots hide: AIR's rotating status line, its legal-wall first message, and Notion turning the chat into a Recents item after you leave. That last one answered "where does the user land?"
- **No ffmpeg? AVFoundation in a 40-line Swift script** made timestamped contact sheets; 8 images covered 6½ minutes of video.
- **Don't invent a balance to fill a wireframe.** Later-dated Home screens mask the balance (the hide-balance pattern from SECURITY.md) instead of typing a number the planner never produced.

