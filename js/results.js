/* ============ ARGS SCHOOL POS — RESULTS & REPORT CARDS ============ */
function renderResults(){
  fillClassSelect($('#resClass'), false);
  fillSelect($('#resExam'), EXAMS);
  fillResStudents();
  renderResultsTable();
}

function fillResStudents(){
  const cls = $('#resClass').value;
  const studs = db.students.filter(s => s.class === cls).sort((a,b) => (a.rollNo||0) - (b.rollNo||0));
  $('#resStudent').innerHTML = studs.length
    ? studs.map(s => `<option value="${s.id}">${s.rollNo} — ${esc(s.name)}</option>`).join('')
    : '<option value="">— No students in this class —</option>';
  renderMarksTable();
}

function findExistingResult(stuId, exam){
  return db.results.find(r => r.studentId === stuId && r.exam === exam && r.session === db.settings.session);
}

function renderMarksTable(){
  const stu = db.students.find(s => s.id === $('#resStudent').value);
  if(!stu){ $('#marksWrap').innerHTML = '<div class="empty-note">Pehle class aur student select karein.</div>'; $('#resPreview').innerHTML = ''; return; }
  const exam = $('#resExam').value;
  const existing = findExistingResult(stu.id, exam);
  const subs = subjectsFor(stu.class);
  $('#marksWrap').innerHTML = `
    <table>
      <thead><tr><th>Subject</th><th>Total Marks</th><th>Obtained Marks</th></tr></thead>
      <tbody>
        ${subs.map(sub => {
          const t = existing && existing.marks[sub] ? existing.marks[sub].total : 100;
          const o = existing && existing.marks[sub] ? (existing.marks[sub].obtained ?? '') : '';
          return `<tr data-sub="${sub}">
            <td><b>${sub}</b></td>
            <td><input type="number" class="mk-t" min="1" value="${t}" style="width:90px"></td>
            <td><input type="number" class="mk-o" min="0" max="999" value="${o}" placeholder="—" style="width:90px"></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <p class="muted">Khaali chhorein ge to wo subject count nahi hoga. ✓ Save ke baad 🖨️ Report Card print karein.</p>`;
  updateResultPreview();
}

function updateResultPreview(){
  let ob = 0, tot = 0, valid = true;
  $$('#marksWrap tbody tr').forEach(tr => {
    const t = Number(tr.querySelector('.mk-t').value) || 0;
    const oRaw = tr.querySelector('.mk-o').value;
    tr.classList.remove('err-row');
    if(oRaw !== ''){
      const o = Number(oRaw);
      if(o > t){ valid = false; tr.classList.add('err-row'); }
      else { ob += o; tot += t; }
    }
  });
  const pct = tot ? Math.round(ob / tot * 1000) / 10 : 0;
  $('#resPreview').innerHTML = valid
    ? `<span>Obtained: <b>${ob} / ${tot}</b></span><span>Percentage: <b>${pct}%</b></span><span>Grade: <b>${gradeOf(pct)}</b></span>`
    : `<span class="badge badge-red">⚠️ Kisi subject me obtained marks total se zyada hain!</span>`;
}

$('#marksWrap').addEventListener('input', updateResultPreview);
$('#resClass').addEventListener('change', fillResStudents);
$('#resStudent').addEventListener('change', renderMarksTable);
$('#resExam').addEventListener('change', renderMarksTable);

$('#resSaveBtn').addEventListener('click', () => {
  const stu = db.students.find(s => s.id === $('#resStudent').value);
  if(!stu){ toast('Pehle student select karein!', 'error'); return; }
  const exam = $('#resExam').value;
  const marks = {}; let obtained = 0, total = 0, valid = true;
  $$('#marksWrap tbody tr').forEach(tr => {
    const sub = tr.dataset.sub;
    const t = Number(tr.querySelector('.mk-t').value) || 0;
    const oRaw = tr.querySelector('.mk-o').value;
    if(oRaw !== ''){
      const o = Number(oRaw);
      if(o > t){ valid = false; tr.classList.add('err-row'); return; }
      marks[sub] = { total: t, obtained: o };
      obtained += o; total += t;
    }
  });
  if(!valid){ toast('Obtained marks total se zyada hain — theek karein!', 'error'); return; }
  if(!Object.keys(marks).length){ toast('Kam az kam ek subject ke marks likhein!', 'error'); return; }
  const pct = total ? Math.round(obtained / total * 1000) / 10 : 0;
  const existing = findExistingResult(stu.id, exam);
  const rec = {
    studentId: stu.id, name: stu.name, father: stu.father, class: stu.class,
    exam, session: db.settings.session, marks, obtained, total,
    pct, grade: gradeOf(pct), date: todayYMD()
  };
  if(existing) Object.assign(existing, rec, { id: existing.id });
  else { rec.id = uid(); db.results.push(rec); }
  saveDB(); renderResultsTable();
  toast(`${stu.name} — ${exam}: ${pct}% (Grade ${rec.grade}) save ho gaya! 🏆`);
});

$('#resPrintBtn').addEventListener('click', () => {
  const stu = db.students.find(s => s.id === $('#resStudent').value);
  if(!stu){ toast('Pehle student select karein!', 'error'); return; }
  const exam = $('#resExam').value;
  let rec = findExistingResult(stu.id, exam);
  if(!rec){
    toast('Pehle result save karein, phir print karein!', 'error'); return;
  }
  printDoc(buildReportCard(rec));
});

function renderResultsTable(){
  const list = [...db.results].sort((a,b) => (b.date||'').localeCompare(a.date||''));
  $('#resultsBody').innerHTML = list.length ? list.map(r => `
    <tr>
      <td><b>${esc(r.name)}</b></td>
      <td><span class="badge badge-blue">${esc(r.class)}</span></td>
      <td>${esc(r.exam)}</td>
      <td>${r.obtained}/${r.total}</td>
      <td><b>${r.pct}%</b></td>
      <td><span class="badge ${gradeBadge(r.grade)}">${r.grade}</span></td>
      <td>
        <button class="mini-btn" data-print="${r.id}">🖨️ Report Card</button>
        <button class="mini-btn del" data-del="${r.id}">🗑️</button>
      </td>
    </tr>`).join('') : emptyRow(7, 'Abhi koi result save nahi hua.');
}

$('#resultsBody').addEventListener('click', e => {
  const btn = e.target.closest('button'); if(!btn) return;
  if(btn.dataset.print){
    const r = db.results.find(x => x.id === btn.dataset.print);
    if(r) printDoc(buildReportCard(r));
  }
  if(btn.dataset.del){
    const r = db.results.find(x => x.id === btn.dataset.del);
    if(r && confirm(`${r.name} ka result delete karna hai?`)){
      db.results = db.results.filter(x => x.id !== r.id);
      saveDB(); renderResultsTable(); toast('Result delete ho gaya.', 'info');
    }
  }
});

function positionOf(r){
  const same = db.results.filter(x => x.class === r.class && x.exam === r.exam && x.session === r.session);
  same.sort((a,b) => b.pct - a.pct);
  const i = same.findIndex(x => x.id === r.id);
  return i >= 0 ? (i + 1) + ' / ' + same.length : '—';
}

function buildReportCard(r){
  const rows = Object.entries(r.marks).map(([sub, m]) => `
    <tr><td>${esc(sub)}</td><td>${m.total}</td><td>${m.obtained}</td><td>${m.total ? Math.round(m.obtained/m.total*100) : 0}%</td></tr>`).join('');
  return `<div class="print-doc">
    <div class="pd-head">
      <div class="pd-school">${esc(db.settings.schoolName)} SCHOOL</div>
      <div class="pd-sub">${esc(db.settings.address || '')}${db.settings.phone ? ' | Tel: ' + esc(db.settings.phone) : ''} | Session: ${esc(db.settings.session)}</div>
      <div class="pd-title">REPORT CARD — ${esc(r.exam)}</div>
    </div>
    <table class="pd-info">
      <tr><td><b>Student:</b> ${esc(r.name)}</td><td><b>Father:</b> ${esc(r.father || '—')}</td><td><b>Class:</b> ${esc(r.class)}</td></tr>
      <tr><td><b>Position in Class:</b> ${positionOf(r)}</td><td><b>Date:</b> ${fmtDate(r.date)}</td><td><b>Session:</b> ${esc(r.session)}</td></tr>
    </table>
    <table class="pd-table">
      <thead><tr><th>Subject</th><th>Total Marks</th><th>Obtained</th><th>%</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><th>TOTAL</th><th>${r.total}</th><th>${r.obtained}</th><th>${r.pct}%</th></tr></tfoot>
    </table>
    <table class="pd-info">
      <tr><td><b>Percentage:</b> ${r.pct}%</td><td><b>Grade:</b> ${r.grade}</td><td><b>Remarks:</b> ${gradeRemarks(r.grade)}</td></tr>
    </table>
    <div class="pd-sign"><span>Class Teacher</span><span>Principal — ${esc(db.settings.principal || '')}</span></div>
  </div>`;
}
