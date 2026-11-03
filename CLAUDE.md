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

- Claude builds first drafts in Figma through the Figma MCP (Foundations, Components, Screens, Prototype storyboard), one page at a time, pausing for George's review after each. George reviews, changes and owns every decision, and must be able to rework anything live in the 45-minute round. Every AI-generated piece is logged in `ai-log/log.md` with what George changed (changed 3 Nov 2026, at George's request).
- Log every AI contribution in `ai-log/` the same day, honestly, including what was wrong or discarded.
- Facts and numbers need a source (Eurostat, INE, Banco de Portugal, EU law). Mark anything unverified.
- Keep the scope to one core journey, polished. Breadth shows up as hand-offs ("this is a mortgage question…"), not extra flows.
- Track hours honestly. The form asks for total hours used.
- Writing for George (slides, rationale): plain, his voice, no AI-ish polish. The rules in `~/Desktop/Job Applications/cover-letter-voice.md` apply.

## Working in code (added 2 Nov)

- `data/`: Inês's mock data and the plan engine. **Every number on a screen comes from `python3 data/planner.py` → `data/plan-output.json`.** Don't type numbers by hand; re-run the planner after any data change.
- `design/`: `DESIGN.md` (Google DESIGN.md format, values placeholder until George sets them), `tokens/tokens.json` (DTCG 2025.10, names = Figma variables), `TONE.md`, `ASSISTANT.md`, `ACCESSIBILITY.md`, `SECURITY.md`. Read the relevant one before writing copy, specs or components.
- `plan/04-journeys-and-design-plan.md`: journeys, screen contents, who does what, and a backlog of ready-to-paste prompts.
- Figma file: `OoHpwsDJex2JomXCL3xPft` (see `deliverables/links.md`). Use the Figma MCP for file work; Figma is the fundamental piece of the workflow. Pages: 0 Cover · 1 Research & references · 2 Foundations · 3 Components · 4 Screens · 5 Prototype · 6 Summary slides · 7 Handoff.
- Image uploads to Figma: the container and the Mac shell can't reach Figma's upload endpoint; go through Claude in Chrome (fetch image → POST to the `upload_assets` submit URL). See `ai-log/learnings.md`.
- Log every AI contribution in `ai-log/log.md` the same day, including corrections; add process lessons to `ai-log/learnings.md`.

## Three flows (decided 3 Nov 2026)

- **J1 Save for the holiday** (core, the clickable Figma prototype): intent → understanding → recommendation → adjust (state change) → gap → review → Face ID → confirmation.
- **J2 Christmas allowance lands**: proactive message, approve moving €600 to the goal.
- **J3 Off-track month**: short margin, suggest skipping or lowering one transfer, with undo.
- J4 (borrowing handoff) and J5 (consent) stay single frames. All three flows get a storyboard on page 5; J1 is wired.
- Code: `prototype/` (Vite + React + TS, private repo github.com/georgehfc/wit-ai-banking-challenge). Local dev server only while building; share as a static build. Port the planner maths to TypeScript for live recalculation; assistant replies are scripted, no live LLM.
