/* ── OVERVIEW ── */
function renderOverview() {
  const grid = document.getElementById('ov');
  if (!scans.length) { grid.innerHTML=''; return; }
  const totalMalicious   = scans.reduce((s,sc)=>s+sc.summary.malicious,0);
  const totalUndetected  = scans.reduce((s,sc)=>s+sc.summary.undetected,0);
  const totalUnsupported = scans.reduce((s,sc)=>s+sc.summary.unsupported,0);
  const totalFailure     = scans.reduce((s,sc)=>s+(sc.summary.failure||0),0);
  const totalAll         = scans.reduce((s,sc)=>s+sc.summary.total,0);
  const avgRate = (scans.reduce((s,sc)=>s+sc.summary.malicious/sc.summary.total*100,0)/scans.length).toFixed(1);
  const stats = engineStats();
  const topEngine = stats.filter(e=>e.mal>0).sort((a,b)=>b.mal-a.mal)[0];
  const perfectEngines = stats.filter(e=>e.part>0&&e.rate===100).length;

  grid.innerHTML =
    overviewCard('c-acc','inventory_2','Scans Carregados',scans.length,totalAll+' análises totais') +
    overviewCard('c-mal','report','Total Detecções',totalMalicious,'média '+avgRate+'% por scan') +
    overviewCard('c-und','check_circle','Não Detectado',totalUndetected,(totalUndetected/totalAll*100).toFixed(1)+'% do total') +
    overviewCard('c-uns','error','Sem Suporte / Falha',totalUnsupported,(totalFailure?'+ '+totalFailure+' falha(s)':'0 falhas')) +
    overviewCard('c-acc','verified','Engines 100% Precisas',perfectEngines,'detectaram em todos os scans') +
    (topEngine ? '<div class="ov-card c-top"><div class="ov-icon">'+icon('military_tech')+'</div><div class="lbl">Melhor Detector</div><div class="val">'+escapeHtml(topEngine.name)+'</div><div class="sub-txt">'+topEngine.mal+'/'+scans.length+' scans detectados</div></div>' : '');
}

function overviewCard(cls, iconName, lbl, val, sub) {
  return '<div class="ov-card '+cls+'"><div class="ov-icon">'+icon(iconName)+'</div><div class="lbl">'+lbl+'</div><div class="val">'+val+'</div><div class="sub-txt">'+sub+'</div></div>';
}
