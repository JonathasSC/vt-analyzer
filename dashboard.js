/* ── ESTADO ── */
let scans = [];
let filterText = '';
let sortMode = 'default';
const SK = 'vt_dash_v3';

function cloneData(d) { return JSON.parse(JSON.stringify(d)); }

function init() {
  const raw = localStorage.getItem(SK);
  if (raw) { try { scans = JSON.parse(raw); } catch { scans = cloneData(INITIAL_DATA); } }
  else { scans = cloneData(INITIAL_DATA); save(); }
  render();
}

function save() { localStorage.setItem(SK, JSON.stringify(scans)); }

/* ── AÇÕES ── */
function removeScan(hash) {
  if (!confirm('Remover este scan?')) return;
  scans = scans.filter(s => s.summary.hash !== hash);
  save(); render(); toast('Scan removido.', 'warn');
}

function resetToDefault() {
  if (!confirm('Restaurar dados originais? Scans importados serão perdidos.')) return;
  scans = cloneData(INITIAL_DATA); save(); render(); toast('Dados restaurados.', 'ok');
}

/* ── FILTRO / ORDENAÇÃO ── */
function filterScans(val) {
  filterText = val.trim().toLowerCase();
  renderScans();
}

function changeSortMode(val) {
  sortMode = val;
  renderScans();
}

function getDisplayScans() {
  let result = [...scans];
  if (filterText) result = result.filter(s => s.summary.hash.toLowerCase().includes(filterText));
  if (sortMode === 'rate-desc') result.sort((a,b) => b.summary.malicious/b.summary.total - a.summary.malicious/a.summary.total);
  else if (sortMode === 'rate-asc') result.sort((a,b) => a.summary.malicious/a.summary.total - b.summary.malicious/b.summary.total);
  return result;
}

/* ── CÁLCULOS ── */
function engineStats() {
  const m = {};
  for (const scan of scans) {
    for (const d of scan.detections) {
      if (!m[d.engine]) m[d.engine] = { mal:0, und:0, uns:0, fail:0, tmo:0 };
      if (d.result==='malicious')   m[d.engine].mal++;
      else if (d.result==='undetected') m[d.engine].und++;
      else if (d.result==='unsupported') m[d.engine].uns++;
      else if (d.result==='failure') m[d.engine].fail++;
      else if (d.result==='timeout') m[d.engine].tmo++;
    }
  }
  return Object.entries(m).map(([name,s]) => {
    const part = s.mal + s.und + s.fail + s.tmo;
    return { name, ...s, part, rate: part>0 ? s.mal/part*100 : 0 };
  });
}

function detNames() {
  const m = {};
  for (const sc of scans)
    for (const d of sc.detections)
      if (d.detection) m[d.detection] = (m[d.detection]||0) + 1;
  return Object.entries(m).sort((a,b) => b[1]-a[1]);
}

/* ── RENDER PRINCIPAL ── */
function render() {
  document.getElementById('badge').textContent = scans.length + ' scan' + (scans.length!==1?'s':'');
  renderOverview(); renderScans(); renderRankings(); renderLeastDetected(); renderNames();
}

/* ── OVERVIEW ── */
function renderOverview() {
  const g = document.getElementById('ov');
  if (!scans.length) { g.innerHTML=''; return; }
  const tMal  = scans.reduce((s,sc)=>s+sc.summary.malicious,0);
  const tUnd  = scans.reduce((s,sc)=>s+sc.summary.undetected,0);
  const tUns  = scans.reduce((s,sc)=>s+sc.summary.unsupported,0);
  const tFail = scans.reduce((s,sc)=>s+(sc.summary.failure||0),0);
  const tAll  = scans.reduce((s,sc)=>s+sc.summary.total,0);
  const avg   = (scans.reduce((s,sc)=>s+sc.summary.malicious/sc.summary.total*100,0)/scans.length).toFixed(1);
  const es    = engineStats();
  const top   = es.filter(e=>e.mal>0).sort((a,b)=>b.mal-a.mal)[0];
  const cons  = es.filter(e=>e.part>0&&e.rate===100).length;

  g.innerHTML =
    oc('c-acc','Scans Carregados',scans.length,tAll+' análises totais') +
    oc('c-mal','Total Detecções',tMal,'média '+avg+'% por scan') +
    oc('c-und','Não Detectado',tUnd,(tUnd/tAll*100).toFixed(1)+'% do total') +
    oc('c-uns','Sem Suporte / Falha',tUns,(tFail?'+ '+tFail+' falha(s)':'0 falhas')) +
    oc('c-acc','Engines 100% Precisas',cons,'detectaram em todos os scans') +
    (top ? '<div class="ov-card c-top"><div class="lbl">Melhor Detector</div><div class="val">'+esc(top.name)+'</div><div class="sub-txt">'+top.mal+'/'+scans.length+' scans detectados</div></div>' : '');
}

