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

## 4 Nov 2026
- **Re-reading the brief changed the emphasis.** "Decide how conversational AI, visual interfaces and familiar app interactions work together" pointed at the conversation, not at more journeys. Three short conversations in one assistant show that better than five separate flows.
- **Long chats need folding.** Once widgets stack up, the page gets long fast. Folding finished widgets into one-line summaries (and anchoring the scroll on the newest message) kept every step on one screen.
- **Suggested replies should be the same as typing.** Routing chips and typed text through one function means "Make it €250" works whether you tap or type, which is the brief's "move smoothly between conversation and graphical controls".
- **Component galleries are inspiration, not drop-ins.** Two pasted components (prompt box, gradient orb) each assumed a stack we don't use and carried hidden costs (hard-coded colours, global CSS that hurts focus rings, a 600 KB 3D library). Porting the idea onto our tokens took less time than adapting the project to them.
- **StrictMode and WebGL:** don't lose the context in effect cleanup; React mounts twice in development and the second mount gets a dead context.
- **Shaders made for big cards look stripy at icon size.** The same gradient that melts across 800 px turns into hard bands across 32 px. Uneven gradient stops plus a small blur inside a clipped circle brought back the soft look without changing the shader's character.
- **Diagrams from the code find gaps.** Writing Mermaid state diagrams straight from the implementation showed states with no exit (a dead-end chip) and a path to a duplicate plan once threads existed. Cheap to write, worth doing before polishing.


- **Translating a scripted chat (4 Nov):** routing regexes and suggestion chips must change together with the copy, or tapping a PT chip falls through to "I can't help with that". Keep EN patterns as a fallback, and make number checks compare digits, not formatted strings (pt-PT "2360 €" vs "€2,360").

- **Figma prototype links stay on one page.** Journeys split across pages can't link to each other or to a shared picker. Keep every journey that should feel like one app on one page; use separate pages for states and references. (6 Nov)
