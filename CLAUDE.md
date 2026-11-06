# CLAUDE.md — WIT AI Assisted Design Challenge

## Project brief

**What.** George's take-home challenge for the AI-Assisted UI/UX Designer role at WIT Software: an AI-native mobile banking experience that turns a user's intent ("save €3,000 for a holiday next summer…") into a clear, trustworthy, approvable journey. Full brief: `brief.md`.

**Deadline.** Submit by **9 Nov 2026** through the Zoho form linked in WIT's email of 2 Nov (fields: challenge link, total hours used, optional extra link). George told WIT he'd submit by the end of that week.

**Deliverables.** Figma file with 4–6 polished mobile screens built from a small design system (Auto Layout, components and variants, variables); a clickable prototype of one core journey with at least one state change; 1–2 summary slides (journey, rationale, AI tools, links); optional component-to-code handoff. Recommended effort 4–6 hours. If shortlisted: a 45-minute walkthrough with a small live iteration.

**Scoring.** UX and product thinking 25% · AI-assisted design and critical judgement 25% · visual design 20% · Figma and design system 15% · prototype and handoff 15%.

## Layout

- `brief.md`: the challenge text as WIT published it. Never edit.
- `research/`: numbered research notes (`01-research-kickoff.md` first). Items marked **[to verify]** still need a source.
- `ai-log/`: the running log of AI use (tool, what it generated, what George changed, how he judged it). It's 25% of the score, so update it as work happens, not at the end.
- `deliverables/`: slides, handoff spec, exported frames, links.
- Application context (company frame, fit, status) lives in `~/Desktop/Job Applications/applications/2026-11-02-wit-software-ai-assisted-ui-ux-designer/`. Update its status log and `tracker.md` when the challenge is submitted.

## Working rules

