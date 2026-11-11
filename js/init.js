/* ============ ARGS SCHOOL POS — INIT ============ */
(function init(){
  loadDB();

  $('#loginYear').textContent = new Date().getFullYear();
  $('#todayDateTop').textContent = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  if(sessionStorage.getItem(AUTH_KEY) === '1'){
    const user = db.users.find(u => u.username === 'admin') || db.users[0];
    $('#userName').textContent = user ? user.name : 'Administrator';
    showApp();
  } else {
    showLogin();
  }
})();
