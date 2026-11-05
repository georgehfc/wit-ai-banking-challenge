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

# 8. Scenarios. J1 what-if (slider), J1 chosen plan (Inês picks September), J2 (Christmas allowance lands), J3 (off-track month)
def run(m, trans):
    ev = sorted([(t, m, "monthly") for t in trans] + [(date(2026, 12, 15), a.christmas, "christmas_allowance")])
    b, pr = 0.0, []
    for when, amt, kind in ev:
        b += amt; pr.append({"date": when.isoformat(), "add": amt, "kind": kind, "saved": round(b, 2)})
    return round(b, 2), pr
what_if = []
for m in (250,):
    tot, wp = run(m, transfers)
    what_if.append({"monthly": m, "projection": wp, "total_by_deadline": tot, "gap": round(goal - tot, 2),
                    "short_months_in_history": [r["month"] for r in picture if r["margin"] < m],
                    "ok_months_in_history": [r["month"] for r in picture if r["margin"] >= m]})
sep_transfers = transfers + [date(2027, 8, 1), date(2027, 9, 1)]
sep_total, sep_proj = run(monthly, sep_transfers)
hol = next(e for e in d["expected_income"] if e["type"] == "holiday_allowance")
chosen = {"option": "september", "monthly": monthly, "transfers": len(sep_transfers), "first_transfer": sep_transfers[0].isoformat(),
          "last_transfer": sep_transfers[-1].isoformat(), "scheduled_total": round(monthly * len(sep_transfers), 2), "christmas_share": a.christmas, "total_from_transfers": sep_total,
          "holiday_allowance_topup": round(goal - sep_total, 2), "holiday_allowance_date": hol["expected_by"],
          "holiday_allowance_net": hol["amount_net_estimate"], "goal": goal, "projection": sep_proj}
xmas = next(e for e in d["expected_income"] if e["type"] == "christmas_allowance")
saved_before_xmas = next(r["saved"] for r in sep_proj if r["kind"] == "christmas_allowance") - a.christmas
j2 = {"date": xmas["expected_by"], "allowance": xmas["amount_net_estimate"], "to_goal": a.christmas,
      "stays_in_account": round(xmas["amount_net_estimate"] - a.christmas, 2),
      "goal_saved_before": round(saved_before_xmas, 2), "goal_saved_after": round(saved_before_xmas + a.christmas, 2)}
ot = d["scenarios"]["off_track_month"]
expected_left = round(sum(margins) / len(margins) - ot["bill"]["amount"], 2)    # estimate: what an average month leaves, minus the 180 € paid on 28 Dec (so the 1 Jan transfer would draw on the buffer)
later = [t for t in sep_transfers if t.isoformat()[:7] > ot["month"]]
extra = math.ceil(monthly / len(later))
spread_monthly = monthly + extra
saved_jan = next(r["saved"] for r in sep_proj if r["date"] == "2026-12-15")
j3 = {"based_on": "chosen plan (September)", "month": ot["month"], "bill": ot["bill"], "expected_left_estimate": expected_left,
      "transfer": monthly, "saved_now": saved_jan, "plan_total": sep_total,
      "buffer_dip_if_kept": round(max(0, monthly - expected_left), 2),
      "options": [
          {"id": "skip", "label": f"Skip January's €{monthly:,.0f}", "total_by_deadline": round(sep_total - monthly, 2), "short_of_plan": monthly},
          {"id": "spread", "label": f"Skip it and add €{extra} to the next {len(later)} transfers",
           "months": [later[0].isoformat()[:7], later[-1].isoformat()[:7]], "count": len(later), "extra": extra, "new_monthly": spread_monthly,
           "total_by_deadline": round(sep_total - monthly + extra * len(later), 2),
           "short_months_in_history_at_new_monthly": [r["month"] for r in picture if r["margin"] < spread_monthly]},
          {"id": "keep", "label": "Keep it as planned", "buffer_dip": round(max(0, monthly - expected_left), 2)}]}


