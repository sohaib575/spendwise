/* ===== budget.js: monthly + category budgets, usage, 80% warning and exceeded alert =====
   Firestore collection: "budgets". The overall monthly budget uses category "monthly".
   Document id = uid_year_month_category, so saving again simply updates the same budget. */
import { db, explainError } from "./firebase-config.js";
import { collection, doc, getDocs, writeBatch, query, where, onSnapshot, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { CATEGORIES, currentUserId, getTransactions, sumAmount, currentMonthKey, formatPKR } from "./transactions.js";

export const MONTHLY = "monthly";
const budgetId = (uid, y, m, cat) => `${uid}_${y}_${String(m).padStart(2, "0")}_${cat}`;
const budgetsQuery = () => query(collection(db, "budgets"), where("userId", "==", currentUserId()));

/* All budgets of the user (every month) */
export async function getAllBudgets() {
  try { return (await getDocs(budgetsQuery())).docs.map(d => ({ id: d.id, ...d.data() })); }
  catch (e) { throw explainError(e); }
}

/* Budgets of one month (default: this month) */
export async function getBudgets(month = new Date().getMonth() + 1, year = new Date().getFullYear()) {
  return (await getAllBudgets()).filter(b => b.month === month && b.year === year);
}

/* Turn budget documents into { monthly, cats: { Food: 5000, ... } }.
   If this month has no budget yet, the most recent earlier month is used. */
export function pickBudget(budgets, month = new Date().getMonth() + 1, year = new Date().getFullYear()) {
  const key = b => b.year * 100 + b.month, eligible = budgets.filter(b => key(b) <= year * 100 + month);
  const out = { monthly: 0, cats: {} };
  if (!eligible.length) return out;
  const latest = Math.max(...eligible.map(key));
  eligible.filter(b => key(b) === latest).forEach(b => { if (b.category === MONTHLY) out.monthly = b.limit; else out.cats[b.category] = b.limit; });
  return out;
}

/* Save (set or update) budgets for a month. A value of 0 or empty removes that budget.
   Example: saveBudget({ monthly: 45000, cats: { Food: 12000, Shopping: 6000 } }) */
export async function saveBudget({ monthly = 0, cats = {}, month = new Date().getMonth() + 1, year = new Date().getFullYear(), existing } = {}) {
  try {
    const uid = currentUserId(), limits = { [MONTHLY]: monthly, ...cats };
    const known = existing || await getBudgets(month, year);   // "existing" can be passed in to skip a server read
    const existingCats = known.filter(b => b.month === month && b.year === year).map(b => b.category), batch = writeBatch(db);
    for (const cat of [MONTHLY, ...CATEGORIES]) {
      const limit = Number(limits[cat]) || 0, ref = doc(db, "budgets", budgetId(uid, year, month, cat));
      if (limit < 0) throw new Error("A budget cannot be negative.");
      if (limit > 0) batch.set(ref, { budgetId: ref.id, userId: uid, category: cat, limit, month, year, createdAt: serverTimestamp() });
      else if (existingCats.includes(cat)) batch.delete(ref);   // only delete budgets that exist
    }
    batch.update(doc(db, "users", uid), { monthlyBudget: Number(monthly) || 0 });   // keep the profile in sync
    await batch.commit();
  } catch (e) { throw explainError(e); }
}

/* Live updates of all budgets. Returns a function that stops listening. */
export function subscribeBudgets(onData, onError) {
  return onSnapshot(budgetsQuery(), snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() }))), e => onError && onError(explainError(e)));
}

/* Used / remaining / percent / status for the monthly budget and each category budget.
   status: "ok" | "warning" (80% or more used) | "exceeded" (over the limit) */
export function calculateBudgetStatus(budget, transactions, monthKey = currentMonthKey()) {
  const spent = transactions.filter(t => t.type === "expense" && t.date.startsWith(monthKey));
  const line = (limit, used) => ({ limit, used, remaining: limit - used, percent: Math.round(used / limit * 100),
    status: used > limit ? "exceeded" : used >= limit * 0.8 ? "warning" : "ok" });
  const result = { monthly: null, categories: {}, alerts: [] };
  const alert = (name, s) => {
    if (s.status === "exceeded") result.alerts.push({ level: "exceeded", category: name, message: `You exceeded your ${name} budget by ${formatPKR(s.used - s.limit)}.` });
    else if (s.status === "warning") result.alerts.push({ level: "warning", category: name, message: `You have used ${s.percent}% of your ${name} budget.` });
  };
  if (budget.monthly > 0) { result.monthly = line(budget.monthly, sumAmount(spent)); alert("monthly", result.monthly); }
  for (const [cat, limit] of Object.entries(budget.cats || {})) {
    if (limit > 0) { result.categories[cat] = line(limit, sumAmount(spent.filter(t => t.category === cat))); alert(cat, result.categories[cat]); }
  }
  return result;
}

export async function getBudgetStatus(monthKey = currentMonthKey()) {
  const [budgets, transactions] = await Promise.all([getAllBudgets(), getTransactions({ month: monthKey })]);
  return calculateBudgetStatus(pickBudget(budgets), transactions, monthKey);
}
