/* ===== analytics.js: monthly reports, returned in a shape that Chart.js can use directly ===== */
import { getTransactions, sumAmount, currentMonthKey, lastMonthKeys, CATEGORIES } from "./transactions.js";

const monthLabel = k => new Date(k + "-01").toLocaleString("en", { month: "short" });

/* Pure calculation for one month */
export function buildMonthlyReport(transactions, monthKey = currentMonthKey()) {
  const inMonth = transactions.filter(t => t.date.startsWith(monthKey));
  const incomeList = inMonth.filter(t => t.type === "income"), expenseList = inMonth.filter(t => t.type === "expense");
  const income = sumAmount(incomeList), expenses = sumAmount(expenseList), savings = income - expenses;
  const byCategory = list => {
    const total = sumAmount(list);
    return CATEGORIES.map(c => { const amount = sumAmount(list.filter(t => t.category === c)); return { category: c, amount, percent: total ? Math.round(amount / total * 100) : 0 }; })
      .filter(r => r.amount > 0).sort((a, b) => b.amount - a.amount);
  };
  const keys = lastMonthKeys(6, monthKey), labels = keys.map(monthLabel);
  const monthSum = (k, type) => sumAmount(transactions.filter(t => t.type === type && t.date.startsWith(k)));
  const spendByCat = byCategory(expenseList);
  return {
    month: monthKey,
    summary: { income, expenses, savings, savingsRate: income ? Math.round(savings / income * 100) : 0 },
    incomeReport: { total: income, byCategory: byCategory(incomeList), transactions: incomeList },
    expenseReport: { total: expenses, byCategory: spendByCat, transactions: expenseList },
    charts: {   // use as: new Chart(canvas, { type: "bar", data: report.charts.incomeVsExpense })
      categoryPie: { labels: spendByCat.map(r => r.category), datasets: [{ data: spendByCat.map(r => r.amount) }] },
      incomeVsExpense: { labels, datasets: [
        { label: "Income", data: keys.map(k => monthSum(k, "income")), backgroundColor: "#12B76A" },
        { label: "Expenses", data: keys.map(k => monthSum(k, "expense")), backgroundColor: "#5B7BA8" }] },
      savingsTrend: { labels, datasets: [{ label: "Net savings", data: keys.map(k => monthSum(k, "income") - monthSum(k, "expense")), borderColor: "#12B76A", fill: true }] }
    }
  };
}

export async function getMonthlyReports(monthKey = currentMonthKey()) {
  return buildMonthlyReport(await getTransactions(), monthKey);
}
