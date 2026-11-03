"""Generates data/ines.json: Inês's mock bank data (Aug-Oct 2026).
Deterministic (fixed seed). Monthly margins are pinned to 150 / 280 / 230
so every screen, widget and line of copy uses the same numbers.
All amounts are illustrative. Run: python3 data/generate_ines.py"""
import json, random
from datetime import date

random.seed(28)
NET_SALARY = 1130.00            # estimate for EUR 1,450 gross x14, single, no dependants
TARGET_MARGIN = {8: 150.00, 9: 280.00, 10: 230.00}
OPENING_BALANCE = 240.00        # 1 Aug 2026, so 31 Oct closes at EUR 900

FIXED = [  # (day, merchant, category, amount)
    (1,  "Transfer to landlord · Arroios", "rent", 575.00),
    (5,  "EDP Comercial (½ share)", "utilities", 34.60),
    (6,  "EPAL água (½ share)", "utilities", 11.40),
    (8,  "MEO fibra (½ share)", "utilities", 22.50),
    (10, "Vodafone mobile", "phone", 12.99),
    (2,  "Navegante metropolitano", "transport", 40.00),
    (14, "Spotify", "subscription", 7.99),
    (20, "Netflix", "subscription", 9.99),
]
NEW_SUBS = [(3, "Disney+", "subscription", 9.99), (17, "Strava", "subscription", 7.99)]  # added in August
VARIABLE = {  # category: (merchants, count range, amount range)
    # most groceries and weekday lunches go on the meal card (not in this account)
    "groceries": (["Continente", "Pingo Doce", "Lidl", "Mercado de Arroios"], (3, 5), (6, 18)),
    "eating_out": (["Café O Sol", "Tasca do Zé", "Time Out Market", "Glovo", "Pastelaria Versailles"], (4, 6), (3, 14)),
    "transport_extra": (["Uber", "Bolt", "Gira bicicletas"], (1, 3), (3, 9)),
    "shopping": (["Zara", "Fnac", "Worten", "Primark"], (0, 1), (12, 35)),
    "health": (["Farmácia Estácio"], (0, 1), (5, 15)),
    "leisure": (["Cinema NOS", "Ticketline", "Fábrica Braço de Prata"], (1, 1), (8, 18)),
}

def month_txns(m):
    tx = []
    def add(day, merchant, cat, amt):
        tx.append({"date": date(2026, m, day).isoformat(), "merchant": merchant, "category": cat, "amount": round(amt, 2)})
    for d, mer, cat, a in FIXED: add(d, mer, cat, -a)
    for d, mer, cat, a in NEW_SUBS: add(d, mer, cat, -a)
    for cat, (mers, (cmin, cmax), (amin, amax)) in VARIABLE.items():
        for _ in range(random.randint(cmin, cmax)):
            add(random.randint(1, 28), random.choice(mers), cat, -random.uniform(amin, amax))
    if m == 8:  # summer weekend in the Algarve: why August's margin is low
        add(15, "Comboios de Portugal", "travel", -46.30)
        add(16, "MB WAY · Sofia (alojamento Lagos)", "travel", -60.00)
    add(28, "SALARIO · Agência Lumen Lda", "salary", NET_SALARY)
    # balancing card spend so the margin lands exactly on target
    spent = sum(t["amount"] for t in tx)
    gap = round(spent - TARGET_MARGIN[m], 2)
    if gap > 0:   # margin too high: one more card spend
        add(26, "El Corte Inglés", "shopping", -gap)
    elif gap < 0: # margin too low: a friend pays back via MB WAY
        add(27, "MB WAY · Rita (jantar e bilhetes)", "transfer_in", -gap)
    print(f"month {m}: balancing {'spend' if gap>0 else 'MB WAY in'} {abs(gap):.2f}")
    return sorted([t for t in tx if t["amount"] != 0], key=lambda t: t["date"])

txns, bal = [], OPENING_BALANCE
for m in (8, 9, 10):
    for t in month_txns(m):
        bal = round(bal + t["amount"], 2)
        t["balance_after"] = bal
        txns.append(t)
