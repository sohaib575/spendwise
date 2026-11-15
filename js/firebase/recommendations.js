/* ===== recommendations.js: rule-based Smart Saving Assistant (no AI API, no cost) =====
   Each suggestion has a "key" and "params" so the frontend can translate it (English/Urdu),
   plus an English "message" you can show as it is. */
import { getTransactions, sumAmount, currentMonthKey, formatPKR } from "./transactions.js";
import { getAllBudgets, pickBudget } from "./budget.js";
import { explainError } from "./firebase-config.js";

const MESSAGES = {
  tip_start: "Add your first transactions and I will suggest ways to save.",
  tip_food: "Your food expenses are higher this month ({n}% of spending). Try cooking at home more often.",
  tip_shop: "Try reducing unnecessary shopping expenses. They are {n}% of this month's spending.",
  tip_over: "You have gone over your monthly budget. Pause optional spending until next month.",
  tip_b80: "You have used over 80% of your monthly budget. Slow down on non-essentials.",
  tip_rate: "You are saving less than 20% of your income this month. Aim to save at least a fifth.",
  tip_weekly: "You can improve your savings by setting a weekly spending limit of about {n}.",
  tip_ok: "Great work. Your spending looks balanced this month."
};
const META = {   // [icon, severity]
  tip_start: ["bi-lightbulb", "info"], tip_food: ["bi-egg-fried", "warning"], tip_shop: ["bi-bag", "warning"],
  tip_over: ["bi-exclamation-octagon", "danger"], tip_b80: ["bi-exclamation-triangle", "warning"],
  tip_rate: ["bi-piggy-bank", "warning"], tip_weekly: ["bi-calendar-week", "info"], tip_ok: ["bi-check-circle", "success"]
};
const make = (key, params = {}) => ({ id: key, key, params, icon: META[key][0], severity: META[key][1],
  message: MESSAGES[key].replace(/\{(\w+)\}/g, (_, k) => params[k]) });

/* Pure rules: transactions + budget in, list of suggestions out */
export function buildSuggestions(transactions, budget = { monthly: 0, cats: {} }, monthKey = currentMonthKey()) {
  const tx = transactions.filter(t => t.date.startsWith(monthKey));
  if (!tx.length) return [make("tip_start")];
  const expenses = tx.filter(t => t.type === "expense"), income = sumAmount(tx.filter(t => t.type === "income")), total = sumAmount(expenses);
  const share = cat => total ? Math.round(sumAmount(expenses.filter(t => t.category === cat)) / total * 100) : 0;
  const out = [];
  if (share("Food") > 35) out.push(make("tip_food", { n: share("Food") }));          // high food spending
  if (share("Shopping") > 20) out.push(make("tip_shop", { n: share("Shopping") }));  // too much shopping
  if (budget.monthly && total > budget.monthly) out.push(make("tip_over"));          // budget exceeded
  else if (budget.monthly && total >= budget.monthly * 0.8) out.push(make("tip_b80"));   // budget almost used
  if (income && (income - total) / income < 0.2) out.push(make("tip_rate"));         // low savings rate
  out.push(make("tip_weekly", { n: formatPKR((budget.monthly || total) / 4.3) }));   // weekly limit
  if (out.length === 1) out.unshift(make("tip_ok"));
  return out;
}

export async function generateSavingSuggestions(monthKey = currentMonthKey()) {
  try {
    const [tx, budgets] = await Promise.all([getTransactions(), getAllBudgets()]);
    return buildSuggestions(tx, pickBudget(budgets), monthKey);
  } catch (e) { throw explainError(e); }
}
