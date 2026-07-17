/* ── AÇÕES DO USUÁRIO ── */
function removeScan(hash) {
  if (!confirm('Remover este scan?')) return;
  scans = scans.filter(s => s.summary.hash !== hash);
  save(); render(); toast('Scan removido.', 'warn');
}

function clearAllScans() {
  if (!confirm('Remover todos os scans?')) return;
  scans = []; save(); render(); toast('Todos os scans foram removidos.', 'warn');
}

function filterScans(val) {
  filterText = val.trim().toLowerCase();
  renderScans();
}

function changeSortMode(val) {
  sortMode = val;
  renderScans();
}

function toggleDets(btn, id) {
  const open = document.getElementById(id).classList.toggle('open');
  btn.classList.toggle('open', open);
  btn.querySelector('.xbtn-label').textContent = open ? 'Ocultar detecções' : 'Ver todas as detecções ('+btn.dataset.n+')';
}

function switchTab(btn, panelId) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tp').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}
