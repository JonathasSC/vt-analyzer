/* ── INTEGRAÇÃO VIRUSTOTAL (upload real via /api/vt/*) ── */
const VT_KEY_STORAGE = 'vt_dash_apikey';
let vtConfig = { hasDefaultKey: false };
let vtSelectedFiles = [];
let vtPassMode = 'shared';
let vtIndividualPasswords = [];
let vtJobs = [];

async function initVtUpload() {
  const savedKey = localStorage.getItem(VT_KEY_STORAGE);
  if (savedKey) document.getElementById('vt-apikey').value = savedKey;
  try {
    const res = await fetch('/api/config');
    vtConfig = await res.json();
  } catch {
    vtConfig = { hasDefaultKey: false };
  }
  updateVtKeyHint();
}

function updateVtKeyHint() {
  const hint = document.getElementById('vt-apikey-hint');
  const hasInput = document.getElementById('vt-apikey').value.trim().length > 0;
  hint.textContent = hasInput
    ? 'Chave salva neste navegador (localStorage).'
    : (vtConfig.hasDefaultKey
        ? 'Usando a chave padrão configurada no servidor (.env).'
        : 'Informe sua chave de API da VirusTotal. Free tier: até 4 requisições/min.');
}

function onVtApiKeyInput(val) {
  const v = val.trim();
  if (v) localStorage.setItem(VT_KEY_STORAGE, v);
  else localStorage.removeItem(VT_KEY_STORAGE);
  updateVtKeyHint();
}

function toggleVtKeyVisibility(btn) {
  const input = document.getElementById('vt-apikey');
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  btn.querySelector('.material-symbols-outlined').textContent = showing ? 'visibility' : 'visibility_off';
  btn.setAttribute('aria-label', showing ? 'Mostrar chave' : 'Ocultar chave');
}

function setVtSelectedFiles(fileList) {
  vtSelectedFiles = Array.from(fileList || []);
  vtIndividualPasswords = vtSelectedFiles.map(() => '');
  renderVtFileList();
}

function onVtFilesSelected(input) {
  setVtSelectedFiles(input.files);
}

function initVtDropzone() {
  const dz = document.getElementById('vt-dropzone');
  if (!dz) return;
  ['dragenter', 'dragover'].forEach(evt => dz.addEventListener(evt, e => {
    e.preventDefault();
    dz.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(evt => dz.addEventListener(evt, e => {
    e.preventDefault();
    dz.classList.remove('dragover');
  }));
  dz.addEventListener('drop', e => setVtSelectedFiles(e.dataTransfer.files));
  dz.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('vt-files').click();
    }
  });
}

function setVtPassMode(mode, btnEl) {
  vtPassMode = mode;
  document.querySelectorAll('.up-pass-opt').forEach(b => b.classList.toggle('active', b === btnEl));
  const shared = document.getElementById('vt-pass-shared-input');
  shared.style.display = mode === 'shared' ? '' : 'none';
  renderVtFileList();
}

function setVtIndividualPassword(i, val) {
  vtIndividualPasswords[i] = val;
}

function removeVtFile(i) {
  vtSelectedFiles.splice(i, 1);
  vtIndividualPasswords.splice(i, 1);
  renderVtFileList();
}

function renderVtFileList() {
  const el = document.getElementById('vt-file-list');
  if (!vtSelectedFiles.length) { el.innerHTML = ''; return; }
  el.innerHTML = vtSelectedFiles.map((f, i) => {
    const sizeTxt = (f.size / 1024 / 1024).toFixed(2) + ' MB';
    const passField = vtPassMode === 'individual'
      ? '<input type="password" class="up-input up-pass-ind" placeholder="Senha (opcional)" value="' + esc(vtIndividualPasswords[i] || '') + '" oninput="setVtIndividualPassword(' + i + ',this.value)">'
      : '';
    return '<div class="up-file-row">' +
      mi('description', 'up-file-icon') +
      '<div class="up-file-meta"><span class="up-file-name" title="' + esc(f.name) + '">' + esc(f.name) + '</span><span class="up-file-size">' + sizeTxt + '</span></div>' +
      passField +
      '<button type="button" class="up-file-remove" onclick="removeVtFile(' + i + ')" title="Remover arquivo">' + mi('close') + '</button>' +
    '</div>';
  }).join('');
}

