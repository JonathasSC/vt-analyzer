/* ── RANKINGS DE ENGINES ── */
function renderRankings() {
  const ids = ['tp-det','tp-miss','tp-inc','tp-nev','tp-all'];
  if (!scans.length) { ids.forEach(id=>document.getElementById(id).innerHTML=emptyState('Sem dados.')); return; }

  const stats = engineStats(), scanCount = scans.length;
  const sorted = (arr,fn) => [...arr].sort(fn);

  const topDetectors = sorted(stats.filter(e=>e.mal>0),(a,b)=>b.mal-a.mal||b.rate-a.rate).slice(0,30);
  const topMisses     = sorted(stats.filter(e=>e.und>0&&e.part>0),(a,b)=>b.und-a.und).slice(0,30);
  const inconsistent  = sorted(stats.filter(e=>e.mal>0&&e.und>0),(a,b)=>Math.abs(a.rate-50)-Math.abs(b.rate-50));
  const neverDetected = sorted(stats.filter(e=>e.mal===0&&e.und>0&&e.fail===0&&e.tmo===0),(a,b)=>b.und-a.und);
  const all           = sorted(stats,(a,b)=>b.mal-a.mal||a.name.localeCompare(b.name));

  document.getElementById('tp-det').innerHTML  = engineTable(topDetectors, scanCount);
  document.getElementById('tp-miss').innerHTML = engineTable(topMisses, scanCount);
  document.getElementById('tp-inc').innerHTML  = inconsistent.length ? engineTable(inconsistent, scanCount) : emptyState('Nenhuma engine inconsistente entre os scans.');
  document.getElementById('tp-nev').innerHTML  = neverDetected.length ? engineTable(neverDetected, scanCount) : emptyState('Todas as engines detectaram ao menos um scan.');
  document.getElementById('tp-all').innerHTML  = engineTable(all, scanCount);
}

function engineTable(rows, scanCount) {
  if (!rows.length) return emptyState('Sem dados.');
  const head = '<thead><tr><th>#</th><th style="text-align:left">Engine</th>'+
    '<th>'+icon('dangerous','th-icon')+'Malicioso</th>'+
    '<th>'+icon('check_circle','th-icon')+'Limpo</th>'+
    '<th>'+icon('block','th-icon')+'S/Suporte</th>'+
    '<th>'+icon('error','th-icon')+'Falha</th>'+
    '<th>'+icon('hourglass_empty','th-icon')+'Timeout</th>'+
    '<th>Taxa Detecção</th></tr></thead>';
  const body = rows.map((e,i) => {
    const rankClass = i===0?'rk rk1':i===1?'rk rk2':i===2?'rk rk3':'rk';
    const ratePct = e.rate.toFixed(0);
    const rateColor = e.rate>=80?'var(--mal)':e.rate>=40?'var(--fail)':'var(--und)';
    const malWidthPct = Math.round(e.mal/scanCount*100), undWidthPct = Math.round(e.und/scanCount*100);
    const maliciousColor   = e.mal>0  ? 'var(--mal)'  : 'var(--mut)';
    const undetectedColor  = e.und>0  ? 'var(--und)'  : 'var(--mut)';
    const unsupportedColor = e.uns>0  ? 'var(--uns)'  : 'var(--mut)';
    const failureColor     = e.fail>0 ? 'var(--fail)' : 'var(--mut)';
    const timeoutColor     = e.tmo>0  ? 'var(--tmo)'  : 'var(--mut)';
    return '<tr>'+
      '<td><span class="'+rankClass+'">'+(i+1)+'</span></td>'+
      '<td style="font-weight:600;text-align:left">'+escapeHtml(e.name)+'</td>'+
      '<td><div class="mb"><div class="mbt"><div class="mbf" style="width:'+malWidthPct+'%;background:var(--mal)"></div></div><span style="color:'+maliciousColor+';font-weight:600;min-width:14px">'+e.mal+'</span></div></td>'+
      '<td><div class="mb"><div class="mbt"><div class="mbf" style="width:'+undWidthPct+'%;background:var(--und)"></div></div><span style="color:'+undetectedColor+';min-width:14px">'+e.und+'</span></div></td>'+
      '<td style="color:'+unsupportedColor+'">'+e.uns+'</td>'+
      '<td style="color:'+failureColor+'">'+e.fail+'</td>'+
      '<td style="color:'+timeoutColor+'">'+e.tmo+'</td>'+
      '<td>'+(e.part>0?
        '<div class="mb"><div class="mbt" style="width:70px"><div class="mbf" style="width:'+ratePct+'%;background:'+rateColor+'"></div></div><span style="color:'+rateColor+';font-weight:600;min-width:32px">'+ratePct+'%</span></div>':
        '<span style="color:var(--mut)">N/A</span>')+
      '</td>'+
    '</tr>';
  }).join('');
  return '<table class="rt">'+head+'<tbody>'+body+'</tbody></table>';
}
