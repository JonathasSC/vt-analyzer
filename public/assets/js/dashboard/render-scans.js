/* ── SCAN CARDS ── */
function renderScans() {
  const grid = document.getElementById('scg');
  const display = getDisplayScans();
  document.getElementById('sc-cnt').textContent = scans.length;
  if (!scans.length) { grid.innerHTML=emptyState('Nenhum scan ainda. Envie arquivos para análise acima.'); return; }
  if (!display.length) { grid.innerHTML=emptyState('Nenhum resultado para o filtro aplicado.'); return; }

  grid.innerHTML = display.map((scan) => {
    const s = scan.summary, total = s.total;
    const maliciousPct = (s.malicious/total*100).toFixed(1);
    const undetectedPct = (s.undetected/total*100).toFixed(1);
    const unsupportedPct = (s.unsupported/total*100).toFixed(1);
    const failurePct = ((s.failure||0)/total*100).toFixed(1);
    const severity = parseFloat(maliciousPct)>=60?'high':parseFloat(maliciousPct)>=25?'med':'low';
    const rows = scan.detections.map(d => {
      const resultClass = d.result==='malicious'?'rm':d.result==='undetected'?'ru':d.result==='unsupported'?'rs':'rf';
      const detectionName = d.detection||'—';
      return '<div class="dr"><span class="de">'+escapeHtml(d.engine)+'</span><span class="dx '+resultClass+'">'+d.result+'</span><span class="dn" title="'+escapeHtml(detectionName)+'">'+escapeHtml(detectionName)+'</span></div>';
    }).join('');
    const failTag = s.failure ? '<div class="sc-stat"><div class="dot df"></div><strong>'+s.failure+'</strong>&nbsp;falha</div>' : '';
    const scanIndex = scans.indexOf(scan);
    const severityBadge = severity==='high' ? '<span class="sc-badge sc-badge-high">Alta</span>' : severity==='med' ? '<span class="sc-badge sc-badge-med">Média</span>' : '<span class="sc-badge sc-badge-low">Baixa</span>';
    return '<div class="sc-card" data-sev="'+severity+'">'+
      '<div class="sc-head">'+
        '<div>'+(s.fileName?'<div class="sc-file" title="'+escapeHtml(s.fileName)+'">'+escapeHtml(s.fileName)+'</div>':'')+'<div class="sc-hash">'+s.hash.slice(0,16)+'…</div><div class="sc-hash-full">'+s.hash+'</div></div>'+
        '<div class="sc-head-actions">'+severityBadge+'<button class="sc-rm" onclick="removeScan(\''+s.hash+'\')" title="Remover scan">'+icon('close')+'</button></div>'+
      '</div>'+
      '<div class="sc-nums">'+
        '<div><div class="sc-dc">'+s.malicious+'/'+total+'</div><div class="sc-dl">detectados</div></div>'+
        '<div><div class="sc-rv">'+maliciousPct+'%</div><div class="sc-rl">taxa</div></div>'+
      '</div>'+
      '<div class="det-bar">'+
        '<div class="b-m" style="width:'+maliciousPct+'%"></div>'+
        '<div class="b-u" style="width:'+undetectedPct+'%"></div>'+
        '<div class="b-s" style="width:'+unsupportedPct+'%"></div>'+
        (s.failure?'<div class="b-f" style="width:'+failurePct+'%"></div>':'')+
      '</div>'+
      '<div class="sc-stats">'+
        '<div class="sc-stat"><div class="dot dm"></div><strong>'+s.malicious+'</strong>&nbsp;malicioso</div>'+
        '<div class="sc-stat"><div class="dot du"></div><strong>'+s.undetected+'</strong>&nbsp;limpo</div>'+
        '<div class="sc-stat"><div class="dot ds"></div><strong>'+s.unsupported+'</strong>&nbsp;s/suporte</div>'+
        failTag+
      '</div>'+
      '<button class="xbtn" data-n="'+scan.detections.length+'" onclick="toggleDets(this,\'d'+scanIndex+'\')">'+icon('expand_more','xbtn-chev')+'<span class="xbtn-label">Ver todas as detecções ('+scan.detections.length+')</span></button>'+
      '<div class="sc-dets" id="d'+scanIndex+'">'+rows+'</div>'+
    '</div>';
  }).join('');
}