# 9. Spending breakdown for "Where did my money go?" (Aug–Oct). Same fixed/everyday split as section 1.
# Health is folded into "Other" with no merchant names: the assistant never surfaces health spending (GDPR guardrail).
GROUPS = [("rent", "Rent", ["rent"], "fixed"), ("bills", "Bills and phone", ["utilities", "phone"], "fixed"),
          ("transport", "Transport", ["transport", "transport_extra"], "mixed"), ("subscriptions", "Subscriptions", ["subscription"], "fixed"),
          ("groceries", "Groceries", ["groceries"], "everyday"), ("eating_out", "Eating out", ["eating_out"], "everyday"),
          ("shopping", "Shopping", ["shopping"], "everyday"), ("travel", "Travel", ["travel"], "everyday"),
          ("going_out", "Going out", ["leisure"], "everyday"), ("other", "Other", ["health"], "everyday")]
mlist = [r["month"] for r in picture]
groups = []
for gid, label, cats, kind in GROUPS:
    g_tx = [t for t in tx if t["amount"] < 0 and t["category"] in cats]
    by_m = {m: round(sum(-t["amount"] for t in g_tx if t["date"][:7] == m), 2) for m in mlist}
    merch = defaultdict(float)
    for t in g_tx: merch[t["merchant"]] += -t["amount"]
    top = [] if gid == "other" else [{"name": k, "total": round(v, 2)} for k, v in sorted(merch.items(), key=lambda x: -x[1])[:3]]
    groups.append({"id": gid, "label": label, "kind": kind, "total": round(sum(by_m.values()), 2), "by_month": by_m, "count": len(g_tx), "top": top})
groups.sort(key=lambda g: -g["total"])
spent_by_month = {m: round(sum(g["by_month"][m] for g in groups), 2) for m in mlist}
spending = {"months": mlist, "groups": groups, "spent_by_month": spent_by_month, "spent_total": round(sum(spent_by_month.values()), 2),
            "income_by_month": {r["month"]: r["income"] for r in picture},
            "everyday_by_month": {r["month"]: r["variable"] for r in picture}, "fixed_avg": fixed_avg,
            "highest_everyday_month": max(picture, key=lambda r: r["variable"])["month"],
            "travel_in_highest": next(g for g in groups if g["id"] == "travel")["by_month"][max(picture, key=lambda r: r["variable"])["month"]]}

out = {"generated_from": "data/ines.json", "picture": picture,
       "margin": {"min": min(margins), "max": max(margins), "avg": round(sum(margins) / len(margins), 2)},
       "fixed_avg": fixed_avg, "buffer": buffer,
       "plan": {"goal": goal, "monthly": monthly, "needed_for_full_goal": needed, "fit": fit, "short_months_in_history": short_months,
                "christmas_share": a.christmas, "transfers": len(transfers), "first_transfer": transfers[0].isoformat(),
                "total_by_deadline": total, "gap": gap},
       "projection": proj, "interest": interest, "gap_options": options,
       "side_widgets": {"new_subscriptions_this_summer": new_subs, "new_subscriptions_monthly": round(sum(s["monthly"] for s in new_subs), 2),
                        "roundups_monthly_estimate": roundups},
       "spending": spending,
       "scenarios": {"j1_what_if": what_if, "j1_chosen": chosen, "j2_christmas_lands": j2, "j3_off_track_month": j3}}
json.dump(out, open("data/plan-output.json", "w"), ensure_ascii=False, indent=2)
print(f"Margins {margins} | buffer ok={buffer['ok']} (€{balance:.0f} vs €{fixed_avg:.0f})")
print(f"Plan: €{monthly:.0f}/mo x{len(transfers)} + €{a.christmas:.0f} Christmas = €{total:,.0f}; gap €{gap:,.0f}; fit={fit}; needed €{needed}/mo")
print(f"Interest net €{interest['net']} | new subs €{out['side_widgets']['new_subscriptions_monthly']}/mo | round-ups ~€{roundups}/mo")
