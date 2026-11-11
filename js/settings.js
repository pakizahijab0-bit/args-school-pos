/* ============ ARGS SCHOOL POS — SETTINGS ============ */
function renderSettings(){
  const s = db.settings;
  $('#setSchoolName').value = s.schoolName || 'ARGS';
  $('#setTagline').value = s.tagline || '';
  $('#setAddress').value = s.address || '';
  $('#setPhone').value = s.phone || '';
  $('#setPrincipal').value = s.principal || '';
  $('#setSession').value = s.session || '';
  renderFeeGrid();
}

function renderFeeGrid(){
  const fees = db.settings.fees || {};
  $('#feeGrid').innerHTML = CLASSES.map(c => `
    <div class="fee-cell">
      <label>${c}</label>
      <input type="number" min="0" data-cls="${c}" value="${fees[c] ?? 0}">
    </div>`).join('');
}

$('#schoolForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  Object.assign(db.settings, {
    schoolName: f.get('schoolName').trim() || 'ARGS',
    tagline: f.get('tagline').trim(),
    address: f.get('address').trim(),
    phone: f.get('phone').trim(),
    principal: f.get('principal').trim(),
    session: f.get('session').trim() || todayYM().slice(0,4) + '-27'
  });
  saveDB();
  toast('School info save ho gayi! ⚙️');
});

$('#btnSaveFees').addEventListener('click', () => {
  const fees = db.settings.fees || (db.settings.fees = {});
  $$('#feeGrid input').forEach(inp => {
    const v = Number(inp.value);
    if(v >= 0) fees[inp.dataset.cls] = v;
  });
  saveDB();
  toast('Fee structure save ho gayi! 💰');
});

$('#passForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const user = db.users.find(u => u.username === 'admin');
  if(!user || f.get('current') !== user.password){ toast('Current password ghalat hai!', 'error'); return; }
  if(f.get('newp') !== f.get('confirm')){ toast('Naye passwords match nahi kar rahe!', 'error'); return; }
  user.password = f.get('newp');
  saveDB();
  e.target.reset();
  toast('Password change ho gaya! 🔑');
});

$('#btnClearAll').addEventListener('click', () => {
  if(!confirm('⚠️ TAMAM data (students, fees, results, attendance, staff, expenses) delete ho jayega. Kya aap pakka sure hain?')) return;
  if(!confirm('Aakhri confirm: Backup le liya? Yeh wapas nahi aayega!')) return;
  db = freshDB();
  saveDB();
  renderSettings();
  toast('Saara data clear ho gaya. Naya start karein!', 'info');
});

$('#btnDemo').addEventListener('click', () => {
  if(!confirm('Demo data load karna hai? Current data replace ho jayega!')) return;
  db = demoDB();
  saveDB();
  renderSettings();
  toast('Demo data load ho gaya! 📦');
});
