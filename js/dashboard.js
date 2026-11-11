/* ============ ARGS SCHOOL POS — DASHBOARD ============ */
function statCard(cls, icon, label, value, sub){
  return `<div class="stat-card ${cls}">
    <div class="stat-ico">${icon}</div>
    <div class="stat-label">${label}</div>
    <div class="big">${value}</div>
    <div class="stat-sub">${sub}</div>
  </div>`;
}

function renderDashboard(){
  const ym = todayYM();

  const collected = db.invoices.filter(i => i.month === ym && i.status === 'Paid').reduce((s,i) => s + i.amount, 0);
  const pending  = db.invoices.filter(i => i.month === ym && i.status !== 'Paid').reduce((s,i) => s + i.amount, 0);
  const expMonth = db.expenses.filter(e => String(e.date).startsWith(ym)).reduce((s,e) => s + e.amount, 0);

  const todayAtt = db.attendance[todayYMD()] || {};
  let present = 0, marked = 0;
  Object.values(todayAtt).forEach(cls => Object.values(cls).forEach(st => { marked++; if(st === 'P') present++; }));

  const feesSet = db.settings.fees || {};
  const avgFee = db.students.length ? Math.round(db.students.reduce((s,x) => s + (x.fee||0), 0) / db.students.length) : 0;

  $('#dashGreeting').innerHTML =
    `👋 Welcome to <b>${esc(db.settings.schoolName)}</b> — Session ${esc(db.settings.session)} &nbsp;|&nbsp; 🏫 Nursery to Matric`;

  $('#statCards').innerHTML =
    statCard('c1',  '🎓', 'Total Students', db.students.length, 'Nursery se Matric tak') +
    statCard('c2x', '👨‍🏫', 'Total Staff', db.staff.length, 'School staff members') +
    statCard('c3x', '💰', 'This Month Collection', money(collected), ymLabel(ym) + ' ki wasooli') +
    statCard('c4x', '⏳', 'Pending Dues', money(pending), 'Is mahine baqi fees') +
    statCard('c5x', '💸', 'This Month Expenses', money(expMonth), ymLabel(ym) + ' ke kharche') +
    statCard('c6x', '✅', 'Present Today', marked ? present + '/' + marked : '—', marked ? Math.round(present/marked*100) + '% attendance' : 'Aaj attendance nahi li');

  renderCharts();
  renderRecentLists();
}

function renderCharts(){
  const counts = {};
  CLASSES.forEach(c => counts[c] = 0);
  db.students.forEach(s => { if(counts[s.class] !== undefined) counts[s.class]++; });
  const mx = Math.max(...Object.values(counts), 1);
  $('#chartStudents').innerHTML = CLASSES.map(c =>
    `<div class="bar-row"><span class="bar-label">${c}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${counts[c]/mx*100}%"></div></div>
      <span class="bar-val">${counts[c]}</span></div>`).join('');

  const months = lastNMonths(6);
  const fin = months.map(m => ({
    m,
    inc: db.invoices.filter(i => i.month === m && i.status === 'Paid').reduce((s,i) => s + i.amount, 0),
    exp: db.expenses.filter(e => String(e.date).startsWith(m)).reduce((s,e) => s + e.amount, 0)
  }));
  const fm = Math.max(...fin.map(f => Math.max(f.inc, f.exp)), 1);
  $('#chartFinance').innerHTML =
    '<div class="col-chart">' + fin.map(f =>
      `<div class="col-wrap"><div class="cols">
        <div class="col c-in" style="height:${Math.max(f.inc/fm*115, 4)}px" title="Collection: ${money(f.inc)}"></div>
        <div class="col c-ex" style="height:${Math.max(f.exp/fm*115, 4)}px" title="Expenses: ${money(f.exp)}"></div>
      </div><span class="col-label">${ymLabel(f.m)}</span></div>`).join('') + '</div>' +
    '<div class="legend"><span class="lg lg-in">Collection (Paid)</span><span class="lg lg-ex">Expenses</span></div>';
}

function renderRecentLists(){
  const inv = [...db.invoices].sort((a,b) => (b.issuedDate||'').localeCompare(a.issuedDate||'')).slice(0,5);
  $('#recentInvoices').innerHTML = inv.length
    ? '<ul class="mini-list">' + inv.map(i =>
        `<li><span>${esc(i.name)} <small class="muted" style="margin:0">(${esc(i.className)})</small></span>
         <span>${money(i.amount)} <span class="badge ${i.status==='Paid'?'badge-green':'badge-red'}">${i.status}</span></span></li>`).join('') + '</ul>'
    : '<div class="empty-note">Abhi koi invoice nahi bana. Invoices page se generate karein.</div>';

  const exp = [...db.expenses].sort((a,b) => (b.date||'').localeCompare(a.date||'')).slice(0,5);
  $('#recentExpenses').innerHTML = exp.length
    ? '<ul class="mini-list">' + exp.map(e =>
        `<li><span>${esc(e.title)} <small class="muted" style="margin:0">(${esc(e.category)})</small></span>
         <span class="amt">${money(e.amount)}</span></li>`).join('') + '</ul>'
    : '<div class="empty-note">Koi expense record nahi hai.</div>';
}

/* Quick actions */
$('#qaEnroll').addEventListener('click', () => { switchPage('students'); openStudentModal(null); });
$('#qaAtt').addEventListener('click', () => switchPage('attendance'));
$('#qaInv').addEventListener('click', () => switchPage('invoices'));
$('#qaExp').addEventListener('click', () => switchPage('expenses'));
