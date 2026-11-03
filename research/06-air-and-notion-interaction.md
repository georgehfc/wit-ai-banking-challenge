# 06 · AIR and Notion AI: how the assistant sleeps, wakes and hands back

Source: George's screen recordings, 3 Nov 2026 (`research/AIR basic interaction.mp4`, 2:52; `research/Notion basic interaction.mp4`, 3:44). Frames pulled every 3–4 s and read by Claude. Same prompt in both: "I want to save 3000 for a holiday next summer. How much can I afford a month?"

## Revolut AIR (mobile)
- **Entry:** from Home (search bar area) into a full-screen dark takeover with a close (×). Empty state: "How can I help you today?" + 3 suggested questions + input with mic.
- **First message is a legal wall:** "Hi George, I'm AIR, your AI Financial Assistant…" plus a paragraph of entity disclosures. Honest, but it is the first thing you read.
- **Working state:** one rotating status line under the last message ("Checking my work…", "Analyzing cash flow…", "Checking savings balances…", "Putting it together…", "Fixing an issue…"). No list of steps, no way to expand.
- **Answers are long text.** The €3,000 question got €375/month (July) and €333 (August), then a month-by-month surplus summary, and it ended by offering a spending breakdown. It never answered "how much can I afford"; it said it "depends".
- **Widgets exist but come late:** a spending-by-category card (total + stacked bar + list) only after a "yes".
- **Hand-offs are text links** at the end ("↳ Set up a monthly budget", "↳ Create a dedicated savings pocket for holiday"). Nothing actionable inline; no approval step was shown.
- **Exit:** × back to wherever you were. No trace of the conversation on Home.

## Notion AI (mobile + desktop)
- **Dormant but always there:** a bottom bar on Home: search · **"Ask AI" pill** · compose. On desktop a floating avatar button (bottom right) and a side panel next to the page.
- **Entry:** the pill opens a sheet with the keyboard already up. Top: history (left), the Notion AI avatar + name, new chat (right). Input has "+", a privacy/shield icon and "Auto" (model).
- **Working state:** "Thinking ›" that expands into a step list ("Exploring Notion analytics", "Read analysis and charting guidance", "Considering permission issues"…), then collapses into **"Worked for 1m 10s ›"**. Background work is legible and optional to read.
- **Answer + artifact:** short answer, then a generated file chip it opens in the browser.
- **Hand-back:** swipe back to Home and the chat is now an item in **Recents with an unread dot** ("Monthly budget for $3000 summer"). The work becomes an object in the app; the assistant goes back to sleep.
- **Context on desktop:** the panel offers actions on the current page ("Summarize this page", "Translate this page").

## What we take
1. **A dormant state that lives in the app chrome** (Notion's pill), not only a takeover. States: idle · nudge · working · ready.
2. **Steps receipt that collapses** ("Worked for 12 s ›"), named by role (read, planner, rules). Better than AIR's rotating line.
3. **Answer first, widget first.** AIR's wall of text is the thing to beat: the plan card answers "how much can I afford" in one number.
4. **Hand back to the object, not to the chat.** After approval, land on the Holiday goal on Home; the chat is kept and reopens at the same point.
5. **Disclosure without the wall:** keep the "AI · can make mistakes" label always visible and put the legal text behind "Learn more".

## What we avoid
- Legal paragraph as the first message (AIR).
- Answers that say "it depends" without using the data the bank already has (AIR).
- Suggestions as plain text links that lead nowhere actionable (AIR).
- Raw model reasoning shown by default (Notion's expanded thinking text); our steps are named roles, not monologue.