async function submitVtUploads() {
  if (!vtSelectedFiles.length) { toast('Selecione ao menos um arquivo.', 'warn'); return; }
  const apiKeyInput = document.getElementById('vt-apikey').value.trim();
  if (!apiKeyInput && !vtConfig.hasDefaultKey) { toast('Informe a chave de API da VirusTotal.', 'err'); return; }
  const sharedPassword = document.getElementById('vt-pass-shared-input').value;

  const btn = document.getElementById('vt-submit-btn');
  btn.disabled = true;
  btn.classList.add('loading');

  vtJobs = vtSelectedFiles.map((f, i) => ({
    file: f,
    password: vtPassMode === 'shared' ? sharedPassword : (vtIndividualPasswords[i] || ''),
    status: 'aguardando',
    analysisId: null,
    error: null,
  }));
  renderVtJobs();

  for (const job of vtJobs) {
    await runVtJob(job, apiKeyInput);
  }

  btn.disabled = false;
  btn.classList.remove('loading');
  toast('Processamento concluído.', 'ok');
}

function vtErrorMessage(json, fallback) {
  if (!json) return fallback;
  if (json.error && json.error.message) return json.error.message;
  if (typeof json.error === 'string') return json.error;
  return fallback;
}

async function runVtJob(job, apiKey) {
  job.status = 'enviando…'; renderVtJobs();
  try {
    const fd = new FormData();
    fd.append('file', job.file, job.file.name);
    if (apiKey) fd.append('apiKey', apiKey);
    if (job.password) fd.append('password', job.password);

    const res = await fetch('/api/vt/scan', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(vtErrorMessage(json, 'Falha no envio.'));

    job.analysisId = json.analysisId;
    job.status = 'analisando…'; renderVtJobs();
    await pollVtAnalysis(job, apiKey);
  } catch (err) {
    job.status = 'erro'; job.error = err.message; renderVtJobs();
  }
}

function vtSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function pollVtAnalysis(job, apiKey) {
  const maxAttempts = 30;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await vtSleep(attempt === 0 ? 5000 : 15000);
    const qs = apiKey ? ('?apiKey=' + encodeURIComponent(apiKey)) : '';
    const res = await fetch('/api/vt/analysis/' + job.analysisId + qs);
    const json = await res.json();
    if (!res.ok) throw new Error(vtErrorMessage(json, 'Falha ao consultar análise.'));

    const status = json.data.attributes.status;
    if (status === 'completed') {
      const scan = vtResultToScan(json, job.file.name);
      scans.push(scan); save(); render();
      job.status = 'concluído'; renderVtJobs();
      return;
    }
    job.status = 'analisando (' + status + ')…'; renderVtJobs();
  }
  throw new Error('Tempo limite ao aguardar o resultado da análise.');
}

/* VT usa categorias mais granulares (harmless/suspicious/type-unsupported/confirmed-timeout);
   aqui elas são normalizadas para os buckets que o dashboard já sabe renderizar. */
function vtResultToScan(vtJson, fileName) {
  const attrs = vtJson.data.attributes;
  const fileInfo = (vtJson.meta && vtJson.meta.file_info) || {};
  const results = attrs.results || {};
  const detections = [];
  let malicious = 0, undetected = 0, unsupported = 0, failure = 0;

  for (const engine in results) {
    const r = results[engine];
    let bucket;
    if (r.category === 'malicious' || r.category === 'suspicious') { bucket = 'malicious'; malicious++; }
    else if (r.category === 'harmless' || r.category === 'undetected') { bucket = 'undetected'; undetected++; }
    else if (r.category === 'type-unsupported') { bucket = 'unsupported'; unsupported++; }
    else { bucket = (r.category === 'timeout' || r.category === 'confirmed-timeout') ? 'timeout' : 'failure'; failure++; }
    detections.push({ engine: r.engine_name || engine, result: bucket, detection: r.result || null });
  }

  return {
    summary: {
      hash: fileInfo.sha256 || '',
      hash_type: 'SHA-256',
      total: detections.length,
      malicious, undetected, unsupported, failure,
      fileName,
    },
    detections,
  };
}

function vtJobIcon(status) {
  if (status === 'concluído') return 'check_circle';
  if (status === 'erro') return 'error';
  if (status.startsWith('enviando')) return 'upload';
  if (status.startsWith('analisando')) return 'search';
  return 'hourglass_empty';
}

function renderVtJobs() {
  const el = document.getElementById('vt-jobs');
  if (!vtJobs.length) { el.innerHTML = ''; return; }
  el.innerHTML = vtJobs.map(j => {
    const cls = j.status === 'concluído' ? 'up-ok' : j.status === 'erro' ? 'up-err' : 'up-pending';
    return '<div class="up-job ' + cls + '">' +
      mi(vtJobIcon(j.status), 'up-job-icon') +
      '<span class="up-job-name" title="' + esc(j.file.name) + '">' + esc(j.file.name) + '</span>' +
      '<span class="up-job-status">' + esc(j.error || j.status) + '</span>' +
    '</div>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => { initVtUpload(); initVtDropzone(); });