function oc(cls,lbl,val,sub) {
  return '<div class="ov-card '+cls+'"><div class="lbl">'+lbl+'</div><div class="val">'+val+'</div><div class="sub-txt">'+sub+'</div></div>';
}

/* ── SCAN CARDS ── */
function renderScans() {
  const g = document.getElementById('scg');
  const display = getDisplayScans();
  document.getElementById('sc-cnt').textContent = scans.length;
  if (!scans.length) { g.innerHTML='<div class="empty">Nenhum scan. Importe arquivos JSON.</div>'; return; }
  if (!display.length) { g.innerHTML='<div class="empty">Nenhum resultado para o filtro aplicado.</div>'; return; }

  g.innerHTML = display.map((scan,i) => {
    const s = scan.summary, T = s.total;
    const mP = (s.malicious/T*100).toFixed(1);
    const uP = (s.undetected/T*100).toFixed(1);
    const sP = (s.unsupported/T*100).toFixed(1);
    const fP = ((s.failure||0)/T*100).toFixed(1);
    const sev = parseFloat(mP)>=60?'high':parseFloat(mP)>=25?'med':'low';
    const rows = scan.detections.map(d => {
      const rc = d.result==='malicious'?'rm':d.result==='undetected'?'ru':d.result==='unsupported'?'rs':'rf';
      const n = d.detection||'—';
      return '<div class="dr"><span class="de">'+esc(d.engine)+'</span><span class="dx '+rc+'">'+d.result+'</span><span class="dn" title="'+esc(n)+'">'+esc(n)+'</span></div>';
    }).join('');
    const failTag = s.failure ? '<div class="sc-stat"><div class="dot df"></div><strong>'+s.failure+'</strong>&nbsp;falha</div>' : '';
    const idx = scans.indexOf(scan);
    return '<div class="sc-card" data-sev="'+sev+'">'+
      '<div class="sc-head">'+
        '<div><div class="sc-hash">'+s.hash.slice(0,16)+'…</div><div class="sc-hash-full">'+s.hash+'</div></div>'+
        '<button class="sc-rm" onclick="removeScan(\''+s.hash+'\')" title="Remover scan">×</button>'+
      '</div>'+
      '<div class="sc-nums">'+
        '<div><div class="sc-dc">'+s.malicious+'/'+T+'</div><div class="sc-dl">detectados</div></div>'+
        '<div><div class="sc-rv">'+mP+'%</div><div class="sc-rl">taxa</div></div>'+
      '</div>'+
      '<div class="det-bar">'+
        '<div class="b-m" style="width:'+mP+'%"></div>'+
        '<div class="b-u" style="width:'+uP+'%"></div>'+
        '<div class="b-s" style="width:'+sP+'%"></div>'+
        (s.failure?'<div class="b-f" style="width:'+fP+'%"></div>':'')+
      '</div>'+
      '<div class="sc-stats">'+
        '<div class="sc-stat"><div class="dot dm"></div><strong>'+s.malicious+'</strong>&nbsp;malicioso</div>'+
        '<div class="sc-stat"><div class="dot du"></div><strong>'+s.undetected+'</strong>&nbsp;limpo</div>'+
        '<div class="sc-stat"><div class="dot ds"></div><strong>'+s.unsupported+'</strong>&nbsp;s/suporte</div>'+
        failTag+
      '</div>'+
      '<button class="xbtn" data-n="'+scan.detections.length+'" onclick="toggleDets(this,\'d'+idx+'\')">▼ Ver todas as detecções ('+scan.detections.length+')</button>'+
      '<div class="sc-dets" id="d'+idx+'">'+rows+'</div>'+
    '</div>';
  }).join('');
}

function toggleDets(btn, id) {
  const open = document.getElementById(id).classList.toggle('open');
  btn.textContent = open ? '▲ Ocultar detecções' : '▼ Ver todas as detecções ('+btn.dataset.n+')';
}

