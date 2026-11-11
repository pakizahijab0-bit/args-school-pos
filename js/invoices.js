/* ============ ARGS SCHOOL POS — FEE INVOICES ============ */
function renderInvoices(){
  if(!$('#genMonth').value) $('#genMonth').value = todayYM();
  fillClassSelect($('#genClass'), true);
  fillClassSelect($('#invClassFilter'), true);

  const months = [...new Set(db.invoices.map(i => i.month))].sort().reverse();
  const curM = $('#invMonthFilter').value;
  $('#invMonthFilter').innerHTML = '<option value="All">All Months</option>' + months.map(m => `<option value="${m}">${ymLabel(m)}</option>`).join('');
  $('#invMonthFilter').value = (curM && months.includes(curM)) ? curM : 'All';

  renderInvoicesTable();
}

$('#genBtn').addEventListener('click', () => {
  const month = $('#genMonth').value;
  if(!month){ toast('Month select karein!', 'error'); return; }
  const cls = $('#genClass').value;
  const studs = db.students.filter(s => cls === 'All' || s.class === cls);
  if(!studs.length){ toast('Is class me koi student nahi hai!', 'error'); return; }
  let made = 0, skipped = 0;
  studs.forEach(s => {
    if(db.invoices.some(i => i.studentId === s.id && i.month === month)){ skipped++; return; }
    db.invoices.push({
      id: uid(),
      no: 'INV-' + month.replace('-','') + '-' + String(db.counters.invoice++).padStart(3,'0'),
      studentId: s.id, name: s.name, father: s.father, className: s.class,
      month, amount: s.fee || (db.settings.fees || {})[s.class] || 0,
      status: 'Unpaid', issuedDate: todayYMD(), paidDate: null
    });
    made++;
  });
  saveDB(); renderInvoices();
  toast(made + ' invoice banaye gaye!' + (skipped ? ' (' + skipped + ' pehle se maujood the)' : '') + ' 🧾');
});

['#invSearch','#invMonthFilter','#invClassFilter','#invStatusFilter'].forEach(sel =>
  $(sel).addEventListener('input', renderInvoicesTable));
$('#invStatusFilter').addEventListener('change', renderInvoicesTable);

function filteredInvoices(){
  const q = ($('#invSearch').value || '').toLowerCase().trim();
  const cls = $('#invClassFilter').value || 'All';
  const st = $('#invStatusFilter').value || 'All';
  const mo = $('#invMonthFilter').value || 'All';
  let list = db.invoices.filter(i =>
    (cls === 'All' || i.className === cls) &&
    (st === 'All' || i.status === st) &&
    (mo === 'All' || i.month === mo));
  if(q) list = list.filter(i => (i.name + ' ' + i.no + ' ' + (i.father||'')).toLowerCase().includes(q));
  return list.sort((a,b) => (b.issuedDate||'').localeCompare(a.issuedDate||'') || String(b.no).localeCompare(String(a.no)));
}

function renderInvoicesTable(){
  const list = filteredInvoices();
  const total = list.reduce((s,i) => s + i.amount, 0);
  const paid = list.filter(i => i.status === 'Paid').reduce((s,i) => s + i.amount, 0);

  $('#invSummary').innerHTML =
    `<span class="chip c-blue">Total: ${money(total)}</span>
     <span class="chip c-green">Received: ${money(paid)}</span>
     <span class="chip c-red">Outstanding: ${money(total - paid)}</span>
     <span class="chip c-amber">Invoices: ${list.length}</span>`;

  $('#invoicesBody').innerHTML = list.length ? list.map(i => `
    <tr>
      <td><b>${esc(i.no)}</b></td>
      <td>${esc(i.name)}</td>
      <td><span class="badge badge-blue">${esc(i.className)}</span></td>
      <td>${ymLabel(i.month)}</td>
      <td><b>${money(i.amount)}</b></td>
      <td><span class="badge ${i.status === 'Paid' ? 'badge-green' : 'badge-red'}">${i.status}</span></td>
      <td>${fmtDate(i.issuedDate)}</td>
      <td>${i.paidDate ? fmtDate(i.paidDate) : '—'}</td>
      <td>
        ${i.status !== 'Paid' ? `<button class="mini-btn pay" data-paid="${i.id}">💵 Mark Paid</button>` : ''}
        <button class="mini-btn" data-print="${i.id}">🖨️ Print</button>
        <button class="mini-btn del" data-del="${i.id}">🗑️</button>
      </td>
    </tr>`).join('') : emptyRow(9, 'Koi invoice nahi mila. Upar Generate se mahine ki fees banaein.');
}

$('#invoicesBody').addEventListener('click', e => {
  const btn = e.target.closest('button'); if(!btn) return;
  if(btn.dataset.paid){
    const inv = db.invoices.find(i => i.id === btn.dataset.paid);
    if(inv){
      inv.status = 'Paid'; inv.paidDate = todayYMD();
      saveDB(); renderInvoicesTable();
      toast(`${inv.name} ki fees wasool ho gayi! 💵`);
    }
  }
  if(btn.dataset.print){
    const inv = db.invoices.find(i => i.id === btn.dataset.print);
    if(inv) printDoc(buildInvoice(inv));
  }
  if(btn.dataset.del){
    const inv = db.invoices.find(i => i.id === btn.dataset.del);
    if(inv && confirm(`Invoice ${inv.no} (${inv.name}) delete karna hai?`)){
      db.invoices = db.invoices.filter(i => i.id !== inv.id);
      saveDB(); renderInvoicesTable(); toast('Invoice delete ho gaya.', 'info');
    }
  }
});

function buildInvoice(i){
  return `<div class="print-doc">
    <div class="pd-head">
      <div class="pd-school">${esc(db.settings.schoolName)} SCHOOL</div>
      <div class="pd-sub">${esc(db.settings.address || '')}${db.settings.phone ? ' | Tel: ' + esc(db.settings.phone) : ''}</div>
      <div class="pd-title">FEE INVOICE</div>
    </div>
    <div class="inv-meta">
      <span><b>Invoice #:</b> ${esc(i.no)}</span>
      <span><b>Date:</b> ${fmtDate(i.issuedDate)}</span>
      <span><b>Fee Month:</b> ${ymLabel(i.month)}</span>
      <span><b>Status:</b> ${i.status}</span>
    </div>
    <table class="pd-info">
      <tr><td><b>Student:</b> ${esc(i.name)}</td><td><b>Father:</b> ${esc(i.father || '—')}</td><td><b>Class:</b> ${esc(i.className)}</td></tr>
    </table>
    <table class="pd-table">
      <thead><tr><th>Description</th><th>Period</th><th>Amount</th></tr></thead>
      <tbody><tr><td>Monthly Tuition Fee</td><td>${ymLabel(i.month)}</td><td>${money(i.amount)}</td></tr></tbody>
      <tfoot><tr><th colspan="2">TOTAL PAYABLE</th><th>${money(i.amount)}</th></tr></tfoot>
    </table>
    ${i.status === 'Paid'
      ? `<div class="stamp paid">PAID<br><small style="font-size:11px;letter-spacing:1px">${fmtDate(i.paidDate)}</small></div>`
      : '<div class="stamp unpaid">UNPAID</div>'}
    <p style="font-size:11.5px;color:#555;text-align:center;margin-top:16px;">Fees must be paid before the 10th of every month. Shukriya!</p>
    <div class="pd-sign"><span>Accountant</span><span>Principal — ${esc(db.settings.principal || '')}</span></div>
  </div>`;
}
