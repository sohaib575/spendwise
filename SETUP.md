# SpendWise – Firebase Setup and Integration

## Folder structure
```
spendwise/
├── index.html, login.html, signup.html, dashboard.html,
│   transactions.html, budget.html, reports.html
├── firestore.rules          (security rules)
├── firebase.json            (deploy settings)
├── SETUP.md                 (this file)
├── css/style.css
└── js/
    ├── app.js, dashboard.js, transactions.js      (frontend, unchanged names)
    └── firebase/                                  (NEW backend folder)
        ├── firebase-config.js   auth.js   transactions.js   budget.js
        ├── dashboard.js   analytics.js   recommendations.js
        └── firebase-bridge.js
```
`js/firebase/transactions.js` and `js/firebase/dashboard.js` are the backend files. They are different from `js/transactions.js` and `js/dashboard.js`, which are the page scripts.

## Part 1: Firebase setup (about 10 minutes)
1. Go to https://console.firebase.google.com and click **Create a project**. Name it `spendwise`. Google Analytics is not needed.
2. In the project, click the **</>** (Web) icon, register an app named `spendwise-web`, and **copy the `firebaseConfig` values** shown. Skip "Firebase Hosting" for now.
3. Open **`js/firebase/firebase-config.js`** and replace the `YOUR_...` values with your values.
4. **Authentication:** Build > Authentication > Get started > Sign-in method > **Email/Password** > Enable > Save.
5. **Firestore:** Build > Firestore Database > Create database > choose a nearby location (for example `asia-south1`) > **Start in production mode** > Enable.
6. **Security rules:** Firestore Database > **Rules** tab > delete everything > paste the whole content of `firestore.rules` > **Publish**.

## Part 2: Run it locally
Firebase modules do **not** load when you double-click an HTML file (`file://`). Use a local server:
- VS Code: install the **Live Server** extension, right-click `index.html` > **Open with Live Server**.
- Or in the folder run: `npx serve .`

Test checklist: sign up > you land on the dashboard > Transactions > add one > refresh (it is still there) > open the app in a private window and log in with another account (you must not see the first account's data). In the Firebase Console you can see `users`, `transactions` and `budgets` collections appear.

## Part 3: Deploy (Firebase Hosting)
```
npm install -g firebase-tools
firebase login
firebase use --add          # pick your project
firebase deploy             # uploads the site and firestore.rules
```
You get a link like `https://spendwise-xxxx.web.app`. Share this link with the judges.

## Part 4: Frontend integration (already done for you)
- Every page except `index.html` loads `js/firebase/firebase-bridge.js` as its last script.
- The bridge puts all backend functions on `window.SW` and makes the existing pages read and write Firestore through the `DB` object in `app.js`. Pages redraw automatically when data changes (real-time).
- Login and signup call `SW.signupUser()` and `SW.loginUser()`. Logout calls `SW.logoutUser()`. Pages other than login/signup redirect to `login.html` when nobody is logged in.
- The dashboard tips come from `recommendations.js`.
- If Firebase is not loaded (for example `file://`), the app falls back to browser storage so it still opens.

### Function reference (all async except where noted)
| Function | What it does |
|---|---|
| `signupUser(name, email, password)` | Creates the account and the `users/{uid}` profile |
| `loginUser(email, password)` / `logoutUser()` | Log in and log out |
| `getCurrentUser()` | Resolves with the logged-in user or `null` |
| `addTransaction(data)` | Validates and saves. `data = {title, amount, type, category, date, description}` |
| `getTransactions({search, category, date, type, month})` | The user's transactions, filtered, newest first |
| `updateTransaction(id, data)` / `deleteTransaction(id)` | Edit and delete |
| `calculateDashboard(monthKey?)` | Totals, month numbers, category spending, 6-month data, recent transactions |
| `saveBudget({monthly, cats})` | Sets or updates this month's budgets (0 removes one) |
| `getBudgets(month?, year?)` | Budget documents of a month |
| `getBudgetStatus(monthKey?)` | Used, remaining, percent, `ok / warning (80%) / exceeded` and alert messages |
| `generateSavingSuggestions()` | Rule-based saving tips from real data |
| `getMonthlyReports(monthKey?)` | Summary, income and expense reports, and Chart.js-ready `charts` |

Try them in the browser console on any logged-in page, for example `await SW.calculateDashboard()`.

Chart.js example:
```js
const report = await SW.getMonthlyReports("2026-11");
new Chart(canvas, { type: "bar", data: report.charts.incomeVsExpense });
```

## Data model
- `users/{uid}`: uid, name, email, currency ("PKR"), monthlyBudget, createdAt
- `transactions/{id}`: transactionId, userId, title, amount, type, category, date ("YYYY-MM-DD"), description, createdAt
- `budgets/{uid_year_month_category}`: budgetId, userId, category ("monthly" or a category), limit, month, year, createdAt

## Security
- The `firebaseConfig` keys are public identifiers, not secrets. The rules in `firestore.rules` protect the data: only the signed-in owner can read or change their own documents, amounts must be positive, fields are validated, and everything else is blocked.
- Never put a service account / admin key in any frontend file.

## Troubleshooting
- **"Firebase is not configured"**: the `YOUR_...` values are still in `firebase-config.js`.
- **"Permission denied"**: the rules are not published, or you are logged out.
- **Login works but nothing saves / modules fail**: you opened the page with `file://`. Use Live Server.
- **Email/Password error**: enable it in Authentication > Sign-in method.
