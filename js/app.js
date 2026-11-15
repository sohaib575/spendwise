/* ===== SpendWise core: storage, language, layout, auth, helpers =====
   To add Firebase later, replace the DB object and the auth code below. */
const CATS = ['Food','Transport','Shopping','Education','Bills','Health','Entertainment','Other'];
const $ = id => document.getElementById(id);
const store = {
  get(k, d){ try { return JSON.parse(localStorage.getItem('sw_' + k)) ?? d; } catch(e){ return d; } },
  set(k, v){ localStorage.setItem('sw_' + k, JSON.stringify(v)); }
};
const DB = {  // single place for data access. Browser storage by default; firebase-bridge.js swaps these for Firestore.
  tx: () => store.get('tx', []),
  addTx: item => store.set('tx', [...DB.tx(), {id: Date.now(), ...item}]),
  addTxs: rows => store.set('tx', [...DB.tx(), ...rows.map((r, i) => ({id: Date.now() + i, ...r}))]),
  updateTx: (id, item) => store.set('tx', DB.tx().map(x => String(x.id) === String(id) ? {...item, id: x.id} : x)),
  deleteTx: id => store.set('tx', DB.tx().filter(x => String(x.id) !== String(id))),
  budget: () => store.get('budget', {monthly: 0, cats: {}}),
  saveBudget: b => store.set('budget', b)
};
window.DB = DB;
/* ---------- Helpers ---------- */
const todayISO = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => todayISO().slice(0, 7);
const fmt = n => 'PKR ' + Math.round(n).toLocaleString('en-PK');
const sum = a => a.reduce((s, t) => s + t.amount, 0);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const barClass = p => p > 100 ? 'bad' : p >= 80 ? 'warn' : '';
const catOptions = all => (all ? '<option value="" data-i18n="all_cats"></option>' : '') +
  CATS.map(c => `<option value="${c}" data-i18n="cat_${c}"></option>`).join('');
