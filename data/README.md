# Data · Inês's mock bank data and the plan engine

The single source of truth for every number on screen. Change the data or the planner, re-run, and copy numbers from `plan-output.json`. Never type numbers into screens by hand.

| File | What |
|---|---|
| `generate_ines.py` | Builds `ines.json` (fixed seed). Margins pinned to €150 / €280 / €230 (Aug–Oct 2026) |
| `ines.json` | Customer, consent, current account, 77 transactions, products with lanes, expected income (Christmas, holiday allowance, IRS), the intent |
| `planner.py` | Deterministic plan engine (the "calculator" role). No LLM |
| `plan-output.json` | Monthly picture, buffer check, plan, projection, interest, gap options, side widgets |

```bash
python3 data/generate_ines.py      # rebuild data
python3 data/planner.py            # default plan
python3 data/planner.py --monthly 250 --christmas 400   # what the "adjust" step does
```

## Key numbers (default run)

- Net salary ~€1,130 × 14 (estimate). Rent share €575 (room in a shared T2). Meal card covers most groceries outside the account.
- Fixed costs €732/month. Margin €150 (Aug, Algarve weekend) · €280 (Sep) · €230 (Oct). Average €220.
- Balance €900 ≥ one month of fixed costs → buffer OK, the plan doesn't touch it.
- Full goal needs €375/month → **stretch**. Plan: **€220/month × 8 (1 Dec–1 Jul) + €600 of the Christmas allowance = €2,360 by July; gap €640.**
- Gap options: count IRS if it comes (avg ~€980, not guaranteed) · move to September (€2,800, €200 short) · make it a €2,300 trip.
- Daily interest at 2.5% (illustrative): ~€17 net by mid-July.
- Side widgets: 2 subscriptions added in August (Disney+, Strava) = €17.98/month · round-ups ≈ €6.85/month.

## Honesty rules for the data

- The bank sees transactions, not usage: say "added in August", never "you don't use it".
- IRS refund is never in the base plan. Holiday allowance is trip money, not savings.
- Rates are illustrative and labelled so on screen.
