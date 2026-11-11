/* ============ ARGS SCHOOL POS — STUDENTS ============ */
function renderStudents(){
  fillClassSelect($('#stuClassFilter'), true);
  renderStudentsTable();
}

function renderStudentsTable(){
  const cls = $('#stuClassFilter').value || 'All';
  const q = ($('#stuSearch').value || '').toLowerCase().trim();
  let list = db.students.filter(s => cls === 'All' || s.class === cls);
  if(q) list = list.filter(s => [s.name, s.father, s.rollNo, s.phone].join(' ').toLowerCase().includes(q));
  list.sort((a,b) => CLASSES.indexOf(a.class) - CLASSES.indexOf(b.class) || (a.rollNo||0) - (b.rollNo||0));

  $('#stuCount').textContent = list.length + ' student' + (list.length === 1 ? '' : 's');

  $('#studentsBody').innerHTML = list.length ? list.map(s => `
    <tr>
      <td><b>${s.rollNo}</b></td>
      <td>${esc(s.name)}</td>
      <td>${esc(s.father)}</td>
      <td><span class="badge badge-blue">${esc(s.class)}</span>${s.section ? ' - ' + esc(s.section) : ''}</td>
      <td>${esc(s.gender || '—')}</td>
      <td><b>${money(s.fee)}</b></td>
      <td>${esc(s.phone || '—')}</td>
      <td>${fmtDate(s.admissionDate)}</td>
      <td>
        <button class="mini-btn" data-edit="${s.id}">✏️ Edit</button>
        <button class="mini-btn del" data-del="${s.id}">🗑️ Delete</button>
      </td>
    </tr>`).join('') : emptyRow(9, 'Koi student nahi mila. ➕ Enroll New Student dabain.');
}

$('#stuClassFilter').addEventListener('change', renderStudentsTable);
$('#stuSearch').addEventListener('input', renderStudentsTable);
$('#btnAddStudent').addEventListener('click', () => openStudentModal(null));

$('#studentsBody').addEventListener('click', e => {
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.dataset.edit || btn.dataset.del;
  const stu = db.students.find(s => s.id === id);
  if(!stu) return;
  if(btn.dataset.edit) openStudentModal(stu);
  if(btn.dataset.del && confirm(`${stu.name} ko delete karna hai? Iska data wapas nahi aayega!`)){
    db.students = db.students.filter(s => s.id !== id);
    saveDB(); renderStudentsTable();
    toast('Student delete ho gaya.', 'info');
  }
});

/* ---------- Student Enrollment Modal ---------- */
function openStudentModal(stu){
  const isEdit = !!stu;
  const fees = db.settings.fees || {};
  openModal(isEdit ? '✏️ Edit Student' : '➕ Enroll New Student', `
    <form id="stuForm" class="form-grid">
      <div class="form-group"><label>Full Name *</label><input name="name" required value="${stu ? esc(stu.name) : ''}"></div>
      <div class="form-group"><label>Father Name *</label><input name="father" required value="${stu ? esc(stu.father) : ''}"></div>
      <div class="form-group"><label>Class *</label><select name="class" id="stuClassSel">${CLASSES.map(c => `<option ${stu && stu.class === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>Section</label><input name="section" value="${stu ? esc(stu.section || 'A') : 'A'}"></div>
      <div class="form-group"><label>Gender</label>
        <select name="gender">
          <option ${stu && stu.gender === 'Male' ? 'selected' : ''}>Male</option>
          <option ${stu && stu.gender === 'Female' ? 'selected' : ''}>Female</option>
        </select></div>
      <div class="form-group"><label>Date of Birth</label><input type="date" name="dob" value="${stu ? (stu.dob || '') : ''}"></div>
      <div class="form-group"><label>Phone</label><input name="phone" value="${stu ? esc(stu.phone || '') : ''}"></div>
      <div class="form-group"><label>Roll No *</label><input type="number" name="rollNo" id="stuRoll" required min="1" value="${stu ? (stu.rollNo || 1) : nextRollIn(db, CLASSES[0])}"></div>
      <div class="form-group"><label>Monthly Fee (Rs) *</label><input type="number" name="fee" id="stuFee" required min="0" value="${stu ? (stu.fee || 0) : (fees[CLASSES[0]] || 0)}"></div>
      <div class="form-group"><label>Admission Date *</label><input type="date" name="admissionDate" required value="${stu ? (stu.admissionDate || todayYMD()) : todayYMD()}"></div>
      <div class="form-group"><label>Address</label><input name="address" value="${stu ? esc(stu.address || '') : ''}"></div>
      <div class="form-actions">
        <button type="button" class="btn ghost" id="stuCancel">Cancel</button>
        <button type="submit" class="btn primary">${isEdit ? '💾 Update Student' : '🎓 Enroll Student'}</button>
      </div>
    </form>`);

  const classSel = $('#stuClassSel');
  classSel.addEventListener('change', () => {
    $('#stuFee').value = fees[classSel.value] || 0;
    if(!isEdit) $('#stuRoll').value = nextRollIn(db, classSel.value);
  });

  $('#stuCancel').addEventListener('click', closeModal);

  $('#stuForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const rec = {
      name: f.get('name').trim(), father: f.get('father').trim(),
      class: f.get('class'), section: (f.get('section') || 'A').trim() || 'A',
      gender: f.get('gender'), dob: f.get('dob'), phone: f.get('phone').trim(),
      rollNo: parseInt(f.get('rollNo')) || 1, fee: Number(f.get('fee')) || 0,
      admissionDate: f.get('admissionDate'), address: f.get('address').trim()
    };
    if(!rec.name || !rec.father){ toast('Naam aur father name zaroori hai!', 'error'); return; }
    if(stu){
      Object.assign(stu, rec);
      toast(`${rec.name} update ho gaya! ✏️`);
    } else {
      rec.id = uid();
      db.students.push(rec);
      toast(`${rec.name} enroll ho gaya! 🎉`);
    }
    saveDB(); closeModal(); renderStudentsTable();
  });
}
