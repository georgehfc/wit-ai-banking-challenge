# Web mobile prototype

A phone-frame web mock of the journey, for testing flows and the design-to-code handoff. Figma stays the main deliverable; screens here follow the Figma frames.

```bash
cd prototype
npm install
npm run dev        # regenerates src/styles/tokens.css from ../design/tokens/tokens.json, then starts Vite
```

- **Numbers:** read only from `../data/plan-output.json` through `src/data.ts`. To change a number, change the data or run the planner (`python3 ../data/planner.py --monthly 250`), never the component.
- **Tokens:** `scripts/tokens-to-css.mjs` turns the DTCG tokens into CSS variables (`--p-*` primitives, semantic names for light/dark). Same names as the Figma variables.
- **Screens:** `src/screens/index.tsx` holds stubs for 01–07 from `plan/04`, wired to planner numbers. Replace each stub with the real screen once its Figma frame is done.
