/* ===== auth.js: signup, login, logout and auth state ===== */
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const AUTH_ERRORS = {
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/network-request-failed": "Network error. Check your internet connection.",
  "auth/invalid-api-key": "Firebase is not configured. Add your keys in firebase-config.js.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Firebase is not configured. Add your keys in firebase-config.js.",
  "auth/configuration-not-found": "Enable Email/Password sign-in in the Firebase Console."
};
const friendly = e => new Error(AUTH_ERRORS[e.code] || e.message || "Something went wrong.");

/* Create the account, save the name, then store the profile in Firestore (users/{uid}) */
export async function signupUser(name, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid, name, email: cred.user.email,
      currency: "PKR", monthlyBudget: 0, createdAt: serverTimestamp()
    });
    return cred.user;
  } catch (e) { throw friendly(e); }
}

export async function loginUser(email, password) {
  try { return (await signInWithEmailAndPassword(auth, email, password)).user; }
  catch (e) { throw friendly(e); }
}

/* Sends a password reset link to the email. For privacy we do not reveal whether the account exists. */
export async function resetPassword(email) {
  try { await sendPasswordResetEmail(auth, email); }
  catch (e) { if (e.code !== "auth/user-not-found") throw friendly(e); }
}

export async function logoutUser() {
  try { await signOut(auth); } catch (e) { throw friendly(e); }
}

/* Resolves with the logged-in user (or null) once Firebase has finished checking the session */
export function getCurrentUser() {
  return new Promise(resolve => {
    const stop = onAuthStateChanged(auth, user => { stop(); resolve(user); });
  });
}

/* Run a function every time the user logs in or out */
export const onAuthChange = callback => onAuthStateChanged(auth, callback);

/* Protect a page: send visitors who are not logged in to the login page */
export async function requireAuth(redirectTo = "login.html") {
  const user = await getCurrentUser();
  if (!user) location.href = redirectTo;
  return user;
}

/* Read the profile document: { uid, name, email, currency, monthlyBudget, createdAt } */
export async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Please log in first.");
  const snap = await getDoc(doc(db, "users", user.uid));
  return snap.exists() ? snap.data() : null;
}
