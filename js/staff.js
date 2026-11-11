/* ============ ARGS SCHOOL POS — STAFF ============ */
function renderStaff(){
  const count = db.staff.length;
  const salary = db.staff.reduce((s,x) => s + (x.salary || 0), 0);
  $('#staffCountChip').textContent = 'Staff Members: ' + count;
  $('#staffSalaryChip').textContent = 'Total Monthly Salaries: ' + money(salary);

  const list = [...db.staff].sort((a,b) => (a.name||'').localeCompare(b.name||''));
  $('#staffBody').innerHTML = list.length ? list.map(x => `
    <tr>
      <td><b>${esc(x.name)}</b></td>
      <td><span class="badge badge-purple">${esc(x.designation)}</span></td>
      <td>${esc(x.phone || '—')}</td>
      <td>${esc(x.cnic || '—')}</td>
      <td><b>${money(x.salary)}</b></td>
      <td>${fmtDate(x.joinDate)}</td>
      <td>${esc(x.address || '—')}</td>
      <td>
        <button class="mini-btn" data-edit="${x.id}">✏️ Edit</button>
        <button class="mini-btn del" data-del="${x.id}">🗑️</button>
      </td>
    </tr>`).join('') : emptyRow(8, 'Koi staff member nahi. ➕ Add Staff dabain.');
}

$('#btnAddStaff').addEventListener('click', () => openStaffModal(null));

$('#staffBody').addEventListener('click', e => {
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.dataset.edit || btn.dataset.del;
  const mem = db.staff.find(x => x.id === id);
  if(!mem) return;
  if(btn.dataset.edit) openStaffModal(mem);
  if(btn.dataset.del && confirm(`${mem.name} ko staff se remove karna hai?`)){
    db.staff = db.staff.filter(x => x.id !== id);
    saveDB(); renderStaff(); toast('Staff member remove ho gaya.', 'info');
  }
});

function openStaffModal(mem){
  const isEdit = !!mem;
  openModal(isEdit ? '✏️ Edit Staff Member' : '➕ Add Staff Member', `
    <form id="staffForm" class="form-grid">
      <div class="form-group"><label>Full Name *</label><input name="name" required value="${mem ? esc(mem.name) : ''}"></div>
      <div class="form-group"><label>Designation *</label>
        <select name="designation">${DESIGNATIONS.map(d => `<option ${mem && mem.designation === d ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
      <div class="form-group"><label>Phone</label><input name="phone" value="${mem ? esc(mem.phone || '') : ''}"></div>
      <div class="form-group"><label>CNIC</label><input name="cnic" placeholder="35202-XXXXXXX-X" value="${mem ? esc(mem.cnic || '') : ''}"></div>
      <div class="form-group"><label>Monthly Salary (Rs) *</label><input type="number" name="salary" required min="0" value="${mem ? (mem.salary || 0) : 0}"></div>
      <div class="form-group"><label>Join Date *</label><input type="date" name="joinDate" required value="${mem ? (mem.joinDate || todayYMD()) : todayYMD()}"></div>
      <div class="form-group"><label>Address</label><input name="address" value="${mem ? esc(mem.address || '') : ''}"></div>
      <div class="form-actions">
        <button type="button" class="btn ghost" id="staffCancel">Cancel</button>
        <button type="submit" class="btn primary">${isEdit ? '💾 Update' : '➕ Add Staff'}</button>
      </div>
    </form>`);

  $('#staffCancel').addEventListener('click', closeModal);
  $('#staffForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const rec = {
      name: f.get('name').trim(), designation: f.get('designation'),
      phone: f.get('phone').trim(), cnic: f.get('cnic').trim(),
      salary: Number(f.get('salary')) || 0, joinDate: f.get('joinDate'),
      address: f.get('address').trim()
    };
    if(!rec.name){ toast('Naam zaroori hai!', 'error'); return; }
    if(mem){ Object.assign(mem, rec); toast(`${rec.name} update ho gaya! ✏️`); }
    else { rec.id = uid(); db.staff.push(rec); toast(`${rec.name} staff me add ho gaya! 👨‍🏫`); }
    saveDB(); closeModal(); renderStaff();
  });
}
