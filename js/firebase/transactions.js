/* ===== transactions.js: add, read, edit, delete, search and filter transactions =====
   Firestore collection: "transactions". Every document stores the owner's uid in userId. */
import { auth, db, explainError } from "./firebase-config.js";
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, writeBatch, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const CATEGORIES = ["Food", "Transport", "Shopping", "Education", "Bills", "Health", "Entertainment", "Other"];

/* ---------- Small helpers shared by the other backend files ---------- */
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const currentMonthKey = () => todayISO().slice(0, 7);               // e.g. "2026-11"
export const sumAmount = list => list.reduce((s, t) => s + t.amount, 0);
export const formatPKR = n => "PKR " + Math.round(n).toLocaleString("en-PK");
export function lastMonthKeys(n, from = currentMonthKey()) {                // ["2026-06", ... "2026-11"]
  const [y, m] = from.split("-").map(Number), keys = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    keys.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }
  return keys;
}
export function currentUserId() {
  if (!auth.currentUser) throw new Error("Please log in first.");
  return auth.currentUser.uid;
}

/* Checks the input and returns a clean object (throws a clear message if something is wrong) */
export function validateTransaction(d) {
  const title = String(d.title ?? "").trim(), description = String(d.description ?? "").trim(), amount = Number(d.amount);
  if (!title || title.length > 60) throw new Error("Title is required (maximum 60 characters).");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than 0.");
  if (!["income", "expense"].includes(d.type)) throw new Error("Type must be income or expense.");
  if (!CATEGORIES.includes(d.category)) throw new Error("Choose a valid category.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || "")) throw new Error("Date is required.");
  if (description.length > 200) throw new Error("Description is too long (maximum 200 characters).");
  return { title, amount, type: d.type, category: d.category, date: d.date, description };
}

const toTx = d => ({ id: d.id, ...d.data() });   // "id" is the same value as transactionId

/* Search + filter a list in memory. Used by getTransactions() */
export function filterTransactions(list, { search = "", category = "", date = "", type = "", month = "" } = {}) {
  const q = search.trim().toLowerCase();
  return list
    .filter(t => (!q || t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
      && (!category || t.category === category) && (!type || t.type === type)
      && (!date || t.date === date) && (!month || t.date.startsWith(month)))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export async function addTransaction(data) {
  try {
    const clean = validateTransaction(data), ref = doc(collection(db, "transactions"));   // creates a new id
    await setDoc(ref, { transactionId: ref.id, userId: currentUserId(), ...clean, createdAt: serverTimestamp() });
    return { id: ref.id, ...clean };
  } catch (e) { throw explainError(e); }
}

/* Add many at once (used by the "Load demo data" button). Firestore allows up to 500 per batch. */
export async function addTransactions(rows) {
  try {
    const uid = currentUserId(), batch = writeBatch(db);
    rows.slice(0, 500).forEach(r => {
      const ref = doc(collection(db, "transactions"));
      batch.set(ref, { transactionId: ref.id, userId: uid, ...validateTransaction(r), createdAt: serverTimestamp() });
    });
    await batch.commit();
  } catch (e) { throw explainError(e); }
}

/* Fetch the logged-in user's transactions. Filters: { search, category, date, type, month } */
export async function getTransactions(filters = {}) {
  try {
    const snap = await getDocs(query(collection(db, "transactions"), where("userId", "==", currentUserId())));
    return filterTransactions(snap.docs.map(toTx), filters);
  } catch (e) { throw explainError(e); }
}

export async function updateTransaction(id, data) {
  try { await updateDoc(doc(db, "transactions", id), validateTransaction(data)); }
  catch (e) { throw explainError(e); }
}

export async function deleteTransaction(id) {
  try { await deleteDoc(doc(db, "transactions", id)); }
  catch (e) { throw explainError(e); }
}

/* Live updates: onData(list) runs now and every time the data changes. Returns a function that stops listening. */
export function subscribeTransactions(onData, onError) {
  const q = query(collection(db, "transactions"), where("userId", "==", currentUserId()));
  return onSnapshot(q, snap => onData(snap.docs.map(toTx)), e => onError && onError(explainError(e)));
}
