/* ============ ARGS SCHOOL POS — CORE ============ */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const DB_KEY = 'ARGS_POS_DB_V1';
const AUTH_KEY = 'ARGS_POS_AUTH';
const CLASSES = ['Nursery','KG','Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10'];
const EXAMS = ['First Term','Mid Term','Final Term','Monthly Test'];
const EXP_CATS = ['Salary','Utilities','Rent','Maintenance','Stationery','Transport','Events','Misc'];
const DESIGNATIONS = ['Principal','Vice Principal','Teacher','Senior Teacher','Clerk','Accountant','Librarian','Guard','Peon'];

function defaultFees(){
  return {'Nursery':1500,'KG':1500,'Class 1':1800,'Class 2':1800,'Class 3':2000,'Class 4':2000,
          'Class 5':2200,'Class 6':2200,'Class 7':2400,'Class 8':2400,'Class 9':2800,'Class 10':3000};
}

function subjectsFor(cls){
  if(cls === 'Nursery') return ['English','Urdu','Maths','General Knowledge','Rhymes'];
  if(cls === 'KG') return ['English','Urdu','Maths','General Knowledge'];
  if(['Class 1','Class 2','Class 3','Class 4','Class 5'].includes(cls))
    return ['English','Urdu','Maths','Islamiat','General Knowledge'];
  if(['Class 6','Class 7','Class 8'].includes(cls))
    return ['English','Urdu','Maths','Science','Islamiat','Social Studies'];
  return ['English','Urdu','Maths','Physics','Chemistry','Biology','Islamiat','Pak Studies'];
}

/* ---------- DATABASE ---------- */
let db;

function freshDB(){
  return {
    settings: {
      schoolName: 'ARGS', tagline: 'School Management System',
      address: '', phone: '', principal: '', session: '2026-27',
      fees: defaultFees()
    },
    users: [{ username: 'admin', password: 'admin123', name: 'Administrator' }],
    students: [], staff: [], invoices: [], expenses: [], results: [],
    attendance: {}, counters: { invoice: 1 }
  };
}

function demoDB(){
  const d = freshDB();
  d.settings.address = 'Main Bazaar Road';
  d.settings.phone = '0300-1234567';
  d.settings.principal = 'Abdul Qadir';

  const demoStudents = [
    ['Ayesha Khan','Muhammad Khan','Nursery','Female'],
    ['Ali Raza','Ahmed Raza','Nursery','Male'],
    ['Fatima Noor','Noor Hassan','KG','Female'],
    ['Hassan Ali','Syed Ali Shah','Class 3','Male'],
    ['Zainab Aslam','Muhammad Aslam','Class 3','Female'],
    ['Usman Ghani','Ghani Rehman','Class 8','Male'],
    ['Areeba Shahid','Shahid Mehmood','Class 10','Female'],
    ['Bilal Ahmed','Ahmed Nawaz','Class 10','Male']
  ];
  demoStudents.forEach((s, i) => {
    d.students.push({
      id: uid(), rollNo: nextRollIn(d, s[2]), name: s[0], father: s[1], class: s[2],
      section: 'A', gender: s[3], dob: '', phone: '0300-' + (1234567 + i * 111),
      address: '', fee: d.settings.fees[s[2]] || 1500, admissionDate: todayYMD()
    });
  });

  const demoStaff = [
    ['Abdul Qadir','Principal','0300-1112223',50000],
    ['Sana Malik','Teacher','0301-2223334',25000],
    ['Rukhsana Parveen','Teacher','0302-3334445',22000],
    ['Muhammad Imran','Clerk','0303-4445556',18000]
  ];
  demoStaff.forEach(s => d.staff.push({
    id: uid(), name: s[0], designation: s[1], phone: s[2], cnic: '',
    salary: s[3], joinDate: todayYMD(), address: ''
  }));

  const ym = todayYM();
  [['Electricity Bill','Utilities',8500],['Water Bill','Utilities',1200],
   ['Stationery Purchase','Stationery',2300],['Building Repair','Maintenance',5500]]
  .forEach(e => d.expenses.push({ id: uid(), title: e[0], category: e[1], amount: e[2], date: todayYMD(), note: '' }));

  d.students.forEach((s, i) => {
    d.invoices.push({
      id: uid(), no: 'INV-' + ym.replace('-','') + '-' + String(d.counters.invoice++).padStart(3,'0'),
      studentId: s.id, name: s.name, father: s.father, className: s.class,
      month: ym, amount: s.fee, status: i < 4 ? 'Paid' : 'Unpaid',
      issuedDate: todayYMD(), paidDate: i < 4 ? todayYMD() : null
    });
  });

  const today = todayYMD();
  d.attendance[today] = {};
  d.attendance[today]['Nursery'] = {};
  d.students.filter(s => s.class === 'Nursery').forEach((s, i) => {
    d.attendance[today]['Nursery'][s.id] = i === 1 ? 'A' : 'P';
  });
  return d;
}

