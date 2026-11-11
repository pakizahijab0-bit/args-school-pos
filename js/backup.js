/* ============ ARGS SCHOOL POS — BACKUP & RESTORE ============ */
function renderBackup(){
  $('#bkStats').innerHTML =
    statCard('c1',  '🎓', 'Students', db.students.length, 'enrolled') +
    statCard('c2x', '👨‍🏫', 'Staff', db.staff.length, 'members') +
    statCard('c3x', '🧾', 'Invoices', db.invoices.length, 'total generated') +
    statCard('c4x', '🏆', 'Results', db.results.length, 'saved results') +
    statCard('c5x', '💸', 'Expenses', db.expenses.length, 'records') +
    statCard('c6x', '✅', 'Attendance Days', Object.keys(db.attendance).length, 'dates marked');
}

$('#btnExport').addEventListener('click', () => {
  try {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ARGS-School-Backup-${todayYMD()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    toast('Backup file download ho gayi! Ise mehfooz rakhein. 💾');
  } catch(err){
    toast('Backup download me masla: ' + err.message, 'error');
  }
});

$('#importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if(!data.settings || !Array.isArray(data.students)) throw new Error('Invalid format');
      if(!confirm('Backup restore karein? Current data replace ho jayega!')) { e.target.value = ''; return; }
      db = data;
      saveDB();
      toast('Backup restore ho gaya! Sab data wapas aa gaya. ✅');
      switchPage('dashboard');
    } catch(err){
      toast('Ye valid ARGS backup file nahi hai!', 'error');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
});
