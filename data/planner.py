"""Plan engine (deterministic, no LLM). Reads data/ines.json, writes data/plan-output.json.
This is the 'calculator' role: every number the assistant says comes from here.
Run: python3 data/planner.py  [--monthly 220] [--christmas 600] [--rate 0.025]"""
import json, math, argparse
from collections import defaultdict
from datetime import date

FIXED = {"rent", "utilities", "phone", "transport", "subscription"}
p = argparse.ArgumentParser()
p.add_argument("--monthly", type=float, default=None, help="override monthly amount")
p.add_argument("--christmas", type=float, default=600.0, help="share of Christmas allowance sent to the goal")
p.add_argument("--rate", type=float, default=None, help="savings TANB, illustrative")
a = p.parse_args()

d = json.load(open("data/ines.json"))
tx = d["transactions"]; goal = d["intent"]["goal"]
sav = next(x for x in d["products_available"] if x["id"] == "prod_savings")
rate = a.rate if a.rate is not None else sav["rate_tanb_illustrative"]; tax = sav["tax_on_interest"]

# 1. Monthly picture
months = defaultdict(lambda: {"income": 0.0, "fixed": 0.0, "variable": 0.0})
for t in tx:
    m = t["date"][:7]; v = t["amount"]
    if v > 0: months[m]["income"] += v
    elif t["category"] in FIXED: months[m]["fixed"] += -v
    else: months[m]["variable"] += -v
picture = []
for m in sorted(months):
    x = months[m]; margin = x["income"] - x["fixed"] - x["variable"]
    picture.append({"month": m, **{k: round(v, 2) for k, v in x.items()}, "margin": round(margin, 2)})
margins = [r["margin"] for r in picture]
fixed_avg = round(sum(r["fixed"] for r in picture) / len(picture), 2)

# 2. Buffer check (rule: keep at least one month of fixed costs untouched)
balance = d["accounts"][0]["balance"]
buffer = {"balance": balance, "target": fixed_avg, "ok": balance >= fixed_avg,
          "say": f"Keep your €{balance:,.0f} as a safety buffer; the plan doesn't touch it." if balance >= fixed_avg
                 else "Build a buffer first."}

# 3. Monthly amount: mean margin, floored to €10, never above the best month
transfers = [date(2026, 12, 1)] + [date(2027, m, 1) for m in range(1, 8)]   # 1 Dec .. 1 Jul = 8
monthly = a.monthly if a.monthly is not None else math.floor(sum(margins) / len(margins) / 10) * 10
needed = round(goal / len(transfers), 2)
fit = "fits" if monthly <= min(margins) else ("stretch_some_months" if monthly <= max(margins) else "too_high")
short_months = [r["month"] for r in picture if r["margin"] < monthly]

# 4. Projection (Christmas share on 15 Dec)
events = [(t, monthly, "monthly") for t in transfers] + [(date(2026, 12, 15), a.christmas, "christmas_allowance")]
events.sort()
proj, bal = [], 0.0
for when, amt, kind in events:
    bal += amt; proj.append({"date": when.isoformat(), "add": amt, "kind": kind, "saved": round(bal, 2)})
total = round(bal, 2); gap = round(goal - total, 2)

# 5. Interest (daily, simple, from each deposit to 15 Jul 2027)
end = date(2027, 7, 15)
gross = sum(amt * rate * (end - when).days / 365 for when, amt, _ in events)
interest = {"rate_tanb": rate, "gross": round(gross, 2), "net": round(gross * (1 - tax), 2), "note": "illustrative rate; 28% withholding"}

# 6. Gap options (the decision; the assistant never picks one)
irs_avg = next(e for e in d["expected_income"] if e["type"] == "irs_refund")["national_average_2026"]
sep_total = total + 2 * monthly
options = [
    {"id": "irs", "label": "Count my IRS refund if it arrives", "result": f"Covers the €{gap:,.0f} gap if the refund is at least that (national average ~€{irs_avg}). Not guaranteed.", "certain": False},
    {"id": "september", "label": "Move the trip to September", "result": f"Two more transfers: €{sep_total:,.0f} saved, €{goal - sep_total:,.0f} short.", "saved": sep_total, "certain": True},
    {"id": "trim", "label": f"Make it a €{math.floor(total / 100) * 100:,.0f} trip", "result": "Reached on the current plan.", "saved": total, "certain": True},
]

# 7. Side widgets
first_seen = {}
for t in tx:
    if t["category"] == "subscription": first_seen.setdefault(t["merchant"], (t["date"], -t["amount"]))
new_subs = [{"merchant": k, "since": v[0], "monthly": v[1]} for k, v in first_seen.items() if v[0] >= "2026-08-01" and v[0] < "2026-08-31" and k in ("Disney+", "Strava")]
card = [t for t in tx if t["amount"] < 0 and t["category"] in {"groceries", "eating_out", "transport_extra", "shopping", "health", "leisure"}]
roundups = round(sum(math.ceil(-t["amount"]) + t["amount"] for t in card) / len(picture), 2)

out = {"generated_from": "data/ines.json", "picture": picture,
       "margin": {"min": min(margins), "max": max(margins), "avg": round(sum(margins) / len(margins), 2)},
       "fixed_avg": fixed_avg, "buffer": buffer,
       "plan": {"goal": goal, "monthly": monthly, "needed_for_full_goal": needed, "fit": fit, "short_months_in_history": short_months,
                "christmas_share": a.christmas, "transfers": len(transfers), "first_transfer": transfers[0].isoformat(),
                "total_by_deadline": total, "gap": gap},
       "projection": proj, "interest": interest, "gap_options": options,
       "side_widgets": {"new_subscriptions_this_summer": new_subs, "new_subscriptions_monthly": round(sum(s["monthly"] for s in new_subs), 2),
                        "roundups_monthly_estimate": roundups}}
json.dump(out, open("data/plan-output.json", "w"), ensure_ascii=False, indent=2)
print(f"Margins {margins} | buffer ok={buffer['ok']} (€{balance:.0f} vs €{fixed_avg:.0f})")
print(f"Plan: €{monthly:.0f}/mo x{len(transfers)} + €{a.christmas:.0f} Christmas = €{total:,.0f}; gap €{gap:,.0f}; fit={fit}; needed €{needed}/mo")
print(f"Interest net €{interest['net']} | new subs €{out['side_widgets']['new_subscriptions_monthly']}/mo | round-ups ~€{roundups}/mo")
