/* ── NOMES DE DETECÇÃO MAIS COMUNS ── */
function renderNames() {
  const names = detNames();
  document.getElementById('nc').textContent = names.length;
  if (!names.length) { document.getElementById('nl').innerHTML=emptyState('Sem dados.'); return; }
  const max = names[0][1];
  const rows = names.slice(0,30).map(([name,cnt],i) => {
    const rankClass = i===0?'nrk nrk1':i===1?'nrk nrk2':i===2?'nrk nrk3':'nrk';
    const widthPct = Math.round(cnt/max*100);
    return '<div class="nr">'+
      '<span class="'+rankClass+'">'+(i+1)+'</span>'+
      '<div class="nb"><div class="nt" title="'+escapeHtml(name)+'">'+escapeHtml(name)+'</div><div class="nbt"><div class="nbf" style="width:'+widthPct+'%"></div></div></div>'+
      '<span class="nc"><strong>'+cnt+'</strong>×</span>'+
    '</div>';
  }).join('');
  document.getElementById('nl').innerHTML = '<div class="nl">'+rows+'</div>';
}
