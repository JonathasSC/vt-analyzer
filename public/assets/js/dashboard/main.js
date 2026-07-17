/* ── ORQUESTRAÇÃO / BOOTSTRAP ── */
function render() {
  document.getElementById('badge').textContent = scans.length + ' scan' + (scans.length!==1?'s':'');
  renderOverview(); renderScans(); renderEngineBarChart(); renderRankings(); renderLeastDetected(); renderNames();
}

init();
