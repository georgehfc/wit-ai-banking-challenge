# DECISIONS.md · Product decisions

Decisions that change the product's shape, with the reasoning, so they can be defended in the walkthrough. Newest first. Each one says who decided, what was considered and how it shows in the prototype.

---

## D2 · Gradient stroke = where the AI acts (4 Nov 2026)

**Decision (George).** On the assistant's components, a gradient stroke marks something for you to act on, and a rotating gradient stroke marks the AI working. Plain border = idle input.

- **AssistantPill / SphereFab:** rest, alert and ready = static gradient; processing = rotating.
- **PromptBox:** empty = plain border; text or screenshot ready to send = static; replying or listening = rotating.
- **GapOption:** the chosen option = static gradient (the AI will act on it after review).
- Status badges went neutral (raised pill, dark text, coloured icon) so colour is saved for this signal and the one highlight per chart.

**Why.** One visual cue tells people where the AI is acting or about to act, without new labels. Rotation is the simplest "working" signal and stops under Reduce Motion.

**In code:** `.ai-ring` / `.ai-ring.ai-busy` in `prototype/src/index.css` (conic gradient, 2.4 s turn). **In Figma:** stroke styles `brand/viz-highlight` (act on) and `brand/ai-working` (angular, = rotating in code).

---

## D1 · One field for search and the AI (4 Nov 2026)

**Decision (George).** Home keeps one input, **"Pesquisar ou perguntar"**. As you type, exact results appear instantly (payments, places in the app) with no AI involved. One row, **"Perguntar à IA"**, opens the assistant with the query already sent. It comes first when the query reads as a question ("quanto…", "posso…", "?"), last when it looks like a lookup ("EDP").

**The question.** Home had a search bar *and* an Ask AI pill: two inputs that compete ("which one do I use?"). Should the search bar go, with every query going to the AI?

**For sunsetting search (AI only)**
- One clear entry point; the AI becomes the obvious place to ask anything.
- Matches the brief's idea: one assistant that turns intent into action. A separate search bar quietly says the AI can't handle simple things.
- The AI does more than search: "how much did I pay EDP in October?" is a lookup, an answer and a total in one.
- Calmer Home.

**Against (keep search)**
- **Speed and certainty.** Finding a payment or a contact is a lookup with one right answer. Search is instant and exact; a chat adds typing, streaming and a small chance of being wrong. Slower and riskier for "find Tuesday's payment".
- **Trust and choice.** Some people don't want AI in plain navigation. A bank should keep a way in that doesn't go through the AI (and regulators tend to expect one).
- **Habit.** Search at the top is what banking users expect.
- **Resilience and cost.** Search works when the model is slow or down, and costs nothing per query.

**Why merge.** It keeps search's speed, certainty and the no-AI path, and still leaves one input. The AI isn't a separate destination; it's what search grows into when a lookup isn't enough. Same pattern as Notion's and Raycast's command bars.

**In the prototype** (`prototype/src/search.tsx`)
- Home header field "Pesquisar ou perguntar" with the sphere at its end.
- Empty state: lookups to try (Continente, EDP, MB WAY, Congelar cartão) and three AI questions.
- Results: "Na app" (pages and actions), "Movimentos · ago–out" (count and total), "Perguntar à IA" row.
- Footer: "Os resultados aparecem logo e não usam IA. Só 'Perguntar à IA' abre uma conversa."
- Enter sends the query to the AI.

**What stays.** The Ask AI pill on Home: it carries the assistant's states (alert, processing, ready) that a text field can't show. Open question for later: once the field exists, does Home still need the full pill, or only the sphere like the other pages?

**Risks / to test.** Whether people notice the AI row when results exist; whether the question-vs-lookup guess feels right (wrong guess only changes the order, never hides an option).

---

## Earlier decisions (pointers)

- Scope frozen to J1 plus two supporting conversations in one assistant (3–4 Nov) · `CLAUDE.md`
- Assistant named "IA", whole app in Portuguese (Portugal), informal "tu" (4 Nov) · `TONE.md`
- Visual direction: creamy neutrals, grainy gradient sphere, gradient only on one highlighted element per chart and on callouts (4 Nov) · `DESIGN.md`, `CLAUDE.md`
- Face ID failure only in Figma; no reminder for "Agora não"; other proactive alerts as wireframes; Pause stays (4 Nov) · `STATES.md`
- One plan per person, owned by one chat (4 Nov) · `STATES.md`
