/* ============ ARGS SCHOOL POS — EXPENSES ============ */
function renderExpenses(){
  fillSelect($('#expCat'), EXP_CATS);
  if(!$('#expDate').value) $('#expDate').value = todayYMD();
  renderExpensesTable();
}

$('#expForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  db.expenses.push({
    id: uid(),
    title: f.get('title').trim(),
    category: f.get('category'),
    amount: Number(f.get('amount')) || 0,
    date: f.get('date'),
    note: (f.get('note') || '').trim()
  });
  saveDB();
  e.target.reset();
  $('#expDate').value = todayYMD();
  fillSelect($('#expCat'), EXP_CATS);
  renderExpensesTable();
  toast('Expense add ho gaya! 💸');
});

function renderExpensesTable(){
  const ym = todayYM();
  const monthTotal = db.expenses.filter(x => String(x.date).startsWith(ym)).reduce((s,x) => s + x.amount, 0);
  const allTotal = db.expenses.reduce((s,x) => s + x.amount, 0);
  $('#expMonthChip').textContent = 'This Month: ' + money(monthTotal);
  $('#expAllChip').textContent = 'All Time: ' + money(allTotal);

  const list = [...db.expenses].sort((a,b) => (b.date||'').localeCompare(a.date||''));
  $('#expensesBody').innerHTML = list.length ? list.map(x => `
    <tr>
      <td>${fmtDate(x.date)}</td>
      <td><b>${esc(x.title)}</b></td>
      <td><span class="badge badge-orange">${esc(x.category)}</span></td>
      <td>${esc(x.note || '—')}</td>
      <td><b>${money(x.amount)}</b></td>
      <td><button class="mini-btn del" data-del="${x.id}">🗑️ Delete</button></td>
    </tr>`).join('') : emptyRow(6, 'Koi expense record nahi hai.');
}

$('#expensesBody').addEventListener('click', e => {
  const btn = e.target.closest('button'); if(!btn) return;
  const x = db.expenses.find(y => y.id === btn.dataset.del);
  if(x && confirm(`"${x.title}" expense delete karna hai?`)){
    db.expenses = db.expenses.filter(y => y.id !== x.id);
    saveDB(); renderExpensesTable(); toast('Expense delete ho gaya.', 'info');
  }
});
