/* ===== dashboard.js: totals, monthly and category numbers for the dashboard ===== */
import { getTransactions, sumAmount, currentMonthKey, lastMonthKeys, CATEGORIES } from "./transactions.js";

const monthLabel = k => new Date(k + "-01").toLocaleString("en", { month: "short" });

/* Pure calculation: give it a list of transactions, get the dashboard numbers back */
export function calculateDashboardFrom(transactions, monthKey = currentMonthKey()) {
  const income = transactions.filter(t => t.type === "income"), expenses = transactions.filter(t => t.type === "expense");
  const totalIncome = sumAmount(income), totalExpenses = sumAmount(expenses);
  const monthTx = transactions.filter(t => t.date.startsWith(monthKey));
  const monthExpenses = monthTx.filter(t => t.type === "expense");
  const monthIncome = sumAmount(monthTx.filter(t => t.type === "income")), monthSpent = sumAmount(monthExpenses);
  return {
    totalIncome, totalExpenses,
    balance: totalIncome - totalExpenses,          // Remaining Balance = Total Income - Total Expenses
    savings: totalIncome - totalExpenses,          // Savings = Income - Expenses
    month: { key: monthKey, income: monthIncome, expenses: monthSpent, savings: monthIncome - monthSpent },
    categorySpending: CATEGORIES.map(c => {
      const amount = sumAmount(monthExpenses.filter(t => t.category === c));
      return { category: c, amount, percent: monthSpent ? Math.round(amount / monthSpent * 100) : 0 };
    }).filter(r => r.amount > 0),
    monthlySpending: lastMonthKeys(6, monthKey).map(k => ({           // ready for a Chart.js bar chart
      month: k, label: monthLabel(k),
      income: sumAmount(income.filter(t => t.date.startsWith(k))), expenses: sumAmount(expenses.filter(t => t.date.startsWith(k)))
    })),
    recentTransactions: [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)
  };
}

/* Fetch from Firestore, then calculate */
export async function calculateDashboard(monthKey = currentMonthKey()) {
  return calculateDashboardFrom(await getTransactions(), monthKey);
}
