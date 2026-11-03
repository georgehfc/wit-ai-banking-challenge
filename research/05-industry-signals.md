# WIT challenge · 05 What the leading product teams are doing (Nov 2026)

Short scan, 2 Nov 2026. Six signals that matter for this challenge, each with what we take. Sources at the end of each item.

## 1. DESIGN.md: a design system file written for AI agents
Google Labs open-sourced **DESIGN.md**, a format first used inside Google Stitch: YAML front matter with tokens (colors, typography, spacing, rounded, components, with `{colors.primary}`-style references) plus Markdown prose saying *why* and *how*. A CLI (`@google/design.md`) lints structure and WCAG contrast and exports to DTCG and Tailwind. Still alpha; the community "Awesome DESIGN.md" repo passed 71k stars by May 2026. Framing that stuck: AGENTS.md says how to work on the project, DESIGN.md says what the UI should look like.
**We take:** our `design/DESIGN.md` follows this shape, so Claude Code (and anyone) builds from the same rules George designs with. Token values stay in DTCG (`design/tokens/`), referenced from DESIGN.md.
Sources: [vibecoding.app review, May 2026](https://vibecoding.app/blog/design-md-review), [DEV: AGENTS.md / SKILL.md / DESIGN.md](https://dev.to/aws-builders/agentsmd-skillmd-designmd-how-ai-instructions-split-into-three-layers-d0g)

## 2. Design tokens have a stable standard
The W3C Design Tokens Community Group shipped the **first stable spec (2025.10)** on 28 Oct 2025: vendor-neutral JSON, aliases, themes (light/dark, accessibility, brand) without duplicate files, OKLCH/Display P3. Reference implementations: Style Dictionary, Tokens Studio, Terrazzo; Figma, Penpot, Sketch, Framer and others implementing.
**We take:** `design/tokens/tokens.json` in DTCG format, two tiers (primitives → semantic) with light/dark. Same names as Figma variables. Claude Code can push them into Figma through the Figma MCP, and a handoff component can read them.
Sources: [W3C announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/), [designtokens.org TR 2025.10](https://www.designtokens.org/tr/2025.10/)

## 3. Generative UI: the agent asks for components, it doesn't draw them
- **MCP Apps** (first official MCP extension, 26 Jan 2026): tools return interactive UI that renders inside the chat (Claude, ChatGPT, VS Code). Sandboxed iframes, auditable messages, and hosts "can require explicit approval for UI-initiated tool calls".
- **A2UI v0.9** (Google, 17 Apr 2026): the agent declares UI *intent*; the client renders it with **its own component catalog** and design system. Runs over MCP, AG-UI, A2A, websockets.
**We take (big one for the interview):** our in-chat widgets are a **closed catalog** of design-system components (plan card, projection, approval request…). The model fills them with planner data; it never generates layout or styling. That's what keeps the brand, accessibility and trust intact, and it maps 1:1 to Figma components and code.
Sources: [MCP Apps announcement](https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/), [A2UI v0.9](https://developers.googleblog.com/a2ui-v0-9-generative-ui/), [CopilotKit guide to GenUI 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026)

## 4. Design ↔ code is a loop now, not a handoff
Figma's own Gui Seiz (design) and Alex Kern (engineering) on *How I AI* (11 Mar 2026): pull the running app into Figma via the Figma MCP, design there, push changes back with Claude Code; export every state of a flow into Figma so designers work from what's real. AI moves effort upstream (planning) and downstream (craft). Many studio write-ups describe building token-driven design systems with Claude Code + Figma MCP.
**We take:** our workflow is exactly this, and it's what we show for "AI-assisted workflow" and "design-to-code readiness": tokens and specs in the repo → Figma variables via MCP → George designs → one component built in code and mapped back (Code Connect or handoff spec).
Sources: [Lenny's Newsletter / How I AI, 11 Mar 2026](https://www.lennysnewsletter.com/p/from-figma-to-claude-code-and-back), [925 Studios, Mar 2026](https://www.925studios.co/blog/2026-03-23-how-to-build-a-complete-design-system-using-claude-code-and-figma-mcp)

## 5. Agentic payments: approval as a signed mandate
Google's **Agent Payments Protocol (AP2)**, backed by 60+ organisations (Mastercard, PayPal, Adyen…): an **Intent Mandate** is signed up front with rules (limits, timing) for when the person isn't present; a **Cart Mandate** is the signed, unchangeable record of exactly what the person approved when present; payment networks are told an agent was involved. Non-repudiable audit trail.
**We take:** our approval request is a human-present "cart mandate": exact amount, accounts, schedule, signed with Face ID, stored as a receipt. The future monitor ("when my Christmas allowance lands, move €600") is an intent mandate with a limit and an expiry, shown and revocable. Good language for the walkthrough.
Sources: [Vellum on AP2, Jan 2026](https://website.vellum.ai/blog/googles-ap2-a-new-protocol-for-ai-agent-payments), [Everest Group](https://www.everestgrp.com/googles-agent-payments-protocol-ap2-a-new-chapter-in-agentic-commerce-blog/)

## 6. Agent UX patterns are converging
Across playbooks and shipped products (Notion AI, Revolut AIR, Erica): preview before acting, a visible step receipt, explicit approval for anything consequential, undo/pause windows, an always-available human off-ramp, AI labelling. (Secondary sources; the shipped products in 02 §2 and the Mobbin board are the primary evidence.)
**We take:** already in our plan: steps receipt, approval request, pause card, handoff card.
Sources: [Lazarev, AI UX patterns 2026](https://www.lazarev.agency/articles/ai-ux-patterns), [Towards AI, agent UX patterns](https://pub.towardsai.net/designing-for-ai-agents-8-ux-patterns-that-build-trust-in-2026-713a0c926933)

## One-line pitch this enables
"The assistant talks; a deterministic planner does the maths; it can only show components from our design system; and nothing moves without a signed approval Inês can pause."