function saveDB(){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function loadDB(){
  try {
    const raw = localStorage.getItem(DB_KEY);
    if(raw){ db = JSON.parse(raw); return; }
  } catch(e){}
  db = demoDB(); saveDB();
}

/* ---------- HELPERS ---------- */
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }
function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function money(n){ return 'Rs ' + Number(n || 0).toLocaleString(); }
function todayYMD(){ const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function todayYM(){ return todayYMD().slice(0,7); }
function fmtDate(d){ if(!d) return '—'; const p = String(d).split('-'); return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : d; }
function ymLabel(m){ if(!m) return '—'; const d = new Date(m + '-01'); return d.toLocaleString('en', { month:'short' }) + ' ' + d.getFullYear(); }
function gradeOf(p){ if(p >= 80) return 'A+'; if(p >= 70) return 'A'; if(p >= 60) return 'B'; if(p >= 50) return 'C'; if(p >= 40) return 'D'; if(p >= 33) return 'E'; return 'F'; }
function gradeBadge(g){
  if(g === 'A+' || g === 'A') return 'badge-green';
  if(g === 'B') return 'badge-blue';
  if(g === 'C') return 'badge-amber';
  if(g === 'D' || g === 'E') return 'badge-orange';
  return 'badge-red';
}
function gradeRemarks(g){
  return {'A+':'Outstanding! Keep it up.','A':'Very Good!','B':'Good.','C':'Satisfactory.',
          'D':'Needs Improvement.','E':'Work Hard!','F':'Fail — must repeat exam.'}[g] || '';
}
function nextRollIn(dbs, cls){
  const rolls = dbs.students.filter(s => s.class === cls).map(s => parseInt(s.rollNo) || 0);
  return rolls.length ? Math.max(...rolls) + 1 : 1;
}
function lastNMonths(n){
  const out = [], d = new Date();
  for(let i = n - 1; i >= 0; i--){
    const dt = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`);
  }
  return out;
}
function emptyRow(cols, msg){ return `<tr><td colspan="${cols}" class="empty">${msg}</td></tr>`; }
function fillClassSelect(sel, withAll){
  const cur = sel.value;
  sel.innerHTML = (withAll ? '<option value="All">All Classes</option>' : '') + CLASSES.map(c => `<option>${c}</option>`).join('');
  sel.value = (cur && (cur === 'All' || CLASSES.includes(cur))) ? cur : (withAll ? 'All' : CLASSES[0]);
}
function fillSelect(sel, arr){
  const cur = sel.value;
  sel.innerHTML = arr.map(o => `<option>${o}</option>`).join('');
  if(arr.includes(cur)) sel.value = cur;
}

/* ---------- TOAST ---------- */
function toast(msg, type = 'success'){
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  $('#toastStack').appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 2800);
}

/* ---------- MODAL ---------- */
function openModal(title, html){
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = html;
  $('#modalOverlay').classList.remove('hidden');
}
function closeModal(){ $('#modalOverlay').classList.add('hidden'); }
$('#modalClose').addEventListener('click', closeModal);
$('#modalOverlay').addEventListener('click', e => { if(e.target === e.currentTarget) closeModal(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

/* ---------- PRINT ---------- */
function printDoc(html){
  $('#printArea').innerHTML = html;
  window.print();
}

/* ---------- LOGIN / AUTH ---------- */
const loginScreen = $('#loginScreen'), app = $('#app');

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  const u = $('#loginUser').value.trim(), p = $('#loginPass').value;
  const user = db.users.find(x => x.username === u && x.password === p);
  if(user){
    sessionStorage.setItem(AUTH_KEY, '1');
    $('#userName').textContent = user.name;
    showApp();
    toast('Welcome back, ' + user.name + '! 🎉');
    $('#loginForm').reset();
  } else {
    const card = $('#loginCard');
    card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    toast('Galat username ya password!', 'error');
  }
});

$('#togglePass').addEventListener('click', () => {
  const inp = $('#loginPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

function showApp(){
  loginScreen.classList.add('hidden');
  app.classList.remove('hidden');
  switchPage('dashboard');
}
function showLogin(){
  app.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  sessionStorage.removeItem(AUTH_KEY);
}

$('#btnLogout').addEventListener('click', () => {
  showLogin();
  toast('Logout ho gaya. Shukriya!', 'info');
});

/* ---------- NAVIGATION ---------- */
const PAGE_META = {
  dashboard:  ['📊','Dashboard'],  students: ['🎓','Students'],
  attendance:['✅','Attendance'], results:  ['🏆','Results'],
  invoices:  ['🧾','Invoices'],    expenses: ['💸','Expenses'],
  staff:     ['👨‍🏫','Staff'],       settings: ['⚙️','Settings'],
  backup:    ['💾','Backup']
};

function switchPage(page){
  $$('.nav-item[data-page]').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
  const meta = PAGE_META[page] || ['',''];
  $('#pageIcon').textContent = meta[0];
  $('#pageTitle').textContent = meta[1];
  window.scrollTo(0, 0);
  const fn = window['render' + page.charAt(0).toUpperCase() + page.slice(1)];
  if(typeof fn === 'function') fn();
}
$$('.nav-item[data-page]').forEach(b => b.addEventListener('click', () => switchPage(b.dataset.page)));