for i, t in enumerate(txns, 1):
    t["id"] = f"tx_{i:03d}"

data = {
    "_note": "Illustrative mock data for the WIT challenge PoC. Fictional person, fictional bank. Real merchant names used only for realism.",
    "as_of": "2026-11-02",
    "customer": {
        "name": "Inês Marques", "age": 28, "city": "Lisboa (Arroios)",
        "job": "Junior marketing coordinator, Agência Lumen Lda",
        "salary": {"gross_monthly": 1450.00, "payments_per_year": 14, "net_monthly_estimate": NET_SALARY,
                    "payday": 28, "note": "Net is an estimate (SS 11% + 2026 IRS withholding). Meal allowance goes to a separate meal card and is not in this account."},
        "housing": {"type": "room in a shared T2", "rent_share": 575.00}, "meal_card": {"provider_type": "employer meal card", "monthly": 224.40, "note": "covers most groceries and weekday lunches; outside this account"},
        "consents": {"account_data_for_assistant": {"granted": "2026-11-02", "scope": "current account, last 3 months", "expires": "2027-02-02"}},
    },
    "accounts": [
        {"id": "acc_current", "type": "current", "name": "Conta à ordem", "iban_display": "PT50 •••• •••• •••• 4821", "currency": "EUR",
         "opening_balance_2026_08_01": OPENING_BALANCE, "balance": bal, "features": ["MB WAY", "Multibanco", "salary domiciled"]},
    ],
    "products_available": [
        {"id": "prod_savings", "name": "Poupança diária", "type": "savings", "rate_tanb_illustrative": 0.025, "interest_paid": "daily",
         "withdraw": "any time, no interest lost", "tax_on_interest": 0.28, "lane": "do_with_approval"},
        {"id": "prod_goal", "name": "Objetivo", "type": "goal_pot", "inside": "prod_savings", "lane": "do_with_approval"},
        {"id": "prod_scheduled", "name": "Transferência programada", "type": "scheduled_transfer", "lane": "do_with_approval", "approval": "Face ID every time"},
        {"id": "prod_roundups", "name": "Arredondamentos", "type": "round_ups", "lane": "do_with_approval"},
        {"id": "prod_budget", "name": "Orçamento", "type": "budget", "lane": "do_with_approval"},
        {"id": "prod_credit", "name": "Crédito pessoal", "type": "personal_credit", "lane": "hand_off", "why": "CCD2: no nudging, costs + human review"},
        {"id": "prod_invest", "name": "Investimentos / PPR", "type": "investments", "lane": "hand_off", "why": "MiFID II suitability"},
        {"id": "prod_mortgage", "name": "Crédito habitação", "type": "mortgage", "lane": "hand_off", "why": "simulation + FINE + advisor"},
        {"id": "prod_insurance", "name": "Seguro de viagem", "type": "insurance", "lane": "hand_off", "why": "IDD demands-and-needs"},
    ],
    "expected_income": [
        {"type": "christmas_allowance", "label": "Subsídio de Natal", "expected_by": "2026-12-15", "amount_net_estimate": NET_SALARY, "certainty": "legal right (Código do Trabalho art. 263)"},
        {"type": "holiday_allowance", "label": "Subsídio de férias", "expected_by": "2027-06-28", "amount_net_estimate": NET_SALARY, "certainty": "legal right (art. 264); paid before the holiday, so treated as trip spending money"},
        {"type": "irs_refund", "label": "Reembolso de IRS", "window": ["2027-04-01", "2027-08-31"], "amount_net_estimate": None,
         "national_average_2026": 980, "certainty": "unknown: never counted in the base plan"},
    ],
    "intent": {"text": "Quero poupar 3.000 € para umas férias no próximo verão, mas não sei quanto consigo pôr de lado por mês.",
               "text_en": "I want to save €3,000 for a holiday next summer, but I don't know how much I can afford to save every month.",
               "goal": 3000.00, "deadline": "2027-07-15", "trip": "with friends, July 2027"},
    "transactions": txns,
}
json.dump(data, open("data/ines.json", "w"), ensure_ascii=False, indent=2)
print(f"{len(txns)} transactions, closing balance {bal}")