- Claude builds first drafts in Figma through the Figma MCP, George reviews, changes and owns every decision, and must be able to rework anything live in the 45-minute round. Every AI-generated piece is logged in `ai-log/log.md` with what George changed (changed 3 Nov 2026, at George's request).
- **Order of work (decided 3 Nov):** scope frozen to J1. George settles the experience hands-on in the code prototype first; then Claude builds the J1 components (list in `plan/04` §3, taken from the code) and the ~6 HERO screens in Figma. Figma screens are wireframes until then. **Figma prototype wired 5 Nov** (George's go): hotspots + iOS transitions. **6 Nov:** all five journeys are on page 4 in the build's order (J0 → J4, then supporting chats and entries); the Ajustes drawer frame is the journey picker (flow "0 · Escolher jornada", T on any screen); page 5 keeps only the AI button states. Summary slides filled 5 Nov (page 6; hours placeholder for George). Handoff spec: ApprovalCard (page 7, deliverables/handoff-spec.md). Call prep: deliverables/call-prep.md. J0 (first use, ex-J5) and J2–J4 are back in the code prototype (5 Nov) as secondary journeys selectable from the tweaks; Figma page 4 has them too.
- Log every AI contribution in `ai-log/` the same day, honestly, including what was wrong or discarded.
- Facts and numbers need a source (Eurostat, INE, Banco de Portugal, EU law). Mark anything unverified.
- Keep the scope to one core journey, polished. Breadth shows up as hand-offs ("this is a mortgage question…"), not extra flows.
- Track hours honestly. The form asks for total hours used.
- Writing for George (slides, rationale): plain, his voice, no AI-ish polish. The rules in `~/Desktop/Job Applications/cover-letter-voice.md` apply.

## Working in code (added 2 Nov)

- `data/`: Inês's mock data and the plan engine. **Every number on a screen comes from `python3 data/planner.py` → `data/plan-output.json`.** Don't type numbers by hand; re-run the planner after any data change.
- `design/`: `DESIGN.md` (Google DESIGN.md format, values placeholder until George sets them), `tokens/tokens.json` (DTCG 2025.10, names = Figma variables), `TONE.md`, `ASSISTANT.md`, `ACCESSIBILITY.md`, `SECURITY.md`, `STATES.md` (Mermaid state diagrams; update in the same commit as any flow change). Read the relevant one before writing copy, specs or components.
- `plan/04-journeys-and-design-plan.md`: journeys, screen contents, who does what, and a backlog of ready-to-paste prompts.
- Figma file: `OoHpwsDJex2JomXCL3xPft` (see `deliverables/links.md`). Use the Figma MCP for file work; Figma is the fundamental piece of the workflow. Pages: 0 Cover · 1 Research & references · 2 Foundations · 3 Components · 4 Screens · 5 Prototype · 6 Summary slides · 7 Handoff.
- Image uploads to Figma: the container and the Mac shell can't reach Figma's upload endpoint; go through Claude in Chrome (fetch image → POST to the `upload_assets` submit URL). See `ai-log/learnings.md`.
- Log every AI contribution in `ai-log/log.md` the same day, including corrections; add process lessons to `ai-log/learnings.md`.

## One assistant, three conversations (decided 4 Nov 2026)

- George re-read the brief and moved the emphasis to the conversation itself. The prototype is one assistant chat with three things it can help with, entered from its own shortcuts: **Save for something** (J1, the core journey: intent → understanding → recommendation → adjust (state change) → gap → review → Face ID → confirmation → back on Home), **Where did my money go?** (spending breakdown) and **Check a message I got** (scam check, freeze card).
- (Superseded 5–6 Nov) J0 and J2–J4 were dropped here, then came back as secondary journeys in the build and on Figma page 4.
- Interaction should feel real: typing indicator, streamed replies, widgets after text, suggested replies above the input, older widgets fold into one-line summaries, scroll anchors on the newest message. Microanimations on; Reduce Motion follows the phone setting.
- Threads: start screen (shortcuts adapt to the plan, recent chats), chats panel (new, open, rename, delete, clear all); one plan per person, owned by one chat. Bank pages Home · Payments · Savings · Cards: full Ask AI pill on Home, only the sphere elsewhere.
- Prototype tweaks (hidden drawer): app open (default) or closed (lock-screen notification opens the spending summary), Ask AI mode, colour mode, reset (Esc too).
- UI copy: TONE.md, plain, no AI-sounding phrases ("Got it", "Let's", "Here's", em dashes, exclamation marks).
- **Language (decided 4 Nov):** the whole prototype is in Portuguese (Portugal), informal "tu", assistant named "IA", pt-PT formats (2360 €, 220,00 €, 1 dez). See TONE.md.
- **Search + AI merged (4 Nov, D1 in `design/DECISIONS.md`):** search button bottom-left beside the Ask AI pill (Notion pattern; revised after user feedback), search screen with instant non-AI results plus a "Perguntar à IA" row; the pill mic opens the assistant listening. Must be in the summary slides. Log product decisions in DECISIONS.md.
- **Stroke rule (4 Nov, D2):** gradient stroke = something to act on; rotating gradient = AI working (`.ai-ring`, `.ai-busy`; Figma `brand/viz-highlight`, `brand/ai-working`). Status badges neutral with coloured icons.
- **iOS structure (5 Nov):** bank pages have a pinned app bar (avatar + compact title on scroll) over large titles, a translucent tab bar, content scrolling under both; the assistant is an iOS page sheet over the scaled-back app; review screens push in from the right. Motion curve `--ios` cubic-bezier(.32,.72,0,1). Figma mirrors it (AppBar, Grabber, page-sheet screens).
- **Prototype tweaks** are a hidden drawer (pull left from the right edge, handle, or T). Not part of the product. Since 5 Nov it also picks the **journey**: J0 first use (intro + consent; **the default on landing**, leads into J1), J1 (core), J2 Christmas allowance, J3 short month (the AI spots a 180 € Worten payment made upfront), J4 credit hand-off (also reachable from J1's gap: “Posso pedir emprestado?”). J2/J3 start from a preset account state.
- **Neutrals (5 Nov, D3):** light, slightly cool greys (canvas #F4F5F7), not beige. Brand colours only for the AI.
- **Data-viz colour (4 Nov):** charts stay neutral; one element per chart gets the sphere palette (`--grad-v` / `--grad-h`, Figma style `brand/viz-highlight`).
- Code: `prototype/` (Vite + React + TS, private repo github.com/georgehfc/wit-ai-banking-challenge). `src/assistant.tsx` (app level: threads, account state, Ask AI modes), `src/conversation.tsx` (one thread: engine and the three conversations), `src/chat.tsx` (chat primitives and new widgets), `src/shell.tsx`, `src/components.tsx`, `src/planner.ts` (checked with `npm run check:planner`). Replies are scripted, no live LLM; free text goes through `src/nlu.ts` (intents + entities, clarifying questions; eval `npm run check:nlu`). Agent spec: `design/AGENT.md`. This is for George's local learning; the handoff is the Figma prototype. The assistant is named "IA" (PT).