function lastMonths(n){  // e.g. ['2026-06', ... , '2026-11']
  const out = [], d = new Date(); d.setDate(1);
  for (let i = n - 1; i >= 0; i--){ const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')); }
  return out;
}
const monthLabel = m => new Date(m + '-01').toLocaleString(store.get('lang','en') === 'ur' ? 'ur-PK' : 'en', {month: 'short'});
function toast(msg, ms = 2500){
  const el = document.createElement('div'); el.className = 'sw-toast'; el.textContent = msg;
  document.body.appendChild(el); setTimeout(() => el.remove(), ms);
}
/* ---------- Translations (English / Urdu) ---------- */
const T = {
en: {nav_dashboard:'Dashboard',nav_transactions:'Transactions',nav_budget:'Budget',nav_reports:'Reports',logout:'Log out',login:'Log in',signup:'Sign up',start:'Get started',
 hero_title:'Track Your Money, Control Your Future.',hero_sub:'SpendWise helps students and individuals record income and expenses, stay within budgets and build real savings habits.',
 feat_title:'Everything you need to manage your money',f1_t:'Track every rupee',f1_d:'Log income and expenses in PKR with categories, dates and notes.',f2_t:'Budgets that warn you',f2_d:'Set monthly and category budgets and get alerts at 80% and when you go over.',f3_t:'Smart saving tips',f3_d:'Personalised suggestions based on your own spending, with no paid AI needed.',f4_t:'Clear reports',f4_d:'See where your money goes with charts, summaries and savings overview.',foot:'© 2026 SpendWise. Built for students and individuals.',
 email:'Email',password:'Password',name:'Full name',confirm:'Confirm password',login_title:'Welcome back',signup_title:'Create your account',no_account:'New here?',have_account:'Already have an account?',
 e_email:'Enter a valid email address.',e_pw:'Password must be at least 6 characters.',e_name:'Enter your name.',e_match:'Passwords do not match.',e_bad:'Incorrect email or password.',e_exists:'An account with this email already exists.',forgot:'Forgot password?',wait:'Please wait…',reset_sent:'If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.',e_fb:'Password reset needs Firebase. Open the site with Live Server.',
 dash_title:'Dashboard',income:'Total Income',expenses:'Total Expenses',balance:'Remaining Balance',savings:'Saved This Month',budget_prog:'Monthly Budget Progress',no_budget:'No monthly budget yet.',set_budget:'Set a budget',recent:'Recent Transactions',cat_chart:'Spending by Category (this month)',month_chart:'Monthly Spending',tips_title:'Smart Saving Assistant',no_data:'No data yet.',demo:'Load demo data',view_all:'View all',of:'of',
 tip_start:'Add your first transactions and I will suggest ways to save.',tip_food:'Your food expenses are higher this month ({n}% of spending). Try cooking at home more often.',tip_shop:'Try reducing unnecessary shopping expenses. They are {n}% of this month’s spending.',tip_weekly:'You can improve your savings by setting a weekly spending limit of about {n}.',tip_rate:'You are saving less than 20% of your income this month. Aim to save at least a fifth.',tip_b80:'You have used over 80% of your monthly budget. Slow down on non-essentials.',tip_over:'You have gone over your monthly budget. Pause optional spending until next month.',tip_ok:'Great work. Your spending looks balanced this month.',
 tx_title:'Transactions',add_tx:'Add Transaction',edit_tx:'Edit Transaction',title:'Title',amount:'Amount (PKR)',type:'Type',t_income:'Income',t_expense:'Expense',category:'Category',date:'Date',desc:'Description',save:'Save changes',cancel:'Cancel',search:'Search by title…',all_cats:'All categories',actions:'Actions',no_tx:'No transactions match.',confirm_del:'Delete this transaction?',added:'Transaction added.',updated:'Transaction updated.',deleted:'Transaction deleted.',e_req:'Please fill in this field.',e_amt:'Enter an amount greater than 0.',clear:'Clear filters',history:'Transaction History',
 budget_title:'Budget Management',monthly_budget:'Monthly budget (PKR)',cat_budgets:'Category budgets (PKR)',save_budget:'Save budgets',saved:'Budgets saved.',used:'used',warn80:'You have used {p}% of this budget.',exceeded:'Budget exceeded by {n}.',e_neg:'Enter 0 or a positive number.',progress:'Budget Progress',
 reports_title:'Reports & Analytics',month:'Month',rate:'Savings rate',net:'Net savings',ie_chart:'Income vs Expense (6 months)',sav_chart:'Savings Overview',cat_analysis:'Category Analysis',share:'Share',total_saved:'All-time savings',
 cat_Food:'Food',cat_Transport:'Transport',cat_Shopping:'Shopping',cat_Education:'Education',cat_Bills:'Bills',cat_Health:'Health',cat_Entertainment:'Entertainment',cat_Other:'Other'},
ur: {nav_dashboard:'ڈیش بورڈ',nav_transactions:'لین دین',nav_budget:'بجٹ',nav_reports:'رپورٹس',logout:'لاگ آؤٹ',login:'لاگ اِن',signup:'سائن اپ',start:'شروع کریں',
 hero_title:'اپنے پیسوں کا حساب رکھیں، اپنا مستقبل سنواریں۔',hero_sub:'اسپینڈوائز طلبہ اور عام افراد کو آمدنی اور اخراجات درج کرنے، بجٹ میں رہنے اور بچت کی عادت بنانے میں مدد دیتا ہے۔',
 feat_title:'پیسوں کے انتظام کے لیے سب کچھ',f1_t:'ہر روپے کا حساب',f1_d:'آمدنی اور اخراجات روپوں میں، زمرے اور تاریخ کے ساتھ درج کریں۔',f2_t:'خبردار کرنے والا بجٹ',f2_d:'ماہانہ اور زمرہ وار بجٹ بنائیں، 80٪ اور حد پار ہونے پر الرٹ پائیں۔',f3_t:'بچت کے اسمارٹ مشورے',f3_d:'آپ کے اپنے اخراجات کی بنیاد پر مشورے، بغیر کسی پیڈ اے آئی کے۔',f4_t:'واضح رپورٹس',f4_d:'چارٹس اور خلاصوں سے دیکھیں کہ پیسے کہاں جاتے ہیں۔',foot:'© 2026 اسپینڈوائز۔ طلبہ اور افراد کے لیے۔',
 email:'ای میل',password:'پاس ورڈ',name:'پورا نام',confirm:'پاس ورڈ کی تصدیق',login_title:'خوش آمدید',signup_title:'اپنا اکاؤنٹ بنائیں',no_account:'نئے ہیں؟',have_account:'پہلے سے اکاؤنٹ ہے؟',
 e_email:'درست ای میل درج کریں۔',e_pw:'پاس ورڈ کم از کم 6 حروف کا ہو۔',e_name:'اپنا نام درج کریں۔',e_match:'پاس ورڈ مماثل نہیں ہیں۔',e_bad:'ای میل یا پاس ورڈ غلط ہے۔',e_exists:'اس ای میل سے اکاؤنٹ پہلے سے موجود ہے۔',forgot:'پاس ورڈ بھول گئے؟',wait:'براہ کرم انتظار کریں…',reset_sent:'اگر اس ای میل سے اکاؤنٹ موجود ہے تو پاس ورڈ ری سیٹ کا لنک بھیج دیا گیا ہے۔ اپنا ان باکس اور اسپام فولڈر دیکھیں۔',e_fb:'پاس ورڈ ری سیٹ کے لیے فائربیس ضروری ہے۔ سائٹ کو لائیو سرور سے کھولیں۔',
 dash_title:'ڈیش بورڈ',income:'کل آمدنی',expenses:'کل اخراجات',balance:'باقی رقم',savings:'اس ماہ کی بچت',budget_prog:'ماہانہ بجٹ کی پیش رفت',no_budget:'ابھی ماہانہ بجٹ نہیں بنا۔',set_budget:'بجٹ بنائیں',recent:'حالیہ لین دین',cat_chart:'زمرہ وار اخراجات (اس ماہ)',month_chart:'ماہانہ اخراجات',tips_title:'اسمارٹ بچت اسسٹنٹ',no_data:'ابھی کوئی ڈیٹا نہیں۔',demo:'ڈیمو ڈیٹا لوڈ کریں',view_all:'سب دیکھیں',of:'از',
 tip_start:'اپنا پہلا لین دین شامل کریں، پھر میں بچت کے مشورے دوں گا۔',tip_food:'اس ماہ کھانے کے اخراجات زیادہ ہیں (کل کا {n}٪)۔ گھر پر کھانا پکانے کی کوشش کریں۔',tip_shop:'غیر ضروری خریداری کم کریں۔ یہ اس ماہ کے اخراجات کا {n}٪ ہے۔',tip_weekly:'ہفتہ وار خرچ کی حد تقریباً {n} مقرر کر کے بچت بہتر بنائیں۔',tip_rate:'اس ماہ آپ آمدنی کا 20٪ سے کم بچا رہے ہیں۔ کم از کم پانچواں حصہ بچانے کی کوشش کریں۔',tip_b80:'آپ ماہانہ بجٹ کا 80٪ سے زیادہ خرچ کر چکے ہیں۔ غیر ضروری خرچ کم کریں۔',tip_over:'آپ ماہانہ بجٹ سے زیادہ خرچ کر چکے ہیں۔ اختیاری خرچ روک دیں۔',tip_ok:'شاباش! اس ماہ آپ کے اخراجات متوازن ہیں۔',
 tx_title:'لین دین',add_tx:'لین دین شامل کریں',edit_tx:'لین دین میں ترمیم',title:'عنوان',amount:'رقم (روپے)',type:'قسم',t_income:'آمدنی',t_expense:'خرچ',category:'زمرہ',date:'تاریخ',desc:'تفصیل',save:'تبدیلیاں محفوظ کریں',cancel:'منسوخ',search:'عنوان سے تلاش کریں…',all_cats:'تمام زمرے',actions:'عمل',no_tx:'کوئی لین دین نہیں ملا۔',confirm_del:'کیا یہ لین دین حذف کریں؟',added:'لین دین شامل ہو گیا۔',updated:'لین دین اپڈیٹ ہو گیا۔',deleted:'لین دین حذف ہو گیا۔',e_req:'یہ خانہ پُر کریں۔',e_amt:'0 سے زیادہ رقم درج کریں۔',clear:'فلٹر ہٹائیں',history:'لین دین کی تاریخ',
 budget_title:'بجٹ کا انتظام',monthly_budget:'ماہانہ بجٹ (روپے)',cat_budgets:'زمرہ وار بجٹ (روپے)',save_budget:'بجٹ محفوظ کریں',saved:'بجٹ محفوظ ہو گیا۔',used:'استعمال',warn80:'آپ اس بجٹ کا {p}٪ استعمال کر چکے ہیں۔',exceeded:'بجٹ {n} سے تجاوز کر گیا۔',e_neg:'0 یا مثبت عدد درج کریں۔',progress:'بجٹ کی پیش رفت',
 reports_title:'رپورٹس اور تجزیہ',month:'مہینہ',rate:'بچت کی شرح',net:'خالص بچت',ie_chart:'آمدنی بمقابلہ خرچ (6 ماہ)',sav_chart:'بچت کا جائزہ',cat_analysis:'زمرہ وار تجزیہ',share:'حصہ',total_saved:'کل بچت',
 cat_Food:'کھانا',cat_Transport:'سفر',cat_Shopping:'خریداری',cat_Education:'تعلیم',cat_Bills:'بل',cat_Health:'صحت',cat_Entertainment:'تفریح',cat_Other:'دیگر'}
};
const t = (k, p = {}) => (T[store.get('lang','en')][k] ?? T.en[k] ?? k).replace(/\{(\w+)\}/g, (_, x) => p[x]);
function applyLang(){
  const l = store.get('lang', 'en');
  document.documentElement.lang = l; document.documentElement.dir = l === 'ur' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => e.textContent = t(e.dataset.i18n));
  document.querySelectorAll('[data-i18n-ph]').forEach(e => e.placeholder = t(e.dataset.i18nPh));
  document.querySelectorAll('.lang-btn').forEach(b => b.textContent = l === 'ur' ? 'English' : 'اردو');
  document.dispatchEvent(new Event('langchange'));  // pages re-draw charts and tables
}
/* ---------- Light / dark theme (saved in localStorage) ---------- */
function applyTheme(){
  const th = store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = th; document.documentElement.dataset.bsTheme = th;  // bsTheme styles Bootstrap inputs
  document.querySelectorAll('.theme-btn').forEach(b => b.innerHTML = `<i class="bi bi-${th === 'dark' ? 'sun' : 'moon-stars'}"></i>`);
  if (window.Chart){  // make chart text, grid lines and slice borders match the theme
    const s = getComputedStyle(document.documentElement), v = n => s.getPropertyValue(n).trim();
    Chart.defaults.color = v('--mut'); Chart.defaults.borderColor = v('--line'); Chart.defaults.elements.arc.borderColor = v('--card');
  }
}
/* ---------- Smart Saving Assistant (rule-based, no AI API) ---------- */
function getTips(){
  const m = thisMonth(), tx = DB.tx().filter(x => x.date.startsWith(m)), b = DB.budget();
  if (!tx.length) return [{i:'bi-lightbulb', k:'tip_start'}];
  const exp = tx.filter(x => x.type === 'expense'), inc = sum(tx.filter(x => x.type === 'income')), tot = sum(exp);
  const share = c => tot ? Math.round(sum(exp.filter(x => x.category === c)) / tot * 100) : 0, tips = [];
  if (share('Food') > 35) tips.push({i:'bi-egg-fried', k:'tip_food', p:{n:share('Food')}});
  if (share('Shopping') > 20) tips.push({i:'bi-bag', k:'tip_shop', p:{n:share('Shopping')}});
  if (b.monthly && tot > b.monthly) tips.push({i:'bi-exclamation-octagon', k:'tip_over'});
  else if (b.monthly && tot >= b.monthly * .8) tips.push({i:'bi-exclamation-triangle', k:'tip_b80'});
  if (inc && (inc - tot) / inc < .2) tips.push({i:'bi-piggy-bank', k:'tip_rate'});
  tips.push({i:'bi-calendar-week', k:'tip_weekly', p:{n:fmt((b.monthly || tot) / 4.3)}});
  if (tips.length === 1) tips.unshift({i:'bi-check-circle', k:'tip_ok'});
  return tips;
}
/* ---------- App shell: sidebar + top bar ---------- */
function buildShell(){
  const sb = $('sidebar'); if (!sb) return;
  const nav = [['dashboard','bi-grid'],['transactions','bi-arrow-left-right'],['budget','bi-piggy-bank'],['reports','bi-bar-chart']];
  sb.innerHTML = '<a class="brand" href="index.html"><i class="bi bi-wallet2"></i>SpendWise</a>' + nav.map(([p, ic]) =>
    `<a class="nav-l ${document.body.dataset.page === p ? 'active' : ''}" href="${p}.html"><i class="bi ${ic}"></i><span data-i18n="nav_${p}"></span></a>`).join('');
  $('topbar').innerHTML = `<button class="menu-btn" id="menuBtn" aria-label="Menu"><i class="bi bi-list"></i></button>
    <span class="grow">${esc((store.get('session', {}).name) || '')}</span>
    <button class="btn-soft theme-btn" aria-label="Theme"></button><button class="btn-soft lang-btn"></button><button class="btn-soft" id="logout"><i class="bi bi-box-arrow-right"></i><span data-i18n="logout"></span></button>`;
  $('menuBtn').onclick = () => sb.classList.toggle('open');
  $('logout').onclick = async () => {
    window.swLoggingOut = true;              // tells firebase-bridge.js not to redirect to login
    localStorage.removeItem('sw_session');   // logged out of the app right away
    try { if (window.SW) await Promise.race([SW.logoutUser(), new Promise(r => setTimeout(r, 1500))]); } catch (e) {}
    location.replace('index.html');          // first page. replace: the Back button will not bring the dashboard back
  };
}
/* ---------- Login / Signup (local only; replace with Firebase Auth) ---------- */
function initAuth(){
  const f = $('authForm'); if (!f) return;
  if (store.get('session')) { location.replace('dashboard.html'); return; }
  const signup = f.dataset.mode === 'signup';
  document.querySelectorAll('.pw-toggle').forEach(b => b.onclick = () => {
    const i = b.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password';
    b.firstElementChild.className = i.type === 'password' ? 'bi bi-eye' : 'bi bi-eye-slash';
  });
  const forgot = $('forgotLink');   // "Forgot password?" link (login page only)
  if (forgot) forgot.onclick = async e => {
    e.preventDefault();
    const email = f.elements.email.value.trim(), msg = $('resetMsg');
    const say = (text, ok) => { msg.textContent = text; msg.style.color = ok ? 'var(--green-d)' : ''; };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say(t('e_email'), false); f.elements.email.focus(); return; }
    if (!window.SW) return say(t('e_fb'), false);
    say(t('wait'), true);
    try { await SW.resetPassword(email); say(t('reset_sent'), true); }
    catch (err) { say(err.message, false); }
  };
  f.onsubmit = async e => {
    e.preventDefault(); let ok = true;
    const v = n => f.elements[n] ? f.elements[n].value.trim() : '';
    const err = (id, k) => { f.querySelector(`[data-err="${id}"]`).textContent = k ? t(k) : ''; if (k) ok = false; };
    err('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')) ? '' : 'e_email');
    err('password', v('password').length >= 6 ? '' : 'e_pw');
    if (signup){ err('name', v('name') ? '' : 'e_name'); err('confirm', v('confirm') === v('password') ? '' : 'e_match'); }
    if (!ok) return;
    if (window.SW){  // Firebase mode (firebase-bridge.js is loaded)
      const btn = f.querySelector('[type=submit]'), slot = f.querySelector(`[data-err="${signup ? 'email' : 'password'}"]`);
      const label = btn.textContent; btn.disabled = true; btn.textContent = t('wait');   // show progress straight away
      try {
        const u = signup ? await SW.signupUser(v('name'), v('email'), v('password')) : await SW.loginUser(v('email'), v('password'));
        store.set('session', {name: u.displayName || v('name'), email: u.email}); location.replace('dashboard.html');
      } catch (e) { slot.textContent = e.message; btn.disabled = false; btn.textContent = label; }
      return;
    }
    const users = store.get('users', []), email = v('email').toLowerCase();
    if (signup){
      if (users.some(u => u.email === email)) return err('email', 'e_exists');
      users.push({name: v('name'), email, password: v('password')}); store.set('users', users);
      store.set('session', {name: v('name'), email});
    } else {
      const u = users.find(u => u.email === email && u.password === v('password'));
      if (!u) return err('password', 'e_bad');
      store.set('session', {name: u.name, email});
    }
    location.replace('dashboard.html');
  };
}
/* ---------- Start-up ---------- */
if (location.protocol === 'file:') console.info('SpendWise: open the site with Live Server (http://) so Firebase can load.');
if (document.body.dataset.page && !store.get('session')) location.replace('login.html');  // protect app pages
/* On phones: tapping outside the open menu closes it */
document.addEventListener('click', e => {
  const sb = $('sidebar');
  if (sb && sb.classList.contains('open') && !e.target.closest('#sidebar, #menuBtn')) sb.classList.remove('open');
});
/* Links between app pages REPLACE the current history entry (instead of adding one),
   so after logout the Back button does not walk through every page you visited. */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href]');
  if (!a || !document.body.dataset.page || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
  if (/^(dashboard|transactions|budget|reports)\.html$/.test(a.getAttribute('href'))) { e.preventDefault(); location.replace(a.getAttribute('href')); }
});
window.addEventListener('pageshow', e => {  // Back button can show an old copy of a page: send logged-out visitors to login
  if (e.persisted && document.body.dataset.page && !store.get('session')) location.replace('login.html');
});
document.addEventListener('click', e => {
  if (e.target.closest('.theme-btn')){ store.set('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'); applyTheme(); document.dispatchEvent(new Event('langchange')); }  // langchange redraws charts
  if (e.target.closest('.lang-btn')){ store.set('lang', store.get('lang','en') === 'en' ? 'ur' : 'en'); applyLang(); }
});
applyTheme();  // apply saved theme straight away
document.addEventListener('DOMContentLoaded', () => { buildShell(); initAuth(); applyTheme(); applyLang(); });
