/* ── GRÁFICO: TOP ENGINES POR DETECÇÃO ── */
let engineChartData = [];

function renderEngineBarChart() {
  const el = document.getElementById('engine-bar-chart');
  if (!scans.length) { el.innerHTML = emptyState('Sem dados.'); return; }

  engineChartData = engineStats().filter(e => e.mal > 0).sort((a, b) => b.mal - a.mal).slice(0, 8);
  if (!engineChartData.length) { el.innerHTML = emptyState('Nenhuma engine detectou nada ainda.'); return; }

  const maxMal = engineChartData[0].mal;
  el.innerHTML = engineChartData.map((e, i) => {
    const widthPct = Math.round((e.mal / maxMal) * 100);
    return '<div class="ebar-row" tabindex="0" aria-label="'+escapeHtml(e.name)+': '+e.mal+' detecções, '+e.rate.toFixed(0)+'% de taxa" '+
      'onmouseenter="showEbarTip(event,'+i+')" onmouseleave="hideEbarTip()" '+
      'onfocus="showEbarTip(event,'+i+')" onblur="hideEbarTip()">'+
      '<span class="ebar-label" title="'+escapeHtml(e.name)+'">'+escapeHtml(e.name)+'</span>'+
      '<div class="ebar-track"><div class="ebar-fill" style="width:'+widthPct+'%"></div></div>'+
      '<span class="ebar-value">'+e.mal+'</span>'+
    '</div>';
  }).join('');
}

function showEbarTip(evt, i) {
  const e = engineChartData[i];
  if (!e) return;
  const tip = document.getElementById('ebar-tip');
  tip.innerHTML = '<strong></strong><span></span>';
  tip.querySelector('strong').textContent = e.name;
  tip.querySelector('span').textContent = e.mal + ' detecç' + (e.mal !== 1 ? 'ões' : 'ão') + ' · ' + e.rate.toFixed(0) + '% de taxa';
  const row = evt.currentTarget;
  const rect = row.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const panel = row.closest('.echart-panel');
  const panelTop = panel ? panel.getBoundingClientRect().top : 0;
  const spaceAbove = rect.top - tipRect.height - 10;
  tip.style.left = Math.max(8, rect.left) + 'px';
  tip.style.top = (spaceAbove >= panelTop + 8 ? spaceAbove : rect.bottom + 10) + 'px';
  tip.classList.add('show');
}

function hideEbarTip() {
  document.getElementById('ebar-tip').classList.remove('show');
}