/* ── RANKINGS ── */
function renderRankings() {
  const ids = ['tp-det','tp-miss','tp-inc','tp-nev','tp-all'];
  if (!scans.length) { ids.forEach(id=>document.getElementById(id).innerHTML='<div class="empty">Sem dados.</div>'); return; }

  const es = engineStats(), n = scans.length;
  const sorted = (arr,fn) => [...arr].sort(fn);

  const topDet = sorted(es.filter(e=>e.mal>0),(a,b)=>b.mal-a.mal||b.rate-a.rate).slice(0,30);
  const topMiss= sorted(es.filter(e=>e.und>0&&e.part>0),(a,b)=>b.und-a.und).slice(0,30);
  const inc    = sorted(es.filter(e=>e.mal>0&&e.und>0),(a,b)=>Math.abs(a.rate-50)-Math.abs(b.rate-50));
  const never  = sorted(es.filter(e=>e.mal===0&&e.und>0&&e.fail===0&&e.tmo===0),(a,b)=>b.und-a.und);
  const all    = sorted(es,(a,b)=>b.mal-a.mal||a.name.localeCompare(b.name));

  document.getElementById('tp-det').innerHTML  = tbl(topDet, n);
  document.getElementById('tp-miss').innerHTML = tbl(topMiss, n);
  document.getElementById('tp-inc').innerHTML  = inc.length ? tbl(inc, n) : '<div class="empty">Nenhuma engine inconsistente entre os scans.</div>';
  document.getElementById('tp-nev').innerHTML  = never.length ? tbl(never, n) : '<div class="empty">Todas as engines detectaram ao menos um scan.</div>';
  document.getElementById('tp-all').innerHTML  = tbl(all, n);
}

function tbl(rows, n) {
  if (!rows.length) return '<div class="empty">Sem dados.</div>';
  const head = '<thead><tr><th>#</th><th style="text-align:left">Engine</th><th>🔴 Malicioso</th><th>🟢 Limpo</th><th>⚫ S/Suporte</th><th>🟡 Falha</th><th>⏱ Timeout</th><th>Taxa Detecção</th></tr></thead>';
  const body = rows.map((e,i) => {
    const rCls = i===0?'rk rk1':i===1?'rk rk2':i===2?'rk rk3':'rk';
    const rPct = e.rate.toFixed(0);
    const rCol = e.rate>=80?'var(--mal)':e.rate>=40?'var(--fail)':'var(--und)';
    const mW = Math.round(e.mal/n*100), uW = Math.round(e.und/n*100);
    const mCol   = e.mal>0  ? 'var(--mal)'  : 'var(--mut)';
    const uCol   = e.und>0  ? 'var(--und)'  : 'var(--mut)';
    const unsCol = e.uns>0  ? 'var(--uns)'  : 'var(--mut)';
    const failCol= e.fail>0 ? 'var(--fail)' : 'var(--mut)';
    const tmoCol = e.tmo>0  ? 'var(--tmo)'  : 'var(--mut)';
    return '<tr>'+
      '<td><span class="'+rCls+'">'+(i+1)+'</span></td>'+
      '<td style="font-weight:600;text-align:left">'+esc(e.name)+'</td>'+
      '<td><div class="mb"><div class="mbt"><div class="mbf" style="width:'+mW+'%;background:var(--mal)"></div></div><span style="color:'+mCol+';font-weight:600;min-width:14px">'+e.mal+'</span></div></td>'+
      '<td><div class="mb"><div class="mbt"><div class="mbf" style="width:'+uW+'%;background:var(--und)"></div></div><span style="color:'+uCol+';min-width:14px">'+e.und+'</span></div></td>'+
      '<td style="color:'+unsCol+'">'+e.uns+'</td>'+
      '<td style="color:'+failCol+'">'+e.fail+'</td>'+
      '<td style="color:'+tmoCol+'">'+e.tmo+'</td>'+
      '<td>'+(e.part>0?
        '<div class="mb"><div class="mbt" style="width:70px"><div class="mbf" style="width:'+rPct+'%;background:'+rCol+'"></div></div><span style="color:'+rCol+';font-weight:600;min-width:32px">'+rPct+'%</span></div>':
        '<span style="color:var(--mut)">N/A</span>')+
      '</td>'+
    '</tr>';
  }).join('');
  return '<table class="rt">'+head+'<tbody>'+body+'</tbody></table>';
}

