// Every number on screen comes from the planner: python3 data/planner.py -> data/plan-output.json.
// Never type numbers into components; read them from here.
import plan from '../../data/plan-output.json'

export const data = plan
export const eur = (n: number, digits = 0) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n)
