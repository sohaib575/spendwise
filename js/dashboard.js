/* ===== Dashboard: stats, budget progress, charts, tips ===== */
let pie, bar;
const COLORS = ['#12B76A','#5B7BA8','#6CE9A6','#3E7BFA','#F79009','#3E7BFA','#A6B4C8','#067647'];
function render(){
  const all = DB.tx(), m = thisMonth(), b = DB.budget();
  const inc = sum(all.filter(x => x.type === 'income')), exp = sum(all.filter(x => x.type === 'expense'));
  const mt = all.filter(x => x.date.startsWith(m)), mInc = sum(mt.filter(x => x.type === 'income'));
  const mExpList = mt.filter(x => x.type === 'expense'), mExp = sum(mExpList);
  $('sIncome').textContent = fmt(inc); $('sExpense').textContent = fmt(exp);
  $('sBalance').textContent = fmt(inc - exp); $('sSaved').textContent = fmt(Math.max(0, mInc - mExp));
  // Monthly budget progress
  const bp = $('budgetBox');
  if (!b.monthly) bp.innerHTML = `<p class="text-secondary">${t('no_budget')}</p><a class="btn-g" href="budget.html">${t('set_budget')}</a>`;
  else {
    const p = mExp / b.monthly * 100;
    bp.innerHTML = `<div class="d-flex justify-content-between mb-2"><b>${fmt(mExp)}</b><span>${t('of')} ${fmt(b.monthly)}</span></div>
      <div class="bar"><i class="${barClass(p)}" style="width:${Math.min(p, 100)}%"></i></div>
      <small>${Math.round(p)}% ${t('used')}</small>` +
      (p > 100 ? `<div class="note bad">${t('exceeded', {n: fmt(mExp - b.monthly)})}</div>` : p >= 80 ? `<div class="note warn">${t('warn80', {p: Math.round(p)})}</div>` : '');
  }
  // Recent transactions
  const rec = [...all].sort((a, c) => c.date.localeCompare(a.date) || c.id - a.id).slice(0, 5);
  $('recent').innerHTML = rec.length ? rec.map(x => `<tr><td>${x.date}</td><td>${esc(x.title)}</td><td><span class="chip">${t('cat_' + x.category)}</span></td>
    <td class="${x.type === 'income' ? 'inc' : 'exp'}">${x.type === 'income' ? '+' : '−'}${fmt(x.amount)}</td></tr>`).join('')
    : `<tr><td colspan="4" class="empty">${t('no_data')}<br><button class="btn-soft mt-2" id="demoBtn">${t('demo')}</button></td></tr>`;
  if ($('demoBtn')) $('demoBtn').onclick = seedDemo;
  // Tips
  $('tips').innerHTML = getTips().map(x => `<div class="tip"><i class="bi ${x.i}"></i><span>${t(x.k, x.p)}</span></div>`).join('');
  // Charts
  Chart.defaults.font.family = 'Manrope, Noto Naskh Arabic, sans-serif';
  const cats = CATS.filter(c => mExpList.some(x => x.category === c));
  if (pie) pie.destroy(); if (bar) bar.destroy();
  pie = new Chart($('pieChart'), {type: 'doughnut', data: {labels: cats.map(c => t('cat_' + c)),
    datasets: [{data: cats.map(c => sum(mExpList.filter(x => x.category === c))), backgroundColor: COLORS}]},
    options: {maintainAspectRatio: false, plugins: {legend: {position: 'bottom'}}}});
  const months = lastMonths(6);
  bar = new Chart($('barChart'), {type: 'bar', data: {labels: months.map(monthLabel),
    datasets: [{label: t('expenses'), data: months.map(k => sum(all.filter(x => x.type === 'expense' && x.date.startsWith(k)))), backgroundColor: '#12B76A', borderRadius: 8}]},
    options: {maintainAspectRatio: false, plugins: {legend: {display: false}}}});
}
/* Fills the app with sample data so the dashboard can be demonstrated quickly */
async function seedDemo(){
  const day = (back, d) => { const x = new Date(); x.setHours(12); x.setMonth(x.getMonth() - back, back ? d : Math.min(d, x.getDate())); return x.toISOString().slice(0, 10); };
  const rows = [];
  for (let back = 0; back < 3; back++) [
    ['Monthly allowance','income','Other',60000,1],['Groceries','expense','Food',back ? 8000 : 17000,5],['Bus pass','expense','Transport',3500,7],
    ['Clothes','expense','Shopping',back ? 4000 : 11000,12],['Course fee','expense','Education',8000,15],['Electricity bill','expense','Bills',5500,18],
    ['Pharmacy','expense','Health',1800,20],['Movie night','expense','Entertainment',2500,24]
  ].forEach(([title, type, category, amount, d]) => rows.push({title, type, category, amount, date: day(back, d), description: ''}));
  try {
    await DB.addTxs(rows);
    if (!DB.budget().monthly) await DB.saveBudget({monthly: 45000, cats: {Food: 12000, Shopping: 6000, Transport: 4000}});
  } catch (err) { toast(err.message); return; }
  render(); toast('✓');
}
document.addEventListener('langchange', render);
