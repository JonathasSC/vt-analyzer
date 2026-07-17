/* ── MALWARE MENOS IDENTIFICADO ── */
function renderLeastDetected() {
  const el = document.getElementById('lm-table');
  const cnt = document.getElementById('lm-cnt');
  if (!scans.length) { el.innerHTML = emptyState('Sem dados.'); return; }
  cnt.textContent = scans.length;

  const sorted = [...scans].sort((a, b) => {
    const rateA = a.summary.malicious / a.summary.total;
    const rateB = b.summary.malicious / b.summary.total;
    return rateA - rateB || a.summary.malicious - b.summary.malicious;
  });

  const rows = sorted.map((scan, i) => {
    const s = scan.summary;
    const detRate = (s.malicious / s.total * 100).toFixed(1);
    const undRate = (s.undetected / s.total * 100).toFixed(1);
    const rateColor = parseFloat(detRate)>=60 ? 'var(--mal)' : parseFloat(detRate)>=25 ? 'var(--fail)' : 'var(--und)';
    const rankClass = i===0?'rk rk1':i===1?'rk rk2':i===2?'rk rk3':'rk';
    const barWidthPct = Math.round(s.malicious / s.total * 100);
    const extras = (s.failure||0) + (s.timeout||0);
    const extraBadge = extras > 0 ? ' <span style="color:var(--fail);font-size:10px">(+'+extras+' f/tmo)</span>' : '';
    const detectingEngines = scan.detections.filter(d=>d.result==='malicious').map(d=>escapeHtml(d.engine)).join(', ');
    return '<tr>'+
      '<td><span class="'+rankClass+'">'+(i+1)+'</span></td>'+
      '<td style="text-align:left">'+
        '<div class="sc-hash" style="font-size:11px">'+escapeHtml(s.hash.slice(0,8))+'…</div>'+
        '<div style="font-size:10px;color:var(--mut);font-family:\'JetBrains Mono\',monospace">'+escapeHtml(s.hash.slice(0,20))+'…</div>'+
      '</td>'+
      '<td><div class="mb"><div class="mbt" style="width:72px"><div class="mbf" style="width:'+barWidthPct+'%;background:'+rateColor+'"></div></div>'+
        '<span style="color:'+rateColor+';font-weight:700;min-width:38px">'+s.malicious+'/'+s.total+'</span></div></td>'+
      '<td style="color:'+rateColor+';font-weight:700">'+detRate+'%</td>'+
      '<td>'+
        '<span style="color:var(--und);font-weight:600">'+s.undetected+'</span>'+
        '<span style="color:var(--mut);font-size:10px"> ('+undRate+'%)</span>'+extraBadge+
      '</td>'+
      '<td style="font-size:10px;color:var(--mut);text-align:left;word-break:break-word;max-width:300px">'+
        (detectingEngines || '<em style="color:var(--und)">nenhum</em>')+
      '</td>'+
    '</tr>';
  }).join('');

  el.innerHTML = '<table class="rt">'+
    '<thead><tr>'+
      '<th>#</th>'+
      '<th style="text-align:left">Hash SHA-256</th>'+
      '<th>Detectado</th><th>Taxa</th><th>Não detectado</th>'+
      '<th style="text-align:left;width:38%">Engines que detectaram</th>'+
    '</tr></thead>'+
    '<tbody>'+rows+'</tbody>'+
  '</table>';
}
