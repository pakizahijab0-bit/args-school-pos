/* ============ ARGS SCHOOL POS — ATTENDANCE ============ */
let attTemp = {};

function renderAttendance(){
  if(!$('#attDate').value) $('#attDate').value = todayYMD();
  if(!$('#attMonth').value) $('#attMonth').value = todayYM();
  fillClassSelect($('#attClass'), false);
  fillClassSelect($('#attSumClass'), false);
  $('#attSumClass').value = $('#attClass').value;
  renderAttList();
  renderAttSummary();
}

function renderAttList(){
  const cls = $('#attClass').value, date = $('#attDate').value;
  const stored = (db.attendance[date] || {})[cls] || {};
  attTemp = { ...stored };
  const studs = db.students.filter(s => s.class === cls).sort((a,b) => (a.rollNo||0) - (b.rollNo||0));
  $('#attList').innerHTML = studs.length ? studs.map(s => `
    <div class="att-row" data-sid="${s.id}">
      <div class="att-name"><b>${s.rollNo}</b> ${esc(s.name)}</div>
      <div class="seg">
        <button type="button" class="seg-btn ${attTemp[s.id] === 'P' ? 'on-p' : ''}" data-st="P" title="Present">P</button>
        <button type="button" class="seg-btn ${attTemp[s.id] === 'A' ? 'on-a' : ''}" data-st="A" title="Absent">A</button>
        <button type="button" class="seg-btn ${attTemp[s.id] === 'L' ? 'on-l' : ''}" data-st="L" title="Leave">L</button>
      </div>
    </div>`).join('')
  : '<div class="empty-note">Is class me koi student mojood nahi. Pehle Students page se enroll karein.</div>';
}

$('#attList').addEventListener('click', e => {
  const btn = e.target.closest('.seg-btn'); if(!btn) return;
  const row = btn.closest('.att-row');
  attTemp[row.dataset.sid] = btn.dataset.st;
  $$('.seg-btn', row).forEach(b => b.classList.remove('on-p','on-a','on-l'));
  btn.classList.add('on-' + btn.dataset.st.toLowerCase());
});

$('#btnAllPresent').addEventListener('click', () => {
  $$('#attList .att-row').forEach(row => {
    attTemp[row.dataset.sid] = 'P';
    $$('.seg-btn', row).forEach(b => b.classList.remove('on-p','on-a','on-l'));
    row.querySelector('.seg-btn[data-st="P"]').classList.add('on-p');
  });
  toast('Sab ko Present mark kar diya — ab Save dabain! 👍', 'info');
});

$('#attSaveBtn').addEventListener('click', () => {
  const cls = $('#attClass').value, date = $('#attDate').value;
  if(!date){ toast('Date select karein!', 'error'); return; }
  const total = $$('#attList .att-row').length;
  if(!total){ toast('Is class me students nahi hain!', 'error'); return; }
  db.attendance[date] = db.attendance[date] || {};
  db.attendance[date][cls] = { ...attTemp };
  saveDB();
  renderAttSummary();
  toast(`${cls} — ${fmtDate(date)} ki attendance save ho gayi! ✅`);
});

$('#attDate').addEventListener('change', renderAttList);
$('#attClass').addEventListener('change', () => { renderAttList(); renderAttSummary(); });
$('#attMonth').addEventListener('change', renderAttSummary);
$('#attSumClass').addEventListener('change', renderAttSummary);

function renderAttSummary(){
  const cls = $('#attSumClass').value, month = $('#attMonth').value;
  const studs = db.students.filter(s => s.class === cls).sort((a,b) => (a.rollNo||0) - (b.rollNo||0));
  const rows = studs.map(s => {
    let P = 0, A = 0, L = 0;
    Object.keys(db.attendance).forEach(d => {
      if(d.startsWith(month)){
        const st = (db.attendance[d][cls] || {})[s.id];
        if(st === 'P') P++; else if(st === 'A') A++; else if(st === 'L') L++;
      }
    });
    const tot = P + A + L;
    return { s, P, A, L, pct: tot ? Math.round(P / tot * 100) : 0 };
  });
  $('#attSummaryBody').innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td><b>${r.s.rollNo}</b></td><td>${esc(r.s.name)}</td>
      <td><span class="badge badge-green">${r.P}</span></td>
      <td><span class="badge badge-red">${r.A}</span></td>
      <td><span class="badge badge-amber">${r.L}</span></td>
      <td><b>${r.pct}%</b></td>
    </tr>`).join('') : emptyRow(6, 'Is class me koi student nahi.');
}
