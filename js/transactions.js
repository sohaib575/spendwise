/* ===== Transactions: add, edit, delete, search and filter ===== */
const form = $('txForm'); let editId = null;
function setMode(){  // switch the form between "add" and "edit"
  $('formTitle').dataset.i18n = editId ? 'edit_tx' : 'add_tx'; $('formTitle').textContent = t(editId ? 'edit_tx' : 'add_tx');
  $('saveBtn').querySelector('span').dataset.i18n = editId ? 'save' : 'add_tx'; $('saveBtn').querySelector('span').textContent = t(editId ? 'save' : 'add_tx');
  $('cancelEdit').classList.toggle('d-none', !editId);
}
function resetForm(){ form.reset(); form.classList.remove('was-validated'); form.date.value = todayISO(); editId = null; setMode(); }
form.addEventListener('submit', async e => {
  e.preventDefault(); form.classList.add('was-validated');
  if (!form.checkValidity() || !(parseFloat(form.amount.value) > 0)) return;  // validation
  const item = {title: form.elements.ttl.value.trim(), amount: parseFloat(form.amount.value), type: form.type.value,
    category: form.category.value, date: form.date.value, description: form.description.value.trim()};
  try { if (editId) await DB.updateTx(editId, item); else await DB.addTx(item); }
  catch (err) { toast(err.message); return; }
  toast(t(editId ? 'updated' : 'added')); resetForm(); draw();
});
$('cancelEdit').onclick = resetForm;
['fSearch', 'fCat', 'fDate'].forEach(id => $(id).addEventListener('input', draw));
$('fClear').onclick = () => { $('fSearch').value = ''; $('fCat').value = ''; $('fDate').value = ''; draw(); };
function draw(){
  const q = $('fSearch').value.toLowerCase(), c = $('fCat').value, d = $('fDate').value;
  const list = DB.tx().filter(x => (!q || x.title.toLowerCase().includes(q)) && (!c || x.category === c) && (!d || x.date === d))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  $('txBody').innerHTML = list.length ? list.map(x => `<tr><td>${x.date}</td>
    <td><b>${esc(x.title)}</b><br><small class="text-secondary">${esc(x.description)}</small></td>
    <td><span class="chip">${t('cat_' + x.category)}</span></td>
    <td class="${x.type === 'income' ? 'inc' : 'exp'}">${x.type === 'income' ? '+' : '−'}${fmt(x.amount)}</td>
    <td><button class="ib" data-edit="${x.id}" aria-label="Edit"><i class="bi bi-pencil"></i></button>
    <button class="ib del" data-del="${x.id}" aria-label="Delete"><i class="bi bi-trash"></i></button></td></tr>`).join('')
    : `<tr><td colspan="5" class="empty">${t('no_tx')}</td></tr>`;
}
$('txBody').addEventListener('click', async e => {
  const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
  if (ed){
    const x = DB.tx().find(r => String(r.id) === ed.dataset.edit); editId = x.id;
    form.elements.ttl.value = x.title; form.amount.value = x.amount; form.type.value = x.type;
    form.category.value = x.category; form.date.value = x.date; form.description.value = x.description;
    setMode(); form.scrollIntoView({behavior: 'smooth'});
  }
  if (del && confirm(t('confirm_del'))){ try { await DB.deleteTx(del.dataset.del); toast(t('deleted')); draw(); } catch (err) { toast(err.message); } }
});
// Fill category dropdowns once, then let the language system translate them
form.category.innerHTML = catOptions(false); $('fCat').innerHTML = catOptions(true); form.date.value = todayISO();
document.addEventListener('langchange', () => { setMode(); draw(); });
