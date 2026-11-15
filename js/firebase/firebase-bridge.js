/* ===== firebase-bridge.js: connects the existing pages to Firebase =====
   Add to every page (after the other scripts):  <script type="module" src="js/firebase/firebase-bridge.js"></script>
   It (1) exposes all backend functions as window.SW, (2) keeps a live copy of the user's Firestore data,
   (3) makes the app's DB object read/write Firestore, (4) protects pages and keeps the login session in sync. */
import { onAuthChange, signupUser, loginUser, logoutUser, resetPassword, getCurrentUser } from "./auth.js";
import { validateTransaction, addTransaction, addTransactions, getTransactions, updateTransaction, deleteTransaction, subscribeTransactions } from "./transactions.js";
import { saveBudget, getBudgets, subscribeBudgets, pickBudget, getBudgetStatus } from "./budget.js";
import { calculateDashboard } from "./dashboard.js";
import { generateSavingSuggestions, buildSuggestions } from "./recommendations.js";
import { getMonthlyReports } from "./analytics.js";

/* Handy in the browser console too, e.g.  await SW.calculateDashboard() */
window.SW = { signupUser, loginUser, logoutUser, resetPassword, getCurrentUser, addTransaction, getTransactions, updateTransaction, deleteTransaction,
  calculateDashboard, saveBudget, getBudgets, getBudgetStatus, generateSavingSuggestions, getMonthlyReports };

const cache = { tx: [], budgets: [] }, isAppPage = !!document.body.dataset.page;
let stops = [];
const refresh = () => document.dispatchEvent(new Event("langchange"));   // the pages redraw on this event
const showError = e => { console.error("SpendWise:", e); if (window.toast) window.toast(e.message, 7000); };

/* Loading state: the page is dimmed (with a thin green bar) until your data has arrived */
const t0 = performance.now(); let waiting = 2;
const stopLoading = () => document.body.classList.remove("is-loading");
const firstData = fn => { let first = true; return list => { fn(list); if (first) { first = false; if (--waiting === 0) { stopLoading(); console.info(`SpendWise: data ready in ${Math.round(performance.now() - t0)} ms`); } } }; };
if (isAppPage) {
  document.body.classList.add("is-loading");
  setTimeout(() => { if (waiting > 0) { stopLoading(); showError(new Error("Firebase is slow to respond. Still trying…")); } }, 8000);
}
const failed = e => { stopLoading(); showError(e); };
/* Writes are not awaited: Firestore updates the screen at once and undoes the change if the server refuses it */
const background = promise => promise.catch(showError);

/* Replace the browser-storage versions in app.js with Firestore versions */
Object.assign(window.DB, {
  tx: () => cache.tx,
  addTx: item => { validateTransaction(item); background(addTransaction(item)); },
  addTxs: rows => { background(addTransactions(rows)); },
  updateTx: (id, item) => { validateTransaction(item); background(updateTransaction(id, item)); },
  deleteTx: id => { background(deleteTransaction(id)); },
  budget: () => pickBudget(cache.budgets),
  saveBudget: b => { background(saveBudget({ ...b, existing: cache.budgets })); }
});
/* The tips shown on the dashboard now come from recommendations.js */
window.getTips = () => buildSuggestions(cache.tx, pickBudget(cache.budgets)).map(s => ({ i: s.icon, k: s.key, p: s.params }));

/* React to login / logout */
onAuthChange(user => {
  stops.forEach(stop => stop()); stops = []; cache.tx = []; cache.budgets = [];
  if (!user) {
    localStorage.removeItem("sw_session");
    if (isAppPage && !window.swLoggingOut) location.replace("login.html");   // (logout goes to the first page instead)               // protected pages need a login
    return;
  }
  localStorage.setItem("sw_session", JSON.stringify({ name: user.displayName || "", email: user.email }));
  if (!isAppPage) return;                                        // login/signup pages load no data
  stops.push(subscribeTransactions(firstData(list => { cache.tx = list; refresh(); }), failed));
  stops.push(subscribeBudgets(firstData(list => { cache.budgets = list; refresh(); }), failed));
});
