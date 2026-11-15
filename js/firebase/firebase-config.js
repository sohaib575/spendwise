/* ===== firebase-config.js: connects the app to YOUR Firebase project =====
   1. Firebase Console > Project settings > "Your apps" > Web app > copy the config.
   2. Paste the values below.
   These web keys are NOT secret. Your data is protected by firestore.rules, not by hiding these keys.
   Never put a service-account / admin key in frontend code. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUYs8s0qBljDqXIcrGc7K00dSebgzPqL4",
  authDomain: "spendwise-764b5.firebaseapp.com",
  projectId: "spendwise-764b5",
  storageBucket: "spendwise-764b5.firebasestorage.app",
  messagingSenderId: "193126699230",
  appId: "1:193126699230:web:15174352d7b3ffe6a0724f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
/* Speed: keep a copy of the data in the browser so every page opens instantly, and fall back to
   long-polling when the network (VPN, antivirus, proxy) blocks Firebase's normal streaming connection. */
let firestore;
try {
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalAutoDetectLongPolling: true
  });
} catch (e) { firestore = getFirestore(app); }   // e.g. private window: use the normal setup
export const db = firestore;

/* Turns Firestore errors into short messages a user can understand */
export function explainError(e) {
  const messages = {
    "permission-denied": "Permission denied. Log in again and make sure firestore.rules are published.",
    "unauthenticated": "Please log in first.",
    "unavailable": "Cannot reach Firebase. Check your internet connection.",
    "failed-precondition": "Firestore is not ready. Check that the database is created."
  };
  return new Error(messages[e.code] || e.message || "Something went wrong.");
}
