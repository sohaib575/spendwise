# SpendWise – Smart Expense Tracker

**Track Your Money, Control Your Future.**

SpendWise is a smart expense tracker built for students and individuals. Record income and expenses in PKR, set monthly and category budgets, get personalised saving tips and see where your money goes with charts and reports.

**Live demo:** https://spendwise-pk.netlify.app

## Features

- **Authentication:** signup, login, logout and forgot password, powered by Firebase Authentication. Pages are protected, so only logged-in users can open the dashboard.
- **Transactions:** add, edit and delete income and expenses with title, amount (PKR), category, date and description. Search by title and filter by category or date.
- **Dashboard:** total income, total expenses, remaining balance, savings this month, monthly budget progress and recent transactions. All numbers come from the user's real data.
- **Charts:** spending by category (doughnut chart) and monthly spending (bar chart), made with Chart.js.
- **Budgets:** set a monthly budget and category budgets. A warning appears at 80% used and an alert appears when a budget is exceeded.
- **Smart Saving Assistant:** rule-based tips from the user's own spending (high food or shopping share, low savings rate, budget almost used, weekly spending limit). No paid AI API needed.
- **Reports:** monthly summary, category analysis, income vs expense chart and savings overview.
- **English and Urdu:** language toggle with right-to-left layout for Urdu.
- **Light and dark theme** for the whole app.
- **Responsive design** for desktop, tablet and mobile.
- **Real-time sync:** data is stored in Cloud Firestore and updates automatically.

## Tech stack

HTML5, CSS3, JavaScript (vanilla), Bootstrap 5, Chart.js, Firebase Authentication, Cloud Firestore, Netlify (hosting).

## Project structure

```
spendwise/
├── index.html, login.html, signup.html, dashboard.html,
│   transactions.html, budget.html, reports.html
├── css/style.css
├── js/
│   ├── app.js, dashboard.js, transactions.js        (page scripts)
│   └── firebase/                                    (backend modules)
│       ├── firebase-config.js, auth.js, transactions.js, budget.js,
│       ├── dashboard.js, analytics.js, recommendations.js,
│       └── firebase-bridge.js
├── firestore.rules                                  (security rules)
├── firebase.json
└── SETUP.md                                         (detailed setup guide)
```

## Run it yourself

1. Create a Firebase project, enable **Email/Password** sign-in and create a **Firestore** database.
2. Paste your web app config into `js/firebase/firebase-config.js`.
3. Publish the rules from `firestore.rules` in the Firestore **Rules** tab.
4. Open the project with a local server (for example the VS Code **Live Server** extension). Firebase modules do not load when you open the HTML file by double-clicking it.

Full step-by-step instructions, including deployment, are in [SETUP.md](SETUP.md).

## Security

- Firestore rules allow users to read and change only their own profile, transactions and budgets.
- Transaction amounts must be positive and every field is validated.
- The Firebase web config is a public identifier, not a secret. No service account keys are used in this project.

## Author

**Muhammad Sohaib**

[Portfolio](https://sohaibportfoliowebsite.netlify.app) · [LinkedIn](https://www.linkedin.com/in/muhammad-sohaib-b3978242b/)