/* ── MALWARE MENOS IDENTIFICADO ── */
function renderLeastDetected() {
  const el = document.getElementById('lm-table');
  const cnt = document.getElementById('lm-cnt');
  if (!scans.length) { el.innerHTML = '<div class="empty">Sem dados.</div>'; return; }
  cnt.textContent = scans.length;

  const sorted = [...scans].sort((a, b) => {
    const rA = a.summary.malicious / a.summary.total;
    const rB = b.summary.malicious / b.summary.total;
    return rA - rB || a.summary.malicious - b.summary.malicious;
  });

  const rows = sorted.map((scan, i) => {
    const s = scan.summary;
    const detRate = (s.malicious / s.total * 100).toFixed(1);
    const undRate = (s.undetected / s.total * 100).toFixed(1);
    const rCol = parseFloat(detRate)>=60 ? 'var(--mal)' : parseFloat(detRate)>=25 ? 'var(--fail)' : 'var(--und)';
    const rCls = i===0?'rk rk1':i===1?'rk rk2':i===2?'rk rk3':'rk';
    const barW = Math.round(s.malicious / s.total * 100);
    const extras = (s.failure||0) + (s.timeout||0);
    const extraBadge = extras > 0 ? ' <span style="color:var(--fail);font-size:10px">(+'+extras+' f/tmo)</span>' : '';
    const detEngines = scan.detections.filter(d=>d.result==='malicious').map(d=>esc(d.engine)).join(', ');
    return '<tr>'+
      '<td><span class="'+rCls+'">'+(i+1)+'</span></td>'+
      '<td style="text-align:left">'+
        '<div class="sc-hash" style="font-size:11px">'+esc(s.hash.slice(0,8))+'…</div>'+
        '<div style="font-size:10px;color:var(--mut);font-family:\'JetBrains Mono\',monospace">'+esc(s.hash.slice(0,20))+'…</div>'+
      '</td>'+
      '<td><div class="mb"><div class="mbt" style="width:72px"><div class="mbf" style="width:'+barW+'%;background:'+rCol+'"></div></div>'+
        '<span style="color:'+rCol+';font-weight:700;min-width:38px">'+s.malicious+'/'+s.total+'</span></div></td>'+
      '<td style="color:'+rCol+';font-weight:700">'+detRate+'%</td>'+
      '<td>'+
        '<span style="color:var(--und);font-weight:600">'+s.undetected+'</span>'+
        '<span style="color:var(--mut);font-size:10px"> ('+undRate+'%)</span>'+extraBadge+
      '</td>'+
      '<td style="font-size:10px;color:var(--mut);text-align:left;word-break:break-word;max-width:300px">'+
        (detEngines || '<em style="color:var(--und)">nenhum</em>')+
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

/* ── NOMES DE DETECÇÃO ── */
function renderNames() {
  const names = detNames();
  document.getElementById('nc').textContent = names.length;
  if (!names.length) { document.getElementById('nl').innerHTML='<div class="empty">Sem dados.</div>'; return; }
  const max = names[0][1];
  const rows = names.slice(0,30).map(([name,cnt],i) => {
    const rCls = i===0?'nrk nrk1':i===1?'nrk nrk2':i===2?'nrk nrk3':'nrk';
    const w = Math.round(cnt/max*100);
    return '<div class="nr">'+
      '<span class="'+rCls+'">'+(i+1)+'</span>'+
      '<div class="nb"><div class="nt" title="'+esc(name)+'">'+esc(name)+'</div><div class="nbt"><div class="nbf" style="width:'+w+'%"></div></div></div>'+
      '<span class="nc"><strong>'+cnt+'</strong>×</span>'+
    '</div>';
  }).join('');
  document.getElementById('nl').innerHTML = '<div class="nl">'+rows+'</div>';
}

/* ── TABS ── */
function switchTab(btn, panelId) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tp').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}

/* ── HELPERS ── */
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function toast(msg, type) {
  const el = document.getElementById('toast');
  const icons = { ok:'✓', err:'✕', warn:'⚠' };
  el.innerHTML = '<span class="t-icon">'+(icons[type]||'●')+'</span><span>'+esc(msg)+'</span>';
  el.className = 'show '+(type||'');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>el.className='', 3200);
}

/* ── INIT ── */
init();
